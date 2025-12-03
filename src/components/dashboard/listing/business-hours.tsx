import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

// 1. Export this interface
export interface DaySchedule {
  day_of_week: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface BusinessHoursSelectorProps {
  label?: string;
  value: DaySchedule[];
  onChange: (value: DaySchedule[]) => void;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function BusinessHoursSelector({
  label = "Business hours",
  value,
  onChange,
}: BusinessHoursSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDayToggle = (day: string, checked: boolean) => {
    // Ensure value is an array before mapping
    const safeValue = Array.isArray(value) ? value : [];

    // Check if day exists, if not create it
    const dayExists = safeValue.find((s) => s.day_of_week === day);
    let newValue;

    if (dayExists) {
      newValue = safeValue.map((schedule) =>
        schedule.day_of_week === day ? { ...schedule, enabled: checked } : schedule
      );
    } else {
      // If this is the first interaction, we might need to initialize the array
      // or handle empty state. For robust logic, initialize all days if empty.
      newValue = [
        ...safeValue,
        { day_of_week: day, enabled: checked, startTime: "", endTime: "" },
      ];
    }

    onChange(newValue);
  };

  const handleTimeChange = (
    day_of_week: string,
    field: "startTime" | "endTime",
    time: string
  ) => {
    const safeValue = Array.isArray(value) ? value : [];
    const newValue = safeValue.map((schedule) =>
      schedule.day_of_week === day_of_week ? { ...schedule, [field]: time } : schedule
    );
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border rounded-md">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2.5 text-left text-sm flex items-center justify-between hover:bg-accent/50 transition-colors"
        >
          <span className="text-muted-foreground">Select business hours</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="p-4 border-t space-y-4">
            <div className="grid grid-cols-[120px_1fr_1fr] gap-4 items-center">
              <div className="font-medium text-sm">Days</div>
              <div className="font-medium text-sm text-center">Start Time</div>
              <div className="font-medium text-sm text-center">End Time</div>
            </div>

            {DAYS.map((day) => {
              // Safe access
              const schedule = Array.isArray(value)
                ? value.find((s) => s.day_of_week === day)
                : undefined;

              // Default state for rendering if not found in value prop
              const effectiveSchedule = schedule || {
                day,
                enabled: false,
                startTime: "",
                endTime: "",
              };

              return (
                <div
                  key={day}
                  className="grid grid-cols-[120px_1fr_1fr] gap-4 items-center"
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={effectiveSchedule.enabled}
                      onCheckedChange={(checked) =>
                        handleDayToggle(day, checked as boolean)
                      }
                      className="data-[state=checked]:bg-[#336F9E] border data-[state=checked]:border-[#336F9E]"
                    />
                    <label htmlFor={day} className="text-sm cursor-pointer">
                      {day}
                    </label>
                  </div>

                  <Input
                    type="time"
                    value={effectiveSchedule.startTime}
                    onChange={(e) =>
                      handleTimeChange(day, "startTime", e.target.value)
                    }
                    disabled={!effectiveSchedule.enabled}
                    className="text-center px-1"
                    placeholder="-- : -- AM"
                  />

                  <Input
                    type="time"
                    value={effectiveSchedule.endTime}
                    onChange={(e) =>
                      handleTimeChange(day, "endTime", e.target.value)
                    }
                    disabled={!effectiveSchedule.enabled}
                    className="text-center px-1"
                    placeholder="-- : -- PM"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
