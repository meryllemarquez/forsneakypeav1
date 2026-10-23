import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { dateService } from '../services/dateService';
import { useDates, useDateCategories, useCacheSetter } from '../queries/queries';
import { useDateMutations, useChecklistMutations } from '../queries/mutations';
import { queryKeys } from '../queries/queryKeys';
import styles from './DatesPage.module.css';

/* ================================================================
   ICONS
   ================================================================ */
const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>
  </svg>
); 
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
const HeartIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#C73616' : 'none'} stroke={filled ? '#C73616' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
  </svg>
);
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
const ListIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);
const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"></path>
  </svg>
);
const CalendarStarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);
const ArchiveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line>
  </svg>
);
const RestoreIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
  </svg>
);
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const AlertIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);
const UserIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const TicketIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"></path>
  </svg>
);
const CashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="3"></circle>
  </svg>
);
const RouteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="2"></circle><circle cx="18" cy="5" r="2"></circle><path d="M8 19h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H8"></path>
  </svg>
);
const ClosedInboxIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);
const GripIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <circle cx="9" cy="6" r="1.6"></circle><circle cx="15" cy="6" r="1.6"></circle>
    <circle cx="9" cy="12" r="1.6"></circle><circle cx="15" cy="12" r="1.6"></circle>
    <circle cx="9" cy="18" r="1.6"></circle><circle cx="15" cy="18" r="1.6"></circle>
  </svg>
);
const FlagIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line>
  </svg>
);
const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

/* ================================================================
   STATUS + REFERENCE DATA
   ================================================================ */
const STATUS_META = {
  DREAMING: { label: 'Dreaming', bg: '#E8D7BC', fg: '#8C230F', icon: <SparkleIcon /> },
  PLANNING: { label: 'Planning', bg: 'rgba(168,138,43,0.16)', fg: '#8A6B1E', icon: <ListIcon /> },
  BOOKED: { label: 'Booked', bg: 'rgba(199,54,22,0.14)', fg: '#C73616', icon: <TicketIcon /> },
  READY: { label: 'Ready', bg: '#8C230F', fg: '#ffffff', icon: <CheckCircleIcon /> },
  COMPLETED: { label: 'Completed', bg: '#1F1F1F', fg: '#ffffff', icon: <CheckCircleIcon /> },
  CANCELLED: { label: 'Cancelled', bg: '#F5F5F5', fg: '#6B6B6B', icon: <CloseIcon />, strike: true },
};
const STATUS_ORDER = ['DREAMING', 'PLANNING', 'BOOKED', 'READY', 'COMPLETED', 'CANCELLED'];

const RESERVATION_META = {
  NOT_NEEDED: { label: 'No reservation needed', fg: '#6B6B6B' },
  PENDING: { label: 'Reservation pending', fg: '#A88A2B' },
  CONFIRMED: { label: 'Reservation confirmed', fg: '#8C230F' },
  CANCELLED: { label: 'Reservation cancelled', fg: '#C73616' },
};

const PRIORITY_LABEL = { HIGH: 'High Priority', MEDIUM: 'Medium Priority', LOW: 'Low Priority' };

const CATEGORY_FALLBACK_COLOR = '#8C230F';
const CATEGORY_EMOJI = {
  outdoors: '🌳', travel: '✈️', 'food & drink': '🍽️', food: '🍽️', romantic: '💕',
  'cozy night in': '🏠', adventure: '⛰️', fun: '🎉', celebration: '🎉',
};
const emojiForCategory = (name) => CATEGORY_EMOJI[(name || '').toLowerCase()] || '💗';

function formatPlannedDate(value) {
  if (!value) return 'Someday';
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(value) {
  if (!value) return null;
  const [h, m] = value.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}
function formatDuration(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
function formatCost(value) {
  if (value === null || value === undefined || value === '') return null;
  return `₱${Number(value).toLocaleString('en-US')}`;
}
function formatShortDate(value) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* Count-up used by the animated statistic tiles. */
function useCountUp(target, active, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);
  return active ? value : 0;
}

function StatusBadge({ status, size = 'md' }) {
  const meta = STATUS_META[status] || STATUS_META.DREAMING;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={status}
        className={`${styles.statusPill} ${size === 'lg' ? styles.statusPillLg : ''}`}
        style={{ backgroundColor: meta.bg, color: meta.fg, textDecoration: meta.strike ? 'line-through' : 'none' }}
        initial={{ opacity: 0, scale: 0.75, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.75, y: 4 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.span
          className={styles.statusPillIcon}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          {meta.icon}
        </motion.span>
        {meta.label}
      </motion.span>
    </AnimatePresence>
  );
}

function CircularProgress({ percent, tint }) {
  const size = 44;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={styles.circularProgress}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F5F5F5" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tint}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (percent / 100) * circumference }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className={styles.circularProgressLabel}>{percent}%</span>
    </div>
  );
}

const PRIORITY_DOT_LABEL = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

const ChecklistRow = memo(function ChecklistRow({ item, tint, onToggle, onDelete, onSaveTitle, onSaveDetails, onDragEnd }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(item.title);
  const [expanded, setExpanded] = useState(false);
  const [draftDescription, setDraftDescription] = useState(item.description || '');
  const [draftDueDate, setDraftDueDate] = useState(item.dueDate || '');
  const [draftPriority, setDraftPriority] = useState(item.priority || 'MEDIUM');
  const titleInputRef = useRef(null);
  const dragControls = useDragControls();

  // Keep the edit buffer in sync when the item's title changes from outside
  // (e.g. a drawer refresh) — adjusted during render rather than in an
  // effect, per React's guidance for resetting state from a prop change.
  const [syncedTitle, setSyncedTitle] = useState(item.title);
  if (item.title !== syncedTitle) {
    setSyncedTitle(item.title);
    setDraftTitle(item.title);
  }

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  const commitTitle = () => {
    setIsEditingTitle(false);
    const trimmed = draftTitle.trim();
    if (!trimmed) {
      setDraftTitle(item.title);
      return;
    }
    if (trimmed !== item.title) onSaveTitle(item.id, trimmed);
  };

  const cancelTitle = () => {
    setDraftTitle(item.title);
    setIsEditingTitle(false);
  };

  const commitDetails = () => {
    onSaveDetails(item.id, {
      description: draftDescription.trim() || null,
      dueDate: draftDueDate || null,
      priority: draftPriority,
    });
  };

  const hasDetails = item.description || item.dueDate || (item.priority && item.priority !== 'MEDIUM');

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={dragControls}
      className={styles.checklistItem}
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      whileDrag={{ scale: 1.02, boxShadow: '0 12px 28px rgba(0,0,0,0.14)', zIndex: 5 }}
      onDragEnd={onDragEnd}
    >
      <button
        className={styles.dragHandle}
        onPointerDown={(e) => dragControls.start(e)}
        aria-label="Drag to reorder"
      >
        <GripIcon />
      </button>

      <button
        className={`${styles.checklistCheckbox} ${item.isCompleted ? styles.checklistCheckboxDone : ''}`}
        onClick={() => onToggle(item)}
        aria-label="Toggle complete"
      >
        <AnimatePresence>
          {item.isCompleted && (
            <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}>
              <CheckCircleIcon />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <div className={styles.checklistMain}>
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            className={styles.checklistTitleInput}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitTitle(); }
              else if (e.key === 'Escape') { e.preventDefault(); cancelTitle(); }
            }}
            maxLength={200}
          />
        ) : (
          <span
            className={item.isCompleted ? styles.checklistTextDone : styles.checklistTextEditable}
            onClick={() => setIsEditingTitle(true)}
          >
            {item.title}
          </span>
        )}

        {(hasDetails || expanded) && !isEditingTitle && (
          <div className={styles.checklistMetaRow}>
            {item.priority && item.priority !== 'MEDIUM' && (
              <span className={`${styles.checklistPriorityTag} ${styles[`priority${item.priority}`]}`}>
                <FlagIcon /> {PRIORITY_DOT_LABEL[item.priority]}
              </span>
            )}
            {item.dueDate && <span className={styles.checklistDueTag}><CalendarIcon /> {formatShortDate(item.dueDate)}</span>}
          </div>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              className={styles.checklistExpandPanel}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <textarea
                placeholder="Add a description..."
                rows={2}
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                onBlur={commitDetails}
              />
              <div className={styles.checklistExpandRow}>
                <input type="date" value={draftDueDate} onChange={(e) => { setDraftDueDate(e.target.value); }} onBlur={commitDetails} />
                <select value={draftPriority} onChange={(e) => { setDraftPriority(e.target.value); }} onBlur={commitDetails}>
                  <option value="LOW">Low priority</option>
                  <option value="MEDIUM">Medium priority</option>
                  <option value="HIGH">High priority</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        className={`${styles.checklistExpandBtn} ${expanded ? styles.checklistExpandBtnOpen : ''}`}
        onClick={() => setExpanded((v) => !v)}
        aria-label="More details"
        style={{ color: tint }}
      >
        <ChevronDownIcon />
      </button>

      <button className={styles.checklistDeleteBtn} onClick={() => onDelete(item)} aria-label="Remove step">
        <CloseIcon />
      </button>
    </Reorder.Item>
  );
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const EMPTY_FORM = {
  title: '', categoryId: '', activityType: '', description: '', location: '', travelMethod: '',
  plannedDate: '', plannedTime: '', durationMinutes: '', priority: 'MEDIUM',
  status: 'DREAMING', reservationStatus: 'NOT_NEEDED', specialOccasion: '',
  estimatedCost: '', coverImageUrl: '',
};

export default function DatesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dates and categories come from the shared query cache. `setDates` keeps the optimistic
  // updates below working by writing straight into that cache.
  const datesQuery = useDates(true);
  const dates = useMemo(() => datesQuery.data ?? [], [datesQuery.data]);
  const setDates = useCacheSetter(queryKeys.dates(true));
  const loading = datesQuery.isPending;
  const loadError = datesQuery.isError ? 'Unable to load your bucket list. Please check the backend connection.' : '';
  const { data: categories = [] } = useDateCategories();
  const dateMutations = useDateMutations();
  const checklistMutations = useChecklistMutations();
  const [errorMessage, setErrorMessage] = useState('');

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [drawerDate, setDrawerDate] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [checklistDraft, setChecklistDraft] = useState('');
  const checklistInputRef = useRef(null);

  const [formState, setFormState] = useState({ open: false, mode: 'create', values: EMPTY_FORM, editingId: null, submitting: false, error: '' });

  const [confirmState, setConfirmState] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  /* ---------------------------------------------------------------
     DERIVED: filters + stats (computed client-side from one fetch)
  --------------------------------------------------------------- */
  const activeDates = useMemo(() => dates.filter((d) => !d.isArchived), [dates]);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = activeDates.filter((d) => {
      if (!d.plannedDate) return false;
      const pd = new Date(`${d.plannedDate}T00:00:00`);
      return pd.getFullYear() === now.getFullYear() && pd.getMonth() === now.getMonth();
    }).length;

    return {
      total: activeDates.length,
      upcoming: activeDates.filter((d) => ['PLANNING', 'BOOKED', 'READY'].includes(d.status)).length,
      completed: activeDates.filter((d) => d.status === 'COMPLETED').length,
      favorites: activeDates.filter((d) => d.isFavorite).length,
      thisMonth,
    };
  }, [activeDates]);

  const totalCount = useCountUp(stats.total, !loading);
  const upcomingCount = useCountUp(stats.upcoming, !loading);
  const completedCount = useCountUp(stats.completed, !loading);
  const favoritesCount = useCountUp(stats.favorites, !loading);
  const monthCount = useCountUp(stats.thisMonth, !loading);

  const filteredDates = useMemo(() => {
    return dates.filter((d) => {
      if (statusFilter === 'ARCHIVED') {
        if (!d.isArchived) return false;
      } else {
        if (d.isArchived) return false;
        if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      }
      if (categoryFilter && d.categoryName !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = `${d.title} ${d.location || ''} ${d.categoryName || ''} ${d.activityType || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [dates, statusFilter, categoryFilter, searchQuery]);

  const categoryNames = useMemo(
    () => [...new Set(activeDates.map((d) => d.categoryName).filter(Boolean))],
    [activeDates]
  );

  /* ---------------------------------------------------------------
     QUICK ACTIONS
  --------------------------------------------------------------- */
  const handleToggleFavorite = async (date, e) => {
    e?.stopPropagation();
    const nextFavorite = !date.isFavorite;
    setDates((prev) => prev.map((d) => (d.id === date.id ? { ...d, isFavorite: nextFavorite } : d)));
    try {
      await dateMutations.setFavorite(date.id, nextFavorite);
    } catch (err) {
      console.error('Failed to toggle favorite', err);
      setDates((prev) => prev.map((d) => (d.id === date.id ? { ...d, isFavorite: date.isFavorite } : d)));
    }
  };

  const handleArchiveToggle = async (date, e) => {
    e?.stopPropagation();
    try {
      if (date.isArchived) {
        await dateMutations.unarchiveDate(date.id);
      } else {
        await dateMutations.archiveDate(date.id);
      }
      if (drawerDate?.id === date.id) await refreshDrawer(date.id);
    } catch (err) {
      console.error('Failed to toggle archive state', err);
      setErrorMessage('That action failed. Please try again.');
    }
  };

  const handleDuplicate = async (date, e) => {
    e?.stopPropagation();
    try {
      await dateMutations.duplicateDate(date.id);
    } catch (err) {
      console.error('Failed to duplicate date', err);
      setErrorMessage('Could not duplicate that date. Please try again.');
    }
  };

  const requestDelete = (date, e) => {
    e?.stopPropagation();
    setConfirmState({
      title: 'Delete this date?',
      message: `"${date.title}" will be removed from your bucket list, love. This one can't be undone from here.`,
      confirmLabel: 'Delete Date',
      onConfirm: async () => {
        await dateMutations.deleteDate(date.id);
        if (drawerDate?.id === date.id) setDrawerDate(null);
      },
    });
  };

  const closeConfirm = () => {
    if (confirmBusy) return;
    setConfirmState(null);
  };

  const handleConfirmAccept = async () => {
    if (!confirmState || confirmBusy) return;
    try {
      setConfirmBusy(true);
      await confirmState.onConfirm();
      setConfirmState(null);
    } catch (err) {
      console.error('Confirmed action failed', err);
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setConfirmBusy(false);
    }
  };

  /* ---------------------------------------------------------------
     DETAIL DRAWER
  --------------------------------------------------------------- */
  const openDrawer = async (date) => {
    setDrawerDate(date);
    setDrawerLoading(true);
    try {
      const full = await dateService.getDateById(date.id);
      setDrawerDate(full); 
    } catch (err) {
      console.error('Failed to load date details', err);
    } finally {
      setDrawerLoading(false);
    }
  };
  const closeDrawer = () => { setDrawerDate(null); setChecklistDraft(''); };

  const refreshDrawer = async (id) => {
    try {
      const full = await dateService.getDateById(id);
      setDrawerDate(full);
    } catch (err) {
      console.error('Failed to refresh date details', err);
    }
  };

  // Deep-link from a notification ("?dateId=...") — open that date's
  // drawer once, then strip the param.
  useEffect(() => {
    const dateId = searchParams.get('dateId');
    if (!dateId) return undefined;
    let cancelled = false;
    (async () => {
      if (!cancelled) await openDrawer({ id: dateId });
      if (cancelled) return;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('dateId');
        return next;
      }, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const patchDateInList = (id, patch) => {
    setDates((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  // Snapshot of the checklist just before an optimistic mutation, so a failed
  // request can roll the drawer + card list back to exactly what the server has.
  const snapshotChecklist = () => ({
    items: drawerDate?.checklistItems || [],
    completed: drawerDate?.checklistCompletedCount || 0,
    total: drawerDate?.checklistTotalCount || 0,
  });

  const rollbackChecklist = (snapshot, message) => {
    if (!drawerDate) return;
    setDrawerDate((prev) => (prev ? { ...prev, checklistItems: snapshot.items } : prev));
    patchDateInList(drawerDate.id, {
      checklistCompletedCount: snapshot.completed,
      checklistTotalCount: snapshot.total,
    });
    setErrorMessage(message);
  };

  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    const title = checklistDraft.trim();
    if (!title || !drawerDate) return;
    setChecklistDraft('');

    try {
      const created = await checklistMutations.createItem(drawerDate.id, { title });
      setDrawerDate((prev) => (prev ? { ...prev, checklistItems: [...(prev.checklistItems || []), created] } : prev));
      patchDateInList(drawerDate.id, { checklistTotalCount: (drawerDate.checklistTotalCount || 0) + 1 });
    } catch (err) {
      console.error('Failed to add checklist item', err);
      setChecklistDraft(title);
      setErrorMessage('Could not add that step. Please try again.');
    }
  };

  const handleToggleChecklistItem = useCallback(async (item) => {
    if (!drawerDate) return;
    const snapshot = snapshotChecklist();
    const nextCompleted = !item.isCompleted;

    setDrawerDate((prev) => prev ? {
      ...prev,
      checklistItems: (prev.checklistItems || []).map((i) => (i.id === item.id ? { ...i, isCompleted: nextCompleted } : i)),
    } : prev);
    patchDateInList(drawerDate.id, {
      checklistCompletedCount: Math.max(0, (drawerDate.checklistCompletedCount || 0) + (nextCompleted ? 1 : -1)),
    });

    try {
      await checklistMutations.toggleItem(drawerDate.id, item.id, nextCompleted);
    } catch (err) {
      console.error('Failed to update checklist item', err);
      rollbackChecklist(snapshot, 'Could not update that step. Please try again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerDate]);

  const handleDeleteChecklistItem = useCallback(async (item) => {
    if (!drawerDate) return;
    const snapshot = snapshotChecklist();

    setDrawerDate((prev) => prev ? {
      ...prev,
      checklistItems: (prev.checklistItems || []).filter((i) => i.id !== item.id),
    } : prev);
    patchDateInList(drawerDate.id, {
      checklistTotalCount: Math.max(0, (drawerDate.checklistTotalCount || 0) - 1),
      checklistCompletedCount: item.isCompleted
        ? Math.max(0, (drawerDate.checklistCompletedCount || 0) - 1)
        : drawerDate.checklistCompletedCount,
    });

    try {
      await checklistMutations.deleteItem(drawerDate.id, item.id);
    } catch (err) {
      console.error('Failed to delete checklist item', err);
      rollbackChecklist(snapshot, 'Could not remove that step. Please try again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerDate]);

  const handleSaveChecklistTitle = useCallback(async (itemId, title) => {
    if (!drawerDate) return;
    const snapshot = snapshotChecklist();
    setDrawerDate((prev) => prev ? {
      ...prev,
      checklistItems: (prev.checklistItems || []).map((i) => (i.id === itemId ? { ...i, title } : i)),
    } : prev);

    try {
      await checklistMutations.updateItem(drawerDate.id, itemId, { title });
    } catch (err) {
      console.error('Failed to rename checklist item', err);
      rollbackChecklist(snapshot, 'Could not save that title. Please try again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerDate]);

  const handleSaveChecklistDetails = useCallback(async (itemId, details) => {
    if (!drawerDate) return;
    const snapshot = snapshotChecklist();
    setDrawerDate((prev) => prev ? {
      ...prev,
      checklistItems: (prev.checklistItems || []).map((i) => (i.id === itemId ? { ...i, ...details } : i)),
    } : prev);

    try {
      await checklistMutations.updateItem(drawerDate.id, itemId, details);
    } catch (err) {
      console.error('Failed to update checklist item details', err);
      rollbackChecklist(snapshot, 'Could not save those details. Please try again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerDate]);

  const checklistOrderRef = useRef([]);

  const handleChecklistReorder = (newOrder) => {
    checklistOrderRef.current = newOrder;
    setDrawerDate((prev) => (prev ? { ...prev, checklistItems: newOrder } : prev));
  };

  const handleChecklistDragEnd = async () => {
    if (!drawerDate) return;
    const orderedIds = checklistOrderRef.current.map((i) => i.id);
    if (orderedIds.length === 0) return;
    try {
      await checklistMutations.reorderItems(drawerDate.id, orderedIds);
    } catch (err) {
      console.error('Failed to save new checklist order', err);
      setErrorMessage('Could not save the new order. Please try again.');
      await refreshDrawer(drawerDate.id);
    }
  };

  /* ---------------------------------------------------------------
     CREATE / EDIT FORM
  --------------------------------------------------------------- */
  const openCreateForm = () => {
    setFormState({ open: true, mode: 'create', values: EMPTY_FORM, editingId: null, submitting: false, error: '' });
  };

  const openEditForm = (date, e) => {
    e?.stopPropagation();
    setFormState({
      open: true,
      mode: 'edit',
      editingId: date.id,
      submitting: false,
      error: '',
      values: {
        title: date.title || '',
        categoryId: date.categoryId || '',
        activityType: date.activityType || '',
        description: date.description || '',
        location: date.location || '',
        travelMethod: date.travelMethod || '',
        plannedDate: date.plannedDate || '',
        plannedTime: date.plannedTime ? date.plannedTime.slice(0, 5) : '',
        durationMinutes: date.durationMinutes ?? '',
        priority: date.priority || 'MEDIUM',
        status: date.status || 'DREAMING',
        reservationStatus: date.reservationStatus || 'NOT_NEEDED',
        specialOccasion: date.specialOccasion || '',
        estimatedCost: date.estimatedCost ?? '',
        coverImageUrl: date.coverImageUrl || '',
      },
    });
  };

  const closeForm = () => setFormState((prev) => ({ ...prev, open: false }));

  const updateFormField = (field, value) => {
    setFormState((prev) => ({ ...prev, values: { ...prev.values, [field]: value } }));
  };

  const buildPayload = (values) => ({
    title: values.title.trim(),
    categoryId: values.categoryId || null,
    activityType: values.activityType || null,
    description: values.description || null,
    location: values.location || null,
    travelMethod: values.travelMethod || null,
    plannedDate: values.plannedDate || null,
    plannedTime: values.plannedTime || null,
    durationMinutes: values.durationMinutes === '' ? null : Number(values.durationMinutes),
    priority: values.priority,
    status: values.status,
    reservationStatus: values.reservationStatus,
    specialOccasion: values.specialOccasion || null,
    estimatedCost: values.estimatedCost === '' ? null : Number(values.estimatedCost),
    coverImageUrl: values.coverImageUrl || null,
  });

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formState.values.title.trim()) return;

    setFormState((prev) => ({ ...prev, submitting: true, error: '' }));
    try {
      if (formState.mode === 'create') {
        await dateMutations.createDate(buildPayload(formState.values));
      } else {
        await dateMutations.updateDate(formState.editingId, buildPayload(formState.values));
        if (drawerDate?.id === formState.editingId) await refreshDrawer(formState.editingId);
      }
      setFormState((prev) => ({ ...prev, open: false, submitting: false }));
    } catch (err) {
      console.error('Failed to save date', err);
      setFormState((prev) => ({
        ...prev,
        submitting: false,
        error: err?.response?.data?.message || 'Failed to save this date. Please try again.',
      }));
    }
  };

  /* ---------------------------------------------------------------
     RENDER HELPERS
  --------------------------------------------------------------- */
  const renderCard = (date) => {
    const tint = date.categoryColorHex || CATEGORY_FALLBACK_COLOR;
    const total = date.checklistTotalCount || 0;
    const completed = date.checklistCompletedCount || 0;
    const progressPct = total ? Math.round((completed / total) * 100) : 0;
    const costLabel = formatCost(date.estimatedCost);
    const durationLabel = formatDuration(date.durationMinutes);
    const timeLabel = formatTime(date.plannedTime);
    const reservation = RESERVATION_META[date.reservationStatus] || RESERVATION_META.NOT_NEEDED;

    return (
      <motion.div
        key={date.id}
        className={styles.dateCard}
        variants={itemVariants}
        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ '--card-tint': tint }}
        onClick={() => openDrawer(date)}
      >
        <div className={styles.cardCover}>
          {date.coverImageUrl ? (
            <img src={date.coverImageUrl} alt={date.title} className={styles.cardCoverImage} loading="lazy" />
          ) : (
            <div className={styles.cardCoverGradient} style={{ background: `linear-gradient(155deg, ${tint} 0%, #1F1F1F 130%)` }}>
              <span className={styles.cardCoverEmoji}>{emojiForCategory(date.categoryName)}</span>
            </div>
          )}
          <div className={styles.cardCoverOverlay} />

          {date.categoryName && (
            <span className={styles.categoryPill} style={{ backgroundColor: tint }}>{date.categoryName}</span>
          )}

          <button className={styles.favToggleBtn} onClick={(e) => handleToggleFavorite(date, e)} aria-label="Toggle favorite">
            <HeartIcon filled={date.isFavorite} />
          </button>

          <span className={`${styles.priorityFlag} ${styles[`priority${date.priority}`]}`} title={PRIORITY_LABEL[date.priority]} />

          <div className={styles.cardCoverStatus}>
            <StatusBadge status={date.status} />
          </div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.cardTitleRow}>
            <h3 className={styles.cardTitle}>{date.title}</h3>
            {date.isArchived && <span className={styles.archivedTag}>Archived</span>}
          </div>

          <p className={styles.cardSubline}>
            {date.activityType && <span>{date.activityType}</span>}
            {date.activityType && date.createdByName && <span className={styles.sublineDot}>·</span>}
            {date.createdByName && (
              <span className={styles.sublineCreator}><UserIcon /> {date.createdByName}</span>
            )}
          </p>

          <div className={styles.cardMetaGrid}>
            <span className={styles.metaChip}><CalendarIcon /> {formatPlannedDate(date.plannedDate)}{timeLabel ? ` · ${timeLabel}` : ''}</span>
            {durationLabel && <span className={styles.metaChip}><ClockIcon /> {durationLabel}</span>}
            {date.location && <span className={styles.metaChip}><MapPinIcon /> {date.location}</span>}
            {costLabel && <span className={styles.metaChip}><CashIcon /> {costLabel}</span>}
          </div>

          {date.reservationStatus !== 'NOT_NEEDED' && (
            <span className={styles.reservationTag} style={{ color: reservation.fg }}>
              <TicketIcon /> {reservation.label}
            </span>
          )}

          <div className={styles.progressBlock}>
            <div className={styles.progressTrack}>
              <motion.div
                className={styles.progressFill}
                style={{ backgroundColor: tint }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              />
            </div>
            <span className={styles.progressLabel}>{completed}/{total} steps done</span>
          </div>

          <div className={styles.cardFooter}>
            <span />
            <div className={styles.cardQuickActions}>
              <button className={styles.cardIconBtn} title="Edit" onClick={(e) => openEditForm(date, e)}><EditIcon /></button>
              <button className={styles.cardIconBtn} title="Duplicate" onClick={(e) => handleDuplicate(date, e)}><CopyIcon /></button>
              <button className={styles.cardIconBtn} title={date.isArchived ? 'Restore' : 'Archive'} onClick={(e) => handleArchiveToggle(date, e)}>
                {date.isArchived ? <RestoreIcon /> : <ArchiveIcon />}
              </button>
              <button className={`${styles.cardIconBtn} ${styles.cardIconBtnDanger}`} title="Delete" onClick={(e) => requestDelete(date, e)}><TrashIcon /></button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={styles.pageContainer}>
      {/* NAVBAR */}
      <header className={styles.navbar}>
        <div className={styles.navLeft}>
          <button className={styles.backHomeBtn} onClick={() => navigate('/home')}>
            <ArrowLeftIcon /><span>Sanctuary</span>
          </button>
          <span className={styles.navDivider}>/</span>
          <span className={styles.navBrand}>FOR SNEAKYPEA</span>
          <span className={styles.navDivider}>/</span>
          <span className={styles.navSubBrand}>Bucket List</span>
        </div>

        <div className={styles.searchBar}>
          <SearchIcon />
          <input type="text" placeholder="Search dates, places, categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className={styles.navRight}>
          <button className={styles.primaryActionBtn} onClick={openCreateForm}>
            <PlusIcon /><span>New Date</span>
          </button>
        </div>
      </header>

      <main className={styles.contentWrapper}>
        {(errorMessage || loadError) && <div className={styles.errorBanner}>{errorMessage || loadError}</div>}

        {/* HERO */}
        <motion.section className={styles.heroSection} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <div className={styles.heroBadge}><SparkleIcon /><span>Premium Date Bucket List</span></div>
          <h1 className={styles.heroHeading}>Everything We Still Want To Do</h1>
          <p className={styles.heroSubtext}>A living list of adventures, quiet nights in, and everything in between — kept just for the two of us.</p>
        </motion.section>

        {/* STATS */}
        <div className={styles.statsGrid}>
          {[
            { label: 'Total Planned', value: totalCount, icon: <ListIcon />, tint: '#8C230F' },
            { label: 'Upcoming', value: upcomingCount, icon: <ClockIcon />, tint: '#C73616' },
            { label: 'Completed', value: completedCount, icon: <CheckCircleIcon />, tint: '#A88A2B' },
            { label: 'Favorites', value: favoritesCount, icon: <HeartIcon filled />, tint: '#8C230F' },
            { label: "This Month", value: monthCount, icon: <CalendarStarIcon />, tint: '#C73616' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className={styles.statCard}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
            >
              <div className={styles.statCardHeader}>
                <div className={styles.statIconRing} style={{ '--tint': stat.tint }}>{stat.icon}</div>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
              <span className={styles.statValue}>{stat.value}</span>
            </motion.div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className={styles.quickActionsBar}>
          <div className={styles.segmentedControl}>
            {['ALL', ...STATUS_ORDER, 'ARCHIVED'].map((key) => (
              <button
                key={key}
                className={`${styles.segmentBtn} ${statusFilter === key ? styles.segmentActive : ''}`}
                onClick={() => setStatusFilter(key)}
              >
                {key === 'ALL' ? 'All' : key === 'ARCHIVED' ? 'Archived' : STATUS_META[key].label}
              </button>
            ))}
          </div>

          {categoryNames.length > 0 && (
            <div className={styles.categoryChips}>
              <button className={`${styles.categoryChip} ${!categoryFilter ? styles.categoryChipActive : ''}`} onClick={() => setCategoryFilter(null)}>
                All Categories
              </button>
              {categoryNames.map((cat) => {
                const color = activeDates.find((d) => d.categoryName === cat)?.categoryColorHex || CATEGORY_FALLBACK_COLOR;
                return (
                  <button
                    key={cat}
                    className={`${styles.categoryChip} ${categoryFilter === cat ? styles.categoryChipActive : ''}`}
                    style={{ '--chip-color': color }}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    <span className={styles.categoryDot} style={{ backgroundColor: color }} />{cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* LOADING SKELETON */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" className={styles.dateGrid} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonCover} />
                  <div className={styles.skeletonBody}>
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
                    <div className={styles.skeletonLine} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                    <div className={styles.skeletonBar} />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : filteredDates.length === 0 ? (
            <motion.div
              key="empty"
              className={styles.emptyStateCard}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className={styles.emptyIconRing}><ClosedInboxIcon /></div>
              {dates.length === 0 ? (
                <>
                  <h3 className={styles.emptyTitle}>Let's plan our next adventure together.</h3>
                  <p className={styles.emptyText}>Every great memory starts as a small idea. Add the first one.</p>
                  <button className={styles.primaryActionBtn} onClick={openCreateForm}>
                    <PlusIcon /><span>Plan Our First Date</span>
                  </button>
                </>
              ) : (
                <>
                  <h3 className={styles.emptyTitle}>Nothing here yet, love</h3>
                  <p className={styles.emptyText}>
                    {statusFilter === 'ARCHIVED' ? "You haven't archived any date ideas." : 'No dates match this filter. Try another view, or dream up something new.'}
                  </p>
                  <button className={styles.primaryActionBtn} onClick={openCreateForm}>
                    <PlusIcon /><span>Add a Date Idea</span>
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="grid" className={styles.dateGrid} variants={containerVariants} initial="hidden" animate="visible">
              <AnimatePresence>{filteredDates.map(renderCard)}</AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* DETAIL DRAWER */}
      <AnimatePresence>
        {drawerDate && (
          <>
            <motion.div
              className={styles.drawerBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeDrawer}
            />
            <motion.aside
              className={styles.drawer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.drawerHeader}>
                <StatusBadge status={drawerDate.status} size="lg" />
                <button className={styles.drawerCloseBtn} onClick={closeDrawer}><CloseIcon /></button>
              </div>

              <div className={styles.drawerScroll}>
                <h2 className={styles.drawerTitle}>{drawerDate.title}</h2>
                <p className={styles.drawerSubline}>
                  {drawerDate.categoryName && <span>{drawerDate.categoryName}</span>}
                  {drawerDate.categoryName && drawerDate.activityType && <span className={styles.sublineDot}>·</span>}
                  {drawerDate.activityType && <span>{drawerDate.activityType}</span>}
                </p>

                {drawerLoading && <div className={styles.drawerLoadingBar} />}

                <section className={styles.drawerSection}>
                  <h4 className={styles.drawerSectionTitle}>Schedule</h4>
                  <div className={styles.drawerFactGrid}>
                    <div className={styles.drawerFact}><CalendarIcon /><span>{formatPlannedDate(drawerDate.plannedDate)}</span></div>
                    {formatTime(drawerDate.plannedTime) && <div className={styles.drawerFact}><ClockIcon /><span>{formatTime(drawerDate.plannedTime)}</span></div>}
                    {formatDuration(drawerDate.durationMinutes) && <div className={styles.drawerFact}><ClockIcon /><span>{formatDuration(drawerDate.durationMinutes)} duration</span></div>}
                  </div>
                </section>

                <section className={styles.drawerSection}>
                  <h4 className={styles.drawerSectionTitle}>Location</h4>
                  <div className={styles.drawerFactGrid}>
                    {drawerDate.location && <div className={styles.drawerFact}><MapPinIcon /><span>{drawerDate.location}</span></div>}
                    {drawerDate.travelMethod && <div className={styles.drawerFact}><RouteIcon /><span>{drawerDate.travelMethod}</span></div>}
                    <div className={styles.drawerFact} style={{ color: (RESERVATION_META[drawerDate.reservationStatus] || RESERVATION_META.NOT_NEEDED).fg }}>
                      <TicketIcon /><span>{(RESERVATION_META[drawerDate.reservationStatus] || RESERVATION_META.NOT_NEEDED).label}</span>
                    </div>
                  </div>
                </section>

                <section className={styles.drawerSection}>
                  <h4 className={styles.drawerSectionTitle}>Planning</h4>
                  <div className={styles.drawerFactGrid}>
                    {formatCost(drawerDate.estimatedCost) && <div className={styles.drawerFact}><CashIcon /><span>{formatCost(drawerDate.estimatedCost)} budget</span></div>}
                    <div className={styles.drawerFact}><span className={`${styles.priorityFlag} ${styles[`priority${drawerDate.priority}`]}`} /><span>{PRIORITY_LABEL[drawerDate.priority]}</span></div>
                    {drawerDate.specialOccasion && <div className={styles.drawerFact}><SparkleIcon /><span>{drawerDate.specialOccasion}</span></div>}
                    {drawerDate.createdByName && <div className={styles.drawerFact}><UserIcon /><span>Created by {drawerDate.createdByName}</span></div>}
                  </div>
                </section>

                <section className={styles.drawerSection}>
                  {(() => {
                    // Derived straight from the live items array rather than the
                    // separate checklistTotalCount/checklistCompletedCount fields —
                    // those only track card-view summaries and go stale the moment
                    // an item is added/toggled/deleted here in the drawer.
                    const items = drawerDate.checklistItems || [];
                    const total = items.length;
                    const completed = items.filter((i) => i.isCompleted).length;
                    const percent = total ? Math.round((completed / total) * 100) : 0;
                    const tint = drawerDate.categoryColorHex || CATEGORY_FALLBACK_COLOR;
                    const allDone = total > 0 && completed === total;

                    return (
                      <>
                        <div className={styles.checklistHeader}>
                          <h4 className={styles.drawerSectionTitle}>
                            Checklist
                            {total > 0 && <span className={styles.drawerSectionCount}>{completed}/{total}</span>}
                          </h4>
                          {total > 0 && <CircularProgress percent={percent} tint={tint} />}
                        </div>

                        {total > 0 && (
                          <div className={styles.progressTrack} style={{ marginBottom: '0.85rem' }}>
                            <motion.div
                              className={styles.progressFill}
                              style={{ backgroundColor: tint }}
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </div>
                        )}

                        <AnimatePresence>
                          {allDone && (
                            <motion.div
                              className={styles.celebrationBanner}
                              initial={{ opacity: 0, y: -10, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.96 }}
                              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                            >
                              <motion.span
                                className={styles.celebrationEmoji}
                                animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                              >
                                🎉
                              </motion.span>
                              <div>
                                <p className={styles.celebrationTitle}>Every step is done!</p>
                                <p className={styles.celebrationText}>This one's ready — keep editing anytime.</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {items.length === 0 ? (
                          <div className={styles.checklistEmptyState}>
                            <p className={styles.checklistEmptyTitle}>Every great date starts with a little planning.</p>
                            <button
                              type="button"
                              className={styles.secondaryBtn}
                              onClick={() => checklistInputRef.current?.focus()}
                            >
                              <PlusIcon /><span>Add First Checklist Item</span>
                            </button>
                          </div>
                        ) : (
                          <Reorder.Group
                            as="ul"
                            axis="y"
                            className={styles.checklist}
                            values={items}
                            onReorder={handleChecklistReorder}
                          >
                            <AnimatePresence initial={false}>
                              {items.map((item) => (
                                <ChecklistRow
                                  key={item.id}
                                  item={item}
                                  tint={tint}
                                  onToggle={handleToggleChecklistItem}
                                  onDelete={handleDeleteChecklistItem}
                                  onSaveTitle={handleSaveChecklistTitle}
                                  onSaveDetails={handleSaveChecklistDetails}
                                  onDragEnd={handleChecklistDragEnd}
                                />
                              ))}
                            </AnimatePresence>
                          </Reorder.Group>
                        )}

                        <form className={styles.checklistForm} onSubmit={handleAddChecklistItem}>
                          <input
                            ref={checklistInputRef}
                            type="text"
                            placeholder="Add a step... (Enter to add)"
                            value={checklistDraft}
                            onChange={(e) => setChecklistDraft(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Escape') setChecklistDraft(''); }}
                            maxLength={200}
                          />
                          <button type="submit" disabled={!checklistDraft.trim()} aria-label="Add step"><PlusIcon /></button>
                        </form>
                      </>
                    );
                  })()}
                </section>

                <section className={styles.drawerSection}>
                  <h4 className={styles.drawerSectionTitle}>Notes</h4>
                  {drawerDate.description ? (
                    <p className={styles.drawerNotes}>{drawerDate.description}</p>
                  ) : (
                    <p className={styles.checklistEmpty}>No notes written for this one yet.</p>
                  )}
                </section>
              </div>

              <div className={styles.drawerFooter}>
                <button className={styles.secondaryBtn} onClick={(e) => openEditForm(drawerDate, e)}><EditIcon /><span>Edit</span></button>
                <button className={styles.secondaryBtn} onClick={(e) => handleDuplicate(drawerDate, e)}><CopyIcon /><span>Duplicate</span></button>
                <button className={styles.secondaryBtn} onClick={(e) => handleArchiveToggle(drawerDate, e)}>
                  {drawerDate.isArchived ? <RestoreIcon /> : <ArchiveIcon />}
                  <span>{drawerDate.isArchived ? 'Restore' : 'Archive'}</span>
                </button>
                <button className={styles.dangerOutlineBtn} onClick={(e) => requestDelete(drawerDate, e)}><TrashIcon /><span>Delete</span></button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT FORM MODAL */}
      <AnimatePresence>
        {formState.open && (
          <motion.div className={styles.modalBackdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} onClick={closeForm}>
            <motion.div
              className={styles.formModalCard}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{formState.mode === 'create' ? 'Plan a New Date' : 'Edit This Date'}</h2>
                <button className={styles.closeBtn} onClick={closeForm}><CloseIcon /></button>
              </div>

              <form onSubmit={handleSubmitForm} className={styles.modalForm}>
                <div className={styles.formSection}>
                  <h4 className={styles.formSectionTitle}>Basics</h4>

                  <div className={styles.formGroup}>
                    <label>Title</label>
                    <input type="text" required placeholder="e.g. Sunset Picnic at La Mesa Eco Park"
                      value={formState.values.title} onChange={(e) => updateFormField('title', e.target.value)} />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Category</label>
                      <select value={formState.values.categoryId} onChange={(e) => updateFormField('categoryId', e.target.value)}>
                        <option value="">No category</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Activity Type</label>
                      <input type="text" placeholder="e.g. Dinner, Hike, Movie" value={formState.values.activityType || ''}
                        onChange={(e) => updateFormField('activityType', e.target.value)} />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Notes</label>
                    <textarea rows={3} placeholder="What's the plan..." value={formState.values.description}
                      onChange={(e) => updateFormField('description', e.target.value)} />
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h4 className={styles.formSectionTitle}>Schedule</h4>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Date</label>
                      <input type="date" value={formState.values.plannedDate} onChange={(e) => updateFormField('plannedDate', e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Time</label>
                      <input type="time" value={formState.values.plannedTime} onChange={(e) => updateFormField('plannedTime', e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Duration (min)</label>
                      <input type="number" min="0" value={formState.values.durationMinutes} onChange={(e) => updateFormField('durationMinutes', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h4 className={styles.formSectionTitle}>Location</h4>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Location</label>
                      <input type="text" placeholder="e.g. Quezon City" value={formState.values.location} onChange={(e) => updateFormField('location', e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Travel Method</label>
                      <input type="text" placeholder="e.g. Car, Walk" value={formState.values.travelMethod} onChange={(e) => updateFormField('travelMethod', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h4 className={styles.formSectionTitle}>Planning</h4>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Priority</label>
                      <select value={formState.values.priority} onChange={(e) => updateFormField('priority', e.target.value)}>
                        <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Reservation</label>
                      <select value={formState.values.reservationStatus} onChange={(e) => updateFormField('reservationStatus', e.target.value)}>
                        <option value="NOT_NEEDED">Not needed</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                    {formState.mode === 'edit' && (
                      <div className={styles.formGroup}>
                        <label>Status</label>
                        <select value={formState.values.status} onChange={(e) => updateFormField('status', e.target.value)}>
                          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Budget</label>
                      <input type="number" min="0" step="0.01" placeholder="0.00" value={formState.values.estimatedCost} onChange={(e) => updateFormField('estimatedCost', e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Special Occasion</label>
                      <input type="text" placeholder="e.g. Anniversary" value={formState.values.specialOccasion} onChange={(e) => updateFormField('specialOccasion', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h4 className={styles.formSectionTitle}>Cover Photo</h4>
                  <div className={styles.formGroup}>
                    <label>Cover Image URL (optional)</label>
                    <input type="text" placeholder="https://..." value={formState.values.coverImageUrl} onChange={(e) => updateFormField('coverImageUrl', e.target.value)} />
                  </div>
                </div>

                {formState.error && <p className={styles.inlineFormError}>{formState.error}</p>}

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.secondaryBtn} onClick={closeForm}>Cancel</button>
                  <button type="submit" className={styles.primaryActionBtn} disabled={formState.submitting}>
                    {formState.submitting ? 'Saving...' : formState.mode === 'create' ? 'Create Date' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {confirmState && (
          <motion.div className={styles.confirmBackdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.24 }} onClick={closeConfirm}>
            <motion.div
              className={styles.confirmCard}
              initial={{ opacity: 0, y: 26, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
            >
              <div className={styles.confirmIconRing}><AlertIcon /></div>
              <h3 className={styles.confirmTitle}>{confirmState.title}</h3>
              <p className={styles.confirmMessage}>{confirmState.message}</p>
              <div className={styles.confirmFooter}>
                <button type="button" className={styles.confirmCancelBtn} onClick={closeConfirm} disabled={confirmBusy}>Cancel</button>
                <button type="button" className={styles.confirmDeleteBtn} onClick={handleConfirmAccept} disabled={confirmBusy}>
                  {confirmBusy ? 'Removing…' : confirmState.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
