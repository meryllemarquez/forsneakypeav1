import { PAPERS, resolvePaperId, resolvePinColor, resolveTapeColor } from '../../../constants/loveBoardCatalog';
import { NOTE_CANVAS_WIDTH, NOTE_CANVAS_HEIGHT } from '../../../utils/noteCanvas';
import styles from './lbGraphics.module.css';

/**
 * A letter's paper, drawn in CSS. Fills its (relatively positioned) parent, which is the note
 * canvas, and paints the paper where the old paper images used to sit.
 */
export function LbPaper({ value }) {
  const id = resolvePaperId(value);
  const { rect } = PAPERS.find((p) => p.id === id);
  const position = { left: `${rect.left}%`, top: `${rect.top}%`, width: `${rect.width}%`, height: `${rect.height}%` };

  if (id === 'torn') {
    // The torn edge is a clip-path, so the ink outline is drawn by stacked drop-shadows.
    return (
      <span className={styles.outline} style={position} aria-hidden="true">
        <span className={`${styles.paper} ${styles.torn}`} />
      </span>
    );
  }
  return <span className={`${styles.paper} ${styles[id]}`} style={position} aria-hidden="true" />;
}

// A small stand-in for a paper (pickers, archive rows, layers): the full 280x320 canvas, scaled.
export function LbPaperThumb({ value, size = 80, className = '' }) {
  const factor = size / NOTE_CANVAS_WIDTH;
  return (
    <span className={`relative block shrink-0 overflow-hidden ${className}`} style={{ width: size, height: NOTE_CANVAS_HEIGHT * factor }} aria-hidden="true">
      <span className="absolute top-0 left-0 block" style={{ width: NOTE_CANVAS_WIDTH, height: NOTE_CANVAS_HEIGHT, transform: `scale(${factor})`, transformOrigin: 'top left' }}>
        <LbPaper value={value} />
      </span>
    </span>
  );
}

// A pin or tape fills the square box the board / editor gives it.
export function LbPin({ value }) {
  const color = resolvePinColor(value);
  return (
    <span className={styles.attachment} aria-hidden="true">
      <span className={`${styles.pinHead} ${styles[`c_${color}`]}`} />
    </span>
  );
}

export function LbTape({ value }) {
  const color = resolveTapeColor(value);
  return (
    <span className={styles.attachment} aria-hidden="true">
      <span className={`${styles.tape} ${styles[`t_${color}`]}`} />
    </span>
  );
}

export function LbAttachment({ type, value }) {
  return type === 'PIN' ? <LbPin value={value} /> : <LbTape value={value} />;
}
