import styles from './Button.module.css';

/**
 * variant: primary (tomato, the one "do it" action) | secondary (white) | ghost
 * size:    md (48px) | sm (44px, the touch-target minimum)
 */
export default function Button({ variant = 'secondary', size = 'md', type = 'button', className = '', children, ...rest }) {
  return (
    <button type={type} className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
