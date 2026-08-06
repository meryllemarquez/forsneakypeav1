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
      className="rounded-card border border-(--color-admin-border) bg-(--color-admin-surface) p-5 shadow-soft transition hover:shadow-[0_12px_35px_-8px_rgba(140,35,15,0.18)]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -3 }}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-button ${toneClasses[tone] || toneClasses.accent}`}>
          <Icon size={17} strokeWidth={2} />
        </div>
        {trend != null && trend > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-(--color-admin-success-soft) px-2 py-0.5 text-[10.5px] font-semibold text-(--color-admin-success)">
            <TrendingUp size={10} />+{trend} this week
          </span>
        )}
      </div>
      <p className="m-0 mt-4 text-2xl font-semibold tracking-tight text-(--color-admin-text)">{value}</p>
      <p className="m-0 mt-1 text-[11px] font-semibold tracking-wide text-(--color-admin-golden) uppercase">{label}</p>
    </motion.div>
  );
}
