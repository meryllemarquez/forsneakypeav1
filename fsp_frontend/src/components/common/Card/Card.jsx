import { motion } from 'framer-motion';
import styles from './Card.module.css';

export default function Card({
  children,
  variant = 'elevated', // 'elevated' | 'outlined' | 'glass' | 'flat'
  padding = 'md',       // 'none' | 'sm' | 'md' | 'lg'
  isInteractive = false,
  onClick,
  className = '',
  ...props
}) {
  const classNames = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    isInteractive ? styles.interactive : '',
    className
  ].filter(Boolean).join(' ');

  const motionProps = isInteractive
    ? {
        whileHover: { y: -4, boxShadow: '0 12px 28px rgba(74,0,0,0.12)' },
        whileTap: { scale: 0.98 }
      }
    : {};

  return (
    <motion.div
      className={classNames}
      onClick={isInteractive ? onClick : undefined}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.div>
  );
}