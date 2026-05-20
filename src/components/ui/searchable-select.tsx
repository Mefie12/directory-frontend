"use client";

import {useEffect, useState, useMemo, useRef} from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  error?: string;
  className?: string;
  showOtherOnEmpty?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  searchPlaceholder = "Search...",
  error,
  className,
  showOtherOnEmpty = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm transition-colors",
          "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1",
          disabled && "cursor-not-allowed bg-gray-50 opacity-50",
          error && "border-red-500 focus:ring-red-500"
        )}
      >
        <span className={cn(!selectedOption && "text-gray-400")}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="h-4 w-4 opacity-50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 py-1 px-2 text-sm outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <>
                <p className="px-3 pt-3 pb-1 text-sm text-gray-400">No results found</p>
                {showOtherOnEmpty && search.trim() !== "" && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange("other");
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-3 py-2.5 text-sm transition-colors mt-1",
                      "border border-dashed border-gray-300 hover:border-[#93C01F] hover:bg-[#93C01F]/5 hover:text-[#5F8B0A]",
                      value === "other" && "border-[#93C01F] bg-[#93C01F]/5 text-[#5F8B0A] font-medium"
                    )}
                  >
                    <span className="text-base leading-none">+</span>
                    Other (not listed)
                    {value === "other" && <Check className="h-4 w-4 ml-auto" />}
                  </button>
                )}
              </>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded px-3 py-2 text-sm transition-colors",
                    "hover:bg-gray-100",
                    option.value === value && "bg-gray-100 font-medium"
                  )}
                >
                  {option.label}
                  {option.value === value && <Check className="h-4 w-4" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
