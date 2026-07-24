import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationProvider';
import { useNotification } from './hooks/useNotification';
import Layout from './components/layout/Layout/Layout';
import Button from './components/common/Button/Button';
import Card from './components/common/Card/Card';
import Input from './components/common/Input/Input';
import PinIndicator from './components/common/PinIndicator/PinIndicator';
import Modal from './components/common/Modal/Modal';

// Demonstration Showcase component para ma-test ang Design System
function DesignSystemShowcase() {
  const { addToast } = useNotification();
  const [pinValue, setPinValue] = useState('12');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <section>
        <h2 style={{ marginBottom: '1rem' }}>🎨 Design System Showcase</h2>
        <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
          Ito ang UI Foundation at reusable components na gagamitin natin sa buong app.
        </p>
      </section>

      {/* 🔘 Buttons Section */}
      <Card variant="elevated">
        <h3 style={{ marginBottom: '1rem' }}>Buttons</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => addToast('Burgundy Primary Button Clicked!', 'info')}>
            Primary
          </Button>
          <Button variant="gold" onClick={() => addToast('Gold Accent Button Clicked!', 'gold')}>
            Gold Special
          </Button>
          <Button variant="secondary" onClick={() => addToast('Warm Brown Button Clicked!', 'success')}>
            Secondary
          </Button>
          <Button variant="outline" onClick={() => addToast('Outline Button Clicked!', 'error')}>
            Outline
          </Button>
          <Button variant="primary" isLoading>
            Loading
          </Button>
        </div>
      </Card>

      {/* 📝 Inputs & PinIndicator Section */}
      <Card variant="glass">
        <h3 style={{ marginBottom: '1rem' }}>Inputs & Passcode PIN</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
          <Input
            label="Love Note Preview"
            placeholder="Type something sweet..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            helperText="Write a message to trigger a toast demo"
          />

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-brown-primary)' }}>
              PIN Indicator Demo
            </label>
            <PinIndicator length={4} value={pinValue} isMasked={true} />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
              <Button size="sm" variant="outline" onClick={() => setPinValue((prev) => (prev.length < 4 ? prev + '8' : prev))}>
                Add Digit
              </Button>
              <Button size="sm" variant="text" onClick={() => setPinValue((prev) => prev.slice(0, -1))}>
                Backspace
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 🪟 Modal & Toast Trigger Section */}
      <Card variant="outlined">
        <h3 style={{ marginBottom: '1rem' }}>Interactive Modals</h3>
        <Button variant="gold" onClick={() => setIsModalOpen(true)}>
          Open Romantic Modal
        </Button>
      </Card>

      {/* Interactive Modal Component */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Welcome to Our Story"
      >
        <p style={{ marginBottom: '1.5rem' }}>
          Welcome! This design system is crafted with deep burgundy, cream, and gold accents.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setIsModalOpen(false);
              addToast('Modal action confirmed!', 'success');
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DesignSystemShowcase />} />
            {/* Agad nating idadagdag ang iba pang routes sa Phase 3+ */}
          </Routes>
        </Layout>
      </BrowserRouter>
    </NotificationProvider>
  );
}