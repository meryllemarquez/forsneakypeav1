import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useBouquets } from '../queries/queries';
import { useBouquetMutations } from '../queries/mutations';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import Icon from '../components/Icon';
import Navbar from '../components/layout/Navbar/Navbar';
import Footer from '../components/layout/Footer/Footer';
import Button from '../components/ui/Button/Button';
import IconButton from '../components/ui/IconButton/IconButton';
import Chip from '../components/ui/Chip/Chip';
import DeleteAllDialog from '../components/ui/DeleteAllDialog/DeleteAllDialog';
import BouquetCard from '../components/bouquet/BouquetCard/BouquetCard';
import styles from './BouquetGalleryPage.module.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Mine' },
  { id: 'theirs', label: 'Theirs' },
];

// "Our bouquets": newest first, filter chips, a card per bouquet.
export default function BouquetGalleryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useNotification();
  const reduced = useReducedMotion();
  const { data: bouquets = [], isLoading, isError, refetch } = useBouquets();
  const { deleteAllBouquets } = useBouquetMutations();
  const [filter, setFilter] = useState('all');
  const [wiping, setWiping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const shown = bouquets.filter((b) => filter === 'all' || (filter === 'mine') === (b.createdBy === user?.id));

  const wipe = async () => {
    setBusy(true);
    setError('');
    try {
      await deleteAllBouquets();
      setWiping(false);
      addToast('All bouquets deleted.', 'success');
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't delete the bouquets. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <header className={styles.head}>
          <IconButton label="Back to Home" onClick={() => navigate('/home')}>
            <ChevronLeft size={20} />
          </IconButton>
          <h1 className={styles.title}>Our bouquets</h1>
          <Button variant="primary" size="sm" onClick={() => navigate('/bouquets/new')}>
            New bouquet
          </Button>
        </header>

        {bouquets.length > 0 && (
          <div className={styles.chips} role="radiogroup" aria-label="Whose bouquets">
            {FILTERS.map((f) => (
              <Chip key={f.id} radio active={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </Chip>
            ))}
          </div>
        )}

        {isLoading && (
          <ul className={styles.grid} aria-label="Loading bouquets" aria-busy="true">
            {[0, 1, 2, 3].map((n) => (
              <li key={n} className={styles.skeleton} />
            ))}
          </ul>
        )}

        {isError && (
          <div className={styles.state} role="alert">
            <p className={styles.hand}>Couldn&apos;t load the bouquets.</p>
            <Button variant="secondary" onClick={() => refetch()}>Try again</Button>
          </div>
        )}

        {!isLoading && !isError && bouquets.length === 0 && (
          <div className={styles.state}>
            <Icon name="tulip" size={96} />
            <p className={styles.hand}>No bouquets yet, love.</p>
            <Button variant="primary" onClick={() => navigate('/bouquets/new')}>Make our first one</Button>
          </div>
        )}

        {shown.length > 0 && (
          <ul className={styles.grid}>
            {shown.map((b, i) => (
              <motion.li
                key={b.id}
                initial={reduced ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: Math.min(i * 0.06, 0.6) }}
              >
                <BouquetCard bouquet={b} />
              </motion.li>
            ))}
          </ul>
        )}

        {bouquets.length > 0 && shown.length === 0 && (
          <p className={styles.hand}>Nothing here yet. <Link to="/bouquets/new">Make one?</Link></p>
        )}

        {bouquets.length > 0 && (
          <div className={styles.wipe}>
            <Button variant="ghost" onClick={() => setWiping(true)}>Delete all bouquets</Button>
          </div>
        )}
      </main>
      <Footer />

      <DeleteAllDialog
        open={wiping}
        what="all bouquets (and any that are pinned on the Love Board)"
        busy={busy}
        error={error}
        onConfirm={wipe}
        onClose={() => setWiping(false)}
      />
    </div>
  );
}
