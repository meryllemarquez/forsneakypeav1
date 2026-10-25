import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, tone = 'accent', delay = 0, trend }) {
  const toneClasses = {
    accent: 'bg-(--color-admin-accent-soft) text-(--color-admin-accent)',
    success: 'bg-(--color-admin-success-soft) text-(--color-admin-success)',
    warning: 'bg-(--color-admin-warning-soft) text-(--color-admin-warning)',
    danger: 'bg-(--color-admin-danger-soft) text-(--color-admin-danger)',
  };

  return (
    <motion.div
      className="rounded-card border border-(--color-admin-border) bg-(--color-admin-surface) p-3.5 shadow-soft transition sm:p-5 hover:shadow-[0_12px_35px_-8px_color-mix(in srgb, var(--outline) 18%, transparent)]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -3 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-1.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-button ${toneClasses[tone] || toneClasses.accent}`}>
          <Icon size={17} strokeWidth={2} />
        </div>
        {trend != null && trend > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-(--color-admin-success-soft) px-2 py-0.5 text-[11.5px] font-semibold text-(--color-admin-success)">
            <TrendingUp size={10} />+{trend} this week
          </span>
        )}
      </div>
      <p className="m-0 mt-3 text-2xl font-bold tracking-tight text-(--color-admin-text) sm:mt-4">{value}</p>
      <p className="m-0 mt-1 text-xs font-bold tracking-wide text-(--color-admin-text-muted) uppercase">{label}</p>
    </motion.div>
  );
}
