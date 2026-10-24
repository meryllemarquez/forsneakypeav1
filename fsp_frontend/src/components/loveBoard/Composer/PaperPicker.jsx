export default function PaperPicker({ papers = [], value, onChange }) {
  if (papers.length === 0) {
    return <p className="m-0 text-sm text-(--ink-muted)">No papers found in public/assets/love-board/papers.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5" role="radiogroup" aria-label="Paper">
      {papers.map((paper) => (
        <button
          key={paper.filename}
          type="button"
          role="radio"
          aria-checked={value === paper.filename}
          onClick={() => onChange(paper.filename)}
          title={paper.label}
          className={`lb-focus cursor-pointer appearance-none rounded-2xl border-2 border-solid border-(--ink) p-1 transition ${
            value === paper.filename ? 'bg-(--citrus) shadow-[3px_3px_0_var(--ink)]' : 'bg-white hover:bg-(--sea-tint)'
          }`}
        >
          <img src={paper.url} alt={paper.label} className="aspect-square w-full rounded-xl object-contain" />
        </button>
      ))}
    </div>
  );
}
