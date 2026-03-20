"use client";

import { useMemo } from "react";
import { format, subDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

interface ContributionDay {
  date: string;
  count: number;
}

interface GitHubCalendarProps {
  data: ContributionDay[];
  colors?: string[];
}

const GitHubCalendar = ({ data, colors = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"] }: GitHubCalendarProps) => {
  const today = new Date();
  const startDate = subDays(today, 364);
  const weeks = 53;

  const contributions = useMemo(
    () => data.map((item) => ({ ...item, date: new Date(item.date).toISOString() })),
    [data]
  );

  const getColor = (count: number) => {
    if (count === 0) return colors[0];
    if (count === 1) return colors[1];
    if (count === 2) return colors[2];
    if (count === 3) return colors[3];
    return colors[4] || colors[colors.length - 1];
  };

  const renderWeeks = () => {
    const weeksArray = [];
    let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 0 });

    for (let i = 0; i < weeks; i++) {
      const weekDays = eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 0 }),
      });

      weeksArray.push(
        <div key={i} className="flex flex-col gap-1">
          {weekDays.map((day, index) => {
            const contribution = contributions.find((c) => isSameDay(new Date(c.date), day));
            const color = contribution ? getColor(contribution.count) : colors[0];

            return (
              <div
                key={index}
                className="w-3 h-3 rounded-[4px]"
                style={{ backgroundColor: color }}
                title={`${format(day, "PPP")}: ${contribution?.count || 0} activities`}
              />
            );
          })}
        </div>
      );
      currentWeekStart = addDays(currentWeekStart, 7);
    }

    return weeksArray;
  };

  const renderMonthLabels = () => {
    const months = [];
    let currentMonth = startDate;
    for (let i = 0; i < 12; i++) {
      months.push(
        <span key={i} className="text-xs text-muted-foreground">
          {format(currentMonth, "MMM")}
        </span>
      );
      currentMonth = addDays(currentMonth, 30);
    }
    return months;
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="surface-panel overflow-x-auto">
      <div className="relative z-10 min-w-[44rem]">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-kicker">Heatmap</p>
            <h2 className="mt-2 text-2xl font-semibold">Last 53 weeks</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            {colors.map((color, index) => (
              <div key={index} className="h-3 w-3 rounded-[4px] ring-1 ring-black/10 dark:ring-white/10" style={{ backgroundColor: color }} />
            ))}
            <span>More</span>
          </div>
        </div>
        <div className="flex">
          <div className="mr-3 mt-6 flex flex-col justify-between">
          {dayLabels.map((day, index) => (
            <span key={index} className="h-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {day}
            </span>
          ))}
        </div>
          <div className="flex-1">
            <div className="mb-2 flex w-full justify-between gap-4">{renderMonthLabels()}</div>
            <div className="flex gap-1">{renderWeeks()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { GitHubCalendar };
