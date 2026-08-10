import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { memoryService } from '../services/memoryService';
import { dateService } from '../services/dateService';
import { loveBoardService } from '../services/loveBoardService';
import { getDaysTogether, ANNIVERSARY_LABEL } from '../constants/relationship';
import Navbar from '../components/layout/Navbar/Navbar';
import Footer from '../components/layout/Footer/Footer';
import styles from './HomePage.module.css';

const HeartOutlineIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21s-7.2-4.6-10-9.3C.6 8.4 2 4.8 5.3 4.1c2-.4 3.9.5 5 2.2 1.1-1.7 3-2.6 5-2.2 3.3.7 4.7 4.3 3.3 7.6C19.2 16.4 12 21 12 21z"></path>
  </svg>
);

const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
);

const FlowerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12c0-3 -2-5-2-7a2 2 0 1 1 4 0c0 2-2 4-2 7zm0 0c3 0 5-2 7-2a2 2 0 1 1 0 4c-2 0-4-2-7-2zm0 0c0 3 2 5 2 7a2 2 0 1 1-4 0c0-2 2-4 2-7zm0 0c-3 0-5 2-7 2a2 2 0 1 1 0-4c2 0 4 2 7 2z" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"></line>
    <polyline points="7 7 17 7 17 17"></polyline>
  </svg>
);

const COLLAGE_GRADIENTS = [
  'linear-gradient(150deg, var(--color-blush, #F4A9B8), #f6cbd2)',
  'linear-gradient(150deg, var(--color-sage, #8FAE7D), #d9e6cf)',
  'linear-gradient(150deg, #f0d8b8, var(--color-blush, #F4A9B8))',
];

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
    mo: d.toLocaleDateString('en-US', { month: 'short' }),
    day: String(d.getDate()).padStart(2, '0'),
  };
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const daysTogether = getDaysTogether();

  const [featuredFolders, setFeaturedFolders] = useState([]);
  const [upcomingDates, setUpcomingDates] = useState([]);
  const [latestNote, setLatestNote] = useState(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [contentError, setContentError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadHomeContent = async () => {
      const [foldersResult, datesResult, notesResult] = await Promise.allSettled([
        memoryService.getFolders(false),
        dateService.getDates({ includeArchived: false }),
        loveBoardService.getNotes(),
      ]);

      if (!isMounted) return;

      if (foldersResult.status === 'fulfilled') {
        setFeaturedFolders((foldersResult.value || []).slice(0, 3));
      }

      if (datesResult.status === 'fulfilled') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = (datesResult.value || [])
          .filter((d) => d.plannedDate && new Date(d.plannedDate) >= today)
          .sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate))
          .slice(0, 2);
        setUpcomingDates(upcoming);
      }

      if (notesResult.status === 'fulfilled') {
        const notes = Array.isArray(notesResult.value) ? notesResult.value : [];
        const visible = notes
          .filter((n) => !n.isArchived)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLatestNote(visible[0] || null);
      }

      // All three independent sections failed at once — almost certainly the
      // backend is unreachable rather than one section being empty, so say so
      // instead of silently showing the "nothing here yet" placeholders.
      const allFailed = [foldersResult, datesResult, notesResult].every((r) => r.status === 'rejected');
      setContentError(allFailed ? "We couldn't reach the server just now. Pull-to-refresh or try again in a moment." : '');

      setLoadingContent(false);
    };

    loadHomeContent();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={styles.pageContainer}>
      <Navbar />

      {contentError && <div className={styles.errorBanner}>{contentError}</div>}

      <main>
        {/* HERO */}
        <section className={styles.hero}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <span className={styles.heroBadge}>
              <HeartOutlineIcon />
              {ANNIVERSARY_LABEL} — day {daysTogether}
            </span>

            <h1 className={styles.heroHeading}>
              A quiet little<br /><span className={styles.emphasis}>archive of us.</span>
            </h1>

            <p className={styles.heroSubtext}>
              Every memory, plan, and love note {user?.name ? `${user.name} and ` : ''}the two of you have kept — folded into one gentle place that only you can open.
            </p>

            <div className={styles.ctaRow}>
              <button className={styles.primaryPillBtn} onClick={() => navigate('/memories')}>
                Browse memories
                <ArrowRightIcon />
              </button>
              <button className={styles.ghostPillBtn} onClick={() => navigate('/dates')}>
                Plan a date
              </button>
            </div>
          </motion.div>

          <motion.div
            className={styles.collage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {(featuredFolders.length > 0
              ? featuredFolders.slice(0, 3)
              : [{ id: 'p1', name: 'Your memories' }, { id: 'p2', name: 'will appear' }, { id: 'p3', name: 'right here' }]
            ).map((folder, i) => (
              <motion.div key={folder.id} className={`${styles.polaroid} ${styles[`p${i + 1}`]}`} whileHover={{ y: -6, rotate: 0 }}>
                <div
                  className={styles.polaroidFrame}
                  style={{ background: folder.coverImageUrl ? `url(${folder.coverImageUrl}) center/cover` : COLLAGE_GRADIENTS[i % 3] }}
                />
                <div className={styles.polaroidCaption}>{folder.name}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <FlowerIcon />
          <span className={styles.dividerLine} />
        </div>

        {/* FEATURED MEMORIES */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.eyebrow}>Recently added</span>
              <h2 className={styles.sectionTitle}>Featured memories</h2>
            </div>
            <button className={styles.sectionLink} onClick={() => navigate('/memories')}>
              View all
              <ArrowUpRightIcon />
            </button>
          </div>

          {loadingContent ? (
            <p className={styles.mutedNote}>Loading your memories…</p>
          ) : featuredFolders.length === 0 ? (
            <div className={styles.emptyCard}>
              <p>No albums yet — start your first one.</p>
              <button className={styles.primaryPillBtn} onClick={() => navigate('/memories')}>
                Create an album
                <ArrowRightIcon />
              </button>
            </div>
          ) : (
            <div className={styles.memoryGrid}>
              {featuredFolders.map((folder) => (
                <motion.article
                  key={folder.id}
                  className={styles.memoryCard}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate('/memories')}
                >
                  <div
                    className={styles.memoryPhoto}
                    style={{ background: folder.coverImageUrl ? `url(${folder.coverImageUrl}) center/cover` : COLLAGE_GRADIENTS[0] }}
                  >
                    <span className={styles.photoChip}>{folder.photoCount ?? 0} photos</span>
                  </div>
                  <div className={styles.memoryBody}>
                    <h3 className={styles.memoryTitle}>{folder.name}</h3>
                    <p className={styles.memoryCaption}>{folder.description || 'A little pocket of time.'}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        {/* UPCOMING + NOTE */}
        <section className={styles.section}>
          <div className={styles.twoCol}>
            <div>
              <div className={styles.sectionHead}>
                <div>
                  <span className={styles.eyebrow}>Coming up</span>
                  <h2 className={styles.sectionTitle}>Upcoming adventures</h2>
                </div>
                <button className={styles.sectionLink} onClick={() => navigate('/dates')}>
                  Calendar
                  <ArrowUpRightIcon />
                </button>
              </div>

              {loadingContent ? (
                <p className={styles.mutedNote}>Loading your plans…</p>
              ) : upcomingDates.length === 0 ? (
                <div className={styles.emptyCard}>
                  <p>Nothing planned yet.</p>
                  <button className={styles.primaryPillBtn} onClick={() => navigate('/dates')}>
                    Plan something
                    <ArrowRightIcon />
                  </button>
                </div>
              ) : (
                upcomingDates.map((item) => {
                  const { mo, day } = formatMonthDay(item.plannedDate);
                  return (
                    <motion.div key={item.id} className={styles.dateCard} whileHover={{ x: 4 }} onClick={() => navigate('/dates')}>
                      <div className={styles.dateBadge}>
                        <span className={styles.dateBadgeMo}>{mo}</span>
                        <span className={styles.dateBadgeDay}>{day}</span>
                      </div>
                      <div className={styles.dateDetails}>
                        <h4 className={styles.dateTitle}>{item.title}</h4>
                        <p className={styles.dateMeta}>{formatDate(item.plannedDate)}{item.location ? ` · ${item.location}` : ''}</p>
                      </div>
                      <span className={styles.statusPill}>{item.status || 'Planned'}</span>
                    </motion.div>
                  );
                })
              )}
            </div>

            <div>
              <div className={styles.sectionHead}>
                <div>
                  <span className={styles.eyebrow}>A little something</span>
                  <h2 className={styles.sectionTitle}>Recent note</h2>
                </div>
              </div>

              <div className={styles.noteCard}>
                <span className={styles.noteSparkle}><SparkleIcon /></span>
                {loadingContent ? (
                  <p className={styles.mutedNote}>Loading…</p>
                ) : latestNote ? (
                  <>
                    <span className={styles.eyebrow}>{formatDate(latestNote.createdAt)}</span>
                    <blockquote className={styles.noteQuote}>
                      {(latestNote.content || 'A note without words, but full of feeling.').slice(0, 160)}
                    </blockquote>
                    <div className={styles.noteFoot}>
                      <span>— {latestNote.authorName ? `written by ${latestNote.authorName}` : 'written for you'}</span>
                      <button className={styles.sectionLink} onClick={() => navigate('/letters')}>Read more</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className={styles.noteQuote}>No love notes yet — write the first one.</p>
                    <div className={styles.noteFoot}>
                      <button className={styles.sectionLink} onClick={() => navigate('/letters')}>
                        Open Love Letters
                        <ArrowUpRightIcon />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
