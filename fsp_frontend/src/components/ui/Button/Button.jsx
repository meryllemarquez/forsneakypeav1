import styles from './Button.module.css';

/**
 * variant: primary (tomato, the one "do it" action) | secondary (white) | ghost | danger (ink, for deletes)
 * size:    md (48px) | sm (44px, the touch-target minimum)
 * loading: shows a spinner, sets aria-busy and blocks clicks (the label stays so the width does not jump)
 */
export default function Button({ variant = 'secondary', size = 'md', type = 'button', loading = false, disabled, className = '', children, ...rest }) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${loading ? styles.loading : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}
