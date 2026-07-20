"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  searchTerms?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  invalid?: boolean;
  error?: string;
  showOtherOnEmpty?: boolean;
  fieldName?: string;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search…",
  emptyMessage = "No option found.",
  disabled = false,
  invalid = false,
  error,
  showOtherOnEmpty = false,
  fieldName,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);

  return (
    <Popover open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setQuery(""); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || !!error}
          data-event-field={fieldName}
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between rounded-lg bg-background px-3 font-normal",
            !selected && "text-muted-foreground",
            (invalid || error) && "border-red-500 focus-visible:ring-red-500",
            className,
          )}
        >
          <span className="truncate">{selected?.label ?? (value || placeholder)}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[--radix-popper-anchor-width] p-0" align="start">
        <Command>
          <CommandInput value={query} onValueChange={setQuery} placeholder={searchPlaceholder} />
          <CommandList className="max-h-72">
            <CommandEmpty>
              <div className="space-y-2 p-3 text-sm text-muted-foreground">
                <p>{emptyMessage}</p>
                {showOtherOnEmpty && query.trim() && <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => { onChange("other"); setOpen(false); }}>Other (not listed)</Button>}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value} ${option.searchTerms ?? ""}`}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </Popover>
  );
}
