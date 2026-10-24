import { Component } from 'react';
import Icon from '../../Icon';
import Button from '../../ui/Button/Button';
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
        <Icon name="heart" size={88} sticker tilt={-6} />
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.message}>
          Sorry, love — this page hit a snag. Your memories and notes are safe. Reloading usually fixes it.
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    );
  }
}
