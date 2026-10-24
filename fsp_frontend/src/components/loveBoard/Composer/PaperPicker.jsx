import { PAPERS, paperValue, resolvePaperId } from '../../../constants/loveBoardCatalog';
import { LbPaperThumb } from '../common/lbGraphics';

export default function PaperPicker({ value, onChange }) {
  const current = resolvePaperId(value);

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6" role="radiogroup" aria-label="Paper">
      {PAPERS.map((paper) => (
        <button
          key={paper.id}
          type="button"
          role="radio"
          aria-checked={current === paper.id}
          aria-label={paper.label}
          onClick={() => onChange(paperValue(paper.id))}
          title={paper.label}
          className={`lb-focus flex cursor-pointer appearance-none flex-col items-center gap-1 rounded-2xl border-2 border-solid border-(--ink) p-1.5 text-xs font-extrabold text-(--ink) transition ${
            current === paper.id ? 'bg-(--citrus) shadow-[3px_3px_0_var(--ink)]' : 'bg-white hover:bg-(--sea-tint)'
          }`}
        >
          <LbPaperThumb value={paperValue(paper.id)} size={72} />
          {paper.label}
        </button>
      ))}
    </div>
  );
}
