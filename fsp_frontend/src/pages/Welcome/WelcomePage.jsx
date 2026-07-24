import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { authService } from '../../services/authService';
import PinIndicator from '../../components/common/PinIndicator/PinIndicator';
import CustomKeypad from '../../components/welcome/CustomKeypad/CustomKeypad';
import styles from './WelcomePage.module.css';

export default function WelcomePage() {
  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { login } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  // Helper function for error shake animation
  const triggerErrorState = useCallback(() => {
    setHasError(true);
    setTimeout(() => {
      setPin('');
      setHasError(false);
    }, 600);
  }, []);

  // Verification request logic
  const handleVerifyPin = useCallback(async (enteredPin) => {
    setIsSubmitting(true);
    setHasError(false);

    try {
      const response = await authService.verifyPin(enteredPin);

      if (response.success && response.data?.authenticated) {
        setIsSuccess(true);
        login(response.data.token);

        // Smooth transition before navigation
        setTimeout(() => {
          navigate('/memories', { replace: true });
        }, 800);
      } else {
        triggerErrorState();
      }
    } catch (errorMsg) {
      triggerErrorState();
      addToast(typeof errorMsg === 'string' ? errorMsg : 'Incorrect PIN. Please try again ♡', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [login, navigate, triggerErrorState, addToast]);

  // Direct Event Handler — Handles both key input and auto-submit without useEffect
  const handleKeyPress = (digit) => {
    if (pin.length < 4 && !isSubmitting) {
      setHasError(false);
      const newPin = pin + digit;
      setPin(newPin);

      // Auto-submit as soon as 4th digit is clicked
      if (newPin.length === 4) {
        handleVerifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    if (!isSubmitting) {
      setHasError(false);
      setPin((prev) => prev.slice(0, -1));
    }
  };

  return (
    <AnimatePresence>
      {!isSuccess ? (
        <motion.div
          className={styles.pageContainer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.contentWrapper}>
            {/* Header Titles */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className={styles.textCenter}
            >
              <h1 className={styles.title}>Welcome ♡</h1>
              <p className={styles.subtitle}>
                To access this little corner of our story, <br />
                please enter my birthday 😊
              </p>
            </motion.div>

            {/* 4 PIN Circles */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className={styles.pinWrapper}
            >
              <PinIndicator length={4} value={pin} hasError={hasError} isMasked={true} />
            </motion.div>

            {/* Custom Keypad */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className={styles.keypadWrapper}
            >
              <CustomKeypad
                onKeyPress={handleKeyPress}
                onDelete={handleDelete}
                disabled={isSubmitting}
              />
            </motion.div>
          </div>
        </motion.div>
      ) : (
        /* Success Reveal Overlay */
        <motion.div
          key="success-overlay"
          className={styles.successOverlay}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className={styles.successTitle}>Unlocking Our Memories... ♥</h2>
        </motion.div>
      )}
    </AnimatePresence>
  );
}