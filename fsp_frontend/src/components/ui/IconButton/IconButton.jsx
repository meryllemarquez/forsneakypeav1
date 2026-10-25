import styles from './IconButton.module.css';

/**
 * Round icon-only button. `label` is required: it is the accessible name and the tooltip.
 * variant: secondary (white) | ghost | primary (tomato) | danger (ink)
 * size:    md (44px, the touch-target minimum) | lg (52px)
 */
export default function IconButton({ label, variant = 'secondary', size = 'md', type = 'button', className = '', children, ...rest }) {
  if (!label && import.meta.env.DEV) {
    console.error('IconButton needs a `label` (its accessible name).');
  }
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
