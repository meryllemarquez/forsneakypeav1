import { useId } from 'react';
import styles from './Input.module.css';

export default function Input({
  label,
  error,
  helperText,
  isTextArea = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) {
  const id = useId();

  return (
    <div className={`${styles.container} ${className}`}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
        {leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}
        {isTextArea ? (
          <textarea id={id} className={styles.textarea} {...props} />
        ) : (
          <input id={id} className={styles.input} {...props} />
        )}
        {rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
      </div>
      {error ? (
        <span className={styles.errorText}>{error}</span>
      ) : helperText ? (
        <span className={styles.helperText}>{helperText}</span>
      ) : null}
    </div>
  );
}