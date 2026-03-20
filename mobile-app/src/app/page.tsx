"use client";

import { useState, useEffect, useMemo } from "react";
import { format, startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MonthlyCalendar } from "@/components/monthly-calendar";
import { DayActivityList } from "@/components/day-activity-list";
import { WorkoutDetail } from "@/components/workout-detail";
import { Button } from "@/components/ui/button";
import { Activity } from "@/lib/types";
import { getActivities } from "@/lib/data";
import { cn } from "@/lib/utils";

const STRENGTH_TYPES = new Set(["Strength", "WeightTraining"]);
const CARDIO_TYPES = new Set(["Run", "Ride", "VirtualRide", "Swim", "Walk", "HighIntensityIntervalTraining", "Soccer"]);
const STRENGTH_GOAL = 3;
const CARDIO_GOAL = 3;

function GoalCard({
  label,
  count,
  goal,
  accentColor,
}: {
  label: string;
  count: number;
  goal: number;
  accentColor: string;
}) {
  const done = count >= goal;
  return (
    <div className="rounded-[26px] border border-border/70 bg-background/50 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        {done && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">Complete</span>
        )}
      </div>
      <p className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
        {count}
        <span className="text-xl font-normal text-muted-foreground">/{goal}</span>
      </p>
      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: goal }).map((_, i) => (
          <div
            key={i}
            className={cn("h-1.5 flex-1 rounded-full transition-all duration-300", i >= count && "bg-border")}
            style={i < count ? { backgroundColor: accentColor } : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivities()
      .then(setActivities)
      .finally(() => setLoading(false));
  }, []);

  const weekMetrics = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const thisWeek = activities.filter((a) =>
      isWithinInterval(parseISO(a.activity_date), { start: weekStart, end: weekEnd })
    );
    return {
      weekStart,
      weekEnd,
      strengthCount: Math.min(thisWeek.filter((a) => STRENGTH_TYPES.has(a.activity_type)).length, STRENGTH_GOAL),
      cardioCount: Math.min(thisWeek.filter((a) => CARDIO_TYPES.has(a.activity_type)).length, CARDIO_GOAL),
      totalCount: thisWeek.length,
    };
  }, [activities]);

  const selectedDayActivityCount = useMemo(() => {
    if (!selectedDate) return 0;
    const key = format(selectedDate, "yyyy-MM-dd");
    return activities.filter((a) => a.activity_date === key).length;
  }, [activities, selectedDate]);

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setSelectedActivity(null);
    setIsOverlayOpen(true);
  }

  function closeOverlay() {
    setSelectedActivity(null);
    setIsOverlayOpen(false);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Calendar */}
            <section className="surface-panel">
              <div className="relative z-10">
                <MonthlyCalendar
                  activities={activities}
                  onSelectDate={handleSelectDate}
                  selectedDate={selectedDate}
                />
              </div>
            </section>

            {/* Weekly goals */}
            <section className="hero-panel">
              <div className="relative z-10 space-y-5">
                <div>
                  <p className="text-kicker">This week</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                    {format(weekMetrics.weekStart, "MMM d")} – {format(weekMetrics.weekEnd, "MMM d")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {weekMetrics.totalCount} session{weekMetrics.totalCount === 1 ? "" : "s"} logged this week
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <GoalCard
                    label="Strength"
                    count={weekMetrics.strengthCount}
                    goal={STRENGTH_GOAL}
                    accentColor="#f97316"
                  />
                  <GoalCard
                    label="Cardio"
                    count={weekMetrics.cardioCount}
                    goal={CARDIO_GOAL}
                    accentColor="#22c55e"
                  />
                </div>
              </div>
            </section>

            <AnimatePresence>
              {isOverlayOpen && selectedDate ? (
                <motion.div
                  className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.button
                    type="button"
                    aria-label="Close workout overlay"
                    className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.2),rgba(8,12,10,0.8))] backdrop-blur-md"
                    onClick={closeOverlay}
                  />

                  <motion.section
                    initial={{ opacity: 0, y: 28, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 24, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="glass-overlay relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-background/72 shadow-[0_36px_120px_-48px_rgba(0,0,0,0.92)]"
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-border/60 px-4 py-4 sm:px-6">
                      <div>
                        <p className="text-kicker">Day overview</p>
                        <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
                          {format(selectedDate, "EEEE, MMMM d")}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedDayActivityCount} session{selectedDayActivityCount === 1 ? "" : "s"} on this day
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={closeOverlay}
                        className="rounded-full border border-border/70 bg-background/55 backdrop-blur-sm"
                        aria-label="Close overlay"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                      <AnimatePresence mode="wait">
                        {selectedActivity ? (
                          <WorkoutDetail
                            key={selectedActivity.source_id}
                            activity={selectedActivity}
                            onBack={() => setSelectedActivity(null)}
                          />
                        ) : (
                          <DayActivityList
                            key={format(selectedDate, "yyyy-MM-dd")}
                            date={selectedDate}
                            activities={activities}
                            onSelect={setSelectedActivity}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.section>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </>
        )}
      </div>
    </AppShell>
  );
}
