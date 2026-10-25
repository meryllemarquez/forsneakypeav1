import { Footprints, Heart, UtensilsCrossed, Volleyball } from 'lucide-react';
import PetCharacter from '../PetCharacter/PetCharacter';
import PetMeters from '../PetMeters/PetMeters';
import Button from '../../ui/Button/Button';
import { ACTIONS, lastLine, moodLine } from '../../../constants/pets';
import styles from './PetStage.module.css';

const ACTION_ICON = { feed: UtensilsCrossed, play: Volleyball, hug: Heart, walk: Footprints };

/**
 * The selected pet, big: figure + reaction, a warm mood line, the three meters, the action
 * buttons and who visited last. `busy` disables the buttons while a reaction plays.
 */
export default function PetStage({ pet, myId, size, reaction, busy, onAct, onReactionEnd }) {
  const isDog = pet.kind === 'dog';
  const last = lastLine(pet, myId);

  return (
    <section className={styles.stage} aria-labelledby="pet-stage-name">
      <div className={styles.figure}>
        <PetCharacter id={pet.id} mood={pet.mood} size={size} reaction={reaction} onReactionEnd={onReactionEnd} />
      </div>

      <h2 id="pet-stage-name" className={styles.name}>{pet.name}</h2>
      <p className={styles.kind}>{isDog ? 'Dog' : 'Plushie'}</p>
      <p className={styles.mood}>{moodLine(pet.name, pet.mood)}</p>

      <PetMeters pet={pet} />

      <div className={styles.actions} role="group" aria-label={`Things to do with ${pet.name}`}>
        {ACTIONS.filter((a) => isDog || !a.dogsOnly).map((a) => {
          const IconCmp = ACTION_ICON[a.id];
          return (
            <Button key={a.id} variant="secondary" size="sm" disabled={busy} aria-busy={busy || undefined} onClick={() => onAct(a.id)}>
              <IconCmp size={18} strokeWidth={2.4} aria-hidden="true" />
              {a.label}
            </Button>
          );
        })}
      </div>

      <p className={styles.last}>{last || 'Nobody has visited yet today.'}</p>
      <p className={styles.counts}>
        {pet.counts.feed} snacks · {pet.counts.hug} hugs
      </p>
    </section>
  );
}
