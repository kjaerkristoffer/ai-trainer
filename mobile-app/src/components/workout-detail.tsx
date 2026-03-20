"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Mountain,
  Timer,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, WorkoutDetailRecord, getActivityConfig } from "@/lib/types";
import { getWorkoutDetails } from "@/lib/data";
import { WorkoutSummaryCard, StatItem } from "@/components/ui/workout-summary-card";
import { Button } from "@/components/ui/button";

/** Unsplash images keyed by activity type */
const ACTIVITY_IMAGES: Record<string, string> = {
  Run: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop&q=60",
  Ride: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=600&auto=format&fit=crop&q=60",
  VirtualRide: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=600&auto=format&fit=crop&q=60",
  Swim: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&auto=format&fit=crop&q=60",
  Walk: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=60",
  Strength: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=60",
  WeightTraining: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=60",
  Yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=60",
  Soccer: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&auto=format&fit=crop&q=60",
  HighIntensityIntervalTraining: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&auto=format&fit=crop&q=60",
  Workout: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&auto=format&fit=crop&q=60",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=60";

const SET_TYPE_LABELS: Record<string, string> = {
  normal: "Working",
  warmup: "Warm-up",
  dropset: "Drop set",
  failure: "Failure",
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatCompactDuration(totalSeconds: number | null | undefined): string {
  if (!totalSeconds) return "—";

  const minutes = Math.round(totalSeconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  return `${minutes} min`;
}

function formatMass(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value % 1 === 0 ? `${value.toFixed(0)} kg` : `${value.toFixed(1)} kg`;
}

function formatSetType(type: string): string {
  return SET_TYPE_LABELS[type] ?? type;
}

function formatSetSummary(set: {
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
}) {
  if (set.weight_kg && set.reps) {
    return `${formatMass(set.weight_kg)} × ${set.reps}`;
  }

  if (set.reps) {
    return `${set.reps} reps`;
  }

  if (set.duration_seconds) {
    return `${Math.round(set.duration_seconds)} sec`;
  }

  return "Logged set";
}

function buildStats(a: Activity): StatItem[] {
  const stats: StatItem[] = [];

  if (a.distance_meters) {
    stats.push({
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Distance",
      value: (a.distance_meters / 1000).toFixed(2),
      unit: "km",
      bgColor: "bg-green-100 dark:bg-green-900/50",
      textColor: "text-green-600 dark:text-green-400",
    });
  }

  if (a.moving_seconds) {
    stats.push({
      icon: <Clock className="w-5 h-5" />,
      label: "Duration",
      value: formatDuration(a.moving_seconds),
      unit: "",
      bgColor: "bg-purple-100 dark:bg-purple-900/50",
      textColor: "text-purple-600 dark:text-purple-400",
    });
  }

  if (a.avg_hr) {
    stats.push({
      icon: <Heart className="w-5 h-5" />,
      label: "Avg Heart Rate",
      value: Math.round(a.avg_hr),
      unit: "bpm",
      bgColor: "bg-red-100 dark:bg-red-900/50",
      textColor: "text-red-600 dark:text-red-400",
    });
  }

  if (a.max_hr) {
    stats.push({
      icon: <Flame className="w-5 h-5" />,
      label: "Max Heart Rate",
      value: Math.round(a.max_hr),
      unit: "bpm",
      bgColor: "bg-orange-100 dark:bg-orange-900/50",
      textColor: "text-orange-600 dark:text-orange-400",
    });
  }

  if (a.volume_kg) {
    stats.push({
      icon: <Dumbbell className="w-5 h-5" />,
      label: "Total Volume",
      value: Math.round(a.volume_kg),
      unit: "kg",
      bgColor: "bg-orange-100 dark:bg-orange-900/50",
      textColor: "text-orange-600 dark:text-orange-400",
    });
  }

  if (a.total_sets) {
    stats.push({
      icon: <Footprints className="w-5 h-5" />,
      label: "Sets",
      value: a.total_sets,
      unit: "",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/50",
      textColor: "text-yellow-600 dark:text-yellow-400",
    });
  }

  if (a.load_metric) {
    stats.push({
      icon: <Mountain className="w-5 h-5" />,
      label: "Training Load",
      value: a.load_metric.toFixed(1),
      unit: "TRIMP",
      bgColor: "bg-blue-100 dark:bg-blue-900/50",
      textColor: "text-blue-600 dark:text-blue-400",
    });
  }

  return stats;
}

export function WorkoutDetail({
  activity,
  onBack,
}: {
  activity: Activity;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<WorkoutDetailRecord | null | undefined>(undefined);
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    getWorkoutDetails()
      .then((records) => {
        if (!isMounted) {
          return;
        }
        setExpandedExerciseIndex(null);
        setDetail(records.find((record) => record.source_id === activity.source_id) ?? null);
      });

    return () => {
      isMounted = false;
    };
  }, [activity.source_id]);

  const config = getActivityConfig(activity.activity_type);
  const stats = buildStats(activity);
  const imageUrl = ACTIVITY_IMAGES[activity.activity_type] ?? DEFAULT_IMAGE;
  const orderedExercises = useMemo(
    () => detail?.detail_type === "strength"
      ? [...detail.exercises].sort((left, right) => left.exercise_index - right.exercise_index)
      : [],
    [detail]
  );

  const avgSpeed =
    activity.distance_meters && activity.moving_seconds
      ? `${((activity.distance_meters / 1000) / (activity.moving_seconds / 3600)).toFixed(1)} km/h`
      : "—";

  const avgPace =
    activity.distance_meters && activity.moving_seconds
      ? `${(activity.moving_seconds / 60 / (activity.distance_meters / 1000)).toFixed(1)} min/km`
      : "—";

  const strengthDuration =
    detail?.detail_type === "strength" && detail.workout_started_at && detail.workout_ended_at
      ? Math.max(
          0,
          Math.round(
            (new Date(detail.workout_ended_at).getTime() - new Date(detail.workout_started_at).getTime()) / 1000
          )
        )
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25 }}
    >
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 rounded-full border border-border/70 bg-background/50">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <WorkoutSummaryCard
        date={format(new Date(activity.activity_date), "EEE, MMM d")}
        activity={activity.activity_name}
        equipment={config.label}
        imageUrl={imageUrl}
        primaryMetricLabel={activity.source === "strava" ? "Avg speed" : "Workout time"}
        avgSpeed={avgSpeed}
        secondaryMetricLabel={activity.source === "strava" ? "Avg pace" : "Session scope"}
        avgIncline={activity.source === "strava" ? avgPace : `${formatCompactDuration(strengthDuration)} · ${activity.total_sets ?? 0} sets`}
        stats={stats}
        onClose={onBack}
      />

      <div className="mt-4 space-y-3">
        {detail === undefined ? (
          <div className="rounded-[24px] border border-border/70 bg-background/45 p-5 text-sm text-muted-foreground">
            Loading workout details…
          </div>
        ) : detail?.detail_type === "cardio" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-border/70 bg-background/45 p-4">
              <p className="text-xs text-muted-foreground">Moving Time</p>
              <p className="mt-1 flex items-center gap-2 text-base font-semibold">
                <Timer className="h-4 w-4 text-primary" />
                {detail.moving_minutes?.toFixed(0) ?? "—"} min
              </p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/45 p-4">
              <p className="text-xs text-muted-foreground">Elevation Gain</p>
              <p className="mt-1 flex items-center gap-2 text-base font-semibold">
                <Mountain className="h-4 w-4 text-primary" />
                {detail.elevation_gain_m?.toFixed(0) ?? "—"} m
              </p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/45 p-4">
              <p className="text-xs text-muted-foreground">Efficiency</p>
              <p className="mt-1 text-base font-semibold">
                {detail.hr_per_kmh ? `${detail.hr_per_kmh.toFixed(1)} HR/kmh` : "—"}
              </p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/45 p-4">
              <p className="text-xs text-muted-foreground">Elevation / km</p>
              <p className="mt-1 text-base font-semibold">
                {detail.elevation_per_km ? `${detail.elevation_per_km.toFixed(1)} m/km` : "—"}
              </p>
            </div>
          </div>
        ) : detail?.detail_type === "strength" ? (
          <div className="rounded-[24px] border border-border/70 bg-background/45 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Exercise Breakdown</h3>
                <p className="text-xs text-muted-foreground">
                  {detail.exercise_count} exercises · {detail.total_reps} reps
                </p>
              </div>
              <p className="text-sm font-semibold text-primary">
                {Math.round(detail.total_volume_kg).toLocaleString()} kg
              </p>
            </div>
            <div className="space-y-2">
              {orderedExercises.map((exercise) => {
                const isExpanded = exercise.exercise_index === expandedExerciseIndex;
                const repValues = exercise.sets
                  .map((set) => set.reps)
                  .filter((reps): reps is number => typeof reps === "number" && reps > 0);

                const bestSet = exercise.sets.reduce((best, set) => {
                  if (!best) return set;
                  return set.volume_kg > best.volume_kg ? set : best;
                }, exercise.sets[0]);

                return (
                  <div key={`${exercise.exercise_index}-${exercise.exercise_name}`} className="overflow-hidden rounded-[22px] border border-border/60 bg-background/40">
                    <button
                      type="button"
                      onClick={() => setExpandedExerciseIndex((current) => current === exercise.exercise_index ? null : exercise.exercise_index)}
                      className="flex w-full items-start justify-between gap-3 p-3 text-left transition-colors hover:bg-background/40"
                    >
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Exercise {exercise.exercise_index}
                        </p>
                        <p className="mt-1 text-sm font-semibold">{exercise.exercise_name}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {exercise.total_reps} reps · {Math.round(exercise.total_volume_kg).toLocaleString()} kg volume · max {formatMass(exercise.max_weight_used)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-background/70 px-2.5 py-1 text-xs text-muted-foreground">
                          {exercise.total_sets} sets
                        </span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180 text-primary" : ""}`} />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="border-t border-border/50"
                        >
                          <div className="space-y-3 p-3">
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-[18px] border border-border/50 bg-background/45 p-3">
                                <p className="text-xs text-muted-foreground">Best set</p>
                                <p className="mt-2 text-sm font-semibold">{bestSet ? formatSetSummary(bestSet) : "—"}</p>
                              </div>
                              <div className="rounded-[18px] border border-border/50 bg-background/45 p-3">
                                <p className="text-xs text-muted-foreground">Rep range</p>
                                <p className="mt-2 text-sm font-semibold">
                                  {repValues.length > 0 ? `${Math.min(...repValues)}-${Math.max(...repValues)} reps` : "—"}
                                </p>
                              </div>
                              <div className="rounded-[18px] border border-border/50 bg-background/45 p-3">
                                <p className="text-xs text-muted-foreground">Total volume</p>
                                <p className="mt-2 text-sm font-semibold">{Math.round(exercise.total_volume_kg).toLocaleString()} kg</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {exercise.sets.map((set) => (
                                <div key={set.set_index} className="rounded-[18px] border border-border/50 bg-background/45 p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold">Set {set.set_index}</p>
                                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                        {formatSetType(set.set_type)}
                                      </p>
                                    </div>
                                    <p className="text-sm font-semibold text-primary">{formatSetSummary(set)}</p>
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span className="rounded-full bg-background/70 px-2.5 py-1">Volume {Math.round(set.volume_kg).toLocaleString()} kg</span>
                                    {set.rpe ? <span className="rounded-full bg-background/70 px-2.5 py-1">RPE {set.rpe.toFixed(1)}</span> : null}
                                    {set.duration_seconds ? <span className="rounded-full bg-background/70 px-2.5 py-1">{Math.round(set.duration_seconds)} sec</span> : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-[24px] border border-border/70 bg-background/45 p-5 text-sm text-muted-foreground">
            No additional workout detail was available for this session.
          </div>
        )}
      </div>
    </motion.div>
  );
}
