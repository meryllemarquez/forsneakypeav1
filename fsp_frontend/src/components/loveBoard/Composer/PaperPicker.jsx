export default function PaperPicker({ papers = [], value, onChange }) {
  if (papers.length === 0) {
    return <p className="text-sm text-[#8a7360]">No papers found in public/assets/love-board/papers.</p>;
  }

  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
      {papers.map((paper) => (
        <button
          key={paper.filename}
          type="button"
          onClick={() => onChange(paper.filename)}
          title={paper.label}
          className={`appearance-none rounded-lg border-0 bg-transparent p-1 transition ${
            value === paper.filename ? 'ring-2 ring-[#a8391f] ring-offset-2' : 'opacity-80 hover:opacity-100'
          }`}
        >
          <img src={paper.url} alt={paper.label} className="aspect-square w-full rounded-md object-cover shadow" />
        </button>
      ))}
    </div>
  );
}
