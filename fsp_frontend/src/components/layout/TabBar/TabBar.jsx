import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../../constants/nav';
import Icon from '../../Icon';
import styles from './TabBar.module.css';

// Bottom tab bar for phones (the top nav pill is hidden below 900px).
export default function TabBar() {
  return (
    <nav className={styles.bar} aria-label="Main">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.path} to={item.path} className={styles.tab}>
          <span className={styles.pill}>
            <Icon name={item.icon} size={28} />
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
