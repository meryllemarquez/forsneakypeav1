import { useEffect, useRef, useState } from 'react';
import Modal from '../../ui/Modal/Modal';
import Button from '../../ui/Button/Button';
import Icon from '../../Icon';
import { useNotification } from '../../../hooks/useNotification';
import { withRetry } from '../../../utils/uploadQueue';
import { ZipBuilder, slugify } from '../../../utils/zipWriter';
import styles from './AlbumDownloadModal.module.css';

// Phones can run out of memory above ~500 MB of Blobs, and every byte flows Drive -> our API -> browser,
// so a big album is split into several zip files.
const MAX_FILES_PER_ZIP = 120;
const MAX_BYTES_PER_ZIP = 350 * 1024 * 1024;
const PARALLEL = 3;

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heic',
};

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

const formatMb = (bytes) => `${(bytes / 1048576).toFixed(bytes >= 10485760 ? 0 : 1)} MB`;

/**
 * Builds a .zip of every photo in an album in the browser (original files, no recompression),
 * with progress. `loadFolder` returns the album again with fresh signed links when one expires.
 */
export default function AlbumDownloadModal({ open, onClose, folder, loadFolder }) {
  const { addToast } = useNotification();
  const [phase, setPhase] = useState('preparing'); // preparing | packing | done | error
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(0);
  const [bytes, setBytes] = useState(0);
  const [part, setPart] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const folderRef = useRef(folder);
  const loadRef = useRef(loadFolder);
  const closeRef = useRef(onClose);
  folderRef.current = folder;
  loadRef.current = loadFolder;
  closeRef.current = onClose;

  const photoCount = folder?.photos?.length || 0;

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    let closeTimer;

    const run = async () => {
      const album = folderRef.current;
      const photos = (album?.photos || []).filter((p) => p.downloadUrl || p.photoUrl);
      const urls = new Map(photos.map((p) => [p.id, p.downloadUrl || p.photoUrl]));
      const slug = slugify(album?.name) || 'album';
      let refreshing = null;

      // A signed link lasts 1-2 hours; if one is refused, fetch the album again for fresh links (once at a time).
      const refreshUrls = () => {
        if (!refreshing) {
          refreshing = loadRef.current?.()
            .then((fresh) => (fresh?.photos || []).forEach((p) => urls.set(p.id, p.downloadUrl || p.photoUrl)))
            .finally(() => { refreshing = null; });
        }
        return refreshing;
      };

      const fetchBlob = async (photo) => {
        const get = () => fetch(urls.get(photo.id), { signal: controller.signal });
        let res = await withRetry(get);
        if (res.status === 403 && loadRef.current) {
          await refreshUrls();
          res = await get();
        }
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        return res.blob();
      };

      setPhase('preparing');
      setDone(0);
      setFailed(0);
      setBytes(0);
      setPart(1);
      if (!photos.length) {
        setPhase('done');
        return;
      }

      let zip = new ZipBuilder();
      let partNumber = 1;
      let savedParts = 0;
      let totalBytes = 0;
      let doneCount = 0;
      let failedCount = 0;
      const savePart = (final) => {
        if (!zip.count) return;
        const single = final && savedParts === 0;
        saveBlob(zip.finish(), single ? `${slug}-photos.zip` : `${slug}-photos-part-${partNumber}.zip`);
        savedParts += 1;
      };

      try {
        setPhase('packing');
        for (let i = 0; i < photos.length; i += PARALLEL) {
          const wave = photos.slice(i, i + PARALLEL);
          const blobs = await Promise.all(wave.map((p) => fetchBlob(p).catch((err) => {
            if (controller.signal.aborted) throw err;
            return null;
          })));
          for (let k = 0; k < wave.length; k += 1) {
            const photo = wave[k];
            const blob = blobs[k];
            if (blob) {
              const ext = EXT_BY_TYPE[blob.type] || 'jpg';
              const n = String(i + k + 1).padStart(3, '0');
              await zip.add(`${slug}/${n}-${slugify(photo.caption) || 'photo'}.${ext}`, blob);
              totalBytes += blob.size;
            } else {
              failedCount += 1;
            }
            doneCount += 1;
          }
          setDone(doneCount);
          setFailed(failedCount);
          setBytes(totalBytes);
          const more = i + PARALLEL < photos.length;
          if (more && (zip.count >= MAX_FILES_PER_ZIP || zip.size >= MAX_BYTES_PER_ZIP)) {
            savePart(false);
            zip = new ZipBuilder();
            partNumber += 1;
            setPart(partNumber);
          }
        }
        savePart(true);
        if (!savedParts) throw new Error('Nothing could be packed');
        setPhase('done');
        addToast('Your album is saved', 'success');
        if (!failedCount) closeTimer = setTimeout(() => closeRef.current?.(), 1200);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Album download failed', err);
        setPhase('error');
      }
    };

    run();
    return () => {
      controller.abort();
      clearTimeout(closeTimer);
    };
  }, [open, attempt, addToast]);

  const running = phase === 'preparing' || phase === 'packing';
  const percent = photoCount ? Math.round((done / photoCount) * 100) : 0;
  const multipart = photoCount > MAX_FILES_PER_ZIP;

  return (
    <Modal open={open} onClose={onClose} title="Packing your album" size="sm">
      <div className={styles.body}>
        <Icon name="camera" size={56} className={running ? styles.bounce : undefined} />

        <progress className={styles.bar} value={done} max={Math.max(photoCount, 1)} aria-label="Packing album" />

        <p className={styles.count} aria-live="polite">
          {phase === 'preparing' && 'Getting your photos ready…'}
          {phase === 'packing' && `Packing ${Math.min(done + 1, photoCount)} of ${photoCount} photos${multipart ? ` · part ${part}` : ''}`}
          {phase === 'done' && (failed ? `Saved ${photoCount - failed} of ${photoCount} photos.` : 'All packed. Your download is on its way.')}
          {phase === 'error' && "Couldn't pack everything. Try again?"}
        </p>
        <p className={styles.meta}>{percent}% · {formatMb(bytes)}</p>

        {phase === 'done' && failed > 0 && (
          <p className={styles.warn} role="alert">{failed} {failed === 1 ? 'photo' : 'photos'} couldn't be added to the zip.</p>
        )}

        <div className={styles.actions}>
          {running && <Button onClick={onClose}>Cancel</Button>}
          {phase === 'error' && (
            <>
              <Button onClick={onClose}>Close</Button>
              <Button variant="primary" onClick={() => setAttempt((a) => a + 1)}>Try again</Button>
            </>
          )}
          {phase === 'done' && <Button variant="primary" onClick={onClose}>Done</Button>}
        </div>
      </div>
    </Modal>
  );
}
