import { Link } from 'react-router-dom';
import PetCharacter from '../../pets/PetCharacter/PetCharacter';
import { usePets } from '../../../queries/queries';
import styles from './PetsWidget.module.css';

// "Tato would love a snack." One warm line about whoever has waited longest.
function warmLine(pet) {
  switch (pet.mood) {
    case 'sleepy': return `${pet.name} is sleepy, a cuddle would be nice.`;
    case 'peckish': return `${pet.name} would love a snack.`;
    case 'needs_cuddle': return `${pet.name} would love a hug.`;
    case 'so_happy': return `${pet.name} is so happy you're here.`;
    default: return `${pet.name} is having a good day.`;
  }
}

// Never visited first, then the longest ago.
const waitedLongest = (a, b) => (a.last?.at ? Date.parse(a.last.at) : 0) - (b.last?.at ? Date.parse(b.last.at) : 0);

/**
 * "How are the babies?" on Home. Four faces + one warm line, links to /pets. A failure or an
 * empty list hides the card silently so Home never breaks.
 */
export default function PetsWidget() {
  const { data, isPending, isError } = usePets();
  const pets = data?.pets ?? [];
  if (isError || (!isPending && pets.length === 0)) return null;

  const four = [...pets].sort(waitedLongest).slice(0, 4);

  return (
    <Link to="/pets" className={styles.card} aria-label="How are the babies? Visit our little ones">
      <span className={styles.text}>
        <span className={styles.title}>How are the babies?</span>
        <span className={styles.hand}>{isPending ? 'checking on them...' : warmLine(four[0])}</span>
      </span>
      <span className={styles.faces} aria-hidden="true">
        {isPending
          ? [0, 1, 2, 3].map((i) => <span key={i} className={styles.skel} />)
          : four.map((p) => (
              <span key={p.id} className={styles.face}>
                <PetCharacter id={p.id} mood={p.mood} size={44} idle={false} />
              </span>
            ))}
      </span>
      <span className={styles.visit}>Visit</span>
    </Link>
  );
}
