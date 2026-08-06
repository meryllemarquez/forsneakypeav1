import { MOOD_OPTIONS } from '../../../constants/loveBoardConstants';

export default function MoodPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`appearance-none rounded-full border-0 px-3 py-1.5 text-sm transition ${
          !value ? 'bg-[#a8391f] text-white' : 'bg-[#ece1d2] text-[#4a3a2c] hover:bg-[#e2d4bf]'
        }`}
      >
        No mood
      </button>
      {MOOD_OPTIONS.map((mood) => (
        <button
          key={mood.value}
          type="button"
          onClick={() => onChange(mood.value)}
          className={`inline-flex appearance-none items-center gap-1.5 rounded-full border-0 px-3 py-1.5 text-sm transition ${
            value === mood.value ? 'bg-[#a8391f] text-white' : 'bg-[#ece1d2] text-[#4a3a2c] hover:bg-[#e2d4bf]'
          }`}
        >
          <mood.icon size={14} strokeWidth={2} />
          {mood.label}
        </button>
      ))}
    </div>
  );
}
