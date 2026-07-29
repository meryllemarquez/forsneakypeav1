import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { memoryService } from '../services/memoryService';
import { uploadToSupabaseStorage } from '../api/supabaseClient';
import styles from './MemoriesPage.module.css';

// Minimal Lucide Outline Icons
const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const FolderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#C73616" : "none"} stroke={filled ? "#C73616" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const AlertIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const PALETTE_ACCENTS = [
  { name: 'Burnt Red', value: '#C73616' },
  { name: 'Deep Burgundy', value: '#8C230F' },
  { name: 'Golden Ochre', value: '#A88A2B' },
  { name: 'Warm Cream', value: '#E8D7BC' },
  { name: 'Dark Charcoal', value: '#1F1F1F' },
];

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
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    accentColor: '#C73616',
    iconStyle: 'camera',
    coverImageUrl: '',
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

  useEffect(() => {
    let isMounted = true;

    const fetchInitialFolders = async () => {
      try {
        const data = await memoryService.getFolders(false);
        if (isMounted) setFolders(data);
      } catch (err) {
        console.error('Failed to load memory folders', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialFolders();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await memoryService.getFolders(false);
      setFolders(data || []);
    } catch (err) {
      console.error('Failed to load memory folders', err);
      setErrorMessage('Unable to load albums. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadFolderDetails = async (folderId) => {
    try {
      setErrorMessage('');
      const data = await memoryService.getFolderById(folderId);
      setSelectedFolder(data);
    } catch (err) {
      console.error('Failed to load folder details', err);
    }
  };

  /* ---------------------------------------------------------------
     LIGHTBOX CAROUSEL
  --------------------------------------------------------------- */

  const openLightbox = (index) => setLightbox({ index, direction: 0 });
  const closeLightbox = useCallback(() => setLightbox({ index: -1, direction: 0 }), []);

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

  // Lock body scroll while any overlay is open
  useEffect(() => {
    const anyOverlayOpen =
      isFolderModalOpen || isUploadModalOpen || lightbox.index >= 0 || !!confirmState;

    if (!anyOverlayOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFolderModalOpen, isUploadModalOpen, lightbox.index, confirmState]);

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
        accentColor: folder.accentColor || '#C73616',
        iconStyle: folder.iconStyle || 'camera',
        coverImageUrl: folder.coverImageUrl || '',
      });
    } else {
      setEditingFolder(null);
      setFolderForm({
        name: '',
        description: '',
        accentColor: '#C73616',
        iconStyle: 'camera',
        coverImageUrl: '',
      });
    }
    setIsFolderModalOpen(true);
  };

  // Save Folder (Create/Update Album)
  const handleSaveFolder = async (e) => {
    e.preventDefault();
    if (!folderForm.name.trim()) return;

    try {
      setSubmitting(true);
      setErrorMessage('');

      if (editingFolder) {
        await memoryService.updateFolder(editingFolder.id, folderForm);
      } else {
        await memoryService.createFolder({
          name: folderForm.name.trim(),
          description: folderForm.description.trim(),
          accentColor: folderForm.accentColor || '#C73616',
          iconStyle: folderForm.iconStyle || 'camera',
          coverImageUrl: folderForm.coverImageUrl || '',
        });
      }

      setIsFolderModalOpen(false);
      await loadFolders();

      if (selectedFolder && editingFolder?.id === selectedFolder.id) {
        await loadFolderDetails(selectedFolder.id);
      }
    } catch (err) {
      console.error('Failed to save folder:', err);
      setErrorMessage(err?.response?.data?.message || 'Failed to save album. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
        await memoryService.deleteFolder(folder.id);
        if (selectedFolder?.id === folder.id) {
          closeLightbox();
          setSelectedFolder(null);
        }
        await loadFolders();
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
      await memoryService.addPhotoToFolder(selectedFolder.id, {
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
      await loadFolders();
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
      await memoryService.updatePhoto(photo.id, {
        isFavorite: !photo.isFavorite,
      });
      if (selectedFolder) {
        await loadFolderDetails(selectedFolder.id);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
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
        await memoryService.deletePhoto(photo.id);

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
        await loadFolders();
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

  return (
    <div className={styles.pageContainer}>
      {/* 1. EDITORIAL NAVBAR (Matching HomePage style) */}
      <header className={styles.navbar}>
        <div className={styles.navLeft}>
          <button className={styles.backHomeBtn} onClick={() => navigate('/home')}>
            <ArrowLeftIcon />
            <span>Sanctuary</span>
          </button>
          <span className={styles.navDivider}>/</span>
          <span className={styles.navBrand}>FOR SNEAKYPEA</span>
          <span className={styles.navDivider}>/</span>
          <span className={styles.navSubBrand}>Memories</span>
        </div>

        <div className={styles.searchBar}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search albums or captions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.navRight}>
          <button
            className={styles.primaryActionBtn}
            onClick={() => openFolderModal()}
          >
            <PlusIcon />
            <span>New Album</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN EDITORIAL CONTENT */}
      <main className={styles.contentWrapper}>
        {errorMessage && (
          <div className={styles.errorBanner}>{errorMessage}</div>
        )}

        {/* VIEW 1: ALBUMS GRID */}
        {!selectedFolder && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.heroHeader}>
              <div className={styles.heroBadge}>
                <FolderIcon />
                <span>Memory Archives</span>
              </div>
              <h1 className={styles.pageTitle}>Our Shared Albums</h1>
              <p className={styles.pageSubtitle}>
                A quiet digital vault dedicated to the moments, dates, and memories shared between Merylle and Cj.
              </p>
            </div>

            {loading ? (
              <div className={styles.loadingState}>Loading sanctuary memories...</div>
            ) : filteredFolders.length === 0 ? (
              <div className={styles.emptyStateCard}>
                <p>No albums created yet, love.</p>
                <button className={styles.primaryActionBtn} onClick={() => openFolderModal()}>
                  <PlusIcon />
                  <span>Create Your First Memory Album</span>
                </button>
              </div>
            ) : (
              <div className={styles.folderGrid}>
                {filteredFolders.map((folder) => (
                  <motion.div
                    key={folder.id}
                    className={styles.folderCard}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => loadFolderDetails(folder.id)}
                  >
                    <div className={styles.coverImageWrapper}>
                      {folder.coverImageUrl ? (
                        <img src={folder.coverImageUrl} alt={folder.name} className={styles.coverImage} />
                      ) : (
                        <div className={styles.placeholderCover}>
                          <FolderIcon />
                        </div>
                      )}
                      <span className={styles.photoBadge}>{folder.photoCount || 0} Photos</span>
                    </div>

                    <div className={styles.folderCardBody}>
                      <div className={styles.folderCardHeader}>
                        <h3 className={styles.folderTitle}>{folder.name}</h3>
                        <div className={styles.folderActions}>
                          <button
                            className={styles.iconGhostBtn}
                            onClick={(e) => { e.stopPropagation(); openFolderModal(folder); }}
                            title="Edit Album"
                          >
                            <EditIcon />
                          </button>
                          <button
                            className={styles.iconGhostBtn}
                            onClick={(e) => requestDeleteFolder(folder, e)}
                            title="Delete Album"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                      {folder.description && (
                        <p className={styles.folderDesc}>{folder.description}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 2: SELECTED ALBUM GALLERY */}
        {selectedFolder && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.albumHeader}>
              <button className={styles.backBtn} onClick={() => setSelectedFolder(null)}>
                <ArrowLeftIcon />
                <span>All Albums</span>
              </button>

              <div className={styles.albumTitleBlock}>
                <div
                  className={styles.colorPillIndicator}
                  style={{ backgroundColor: selectedFolder.accentColor || '#C73616' }}
                />
                <div>
                  <h1 className={styles.albumHeading}>{selectedFolder.name}</h1>
                  <p className={styles.albumMeta}>{selectedFolder.description || 'Private Collection'}</p>
                </div>
              </div>

              <button
                className={styles.primaryActionBtn}
                onClick={() => { setUploadError(''); setIsUploadModalOpen(true); }}
              >
                <UploadIcon />
                <span>Add Photo</span>
              </button>
            </div>

            {/* GALLERY GRID */}
            {photos.length === 0 ? (
              <div className={styles.emptyStateCard}>
                <p>This album is quiet. Upload a photo to start keeping memories here.</p>
                <button
                  className={styles.primaryActionBtn}
                  onClick={() => { setUploadError(''); setIsUploadModalOpen(true); }}
                >
                  <UploadIcon />
                  <span>Upload First Photo</span>
                </button>
              </div>
            ) : (
              <div className={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    className={styles.photoCard}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={photo.photoUrl}
                      alt={photo.caption || 'Memory'}
                      className={styles.photoImage}
                      onLoad={(e) => recordOrientation(photo, e)}
                    />
                    <div className={styles.photoCardOverlay}>
                      <button
                        className={styles.favIconBtn}
                        onClick={(e) => handleToggleFavorite(photo, e)}
                      >
                        <HeartIcon filled={photo.isFavorite} />
                      </button>
                      {photo.caption && <p className={styles.photoCaptionSnippet}>{photo.caption}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* MODAL 1: CREATE / EDIT ALBUM */}
      <AnimatePresence>
        {isFolderModalOpen && (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setIsFolderModalOpen(false)}
          >
            <motion.div
              className={styles.editorialModalCard}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{editingFolder ? 'Edit Memory Album' : 'Create New Album'}</h2>
                <button className={styles.closeBtn} onClick={() => setIsFolderModalOpen(false)}>
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleSaveFolder} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>Album Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunset in La Union"
                    value={folderForm.name}
                    onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Description / Note</label>
                  <textarea
                    rows={3}
                    placeholder="Brief memory description..."
                    value={folderForm.description}
                    onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Accent Color</label>
                  <div className={styles.palettePicker}>
                    {PALETTE_ACCENTS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={`${styles.colorChip} ${folderForm.accentColor === item.value ? styles.colorChipActive : ''}`}
                        style={{ backgroundColor: item.value }}
                        onClick={() => setFolderForm({ ...folderForm, accentColor: item.value })}
                        title={item.name}
                      />
                    ))}
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setIsFolderModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.primaryActionBtn} disabled={submitting}>
                    {submitting ? 'Saving...' : editingFolder ? 'Save Changes' : 'Create Album'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: UPLOAD PHOTO */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setIsUploadModalOpen(false)}
          >
            <motion.div
              className={styles.editorialModalCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Add Photo to Album</h2>
                <button className={styles.closeBtn} onClick={() => setIsUploadModalOpen(false)}>
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleUploadPhoto} className={styles.modalForm}>
                <div className={styles.fileDropZone}>
                  {uploadState.previewUrl ? (
                    <img src={uploadState.previewUrl} alt="Preview" className={styles.uploadPreviewImage} />
                  ) : (
                    <div className={styles.dropZonePrompt}>
                      <UploadIcon />
                      <p>Click or drag a photo here to upload</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" required onChange={handleFileChange} />
                </div>

                <div className={styles.formGroup}>
                  <label>Caption</label>
                  <input
                    type="text"
                    placeholder="A sweet phrase or note..."
                    value={uploadState.caption}
                    onChange={(e) => setUploadState({ ...uploadState, caption: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Location (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Quezon City"
                    value={uploadState.location}
                    onChange={(e) => setUploadState({ ...uploadState, location: e.target.value })}
                  />
                </div>

                {uploadError && <p className={styles.inlineFormError}>{uploadError}</p>}

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setIsUploadModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.primaryActionBtn}
                    disabled={uploadState.uploading || !uploadState.file}
                  >
                    {uploadState.uploading ? 'Uploading...' : 'Save Photo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* IMAGE STAGE — draggable carousel */}
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

                {/* Carousel controls */}
                {photos.length > 1 && (
                  <>
                    <button
                      className={`${styles.carouselNavBtn} ${styles.carouselNavPrev}`}
                      onClick={() => paginate(-1)}
                      aria-label="Previous photo"
                    >
                      <ChevronLeftIcon />
                    </button>
                    <button
                      className={`${styles.carouselNavBtn} ${styles.carouselNavNext}`}
                      onClick={() => paginate(1)}
                      aria-label="Next photo"
                    >
                      <ChevronRightIcon />
                    </button>
                    <span className={styles.carouselCounter}>
                      {lightbox.index + 1} / {photos.length}
                    </span>
                  </>
                )}

                {/* Landscape: floating glass close + hover caption overlay */}
                {isLandscape && (
                  <>
                    <button
                      className={styles.glassCloseBtn}
                      onClick={closeLightbox}
                      aria-label="Close preview"
                    >
                      <CloseIcon />
                    </button>

                    <div className={styles.landscapeOverlay}>
                      <div className={styles.landscapeCaptionGlass}>
                        <div className={styles.landscapeTextBlock}>
                          <p className={styles.landscapeCaption}>
                            {activePhoto.caption || 'No caption provided.'}
                          </p>
                          {activePhoto.location && (
                            <span className={styles.landscapeLocationTag}>
                              📍 {activePhoto.location}
                            </span>
                          )}
                        </div>

                        <div className={styles.landscapeActions}>
                          <button
                            className={styles.glassActionBtn}
                            onClick={(e) => handleToggleFavorite(activePhoto, e)}
                          >
                            <HeartIcon filled={activePhoto.isFavorite} />
                            <span>{activePhoto.isFavorite ? 'Favorited' : 'Favorite'}</span>
                          </button>

                          <button
                            className={`${styles.glassActionBtn} ${styles.glassDangerBtn}`}
                            onClick={() => requestDeletePhoto(activePhoto)}
                          >
                            <TrashIcon />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Portrait / square: editorial caption sidebar */}
              {!isLandscape && (
                <div className={styles.lightboxSidebar}>
                  <button className={styles.lightboxCloseBtn} onClick={closeLightbox}>
                    <CloseIcon />
                  </button>

                  <div className={styles.lightboxBody}>
                    <div className={styles.lightboxHeader}>
                      <button
                        className={styles.lightboxFavBtn}
                        onClick={(e) => handleToggleFavorite(activePhoto, e)}
                      >
                        <HeartIcon filled={activePhoto.isFavorite} />
                        <span>{activePhoto.isFavorite ? 'Favorited' : 'Favorite'}</span>
                      </button>

                      <button
                        className={styles.dangerBtn}
                        onClick={() => requestDeletePhoto(activePhoto)}
                      >
                        <TrashIcon />
                        <span>Delete</span>
                      </button>
                    </div>

                    <p className={styles.lightboxCaption}>
                      {activePhoto.caption || 'No caption provided.'}
                    </p>

                    {activePhoto.location && (
                      <span className={styles.lightboxLocationTag}>📍 {activePhoto.location}</span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LUXURY FROSTED GLASS CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmState && (
          <motion.div
            className={styles.confirmBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={closeConfirm}
          >
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
              <div className={styles.confirmIconRing}>
                <AlertIcon />
              </div>

              <h3 className={styles.confirmTitle}>{confirmState.title}</h3>
              <p className={styles.confirmMessage}>{confirmState.message}</p>

              {confirmError && <p className={styles.confirmError}>{confirmError}</p>}

              <div className={styles.confirmFooter}>
                <button
                  type="button"
                  className={styles.confirmCancelBtn}
                  onClick={closeConfirm}
                  disabled={confirmBusy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.confirmDeleteBtn}
                  onClick={handleConfirmAccept}
                  disabled={confirmBusy}
                >
                  {confirmBusy ? 'Removing…' : confirmState.confirmLabel || 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
