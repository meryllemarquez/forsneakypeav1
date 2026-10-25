import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import LandingScene from '../components/landing/LandingScene';
import StoryBook from '../components/landing/StoryBook/StoryBook';
import styles from './AuthPage.module.css';

// A 401 from any authenticated request redirects here and sets this flag (see axiosConfig.js's
// response interceptor) so we can say *why* the login card is open instead of silently landing
// on the marketing page. Read lazily, as the initial state, so the card is already open on the
// first render; the flag itself is cleared in an effect below.
function readSessionExpiredFlag() {
  try {
    return Boolean(sessionStorage.getItem('fsp_session_expired'));
  } catch {
    return false;
  }
}

// Where the landing storybook's "Read our story" sends people after login. `next` is only honoured when it is a
// path inside /home, so this page can never be used to bounce someone to another site.
const STORY_NEXT = '/home#our-story';
function safeNext(value) {
  if (typeof value !== 'string') return '';
  return /^\/home(?:[/?#]|$)/.test(value) ? value : '';
}

// Phones (and portrait tablets) get the tall scene and a bottom-sheet login.
function usePhone() {
  const query = '(max-width: 900px) and (orientation: portrait)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return narrow;
}

export default function AuthPage() {
  const [sessionExpired] = useState(readSessionExpiredFlag);
  const [searchParams, setSearchParams] = useSearchParams();
  const nextPath = safeNext(searchParams.get('next'));
  const [isCardOpen, setIsCardOpen] = useState(sessionExpired || Boolean(nextPath));
  const [mode, setMode] = useState('LOGIN'); // 'LOGIN' | 'INVITE' | 'REGISTER'

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [error, setError] = useState(sessionExpired ? 'Your session expired. Please log in again.' : '');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const phone = usePhone();
  const pageRef = useRef(null);
  const reduce = useReducedMotion();

  const closeCard = useCallback(() => {
    setIsCardOpen(false);
    setError('');
    setMode('LOGIN');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeCard();
    };
    if (isCardOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCardOpen, closeCard]);

  // On phones the on-screen keyboard covers the bottom of the page: keep the sheet above it and
  // follow the visual viewport so the focused field stays visible.
  useEffect(() => {
    const vv = window.visualViewport;
    const el = pageRef.current;
    if (!phone || !isCardOpen || !vv || !el) return undefined;
    const update = () => {
      el.style.setProperty('--vvh', `${vv.height}px`);
      el.style.setProperty('--kb', `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      el.style.removeProperty('--vvh');
      el.style.removeProperty('--kb');
    };
  }, [phone, isCardOpen]);

  const keepFieldVisible = (e) => {
    if (!phone || e.target.tagName !== 'INPUT') return;
    const field = e.target;
    setTimeout(() => field.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }), 300);
  };

  useEffect(() => {
    if (sessionExpired) {
      try {
        sessionStorage.removeItem('fsp_session_expired');
      } catch {
        // storage unavailable: nothing to clear
      }
    }
  }, [sessionExpired]);

  const readStory = () => {
    setSearchParams({ next: STORY_NEXT }, { replace: true });
    setError('');
    setMode('LOGIN');
    setIsCardOpen(true);
  };

  const finish = (response) => {
    login(response);
    closeCard();
    navigate(response.role === 'ROLE_ADMIN' ? '/admin' : nextPath || '/');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      finish(await authService.login(username, password));
    } catch (err) {
      // axios's own err.message is "Request failed with status code 401", so read the status instead.
      setError(
        err.response?.status === 401
          ? 'That username or password is not right. Please try again.'
          : err.response?.data?.message || 'Unable to sign in. Please check your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  // The code is checked by the server when the account is created; nothing is compared in the browser.
  const handleInviteSubmit = (e) => {
    e.preventDefault();
    setError('');
    setMode('REGISTER');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      finish(
        await authService.register({
          masterPassword: inviteCode,
          name: displayName,
          username,
          password,
        })
      );
    } catch (err) {
      const message = err.response?.data?.message || 'Could not create the account.';
      if (/passcode/i.test(message)) {
        // The code was wrong: send them back to the code step instead of leaving them on the form.
        setMode('INVITE');
        setError('That code is not right. Please check it and try again.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const layoutClass = isCardOpen ? styles.layoutCard : styles.layoutCentered;

  return (
    <div className={styles.page} ref={pageRef}>
      <div className={styles.sceneLayer}>
        <LandingScene phone={phone} />
        <StoryBook phone={phone} hidden={isCardOpen} onContinue={readStory} />
      </div>

      <div className={`${styles.layout} ${layoutClass}`}>
        <motion.div className={styles.hero} data-landing-hero layout transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <h1 className={styles.title}>for sneakypea.</h1>
          <p className={styles.subtitle}>Every memory deserves a place to stay.</p>

          {!isCardOpen && (
            <button type="button" className={styles.cta} onClick={() => setIsCardOpen(true)}>
              <span>Welcome home</span>
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          )}
        </motion.div>

        <AnimatePresence>
          {isCardOpen && phone && (
            <motion.div
              key="scrim"
              className={styles.scrim}
              onClick={closeCard}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
          {isCardOpen && (
            <motion.div
              key="card"
              className={styles.card}
              role="dialog"
              aria-modal={phone}
              aria-labelledby="auth-title"
              onFocusCapture={keepFieldVisible}
              initial={phone ? { y: '100%' } : { opacity: 0, y: 24 }}
              animate={phone ? { y: 0 } : { opacity: 1, y: 0 }}
              exit={phone ? { y: '100%' } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <button type="button" className={styles.closeBtn} onClick={closeCard} aria-label="Close">
                <X size={22} aria-hidden="true" />
              </button>

              {mode === 'LOGIN' && (
                <form onSubmit={handleLoginSubmit} className={styles.form}>
                  <div className={styles.header}>
                    <h2 id="auth-title" className={styles.title2}>Log in</h2>
                    {nextPath && <p className={styles.lead}>Sign in to read it, love.</p>}
                  </div>

                  {error && <div className={styles.message} role="alert">{error}</div>}

                  <div className={styles.field}>
                    <label htmlFor="username">Username</label>
                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="password">Password</label>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" disabled={loading} className={styles.primaryBtn}>
                    {loading ? 'Logging in...' : 'Log in'}
                  </button>

                  <div className={styles.secondary}>
                    <span>No account yet?</span>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() => {
                        setError('');
                        setMode('INVITE');
                      }}
                    >
                      Register
                    </button>
                  </div>
                </form>
              )}

              {mode === 'INVITE' && (
                <form onSubmit={handleInviteSubmit} className={styles.form}>
                  <div className={styles.header}>
                    <KeyRound size={28} aria-hidden="true" />
                    <h2 id="auth-title" className={styles.title2}>Registration code</h2>
                    <p className={styles.lead}>Enter the code you were given to create an account.</p>
                  </div>

                  {error && <div className={styles.message} role="alert">{error}</div>}

                  <div className={styles.field}>
                    <label htmlFor="invite-code">Code</label>
                    <input
                      id="invite-code"
                      type="password"
                      autoComplete="off"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <button type="submit" className={styles.primaryBtn}>Continue</button>

                  <div className={styles.secondary}>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() => {
                        setError('');
                        setMode('LOGIN');
                      }}
                    >
                      Back to log in
                    </button>
                  </div>
                </form>
              )}

              {mode === 'REGISTER' && (
                <form onSubmit={handleRegisterSubmit} className={styles.form}>
                  <div className={styles.header}>
                    <h2 id="auth-title" className={styles.title2}>Create account</h2>
                  </div>

                  {error && <div className={styles.message} role="alert">{error}</div>}

                  <div className={styles.field}>
                    <label htmlFor="name">Display name</label>
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="reg-username">Username</label>
                    <input
                      id="reg-username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="reg-password">Password</label>
                    <input
                      id="reg-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" disabled={loading} className={styles.primaryBtn}>
                    {loading ? 'Creating...' : 'Create account'}
                  </button>

                  <div className={styles.secondary}>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() => {
                        setError('');
                        setMode('LOGIN');
                      }}
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
