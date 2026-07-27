import { useState } from 'react'; // Fixed: Removed unused 'React' import
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import styles from './AuthModal.module.css';

export default function AuthModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const [mode, setMode] = useState('LOGIN'); // 'LOGIN' | 'MASTER_CHECK' | 'REGISTER'

  // Form Inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('ROLE_USER');
  const [masterKey, setMasterKey] = useState('');

  // UI Feedback
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // 1. Handle Standard Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(username, password);
      login(response);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid username or password 💕');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Master Key Verification (0617)
  const handleMasterKeySubmit = (e) => {
    e.preventDefault();
    setError('');

    if (masterKey === '0617') {
      setMode('REGISTER'); // Unlock registration form!
    } else {
      setError('Incorrect Master Key! Please try 0617 💕');
    }
  };

  // 3. Handle Account Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.register({
        masterPassword: masterKey, // Backend expects 'masterPassword'
        name: displayName,          // Backend expects 'name'
        username,
        password,
        role,                       // ROLE_USER or ROLE_ADMIN
      });

      login(response);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCard}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        {/* 1. LOGIN MODE */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className={styles.form}>
            <h3 className={styles.title}>Account Sign In 💕</h3>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.inputGroup}>
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="merylle / cj / admin"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className={styles.footer}>
              <p>Need to create an account?</p>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => {
                  setError('');
                  setMasterKey('');
                  setMode('MASTER_CHECK');
                }}
              >
                🔑 Enter Master Key (0617) to Register
              </button>
            </div>
          </form>
        )}

        {/* 2. MASTER KEY UNLOCK MODE */}
        {mode === 'MASTER_CHECK' && (
          <form onSubmit={handleMasterKeySubmit} className={styles.form}>
            <h3 className={styles.title}>Enter Master Password 🔑</h3>
            <p className={styles.subtitle}>Type <strong>0617</strong> to unlock account creation</p>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.inputGroup}>
              <input
                type="password"
                maxLength="4"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="0617"
                className={styles.pinInput}
                autoFocus
                required
              />
            </div>

            <div className={styles.btnRow}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setMode('LOGIN')}
              >
                Back to Login
              </button>
              <button type="submit" className={styles.submitBtn}>
                Verify Key
              </button>
            </div>
          </form>
        )}

        {/* 3. REGISTER MODE (Unlocked by 0617) */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className={styles.form}>
            <h3 className={styles.title}>Create Account ✨</h3>
            <p className={styles.subtitle}>Master Key Unlocked</p>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.inputGroup}>
              <label>Account Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="ROLE_USER">User (Merylle / Cj) 💕</option>
                <option value="ROLE_ADMIN">Admin 👑</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Merylle / Cj"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className={styles.btnRow}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setMode('LOGIN')}
              >
                Cancel
              </button>
              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}