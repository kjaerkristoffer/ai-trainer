"use client";

import {
  Footprints, Bike, Waves, Dumbbell, Heart, Zap, CircleDot, Activity as ActivityIcon,
} from "lucide-react";
import { getActivityConfig } from "@/lib/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  footprints: Footprints,
  bike: Bike,
  waves: Waves,
  dumbbell: Dumbbell,
  heart: Heart,
  zap: Zap,
  "circle-dot": CircleDot,
  activity: ActivityIcon,
};

export function ActivityBadge({
  type,
  size = "sm",
}: {
  type: string;
  size?: "sm" | "md";
}) {
  const config = getActivityConfig(type);
  const Icon = ICON_MAP[config.icon] ?? ActivityIcon;
  const s = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <span title={config.label} style={{ color: config.color }}>
      <Icon className={s} />
    </span>
  );
}

export function ActivityDot({ type }: { type: string }) {
  const config = getActivityConfig(type);
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: config.color }}
      title={config.label}
    />
  );
}
