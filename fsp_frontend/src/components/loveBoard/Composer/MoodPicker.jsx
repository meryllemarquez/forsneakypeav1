import { MOOD_OPTIONS } from '../../../constants/loveBoardConstants';
import { Chip } from '../common/lbUi';

export default function MoodPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip active={!value} onClick={() => onChange(null)}>
        No mood
      </Chip>
      {MOOD_OPTIONS.map((mood) => (
        <Chip key={mood.value} active={value === mood.value} onClick={() => onChange(mood.value)}>
          <mood.icon size={16} strokeWidth={2.4} aria-hidden="true" />
          {mood.label}
        </Chip>
      ))}
    </div>
  );
}
