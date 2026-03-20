"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Activity, getActivityConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthlyCalendar({
  activities,
  onSelectDate,
  selectedDate,
}: {
  activities: Activity[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }),
    [currentMonth]
  );

  // Map date string → unique activity types for this month
  const activityMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const a of activities) {
      const key = a.activity_date;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(a.activity_type);
    }
    return map;
  }, [activities]);

  // Monday-based offset (0 = Mon, 6 = Sun)
  const startOffset = (getDay(days[0]) + 6) % 7;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-border/70 bg-background/55 backdrop-blur-sm"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="text-kicker">Month navigator</p>
          <h2 className="text-lg font-semibold tracking-[-0.03em] sm:text-2xl">{format(currentMonth, "MMMM yyyy")}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-border/70 bg-background/55 backdrop-blur-sm"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1 sm:gap-2.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const types = activityMap.get(dateStr) ?? new Set<string>();
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isCurrentDay = isToday(day);

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(day)}
              className={cn(
                "glass-overlay relative aspect-square rounded-[18px] border border-transparent px-1 py-2 text-center transition-all sm:rounded-[22px]",
                "hover:-translate-y-0.5 hover:border-primary/35 hover:bg-accent/70",
                isSelected && "border-primary/70 ring-1 ring-primary/40 shadow-[0_18px_44px_-30px_rgba(16,185,129,0.95)]",
                isCurrentDay && !isSelected && "border-primary/35"
              )}
            >
              <span
                className={cn(
                  "block text-sm font-medium leading-none",
                  isCurrentDay && "font-bold text-primary",
                  !isCurrentDay && "text-foreground"
                )}
              >
                {format(day, "d")}
              </span>

              <div className="mt-2 flex justify-center">
                <div className="flex flex-wrap items-center justify-center gap-1 max-w-full">
                  {[...types].slice(0, 3).map((type) => {
                    const config = getActivityConfig(type);
                    return (
                      <span
                        key={type}
                        className="inline-block h-2 w-2 rounded-full ring-1 ring-black/8 dark:ring-white/10"
                        style={{ backgroundColor: config.color }}
                      />
                    );
                  })}
                  {types.size > 3 && (
                    <span className="text-[8px] leading-none text-muted-foreground">
                      +{types.size - 3}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
