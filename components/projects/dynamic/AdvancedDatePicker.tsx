"use client";

import * as React from "react";
import { format, isValid } from "date-fns";
import { HelpCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AdvancedDatePickerProps {
  selected?: Date | string | null;
  onSelect: (date: string | null) => void;
  onClose?: () => void;
}

export function AdvancedDatePicker({
  selected,
  onSelect,
  onClose,
}: AdvancedDatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(() => {
    if (!selected) return undefined;
    const datePart =
      typeof selected === "string" ? selected.split(" ")[0] : selected;
    const parsed = new Date(datePart);
    return isValid(parsed) ? parsed : undefined;
  });

  const [includeTime, setIncludeTime] = React.useState(() => {
    if (typeof selected !== "string") return false;
    return selected.includes(":") || selected.includes("T");
  });

  const [timeValue, setTimeValue] = React.useState(() => {
    if (typeof selected !== "string" || !selected.includes(" ")) {
      return format(new Date(), "HH:mm");
    }
    try {
      const parts = selected.split(" ");
      return parts.length > 1 ? parts[1] : format(new Date(), "HH:mm");
    } catch {
      return format(new Date(), "HH:mm");
    }
  });

  const [hasEndDate, setHasEndDate] = React.useState(false);
  const [dateFormat, setDateFormat] = React.useState("Full date");
  const [timeFormat, setTimeFormat] = React.useState("24 hour");
  const [timezone, setTimezone] = React.useState("GMT+7");

  // Sync state with selected prop if it changes externally
  React.useEffect(() => {
    if (selected) {
      const datePart =
        typeof selected === "string" ? selected.split(" ")[0] : selected;
      const parsedDate = new Date(datePart);
      if (isValid(parsedDate)) setDate(parsedDate);

      if (typeof selected === "string" && selected.includes(" ")) {
        const timePart = selected.split(" ")[1];
        if (timePart) {
          setTimeValue(timePart);
          setIncludeTime(true);
        }
      } else {
        setIncludeTime(false);
      }
    }
  }, [selected]);

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      updateValue(newDate, includeTime ? timeValue : null);
    } else {
      onSelect(null);
    }
  };

  const handleTimeChange = (
    e:
      | React.FocusEvent<HTMLInputElement>
      | React.KeyboardEvent<HTMLInputElement>
  ) => {
    const val = (e.currentTarget as HTMLInputElement).value;
    setTimeValue(val);
    if (
      date &&
      (e.type === "blur" || (e as React.KeyboardEvent).key === "Enter")
    ) {
      updateValue(date, val);
    }
  };

  const toggleIncludeTime = (enabled: boolean) => {
    setIncludeTime(enabled);
    if (date) {
      updateValue(date, enabled ? timeValue : null);
    }
  };

  const updateValue = (d: Date, t: string | null) => {
    const dateStr = format(d, "yyyy-MM-dd");
    if (t) {
      onSelect(`${dateStr} ${t}`);
    } else {
      onSelect(dateStr);
    }
  };

  const handleClear = () => {
    setDate(undefined);
    onSelect(null);
    if (onClose) onClose();
  };

  return (
    <div className="w-[280px] p-0 flex flex-col bg-popover text-popover-foreground shadow-xl rounded-xl border border-border/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Top Input Area */}
      <div className="p-3 pb-0">
        <div className="flex items-center gap-2 bg-muted/40 hover:bg-muted/60 transition-colors rounded-lg p-1.5 px-3 border border-border/50 shadow-sm">
          <div className="flex-1 text-xs font-semibold text-foreground/80 truncate">
            {date ? format(date, "MMM d, yyyy") : "Select date"}
          </div>
          {includeTime && (
            <>
              <div className="w-[1px] h-4 bg-border/60" />
              <input
                type="text"
                defaultValue={timeValue}
                onBlur={handleTimeChange}
                onKeyDown={(e) => e.key === "Enter" && handleTimeChange(e)}
                placeholder="00:00"
                className="w-11 bg-transparent text-xs font-medium outline-none border-none p-0 focus:ring-0 text-foreground"
              />
            </>
          )}
        </div>
      </div>

      <div className="px-1">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          className="p-2"
        />
      </div>

      <Separator className="opacity-50" />

      {/* Settings Area */}
      <div className="p-2 space-y-0.5">
        <div className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/60 rounded-md transition-colors cursor-default group">
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground/90 transition-colors">
            End date
          </span>
          <Switch
            checked={hasEndDate}
            onCheckedChange={setHasEndDate}
            className="scale-75 origin-right"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/60 rounded-md transition-colors cursor-pointer group">
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground/90 transition-colors">
                Date format
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground/60">
                  {dateFormat}
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" className="w-40 p-1">
            {["Full date", "Month Day, Year", "MM/DD/YYYY", "DD/MM/YYYY"].map(
              (f) => (
                <Button
                  key={f}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-[11px] h-7 px-2 font-normal",
                    dateFormat === f && "bg-muted"
                  )}
                  onClick={() => setDateFormat(f)}
                >
                  {f}
                </Button>
              )
            )}
          </PopoverContent>
        </Popover>

        <div className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/60 rounded-md transition-colors cursor-default group">
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground/90 transition-colors">
            Include time
          </span>
          <Switch
            checked={includeTime}
            onCheckedChange={toggleIncludeTime}
            className="scale-75 origin-right"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/60 rounded-md transition-colors cursor-pointer group">
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground/90 transition-colors">
                Time format
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground/60">
                  {timeFormat}
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" className="w-32 p-1">
            {["24 hour", "12 hour"].map((f) => (
              <Button
                key={f}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-[11px] h-7 px-2 font-normal",
                  timeFormat === f && "bg-muted"
                )}
                onClick={() => setTimeFormat(f)}
              >
                {f}
              </Button>
            ))}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/60 rounded-md transition-colors cursor-pointer group">
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground/90 transition-colors">
                Timezone
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground/60">
                  {timezone}
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" className="w-48 p-1">
            {[
              "GMT+7 (Jakarta)",
              "GMT+8 (Singapore)",
              "GMT+0 (London)",
              "GMT-5 (New York)",
            ].map((z) => (
              <Button
                key={z}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-[11px] h-7 px-2 font-normal truncate",
                  timezone.includes(z.split(" ")[0]) && "bg-muted"
                )}
                onClick={() => setTimezone(z.split(" ")[0])}
              >
                {z}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      <Separator className="opacity-50" />

      {/* Bottom Actions */}
      <div className="p-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8 text-[11px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 px-2.5 transition-colors"
          onClick={handleClear}
        >
          Clear
        </Button>
      </div>

      <Separator className="opacity-30" />

      <div className="p-2.5 px-4 flex items-center gap-2 bg-muted/20">
        <HelpCircle className="h-3 w-3 text-muted-foreground/40" />
        <span className="text-[9px] font-medium text-muted-foreground/60 hover:text-foreground/80 cursor-pointer transition-colors">
          Learn about reminders
        </span>
      </div>
    </div>
  );
}
