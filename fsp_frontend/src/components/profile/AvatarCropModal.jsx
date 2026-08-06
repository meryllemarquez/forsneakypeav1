import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, scaleIn } from '../../constants/animations';
import styles from './AvatarCropModal.module.css';

// Fixed output resolution — also used as the live canvas's internal pixel
// buffer, so the exact pixels the user sees while dragging/zooming are the
// exact pixels exported. No separate coordinate math for preview vs. export.
const CANVAS_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const TARGET_MAX_BYTES = 1.5 * 1024 * 1024;

function clampOffset(offset, scale, image) {
  // Keeps the image covering the full square canvas at the current scale —
  // panning can never reveal empty space around the crop.
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const maxX = Math.max(0, (drawWidth - CANVAS_SIZE) / 2);
  const maxY = Math.max(0, (drawHeight - CANVAS_SIZE) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

async function exportCompressedBlob(canvas) {
  let quality = 0.92;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob) throw new Error('Could not process this image.');
    if (blob.size <= TARGET_MAX_BYTES || quality <= 0.5) return blob;
    quality -= 0.12;
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not process this image.'))), 'image/webp', 0.5);
  });
}

export default function AvatarCropModal({ file, onCancel, onConfirm }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const dragState = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [imageReady, setImageReady] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      // "Cover" fit: smallest dimension exactly fills the square viewport.
      const scale = CANVAS_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
      setBaseScale(scale);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setImageReady(true);
    };
    img.onerror = () => setError('This image could not be loaded. Please try a different file.');
    img.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    const scale = baseScale * zoom;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const dx = (CANVAS_SIZE - drawWidth) / 2 + offset.x;
    const dy = (CANVAS_SIZE - drawHeight) / 2 + offset.y;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
  }, [baseScale, zoom, offset]);

  useEffect(() => {
    if (imageReady) draw();
  }, [imageReady, draw]);

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, startOffset: offset };
  };

  const handlePointerMove = (e) => {
    if (!dragState.current || !imageRef.current) return;
    const dxPointer = e.clientX - dragState.current.startX;
    const dyPointer = e.clientY - dragState.current.startY;
    // Canvas is drawn at CANVAS_SIZE px but may be displayed smaller on mobile;
    // scale pointer deltas back into canvas pixel space.
    const displayScale = CANVAS_SIZE / e.currentTarget.clientWidth;
    const next = {
      x: dragState.current.startOffset.x + dxPointer * displayScale,
      y: dragState.current.startOffset.y + dyPointer * displayScale,
    };
    setOffset(clampOffset(next, baseScale * zoom, imageRef.current));
  };

  const handlePointerUp = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragState.current = null;
  };

  const handleZoomChange = (e) => {
    const nextZoom = Number(e.target.value);
    setZoom(nextZoom);
    if (imageRef.current) {
      setOffset((prev) => clampOffset(prev, baseScale * nextZoom, imageRef.current));
    }
  };

  const handleConfirm = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    setError('');
    try {
      const blob = await exportCompressedBlob(canvasRef.current);
      onConfirm(blob);
    } catch {
      setError('Something went wrong preparing this photo. Please try again.');
      setIsSaving(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className={styles.overlayWrapper}>
        <motion.div className={styles.backdrop} onClick={onCancel} {...fadeIn} />
        <motion.div className={styles.modalCard} {...scaleIn} role="dialog" aria-modal="true" aria-label="Crop profile picture">
          <div className={styles.header}>
            <h3>Adjust Your Photo</h3>
            <button className={styles.closeBtn} onClick={onCancel} aria-label="Cancel">✕</button>
          </div>

          <div className={styles.cropViewport}>
            {imageReady ? (
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className={styles.canvas}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              />
            ) : (
              <div className={styles.loadingState}>
                <span className={styles.spinner} />
              </div>
            )}
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.zoomRow}>
            <span className={styles.zoomLabel}>Zoom</span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={handleZoomChange}
              disabled={!imageReady}
              className={styles.zoomSlider}
            />
          </div>

          <div className={styles.footer}>
            <motion.button
              className={styles.cancelBtn}
              onClick={onCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={isSaving}
            >
              Cancel
            </motion.button>
            <motion.button
              className={styles.confirmBtn}
              onClick={handleConfirm}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={!imageReady || isSaving}
            >
              {isSaving ? <span className={styles.btnSpinner} /> : 'Use Photo'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
