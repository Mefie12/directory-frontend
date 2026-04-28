"use client";

interface SortOption {
  label: string;
  value: string;
}

interface SortSelectorProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
}

export function SortSelector({ options, value, onChange }: SortSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 font-medium shrink-0">Sort:</span>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              value === opt.value
                ? "bg-[#0D7077] text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-[#0D7077] hover:text-[#0D7077]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
