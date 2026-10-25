import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useBouquet, useLoveStickers } from '../queries/queries';
import { useBouquetMutations, useLoveBoardMutations } from '../queries/mutations';
import { keyFamilies } from '../queries/queryKeys';
import { useNotification } from '../hooks/useNotification';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../constants/loveBoardConstants';
import { normalizeRecipe } from '../utils/bouquetRecipe';
import Navbar from '../components/layout/Navbar/Navbar';
import Footer from '../components/layout/Footer/Footer';
import Button from '../components/ui/Button/Button';
import IconButton from '../components/ui/IconButton/IconButton';
import Modal from '../components/ui/Modal/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog/ConfirmDialog';
import BouquetCanvas from '../components/bouquet/BouquetCanvas/BouquetCanvas';
import styles from './BouquetViewPage.module.css';

const formatDay = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long' }) : '');

// /bouquets/:id: the big picture, the letter, and Edit / Export PNG / Pin to the Love Board / Delete.
export default function BouquetViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useNotification();
  const { data: bouquet, isLoading, isError, refetch } = useBouquet(id);
  const { data: stickers = [] } = useLoveStickers();
  const { deleteBouquet } = useBouquetMutations();
  const { createSticker } = useLoveBoardMutations();

  const [reading, setReading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  const recipe = useMemo(() => (bouquet ? normalizeRecipe(bouquet.recipe) : null), [bouquet]);

  const exportPng = async () => {
    setExporting(true);
    try {
      // Loaded on demand: the export code (and react-dom/server) is not part of the page bundle.
      const { default: exportBouquetPng } = await import('../utils/exportBouquetPng');
      await exportBouquetPng(recipe, bouquet.title);
      addToast('Saved your bouquet picture', 'success');
    } catch {
      addToast("Couldn't make the picture. Try again.", 'error');
    } finally {
      setExporting(false);
    }
  };

  const pin = async () => {
    setPinning(true);
    try {
      const top = stickers.reduce((m, s) => Math.max(m, s.zIndex || 1), 1);
      await createSticker({
        image: `bouquet:${bouquet.id}`,
        positionX: Math.round(BOARD_WIDTH / 2 - 60 + (Math.random() - 0.5) * 160),
        positionY: Math.round(BOARD_HEIGHT / 2 - 60 + (Math.random() - 0.5) * 120),
        rotation: 0,
        scale: 1.4,
        zIndex: top + 1,
      });
      await queryClient.invalidateQueries({ queryKey: keyFamilies.loveStickers });
      setPinned(true);
      addToast('Pinned! Go see it on the board.', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || "Couldn't pin it. Try again.", 'error');
    } finally {
      setPinning(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteBouquet(bouquet.id);
      navigate('/bouquets', { replace: true });
    } catch {
      addToast("Couldn't delete that bouquet. Try again.", 'error');
      setBusy(false);
    }
  };

  const shell = (children) => (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );

  if (isLoading) return shell(<p className={styles.hand} role="status">Loading your bouquet…</p>);
  if (isError || !bouquet) {
    return shell(
      <>
        <p className={styles.hand} role="alert">Couldn&apos;t load that bouquet.</p>
        <div className={styles.row}>
          <Button variant="secondary" onClick={() => refetch()}>Try again</Button>
          <Button variant="ghost" onClick={() => navigate('/bouquets')}>Back to bouquets</Button>
        </div>
      </>
    );
  }

  const letter = recipe.card;
  const hasLetter = recipe.card.show !== false && Boolean(letter.text || letter.to || letter.from);

  return shell(
    <>
      <header className={styles.head}>
        <IconButton label="Back to bouquets" onClick={() => navigate('/bouquets')}>
          <ChevronLeft size={20} />
        </IconButton>
        <div className={styles.titles}>
          <h1 className={styles.title}>{bouquet.title}</h1>
          <p className={styles.by}>by {bouquet.createdByName || 'someone'} · {formatDay(bouquet.createdAt)}</p>
        </div>
      </header>

      <div className={styles.stage}>
        <BouquetCanvas recipe={recipe} onCardActivate={hasLetter ? () => setReading(true) : undefined} />
      </div>
      {hasLetter && <p className={styles.tip}>Tap the card to read the letter.</p>}

      <div className={styles.actions}>
        <Button variant="primary" loading={pinning} onClick={pin}>Pin to the Love Board</Button>
        <Button variant="secondary" onClick={() => navigate(`/bouquets/${bouquet.id}/edit`)}>Edit</Button>
        <Button variant="secondary" loading={exporting} onClick={exportPng}>Export PNG</Button>
        <Button variant="ghost" onClick={() => setDeleting(true)}>Delete</Button>
      </div>
      {pinned && (
        <p className={styles.hand} role="status">
          Pinned! <Link to="/letters">Go to the board</Link>
        </p>
      )}

      <Modal open={reading} onClose={() => setReading(false)} title={letter.to ? `For ${letter.to}` : 'A letter'} size="sm">
        <p className={styles.letter}>{letter.text}</p>
        {letter.from && <p className={styles.from}>from {letter.from}</p>}
      </Modal>

      <ConfirmDialog
        open={deleting}
        title="Throw this bouquet away?"
        message="It will disappear for both of you, and from the Love Board if it's pinned there."
        confirmLabel="Throw it away"
        cancelLabel="Keep it"
        busyLabel="Deleting…"
        busy={busy}
        danger
        onConfirm={remove}
        onClose={() => !busy && setDeleting(false)}
      />
    </>
  );
}
