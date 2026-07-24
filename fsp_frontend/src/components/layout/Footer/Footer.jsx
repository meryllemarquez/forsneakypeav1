import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.quote}>"Every love story is beautiful, but ours is my favorite."</p>
        <p className={styles.copyright}>
          Crafted with <span className={styles.heart}>♥</span> for us — {currentYear}
        </p>
      </div>
    </footer>
  );
}