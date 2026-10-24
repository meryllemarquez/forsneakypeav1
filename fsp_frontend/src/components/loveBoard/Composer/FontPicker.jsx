import { NOTE_FONT_GROUPS } from '../../../constants/loveBoardConstants';
import { Chip } from '../common/lbUi';

export default function FontPicker({ value, onChange }) {
  return (
    <div className="space-y-3">
      {NOTE_FONT_GROUPS.map(({ group, options }) => (
        <div key={group}>
          <p className="m-0 mb-1.5 text-sm font-extrabold text-(--ink)">{group}</p>
          <div className="flex flex-wrap gap-2">
            {options.map((font) => (
              <Chip
                key={font.key}
                active={value === font.family}
                onClick={() => onChange(font.family)}
                style={{ fontFamily: font.family }}
                className="!text-base !font-normal"
              >
                {font.label}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
