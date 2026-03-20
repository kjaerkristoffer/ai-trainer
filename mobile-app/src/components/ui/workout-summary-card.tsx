import Image from 'next/image';
import * as React from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2, X, Gauge, TrendingUp } from 'lucide-react';

export interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  bgColor: string;
  textColor: string;
}

export interface WorkoutSummaryCardProps {
  date: string;
  activity: string;
  equipment: string;
  imageUrl: string;
  primaryMetricLabel?: string;
  avgSpeed: string;
  secondaryMetricLabel?: string;
  avgIncline: string;
  stats: StatItem[];
  onLike?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

const formatNumber = (num: number) => num.toLocaleString('en-US');

export const WorkoutSummaryCard: React.FC<WorkoutSummaryCardProps> = ({
  date,
  activity,
  equipment,
  imageUrl,
  primaryMetricLabel = "Avg speed",
  avgSpeed,
  secondaryMetricLabel = "Avg pace",
  avgIncline,
  stats,
  onLike,
  onDelete,
  onClose,
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  const listVariants = {
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="w-full rounded-[32px] border border-border/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 text-card-foreground shadow-[0_32px_100px_-52px_rgba(0,0,0,0.88)] backdrop-blur-xl sm:p-6"
    >
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-kicker">Workout summary</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{activity}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{date} · {equipment}</p>
        </div>
        <div className="flex items-center gap-2">
          {onLike && (
            <button
              onClick={onLike}
              aria-label="Like workout"
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Heart className="w-5 h-5 text-red-500" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              aria-label="Delete workout"
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Trash2 className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close summary"
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-6 flex flex-col gap-4 rounded-[26px] border border-border/70 bg-background/40 p-4 sm:flex-row"
      >
        <div className="relative h-44 min-h-44 overflow-hidden rounded-[22px] sm:h-auto sm:w-[38%]">
          <Image
            src={imageUrl}
            alt={`${activity} workout`}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
        <div className="flex-1 space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">
            Overview first, then the session details below. Strength rows expand inline so the workout stays readable while you inspect the exact sets.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-border/70 bg-background/45 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Gauge className="h-4 w-4 text-primary" />
                <p className="text-[11px] uppercase tracking-[0.18em]">{primaryMetricLabel}</p>
              </div>
              <p className="mt-2 text-lg font-semibold">{avgSpeed}</p>
            </div>
            <div className="rounded-[20px] border border-border/70 bg-background/45 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-[11px] uppercase tracking-[0.18em]">{secondaryMetricLabel}</p>
              </div>
              <p className="mt-2 text-lg font-semibold">{avgIncline}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.ul
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-3 sm:grid-cols-2"
      >
        {stats.map((stat, index) => (
          <motion.li
            key={index}
            variants={itemVariants}
            className="flex items-center justify-between rounded-[22px] border border-border/60 bg-background/45 p-3"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.bgColor}`}
              >
                <div className={stat.textColor}>{stat.icon}</div>
              </div>
              <span className="font-medium text-sm">{stat.label}</span>
            </div>
            <p className="text-lg font-bold">
              {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
              <span className="text-sm font-normal text-muted-foreground ml-1">{stat.unit}</span>
            </p>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
};
