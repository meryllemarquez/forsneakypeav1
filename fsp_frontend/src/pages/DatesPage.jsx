import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import {
  Archive,
  ArchiveRestore,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Flag,
  GripVertical,
  Heart,
  Pencil,
  Plus,
  Route,
  Search,
  Sparkles,
  Ticket,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { dateService } from '../services/dateService';
import { uploadImageToDrive } from '../api/driveUpload';
import { useDates, useDateCategories, useCacheSetter } from '../queries/queries';
import { useDateMutations, useChecklistMutations } from '../queries/mutations';
import { queryKeys } from '../queries/queryKeys';
import { DATE_STATUS_LABELS, DATE_STATUS_ORDER } from '../constants/dateStatus';
import { findDoodle } from '../utils/doodleFor';
import Icon from '../components/Icon';
import Navbar from '../components/layout/Navbar/Navbar';
import Button from '../components/ui/Button/Button';
import Modal from '../components/ui/Modal/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog/ConfirmDialog';
import DeleteAllDialog from '../components/ui/DeleteAllDialog/DeleteAllDialog';
import { useNotification } from '../hooks/useNotification';
import StatusChip from '../components/ui/StatusChip/StatusChip';
import form from '../components/ui/FormControls.module.css';
import styles from './DatesPage.module.css';

/* ================================================================
   ICONS (line icons for UI; the colourful doodles come from the kit)
   ================================================================ */
const line = { strokeWidth: 2.6, 'aria-hidden': true };
const CalendarIcon = () => <CalendarDays size={18} {...line} />;
const ClockIcon = () => <Clock size={18} {...line} />;
const TicketIcon = () => <Ticket size={18} {...line} />;
const CashIcon = () => <Banknote size={18} {...line} />;
const RouteIcon = () => <Route size={18} {...line} />;
const FlagIcon = () => <Flag size={16} {...line} />;
const UserIcon = () => <UserRound size={18} {...line} />;
const SparkleIcon = () => <Sparkles size={18} {...line} />;
const EditIcon = () => <Pencil size={20} {...line} />;
const CopyIcon = () => <Copy size={20} {...line} />;
const ArchiveIcon = () => <Archive size={20} {...line} />;
const RestoreIcon = () => <ArchiveRestore size={20} {...line} />;
const TrashIcon = () => <Trash2 size={20} {...line} />;
const CheckIcon = () => <Check size={18} strokeWidth={3.4} aria-hidden="true" />;
const CloseIcon = () => <X size={20} {...line} />;
const GripIcon = () => <GripVertical size={20} {...line} />;
const ChevronDownIcon = () => <ChevronDown size={20} {...line} />;

/* ================================================================
   STATUS + REFERENCE DATA
   ================================================================ */
const STATUS_ORDER = DATE_STATUS_ORDER;

const RESERVATION_META = {
  NOT_NEEDED: { label: 'No reservation needed' },
  PENDING: { label: 'Reservation pending' },
  CONFIRMED: { label: 'Reservation confirmed' },
  CANCELLED: { label: 'Reservation cancelled' },
};

const PRIORITY_LABEL = { HIGH: 'High priority', MEDIUM: 'Medium priority', LOW: 'Low priority' };

// Category -> doodle (replaces the old emoji covers). A date's own title/location keywords win.
const CATEGORY_ICON = {
  outdoors: 'tree',
  travel: 'plane',
  'food & drink': 'utensils',
  food: 'utensils',
  romantic: 'heart',
  'cozy night in': 'house',
  adventure: 'mountain',
  fun: 'sparkle',
  celebration: 'sparkle',
};
const doodleForCategory = (name) => CATEGORY_ICON[(name || '').toLowerCase()] || findDoodle(name) || 'ticket';
const doodleForDate = (date) =>
  findDoodle(`${date.title || ''} ${date.location || ''}`) || CATEGORY_ICON[(date.categoryName || '').toLowerCase()] || 'ticket';

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

/* Count-up used by the statistic tiles (jumps straight to the number if motion is reduced). */
function useCountUp(target, active, duration = 900) {
  const [value, setValue] = useState(0);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (!active || reduceMotion) return undefined;
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
  }, [active, target, duration, reduceMotion]);
  if (!active) return 0;
  return reduceMotion ? target : value;
}

function CircularProgress({ percent }) {
  const size = 44;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={styles.circularProgress} role="img" aria-label={`${percent}% done`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" style={{ stroke: 'var(--sea-tint)' }} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          style={{ stroke: 'var(--citrus)' }}
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

const ChecklistRow = memo(function ChecklistRow({ item, onToggle, onDelete, onSaveTitle, onSaveDetails, onDragEnd }) {
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
      whileDrag={{ scale: 1.02, boxShadow: '5px 5px 0 #172B70', zIndex: 5 }}
      onDragEnd={onDragEnd}
    >
      <button
        className={styles.dragHandle}
        onPointerDown={(e) => dragControls.start(e)}
        aria-label={`Drag to reorder: ${item.title}`}
      >
        <GripIcon />
      </button>

      <button
        className={`${styles.checklistCheckbox} ${item.isCompleted ? styles.checklistCheckboxDone : ''}`}
        onClick={() => onToggle(item)}
        aria-label={`${item.isCompleted ? 'Mark not done' : 'Mark done'}: ${item.title}`}
        aria-pressed={!!item.isCompleted}
      >
        <AnimatePresence>
          {item.isCompleted && (
            <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}>
              <CheckIcon />
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
            aria-label="Step title"
          />
        ) : (
          <button
            type="button"
            className={item.isCompleted ? styles.checklistTextDone : styles.checklistTextEditable}
            onClick={() => setIsEditingTitle(true)}
            aria-label={`Edit step: ${item.title}`}
          >
            {item.title}
          </button>
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
                aria-label="Step description"
                placeholder="Add a description..."
                rows={2}
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                onBlur={commitDetails}
              />
              <div className={styles.checklistExpandRow}>
                <input type="date" aria-label="Step due date" value={draftDueDate} onChange={(e) => { setDraftDueDate(e.target.value); }} onBlur={commitDetails} />
                <select aria-label="Step priority" value={draftPriority} onChange={(e) => { setDraftPriority(e.target.value); }} onBlur={commitDetails}>
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
        aria-expanded={expanded}
      >
        <ChevronDownIcon />
      </button>

      <button className={styles.checklistDeleteBtn} onClick={() => onDelete(item)} aria-label={`Remove step: ${item.title}`}>
        <CloseIcon />
      </button>
    </Reorder.Item>
  );
});

const EMPTY_FORM = {
  title: '', categoryId: '', activityType: '', description: '', location: '', travelMethod: '',
  plannedDate: '', plannedTime: '', durationMinutes: '', priority: 'MEDIUM',
  status: 'DREAMING', reservationStatus: 'NOT_NEEDED', specialOccasion: '',
  estimatedCost: '', coverImageUrl: '', coverDriveFileId: '', coverPreview: '',
};

export default function DatesPage() {
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
  const { addToast } = useNotification();
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllBusy, setDeleteAllBusy] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [drawerDate, setDrawerDate] = useState(null);
  // The drawer keeps its date while it slides out, so the content does not vanish mid-animation.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [checklistDraft, setChecklistDraft] = useState('');
  const checklistInputRef = useRef(null);

  const [coverUploading, setCoverUploading] = useState(false);
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
        if (drawerDate?.id === date.id) setDrawerOpen(false);
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

  const handleDeleteAll = async () => {
    setDeleteAllBusy(true);
    setDeleteAllError('');
    try {
      await dateMutations.deleteAll();
      setDrawerOpen(false);
      setDeleteAllOpen(false);
      addToast('All dates and checklists deleted.', 'success');
    } catch (err) {
      setDeleteAllError(err?.response?.data?.message || 'Could not delete everything. Please try again.');
    } finally {
      setDeleteAllBusy(false);
    }
  };

  /* ---------------------------------------------------------------
     DETAIL DRAWER
  --------------------------------------------------------------- */
  const openDrawer = async (date) => {
    setDrawerDate(date);
    setDrawerOpen(true);
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
  const closeDrawer = () => { setDrawerOpen(false); setChecklistDraft(''); };

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
        // A Drive cover is addressed by file id; its coverImageUrl is a short-lived signed URL.
        coverImageUrl: date.coverDriveFileId ? '' : date.coverImageUrl || '',
        coverDriveFileId: date.coverDriveFileId || '',
        coverPreview: date.coverThumbUrl || date.coverImageUrl || '',
      },
    });
  };

  const closeForm = () => setFormState((prev) => ({ ...prev, open: false }));

  const updateFormField = (field, value) => {
    setFormState((prev) => ({ ...prev, values: { ...prev.values, [field]: value } }));
  };

  // Uploads the chosen cover straight to Google Drive; the date saves only its file id.
  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCoverUploading(true);
    setFormState((prev) => ({ ...prev, error: '' }));
    try {
      const driveFileId = await uploadImageToDrive(file, 'date-covers');
      setFormState((prev) => ({
        ...prev,
        values: { ...prev.values, coverDriveFileId: driveFileId, coverImageUrl: '', coverPreview: URL.createObjectURL(file) },
      }));
    } catch (err) {
      setFormState((prev) => ({ ...prev, error: err?.message || 'Could not upload that image. Please try again.' }));
    } finally {
      setCoverUploading(false);
    }
  };

  const removeCover = () => {
    setFormState((prev) => ({
      ...prev,
      values: { ...prev.values, coverDriveFileId: '', coverImageUrl: '', coverPreview: '' },
    }));
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
    coverDriveFileId: values.coverDriveFileId || '',
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
    const total = date.checklistTotalCount || 0;
    const completed = date.checklistCompletedCount || 0;
    const progressPct = total ? Math.round((completed / total) * 100) : 0;
    const costLabel = formatCost(date.estimatedCost);
    const durationLabel = formatDuration(date.durationMinutes);
    const timeLabel = formatTime(date.plannedTime);
    const reservation = RESERVATION_META[date.reservationStatus] || RESERVATION_META.NOT_NEEDED;
    const tileClass = styles[`tile${(date.status || 'DREAMING').charAt(0)}${(date.status || 'DREAMING').slice(1).toLowerCase()}`] || '';
    const kind = [date.categoryName, date.activityType].filter(Boolean).join(' · ');

    return (
      <li key={date.id}>
        <article className={styles.dateCard} onClick={() => openDrawer(date)}>
          <div className={styles.cardTop}>
            <div className={`${styles.tile} ${tileClass}`}>
              {date.coverImageUrl ? (
                <img src={date.coverThumbUrl || date.coverImageUrl} alt="" className={styles.tileImage} loading="lazy" decoding="async" />
              ) : (
                <Icon name={doodleForDate(date)} size={56} />
              )}
            </div>
            <div className={styles.cardHead}>
              <div className={styles.chipRow}>
                <StatusChip status={date.status} />
                {date.isArchived && <span className={styles.archivedTag}>Archived</span>}
              </div>
              <h2 className={styles.cardTitle}>
                <button type="button" className={styles.cardOpen}>{date.title}</button>
              </h2>
            </div>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={(e) => handleToggleFavorite(date, e)}
              aria-pressed={!!date.isFavorite}
              aria-label={date.isFavorite ? `Remove ${date.title} from favorites` : `Add ${date.title} to favorites`}
            >
              {date.isFavorite ? <Icon name="heart" size={30} /> : <Heart size={22} strokeWidth={2.6} aria-hidden="true" />}
            </button>
          </div>

          <ul className={styles.facts}>
            <li><strong>When</strong> · {formatPlannedDate(date.plannedDate)}{timeLabel ? ` · ${timeLabel}` : ''}{durationLabel ? ` · ${durationLabel}` : ''}</li>
            {date.location && <li><strong>Where</strong> · {date.location}</li>}
            {costLabel && <li><strong>Budget</strong> · {costLabel}</li>}
            {kind && <li><strong>Kind</strong> · {kind}</li>}
            {date.reservationStatus !== 'NOT_NEEDED' && <li><strong>Booking</strong> · {reservation.label}</li>}
            {date.priority && date.priority !== 'MEDIUM' && <li><strong>Priority</strong> · {PRIORITY_DOT_LABEL[date.priority]}</li>}
            {date.createdByName && <li><strong>By</strong> · {date.createdByName}</li>}
          </ul>

          <div className={styles.progress}>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPct}
              aria-label={`${completed} of ${total} steps done`}
            >
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
            <span className={styles.progressLabel}>{completed}/{total} steps</span>
          </div>

          <div className={styles.cardActions}>
            <button type="button" className={styles.iconBtn} aria-label={`Edit ${date.title}`} onClick={(e) => openEditForm(date, e)}><EditIcon /></button>
            <button type="button" className={styles.iconBtn} aria-label={`Duplicate ${date.title}`} onClick={(e) => handleDuplicate(date, e)}><CopyIcon /></button>
            <button type="button" className={styles.iconBtn} aria-label={`${date.isArchived ? 'Restore' : 'Archive'} ${date.title}`} onClick={(e) => handleArchiveToggle(date, e)}>
              {date.isArchived ? <RestoreIcon /> : <ArchiveIcon />}
            </button>
            <span className={styles.spacer} />
            <button type="button" className={`${styles.iconBtn} ${styles.iconBtnDanger}`} aria-label={`Delete ${date.title}`} onClick={(e) => requestDelete(date, e)}><TrashIcon /></button>
          </div>
        </article>
      </li>
    );
  };

  const drawerItems = drawerDate?.checklistItems || [];
  const drawerTotal = drawerItems.length;
  const drawerCompleted = drawerItems.filter((i) => i.isCompleted).length;
  const drawerPercent = drawerTotal ? Math.round((drawerCompleted / drawerTotal) * 100) : 0;
  const drawerAllDone = drawerTotal > 0 && drawerCompleted === drawerTotal;
  const drawerReservation = RESERVATION_META[drawerDate?.reservationStatus] || RESERVATION_META.NOT_NEEDED;

  const field = (id, label, control) => (
    <div className={form.field}>
      <label className={form.label} htmlFor={id}>{label}</label>
      {control}
    </div>
  );
  const values = formState.values;

  return (
    <div className={styles.pageContainer}>
      <Navbar />

      <main className={styles.main}>
        {/* PAGE HEAD + TOOLBAR */}
        <div className={styles.pageHead}>
          <div>
            <p className={styles.handLabel}>everything we still want to do (and eat)</p>
            <h1 className={styles.pageTitle}>Dates &amp; roadtrips</h1>
          </div>
          <div className={styles.toolbar}>
            <label className={styles.searchBar}>
              <Search size={20} strokeWidth={2.6} aria-hidden="true" />
              <span className={styles.srOnly}>Search dates</span>
              <input type="search" placeholder="Search places, food, plans" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </label>
            <Button variant="primary" onClick={openCreateForm}>
              <Plus size={20} strokeWidth={3} aria-hidden="true" />
              New date
            </Button>
          </div>
        </div>

        {(errorMessage || loadError) && (
          <div className={styles.errorBanner} role="alert">
            <Icon name="bell" size={28} />
            <span>{errorMessage || loadError}</span>
          </div>
        )}

        {/* STATS */}
        <ul className={styles.stats}>
          {[
            { label: 'Total planned', value: totalCount, icon: 'ticket' },
            { label: 'Upcoming', value: upcomingCount, icon: 'motmot' },
            { label: 'Completed', value: completedCount, icon: 'sparkle' },
            { label: 'Favorites', value: favoritesCount, icon: 'heart' },
            { label: 'This month', value: monthCount, icon: 'sun' },
          ].map((stat) => (
            <li key={stat.label} className={styles.statCard}>
              <Icon name={stat.icon} size={44} />
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </li>
          ))}
        </ul>

        {/* FILTERS */}
        <div className={styles.filterRow} role="group" aria-label="Filter by status">
          {['ALL', ...STATUS_ORDER, 'ARCHIVED'].map((key) => (
            <button
              key={key}
              type="button"
              className={`${styles.filterChip} ${statusFilter === key ? styles.filterChipActive : ''}`}
              aria-pressed={statusFilter === key}
              onClick={() => setStatusFilter(key)}
            >
              {key === 'ALL' ? 'All' : key === 'ARCHIVED' ? 'Archived' : DATE_STATUS_LABELS[key]}
            </button>
          ))}
        </div>

        {categoryNames.length > 0 && (
          <div className={styles.filterRow} role="group" aria-label="Filter by category">
            <button
              type="button"
              className={`${styles.filterChip} ${!categoryFilter ? styles.filterChipActive : ''}`}
              aria-pressed={!categoryFilter}
              onClick={() => setCategoryFilter(null)}
            >
              All categories
            </button>
            {categoryNames.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`${styles.filterChip} ${categoryFilter === cat ? styles.filterChipActive : ''}`}
                aria-pressed={categoryFilter === cat}
                onClick={() => setCategoryFilter(cat)}
              >
                <Icon name={doodleForCategory(cat)} size={24} />
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* GRID: loading / empty / cards */}
        {loading ? (
          <ul className={styles.dateGrid} aria-busy="true" aria-label="Loading your bucket list">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i}><div className={`${styles.dateCard} ${styles.skeleton}`} /></li>
            ))}
          </ul>
        ) : filteredDates.length === 0 ? (
          <div className={styles.emptyStateCard}>
            <Icon name="motmot" size={96} sticker tilt={-6} />
            {dates.length === 0 ? (
              <>
                <h2 className={styles.emptyTitle}>Let&rsquo;s plan our next adventure together.</h2>
                <p className={styles.emptyText}>Every great memory starts as a small idea. Add the first one.</p>
                <Button variant="primary" onClick={openCreateForm}>
                  <Plus size={20} strokeWidth={3} aria-hidden="true" />
                  Plan our first date
                </Button>
              </>
            ) : (
              <>
                <h2 className={styles.emptyTitle}>Nothing here yet, love</h2>
                <p className={styles.emptyText}>
                  {statusFilter === 'ARCHIVED' ? "You haven't archived any date ideas." : 'No dates match this filter. Try another view, or dream up something new.'}
                </p>
                <Button variant="primary" onClick={openCreateForm}>
                  <Plus size={20} strokeWidth={3} aria-hidden="true" />
                  Add a date idea
                </Button>
              </>
            )}
          </div>
        ) : (
          <ul className={styles.dateGrid}>{filteredDates.map(renderCard)}</ul>
        )}
        {!loading && dates.length > 0 && (
          <div className={styles.dangerZone}>
            <p className={styles.dangerText}>Start over? This removes every date and checklist for both of us.</p>
            <Button onClick={() => { setDeleteAllError(''); setDeleteAllOpen(true); }}>
              <TrashIcon />
              Delete all dates
            </Button>
          </div>
        )}
      </main>

      <DeleteAllDialog
        open={deleteAllOpen}
        what="dates and checklists"
        busy={deleteAllBusy}
        error={deleteAllError}
        onConfirm={handleDeleteAll}
        onClose={() => setDeleteAllOpen(false)}
      />

      {/* DETAIL DRAWER */}
      <Modal
        open={drawerOpen && !!drawerDate}
        onClose={closeDrawer}
        placement="right"
        title={drawerDate?.title}
        ariaLabel="Date details"
        footer={
          drawerDate && (
            <>
              <Button size="sm" onClick={(e) => openEditForm(drawerDate, e)}><EditIcon /> Edit</Button>
              <Button size="sm" onClick={(e) => handleDuplicate(drawerDate, e)}><CopyIcon /> Duplicate</Button>
              <Button size="sm" onClick={(e) => handleArchiveToggle(drawerDate, e)}>
                {drawerDate.isArchived ? <RestoreIcon /> : <ArchiveIcon />} {drawerDate.isArchived ? 'Restore' : 'Archive'}
              </Button>
              <Button size="sm" onClick={(e) => requestDelete(drawerDate, e)}><TrashIcon /> Delete</Button>
            </>
          )
        }
      >
        {drawerDate && (
          <div className={styles.drawerBody}>
            <div className={styles.chipRow}>
              <StatusChip status={drawerDate.status} />
              {drawerDate.isArchived && <span className={styles.archivedTag}>Archived</span>}
            </div>
            {(drawerDate.categoryName || drawerDate.activityType) && (
              <p className={styles.drawerSubline}>{[drawerDate.categoryName, drawerDate.activityType].filter(Boolean).join(' · ')}</p>
            )}
            {drawerDate.coverImageUrl && <img src={drawerDate.coverImageUrl} alt="" className={styles.drawerCover} />}
            {drawerLoading && <div className={styles.drawerLoadingBar} role="status" aria-label="Loading details" />}

            <section className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>Schedule</h3>
              <ul className={styles.factGrid}>
                <li><CalendarIcon /><span>{formatPlannedDate(drawerDate.plannedDate)}</span></li>
                {formatTime(drawerDate.plannedTime) && <li><ClockIcon /><span>{formatTime(drawerDate.plannedTime)}</span></li>}
                {formatDuration(drawerDate.durationMinutes) && <li><ClockIcon /><span>{formatDuration(drawerDate.durationMinutes)} duration</span></li>}
              </ul>
            </section>

            <section className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>Location</h3>
              <ul className={styles.factGrid}>
                {drawerDate.location && <li><Icon name="pin" size={24} /><span>{drawerDate.location}</span></li>}
                {drawerDate.travelMethod && <li><RouteIcon /><span>{drawerDate.travelMethod}</span></li>}
                <li><TicketIcon /><span>{drawerReservation.label}</span></li>
              </ul>
            </section>

            <section className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>Planning</h3>
              <ul className={styles.factGrid}>
                {formatCost(drawerDate.estimatedCost) && <li><CashIcon /><span>{formatCost(drawerDate.estimatedCost)} budget</span></li>}
                <li><FlagIcon /><span>{PRIORITY_LABEL[drawerDate.priority] || PRIORITY_LABEL.MEDIUM}</span></li>
                {drawerDate.specialOccasion && <li><SparkleIcon /><span>{drawerDate.specialOccasion}</span></li>}
                {drawerDate.createdByName && <li><UserIcon /><span>Created by {drawerDate.createdByName}</span></li>}
              </ul>
            </section>

            <section className={styles.drawerSection}>
              <div className={styles.checklistHeader}>
                <h3 className={styles.drawerSectionTitle}>
                  Checklist
                  {drawerTotal > 0 && <span className={styles.drawerSectionCount}>{drawerCompleted}/{drawerTotal}</span>}
                </h3>
                {drawerTotal > 0 && <CircularProgress percent={drawerPercent} />}
              </div>

              {drawerTotal > 0 && (
                <div
                  className={styles.progressTrack}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={drawerPercent}
                  aria-label={`${drawerCompleted} of ${drawerTotal} steps done`}
                  style={{ marginBottom: '14px' }}
                >
                  <div className={styles.progressFill} style={{ width: `${drawerPercent}%` }} />
                </div>
              )}

              <AnimatePresence>
                {drawerAllDone && (
                  <motion.div
                    className={styles.celebrationBanner}
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <Icon name="sparkle" size={52} sticker tilt={-8} />
                    <div>
                      <p className={styles.celebrationTitle}>Every step is done!</p>
                      <p className={styles.celebrationText}>This one&rsquo;s ready. Keep editing anytime.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {drawerItems.length === 0 ? (
                <div className={styles.checklistEmptyState}>
                  <p className={styles.checklistEmptyTitle}>Every great date starts with a little planning.</p>
                  <Button size="sm" onClick={() => checklistInputRef.current?.focus()}>
                    <Plus size={18} strokeWidth={3} aria-hidden="true" />
                    Add first checklist item
                  </Button>
                </div>
              ) : (
                <Reorder.Group as="ul" axis="y" className={styles.checklist} values={drawerItems} onReorder={handleChecklistReorder}>
                  <AnimatePresence initial={false}>
                    {drawerItems.map((item) => (
                      <ChecklistRow
                        key={item.id}
                        item={item}
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
                  aria-label="New checklist step"
                  placeholder="Add a step... (Enter to add)"
                  value={checklistDraft}
                  onChange={(e) => setChecklistDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setChecklistDraft(''); }}
                  maxLength={200}
                />
                <button type="submit" disabled={!checklistDraft.trim()} aria-label="Add step"><Plus size={22} strokeWidth={3} aria-hidden="true" /></button>
              </form>
            </section>

            <section className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>Notes</h3>
              {drawerDate.description ? (
                <p className={styles.drawerNotes}>{drawerDate.description}</p>
              ) : (
                <p className={styles.mutedText}>No notes written for this one yet.</p>
              )}
            </section>
          </div>
        )}
      </Modal>

      {/* CREATE / EDIT FORM MODAL */}
      <Modal
        open={formState.open}
        onClose={closeForm}
        title={formState.mode === 'create' ? 'Plan a new date' : 'Edit this date'}
        size="lg"
        locked={formState.submitting}
      >
        <form onSubmit={handleSubmitForm} className={form.form}>
          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>Basics</legend>
            {field('date-title', 'Title', (
              <input id="date-title" className={form.input} type="text" required placeholder="e.g. Sunset picnic at La Mesa Eco Park"
                value={values.title} onChange={(e) => updateFormField('title', e.target.value)} />
            ))}
            <div className={styles.formRow}>
              {field('date-category', 'Category', (
                <select id="date-category" className={form.select} value={values.categoryId} onChange={(e) => updateFormField('categoryId', e.target.value)}>
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ))}
              {field('date-activity', 'Activity type', (
                <input id="date-activity" className={form.input} type="text" placeholder="e.g. Dinner, Hike, Movie" value={values.activityType || ''}
                  onChange={(e) => updateFormField('activityType', e.target.value)} />
              ))}
            </div>
            {field('date-notes', 'Notes', (
              <textarea id="date-notes" className={form.textarea} rows={3} placeholder="What's the plan..." value={values.description}
                onChange={(e) => updateFormField('description', e.target.value)} />
            ))}
          </fieldset>

          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>Schedule</legend>
            <div className={styles.formRow}>
              {field('date-date', 'Date', (
                <input id="date-date" className={form.input} type="date" value={values.plannedDate} onChange={(e) => updateFormField('plannedDate', e.target.value)} />
              ))}
              {field('date-time', 'Time', (
                <input id="date-time" className={form.input} type="time" value={values.plannedTime} onChange={(e) => updateFormField('plannedTime', e.target.value)} />
              ))}
              {field('date-duration', 'Duration (min)', (
                <input id="date-duration" className={form.input} type="number" min="0" value={values.durationMinutes} onChange={(e) => updateFormField('durationMinutes', e.target.value)} />
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>Location</legend>
            <div className={styles.formRow}>
              {field('date-location', 'Location', (
                <input id="date-location" className={form.input} type="text" placeholder="e.g. Quezon City" value={values.location} onChange={(e) => updateFormField('location', e.target.value)} />
              ))}
              {field('date-travel', 'Travel method', (
                <input id="date-travel" className={form.input} type="text" placeholder="e.g. Car, Walk" value={values.travelMethod} onChange={(e) => updateFormField('travelMethod', e.target.value)} />
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>Planning</legend>
            <div className={styles.formRow}>
              {field('date-priority', 'Priority', (
                <select id="date-priority" className={form.select} value={values.priority} onChange={(e) => updateFormField('priority', e.target.value)}>
                  <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
                </select>
              ))}
              {field('date-reservation', 'Reservation', (
                <select id="date-reservation" className={form.select} value={values.reservationStatus} onChange={(e) => updateFormField('reservationStatus', e.target.value)}>
                  <option value="NOT_NEEDED">Not needed</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              ))}
              {formState.mode === 'edit' && field('date-status', 'Status', (
                <select id="date-status" className={form.select} value={values.status} onChange={(e) => updateFormField('status', e.target.value)}>
                  {STATUS_ORDER.map((s) => <option key={s} value={s}>{DATE_STATUS_LABELS[s]}</option>)}
                </select>
              ))}
            </div>
            <div className={styles.formRow}>
              {field('date-budget', 'Budget', (
                <input id="date-budget" className={form.input} type="number" min="0" step="0.01" placeholder="0.00" value={values.estimatedCost} onChange={(e) => updateFormField('estimatedCost', e.target.value)} />
              ))}
              {field('date-occasion', 'Special occasion', (
                <input id="date-occasion" className={form.input} type="text" placeholder="e.g. Anniversary" value={values.specialOccasion} onChange={(e) => updateFormField('specialOccasion', e.target.value)} />
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>Cover photo</legend>
            {values.coverPreview && (
              <img src={values.coverPreview} alt="Cover preview" className={styles.drawerCover} />
            )}
            {field('date-cover', 'Cover image (optional, up to 15 MB)', (
              <input id="date-cover" className={form.input} type="file" accept="image/*" onChange={handleCoverFile} disabled={coverUploading} />
            ))}
            {coverUploading && <p className={form.hint}>Uploading...</p>}
            {values.coverPreview && !coverUploading && (
              <Button onClick={removeCover}>Remove cover</Button>
            )}
          </fieldset>

          {formState.error && <p className={form.error} role="alert">{formState.error}</p>}

          <div className={form.footer}>
            <Button onClick={closeForm} disabled={formState.submitting}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={formState.submitting || coverUploading}>
              {formState.submitting ? 'Saving...' : formState.mode === 'create' ? 'Create date' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        busyLabel="Removing…"
        busy={confirmBusy}
        onConfirm={handleConfirmAccept}
        onClose={closeConfirm}
      />
    </div>
  );
}
