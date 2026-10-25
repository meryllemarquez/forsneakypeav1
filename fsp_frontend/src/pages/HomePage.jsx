import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useHomeSummary } from '../queries/queries';
import { getDaysTogether, ANNIVERSARY_LABEL } from '../constants/relationship';
import { HOME_GREETINGS } from '../constants/homeGreetings';
import { albumCoverUrl, dateIcon, resolveAlbumIcon } from '../utils/doodleFor';
import Icon from '../components/Icon';
import Navbar from '../components/layout/Navbar/Navbar';
import Footer from '../components/layout/Footer/Footer';
import StatusChip from '../components/ui/StatusChip/StatusChip';
import UsualOrdersCounter from '../components/home/UsualOrdersCounter/UsualOrdersCounter';
import WheelCard from '../components/home/WheelCard/WheelCard';
import styles from './HomePage.module.css';

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h13M13 6l6 6-6 6" />
  </svg>
);

// Hero sticker cluster: the one loud thing on the page (desktop). Sizes/positions from the design.
const PLATE_STICKERS = [
  { icon: 'motmot', size: 170, tilt: -4, left: '33%', top: 128 },
  { icon: 'camera', size: 104, tilt: -10, left: '4%', top: 40 },
  { icon: 'her', size: 88, tilt: 8, left: '36%', top: 4 },
  { icon: 'tulip', size: 92, tilt: 8, left: '70%', top: 22 },
  { icon: 'matcha', size: 86, tilt: 6, left: '78%', top: 210 },
  { icon: 'cookie', size: 80, tilt: -6, left: '64%', top: 336 },
  { icon: 'dog', size: 108, tilt: 6, left: '6%', top: 290 },
  { icon: 'him', size: 84, tilt: -8, left: '25%', top: 346 },
];
const PHONE_STICKERS = [
  { icon: 'her', tilt: -8 },
  { icon: 'tulip', tilt: 6 },
  { icon: 'motmot', tilt: -3 },
  { icon: 'dog', tilt: 8 },
  { icon: 'him', tilt: -6 },
];

const COVER_TINTS = ['var(--sea)', 'var(--gelato)', 'var(--citrus-cover)'];

// 'YYYY-MM-DD' in the viewer's local time zone (toISOString would give the UTC date).
function localDateString(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatMonthDay(dateStr) {
  if (!dateStr) return { mo: '', day: '' };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { mo: '', day: '' };
  return {
    mo: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()).padStart(2, '0'),
  };
}

export default function HomePage() {
  const { user } = useAuth();
  const daysTogether = getDaysTogether();
  // One greeting per visit (picked once when the page opens).
  const [greeting] = useState(() => HOME_GREETINGS[Math.floor(Math.random() * HOME_GREETINGS.length)]);
  const firstName = user?.nickname || (user?.name || '').trim().split(/\s+/)[0] || '';

  // One small request (GET /home/summary) replaces the three list fetches this page used to
  // make. `today` is the viewer's local date so "upcoming" matches their calendar.
  const today = useMemo(() => localDateString(), []);
  const { data: summary, isPending: loadingContent, isError } = useHomeSummary(today);

  const featuredFolders = summary?.folders ?? [];
  const upcomingDates = summary?.upcomingDates ?? [];
  const latestNote = summary?.latestNote ?? null;
  // The single request failing means the backend is almost certainly unreachable, so say so
  // instead of silently showing the "nothing here yet" placeholders.
  const contentError = isError ? "We couldn't reach the server just now. Pull-to-refresh or try again in a moment." : '';

  return (
    <div className={styles.pageContainer}>
      <Navbar />

      {contentError && (
        <div className={styles.errorBanner} role="alert">
          <Icon name="bell" size={30} />
          <span>{contentError}</span>
        </div>
      )}

      <main>
        {/* HERO */}
        <section className={styles.hero}>
          <motion.div className={styles.heroText} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <p className={styles.dayBadge} title={ANNIVERSARY_LABEL}>
              <Icon name="sparkle" size={24} />
              <span>Day {daysTogether.toLocaleString('en-US')} together</span>
            </p>

            <h1 className={styles.heroHeading}>
              Our little world, kept in one <span className={styles.marker}>place.</span>
            </h1>

            <p className={styles.heroSubtext}>
              {firstName ? `Hi ${firstName}! ` : 'Hi love! '}
              {greeting}
            </p>

            <div className={styles.ctaRow}>
              <Link to="/memories" className={styles.primaryBtn}>
                <span className={styles.longLabel}>Open our memories</span>
                <span className={styles.shortLabel}>Memories</span>
                <ArrowRight />
              </Link>
              <Link to="/dates" className={styles.secondaryBtn}>
                <Icon name="motmot" size={28} />
                Plan a date
              </Link>
            </div>
          </motion.div>

          {/* Desktop: terrazzo plate with the sticker cluster */}
          <div className={styles.plateWrap} aria-hidden="true">
            <div className={styles.plate} />
            {PLATE_STICKERS.map((s) => (
              <div key={s.icon} className={styles.plateSticker} style={{ left: s.left, top: s.top }}>
                <Icon name={s.icon} size={s.size} sticker tilt={s.tilt} />
              </div>
            ))}
            <p className={styles.rideLabel}>our ride!</p>
            <svg className={styles.rideArrow} viewBox="0 0 60 40" width="60" height="40" fill="none" stroke="var(--tomato)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M52 4 C40 8 26 18 12 32M12 32 l2-11M12 32 l11-2" />
            </svg>
          </div>

          {/* Phone: the same idea as a small row */}
          <div className={styles.stickerRow} aria-hidden="true">
            {PHONE_STICKERS.map((s) => (
              <Icon key={s.icon} name={s.icon} size={54} sticker tilt={s.tilt} />
            ))}
          </div>
        </section>

        {/* RECENT MEMORIES */}
        <section className={styles.section} aria-labelledby="home-memories">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.handLabel}>fresh from the camera roll</p>
              <h2 id="home-memories" className={styles.sectionTitle}>Recent memories</h2>
            </div>
            <Link to="/memories" className={styles.sectionLink}>
              See all albums <span aria-hidden="true">→</span>
            </Link>
          </div>

          {loadingContent ? (
            <div className={styles.memoryGrid} aria-busy="true" aria-label="Loading your memories">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`${styles.memoryCard} ${styles.skeleton}`} />
              ))}
            </div>
          ) : featuredFolders.length === 0 ? (
            <div className={styles.emptyCard}>
              <Icon name="camera" size={72} sticker tilt={-6} />
              <p>No albums yet, love. Start your first one.</p>
              <Link to="/memories" className={styles.primaryBtn}>
                Create an album
                <ArrowRight />
              </Link>
            </div>
          ) : (
            <div className={styles.memoryGrid}>
              {featuredFolders.map((folder, i) => (
                <Link key={folder.id} to={`/memories?folderId=${folder.id}`} className={styles.memoryCard}>
                  <div className={styles.memoryCover} style={albumCoverUrl(folder) ? undefined : { background: COVER_TINTS[i % COVER_TINTS.length] }}>
                    {albumCoverUrl(folder) ? (
                      <img src={albumCoverUrl(folder)} alt="" className={styles.coverImg} loading="lazy" decoding="async" />
                    ) : (
                      <Icon name={resolveAlbumIcon(folder)} size={108} className={styles.coverIcon} />
                    )}
                    <span className={styles.photoChip}>
                      {folder.photoCount ?? 0} {folder.photoCount === 1 ? 'photo' : 'photos'}
                    </span>
                  </div>
                  <div className={styles.memoryBody}>
                    <h3 className={styles.memoryTitle}>{folder.name}</h3>
                    <p className={styles.memoryCaption}>{folder.description || 'A little pocket of time.'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* NEXT ADVENTURES + LATEST LETTER */}
        <section className={`${styles.section} ${styles.twoCol}`}>
          <div className={styles.adventures} aria-labelledby="home-adventures">
            <div className={styles.cardHead}>
              <div>
                <p className={styles.handLabelSm}>coming up</p>
                <h2 id="home-adventures" className={styles.cardTitle}>Next adventures</h2>
              </div>
              <Link to="/dates" className={styles.sectionLink}>
                All dates <span aria-hidden="true">→</span>
              </Link>
            </div>

            {loadingContent ? (
              <p className={styles.mutedNote}>Loading your plans…</p>
            ) : upcomingDates.length === 0 ? (
              <div className={styles.emptyInner}>
                <Icon name="motmot" size={64} sticker tilt={-4} />
                <p>Nothing planned yet.</p>
                <Link to="/dates" className={styles.primaryBtn}>
                  Plan something
                  <ArrowRight />
                </Link>
              </div>
            ) : (
              <ul className={styles.dateList}>
                {upcomingDates.map((item, i) => {
                  const { mo, day } = formatMonthDay(item.plannedDate);
                  return (
                    <li key={item.id} className={`${styles.dateRow} ${i === 0 ? styles.dateRowFirst : ''}`}>
                      <Link to={`/dates?dateId=${item.id}`} className={styles.dateLink}>
                        <div className={styles.dateBadge}>
                          <span className={styles.dateBadgeMo}>{mo}</span>
                          <span className={styles.dateBadgeDay}>{day}</span>
                        </div>
                        <div className={styles.dateDetails}>
                          <p className={styles.dateTitle}>{item.title}</p>
                          <p className={styles.dateMeta}>
                            {formatDate(item.plannedDate)}
                            {item.location ? ` · ${item.location}` : ''}
                          </p>
                        </div>
                        <Icon name={dateIcon(item.title, item.location)} size={48} className={styles.dateIcon} />
                        <StatusChip status={item.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={styles.noteWrap}>
            <div className={styles.tape} aria-hidden="true" />
            <div className={styles.note}>
              <p className={styles.noteLabel}>latest letter</p>
              {loadingContent ? (
                <p className={styles.noteQuote}>Loading…</p>
              ) : latestNote ? (
                <>
                  <p className={styles.noteQuote}>
                    {(latestNote.content || 'A note without words, but full of feeling.').slice(0, 160)}
                  </p>
                  <p className={styles.noteDate}>{formatDate(latestNote.createdAt)}</p>
                  <div className={styles.noteFoot}>
                    <p className={styles.noteAuthor}>
                      — {latestNote.authorName || 'someone who loves you'}
                      <Icon name="heart" size={26} />
                    </p>
                    <Link to="/letters" className={styles.sectionLink}>
                      Open the board <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className={styles.noteQuote}>No love letters yet. Pin the first one!</p>
                  <div className={styles.noteFoot}>
                    <span />
                    <Link to="/letters" className={styles.sectionLink}>
                      Open the board <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className={styles.section} aria-label="Spin the wheel">
          <WheelCard />
        </section>

        {/* OUR USUAL ORDERS (gingham band) */}
        <section className={styles.orders} aria-labelledby="home-orders">
          <div className={styles.ordersInner}>
            <p className={styles.ordersHand}>for when we can&rsquo;t decide</p>
            <br />
            <h2 id="home-orders" className={styles.ordersTitle}>Our usual orders</h2>
            <UsualOrdersCounter />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
