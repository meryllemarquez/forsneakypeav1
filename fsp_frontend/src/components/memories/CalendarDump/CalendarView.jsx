import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { memoryService } from '../../../services/memoryService';
import MemoryPreviewModal from './MemoryPreviewModal';
import styles from './CalendarView.module.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// A press has to be held this long before it turns into a reposition drag —
// short of that, releasing is treated as a plain tap (open the preview).
const LONG_PRESS_MS = 380;
// If the pointer moves more than this before the hold fires, the gesture is
// abandoned outright (neither a tap nor a reposition) rather than guessed at.
const MOVE_CANCEL_PX = 6;

const ChevronLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const HeartIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const ExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
    <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
    <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
    <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const MIN_YEAR = 1970;
const MAX_YEAR = 2100;

// Clicking the "Month Year" label opens a small popover to jump straight to
// any month/year, instead of clicking through the arrows one at a time.
function MonthYearPicker({ cursor, onSelect, className }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={`${styles.monthYearPicker} ${className || ''}`} ref={containerRef}>
      <button
        type="button"
        className={styles.monthYearTrigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{MONTH_NAMES[cursor.month - 1]} {cursor.year}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <div className={styles.monthYearPopover}>
          <select
            className={styles.monthYearSelect}
            value={cursor.month}
            onChange={(e) => onSelect(cursor.year, Number(e.target.value))}
            aria-label="Month"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
          <input
            type="number"
            className={styles.monthYearInput}
            value={cursor.year}
            min={MIN_YEAR}
            max={MAX_YEAR}
            aria-label="Year"
            onChange={(e) => {
              const year = Number(e.target.value);
              if (Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR) {
                onSelect(year, cursor.month);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

function todayParts() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

// Press-and-hold-then-drag, distinct from a plain tap. A quick click always
// opens the preview; only a deliberate hold (LONG_PRESS_MS) engages dragging,
// so clicking a photo never accidentally nudges its crop.
function useHighlightReposition(onSave) {
  const [dragState, setDragState] = useState(null); // { folderId, x, y } while actively dragging
  const gestureRef = useRef(null);

  const endGesture = useCallback(() => {
    const g = gestureRef.current;
    if (!g) return;
    gestureRef.current = null;
    clearTimeout(g.timer);
    g.target.removeEventListener('pointermove', g.moveHandler);
    g.target.removeEventListener('pointerup', g.upHandler);
    g.target.removeEventListener('pointercancel', g.cancelHandler);
    if (g.target.hasPointerCapture?.(g.pointerId)) g.target.releasePointerCapture(g.pointerId);
  }, []);

  useEffect(() => () => endGesture(), [endGesture]);

  const onPointerDown = useCallback(
    (e, entry, onTap) => {
      if (e.button != null && e.button !== 0) return;
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const baseX = entry.highlightPhotoPositionX ?? 50;
      const baseY = entry.highlightPhotoPositionY ?? 50;

      const gesture = {
        target,
        pointerId: e.pointerId,
        folderId: entry.folderId,
        liveX: baseX,
        liveY: baseY,
        cellWidth: rect.width || 1,
        cellHeight: rect.height || 1,
        longPressFired: false,
      };

      gesture.moveHandler = (moveEvent) => {
        const dx = moveEvent.clientX - startClientX;
        const dy = moveEvent.clientY - startClientY;
        if (!gesture.longPressFired) {
          if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) endGesture();
          return;
        }
        moveEvent.preventDefault();
        const nextX = Math.max(0, Math.min(100, baseX - (dx / gesture.cellWidth) * 100));
        const nextY = Math.max(0, Math.min(100, baseY - (dy / gesture.cellHeight) * 100));
        gesture.liveX = nextX;
        gesture.liveY = nextY;
        setDragState({ folderId: gesture.folderId, x: nextX, y: nextY });
      };

      gesture.upHandler = (upEvent) => {
        const wasLongPress = gesture.longPressFired;
        const dx = upEvent.clientX - startClientX;
        const dy = upEvent.clientY - startClientY;
        const finalX = gesture.liveX;
        const finalY = gesture.liveY;
        endGesture();
        setDragState(null);
        if (wasLongPress) {
          onSave(gesture.folderId, finalX, finalY);
        } else if (Math.hypot(dx, dy) <= MOVE_CANCEL_PX) {
          onTap();
        }
      };

      gesture.cancelHandler = () => {
        endGesture();
        setDragState(null);
      };

      gesture.timer = setTimeout(() => {
        gesture.longPressFired = true;
        target.setPointerCapture?.(e.pointerId);
        setDragState({ folderId: gesture.folderId, x: baseX, y: baseY });
      }, LONG_PRESS_MS);

      gestureRef.current = gesture;
      target.addEventListener('pointermove', gesture.moveHandler);
      target.addEventListener('pointerup', gesture.upHandler);
      target.addEventListener('pointercancel', gesture.cancelHandler);
    },
    [endGesture, onSave]
  );

  return { dragState, onPointerDown };
}

// The scrapbook "sheet" — big month number, weekday row, photo grid. Rendered
// both inline and (bigger) inside the fullscreen overlay, and is exactly the
// DOM node the PNG export screenshots, so all three stay visually identical
// by construction. The highlight photo is a CSS background-image (not an
// <img> with object-fit) because html2canvas doesn't respect object-fit and
// stretches such images to fill their box — background-size/position it
// renders correctly, which also gives the reposition drag a natural knob.
function CalendarSheet({ cursor, cells, isCurrentMonth, today, entries, loading, onDayClick, onRepositionSave, sheetRef, fullscreen }) {
  const { dragState, onPointerDown } = useHighlightReposition(onRepositionSave);

  return (
    <div ref={sheetRef} className={`${styles.calendarSheet} ${fullscreen ? styles.calendarSheetFullscreen : ''}`}>
      <div className={styles.sheetHeader}>
        <span className={styles.bigMonthNumber}>{String(cursor.month).padStart(2, '0')}</span>
        <div className={styles.sheetHeaderText}>
          <span className={styles.sheetMonthName}>{MONTH_NAMES[cursor.month - 1]}</span>
          <span className={styles.sheetYear}>{cursor.year}</span>
        </div>
      </div>

      <div className={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className={styles.weekdayLabel}>{label}</span>
        ))}
      </div>

      <div className={styles.calendarGrid}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} className={styles.dayCellBlank} />;

          const isToday = isCurrentMonth && cell.day === today.day;
          const hasEntry = !!cell.entry;
          const isDragging = hasEntry && dragState?.folderId === cell.entry.folderId;
          const posX = isDragging ? dragState.x : cell.entry?.highlightPhotoPositionX ?? 50;
          const posY = isDragging ? dragState.y : cell.entry?.highlightPhotoPositionY ?? 50;

          return (
            <button
              key={cell.day}
              type="button"
              className={`${styles.dayCell} ${isToday ? styles.dayCellToday : ''} ${hasEntry ? styles.dayCellFilled : ''} ${isDragging ? styles.dayCellDragging : ''}`}
              onPointerDown={(e) => hasEntry && onPointerDown(e, cell.entry, () => onDayClick(cell.entry))}
              disabled={!hasEntry}
              title={hasEntry ? 'Click to open · press & hold to reposition' : undefined}
            >
              <span className={styles.dayNumber}>{cell.day}</span>
              {hasEntry && (
                <>
                  <div
                    className={styles.dayPhoto}
                    role="img"
                    aria-label={cell.entry.folderName}
                    style={{
                      backgroundImage: `url(${cell.entry.highlightPhotoUrl})`,
                      backgroundPosition: `${posX}% ${posY}%`,
                    }}
                  />
                  <span className={styles.dayHoverInfo}>
                    <span className={styles.dayHoverTitle}>{cell.entry.folderName}</span>
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {!loading && entries.length === 0 && (
        <div className={styles.emptyMonthState}>
          <HeartIcon />
          <p className={styles.emptyMonthTitle}>No highlighted memories this month.</p>
          <p className={styles.emptyMonthSubtitle}>Start creating beautiful moments ❤️</p>
        </div>
      )}
    </div>
  );
}

export default function CalendarView({ onOpenAlbum }) {
  const today = useMemo(() => todayParts(), []);
  const [cursor, setCursor] = useState({ year: today.year, month: today.month });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewEntry, setPreviewEntry] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const sheetRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    memoryService
      .getCalendarMonth(cursor.year, cursor.month)
      .then((data) => {
        if (!cancelled) setEntries(data || []);
      })
      .catch((err) => {
        console.error('Failed to load calendar month', err);
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cursor.year, cursor.month]);

  const entriesByDay = useMemo(() => {
    const map = new Map();
    for (const entry of entries) {
      const day = Number(entry.eventDate?.split('-')[2]);
      if (day) map.set(day, entry);
    }
    return map;
  }, [entries]);

  const cells = useMemo(() => {
    const firstWeekday = new Date(cursor.year, cursor.month - 1, 1).getDay();
    const daysInMonth = new Date(cursor.year, cursor.month, 0).getDate();
    const list = [];
    for (let i = 0; i < firstWeekday; i++) list.push(null);
    for (let day = 1; day <= daysInMonth; day++) list.push({ day, entry: entriesByDay.get(day) || null });
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [cursor, entriesByDay]);

  const goToMonth = (delta) => {
    setLoading(true);
    setCursor((prev) => {
      let month = prev.month + delta;
      let year = prev.year;
      if (month > 12) { month = 1; year += 1; }
      if (month < 1) { month = 12; year -= 1; }
      return { year, month };
    });
  };

  const jumpToToday = () => {
    setLoading(true);
    setCursor({ year: today.year, month: today.month });
  };

  const handlePickMonth = (year, month) => {
    setLoading(true);
    setCursor({ year, month });
  };

  const isCurrentMonth = cursor.year === today.year && cursor.month === today.month;

  // Close fullscreen on Escape, matching the rest of the app's overlay convention.
  useEffect(() => {
    if (!isFullscreen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleExportPng = async () => {
    if (!sheetRef.current || exporting) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(sheetRef.current, {
        backgroundColor: '#FBF3EA',
        scale: Math.max(3, window.devicePixelRatio || 1),
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `calendar-dump-${MONTH_NAMES[cursor.month - 1].toLowerCase()}-${cursor.year}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export calendar as PNG', err);
    } finally {
      setExporting(false);
    }
  };

  const handleRepositionSave = useCallback(async (folderId, x, y) => {
    // Reflect the drag immediately; the request itself is fire-and-forget
    // from the user's perspective since the live drag already showed it.
    setEntries((prev) => prev.map((e) => (
      e.folderId === folderId ? { ...e, highlightPhotoPositionX: x, highlightPhotoPositionY: y } : e
    )));
    try {
      await memoryService.updateHighlightPosition(folderId, x, y);
    } catch (err) {
      console.error('Failed to save highlight position', err);
    }
  }, []);

  const sheetProps = { cursor, cells, isCurrentMonth, today, entries, loading, onDayClick: setPreviewEntry, onRepositionSave: handleRepositionSave };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className={styles.toolbar}>
        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={() => goToMonth(-1)} aria-label="Previous month">
            <ChevronLeftIcon />
          </button>
          <MonthYearPicker cursor={cursor} onSelect={handlePickMonth} />
          <button className={styles.navBtn} onClick={() => goToMonth(1)} aria-label="Next month">
            <ChevronRightIcon />
          </button>
          <button className={styles.todayBtn} onClick={jumpToToday} disabled={isCurrentMonth}>
            Jump to Today
          </button>
        </div>

        <div className={styles.toolbarActions}>
          <button className={styles.toolbarIconBtn} onClick={handleExportPng} disabled={exporting}>
            <DownloadIcon />
            <span>{exporting ? 'Exporting…' : 'Export as PNG'}</span>
          </button>
          <button className={styles.toolbarIconBtn} onClick={() => setIsFullscreen(true)}>
            <ExpandIcon />
            <span>Full Screen</span>
          </button>
        </div>
      </div>

      {!isFullscreen && <CalendarSheet {...sheetProps} sheetRef={sheetRef} />}

      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            className={styles.fullscreenBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <motion.div
              className={styles.fullscreenInner}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.fullscreenToolbar}>
                <div className={styles.monthNav}>
                  <button className={styles.navBtn} onClick={() => goToMonth(-1)} aria-label="Previous month">
                    <ChevronLeftIcon />
                  </button>
                  <MonthYearPicker cursor={cursor} onSelect={handlePickMonth} className={styles.monthYearPickerDark} />
                  <button className={styles.navBtn} onClick={() => goToMonth(1)} aria-label="Next month">
                    <ChevronRightIcon />
                  </button>
                  <button className={styles.todayBtn} onClick={jumpToToday} disabled={isCurrentMonth}>
                    Jump to Today
                  </button>
                </div>
                <div className={styles.toolbarActions}>
                  <button className={styles.toolbarIconBtn} onClick={handleExportPng} disabled={exporting}>
                    <DownloadIcon />
                    <span>{exporting ? 'Exporting…' : 'Export as PNG'}</span>
                  </button>
                  <button className={styles.fullscreenCloseBtn} onClick={() => setIsFullscreen(false)} aria-label="Exit full screen">
                    <CloseIcon />
                  </button>
                </div>
              </div>

              <div className={styles.fullscreenSheetWrapper}>
                <CalendarSheet {...sheetProps} sheetRef={sheetRef} fullscreen />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewEntry && (
          <MemoryPreviewModal
            entry={previewEntry}
            onClose={() => setPreviewEntry(null)}
            onOpenAlbum={() => {
              setPreviewEntry(null);
              onOpenAlbum(previewEntry.folderId);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
