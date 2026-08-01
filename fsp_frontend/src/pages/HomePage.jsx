import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import styles from './HomePage.module.css';

// Minimal Outline Icons (React Icon / Lucide standard)
const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const HeartOutlineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

const ShieldAdminIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const LogOutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"></line>
    <polyline points="7 7 17 7 17 17"></polyline>
  </svg>
);

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate(); // Used for client-side routing (/memories, /admin, etc.)
  const [activeTab, setActiveTab] = useState('overview');

  // Dynamically calculate days together since Anniversary: January 28, 2024
  const daysTogether = useMemo(() => {
    const startDate = Date.UTC(2024, 0, 28);
    const now = new Date();
    const todayDate = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diffInMs = todayDate - startDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffInDays);
  }, []);

  // Framer Motion Stagger Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  // Mock Data (Ready to connect to API)
  const featuredMemories = [
    {
      id: 1,
      title: "Sunset by the Harbor",
      date: "October 14, 2025",
      category: "Travel",
      image: "/landingbg.png",
      caption: "A golden afternoon spent watching the quiet tide together."
    },
    {
      id: 2,
      title: "Late Night Coffee & Conversations",
      date: "December 02, 2025",
      category: "Date Night",
      image: "/landingbg.png",
      caption: "Endless laughter, hot chocolate, and quiet plans for tomorrow."
    }
  ];

  const upcomingDates = [
    {
      id: 1,
      title: "Pottery & Coffee Workshop",
      date: "August 15, 2026",
      time: "2:00 PM",
      location: "Quezon City",
      status: "Confirmed"
    },
    {
      id: 2,
      title: "Weekend Seaside Getaway",
      date: "September 02, 2026",
      time: "All Day",
      location: "Batangas",
      status: "Planning"
    }
  ];

  return (
    <div className={styles.pageContainer}>
      {/* 1. EDITORIAL HEADER / NAVBAR */}
      <header className={styles.navbar}>
        <div className={styles.navLeft}>
          <span className={styles.navBrand}>FOR SNEAKYPEA</span>
          <span className={styles.navDivider}>/</span>
          <span className={styles.navSubBrand}>Merylle & Cj</span>
        </div>

        <div className={styles.navRight}>
          {user?.role === 'ROLE_ADMIN' && (
            <button
              className={styles.adminBtn}
              onClick={() => navigate('/admin')}
            >
              <ShieldAdminIcon />
              <span>Admin Panel</span>
            </button>
          )}

          <div className={styles.userProfilePill}>
            <span className={styles.statusDot}></span>
            <span className={styles.userName}>{user?.name || user?.username || 'User'}</span>
          </div>

          <button className={styles.logoutIconBtn} onClick={logout} title="Sign Out">
            <LogOutIcon />
          </button>
        </div>
      </header>

      {/* 2. MAIN EDITORIAL DASHBOARD */}
      <main className={styles.contentWrapper}>
        
        {/* HERO SECTION */}
        <motion.section 
          className={styles.heroSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.heroBadge}>
            <HeartOutlineIcon />
            <span>{daysTogether} Days Together</span>
          </div>

          <h1 className={styles.heroHeading}>
            Our Private Sanctuary
          </h1>

          <p className={styles.heroSubtext}>
            A quiet digital archive dedicated to the moments, plans, and memories shared between Merylle and Cj.
          </p>

          {/* EDITORIAL NAVIGATION TABS */}
          <div className={styles.tabContainer}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>

            {/* ✅ UPDATED: Navigates directly to the full Memories Page (/memories) */}
            <button 
              className={`${styles.tabBtn} ${activeTab === 'memories' ? styles.tabActive : ''}`}
              onClick={() => navigate('/memories')}
            >
              Memories
            </button>

            <button
              className={`${styles.tabBtn} ${activeTab === 'dates' ? styles.tabActive : ''}`}
              onClick={() => navigate('/dates')}
            >
              Upcoming Dates
            </button>
          </div>
        </motion.section>

        {/* 3. DASHBOARD GRID CONTENT */}
        <motion.div 
          className={styles.dashboardGrid}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* DAILY LOVE NOTE CARD */}
          <motion.div className={styles.dailyNoteCard} variants={itemVariants}>
            <div className={styles.cardMetaHeader}>
              <span className={styles.sectionLabel}>DAILY NOTE</span>
              <span className={styles.dateLabel}>July 27, 2026</span>
            </div>
            
            <blockquote className={styles.quoteText}>
              "I loved you yesterday, I love you still, I always have, I always will."
            </blockquote>
            
            <div className={styles.quoteFooter}>
              <span className={styles.quoteAuthor}>— Written by Cj</span>
              <span className={styles.locationTag}>
                <MapPinIcon /> Manila
              </span>
            </div>
          </motion.div>

          {/* TWO-COLUMN GRID: MEMORIES + UPCOMING DATES */}
          <div className={styles.splitGrid}>
            
            {/* FEATURED MEMORIES SECTION */}
            <motion.section className={styles.sectionBlock} variants={itemVariants}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Featured Memories</h2>
                  <p className={styles.sectionSubtitle}>Captured moments from our journey together.</p>
                </div>

                {/* ✅ UPDATED: Navigates directly to the full Memories Page (/memories) */}
                <button 
                  className={styles.inlineLinkBtn}
                  onClick={() => navigate('/memories')}
                >
                  <span>View All</span>
                  <ArrowUpRightIcon />
                </button>
              </div>

              <div className={styles.memoriesGrid}>
                {featuredMemories.map((memory) => (
                  <motion.div 
                    key={memory.id} 
                    className={styles.memoryCard}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => navigate('/memories')} // ✅ Card click also routes to /memories
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.memoryImageWrapper}>
                      <img src={memory.image} alt={memory.title} className={styles.memoryImage} />
                      <span className={styles.categoryBadge}>{memory.category}</span>
                    </div>
                    <div className={styles.memoryBody}>
                      <span className={styles.memoryDate}>{memory.date}</span>
                      <h3 className={styles.memoryTitle}>{memory.title}</h3>
                      <p className={styles.memoryCaption}>{memory.caption}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* UPCOMING DATES SECTION */}
            <motion.section className={styles.sectionBlock} variants={itemVariants}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Upcoming Plans</h2>
                  <p className={styles.sectionSubtitle}>Dates and activities we are looking forward to.</p>
                </div>
                <button className={styles.inlineLinkBtn} onClick={() => navigate('/dates')}>
                  <span>Calendar</span>
                  <ArrowUpRightIcon />
                </button>
              </div>

              <div className={styles.datesList}>
                {upcomingDates.map((item) => (
                  <motion.div
                    key={item.id}
                    className={styles.dateCard}
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => navigate('/dates')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.dateIconBox}>
                      <CalendarIcon />
                    </div>
                    <div className={styles.dateDetails}>
                      <h4 className={styles.dateTitle}>{item.title}</h4>
                      <p className={styles.dateMeta}>
                        {item.date} • {item.time} • {item.location}
                      </p>
                    </div>
                    <span className={item.status === 'Confirmed' ? styles.statusConfirmed : styles.statusPlanning}>
                      {item.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.section>

          </div>

        </motion.div>
      </main>
    </div>
  );
}