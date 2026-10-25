import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, RotateCcw, X } from 'lucide-react';
import Modal from '../../ui/Modal/Modal';
import Button from '../../ui/Button/Button';
import IconButton from '../../ui/IconButton/IconButton';
import ConfirmDialog from '../../ui/ConfirmDialog/ConfirmDialog';
import Field from '../../ui/Field/Field';
import Icon from '../../Icon';
import { uploadImageToDrive, validateImageFile } from '../../../api/driveUpload';
import { useMemoryMutations } from '../../../queries/mutations';
import { useNotification } from '../../../hooks/useNotification';
import { runPool, withRetry, isCanceled, isTransient } from '../../../utils/uploadQueue';
import form from '../../ui/FormControls.module.css';
import styles from './PhotoUploadModal.module.css';

const MAX_BATCH = 20;
const PARALLEL = 3;
const SAVE_EVERY = 5;
const ACTIVE = ['queued', 'uploading', 'saving'];

const formatSize = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
let rowCounter = 0;

function failureText(err) {
  if (isTransient(err)) return 'Connection dropped · tap retry';
  const status = err?.response?.status;
  if (status === 400 || status === 403) return err?.response?.data?.message || "Couldn't upload this one";
  return "Couldn't upload · tap retry";
}

/**
 * Add many photos to an album at once. Each file goes browser -> Google Drive (3 at a time),
 * then its Drive id is saved in batches of up to 20 so the partner gets one notification.
 */
export default function PhotoUploadModal({ open, onClose, folderId, onDone }) {
  const reduce = useReducedMotion();
  const { addPhotosBatch } = useMemoryMutations();
  const { addToast } = useNotification();

  const [rows, setRows] = useState([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [skipNote, setSkipNote] = useState('');
  const [confirmStop, setConfirmStop] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const rowsRef = useRef([]);
  const controllers = useRef(new Map());
  const pending = useRef([]);
  const flushChain = useRef(Promise.resolve());
  const textRef = useRef({ caption: '', location: '' });
  const anyAdded = useRef(false);
  textRef.current = { caption, location };

  const commit = (next) => {
    rowsRef.current = next;
    setRows(next);
  };
  const getRow = (id) => rowsRef.current.find((r) => r.id === id);
  const patch = useCallback((id, changes) => {
    commit(rowsRef.current.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }, []);

  const busy = rows.some((r) => ACTIVE.includes(r.status));
  const total = rows.length;
  const doneCount = rows.filter((r) => r.status === 'done').length;
  const toUpload = rows.filter((r) => r.status === 'ready' || r.status === 'failed');
  const failedCount = rows.filter((r) => r.status === 'failed').length;
  const allDone = total > 0 && doneCount === total;

  // Reset everything (and free the preview URLs) whenever the sheet closes.
  useEffect(() => {
    if (open) return undefined;
    rowsRef.current.forEach((r) => r.previewUrl && URL.revokeObjectURL(r.previewUrl));
    controllers.current.forEach((c) => c.abort());
    controllers.current.clear();
    pending.current = [];
    anyAdded.current = false;
    commit([]);
    setCaption('');
    setLocation('');
    setSkipNote('');
    setConfirmStop(false);
    return undefined;
  }, [open]);

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    let skipped = 0;
    const fresh = [];
    for (const file of files) {
      if (validateImageFile(file) || rowsRef.current.length + fresh.length >= MAX_BATCH) {
        skipped += 1;
        continue;
      }
      rowCounter += 1;
      fresh.push({
        id: `row-${rowCounter}`,
        file,
        name: file.name,
        size: file.size,
        status: 'ready',
        progress: 0,
        error: '',
        driveFileId: '',
        previewUrl: URL.createObjectURL(file),
      });
    }
    setSkipNote(skipped ? `${skipped} ${skipped === 1 ? 'photo was' : 'photos were'} skipped: too big, not an image, or more than ${MAX_BATCH} at a time.` : '');
    if (fresh.length) commit([...rowsRef.current, ...fresh]);
  };

  const removeRow = (id) => {
    const row = getRow(id);
    if (row?.previewUrl) URL.revokeObjectURL(row.previewUrl);
    commit(rowsRef.current.filter((r) => r.id !== id));
  };

  // Saves the ready Drive ids (up to 20 per request). Requests run one after another.
  const flush = () => {
    flushChain.current = flushChain.current.then(async () => {
      const ids = pending.current.splice(0, MAX_BATCH);
      if (!ids.length || !folderId) return;
      const { caption: cap, location: loc } = textRef.current;
      const items = ids.map((id) => ({ driveFileId: getRow(id)?.driveFileId, caption: cap || null, location: loc || null }));
      try {
        const res = await addPhotosBatch(folderId, items);
        const failed = new Map((res?.failed || []).map((f) => [f.driveFileId, f.reason]));
        ids.forEach((id) => {
          const driveFileId = getRow(id)?.driveFileId;
          const reason = failed.get(driveFileId);
          // "already added" means an earlier attempt did save it: that is a success.
          if (reason && !/already added/i.test(reason)) {
            patch(id, { status: 'failed', error: reason, driveFileId: '', progress: 0 });
          } else {
            patch(id, { status: 'done' });
            anyAdded.current = true;
          }
        });
      } catch (err) {
        const message = err?.response?.status === 404 ? 'This album is gone.' : "Couldn't save · tap retry";
        ids.forEach((id) => patch(id, { status: 'failed', error: message }));
      }
    });
    return flushChain.current;
  };

  const uploadOne = async (id) => {
    const row = getRow(id);
    if (!row || row.status !== 'queued') return;
    if (!row.driveFileId) {
      const controller = new AbortController();
      controllers.current.set(id, controller);
      patch(id, { status: 'uploading', progress: 0, error: '' });
      let lastShown = 0;
      try {
        const driveFileId = await withRetry(() => uploadImageToDrive(row.file, 'memories', (p) => {
          if (p - lastShown >= 0.02 || p === 1) {
            lastShown = p;
            patch(id, { progress: p });
          }
        }, controller.signal));
        patch(id, { driveFileId, progress: 1, status: 'saving' });
      } catch (err) {
        patch(id, isCanceled(err) ? { status: 'cancelled', error: '' } : { status: 'failed', error: failureText(err) });
        return;
      } finally {
        controllers.current.delete(id);
      }
    } else {
      patch(id, { status: 'saving', error: '' });
    }
    pending.current.push(id);
    if (pending.current.length >= SAVE_EVERY) flush();
  };

  const run = async (ids) => {
    if (!ids.length) return;
    ids.forEach((id) => patch(id, { status: 'queued', error: '' }));
    await runPool(ids, uploadOne, PARALLEL);
    await flush();
    const settled = ids.map(getRow).filter(Boolean);
    const added = settled.filter((r) => r.status === 'done').length;
    const failed = settled.filter((r) => r.status === 'failed').length;
    if (added) {
      addToast(`Added ${added} ${added === 1 ? 'photo' : 'photos'}, love.`, 'success');
      onDone?.();
    }
    if (failed) addToast(`${failed} ${failed === 1 ? 'photo' : 'photos'} didn't make it. You can retry them.`, 'error');
  };

  const startAll = () => run(toUpload.map((r) => r.id));
  const retryOne = (id) => run([id]);

  const cancelRow = (id) => {
    const controller = controllers.current.get(id);
    if (controller) controller.abort();
    else if (getRow(id)?.status === 'queued') patch(id, { status: 'cancelled' });
  };
  const cancelAll = () => {
    controllers.current.forEach((c) => c.abort());
    commit(rowsRef.current.map((r) => (r.status === 'queued' ? { ...r, status: 'cancelled' } : r)));
  };

  const requestClose = () => {
    if (busy) setConfirmStop(true);
    else onClose();
  };
  const stopAndClose = () => {
    cancelAll();
    setConfirmStop(false);
    onClose();
  };

  const statusText = (r) => {
    switch (r.status) {
      case 'ready': return 'Ready';
      case 'queued': return 'Waiting…';
      case 'uploading': return `Uploading ${Math.round(r.progress * 100)}%`;
      case 'saving': return 'Saving…';
      case 'done': return 'Added';
      case 'cancelled': return 'Cancelled';
      default: return r.error || "Couldn't upload · tap retry";
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer?.files);
  };

  let primary;
  if (busy) {
    primary = <Button onClick={cancelAll}>Cancel all</Button>;
  } else if (allDone) {
    primary = <Button variant="primary" onClick={onClose}>Done</Button>;
  } else if (toUpload.length) {
    const label = failedCount && failedCount === toUpload.length
      ? `Retry failed (${failedCount})`
      : `Upload ${toUpload.length} ${toUpload.length === 1 ? 'photo' : 'photos'}`;
    primary = <Button variant="primary" onClick={startAll}>{label}</Button>;
  } else {
    primary = <Button variant="primary" disabled>Upload photos</Button>;
  }

  return (
    <>
      <Modal open={open} onClose={requestClose} title="Add photos" size="lg">
        <div className={form.form}>
          <label
            className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <Icon name="camera" size={56} />
            <span className={styles.dropTitle}>Drop photos here or tap to choose</span>
            <span className={styles.dropHint}>Images only · up to 15 MB each · {MAX_BATCH} at a time</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className={styles.fileInput}
              aria-label="Choose photos"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
            />
          </label>

          {skipNote && <p className={styles.skipNote} role="alert">{skipNote}</p>}

          {total > 0 && (
            <ul className={styles.list} aria-label="Photos to add">
              {rows.map((r, i) => (
                <motion.li
                  key={r.id}
                  className={`${styles.row} ${styles[r.status] || ''}`}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: reduce ? 0 : Math.min(i * 0.04, 0.6) }}
                >
                  <span className={styles.thumb}>
                    <Icon name="camera" size={28} className={styles.thumbIcon} />
                    <img
                      src={r.previewUrl}
                      alt=""
                      className={styles.thumbImg}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </span>

                  <span className={styles.info}>
                    <span className={styles.name}>{r.name}</span>
                    <span className={styles.meta}>{formatSize(r.size)} · <span className={r.status === 'failed' ? styles.errorText : undefined}>{statusText(r)}</span></span>
                    {(r.status === 'uploading' || r.status === 'saving' || r.status === 'done') && (
                      <progress
                        className={styles.bar}
                        value={r.status === 'uploading' ? r.progress : 1}
                        max={1}
                        aria-label={`Uploading ${r.name}`}
                      />
                    )}
                  </span>

                  {r.status === 'ready' && (
                    <IconButton label={`Remove ${r.name}`} size="sm" onClick={() => removeRow(r.id)}>
                      <X size={18} strokeWidth={2.8} aria-hidden="true" />
                    </IconButton>
                  )}
                  {(r.status === 'queued' || r.status === 'uploading') && (
                    <IconButton label={`Cancel upload of ${r.name}`} size="sm" onClick={() => cancelRow(r.id)}>
                      <X size={18} strokeWidth={2.8} aria-hidden="true" />
                    </IconButton>
                  )}
                  {(r.status === 'failed' || r.status === 'cancelled') && (
                    <>
                      <IconButton label={`Retry ${r.name}`} size="sm" onClick={() => retryOne(r.id)}>
                        <RotateCcw size={18} strokeWidth={2.8} aria-hidden="true" />
                      </IconButton>
                      <IconButton label={`Remove ${r.name}`} size="sm" onClick={() => removeRow(r.id)}>
                        <X size={18} strokeWidth={2.8} aria-hidden="true" />
                      </IconButton>
                    </>
                  )}
                  {r.status === 'done' && (
                    <span className={`${styles.check} ${reduce ? '' : styles.pop}`}>
                      <Check size={18} strokeWidth={3} aria-label="Added" />
                    </span>
                  )}
                </motion.li>
              ))}
            </ul>
          )}

          <Field label="Caption (optional)" hint="Applies to all of them. Leave blank to add captions later." htmlFor="batch-caption">
            <input
              id="batch-caption"
              className={form.input}
              type="text"
              placeholder="A sweet phrase or note..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={busy}
            />
          </Field>
          <Field label="Where? (optional)" htmlFor="batch-location">
            <input
              id="batch-location"
              className={form.input}
              type="text"
              placeholder="e.g. Quezon City"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={busy}
            />
          </Field>

          <div className={`${form.footer} ${styles.footer}`}>
            <span className={styles.count} aria-live="polite">
              {total ? `${doneCount} of ${total} added` : ''}
            </span>
            {primary}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmStop}
        icon="camera"
        title="Stop uploading?"
        message="Photos already added will stay."
        confirmLabel="Stop"
        cancelLabel="Keep going"
        onConfirm={stopAndClose}
        onClose={() => setConfirmStop(false)}
      />
    </>
  );
}
