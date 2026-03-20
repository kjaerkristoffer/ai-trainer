"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Target, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { getStrengthProgression, getWorkoutDetails } from "@/lib/data";
import { StrengthProgression, StrengthWorkoutDetail } from "@/lib/types";

const REP_TARGET_LOW = 7;
const REP_TARGET_HIGH = 10;

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({
  values,
  color = "#22c55e",
  height = 48,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 200;
  const H = height;
  const pad = 5;

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (W - pad * 2) + pad;
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return [x, y] as [number, number];
  });

  // Smooth path using cubic bezier
  const d = pts
    .map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [px, py] = pts[i - 1];
      const cx = (px + x) / 2;
      return `C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
    })
    .join(" ");

  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} />
    </svg>
  );
}

// ─── Rep progress bar ─────────────────────────────────────────────────────────

function RepProgressBar({
  reps,
  isReady,
}: {
  reps: number;
  isReady: boolean;
}) {
  const pct = Math.max(0, Math.min(100, ((reps - REP_TARGET_LOW) / (REP_TARGET_HIGH - REP_TARGET_LOW)) * 100));
  const color = isReady ? "#22c55e" : "#f97316";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">
          Rep progress to next weight
        </p>
        <p className="text-sm font-bold" style={{ color }}>
          {reps} / {REP_TARGET_HIGH}
        </p>
      </div>
      <div className="relative h-3 rounded-full bg-border/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {/* Tick labels */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground">{REP_TARGET_LOW} reps</span>
        <span className="text-[10px] text-muted-foreground">{REP_TARGET_HIGH} reps</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ExerciseProgression({
  exerciseName,
}: {
  exerciseName: string;
}) {
  const [workoutDetails, setWorkoutDetails] = useState<StrengthWorkoutDetail[] | undefined>(
    undefined
  );
  const [progressionRows, setProgressionRows] = useState<StrengthProgression[] | undefined>(
    undefined
  );

  useEffect(() => {
    let mounted = true;
    Promise.all([getWorkoutDetails(), getStrengthProgression()]).then(
      ([details, progression]) => {
        if (!mounted) return;
        setWorkoutDetails(
          details.filter((d): d is StrengthWorkoutDetail => d.detail_type === "strength")
        );
        setProgressionRows(
          progression
            .filter((p) => p.exercise_name === exerciseName)
            .sort((a, b) => a.log_date.localeCompare(b.log_date))
        );
      }
    );
    return () => {
      mounted = false;
    };
  }, [exerciseName]);

  // ── All working sets for this exercise across every workout ──
  const allSets = useMemo(() => {
    if (!workoutDetails) return [];
    return workoutDetails
      .flatMap((w) => {
        const ex = w.exercises.find((e) => e.exercise_name === exerciseName);
        if (!ex) return [];
        return ex.sets
          .filter(
            (s) =>
              s.set_type === "normal" &&
              s.reps != null &&
              s.weight_kg != null &&
              s.weight_kg > 0
          )
          .map((s) => ({
            date: w.activity_date,
            weight: s.weight_kg as number,
            reps: s.reps as number,
          }));
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [workoutDetails, exerciseName]);

  // ── Group into sessions ──
  const sessions = useMemo(() => {
    const map: Record<string, { weight: number; reps: number }[]> = {};
    for (const s of allSets) {
      (map[s.date] ??= []).push({ weight: s.weight, reps: s.reps });
    }
    return Object.entries(map)
      .map(([date, sets]) => ({ date, sets }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allSets]);

  // ── Current working weight (heaviest in most recent session) ──
  const currentWeight = useMemo(() => {
    if (!sessions.length) return 0;
    return Math.max(...sessions[sessions.length - 1].sets.map((s) => s.weight));
  }, [sessions]);

  // ── Sessions that included sets at currentWeight ──
  const phaseSessions = useMemo(
    () => sessions.filter((s) => s.sets.some((set) => set.weight === currentWeight)),
    [sessions, currentWeight]
  );

  // ── Best reps in the most recent session at current weight ──
  const bestRepsRecent = useMemo(() => {
    if (!phaseSessions.length) return 0;
    const last = phaseSessions[phaseSessions.length - 1];
    const repsAtWeight = last.sets.filter((s) => s.weight === currentWeight).map((s) => s.reps);
    return repsAtWeight.length ? Math.max(...repsAtWeight) : 0;
  }, [phaseSessions, currentWeight]);

  // ── All-time best reps at current weight ──
  const bestRepsEver = useMemo(() => {
    if (!phaseSessions.length) return 0;
    return Math.max(
      ...phaseSessions.flatMap((s) =>
        s.sets.filter((set) => set.weight === currentWeight).map((set) => set.reps)
      )
    );
  }, [phaseSessions, currentWeight]);

  // ── Weight progression ladder ──
  const weightLadder = useMemo(() => {
    const seen = new Set<number>();
    const result: number[] = [];
    for (const s of sessions) {
      const maxW = Math.max(...s.sets.map((set) => set.weight));
      if (!seen.has(maxW)) {
        seen.add(maxW);
        result.push(maxW);
      }
    }
    return result;
  }, [sessions]);

  // ── Best reps per session at current weight (for mini chart) ──
  const repTrendAtCurrentWeight = useMemo(
    () =>
      phaseSessions.map((s) =>
        Math.max(...s.sets.filter((set) => set.weight === currentWeight).map((set) => set.reps))
      ),
    [phaseSessions, currentWeight]
  );

  // ── Sparkline data ──
  const oneRmValues = useMemo(
    () => (progressionRows ?? []).map((p) => p.estimated_1rm),
    [progressionRows]
  );
  const volumeValues = useMemo(
    () => (progressionRows ?? []).map((p) => p.total_volume_kg),
    [progressionRows]
  );

  const isLoading = workoutDetails === undefined;
  const isReady = bestRepsRecent >= REP_TARGET_HIGH;
  const repsNeeded = REP_TARGET_HIGH - bestRepsRecent;
  const isBodyweight = sessions.length > 0 && currentWeight === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.22 }}
      className="space-y-3"
    >
      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-14">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-[22px] border border-border/70 bg-background/45 p-4 text-sm text-muted-foreground">
          No weighted working-set data found for this exercise.
        </div>
      ) : isBodyweight ? (
        <div className="rounded-[22px] border border-border/70 bg-background/45 p-4 text-sm text-muted-foreground">
          This exercise uses bodyweight — weight-based progressive overload
          tracking is not applicable.
        </div>
      ) : (
        <>
          {/* ── Current Phase Card ─────────────────────────────── */}
          <div
            className="rounded-[22px] p-4 space-y-4"
            style={{
              background: isReady
                ? "linear-gradient(135deg, #22c55e22 0%, #22c55e06 100%)"
                : "linear-gradient(135deg, #f9731622 0%, #f9731606 100%)",
              border: `1px solid ${isReady ? "#22c55e28" : "#f9731628"}`,
            }}
          >
            {/* Weight + icon */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Current Phase
                </p>
                <p className="mt-1 text-4xl font-bold tracking-[-0.04em] leading-none">
                  {currentWeight}
                  <span className="ml-1.5 text-lg font-normal text-muted-foreground">kg</span>
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {phaseSessions.length} session{phaseSessions.length !== 1 ? "s" : ""} at this
                  weight
                </p>
              </div>
              <div
                className="rounded-full p-2.5"
                style={{
                  backgroundColor: isReady ? "#22c55e18" : "#f9731618",
                }}
              >
                {isReady ? (
                  <Trophy className="h-5 w-5 text-green-500" />
                ) : (
                  <Target className="h-5 w-5 text-orange-500" />
                )}
              </div>
            </div>

            {/* Rep progress bar */}
            <RepProgressBar reps={bestRepsRecent} isReady={isReady} />

            {/* Status message */}
            {isReady ? (
              <p className="text-xs font-semibold text-green-500">
                Ready to move up — increase weight next session!
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {repsNeeded} more rep{repsNeeded !== 1 ? "s" : ""} in your best set to unlock the
                next weight
                {bestRepsEver > bestRepsRecent && (
                  <span className="ml-1 text-muted-foreground/60">
                    (all-time best: {bestRepsEver})
                  </span>
                )}
              </p>
            )}
          </div>

          {/* ── Rep trend mini sparkline at current weight ─────── */}
          {repTrendAtCurrentWeight.length >= 3 && (
            <div className="rounded-[22px] border border-border/60 bg-background/40 p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Best-Set Reps at {currentWeight} kg
                </p>
                <p className="text-xs font-semibold" style={{ color: isReady ? "#22c55e" : "#f97316" }}>
                  {repTrendAtCurrentWeight[0]} → {repTrendAtCurrentWeight[repTrendAtCurrentWeight.length - 1]}
                </p>
              </div>
              <Sparkline
                values={repTrendAtCurrentWeight}
                color={isReady ? "#22c55e" : "#f97316"}
                height={44}
              />
            </div>
          )}

          {/* ── Sessions at current weight ─────────────────────── */}
          {phaseSessions.length > 0 && (
            <div className="space-y-2">
              <div className="px-1">
                <h3 className="text-sm font-semibold">Sessions at {currentWeight} kg</h3>
                <p className="text-xs text-muted-foreground">Most recent first</p>
              </div>

              <div className="space-y-1.5">
                {[...phaseSessions]
                  .reverse()
                  .slice(0, 10)
                  .map((session) => {
                    const setsAtWeight = session.sets
                      .filter((s) => s.weight === currentWeight)
                      .sort((a, b) => b.reps - a.reps); // best first
                    const best = setsAtWeight[0]?.reps ?? 0;

                    return (
                      <div
                        key={session.date}
                        className="flex items-center justify-between rounded-[16px] border border-border/50 bg-background/45 px-3 py-2.5"
                      >
                        <span className="w-14 shrink-0 text-xs text-muted-foreground">
                          {format(parseISO(session.date), "MMM d")}
                        </span>

                        {/* Rep badges */}
                        <div className="flex flex-1 flex-wrap gap-1.5 px-2">
                          {setsAtWeight.map((set, i) => {
                            const isTarget = set.reps >= REP_TARGET_HIGH;
                            const isGood = set.reps >= REP_TARGET_LOW;
                            return (
                              <span
                                key={i}
                                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                style={{
                                  backgroundColor: isTarget
                                    ? "#22c55e20"
                                    : isGood
                                    ? "#f9731620"
                                    : "#94a3b820",
                                  color: isTarget
                                    ? "#22c55e"
                                    : isGood
                                    ? "#f97316"
                                    : "#94a3b8",
                                }}
                              >
                                {set.reps}
                              </span>
                            );
                          })}
                        </div>

                        {/* Best rep indicator */}
                        <span
                          className="shrink-0 text-xs font-bold"
                          style={{
                            color: best >= REP_TARGET_HIGH ? "#22c55e" : "#f97316",
                          }}
                        >
                          {best}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── Weight progression ladder ──────────────────────── */}
          {weightLadder.length > 0 && (
            <div className="rounded-[22px] border border-border/60 bg-background/40 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-3">
                Weight Progression
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {weightLadder.map((w, i) => {
                  const isCurrent = w === currentWeight;
                  return (
                    <div key={w} className="flex items-center gap-1.5">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={
                          isCurrent
                            ? {
                                backgroundColor: "#f9731628",
                                color: "#f97316",
                                border: "1px solid #f9731640",
                              }
                            : {
                                backgroundColor: "#22c55e14",
                                color: "#94a3b8",
                                border: "1px solid #22c55e20",
                              }
                        }
                      >
                        {w} kg
                      </span>
                      {i < weightLadder.length - 1 && (
                        <span className="text-[10px] text-muted-foreground/50">→</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Stats row: sessions & top weight ─────────────────── */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[16px] border border-border/50 bg-background/45 p-3">
              <p className="text-[10px] text-muted-foreground">Total sessions</p>
              <p className="mt-1.5 text-lg font-bold tracking-[-0.03em]">{sessions.length}</p>
            </div>
            <div className="rounded-[16px] border border-border/50 bg-background/45 p-3">
              <p className="text-[10px] text-muted-foreground">Weight jumps</p>
              <p className="mt-1.5 text-lg font-bold tracking-[-0.03em]">
                {Math.max(0, weightLadder.length - 1)}
              </p>
            </div>
            <div className="rounded-[16px] border border-border/50 bg-background/45 p-3">
              <p className="text-[10px] text-muted-foreground">Max weight</p>
              <p className="mt-1.5 text-lg font-bold tracking-[-0.03em]">
                {Math.max(...weightLadder)}
                <span className="text-[10px] font-normal text-muted-foreground"> kg</span>
              </p>
            </div>
          </div>

          {/* ── Estimated 1RM trend ───────────────────────────────── */}
          {oneRmValues.length >= 2 && (
            <div className="rounded-[22px] border border-border/60 bg-background/40 p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Est. 1RM Trend
                </p>
                <div className="text-right">
                  <p className="text-lg font-bold tracking-[-0.03em]">
                    {oneRmValues[oneRmValues.length - 1].toFixed(1)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">kg</span>
                  </p>
                  <p
                    className="text-[10px]"
                    style={{
                      color:
                        oneRmValues[oneRmValues.length - 1] >= oneRmValues[0]
                          ? "#22c55e"
                          : "#f43f5e",
                    }}
                  >
                    {oneRmValues[oneRmValues.length - 1] >= oneRmValues[0] ? "+" : ""}
                    {(oneRmValues[oneRmValues.length - 1] - oneRmValues[0]).toFixed(1)} kg
                    all-time
                  </p>
                </div>
              </div>
              <Sparkline values={oneRmValues} color="#3b82f6" height={52} />
            </div>
          )}

          {/* ── Volume per session trend ──────────────────────────── */}
          {volumeValues.length >= 2 && (
            <div className="rounded-[22px] border border-border/60 bg-background/40 p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Volume per Session
                </p>
                <p className="text-lg font-bold tracking-[-0.03em]">
                  {Math.round(volumeValues[volumeValues.length - 1]).toLocaleString()}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">kg</span>
                </p>
              </div>
              <Sparkline values={volumeValues} color="#a855f7" height={52} />
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
