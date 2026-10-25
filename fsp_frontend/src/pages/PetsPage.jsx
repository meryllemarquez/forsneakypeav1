import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { usePets } from '../queries/queries';
import { usePetMutations } from '../queries/mutations';
import { faceForMood, lastPetId, rememberPet } from '../constants/pets';
import Navbar from '../components/layout/Navbar/Navbar';
import Footer from '../components/layout/Footer/Footer';
import IconButton from '../components/ui/IconButton/IconButton';
import Button from '../components/ui/Button/Button';
import PetCharacter from '../components/pets/PetCharacter/PetCharacter';
import PetStage from '../components/pets/PetStage/PetStage';
import styles from './PetsPage.module.css';

const WIDE_QUERY = '(min-width: 1000px)';
const COOLDOWN_MS = 8000; // mirrors PetService.COOLDOWN: the same action on the same pet

// The 3x3 grid of faces. A radiogroup: arrow keys move, the selected tile is the one in the tab order.
function PetGrid({ pets, selectedId, onSelect }) {
  const refs = useRef({});
  const move = (e, index) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = pets[(index + step + pets.length) % pets.length];
    onSelect(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div className={styles.grid} role="radiogroup" aria-label="Pick one of the little ones">
      {pets.map((pet, i) => {
        const selected = pet.id === selectedId;
        return (
          <button
            key={pet.id}
            ref={(el) => { refs.current[pet.id] = el; }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={`${styles.tile} ${selected ? styles.tileOn : ''}`}
            onClick={() => onSelect(pet.id)}
            onKeyDown={(e) => move(e, i)}
          >
            <PetCharacter id={pet.id} mood={pet.mood} size={56} idle={false} />
            <span className={styles.tileName}>{pet.name}</span>
            <span className={styles.tileMood}>{faceForMood(pet.mood)}</span>
          </button>
        );
      })}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className={styles.layout} aria-busy="true" aria-label="Loading the little ones">
      <div className={`${styles.skel} ${styles.skelStage}`} />
      <div className={styles.grid}>
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className={`${styles.skel} ${styles.skelTile}`} />
        ))}
      </div>
    </div>
  );
}

export default function PetsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useNotification();
  const wide = useMediaQuery(WIDE_QUERY);
  const { data, isPending, isError, refetch } = usePets();
  const { act } = usePetMutations();

  const [pickedId, setPickedId] = useState(() => lastPetId());
  const [reaction, setReaction] = useState(null);
  const [busy, setBusy] = useState(false);
  const counter = useRef(0);
  const inFlight = useRef(false);
  const [cooldowns, setCooldowns] = useState({}); // 'petId:action' -> timestamp it is ready again
  const [now, setNow] = useState(() => Date.now());

  const resting = Object.values(cooldowns).some((until) => until > now);
  useEffect(() => {
    if (!resting) return undefined;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [resting]);

  const pets = data?.pets ?? [];
  const pet = pets.find((p) => p.id === pickedId) || pets[0];

  const select = (id) => {
    if (busy) return;
    setPickedId(id);
    rememberPet(id);
    setReaction(null);
  };

  const startCooldown = useCallback((petId, action) => {
    const t = Date.now();
    setNow(t);
    setCooldowns((c) => ({ ...c, [`${petId}:${action}`]: t + COOLDOWN_MS }));
  }, []);

  const onAct = useCallback(
    async (action) => {
      if (!pet || busy || inFlight.current) return;
      const target = pet;
      if ((cooldowns[`${target.id}:${action}`] ?? 0) > Date.now()) return;
      inFlight.current = true;
      setBusy(true);
      try {
        const res = await act(target.id, action);
        startCooldown(target.id, action);
        setReaction({ id: ++counter.current, kind: res.reaction.kind, line: res.reaction.line });
      } catch (err) {
        // 429 is the cooldown: rest that button, say so once, never retry
        if (err?.response?.status === 429) {
          startCooldown(target.id, action);
          addToast(`${target.name} needs a little break`, 'info');
        } else {
          addToast(`Couldn't reach ${target.name} just now. Try again?`, 'error');
        }
        setBusy(false);
      } finally {
        inFlight.current = false;
      }
    },
    [pet, busy, cooldowns, act, addToast, startCooldown],
  );

  // seconds left per action for the picked pet, only while resting
  const restingFor = {};
  if (pet) {
    for (const [key, until] of Object.entries(cooldowns)) {
      const [id, action] = key.split(':');
      if (id === pet.id && until > now) restingFor[action] = Math.ceil((until - now) / 1000);
    }
  }

  const reactionEnded = useCallback(() => setBusy(false), []);

  let body;
  if (isPending) {
    body = <PageSkeleton />;
  } else if (isError || !pet) {
    body = (
      <div className={styles.error} role="alert">
        <p>Couldn&apos;t reach the little ones.</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
      </div>
    );
  } else {
    body = (
      <div className={styles.layout}>
        <PetStage
          pet={pet}
          myId={user?.id}
          size={wide ? 200 : 160}
          reaction={reaction}
          busy={busy}
          resting={restingFor}
          onAct={onAct}
          onReactionEnd={reactionEnded}
        />
        <PetGrid pets={pets} selectedId={pet.id} onSelect={select} />
      </div>
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
          <div>
            <h1 className={styles.title}>Our little ones</h1>
            <p className={styles.sub}>all nine of them</p>
          </div>
        </header>
        {body}
      </main>
      <Footer />
    </div>
  );
}
