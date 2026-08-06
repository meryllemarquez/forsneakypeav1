import { NavLink } from 'react-router-dom';
import styles from './Footer.module.css';

const HeartIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21s-7.2-4.6-10-9.3C.6 8.4 2 4.8 5.3 4.1c2-.4 3.9.5 5 2.2 1.1-1.7 3-2.6 5-2.2 3.3.7 4.7 4.3 3.3 7.6C19.2 16.4 12 21 12 21z" />
  </svg>
);

const FOOTER_LINKS = [
  { path: '/home', label: 'Home' },
  { path: '/memories', label: 'Memories' },
  { path: '/dates', label: 'Dates' },
  { path: '/letters', label: 'Letters' },
  { path: '/profile', label: 'Profile' },
];

export default function Footer() {
  return (
    <footer className={styles.footerWrap}>
      <svg className={styles.wave} viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path fill="currentColor" d="M0,32 C 240,60 480,0 720,20 C 960,40 1200,55 1440,24 L1440,60 L0,60 Z" />
      </svg>
      <div className={styles.footer}>
        <div className={styles.inner}>
          <div className={styles.brand}>
            <HeartIcon />
            for sneakypea
          </div>
          <nav className={styles.links} aria-label="Footer">
            {FOOTER_LINKS.map((link) => (
              <NavLink key={link.path} to={link.path}>{link.label}</NavLink>
            ))}
          </nav>
          <span className={styles.tag}>
            made with <HeartIcon /> for Merylle &amp; Cj
          </span>
        </div>
      </div>
    </footer>
  );
}
