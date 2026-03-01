"use client";

import { SkillLevel } from "@/types";
import { SKILL_LEVELS } from "@/lib/constants";

interface Props {
  selected: SkillLevel | "";
  onSelect: (level: SkillLevel) => void;
}

const colorMap: Record<string, string> = {
  green: "border-green-400 bg-green-50",
  orange: "border-orange-400 bg-orange-50",
  red: "border-red-400 bg-red-50",
};

export function SkillLevelPicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {SKILL_LEVELS.map((level) => {
        const isActive = selected === level.id;
        return (
          <button
            key={level.id}
            type="button"
            onClick={() => onSelect(level.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all duration-150 hover:shadow-sm ${
              isActive
                ? colorMap[level.color]
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="text-2xl mb-2">{level.icon}</div>
            <div className="font-semibold text-slate-900 text-sm mb-1">{level.label}</div>
            <div className="text-xs text-slate-500 leading-relaxed">{level.desc}</div>
          </button>
        );
      })}
    </div>
  );
}
