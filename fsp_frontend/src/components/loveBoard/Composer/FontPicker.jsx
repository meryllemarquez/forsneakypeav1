import { NOTE_FONT_GROUPS } from '../../../constants/loveBoardConstants';

export default function FontPicker({ value, onChange }) {
  return (
    <div className="space-y-3">
      {NOTE_FONT_GROUPS.map(({ group, options }) => (
        <div key={group}>
          <p className="m-0 mb-1.5 font-sans text-[10px] font-semibold uppercase tracking-wide text-[#8a7360]">{group}</p>
          <div className="flex flex-wrap gap-2">
            {options.map((font) => (
              <button
                key={font.key}
                type="button"
                onClick={() => onChange(font.family)}
                style={{ fontFamily: font.family }}
                className={`appearance-none rounded-lg border-0 px-3 py-2 text-base transition ${
                  value === font.family ? 'bg-[#a8391f] text-white' : 'bg-[#ece1d2] text-[#4a3a2c] hover:bg-[#e2d4bf]'
                }`}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
