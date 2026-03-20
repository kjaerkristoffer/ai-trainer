"use client";

import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Activity, getActivityConfig } from "@/lib/types";
import { ActivityBadge } from "@/components/activity-badge";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDistance(meters: number | null): string {
  if (!meters) return "";
  const km = meters / 1000;
  return km >= 1 ? `${km.toFixed(1)} km` : `${meters.toFixed(0)} m`;
}

export function DayActivityList({
  date,
  activities,
  onSelect,
}: {
  date: Date;
  activities: Activity[];
  onSelect: (activity: Activity) => void;
}) {
  const dayActivities = activities.filter(
    (a) => a.activity_date === format(date, "yyyy-MM-dd")
  );

  return (
    <div className="space-y-4">
      <div className="rounded-[26px] border border-border/70 bg-background/45 p-5 backdrop-blur-sm">
        <p className="text-kicker">Selected date</p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
          {format(date, "EEEE, MMMM d, yyyy")}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Tap a session to open the workout summary. The overlay stays in place so you can move back and forth without losing context.
        </p>
      </div>

      {dayActivities.length === 0 ? (
        <div className="rounded-[26px] border border-border/70 bg-background/45 p-6 text-center text-sm text-muted-foreground backdrop-blur-sm">
          No activities on this day
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.ul className="space-y-3">
            {dayActivities.map((a) => {
              const config = getActivityConfig(a.activity_type);
              return (
                <motion.li
                  key={a.source_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <button
                    onClick={() => onSelect(a)}
                    className="flex w-full items-center gap-3 rounded-[24px] border border-border/70 bg-background/45 p-4 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-accent/75"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] ring-1 ring-black/10 dark:ring-white/10"
                      style={{ backgroundColor: config.color + "22" }}
                    >
                      <ActivityBadge type={a.activity_type} size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold">{a.activity_name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{config.label}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {config.label}
                        {a.moving_seconds ? ` · ${formatDuration(a.moving_seconds)}` : ""}
                        {a.distance_meters ? ` · ${formatDistance(a.distance_meters)}` : ""}
                        {a.total_sets ? ` · ${a.total_sets} sets` : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      )}
    </div>
  );
}
