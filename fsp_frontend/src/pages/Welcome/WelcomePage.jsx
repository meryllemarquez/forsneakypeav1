import { useState, useCallback, useEffect } from 'react';
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

  const triggerErrorState = useCallback(() => {
    setHasError(true);
    setTimeout(() => {
      setPin('');
      setHasError(false);
    }, 600);
  }, []);

  const handleVerifyPin = useCallback(
    async (enteredPin) => {
      setIsSubmitting(true);
      setHasError(false);

      try {
        const response = await authService.verifyPin(enteredPin);

        if (response.success && response.data?.authenticated) {
          setIsSuccess(true);
          login(response.data.token);

          setTimeout(() => {
            navigate('/home', { replace: true });
          }, 800);
        } else {
          triggerErrorState();
        }
      } catch (errorMsg) {
        triggerErrorState();
        addToast(typeof errorMsg === 'string' ? errorMsg : 'Wrong passcode. Try again ♡', 'error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [login, navigate, triggerErrorState, addToast]
  );

  const handleKeyPress = useCallback(
    (digit) => {
      if (pin.length < 4 && !isSubmitting) {
        setHasError(false);
        const newPin = pin + digit;
        setPin(newPin);

        if (newPin.length === 4) {
          handleVerifyPin(newPin);
        }
      }
    },
    [pin, isSubmitting, handleVerifyPin]
  );

  const handleDelete = useCallback(() => {
    if (!isSubmitting) {
      setHasError(false);
      setPin((prev) => prev.slice(0, -1));
    }
  }, [isSubmitting]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isSubmitting || isSuccess) return;

      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleDelete, isSubmitting, isSuccess]);

  return (
    <AnimatePresence mode="wait">
      {!isSuccess ? (
        <div className={styles.pageContainer}>
          <div className={styles.contentCard}>
            <p className={styles.message}>
              to access this cute website please<br />enter my birthday^^
            </p>

            <PinIndicator length={4} value={pin} hasError={hasError} />

            <CustomKeypad
              onKeyPress={handleKeyPress}
              onDelete={handleDelete}
              disabled={isSubmitting}
            />
          </div>
        </div>
      ) : (
        <motion.div
          key="unlock-overlay"
          className={styles.unlockOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.unlockTitle}>Unlocking... ❤️</h2>
        </motion.div>
      )}
    </AnimatePresence>
  );
}