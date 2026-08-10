import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { profileService } from '../services/profileService';
import { uploadProfileAvatar, deleteProfileAvatar } from '../api/supabaseClient';
import { ACCENT_COLORS, EMOJI_OPTIONS, DEFAULT_ACCENT_COLOR, getAccentHex } from '../constants/profileOptions';
import AvatarCropModal from '../components/profile/AvatarCropModal';
import ConfirmDialog from '../components/profile/ConfirmDialog';
import AnniversaryCounter from '../components/profile/AnniversaryCounter';
import Navbar from '../components/layout/Navbar/Navbar';
import Footer from '../components/layout/Footer/Footer';
import styles from './ProfilePage.module.css';

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const PaletteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const NAME_MIN = 2;
const NAME_MAX = 30;
const NICKNAME_MAX = 20;
const BIO_MAX = 100;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

function toFormState(profile) {
  return {
    name: profile?.name || '',
    nickname: profile?.nickname || '',
    bio: profile?.bio || '',
    favoriteEmoji: profile?.favoriteEmoji || '',
    accentColor: profile?.accentColor || DEFAULT_ACCENT_COLOR,
  };
}

function friendlyErrorMessage(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRemoveAvatarConfirm, setShowRemoveAvatarConfirm] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [pendingCropFile, setPendingCropFile] = useState(null);

  // A 401 here is handled globally by the axios response interceptor (clears
  // stored credentials and redirects to /auth), so this only needs to cover
  // the "still logged in but the request failed" case.
  const loadProfile = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      setForm(toFormState(data));
    } catch (err) {
      if (err?.response?.status !== 401) {
        setLoadError(friendlyErrorMessage(err, 'Could not load your profile. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchInitialProfile = async () => {
      try {
        const data = await profileService.getProfile();
        if (isMounted) {
          setProfile(data);
          setForm(toFormState(data));
        }
      } catch (err) {
        if (!isMounted) return;
        if (err?.response?.status !== 401) {
          setLoadError(friendlyErrorMessage(err, 'Could not load your profile. Please try again.'));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialProfile();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = useMemo(() => {
    if (!profile || !form) return false;
    return JSON.stringify(toFormState(profile)) !== JSON.stringify(form);
  }, [profile, form]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (draft) => {
    const errors = {};
    const trimmedName = draft.name.trim();
    if (!trimmedName) errors.name = 'Display name is required.';
    else if (trimmedName.length < NAME_MIN || trimmedName.length > NAME_MAX) {
      errors.name = `Display name must be ${NAME_MIN}-${NAME_MAX} characters.`;
    } else if (/[<>]/.test(trimmedName)) {
      errors.name = 'Display name cannot contain < or > characters.';
    }

    if (draft.nickname.length > NICKNAME_MAX) errors.nickname = `Nickname must be under ${NICKNAME_MAX} characters.`;
    else if (/[<>]/.test(draft.nickname)) errors.nickname = 'Nickname cannot contain < or > characters.';

    if (draft.bio.length > BIO_MAX) errors.bio = `Bio must be under ${BIO_MAX} characters.`;
    else if (/[<>]/.test(draft.bio)) errors.bio = 'Bio cannot contain < or > characters.';

    return errors;
  };

  const handleSave = async () => {
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      addToast('Please fix the highlighted fields.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        nickname: form.nickname.trim() || null,
        bio: form.bio.trim() || null,
        favoriteEmoji: form.favoriteEmoji || null,
        accentColor: form.accentColor,
      };
      const updated = await profileService.updateProfile(payload);
      setProfile(updated);
      setForm(toFormState(updated));
      updateUser({
        name: updated.name,
        nickname: updated.nickname,
        favoriteEmoji: updated.favoriteEmoji,
        accentColor: updated.accentColor,
        avatarUrl: updated.avatarUrl,
      });
      setSaveSuccess(true);
      addToast('Profile updated ✨', 'success');
      setTimeout(() => setSaveSuccess(false), 1800);
    } catch (err) {
      if (err?.response?.status === 401) {
        addToast('Your session expired — please log in again.', 'error');
        navigate('/auth');
        return;
      }
      addToast(friendlyErrorMessage(err, 'Could not save your changes. Please try again.'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (isDirty) setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    setForm(toFormState(profile));
    setFieldErrors({});
    setShowResetConfirm(false);
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      addToast('Please upload a PNG, JPG, JPEG, or WEBP image.', 'error');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      addToast('That image is too large — please choose one under 5MB.', 'error');
      return;
    }
    setPendingCropFile(file);
  };

  const handleCropConfirm = async (blob) => {
    setAvatarBusy(true);
    try {
      const previousStoragePath = profile?.avatarStoragePath;
      const { avatarUrl, storagePath } = await uploadProfileAvatar(blob, user?.id);
      const updated = await profileService.updateAvatar({ avatarUrl, storagePath });
      setProfile(updated);
      updateUser({ avatarUrl: updated.avatarUrl });
      if (previousStoragePath) {
        deleteProfileAvatar(previousStoragePath).catch(() => {});
      }
      addToast('Profile picture updated ✨', 'success');
      setPendingCropFile(null);
    } catch (err) {
      if (err?.response?.status === 401) {
        addToast('Your session expired — please log in again.', 'error');
        navigate('/auth');
        return;
      }
      addToast(friendlyErrorMessage(err, 'Could not upload your photo. Please try again.'), 'error');
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleRemoveAvatarConfirm = async () => {
    setAvatarBusy(true);
    try {
      const previousStoragePath = profile?.avatarStoragePath;
      const updated = await profileService.removeAvatar();
      setProfile(updated);
      updateUser({ avatarUrl: null });
      if (previousStoragePath) {
        deleteProfileAvatar(previousStoragePath).catch(() => {});
      }
      addToast('Profile picture removed.', 'success');
      setShowRemoveAvatarConfirm(false);
    } catch (err) {
      if (err?.response?.status === 401) {
        addToast('Your session expired — please log in again.', 'error');
        navigate('/auth');
        return;
      }
      addToast(friendlyErrorMessage(err, 'Could not remove your photo. Please try again.'), 'error');
    } finally {
      setAvatarBusy(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.centerState}>
          <span className={styles.spinner} />
          <p>Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.centerState}>
          <AlertIcon />
          <p>{loadError}</p>
          <button className={styles.retryBtn} onClick={loadProfile}>Try Again</button>
        </div>
      </div>
    );
  }

  const accentHex = getAccentHex(form.accentColor);
  const initial = (form.name || user?.username || '?').trim().charAt(0).toUpperCase();

  return (
    <div className={styles.page} style={{ '--accent': accentHex }}>
      <Navbar />

      <div className={styles.pageHead}>
        <button className={styles.backBtn} onClick={() => navigate('/home')}>
          <ArrowLeftIcon />
          <span>Back home</span>
        </button>
        <h1 className={styles.pageHeadTitle}>My Profile</h1>
      </div>

      <motion.div className={styles.content} variants={containerVariants} initial="hidden" animate="visible">
        {/* PROFILE HEADER */}
        <motion.section className={styles.headerCard} variants={itemVariants}>
          <div className={styles.headerGlow} aria-hidden="true" />
          <div className={styles.avatarRing}>
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={form.name} className={styles.avatarImage} />
            ) : (
              <div className={styles.avatarFallback}>{initial}</div>
            )}
          </div>
          <div className={styles.headerNameRow}>
            <h1 className={styles.headerName}>{form.name}</h1>
            {form.favoriteEmoji && <span className={styles.headerEmoji}>{form.favoriteEmoji}</span>}
          </div>
          {form.nickname && <p className={styles.headerNickname}>{form.nickname}</p>}
          {form.bio && <p className={styles.headerBio}>{form.bio}</p>}
          <div className={styles.headerCounterWrapper}>
            <AnniversaryCounter />
          </div>
        </motion.section>

        <div className={styles.grid}>
          {/* PERSONAL INFORMATION CARD */}
          <motion.section className={styles.card} variants={itemVariants}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleRow}>
                <span className={styles.cardTitleIcon}>
                  <UserIcon />
                </span>
                <div>
                  <h2 className={styles.cardTitle}>Personal Information</h2>
                  <p className={styles.cardSubtitle}>Manage how your profile appears to your partner.</p>
                </div>
              </div>
            </div>

            <div className={styles.cardDivider} />

            <div className={styles.formGroup}>
              <div className={styles.formLabelRow}>
                <label htmlFor="profile-name" className={styles.fieldLabel}>Display Name</label>
                <span className={styles.charCount}>{form.name.length} / {NAME_MAX}</span>
              </div>
              <input
                id="profile-name"
                type="text"
                value={form.name}
                maxLength={NAME_MAX}
                disabled={isSaving}
                onChange={(e) => updateField('name', e.target.value)}
                className={`${styles.inputField} ${fieldErrors.name ? styles.inputError : ''}`}
                placeholder="e.g. Alex"
              />
              {fieldErrors.name && <span className={styles.errorText}>{fieldErrors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <div className={styles.formLabelRow}>
                <label htmlFor="profile-nickname" className={styles.fieldLabel}>Nickname</label>
                <span className={styles.charCount}>{form.nickname.length} / {NICKNAME_MAX}</span>
              </div>
              <input
                id="profile-nickname"
                type="text"
                placeholder="e.g. Baby, Honey, Mahal"
                value={form.nickname}
                maxLength={NICKNAME_MAX}
                disabled={isSaving}
                onChange={(e) => updateField('nickname', e.target.value)}
                className={`${styles.inputField} ${fieldErrors.nickname ? styles.inputError : ''}`}
              />
              {fieldErrors.nickname && <span className={styles.errorText}>{fieldErrors.nickname}</span>}
            </div>

            <div className={styles.formGroup}>
              <div className={styles.formLabelRow}>
                <label htmlFor="profile-bio" className={styles.fieldLabel}>Short Bio</label>
                <span className={styles.charCount}>{form.bio.length} / {BIO_MAX}</span>
              </div>
              <textarea
                id="profile-bio"
                placeholder="Forever grateful for every adventure together ❤️"
                value={form.bio}
                maxLength={BIO_MAX}
                disabled={isSaving}
                onChange={(e) => updateField('bio', e.target.value)}
                className={`${styles.textareaField} ${fieldErrors.bio ? styles.inputError : ''}`}
              />
              {fieldErrors.bio && <span className={styles.errorText}>{fieldErrors.bio}</span>}
            </div>
          </motion.section>

          {/* APPEARANCE */}
          <motion.section className={styles.card} variants={itemVariants}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleRow}>
                <span className={styles.cardTitleIcon}>
                  <PaletteIcon />
                </span>
                <div>
                  <h2 className={styles.cardTitle}>Appearance</h2>
                  <p className={styles.cardSubtitle}>Customize your theme and accent icon.</p>
                </div>
              </div>
            </div>

            <div className={styles.cardDivider} />

            <div className={styles.formGroup}>
              <div className={styles.formLabelRow}>
                <label className={styles.fieldLabel}>Accent Color</label>
              </div>
              <div className={styles.swatchGrid}>
                {ACCENT_COLORS.map((color) => (
                  <motion.button
                    key={color.key}
                    type="button"
                    className={`${styles.swatch} ${form.accentColor === color.key ? styles.swatchActive : ''}`}
                    style={{ backgroundColor: color.hex }}
                    title={color.label}
                    aria-label={color.label}
                    disabled={isSaving}
                    onClick={() => updateField('accentColor', color.key)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                  >
                    {form.accentColor === color.key && <CheckIcon />}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.formLabelRow}>
                <label className={styles.fieldLabel}>Favorite Emoji</label>
              </div>
              <div className={styles.emojiGrid}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <motion.button
                    key={emoji}
                    type="button"
                    className={`${styles.emojiOption} ${form.favoriteEmoji === emoji ? styles.emojiActive : ''}`}
                    disabled={isSaving}
                    onClick={() => updateField('favoriteEmoji', form.favoriteEmoji === emoji ? '' : emoji)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.section>
        </div>

        {/* PROFILE PICTURE */}
        <motion.section className={styles.card} variants={itemVariants}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardTitleIcon}>
                <CameraIcon />
              </span>
              <div>
                <h2 className={styles.cardTitle}>Profile Picture</h2>
                <p className={styles.cardSubtitle}>Upload or update your avatar photo.</p>
              </div>
            </div>
          </div>

          <div className={styles.cardDivider} />

          <div className={styles.avatarCardBody}>
            <div className={styles.avatarPreviewRing}>
              {avatarBusy ? (
                <div className={styles.avatarFallback}><span className={styles.spinnerSmall} /></div>
              ) : profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={form.name} className={styles.avatarImage} />
              ) : (
                <div className={styles.avatarFallback}>{initial}</div>
              )}
            </div>

            <div className={styles.avatarActions}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileSelected}
                className={styles.hiddenFileInput}
              />
              <motion.button
                type="button"
                className={styles.primaryActionBtn}
                disabled={avatarBusy}
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <CameraIcon />
                <span>{profile.avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
              </motion.button>
              {profile.avatarUrl && (
                <motion.button
                  type="button"
                  className={styles.dangerActionBtn}
                  disabled={avatarBusy}
                  onClick={() => setShowRemoveAvatarConfirm(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <TrashIcon />
                  <span>Remove</span>
                </motion.button>
              )}
              <p className={styles.avatarHint}>PNG, JPG, JPEG, or WEBP — up to 5MB. You'll be able to crop it to a square before saving.</p>
            </div>
          </div>
        </motion.section>
      </motion.div>

      {/* ACTION FOOTER */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            className={styles.actionFooter}
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className={styles.unsavedIndicator}>
              <span className={styles.unsavedDot} /> <span className={styles.unsavedText}>Unsaved changes</span>
            </span>
            <div className={styles.footerActions}>
              <button className={styles.cancelFooterBtn} onClick={handleCancelClick} disabled={isSaving}>Cancel</button>
              <motion.button
                className={styles.saveFooterBtn}
                onClick={handleSave}
                disabled={isSaving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isSaving ? (
                    <motion.span key="saving" className={styles.spinnerSmall} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                  ) : saveSuccess ? (
                    <motion.span key="success" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={styles.saveSuccessIcon}>
                      <CheckIcon />
                    </motion.span>
                  ) : (
                    <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Save Changes
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={showResetConfirm}
        title="Discard your changes?"
        message="This will reset the form back to your last saved profile. This can't be undone."
        confirmLabel="Discard Changes"
        onConfirm={handleConfirmReset}
        onClose={() => setShowResetConfirm(false)}
      />

      <ConfirmDialog
        open={showRemoveAvatarConfirm}
        title="Remove profile picture?"
        message="Your profile will show your initial instead until you upload a new photo."
        confirmLabel="Remove"
        busy={avatarBusy}
        onConfirm={handleRemoveAvatarConfirm}
        onClose={() => setShowRemoveAvatarConfirm(false)}
      />

      {pendingCropFile && (
        <AvatarCropModal
          file={pendingCropFile}
          onCancel={() => setPendingCropFile(null)}
          onConfirm={handleCropConfirm}
        />
      )}

      <Footer />
    </div>
  );
}