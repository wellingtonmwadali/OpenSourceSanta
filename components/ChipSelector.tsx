"use client";

interface Props {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function ChipSelector({ options, selected, onToggle }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`chip ${selected.includes(opt) ? "active" : ""}`}
        >
          {selected.includes(opt) && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {opt}
        </button>
      ))}
    </div>
  );
}
