"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Sparkles, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MonthlyCalendar } from "@/components/monthly-calendar";
import { DayActivityList } from "@/components/day-activity-list";
import { WorkoutDetail } from "@/components/workout-detail";
import { Button } from "@/components/ui/button";
import { Activity } from "@/lib/types";
import { getActivities } from "@/lib/data";

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

  const selectedDayActivityCount = useMemo(() => {
    if (!selectedDate) {
      return 0;
    }

    const key = format(selectedDate, "yyyy-MM-dd");
    return activities.filter((activity) => activity.activity_date === key).length;
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
            <section className="hero-panel">
              <div className="relative z-10 grid gap-5 sm:grid-cols-[1.2fr_0.8fr] sm:items-end">
                <div>
                  <p className="text-kicker">Month view</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                    A cleaner training calendar with the green glass look intact.
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                    Tap any day to open the session overlay. The calendar stays light on detail here, then opens into a focused glass layer when you want the workout breakdown.
                  </p>
                </div>
                <div className="rounded-[26px] border border-border/70 bg-background/50 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs uppercase tracking-[0.18em]">Selected day</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold">
                    {selectedDate ? format(selectedDate, "MMMM d") : "Choose a day"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedDate && selectedDayActivityCount > 0
                      ? `${selectedDayActivityCount} session${selectedDayActivityCount > 1 ? "s" : ""} ready to inspect.`
                      : "Choose a day with activity to open the glass overlay."}
                  </p>
                </div>
              </div>
            </section>

            <section className="surface-panel">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-kicker">Calendar</p>
                    <h2 className="mt-2 text-xl font-semibold sm:text-2xl">Tap a date to drill into the workout</h2>
                  </div>
                  <div className="hidden rounded-full border border-border/70 bg-background/45 px-3 py-1.5 text-sm text-muted-foreground sm:flex sm:items-center sm:gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Mobile-first layout
                  </div>
                </div>

                <MonthlyCalendar
                  activities={activities}
                  onSelectDate={handleSelectDate}
                  selectedDate={selectedDate}
                />
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
