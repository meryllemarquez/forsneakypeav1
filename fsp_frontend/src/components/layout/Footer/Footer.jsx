import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../../constants/nav';
import Icon from '../../Icon';
import Logo from '../Logo/Logo';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.scallop} aria-hidden="true" />
      <div className={styles.inner}>
        <div>
          <Logo to={null} tone="white" size={40} />
          <p className={styles.tag}>
            made with <Icon name="heart" size={18} /> for Merylle &amp; Cj
          </p>
        </div>

        <nav className={styles.links} aria-label="Footer">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.dogs}>
          <Icon name="dog" size={60} sticker tilt={6} />
          <div>
            <p className={styles.dogsTitle}>the good dogs</p>
            <p className={styles.dogsNames}>Zizi · Loafie · Zoey · Tato · Cooper</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
