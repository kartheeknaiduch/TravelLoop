import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  disabledDays?: (date: Date) => boolean;
  className?: string;
};

function toLocalDate(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  min,
  max,
  disabledDays,
  className,
}: DatePickerProps) {
  const selected = value ? parseISO(value) : undefined;
  const minDate = min ? parseISO(min) : undefined;
  const maxDate = max ? parseISO(max) : undefined;

  const isDisabled = React.useCallback(
    (date: Date) => {
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return disabledDays ? disabledDays(date) : false;
    },
    [minDate, maxDate, disabledDays],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between rounded-xl border-border/60 bg-background text-left font-medium",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span>
            {selected && isValid(selected)
              ? format(selected, "MMM d, yyyy")
              : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) onChange(toLocalDate(date));
          }}
          disabled={isDisabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
