import { forwardRef } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import form from '../FormControls.module.css';
import styles from './DatePicker.module.css';

/**
 * Styled date / time inputs. The native date or time input stays underneath, so phones open
 * their own wheel / calendar sheet; the shell only gives it the brand look, a leading icon and
 * a full-width tap target. Use inside <Field>.
 */
function makePicker(type, Icon, displayName) {
  const Picker = forwardRef(function Picker({ className = '', ...rest }, ref) {
    return (
      <span className={styles.wrap}>
        <Icon className={styles.icon} size={20} strokeWidth={2.6} aria-hidden="true" />
        <input ref={ref} type={type} className={`${form.input} ${styles.input} ${className}`} {...rest} />
      </span>
    );
  });
  Picker.displayName = displayName;
  return Picker;
}

export const DatePicker = makePicker('date', CalendarDays, 'DatePicker');
export const TimePicker = makePicker('time', Clock, 'TimePicker');
export default DatePicker;
