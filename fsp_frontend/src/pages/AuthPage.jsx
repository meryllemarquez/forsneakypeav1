import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import styles from './AuthPage.module.css';

// Minimal Inline Icons
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const LockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8D7BC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const ArrowRightIcon = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export default function AuthPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState('LOGIN'); // 'LOGIN' | 'MASTER_CHECK' | 'REGISTER'

  // Form Inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('ROLE_USER');
  const [masterKey, setMasterKey] = useState('');

  // Feedback State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setError('');
    setMode('LOGIN');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal]);

  // A 401 from any authenticated request redirects here and flags this so we
  // can surface *why* the login modal is open instead of silently landing
  // on the marketing page (see axiosConfig.js's response interceptor).
  useEffect(() => {
    if (sessionStorage.getItem('fsp_session_expired')) {
      sessionStorage.removeItem('fsp_session_expired');
      setMode('LOGIN');
      setError('Your session expired — please log in again. 💕');
      setIsModalOpen(true);
    }
  }, []);

  // 1. Handle Standard Login with Cute Error Phrase
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(username, password);
      login(response);
      closeModal();
      navigate(response.role === 'ROLE_ADMIN' ? '/admin' : '/');
    } catch (err) {
      // Custom romantic & clear error phrase for wrong password/username
      // axios's own err.message is "Request failed with status code 401", so
      // read the backend's message / status instead.
      setError(
        err.response?.status === 401
          ? '✨ Oops! Incorrect username or password, love. Please try again! 💕'
          : err.response?.data?.message || 'Unable to sign in. Please check your credentials 💕'
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Master Key Verification (0617)
  const handleMasterKeySubmit = (e) => {
    e.preventDefault();
    setError('');

    if (masterKey === '0617') {
      setMode('REGISTER');
    } else {
      setError('✨ Incorrect Master Key! Type 0617 to unlock registration 💕');
    }
  };

  // 3. Handle Account Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.register({
        masterPassword: masterKey,
        name: displayName,
        username,
        password,
        role,
      });

      login(response);
      closeModal();
      navigate(response.role === 'ROLE_ADMIN' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account 💕');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.heroContainer}>
      {/* Dark Mood Overlay */}
      <div className={styles.darkOverlay}></div>

      {/* Main Grid Layout */}
      <div className={`${styles.mainContentLayout} ${isModalOpen ? styles.layoutActive : styles.layoutCentered}`}>
        
        {/* Left Side: Smooth Slow Slide Hero Content */}
        <motion.div 
          className={`${styles.heroContent} ${isModalOpen ? styles.heroContentLeft : styles.heroContentCenter}`}
          layout
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className={styles.coupleTitle}>FOR SNEAKYPEA.</h1>
          <p className={styles.subtitle}>
            Every memory deserves a place to stay.
          </p>

          {!isModalOpen && (
            <motion.button
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className={styles.welcomePillCta}
              onClick={() => setIsModalOpen(true)}
            >
              <span>Welcome Home</span>
              <ArrowRightIcon className={styles.ctaIcon} />
            </motion.button>
          )}
        </motion.div>

        {/* Right Side: Exact Dark Glassmorphism Modal (From Screenshot) */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              className={styles.modalGlassCard}
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                className={styles.closeBtn}
                onClick={closeModal}
                aria-label="Close Modal"
              >
                <CloseIcon />
              </button>

              {/* MODE 1: LOGIN */}
              {mode === 'LOGIN' && (
                <form onSubmit={handleLoginSubmit} className={styles.form}>
                  <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Login</h2>
                  </div>

                  {/* Wrong Password / Username Custom Phrase Error */}
                  {error && <div className={styles.errorMessage}>{error}</div>}

                  <div className={styles.fieldGroup}>
                    <input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.primaryBtn}
                  >
                    {loading ? 'Logging in...' : 'Log In'}
                  </button>

                  <div className={styles.secondaryActions}>
                    <span className={styles.footerText}>Don't have an account?</span>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() => {
                        setError('');
                        setMasterKey('');
                        setMode('MASTER_CHECK');
                      }}
                    >
                      Register
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 2: MASTER KEY VERIFICATION */}
              {mode === 'MASTER_CHECK' && (
                <form onSubmit={handleMasterKeySubmit} className={styles.form}>
                  <div className={styles.modalHeader}>
                    <div className={styles.iconHeaderWrapper}>
                      <LockIcon />
                    </div>
                    <h2 className={styles.modalTitle}>Master Verification</h2>
                    <p className={styles.modalSubtitle}>
                      Enter passcode 0617 to unlock registration.
                    </p>
                  </div>

                  {error && <div className={styles.errorMessage}>{error}</div>}

                  <div className={styles.fieldGroup}>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={masterKey}
                      onChange={(e) => setMasterKey(e.target.value)}
                      className={styles.masterPinInput}
                      autoFocus
                      required
                    />
                  </div>

                  <button type="submit" className={styles.primaryBtn}>
                    Verify Passcode
                  </button>

                  <div className={styles.secondaryActions}>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() => setMode('LOGIN')}
                    >
                      Return to Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 3: ACCOUNT CREATION */}
              {mode === 'REGISTER' && (
                <form onSubmit={handleRegisterSubmit} className={styles.form}>
                  <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Create Account</h2>
                    <p className={styles.modalSubtitle}>
                      Master passcode verified (0617).
                    </p>
                  </div>

                  {error && <div className={styles.errorMessage}>{error}</div>}

                  <div className={styles.fieldGroup}>
                    <label className={styles.inputLabel} htmlFor="role">Role Type</label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="ROLE_USER">User (Merylle / Cj)</option>
                      <option value="ROLE_ADMIN">Admin (Elevated)</option>
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <input
                      id="name"
                      type="text"
                      placeholder="Display Name (e.g. Merylle)"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <input
                      id="reg-username"
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <input
                      id="reg-password"
                      type="password"
                      placeholder="Choose a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.primaryBtn}
                  >
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>

                  <div className={styles.secondaryActions}>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() => setMode('LOGIN')}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}