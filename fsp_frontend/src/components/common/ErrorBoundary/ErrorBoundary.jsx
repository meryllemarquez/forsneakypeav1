import { Component } from 'react';
import styles from './ErrorBoundary.module.css';

// Last line of defence: if any component throws while rendering (or a lazily loaded page fails to
// download, e.g. right after a new deploy replaced the old file names), show a friendly screen
// instead of a blank page. A reload fixes both cases.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Visible in the browser console for debugging; nothing is sent anywhere.
    console.error('Unhandled UI error', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className={styles.wrap} role="alert">
        <svg className={styles.heart} width="40" height="40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 21s-7.2-4.6-10-9.3C.6 8.4 2 4.8 5.3 4.1c2-.4 3.9.5 5 2.2 1.1-1.7 3-2.6 5-2.2 3.3.7 4.7 4.3 3.3 7.6C19.2 16.4 12 21 12 21z" />
        </svg>
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.message}>
          Sorry, love — this page hit a snag. Your memories and notes are safe. Reloading usually fixes it.
        </p>
        <button type="button" className={styles.button} onClick={() => window.location.reload()}>
          Reload page
        </button>
      </div>
    );
  }
}
