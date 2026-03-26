"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Mountain,
  Timer,
  TrendingUp,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, StrengthWorkoutDetail, WorkoutDetailRecord } from "@/lib/types";
import { getWorkoutDetails } from "@/lib/data";
import { ExerciseProgression } from "@/components/exercise-progression";

interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  color: string; // hex accent color for gradient + icon
}

const REP_TARGET_HIGH = 10;

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
      icon: <BarChart3 className="h-4 w-4" />,
      label: "Distance",
      value: (a.distance_meters / 1000).toFixed(2),
      unit: "km",
      color: "#22c55e",
    });
  }

  if (a.moving_seconds) {
    stats.push({
      icon: <Clock className="h-4 w-4" />,
      label: "Duration",
      value: formatDuration(a.moving_seconds),
      unit: "",
      color: "#a855f7",
    });
  }

  if (a.avg_hr) {
    stats.push({
      icon: <Heart className="h-4 w-4" />,
      label: "Avg Heart Rate",
      value: Math.round(a.avg_hr),
      unit: "bpm",
      color: "#f43f5e",
    });
  }

  if (a.max_hr) {
    stats.push({
      icon: <Flame className="h-4 w-4" />,
      label: "Max Heart Rate",
      value: Math.round(a.max_hr),
      unit: "bpm",
      color: "#f97316",
    });
  }

  if (a.volume_kg) {
    stats.push({
      icon: <Dumbbell className="h-4 w-4" />,
      label: "Total Volume",
      value: Math.round(a.volume_kg),
      unit: "kg",
      color: "#f59e0b",
    });
  }

  if (a.total_sets) {
    stats.push({
      icon: <Footprints className="h-4 w-4" />,
      label: "Sets",
      value: a.total_sets,
      unit: "",
      color: "#eab308",
    });
  }

  if (a.load_metric) {
    stats.push({
      icon: <Mountain className="h-4 w-4" />,
      label: "Training Load",
      value: a.load_metric.toFixed(1),
      unit: "TRIMP",
      color: "#3b82f6",
    });
  }

  return stats;
}

// ─── Set history bar chart ────────────────────────────────────────────────────

function SetHistoryBarChart({
  points,
  currentDate,
  color,
  formatValue,
}: {
  points: Array<{ date: string; value: number }>;
  currentDate: string;
  color: string;
  formatValue: (v: number) => string;
}) {
  if (points.length === 0) return null;

  const maxVal = Math.max(...points.map((p) => p.value), 1);
  const W = 300;
  const valueAreaH = 13;
  const chartH = 52;
  const dateAreaH = 18;
  const totalH = valueAreaH + chartH + dateAreaH;
  const barGap = W / points.length;
  const barW = Math.min(46, barGap * 0.58);

  return (
    <svg
      viewBox={`0 0 ${W} ${totalH}`}
      className="w-full"
      style={{ height: totalH }}
      preserveAspectRatio="xMidYMid meet"
    >
      {points.map((pt, i) => {
        const cx = i * barGap + barGap / 2;
        const isCurrent = pt.date === currentDate;
        const normH = Math.max(3, (pt.value / maxVal) * chartH);
        const barY = valueAreaH + chartH - normH;
        return (
          <g key={pt.date + i}>
            <rect
              x={cx - barW / 2}
              y={barY}
              width={barW}
              height={normH}
              rx={2.5}
              fill={isCurrent ? color : `${color}55`}
            />
            <text
              x={cx}
              y={barY - 2}
              textAnchor="middle"
              fontSize="8"
              fontWeight={isCurrent ? "700" : "400"}
              fill={isCurrent ? color : "#64748b"}
            >
              {formatValue(pt.value)}
            </text>
            <text
              x={cx}
              y={valueAreaH + chartH + dateAreaH - 1}
              textAnchor="middle"
              fontSize="7"
              fontWeight={isCurrent ? "600" : "400"}
              fill={isCurrent ? color : "#64748b"}
            >
              {format(parseISO(pt.date), "d MMM")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Per-set progression view ─────────────────────────────────────────────────

function SetProgressionView({
  exerciseName,
  setIndex,
  currentSessionDate,
  allStrengthDetails,
}: {
  exerciseName: string;
  setIndex: number;
  currentSessionDate: string;
  allStrengthDetails: StrengthWorkoutDetail[];
}) {
  const history = useMemo(() => {
    return allStrengthDetails
      .filter((w) => w.exercises.some((e) => e.exercise_name === exerciseName))
      .sort((a, b) => a.activity_date.localeCompare(b.activity_date))
      .flatMap((w) => {
        const ex = w.exercises.find((e) => e.exercise_name === exerciseName);
        if (!ex) return [];
        const set = ex.sets.find((s) => s.set_index === setIndex);
        if (!set || set.reps == null) return [];
        return [{ date: w.activity_date, weight: set.weight_kg ?? 0, reps: set.reps }];
      })
      .slice(-10);
  }, [allStrengthDetails, exerciseName, setIndex]);

  if (history.length === 0) {
    return (
      <p className="py-2 text-[11px] text-muted-foreground">
        No history found for Set {setIndex}.
      </p>
    );
  }

  const latest = history[history.length - 1];
  const prev = history.length >= 2 ? history[history.length - 2] : null;
  const hasWeight = history.some((h) => h.weight > 0);

  // Progressive overload assessment
  const recentReps = history.slice(-3).map((h) => h.reps);
  const repTrend =
    recentReps.length >= 2 ? recentReps[recentReps.length - 1] - recentReps[0] : 0;

  type OverloadStatus = "ready" | "progressing" | "maintain" | "declining";
  let overloadStatus: OverloadStatus = "maintain";
  let recommendation = "";

  if (hasWeight) {
    if (latest.reps >= REP_TARGET_HIGH) {
      overloadStatus = "ready";
      recommendation = `Hit ${latest.reps} reps at ${latest.weight} kg — increase weight by 2.5 kg next session.`;
    } else if (prev && latest.weight > prev.weight) {
      overloadStatus = "progressing";
      recommendation = `Good weight increase (${prev.weight} → ${latest.weight} kg)! Focus on hitting ${REP_TARGET_HIGH} reps.`;
    } else if (repTrend > 0) {
      overloadStatus = "progressing";
      recommendation = `Reps trending up (+${repTrend} over last ${recentReps.length} sessions). Keep current weight.`;
    } else if (prev && latest.reps < prev.reps - 1) {
      overloadStatus = "declining";
      recommendation = `Reps dropped (${prev.reps} → ${latest.reps}). Maintain ${latest.weight} kg and prioritise recovery.`;
    } else {
      overloadStatus = "maintain";
      const needed = REP_TARGET_HIGH - latest.reps;
      recommendation = `Maintain ${latest.weight} kg. Aim for ${needed} more rep${needed !== 1 ? "s" : ""} to unlock the next weight.`;
    }
  } else {
    if (latest.reps >= REP_TARGET_HIGH) {
      overloadStatus = "ready";
      recommendation = `${latest.reps} reps — consider adding resistance or increasing difficulty next session.`;
    } else if (repTrend > 0) {
      overloadStatus = "progressing";
      recommendation = `Reps improving! Keep pushing toward ${REP_TARGET_HIGH} reps.`;
    } else {
      const needed = REP_TARGET_HIGH - latest.reps;
      recommendation = `Aim for ${needed} more rep${needed !== 1 ? "s" : ""} to progress.`;
    }
  }

  const statusColor =
    overloadStatus === "ready"
      ? "#22c55e"
      : overloadStatus === "progressing"
      ? "#3b82f6"
      : overloadStatus === "declining"
      ? "#f43f5e"
      : "#f97316";

  const statusLabel =
    overloadStatus === "ready"
      ? "Ready to progress"
      : overloadStatus === "progressing"
      ? "On track"
      : overloadStatus === "declining"
      ? "Needs attention"
      : "Maintain";

  const weightPoints = history.map((h) => ({ date: h.date, value: h.weight }));
  const repPoints = history.map((h) => ({ date: h.date, value: h.reps }));

  return (
    <div className="space-y-3 pt-1">
      {/* Weight chart */}
      {hasWeight && (
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Weight · kg
          </p>
          <SetHistoryBarChart
            points={weightPoints}
            currentDate={currentSessionDate}
            color="#f59e0b"
            formatValue={(v) => (v === 0 ? "BW" : `${v}`)}
          />
        </div>
      )}

      {/* Reps chart */}
      <div>
        <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Reps
        </p>
        <SetHistoryBarChart
          points={repPoints}
          currentDate={currentSessionDate}
          color="#22c55e"
          formatValue={(v) => `${v}`}
        />
      </div>

      {/* Overload status + recommendation */}
      <div
        className="rounded-[14px] p-3 space-y-1"
        style={{
          background: `linear-gradient(135deg, ${statusColor}18 0%, ${statusColor}06 100%)`,
          border: `1px solid ${statusColor}28`,
        }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: statusColor }}>
          {statusLabel}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">{recommendation}</p>
      </div>
    </div>
  );
}

export function WorkoutDetail({
  activity,
  progressionExercise,
  onViewProgression,
}: {
  activity: Activity;
  progressionExercise: string | null;
  onViewProgression: (name: string) => void;
}) {
  const [detail, setDetail] = useState<WorkoutDetailRecord | null | undefined>(undefined);
  const [allStrengthDetails, setAllStrengthDetails] = useState<StrengthWorkoutDetail[]>([]);
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<number | null>(null);
  const [expandedSetKey, setExpandedSetKey] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getWorkoutDetails().then((records) => {
      if (!isMounted) return;
      setExpandedExerciseIndex(null);
      setExpandedSetKey(null);
      setAllStrengthDetails(
        records.filter((r): r is StrengthWorkoutDetail => r.detail_type === "strength")
      );
      setDetail(records.find((record) => record.source_id === activity.source_id) ?? null);
    });
    return () => {
      isMounted = false;
    };
  }, [activity.source_id]);

  const stats = buildStats(activity);
  const orderedExercises = useMemo(
    () =>
      detail?.detail_type === "strength"
        ? [...detail.exercises].sort((l, r) => l.exercise_index - r.exercise_index)
        : [],
    [detail]
  );

  const avgPace =
    activity.distance_meters && activity.moving_seconds
      ? `${(activity.moving_seconds / 60 / (activity.distance_meters / 1000)).toFixed(1)} min/km`
      : "—";

  return (
    <AnimatePresence mode="wait" initial={false}>
      {progressionExercise ? (
        <ExerciseProgression
          key={progressionExercise}
          exerciseName={progressionExercise}
        />
      ) : (
        <motion.div
          key="detail"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {/* Gradient stat cards */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="rounded-[22px] p-4"
                  style={{
                    background: `linear-gradient(135deg, ${stat.color}22 0%, ${stat.color}06 100%)`,
                    border: `1px solid ${stat.color}28`,
                  }}
                >
                  <div
                    className="mb-3 inline-flex rounded-[14px] p-2"
                    style={{ backgroundColor: `${stat.color}1f` }}
                  >
                    <div style={{ color: stat.color }}>{stat.icon}</div>
                  </div>
                  <p className="text-2xl font-bold tracking-[-0.04em] leading-none">
                    {typeof stat.value === "number"
                      ? stat.value.toLocaleString("en-US")
                      : stat.value}
                    {stat.unit ? (
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        {stat.unit}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Activity-specific detail section */}
          {detail === undefined ? (
            <div className="rounded-[22px] border border-border/70 bg-background/45 p-4 text-sm text-muted-foreground">
              Loading workout details…
            </div>
          ) : detail?.detail_type === "cardio" ? (
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { label: "Moving Time",    value: `${detail.moving_minutes?.toFixed(0) ?? "—"} min`, icon: <Timer className="h-4 w-4" />,      color: "#06b6d4" },
                  { label: "Avg Pace",       value: avgPace,                                             icon: <TrendingUp className="h-4 w-4" />, color: "#22c55e" },
                  { label: "Elevation Gain", value: `${detail.elevation_gain_m?.toFixed(0) ?? "—"} m`,  icon: <Mountain className="h-4 w-4" />,   color: "#94a3b8" },
                  { label: "Efficiency",     value: detail.hr_per_kmh ? `${detail.hr_per_kmh.toFixed(1)} HR/kmh` : "—", icon: <Heart className="h-4 w-4" />, color: "#f43f5e" },
                ] as const
              ).map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] p-4"
                  style={{
                    background: `linear-gradient(135deg, ${item.color}22 0%, ${item.color}06 100%)`,
                    border: `1px solid ${item.color}28`,
                  }}
                >
                  <div
                    className="mb-3 inline-flex rounded-[14px] p-2"
                    style={{ backgroundColor: `${item.color}1f` }}
                  >
                    <div style={{ color: item.color }}>{item.icon}</div>
                  </div>
                  <p className="text-lg font-bold tracking-[-0.03em] leading-snug">{item.value}</p>
                  <p className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          ) : detail?.detail_type === "strength" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
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
                    <div
                      key={`${exercise.exercise_index}-${exercise.exercise_name}`}
                      className="overflow-hidden rounded-[22px] border border-border/60 bg-background/40"
                    >
                      {/* Row: expand button + progression icon */}
                      <div className="flex items-stretch">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedExerciseIndex((current) =>
                              current === exercise.exercise_index ? null : exercise.exercise_index
                            )
                          }
                          className="flex flex-1 items-start justify-between gap-3 p-3 text-left transition-colors hover:bg-background/40"
                        >
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                              Exercise {exercise.exercise_index}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold">{exercise.exercise_name}</p>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              {exercise.total_reps} reps ·{" "}
                              {Math.round(exercise.total_volume_kg).toLocaleString()} kg · max{" "}
                              {formatMass(exercise.max_weight_used)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs text-muted-foreground">
                              {exercise.total_sets} sets
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                isExpanded ? "rotate-180 text-primary" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {/* Progressive overload icon */}
                        <button
                          type="button"
                          title="View progressive overload"
                          onClick={() => onViewProgression(exercise.exercise_name)}
                          className="flex shrink-0 items-center border-l border-border/40 px-3 text-muted-foreground transition-colors hover:text-primary"
                        >
                          <TrendingUp className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Expanded set details */}
                      <AnimatePresence initial={false}>
                        {isExpanded ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="border-t border-border/50"
                          >
                            <div className="space-y-2.5 p-3">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-[16px] border border-border/50 bg-background/45 p-2.5">
                                  <p className="text-[10px] text-muted-foreground">Best set</p>
                                  <p className="mt-1.5 text-xs font-semibold">
                                    {bestSet ? formatSetSummary(bestSet) : "—"}
                                  </p>
                                </div>
                                <div className="rounded-[16px] border border-border/50 bg-background/45 p-2.5">
                                  <p className="text-[10px] text-muted-foreground">Rep range</p>
                                  <p className="mt-1.5 text-xs font-semibold">
                                    {repValues.length > 0
                                      ? `${Math.min(...repValues)}–${Math.max(...repValues)}`
                                      : "—"}
                                  </p>
                                </div>
                                <div className="rounded-[16px] border border-border/50 bg-background/45 p-2.5">
                                  <p className="text-[10px] text-muted-foreground">Volume</p>
                                  <p className="mt-1.5 text-xs font-semibold">
                                    {Math.round(exercise.total_volume_kg).toLocaleString()} kg
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                {exercise.sets.map((set) => {
                                  const setKey = `${exercise.exercise_index}-${set.set_index}`;
                                  const isSetExpanded = expandedSetKey === setKey;
                                  return (
                                    <div
                                      key={set.set_index}
                                      className="overflow-hidden rounded-[16px] border border-border/50 bg-background/45"
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedSetKey((cur) =>
                                            cur === setKey ? null : setKey
                                          )
                                        }
                                        className="flex w-full items-center justify-between px-3 py-2 text-left"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <span className="w-9 text-xs font-semibold">
                                            Set {set.set_index}
                                          </span>
                                          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                                            {formatSetType(set.set_type)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {set.rpe ? (
                                            <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs text-muted-foreground">
                                              RPE {set.rpe.toFixed(1)}
                                            </span>
                                          ) : null}
                                          <span className="text-sm font-semibold text-primary">
                                            {formatSetSummary(set)}
                                          </span>
                                          <ChevronDown
                                            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                                              isSetExpanded ? "rotate-180 text-primary" : ""
                                            }`}
                                          />
                                        </div>
                                      </button>

                                      <AnimatePresence initial={false}>
                                        {isSetExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="border-t border-border/40 px-3 pb-3"
                                          >
                                            <SetProgressionView
                                              exerciseName={exercise.exercise_name}
                                              setIndex={set.set_index}
                                              currentSessionDate={detail.activity_date}
                                              allStrengthDetails={allStrengthDetails}
                                            />
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
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
            <div className="rounded-[22px] border border-border/70 bg-background/45 p-4 text-sm text-muted-foreground">
              No additional workout detail was available for this session.
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
