"use client";

import { useState, useEffect, useMemo } from "react";
import { Flame, Mountain, Orbit } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { GitHubCalendar } from "@/components/ui/git-hub-calendar";
import { PricingCard } from "@/components/ui/dark-gradient-pricing";
import { Activity, ACTIVITY_CONFIG } from "@/lib/types";
import { getActivities } from "@/lib/data";

export default function YearPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivities()
      .then(setActivities)
      .finally(() => setLoading(false));
  }, []);

  // Convert activities to contribution data: count per day
  const contributionData = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of activities) {
      const key = a.activity_date;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
  }, [activities]);

  // Activity type legend
  const usedTypes = useMemo(() => {
    const types = new Set(activities.map((a) => a.activity_type));
    return Object.entries(ACTIVITY_CONFIG).filter(([key]) => types.has(key));
  }, [activities]);

  const summary = useMemo(() => {
    const activeDays = contributionData.length;
    const totalKm = activities.reduce((sum, activity) => sum + (activity.distance_meters ?? 0), 0) / 1000;
    const totalTonnage = activities.reduce((sum, activity) => sum + (activity.volume_kg ?? 0), 0) / 1000;
    const longestDay = contributionData.reduce((max, day) => Math.max(max, day.count), 0);

    return { activeDays, totalKm, totalTonnage, longestDay };
  }, [activities, contributionData]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="surface-panel surface-grid">
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <span className="text-kicker">Year view</span>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
                Twelve months of consistency in one gradient field.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Use the yearly overview to spot training density, then read the headline signals for consistency, cardio range, and strength volume.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[24px] border border-border/70 bg-background/55 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Orbit className="h-4 w-4" /><span className="text-xs uppercase tracking-[0.18em]">Active days</span></div>
                <p className="mt-2 text-3xl font-semibold">{summary.activeDays}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-2">
                <div className="rounded-[24px] border border-border/70 bg-background/55 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Mountain className="h-4 w-4" /><span className="text-xs uppercase tracking-[0.18em]">Cardio</span></div>
                  <p className="mt-2 text-2xl font-semibold">{summary.totalKm.toFixed(0)} km</p>
                </div>
                <div className="rounded-[24px] border border-border/70 bg-background/55 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Flame className="h-4 w-4" /><span className="text-xs uppercase tracking-[0.18em]">Peak day</span></div>
                  <p className="mt-2 text-2xl font-semibold">{summary.longestDay}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <GitHubCalendar
              data={contributionData}
              colors={["#e4e4e7", "#fed7aa", "#fb923c", "#f97316", "#c2410c"]}
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <PricingCard
                tier="Consistency"
                price={`${summary.activeDays}`}
                bestFor="Active days across the last 12 months"
                CTA="Rhythm locked"
                benefits={[
                  { text: `${activities.length} total sessions`, checked: true },
                  { text: `${summary.longestDay} sessions on your busiest day`, checked: summary.longestDay >= 2 },
                  { text: `${usedTypes.length} activity types tracked`, checked: usedTypes.length >= 3 },
                  { text: "Year view fully populated", checked: contributionData.length >= 180 },
                ]}
              />
              <PricingCard
                tier="Pro"
                price={`${summary.totalKm.toFixed(0)} km`}
                bestFor="Cardio distance captured from Strava sessions"
                CTA="Engine trend"
                benefits={[
                  { text: `${activities.filter((activity) => activity.distance_meters).length} cardio entries`, checked: true },
                  { text: "Pace and heart-rate drill-down", checked: true },
                  { text: "Elevation efficiency included", checked: true },
                  { text: "Low-cardio year", checked: summary.totalKm < 300 },
                ]}
              />
              <PricingCard
                tier="Strength"
                price={`${summary.totalTonnage.toFixed(1)} t`}
                bestFor="Total lifted volume tracked from Hevy workouts"
                CTA="Load trend"
                benefits={[
                  { text: `${activities.filter((activity) => activity.volume_kg).length} strength entries`, checked: true },
                  { text: "Per-exercise workout breakdown", checked: true },
                  { text: "High-volume lifting year", checked: summary.totalTonnage >= 40 },
                  { text: "Session detail export synced", checked: true },
                ]}
              />
            </div>

            <div className="surface-panel">
              <div className="relative z-10 space-y-4">
              <h3 className="text-sm font-medium">Activity Types</h3>
              <div className="flex flex-wrap gap-3">
                {usedTypes.map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-xs text-muted-foreground">{config.label}</span>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
