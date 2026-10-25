import { useId, useRef } from 'react';
import styles from './Tabs.module.css';

/**
 * Pill tab strip with real tab semantics: one tab stop, Arrow / Home / End move and select.
 *
 *   <Tabs label="View" tabs={[{ id: 'albums', label: 'Albums', icon: <Icon .../> }]} value={v} onChange={setV} idPrefix="memories" />
 *   <TabPanel idPrefix="memories" id="albums" active={v === 'albums'}>...</TabPanel>
 */
export const tabId = (prefix, id) => `${prefix}-tab-${id}`;
export const panelId = (prefix, id) => `${prefix}-panel-${id}`;

export default function Tabs({ label, tabs, value, onChange, idPrefix, className = '' }) {
  const fallback = useId();
  const prefix = idPrefix || fallback;
  const refs = useRef({});

  const move = (index) => {
    const next = tabs[(index + tabs.length) % tabs.length];
    onChange(next.id);
    refs.current[next.id]?.focus();
  };

  const onKeyDown = (e, index) => {
    if (e.key === 'ArrowRight') move(index + 1);
    else if (e.key === 'ArrowLeft') move(index - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(tabs.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div className={`${styles.tabs} ${className}`} role="tablist" aria-label={label}>
      {tabs.map((tab, index) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => { refs.current[tab.id] = el; }}
            id={tabId(prefix, tab.id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId(prefix, tab.id)}
            tabIndex={selected ? 0 : -1}
            className={`${styles.tab} ${selected ? styles.active : ''}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ idPrefix, id, active, children, ...rest }) {
  if (!active) return null;
  return (
    <div role="tabpanel" id={panelId(idPrefix, id)} aria-labelledby={tabId(idPrefix, id)} {...rest}>
      {children}
    </div>
  );
}
