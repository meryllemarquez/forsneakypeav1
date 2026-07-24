import { motion } from 'framer-motion';
import styles from './Button.module.css';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'gold' | 'outline' | 'text'
  size = 'md',        // 'sm' | 'md' | 'lg'
  isLoading = false,
  isDisabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    isLoading ? styles.loading : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      type={type}
      className={classNames}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      whileHover={!isDisabled && !isLoading ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled && !isLoading ? { scale: 0.98 } : undefined}
      {...props}
    >
      {isLoading ? (
        <span className={styles.spinner} aria-label="Loading..." />
      ) : (
        <>
          {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
          <span className={styles.label}>{children}</span>
          {rightIcon && <span className={styles.icon}>{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
}