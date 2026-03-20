import { Activity, CardioEfficiency, StrengthProgression, WorkoutDetailRecord } from "./types";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/data/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

export async function getActivities(): Promise<Activity[]> {
  return fetchJson<Activity[]>("activity_log.json");
}

export async function getCardioEfficiency(): Promise<CardioEfficiency[]> {
  return fetchJson<CardioEfficiency[]>("cardio_efficiency.json");
}

export async function getStrengthProgression(): Promise<StrengthProgression[]> {
  return fetchJson<StrengthProgression[]>("strength_progression.json");
}

export async function getWorkoutDetails(): Promise<WorkoutDetailRecord[]> {
  return fetchJson<WorkoutDetailRecord[]>("workout_details.json");
}
