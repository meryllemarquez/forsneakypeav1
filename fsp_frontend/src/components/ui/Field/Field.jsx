import { Children, cloneElement, isValidElement, useId } from 'react';
import styles from '../FormControls.module.css';

/**
 * Label + control + hint + error, wired together for screen readers:
 * the child control gets the id, aria-describedby and aria-invalid.
 *
 *   <Field label="Title" hint="Shown on the card" error={errors.title} required>
 *     <input className={form.input} value=... onChange=... />
 *   </Field>
 *
 * The child may be an input, a textarea, or the shared Select / DatePicker / TimePicker.
 */
export default function Field({ label, hint, error, required = false, htmlFor, className = '', children }) {
  const generated = useId();
  const only = Children.count(children) === 1 && isValidElement(children) ? children : null;
  const id = htmlFor || only?.props.id || generated;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [only?.props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined;

  const control = only
    ? cloneElement(only, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : only.props['aria-invalid'],
        required: required || only.props.required,
      })
    : children;

  return (
    <div className={`${styles.field} ${className}`}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
          {required && <span className={styles.required} aria-hidden="true"> *</span>}
        </label>
      )}
      {control}
      {hint && <p id={hintId} className={styles.hint}>{hint}</p>}
      {error && <p id={errorId} className={styles.fieldError} role="alert">{error}</p>}
    </div>
  );
}
