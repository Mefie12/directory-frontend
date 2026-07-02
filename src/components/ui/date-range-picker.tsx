"use client";

import * as React from "react";
import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/use-is-mobile";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";


interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  align?: "start" | "center" | "end";
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  align = "end",
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const label = value?.from ? (
    value.to ? (
      <>
        {format(value.from, "LLL dd, y")} – {format(value.to, "LLL dd, y")}
      </>
    ) : (
      format(value.from, "LLL dd, y")
    )
  ) : (
    <span className="text-muted-foreground">{placeholder}</span>
  );

  const trigger = (
    <Button
      variant="outline"
      className={cn(
        "justify-start text-left font-normal min-w-60",
        !value && "text-muted-foreground",
        className,
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
      {label}
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center justify-start text-left font-normal min-w-60 h-9 px-3 rounded-md border border-input bg-background text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {label}
        </button>

        <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-6">
          <SheetHeader className="px-5 pb-2">
            <SheetTitle className="text-base font-semibold">
              Select Date Range
            </SheetTitle>
          </SheetHeader>

          <div className="flex justify-center overflow-x-auto px-4">
            <Calendar
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onChange}
              numberOfMonths={1}
              className="rounded-lg"
            />
          </div>

          <SheetFooter className="flex-row gap-2 px-5 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              Clear
            </Button>
            <SheetClose asChild>
              <Button className="flex-1 bg-[#93C01F] hover:bg-[#7ea319] text-white">
                Done
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
