export interface Activity {
  activity_date: string;
  source_id: string;
  source: "strava" | "hevy";
  activity_type: string;
  activity_name: string;
  distance_meters: number | null;
  moving_seconds: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  load_metric: number | null;
  volume_kg: number | null;
  total_sets: number | null;
}

export interface CardioEfficiency {
  activity_date: string;
  activity_id: string;
  activity_name: string;
  sport_type: string;
  distance_km: number;
  duration_minutes: number;
  moving_minutes: number;
  avg_hr: number;
  max_hr: number;
  elevation_gain_m: number;
  pace_min_per_km: number | null;
  speed_kmh: number | null;
  hr_per_kmh: number | null;
  elevation_per_km: number | null;
}

export interface StrengthProgression {
  log_date: string;
  exercise_name: string;
  exercise_template_id: string;
  estimated_1rm: number;
  max_weight_used: number;
  total_volume_kg: number;
  total_sets: number;
  avg_rpe: number | null;
}

export interface WorkoutExerciseDetail {
  exercise_name: string;
  exercise_index: number;
  total_sets: number;
  total_reps: number;
  total_volume_kg: number;
  max_weight_used: number;
  sets: WorkoutExerciseSetDetail[];
}

export interface WorkoutExerciseSetDetail {
  set_index: number;
  set_type: string;
  reps: number | null;
  weight_kg: number | null;
  rpe: number | null;
  duration_seconds: number | null;
  volume_kg: number;
}

export interface CardioWorkoutDetail {
  source: "strava";
  detail_type: "cardio";
  source_id: string;
  activity_date: string;
  activity_name: string;
  activity_type: string;
  distance_km: number;
  duration_minutes: number;
  moving_minutes: number;
  avg_hr: number | null;
  max_hr: number | null;
  elevation_gain_m: number | null;
  pace_min_per_km: number | null;
  speed_kmh: number | null;
  hr_per_kmh: number | null;
  elevation_per_km: number | null;
}

export interface StrengthWorkoutDetail {
  source: "hevy";
  detail_type: "strength";
  source_id: string;
  activity_date: string;
  activity_name: string;
  workout_started_at: string | null;
  workout_ended_at: string | null;
  exercise_count: number;
  total_sets: number;
  total_reps: number;
  total_volume_kg: number;
  exercises: WorkoutExerciseDetail[];
}

export type WorkoutDetailRecord = CardioWorkoutDetail | StrengthWorkoutDetail;

/** Map activity_type to a color and icon name */
export const ACTIVITY_CONFIG: Record<string, { color: string; darkColor: string; icon: string; label: string }> = {
  Run:                             { color: "#22c55e", darkColor: "#4ade80", icon: "footprints",   label: "Run" },
  Ride:                            { color: "#3b82f6", darkColor: "#60a5fa", icon: "bike",         label: "Ride" },
  VirtualRide:                     { color: "#6366f1", darkColor: "#818cf8", icon: "bike",         label: "Virtual Ride" },
  Swim:                            { color: "#06b6d4", darkColor: "#22d3ee", icon: "waves",        label: "Swim" },
  Walk:                            { color: "#a3e635", darkColor: "#bef264", icon: "footprints",   label: "Walk" },
  Strength:                        { color: "#f97316", darkColor: "#fb923c", icon: "dumbbell",     label: "Strength" },
  WeightTraining:                  { color: "#f97316", darkColor: "#fb923c", icon: "dumbbell",     label: "Weight Training" },
  Yoga:                            { color: "#a855f7", darkColor: "#c084fc", icon: "heart",        label: "Yoga" },
  Soccer:                          { color: "#eab308", darkColor: "#facc15", icon: "circle-dot",   label: "Soccer" },
  HighIntensityIntervalTraining:   { color: "#ef4444", darkColor: "#f87171", icon: "zap",          label: "HIIT" },
  Workout:                         { color: "#ec4899", darkColor: "#f472b6", icon: "zap",          label: "Workout" },
};

export function getActivityConfig(type: string) {
  return ACTIVITY_CONFIG[type] ?? { color: "#94a3b8", darkColor: "#cbd5e1", icon: "activity", label: type };
}
