import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Pencil,
  Plus,
  Search,
  Sparkle,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { memoryService } from '../services/memoryService';
import { useFolders } from '../queries/queries';
import { useMemoryMutations } from '../queries/mutations';
import { uploadToSupabaseStorage } from '../api/supabaseClient';
import { useScrollLock } from '../hooks/useScrollLock';
import { doodleToIconStyle, resolveAlbumIcon, storedDoodle } from '../utils/doodleFor';
import Icon, { ICON_NAMES } from '../components/Icon';
import Navbar from '../components/layout/Navbar/Navbar';
import Footer from '../components/layout/Footer/Footer';
import Button from '../components/ui/Button/Button';
import Modal from '../components/ui/Modal/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog/ConfirmDialog';
import CalendarView from '../components/memories/CalendarDump/CalendarView';
import form from '../components/ui/FormControls.module.css';
import styles from './MemoriesPage.module.css';

// Filled (on) states use the doodle hearts / sparkles; off states are plain line icons.
const HeartToggle = ({ on, size = 22 }) =>
  on ? <Icon name="heart" size={size + 6} /> : <Heart size={size} strokeWidth={2.6} aria-hidden="true" />;
const HighlightToggle = ({ on, size = 22 }) =>
  on ? <Icon name="sparkle" size={size + 6} /> : <Sparkle size={size} strokeWidth={2.6} aria-hidden="true" />;

// Album accent swatches: the thin colour bar beside the title on an album page.
const PALETTE_ACCENTS = [
  { name: 'Citrus', value: '#FF9F1C' },
  { name: 'Sea', value: '#5CB3FF' },
  { name: 'Gelato', value: '#FFE680' },
  { name: 'Amalfi', value: '#1F55C9' },
  { name: 'Ink', value: '#172B70' },
];
const DEFAULT_ACCENT = PALETTE_ACCENTS[0].value;
// Albums saved before the rebrand keep their old hex in the database; show them in the new palette.
const LEGACY_ACCENTS = {
  '#E38A96': '#FF9F1C',
  '#D97785': '#FF9F1C',
  '#C73616': '#FF9F1C',
  '#F4A9B8': '#FFE680',
  '#8FAE7D': '#1F55C9',
  '#3E332E': '#172B70',
};
const displayAccent = (hex) => LEGACY_ACCENTS[(hex || '').toUpperCase()] || hex || DEFAULT_ACCENT;

// Cover tiles for albums with no cover photo cycle through these soft fills.
const COVER_TINTS = ['var(--sea)', 'var(--gelato)', 'var(--citrus-cover)', 'var(--sea-tint)'];

// Doodles offered in the album form (people stay out of the list).
const PICKABLE_DOODLES = ICON_NAMES.filter((name) => name !== 'her' && name !== 'him');

// Framer Motion slide variants for the Lightbox carousel.
// `direction` is 1 when moving forward, -1 when moving backward.
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 70 : direction < 0 ? -70 : 0,
    opacity: 0,
    scale: 0.985,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction) => ({
    x: direction > 0 ? -50 : direction < 0 ? 50 : 0,
    opacity: 0,
    scale: 0.985,
    transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
  }),
};

const SWIPE_DISTANCE_THRESHOLD = 70;
const SWIPE_VELOCITY_THRESHOLD = 450;

export default function MemoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Album list from the shared query cache (fresh for 45s, re-validated in the background).
  const foldersQuery = useFolders(false);
  const folders = useMemo(() => foldersQuery.data ?? [], [foldersQuery.data]);
  const loading = foldersQuery.isPending;
  const loadError = foldersQuery.isError ? 'Unable to load albums. Please check backend connection.' : '';
  const memoryMutations = useMemoryMutations();
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 'albums' | 'calendar' — the Memories page's two viewing modes
  const [viewMode, setViewMode] = useState('albums');

  // Pending Replace/Keep dialog for the "one highlight per day" rule.
  // retry() re-runs whichever save/highlight action hit the conflict, with force=true.
  const [calendarConflict, setCalendarConflict] = useState(null);
  const [calendarConflictBusy, setCalendarConflictBusy] = useState(false);

  // Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Lightbox carousel state: -1 means closed, direction drives the slide animation
  const [lightbox, setLightbox] = useState({ index: -1, direction: 0 });

  // photoId -> 'landscape' | 'portrait' (measured once, reused forever)
  const [orientations, setOrientations] = useState({});

  // Luxury confirmation modal state
  const [confirmState, setConfirmState] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // Form states
  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    accentColor: DEFAULT_ACCENT,
    iconStyle: 'camera',
    coverImageUrl: '',
    eventDate: '',
    isCalendarHighlight: false,
  });

  const [uploadState, setUploadState] = useState({
    file: null,
    previewUrl: null,
    caption: '',
    location: '',
    uploading: false,
  });

  const photos = useMemo(() => selectedFolder?.photos || [], [selectedFolder]);
  const activePhoto = lightbox.index >= 0 ? photos[lightbox.index] : null;
  const isLandscape = activePhoto ? orientations[activePhoto.id] === 'landscape' : false;

  const loadFolderDetails = async (folderId) => {
    try {
      setErrorMessage('');
      const data = await memoryService.getFolderById(folderId);
      setSelectedFolder(data);
      return data;
    } catch (err) {
      console.error('Failed to load folder details', err);
      return null;
    }
  };

  // "Open Album" from a Calendar Dump day — jump back to the Albums view
  // with that album already open.
  const handleOpenAlbumFromCalendar = async (folderId) => {
    setViewMode('albums');
    await loadFolderDetails(folderId);
  };

  /* ---------------------------------------------------------------
     LIGHTBOX CAROUSEL
  --------------------------------------------------------------- */

  const openLightbox = (index) => setLightbox({ index, direction: 0 });
  const closeLightbox = useCallback(() => setLightbox({ index: -1, direction: 0 }), []);

  // Deep-link from a notification ("?folderId=...", optionally "&photoId=...")
  // — open that folder (and photo, if present) once, then strip the params.
  useEffect(() => {
    const folderId = searchParams.get('folderId');
    if (!folderId) return undefined;
    let cancelled = false;
    (async () => {
      const data = await loadFolderDetails(folderId);
      if (cancelled) return;
      if (data) {
        const photoId = searchParams.get('photoId');
        if (photoId) {
          const idx = (data.photos || []).findIndex((p) => p.id === photoId);
          if (idx >= 0) openLightbox(idx);
        }
      }
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('folderId');
        next.delete('photoId');
        return next;
      }, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const paginate = useCallback(
    (direction) => {
      setLightbox((prev) => {
        if (prev.index < 0 || photos.length < 2) return prev;
        const next = (prev.index + direction + photos.length) % photos.length;
        return { index: next, direction };
      });
    },
    [photos.length]
  );

  // Measure orientation once per photo. Called from both the grid thumbnails
  // (so the Lightbox already knows the shape before it opens) and the Lightbox image.
  const recordOrientation = useCallback((photo, event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) return;
    const orientation = naturalWidth / naturalHeight >= 1.15 ? 'landscape' : 'portrait';
    setOrientations((prev) => (prev[photo.id] === orientation ? prev : { ...prev, [photo.id]: orientation }));
  }, []);

  const handleDragEnd = (_event, info) => {
    const offsetX = info.offset.x;
    const velocityX = info.velocity.x;

    if (offsetX < -SWIPE_DISTANCE_THRESHOLD || velocityX < -SWIPE_VELOCITY_THRESHOLD) {
      paginate(1);
    } else if (offsetX > SWIPE_DISTANCE_THRESHOLD || velocityX > SWIPE_VELOCITY_THRESHOLD) {
      paginate(-1);
    }
  };

  // Keyboard navigation: Arrows browse the album, Escape closes the topmost layer.
  useEffect(() => {
    if (lightbox.index < 0) return undefined;

    const handleKeyDown = (e) => {
      // A shared Modal on top (confirm dialog) already handled this key: leave the lightbox open.
      if (e.defaultPrevented) return;

      if (confirmState) {
        // The confirmation modal owns Escape while it is open.
        if (e.key === 'Escape' && !confirmBusy) {
          e.preventDefault();
          setConfirmState(null);
          setConfirmError('');
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        paginate(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        paginate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox.index, confirmState, confirmBusy, paginate, closeLightbox]);

  // The lightbox is the one overlay that isn't a shared Modal, so it locks page scroll itself.
  useScrollLock(lightbox.index >= 0);

  // Move focus into the lightbox when it opens and back to what opened it when it closes.
  const lightboxCloseRef = useRef(null);
  const lightboxOpen = lightbox.index >= 0;
  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const opener = document.activeElement;
    const frame = requestAnimationFrame(() => lightboxCloseRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, [lightboxOpen]);

  /* ---------------------------------------------------------------
     LUXURY CONFIRMATION MODAL
  --------------------------------------------------------------- */

  const closeConfirm = () => {
    if (confirmBusy) return;
    setConfirmState(null);
    setConfirmError('');
  };

  const handleConfirmAccept = async () => {
    if (!confirmState || confirmBusy) return;
    try {
      setConfirmBusy(true);
      setConfirmError('');
      await confirmState.onConfirm();
      setConfirmState(null);
    } catch (err) {
      console.error('Confirmed action failed', err);
      setConfirmError('Something went wrong. Please try again.');
    } finally {
      setConfirmBusy(false);
    }
  };

  /* ---------------------------------------------------------------
     FOLDERS
  --------------------------------------------------------------- */

  // Open Create / Edit Folder Modal
  const openFolderModal = (folder = null) => {
    setErrorMessage('');
    if (folder) {
      setEditingFolder(folder);
      setFolderForm({
        name: folder.name || '',
        description: folder.description || '',
        accentColor: displayAccent(folder.accentColor),
        iconStyle: folder.iconStyle || 'camera',
        coverImageUrl: folder.coverImageUrl || '',
        eventDate: folder.eventDate || '',
        isCalendarHighlight: !!folder.isCalendarHighlight,
      });
    } else {
      setEditingFolder(null);
      setFolderForm({
        name: '',
        description: '',
        accentColor: DEFAULT_ACCENT,
        iconStyle: 'camera',
        coverImageUrl: '',
        eventDate: '',
        isCalendarHighlight: false,
      });
    }
    setIsFolderModalOpen(true);
  };

  // Save Folder (Create/Update Album). `force` re-submits after the user chose
  // "Replace Existing Highlight" in the calendar conflict dialog.
  const saveFolder = async (force = false) => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        name: folderForm.name.trim(),
        description: folderForm.description.trim(),
        accentColor: folderForm.accentColor || DEFAULT_ACCENT,
        iconStyle: folderForm.iconStyle || 'camera',
        coverImageUrl: folderForm.coverImageUrl || '',
        eventDate: folderForm.eventDate || null,
        isCalendarHighlight: folderForm.isCalendarHighlight,
      };

      if (editingFolder) {
        await memoryMutations.updateFolder(editingFolder.id, payload, force);
      } else {
        await memoryMutations.createFolder(payload);
      }

      setIsFolderModalOpen(false);

      if (selectedFolder && editingFolder?.id === selectedFolder.id) {
        await loadFolderDetails(selectedFolder.id);
      }
    } catch (err) {
      if (err?.response?.status === 409) {
        setCalendarConflict({ conflict: err.response.data.data, retry: () => saveFolder(true) });
      } else {
        console.error('Failed to save folder:', err);
        setErrorMessage(err?.response?.data?.message || 'Failed to save album. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveFolder = async (e) => {
    e.preventDefault();
    if (!folderForm.name.trim()) return;
    if (folderForm.isCalendarHighlight && !folderForm.eventDate) {
      setErrorMessage('Add a "Date Happened" before turning on Calendar Dump.');
      return;
    }
    await saveFolder(false);
  };

  // Delete Folder — routed through the frosted glass confirmation modal
  const requestDeleteFolder = (folder, e) => {
    e.stopPropagation();
    setConfirmError('');
    setConfirmState({
      title: 'Delete this album?',
      message: `“${folder.name}” and every memory tucked inside it will be gone, love. This one can’t be undone.`,
      confirmLabel: 'Delete Album',
      onConfirm: async () => {
        await memoryMutations.deleteFolder(folder.id);
        if (selectedFolder?.id === folder.id) {
          closeLightbox();
          setSelectedFolder(null);
        }
      },
    });
  };

  /* ---------------------------------------------------------------
     PHOTOS
  --------------------------------------------------------------- */

  // Handle Photo File Select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError('');
    setUploadState((prev) => ({
      ...prev,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
  };

  // Upload Photo to Supabase & Save via API
  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!uploadState.file || !selectedFolder) return;

    try {
      setUploadError('');
      setUploadState((prev) => ({ ...prev, uploading: true }));

      // Upload to Supabase Storage
      const { photoUrl, storagePath } = await uploadToSupabaseStorage(
        uploadState.file,
        `photos/folder_${selectedFolder.id}`
      );

      // Save Metadata to Backend
      await memoryMutations.addPhotoToFolder(selectedFolder.id, {
        photoUrl,
        storagePath,
        caption: uploadState.caption,
        location: uploadState.location,
      });

      setUploadState({
        file: null,
        previewUrl: null,
        caption: '',
        location: '',
        uploading: false,
      });
      setIsUploadModalOpen(false);
      await loadFolderDetails(selectedFolder.id);
    } catch (err) {
      console.error('Photo upload failed', err);
      setUploadState((prev) => ({ ...prev, uploading: false }));
      setUploadError('Photo upload failed. Please try again.');
    }
  };

  // Toggle Favorite Status
  const handleToggleFavorite = async (photo, e) => {
    e?.stopPropagation();
    try {
      await memoryMutations.updatePhoto(photo.id, {
        isFavorite: !photo.isFavorite,
      });
      if (selectedFolder) {
        await loadFolderDetails(selectedFolder.id);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  // Set (or clear) this photo as the album's one Calendar Dump highlight.
  // `force` re-submits after "Replace Existing Highlight" is chosen.
  const setPhotoHighlight = async (photo, force = false) => {
    if (!selectedFolder) return;
    try {
      if (photo.id === selectedFolder.highlightPhotoId) {
        await memoryMutations.clearCalendarHighlight(selectedFolder.id);
      } else {
        await memoryMutations.setCalendarHighlight(selectedFolder.id, photo.id, force);
      }
      await loadFolderDetails(selectedFolder.id);
    } catch (err) {
      if (err?.response?.status === 409) {
        setCalendarConflict({ conflict: err.response.data.data, retry: () => setPhotoHighlight(photo, true) });
      } else {
        console.error('Failed to update calendar highlight', err);
        setErrorMessage(err?.response?.data?.message || 'Could not update the calendar highlight. Please try again.');
      }
    }
  };

  // Delete Photo — routed through the frosted glass confirmation modal
  const requestDeletePhoto = (photo) => {
    const remainingAfterDelete = photos.length - 1;
    setConfirmError('');
    setConfirmState({
      title: 'Remove this memory?',
      message:
        'Are you sure you want to remove this memory, love? Once it leaves the archive, we can’t bring it back.',
      confirmLabel: 'Remove Memory',
      onConfirm: async () => {
        await memoryMutations.deletePhoto(photo.id);

        if (remainingAfterDelete <= 0) {
          closeLightbox();
        } else {
          setLightbox((prev) => ({
            index: Math.min(Math.max(prev.index, 0), remainingAfterDelete - 1),
            direction: 0,
          }));
        }

        if (selectedFolder) {
          await loadFolderDetails(selectedFolder.id);
        }
      },
    });
  };

  // Filtered Folders based on Search
  const filteredFolders = useMemo(() => {
    return folders.filter((f) =>
      f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [folders, searchQuery]);

  const openAlbumFromCard = (folder, e) => {
    e?.stopPropagation();
    loadFolderDetails(folder.id);
  };

  const closeFolderModal = () => setIsFolderModalOpen(false);
  const closeUploadModal = () => setIsUploadModalOpen(false);
  const pickedDoodle = storedDoodle(folderForm.iconStyle);
  const showHighlightControls = !!(selectedFolder?.isCalendarHighlight && selectedFolder?.eventDate);

  // Same panel for portrait (sidebar) and landscape (bottom bar) photos.
  const lightboxPanel = activePhoto && (
    <div className={styles.lightboxPanel}>
      <div className={styles.lightboxActions}>
        {showHighlightControls && (
          <Button size="sm" onClick={() => setPhotoHighlight(activePhoto)}>
            <HighlightToggle on={activePhoto.id === selectedFolder.highlightPhotoId} size={20} />
            {activePhoto.id === selectedFolder.highlightPhotoId ? 'Highlighted' : 'Highlight'}
          </Button>
        )}
        <Button size="sm" onClick={(e) => handleToggleFavorite(activePhoto, e)}>
          <HeartToggle on={activePhoto.isFavorite} size={20} />
          {activePhoto.isFavorite ? 'Favorited' : 'Favorite'}
        </Button>
        <Button size="sm" onClick={() => requestDeletePhoto(activePhoto)}>
          <Trash2 size={20} strokeWidth={2.6} aria-hidden="true" />
          Delete
        </Button>
      </div>

      <p className={styles.lightboxCaption}>{activePhoto.caption || 'No caption provided.'}</p>

      {activePhoto.location && (
        <span className={styles.locationTag}>
          <Icon name="pin" size={22} />
          {activePhoto.location}
        </span>
      )}
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <Navbar />

      <main className={`${styles.main} ${viewMode === 'calendar' ? styles.mainWide : ''}`}>
        {/* PAGE HEAD + TOOLBAR */}
        <div className={styles.pageHead}>
          <div>
            <p className={styles.handLabel}>every album is a little pocket of time</p>
            <h1 className={styles.pageTitle}>Our memories</h1>
          </div>
          <div className={styles.toolbar}>
            <label className={styles.searchBar}>
              <Search size={20} strokeWidth={2.6} aria-hidden="true" />
              <span className={styles.srOnly}>Search albums</span>
              <input
                type="search"
                placeholder="Search albums or captions"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
            <Button variant="primary" onClick={() => openFolderModal()}>
              <Plus size={20} strokeWidth={3} aria-hidden="true" />
              New album
            </Button>
          </div>
        </div>

        {/* VIEW SWITCHER */}
        <div className={styles.tabs} role="tablist" aria-label="View">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'albums'}
            className={`${styles.tab} ${viewMode === 'albums' ? styles.tabActive : ''}`}
            onClick={() => setViewMode('albums')}
          >
            <Icon name="film" size={26} />
            Albums
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'calendar'}
            className={`${styles.tab} ${viewMode === 'calendar' ? styles.tabActive : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            <Icon name="sparkle" size={26} />
            Calendar dump
          </button>
        </div>

        {(errorMessage || loadError) && (
          <div className={styles.errorBanner} role="alert">
            <Icon name="bell" size={28} />
            <span>{errorMessage || loadError}</span>
          </div>
        )}

        {/* VIEW: CALENDAR DUMP */}
        {viewMode === 'calendar' && <CalendarView onOpenAlbum={handleOpenAlbumFromCalendar} />}

        {/* VIEW 1: ALBUMS GRID */}
        {viewMode === 'albums' && !selectedFolder && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {loading ? (
              <div className={styles.folderGrid} aria-busy="true" aria-label="Loading your albums">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`${styles.folderCard} ${styles.skeleton}`} />
                ))}
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className={styles.emptyStateCard}>
                <Icon name="camera" size={88} sticker tilt={-6} />
                <p>{searchQuery ? 'No albums match that search, love.' : 'No albums created yet, love.'}</p>
                {!searchQuery && (
                  <Button variant="primary" onClick={() => openFolderModal()}>
                    <Plus size={20} strokeWidth={3} aria-hidden="true" />
                    Create your first memory album
                  </Button>
                )}
              </div>
            ) : (
              <div className={styles.folderGrid}>
                {filteredFolders.map((folder, i) => (
                  <article key={folder.id} className={styles.folderCard}>
                    <div
                      className={styles.cover}
                      style={folder.coverImageUrl ? undefined : { background: COVER_TINTS[i % COVER_TINTS.length] }}
                      onClick={(e) => openAlbumFromCard(folder, e)}
                    >
                      {folder.coverImageUrl ? (
                        <img src={folder.coverImageUrl} alt="" className={styles.coverImage} loading="lazy" decoding="async" />
                      ) : (
                        <Icon name={resolveAlbumIcon(folder)} size={96} className={styles.coverIcon} />
                      )}
                      <span className={styles.photoBadge}>
                        {folder.photoCount || 0} {folder.photoCount === 1 ? 'photo' : 'photos'}
                      </span>
                    </div>

                    <div className={styles.folderBody}>
                      <div className={styles.folderText}>
                        <h2 className={styles.folderTitle}>
                          <button type="button" className={styles.folderOpen} onClick={(e) => openAlbumFromCard(folder, e)}>
                            {folder.name}
                          </button>
                        </h2>
                        {folder.description && <p className={styles.folderDesc}>{folder.description}</p>}
                      </div>
                      <div className={styles.folderActions}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            openFolderModal(folder);
                          }}
                          aria-label={`Edit album ${folder.name}`}
                        >
                          <Pencil size={20} strokeWidth={2.6} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={(e) => requestDeleteFolder(folder, e)}
                          aria-label={`Delete album ${folder.name}`}
                        >
                          <Trash2 size={20} strokeWidth={2.6} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}

                <button type="button" className={styles.newAlbumTile} onClick={() => openFolderModal()}>
                  <Icon name="dog" size={96} sticker tilt={-6} />
                  <span className={styles.newAlbumTitle}>Start a new album</span>
                  <span className={styles.newAlbumHand}>what are we keeping next?</span>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 2: SELECTED ALBUM GALLERY */}
        {viewMode === 'albums' && selectedFolder && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className={styles.albumHeader}>
              <Button size="sm" onClick={() => setSelectedFolder(null)}>
                <ArrowLeft size={20} strokeWidth={2.8} aria-hidden="true" />
                All albums
              </Button>

              <div className={styles.albumTitleBlock}>
                <span className={styles.accentBar} style={{ backgroundColor: displayAccent(selectedFolder.accentColor) }} aria-hidden="true" />
                <div>
                  <h2 className={styles.albumHeading}>{selectedFolder.name}</h2>
                  <p className={styles.albumMeta}>{selectedFolder.description || 'Private collection'}</p>
                  {showHighlightControls && (
                    <span className={styles.calendarBadge}>
                      <Icon name="sparkle" size={22} />
                      {selectedFolder.highlightPhotoId ? 'On the calendar' : 'Pick a highlight photo below'} · {selectedFolder.eventDate}
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => {
                  setUploadError('');
                  setIsUploadModalOpen(true);
                }}
              >
                <Upload size={20} strokeWidth={2.8} aria-hidden="true" />
                Add photo
              </Button>
            </div>

            {/* GALLERY GRID */}
            {photos.length === 0 ? (
              <div className={styles.emptyStateCard}>
                <Icon name="camera" size={88} sticker tilt={-6} />
                <p>This album is quiet. Upload a photo to start keeping memories here.</p>
                <Button
                  variant="primary"
                  onClick={() => {
                    setUploadError('');
                    setIsUploadModalOpen(true);
                  }}
                >
                  <Upload size={20} strokeWidth={2.8} aria-hidden="true" />
                  Upload first photo
                </Button>
              </div>
            ) : (
              <ul className={styles.photoGrid}>
                {photos.map((photo, index) => {
                  const isHighlight = photo.id === selectedFolder.highlightPhotoId;
                  return (
                    <li key={photo.id} className={styles.photoCard}>
                      <button
                        type="button"
                        className={styles.photoOpen}
                        onClick={() => openLightbox(index)}
                        aria-label={`Open photo${photo.caption ? `: ${photo.caption}` : ` ${index + 1}`}`}
                      >
                        <img
                          src={photo.photoUrl}
                          alt=""
                          className={styles.photoImage}
                          loading="lazy"
                          decoding="async"
                          onLoad={(e) => recordOrientation(photo, e)}
                        />
                      </button>

                      {/* Always visible: no hover needed, so they work on phones */}
                      <div className={styles.photoActions}>
                        {showHighlightControls && (
                          <button
                            type="button"
                            className={styles.roundBtn}
                            onClick={() => setPhotoHighlight(photo)}
                            aria-pressed={isHighlight}
                            aria-label={isHighlight ? 'Remove as calendar highlight' : 'Set as calendar highlight'}
                          >
                            <HighlightToggle on={isHighlight} />
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.roundBtn}
                          onClick={(e) => handleToggleFavorite(photo, e)}
                          aria-pressed={!!photo.isFavorite}
                          aria-label={photo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <HeartToggle on={photo.isFavorite} />
                        </button>
                      </div>

                      {photo.caption && <p className={styles.photoCaption}>{photo.caption}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </main>

      {/* MODAL 1: CREATE / EDIT ALBUM */}
      <Modal open={isFolderModalOpen} onClose={closeFolderModal} title={editingFolder ? 'Edit memory album' : 'Create new album'} locked={submitting}>
        <form onSubmit={handleSaveFolder} className={form.form}>
          <div className={form.field}>
            <label className={form.label} htmlFor="album-name">Album name</label>
            <input
              id="album-name"
              className={form.input}
              type="text"
              required
              placeholder="e.g. Sunset in La Union"
              value={folderForm.name}
              onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
            />
          </div>

          <div className={form.field}>
            <label className={form.label} htmlFor="album-desc">Description / note</label>
            <textarea
              id="album-desc"
              className={form.textarea}
              rows={3}
              placeholder="Brief memory description..."
              value={folderForm.description}
              onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
            />
          </div>

          <fieldset className={styles.fieldset}>
            <legend className={form.label}>Album doodle</legend>
            <p className={form.hint}>Shown when the album has no cover photo. Automatic picks one from the album name.</p>
            <div className={styles.doodleGrid} role="radiogroup" aria-label="Album doodle">
              <button
                type="button"
                role="radio"
                aria-checked={!pickedDoodle}
                className={`${styles.doodleOption} ${styles.doodleAuto} ${!pickedDoodle ? styles.doodleActive : ''}`}
                onClick={() => setFolderForm({ ...folderForm, iconStyle: doodleToIconStyle(null) })}
              >
                <Icon name={resolveAlbumIcon({ name: folderForm.name })} size={30} />
                Automatic
              </button>
              {PICKABLE_DOODLES.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={pickedDoodle === name}
                  aria-label={name}
                  title={name}
                  className={`${styles.doodleOption} ${pickedDoodle === name ? styles.doodleActive : ''}`}
                  onClick={() => setFolderForm({ ...folderForm, iconStyle: doodleToIconStyle(name) })}
                >
                  <Icon name={name} size={32} />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={form.label}>Accent color</legend>
            <div className={styles.palette} role="radiogroup" aria-label="Accent color">
              {PALETTE_ACCENTS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={folderForm.accentColor === item.value}
                  aria-label={item.name}
                  title={item.name}
                  className={`${styles.swatch} ${folderForm.accentColor === item.value ? styles.swatchActive : ''}`}
                  style={{ backgroundColor: item.value }}
                  onClick={() => setFolderForm({ ...folderForm, accentColor: item.value })}
                />
              ))}
            </div>
          </fieldset>

          <div className={form.field}>
            <label className={form.label} htmlFor="album-date">Date happened</label>
            <input
              id="album-date"
              className={form.input}
              type="date"
              value={folderForm.eventDate}
              onChange={(e) => setFolderForm({ ...folderForm, eventDate: e.target.value })}
            />
          </div>

          <div className={form.switchRow}>
            <label className={form.switch}>
              <input
                type="checkbox"
                checked={folderForm.isCalendarHighlight}
                onChange={(e) => setFolderForm({ ...folderForm, isCalendarHighlight: e.target.checked })}
                aria-label="Add to Calendar Dump"
              />
              <span className={form.switchTrack}><span className={form.switchThumb} /></span>
            </label>
            <div className={form.switchText}>
              <p className={form.switchTitle}>Add to Calendar Dump</p>
              <p className={form.hint}>
                {editingFolder && editingFolder.photoCount > 0
                  ? 'Once saved, pick one photo from this album as its calendar highlight.'
                  : 'You’ll pick a highlight photo after adding photos to this album.'}
              </p>
            </div>
          </div>

          {errorMessage && <p className={form.error} role="alert">{errorMessage}</p>}

          <div className={form.footer}>
            <Button onClick={closeFolderModal} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingFolder ? 'Save changes' : 'Create album'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: UPLOAD PHOTO */}
      <Modal open={isUploadModalOpen} onClose={closeUploadModal} title="Add photo to album" locked={uploadState.uploading}>
        <form onSubmit={handleUploadPhoto} className={form.form}>
          <label className={styles.dropZone}>
            {uploadState.previewUrl ? (
              <img src={uploadState.previewUrl} alt="Preview of the chosen photo" className={styles.uploadPreview} />
            ) : (
              <span className={styles.dropPrompt}>
                <Icon name="camera" size={64} />
                <span>Click or drag a photo here to upload</span>
              </span>
            )}
            <input type="file" accept="image/*" required onChange={handleFileChange} aria-label="Choose a photo" />
          </label>

          <div className={form.field}>
            <label className={form.label} htmlFor="photo-caption">Caption</label>
            <input
              id="photo-caption"
              className={form.input}
              type="text"
              placeholder="A sweet phrase or note..."
              value={uploadState.caption}
              onChange={(e) => setUploadState({ ...uploadState, caption: e.target.value })}
            />
          </div>

          <div className={form.field}>
            <label className={form.label} htmlFor="photo-location">Location (optional)</label>
            <input
              id="photo-location"
              className={form.input}
              type="text"
              placeholder="e.g. Quezon City"
              value={uploadState.location}
              onChange={(e) => setUploadState({ ...uploadState, location: e.target.value })}
            />
          </div>

          {uploadError && <p className={form.error} role="alert">{uploadError}</p>}

          <div className={form.footer}>
            <Button onClick={closeUploadModal} disabled={uploadState.uploading}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={uploadState.uploading || !uploadState.file}>
              {uploadState.uploading ? 'Uploading...' : 'Save photo'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* LIGHTBOX PHOTO PREVIEW + CAROUSEL */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            className={styles.lightboxBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeLightbox}
          >
            <motion.div
              className={`${styles.lightboxContent} ${isLandscape ? styles.lightboxLandscape : ''}`}
              role="dialog"
              aria-modal="true"
              aria-label="Photo viewer"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* IMAGE STAGE: draggable carousel */}
              <div className={styles.lightboxStage}>
                <motion.div
                  className={styles.imageDragLayer}
                  drag={photos.length > 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.18}
                  dragMomentum={false}
                  onDragEnd={handleDragEnd}
                >
                  <AnimatePresence initial={false} mode="wait" custom={lightbox.direction}>
                    <motion.img
                      key={activePhoto.id}
                      src={activePhoto.photoUrl}
                      alt={activePhoto.caption || 'Memory'}
                      className={styles.lightboxImage}
                      custom={lightbox.direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      draggable={false}
                      onLoad={(e) => recordOrientation(activePhoto, e)}
                    />
                  </AnimatePresence>
                </motion.div>

                <button
                  type="button"
                  ref={lightboxCloseRef}
                  className={`${styles.stageBtn} ${styles.stageClose}`}
                  onClick={closeLightbox}
                  aria-label="Close preview"
                >
                  <X size={22} strokeWidth={2.8} aria-hidden="true" />
                </button>

                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      className={`${styles.stageBtn} ${styles.stagePrev}`}
                      onClick={() => paginate(-1)}
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={24} strokeWidth={2.8} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.stageBtn} ${styles.stageNext}`}
                      onClick={() => paginate(1)}
                      aria-label="Next photo"
                    >
                      <ChevronRight size={24} strokeWidth={2.8} aria-hidden="true" />
                    </button>
                    <span className={styles.counter} aria-live="polite">
                      {lightbox.index + 1} / {photos.length}
                    </span>
                  </>
                )}
              </div>

              {lightboxPanel}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel || 'Confirm Delete'}
        busyLabel="Removing…"
        busy={confirmBusy}
        error={confirmError}
        onConfirm={handleConfirmAccept}
        onClose={closeConfirm}
      />

      {/* CALENDAR CONFLICT DIALOG: "one highlight per day" */}
      <ConfirmDialog
        open={!!calendarConflict}
        title="This day already has a highlighted memory"
        message={
          calendarConflict
            ? `“${calendarConflict.conflict.conflictingFolderName}” is already highlighted on ${calendarConflict.conflict.eventDate}. Replacing it will remove that album from the calendar.`
            : ''
        }
        cancelLabel="Keep Existing Highlight"
        confirmLabel="Replace Existing Highlight"
        busyLabel="Replacing…"
        busy={calendarConflictBusy}
        onClose={() => setCalendarConflict(null)}
        onConfirm={async () => {
          setCalendarConflictBusy(true);
          try {
            await calendarConflict.retry();
            setCalendarConflict(null);
          } catch (err) {
            console.error('Failed to replace calendar highlight', err);
            setErrorMessage('Could not replace the existing highlight. Please try again.');
          } finally {
            setCalendarConflictBusy(false);
          }
        }}
      >
        {calendarConflict?.conflict.conflictingHighlightPhotoUrl && (
          <img src={calendarConflict.conflict.conflictingHighlightPhotoUrl} alt="" className={styles.conflictThumb} />
        )}
      </ConfirmDialog>

      <Footer />
    </div>
  );
}
