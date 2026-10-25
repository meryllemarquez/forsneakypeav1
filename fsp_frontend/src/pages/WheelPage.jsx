import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { useWheels, useWheelSpins, useMenuItems } from '../queries/queries';
import { useWheelMutations } from '../queries/mutations';
import { useNotification } from '../hooks/useNotification';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
  WHEEL_LIMITS,
  choicesFromMenu,
  defaultWheelColors,
  lastWheelId,
  newChoiceId,
  rememberWheel,
} from '../constants/wheelOptions';
import Icon from '../components/Icon';
import Navbar from '../components/layout/Navbar/Navbar';
import Footer from '../components/layout/Footer/Footer';
import Button from '../components/ui/Button/Button';
import IconButton from '../components/ui/IconButton/IconButton';
import Chip from '../components/ui/Chip/Chip';
import Field from '../components/ui/Field/Field';
import Modal from '../components/ui/Modal/Modal';
import SpinWheel from '../components/wheel/SpinWheel/SpinWheel';
import ChoiceEditor from '../components/wheel/ChoiceEditor/ChoiceEditor';
import SpinHistory from '../components/wheel/SpinHistory/SpinHistory';
import form from '../components/ui/FormControls.module.css';
import styles from './WheelPage.module.css';

const WIDE_QUERY = '(min-width: 1100px)';

// "New wheel" dialog: a name and the first two choices (a wheel needs at least 2).
function NewWheelModal({ open, initialName = '', onClose, onCreated }) {
  const { createWheel } = useWheelMutations();
  const { addToast } = useNotification();
  const [name, setName] = useState(initialName);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setFirst('');
      setSecond('');
    }
  }, [open, initialName]);

  const ready = name.trim() && first.trim() && second.trim();

  const submit = async (e) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    const colors = defaultWheelColors(2);
    try {
      const wheel = await createWheel({
        name: name.trim(),
        choices: [first, second].map((label, i) => ({ id: newChoiceId(), label: label.trim(), color: colors[i], doodle: null })),
      });
      onCreated(wheel);
    } catch (err) {
      addToast(err?.response?.data?.message || "Couldn't make that wheel. Try again.", 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New wheel" size="sm" locked={busy}>
      <form className={form.form} onSubmit={submit}>
        <Field label="Wheel name" required>
          <input className={form.input} value={name} maxLength={WHEEL_LIMITS.maxName} placeholder="Saan pupunta?" onChange={(e) => setName(e.target.value)} data-autofocus />
        </Field>
        <Field label="First choice" required>
          <input className={form.input} value={first} maxLength={WHEEL_LIMITS.maxLabel} placeholder="Where to?" onChange={(e) => setFirst(e.target.value)} />
        </Field>
        <Field label="Second choice" required hint="You can add up to 10 more after.">
          <input className={form.input} value={second} maxLength={WHEEL_LIMITS.maxLabel} placeholder="Where else?" onChange={(e) => setSecond(e.target.value)} />
        </Field>
        <div className={styles.modalActions}>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="primary" loading={busy} disabled={!ready}>Make the wheel</Button>
        </div>
      </form>
    </Modal>
  );
}

function Section({ title, open, onToggle, wide, id, children }) {
  return (
    <section className={styles.section}>
      {wide ? (
        <h2 className={styles.sectionTitle}>{title}</h2>
      ) : (
        <h2 className={styles.sectionTitle}>
          <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={id} onClick={onToggle}>
            {title}
            <ChevronDown size={20} className={open ? styles.chevronOpen : undefined} aria-hidden="true" />
          </button>
        </h2>
      )}
      {(wide || open) && <div id={id}>{children}</div>}
    </section>
  );
}

export default function WheelPage() {
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const wide = useMediaQuery(WIDE_QUERY);
  const { data: wheels = [], isLoading, isError, refetch } = useWheels();
  const { data: menuItems = [] } = useMenuItems();
  const mutations = useWheelMutations();

  const [selectedId, setSelectedId] = useState(() => lastWheelId());
  const [draft, setDraft] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(null); // null | { name }
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const lastSpin = useRef(null);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Spin the wheel';
    return () => {
      document.title = previous;
    };
  }, []);

  const selected = wheels.find((w) => w.id === selectedId) || wheels[0] || null;
  const live = selected && draft?.wheelId === selected.id ? draft : null;
  const choices = live ? live.choices : selected?.choices || [];
  const wheelName = live ? live.name.trim() || selected.name : selected?.name || '';

  const spinsQuery = useWheelSpins(selected?.id);

  useEffect(() => {
    if (selected) rememberWheel(selected.id);
  }, [selected]);

  const select = (id) => {
    setSelectedId(id);
    setDraft(null);
  };

  const created = (wheel) => {
    setCreating(null);
    select(wheel.id);
    setEditOpen(true);
  };

  const startKakain = async () => {
    const choicesFromFood = choicesFromMenu(menuItems, []);
    if (choicesFromFood.length < 2) {
      setCreating({ name: 'Saan kakain?' });
      return;
    }
    setStarting(true);
    try {
      created(await mutations.createWheel({ name: 'Saan kakain?', choices: choicesFromFood }));
    } catch {
      addToast("Couldn't make that wheel. Try again.", 'error');
    } finally {
      setStarting(false);
    }
  };

  const reload = async () => {
    await refetch();
    setDraft(null);
    setReloadKey((k) => k + 1);
  };

  const handleResult = (choice) => {
    const wheelId = selected.id;
    lastSpin.current = mutations
      .addSpin(wheelId, { choiceId: choice.id, label: choice.label })
      .catch((err) => {
        if (err?.response?.status === 404) addToast("That wheel was deleted, so this spin wasn't saved.", 'error');
        return null;
      });
  };

  const handleAccept = async () => {
    const spin = await lastSpin.current;
    if (!spin) return;
    try {
      await mutations.setSpinAccepted(spin.id, true);
    } catch {
      addToast("Couldn't mark that one as chosen.", 'error');
    }
  };

  const chips = selected && (
    <div role="radiogroup" aria-label="Your wheels" className={wide && wheels.length > 4 ? styles.chipList : styles.chips}>
      {wheels.map((w) => (
        <Chip key={w.id} radio active={w.id === selected.id} className={styles.chip} onClick={() => select(w.id)}>
          {w.name}
        </Chip>
      ))}
      <Chip className={styles.chip} onClick={() => setCreating({ name: '' })}>+ New</Chip>
    </div>
  );

  const editor = selected && (
    <ChoiceEditor
      key={`${selected.id}:${reloadKey}`}
      wheel={selected}
      menuItems={menuItems}
      onDraft={setDraft}
      onDeleted={() => setSelectedId(null)}
      onReload={reload}
    />
  );

  const history = selected && (
    <SpinHistory
      spins={spinsQuery.data || []}
      loading={spinsQuery.isLoading}
      error={spinsQuery.isError}
      onRetry={() => spinsQuery.refetch()}
      onClear={() => mutations.clearSpins(selected.id)}
    />
  );

  let body;
  if (isLoading) {
    body = (
      <div className={styles.loading} aria-busy="true" aria-label="Loading your wheels">
        <div className={styles.skeletonWheel} />
      </div>
    );
  } else if (isError) {
    body = (
      <div className={styles.card} role="alert">
        <p className={styles.cardTitle}>Couldn&apos;t load your wheels.</p>
        <Button onClick={() => refetch()}>Try again</Button>
      </div>
    );
  } else if (!selected) {
    body = (
      <div className={styles.card}>
        <Icon name="wheel" size={96} sticker tilt={-6} />
        <p className={styles.cardTitle}>No wheels yet, love.</p>
        <p className={styles.hand}>can&apos;t decide? let the wheel do it</p>
        <div className={styles.starters}>
          <Button variant="primary" onClick={startKakain} loading={starting}>Saan kakain?</Button>
          <Button onClick={() => setCreating({ name: 'Saan pupunta?' })}>Saan pupunta?</Button>
        </div>
      </div>
    );
  } else {
    body = (
      <>
        {!(wide && wheels.length > 4) && chips}
        <div className={styles.layout}>
          <div className={styles.stage}>
            <SpinWheel
              name={wheelName}
              choices={choices}
              size={wide ? 440 : undefined}
              onResult={handleResult}
              onAccept={handleAccept}
            />
          </div>
          <div className={styles.side}>
            {wide && wheels.length > 4 && chips}
            <Section title="Edit choices" open={editOpen} onToggle={() => setEditOpen((o) => !o)} wide={wide} id="wheel-editor">
              {editor}
            </Section>
            <Section title="Recent spins" open={historyOpen} onToggle={() => setHistoryOpen((o) => !o)} wide={wide} id="wheel-history">
              {history}
            </Section>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <header className={styles.head}>
          <IconButton label="Back to Home" onClick={() => navigate('/home')}>
            <ChevronLeft size={22} aria-hidden="true" />
          </IconButton>
          <h1 className={styles.title}>Spin the wheel</h1>
          <Button size="sm" variant="secondary" onClick={() => setCreating({ name: '' })}>New wheel</Button>
        </header>
        {body}
      </main>
      <Footer />

      <NewWheelModal
        open={Boolean(creating)}
        initialName={creating?.name || ''}
        onClose={() => setCreating(null)}
        onCreated={created}
      />
    </div>
  );
}
