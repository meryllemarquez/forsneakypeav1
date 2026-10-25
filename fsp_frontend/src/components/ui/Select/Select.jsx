import { forwardRef } from 'react';
import form from '../FormControls.module.css';
import styles from './Select.module.css';

/**
 * Brand-styled select. It stays a real select underneath, so phones open their own thumb-friendly
 * picker and the keyboard and screen readers behave natively. Use inside <Field>.
 * Pass option elements as children, or `options={[{ value, label }]}` plus an optional `placeholder`.
 */
const Select = forwardRef(function Select({ options, placeholder, className = '', children, ...rest }, ref) {
  return (
    <span className={styles.wrap}>
      <select ref={ref} className={`${form.select} ${styles.select} ${className}`} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      <svg className={styles.chevron} viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
});

export default Select;
