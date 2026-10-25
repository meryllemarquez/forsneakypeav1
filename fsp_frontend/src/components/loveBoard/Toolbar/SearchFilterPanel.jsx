import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { MOOD_OPTIONS } from '../../../constants/loveBoardConstants';
import { Chip, PillButton, inputClass } from '../common/lbUi';

export default function SearchFilterPanel({
  open,
  query,
  onQueryChange,
  authorOptions = [],
  authorFilter,
  onAuthorFilterChange,
  moodFilter,
  onMoodFilterChange,
  paperOptions = [],
  paperFilter,
  onPaperFilterChange,
  onClear,
}) {
  const inputRef = useRef(null);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="search"
          aria-label="Search and filter letters"
          className="fixed top-24 left-1/2 z-[110] max-h-[calc(100dvh-8rem)] scroll-pb-[40dvh] w-[92vw] max-w-md -translate-x-1/2 overflow-y-auto rounded-[28px] border-2 border-solid border-(--outline) bg-(--white) p-5 text-(--ink) shadow-[6px_6px_0_var(--sea)]"
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative mb-4">
            <Search size={18} strokeWidth={2.6} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search titles or letters…"
              aria-label="Search titles or letters"
              className={`${inputClass} pl-11`}
            />
          </div>

          <div className="mb-4">
            <p className="m-0 mb-1.5 text-sm font-extrabold">Author</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={!authorFilter} onClick={() => onAuthorFilterChange(null)}>
                All
              </Chip>
              {authorOptions.map((author) => (
                <Chip key={author} active={authorFilter === author} onClick={() => onAuthorFilterChange(author)}>
                  {author}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="m-0 mb-1.5 text-sm font-extrabold">Mood</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={!moodFilter} onClick={() => onMoodFilterChange(null)}>
                All
              </Chip>
              {MOOD_OPTIONS.map((mood) => (
                <Chip key={mood.value} active={moodFilter === mood.value} onClick={() => onMoodFilterChange(mood.value)}>
                  <mood.icon size={16} strokeWidth={2.5} aria-hidden="true" />
                  {mood.label}
                </Chip>
              ))}
            </div>
          </div>

          {paperOptions.length > 0 && (
            <div className="mb-4">
              <label htmlFor="lb-paper-filter" className="m-0 mb-1.5 block text-sm font-extrabold">
                Paper
              </label>
              <select
                id="lb-paper-filter"
                value={paperFilter || ''}
                onChange={(e) => onPaperFilterChange(e.target.value || null)}
                className={inputClass}
              >
                <option value="">All papers</option>
                {paperOptions.map((paper) => (
                  <option key={paper.filename} value={paper.filename}>
                    {paper.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <PillButton onClick={onClear} className="w-full">
            Clear filters
          </PillButton>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
