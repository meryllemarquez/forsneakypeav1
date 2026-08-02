import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { MOOD_OPTIONS } from '../../../constants/loveBoardConstants';

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
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed top-5 left-1/2 z-[110] w-[92vw] max-w-md -translate-x-1/2 rounded-2xl border border-[#e7d8c2]/70 bg-[#fffaf1]/95 p-4 shadow-[0_25px_50px_-12px_rgba(60,40,20,0.35)] backdrop-blur-xl"
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative mb-3">
            <Search size={15} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#8a7360]" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search titles or letters…"
              className="w-full rounded-lg border border-[#e2d4bf] bg-white py-2 pr-3 pl-9 text-sm outline-none transition focus:border-[#a8391f]/50 focus:ring-2 focus:ring-[#a8391f]/15"
              autoFocus
            />
          </div>

          <div className="mb-3">
            <p className="m-0 mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a7360]">Author</p>
            <div className="flex flex-wrap gap-1.5">
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

          <div className="mb-3">
            <p className="m-0 mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a7360]">Mood</p>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={!moodFilter} onClick={() => onMoodFilterChange(null)}>
                All
              </Chip>
              {MOOD_OPTIONS.map((mood) => (
                <Chip key={mood.value} active={moodFilter === mood.value} onClick={() => onMoodFilterChange(mood.value)}>
                  <mood.icon size={12} strokeWidth={2.25} />
                  {mood.label}
                </Chip>
              ))}
            </div>
          </div>

          {paperOptions.length > 0 && (
            <div className="mb-3">
              <p className="m-0 mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a7360]">Paper</p>
              <select
                value={paperFilter || ''}
                onChange={(e) => onPaperFilterChange(e.target.value || null)}
                className="w-full rounded-lg border border-[#e2d4bf] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#a8391f]/50 focus:ring-2 focus:ring-[#a8391f]/15"
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

          <button
            type="button"
            onClick={onClear}
            className="w-full appearance-none rounded-lg border-0 bg-[#ece1d2] py-2 text-xs font-medium text-[#4a3a2c] transition hover:bg-[#e2d4bf]"
          >
            Clear filters
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex appearance-none items-center gap-1.5 rounded-full border-0 px-2.5 py-1 text-xs transition ${
        active ? 'bg-[#a8391f] text-white' : 'bg-[#ece1d2] text-[#4a3a2c] hover:bg-[#e2d4bf]'
      }`}
    >
      {children}
    </button>
  );
}
