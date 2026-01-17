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
import { DateRange } from "react-day-picker";

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
  // Parsing logic
  const initialData = React.useMemo(() => {
    if (
      !selected ||
      selected === "{}" ||
      (typeof selected === "object" && Object.keys(selected).length === 0)
    )
      return {
        from: undefined,
        to: undefined,
        startTime: "09:00",
        endTime: "10:00",
        range: false,
        time: false,
      };

    const str = String(selected);
    if (str === "null" || str === "undefined" || str === "[object Object]") {
      return {
        from: undefined,
        to: undefined,
        startTime: "09:00",
        endTime: "10:00",
        range: false,
        time: false,
      };
    }

    const parts = str.split(" -> ");
    const hasRange = parts.length > 1;

    const parsePart = (p: string) => {
      const dtParts = p.split(" ");
      const d = new Date(dtParts[0]);
      const validD = isValid(d) ? d : undefined;
      const t = dtParts[1] || "";
      return { date: validD, time: t };
    };

    const start = parsePart(parts[0]);
    const end = hasRange ? parsePart(parts[1]) : { date: undefined, time: "" };

    const hasTime = start.time !== "" || end.time !== "";

    return {
      from: start.date,
      to: end.date,
      startTime: start.time || "09:00",
      endTime: end.time || "10:00",
      range: hasRange,
      time: hasTime,
    };
  }, [selected]);

  const [range, setRange] = React.useState<DateRange | undefined>({
    from: initialData.from,
    to: initialData.to,
  });

  const [startTime, setStartTime] = React.useState(initialData.startTime);
  const [endTime, setEndTime] = React.useState(initialData.endTime);
  const [hasEndDate, setHasEndDate] = React.useState(initialData.range);
  const [includeTime, setIncludeTime] = React.useState(initialData.time);

  // Formatters for display
  const [dateFormat, setDateFormat] = React.useState("Full date");
  const [timeFormat, setTimeFormat] = React.useState("24 hour");
  const [timezone, setTimezone] = React.useState("GMT+7");

  // Sync internal state when selected prop changes (one-way sync is enough for initial load)
  React.useEffect(() => {
    setRange({ from: initialData.from, to: initialData.to });
    setStartTime(initialData.startTime);
    setEndTime(initialData.endTime);
    setHasEndDate(initialData.range);
    setIncludeTime(initialData.time);
  }, [initialData]);

  const notifyChange = (
    newRange: DateRange | undefined,
    sTime: string,
    eTime: string,
    isRange: boolean,
    isTime: boolean
  ) => {
    if (!newRange?.from) {
      onSelect(null);
      return;
    }

    const fmt = (d: Date, t: string) => {
      const dateStr = format(d, "yyyy-MM-dd");
      return isTime ? `${dateStr} ${t}` : dateStr;
    };

    let result = fmt(newRange.from, sTime);
    if (isRange && newRange.to) {
      result += ` -> ${fmt(newRange.to, eTime)}`;
    }

    onSelect(result);
  };

  const handleRangeSelect = (newRange: DateRange | undefined) => {
    setRange(newRange);
    notifyChange(newRange, startTime, endTime, hasEndDate, includeTime);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartTime(val);
    notifyChange(range, val, endTime, hasEndDate, includeTime);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEndTime(val);
    notifyChange(range, startTime, val, hasEndDate, includeTime);
  };

  const toggleIncludeTime = (enabled: boolean) => {
    setIncludeTime(enabled);
    notifyChange(range, startTime, endTime, hasEndDate, enabled);
  };

  const toggleHasEndDate = (enabled: boolean) => {
    setHasEndDate(enabled);
    // If enabling, default end date to start date + 1 day if not present
    let newRange: DateRange = range ? { ...range } : { from: undefined };
    if (enabled && !range?.to && range?.from) {
      newRange = { from: range.from, to: range.from };
    }
    setRange(newRange);
    notifyChange(newRange, startTime, endTime, enabled, includeTime);
  };

  const handleClear = () => {
    setRange(undefined);
    onSelect(null);
    if (onClose) onClose();
  };

  return (
    <div className="w-[280px] p-0 flex flex-col bg-popover text-popover-foreground shadow-2xl rounded-xl border border-border/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Notion-style Inputs */}
      <div className="p-3 pb-2 space-y-2">
        <div className="flex items-center gap-2 bg-muted/30 hover:bg-muted/50 transition-colors rounded-lg p-2 border border-border/50 shadow-sm group">
          <div className="flex-1 text-[11px] font-semibold text-foreground/80 truncate">
            {range?.from ? format(range.from, "MMM d, yyyy") : "Start date"}
          </div>
          {includeTime && (
            <input
              type="text"
              value={startTime}
              onChange={handleStartTimeChange}
              placeholder="09:00"
              className="w-12 bg-transparent text-[11px] font-bold outline-none border-none p-0 focus:ring-0 text-foreground text-right"
            />
          )}
        </div>

        {hasEndDate && (
          <div className="flex items-center gap-2 bg-muted/30 hover:bg-muted/50 transition-colors rounded-lg p-2 border border-border/50 shadow-sm group animate-in slide-in-from-top-1">
            <div className="flex-1 text-[11px] font-semibold text-foreground/80 truncate">
              {range?.to ? format(range.to, "MMM d, yyyy") : "End date"}
            </div>
            {includeTime && (
              <input
                type="text"
                value={endTime}
                onChange={handleEndTimeChange}
                placeholder="17:00"
                className="w-12 bg-transparent text-[11px] font-bold outline-none border-none p-0 focus:ring-0 text-foreground text-right"
              />
            )}
          </div>
        )}
      </div>

      <div className="px-1">
        {hasEndDate ? (
          <Calendar
            mode="range"
            selected={range}
            onSelect={handleRangeSelect}
            required={false}
            initialFocus
            className="p-2"
            numberOfMonths={1}
          />
        ) : (
          <Calendar
            mode="single"
            selected={range?.from}
            onSelect={(d) => handleRangeSelect({ from: d, to: undefined })}
            required={false}
            initialFocus
            className="p-2"
            numberOfMonths={1}
          />
        )}
      </div>

      <Separator className="opacity-40" />

      {/* Settings Area */}
      <div className="p-2 space-y-0.5">
        <div className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/50 rounded-md transition-colors cursor-default group">
          <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground/90 transition-colors">
            End date
          </span>
          <Switch
            checked={hasEndDate}
            onCheckedChange={toggleHasEndDate}
            className="scale-75 origin-right"
          />
        </div>

        <div className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/50 rounded-md transition-colors cursor-default group">
          <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground/90 transition-colors">
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
            <div className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/50 rounded-md transition-colors cursor-pointer group">
              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground/90 transition-colors">
                Date format
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground/50">
                  {dateFormat}
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            className="w-44 p-1 shadow-xl border-border/60"
          >
            {["Full date", "Month Day, Year", "MM/DD/YYYY", "DD/MM/YYYY"].map(
              (f) => (
                <Button
                  key={f}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-[11px] h-8 px-2.5 font-normal",
                    dateFormat === f &&
                      "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                  onClick={() => setDateFormat(f)}
                >
                  {f}
                </Button>
              )
            )}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/50 rounded-md transition-colors cursor-pointer group">
              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground/90 transition-colors">
                Time format
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground/50">
                  {timeFormat}
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            className="w-32 p-1 shadow-xl border-border/60"
          >
            {["24 hour", "12 hour"].map((f) => (
              <Button
                key={f}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-[11px] h-8 px-2.5 font-normal",
                  timeFormat === f &&
                    "bg-primary/10 text-primary hover:bg-primary/20"
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
            <div className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/50 rounded-md transition-colors cursor-pointer group">
              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground/90 transition-colors">
                Timezone
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground/50 truncate max-w-[60px]">
                  {timezone}
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            className="w-52 p-1 shadow-xl border-border/60"
          >
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
                  "w-full justify-start text-[11px] h-8 px-2.5 font-normal truncate",
                  timezone === z.split(" ")[0] &&
                    "bg-primary/10 text-primary hover:bg-primary/20"
                )}
                onClick={() => setTimezone(z.split(" ")[0])}
              >
                {z}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      <Separator className="opacity-40" />

      {/* Bottom Actions */}
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-9 text-[11px] font-semibold text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5 px-3 transition-colors rounded-lg"
          onClick={handleClear}
        >
          Clear
        </Button>
      </div>

      <div className="p-3 px-4 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-3 w-3 text-muted-foreground/40" />
          <span className="text-[10px] font-medium text-muted-foreground/50 hover:text-foreground/80 cursor-pointer transition-colors">
            Learn about reminders
          </span>
        </div>
        <div className="text-[9px] font-bold text-muted-foreground/30 tracking-widest">
          NOTION STYLE
        </div>
      </div>
    </div>
  );
}
