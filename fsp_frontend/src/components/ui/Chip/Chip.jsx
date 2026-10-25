import { Check } from 'lucide-react';
import styles from './Chip.module.css';

/**
 * Filter / option chip. Selected = citrus fill AND a check mark, so it never relies on colour alone.
 * Default semantics are a toggle (aria-pressed); pass `radio` inside a RadioGroup-style group to
 * get role="radio" + aria-checked instead.
 */
export default function Chip({ active = false, radio = false, type = 'button', className = '', children, ...rest }) {
  const a11y = radio ? { role: 'radio', 'aria-checked': !!active } : { 'aria-pressed': !!active };
  return (
    <button type={type} className={`${styles.chip} ${active ? styles.active : ''} ${className}`} {...a11y} {...rest}>
      {active && <Check size={16} strokeWidth={3} aria-hidden="true" className={styles.check} />}
      {children}
    </button>
  );
}
