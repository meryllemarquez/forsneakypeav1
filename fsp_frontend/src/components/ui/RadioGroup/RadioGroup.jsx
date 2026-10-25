import { useRef } from 'react';
import { Check } from 'lucide-react';
import styles from './RadioGroup.module.css';

/**
 * One-of-many picker with real radio-group behaviour: a single tab stop, Arrow keys move and
 * select, Home / End jump. `options` are { value, label, content?, disabled?, className? }; `content` is what
 * is drawn inside the button (an icon, a thumbnail...), `label` is the accessible name.
 * The selected option always shows a check badge, never colour alone.
 *
 *   <RadioGroup label="Album doodle" value={v} onChange={setV} options={...} />
 */
export default function RadioGroup({ label, value, onChange, options: given, disabled = false, className = '', optionClassName = '', variant = 'tile', ...rest }) {
  const refs = useRef([]);
  const options = disabled ? given.map((o) => ({ ...o, disabled: true })) : given;
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const tabStop = selectedIndex >= 0 && !options[selectedIndex].disabled ? selectedIndex : enabled[0];

  const select = (index) => {
    onChange(options[index].value);
    refs.current[index]?.focus();
  };

  const onKeyDown = (e, index) => {
    const at = enabled.indexOf(index);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') select(enabled[(at + 1) % enabled.length]);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') select(enabled[(at - 1 + enabled.length) % enabled.length]);
    else if (e.key === 'Home') select(enabled[0]);
    else if (e.key === 'End') select(enabled[enabled.length - 1]);
    else return;
    e.preventDefault();
  };

  return (
    <div role="radiogroup" aria-label={label} className={`${styles.group} ${className}`} {...rest}>
      {options.map((o, i) => {
        const selected = i === selectedIndex;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={o.label}
            title={o.label}
            disabled={o.disabled}
            tabIndex={i === tabStop ? 0 : -1}
            className={`${styles[variant]} ${selected ? styles.selected : ''} ${optionClassName} ${o.className || ''}`}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {o.content ?? o.label}
            {selected && (
              <span className={styles.badge} aria-hidden="true">
                <Check size={12} strokeWidth={3.5} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Colour picker built on RadioGroup. colors: [{ value, name, color? }]: `value` is what onChange returns,
 * `color` (defaults to `value`) is the CSS colour drawn, e.g. { value: 'rose', name: 'Citrus', color: '#FF9F1C' }.
 * The accessible name is the colour's NAME, never its hex.
 */
export function ColorSwatchGroup({ label, value, onChange, colors, disabled = false, className = '' }) {
  return (
    <RadioGroup
      label={label}
      value={value}
      onChange={onChange}
      variant="swatch"
      disabled={disabled}
      className={className}
      options={colors.map((c) => ({
        value: c.value,
        label: c.name,
        content: <span className={styles.swatchFill} style={{ backgroundColor: c.color || c.value }} />,
      }))}
    />
  );
}
