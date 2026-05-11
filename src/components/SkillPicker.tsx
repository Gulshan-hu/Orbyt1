import { Tag } from "./Tag";
import { SKILL_CATEGORIES } from "@/lib/mock-data";

export function SkillPicker({ selected, onToggle }: { selected: string[]; onToggle: (s: string) => void }) {
  return (
    <div className="flex flex-col gap-4 max-h-[280px] overflow-y-auto pr-2">
      {Object.entries(SKILL_CATEGORIES).map(([cat, skills]) => (
        <div key={cat}>
          <div className="text-[12px] text-[#A1A1A1] font-[Proza_Libre] mb-1.5">{cat}</div>
          <div className="flex flex-wrap gap-1.5">
            {skills.map(s => (
              <Tag key={s} small selected={selected.includes(s)} onClick={() => onToggle(s)}>{s}</Tag>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
