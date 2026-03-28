import { motion } from "motion/react";
import type { Habit, HabitLog } from "../backend.d";
import { formatDateKey } from "../utils/dateUtils";

type ViewMode = "day" | "week" | "month";

interface AnalyticsViewProps {
  habits: Habit[];
  logs: HabitLog[];
  dates: Date[];
  viewMode: ViewMode;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function computeStreak(habit: Habit, logs: HabitLog[]): number {
  // Count consecutive done days ending today (going backwards)
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatDateKey(d);
    const log = logs.find((l) => l.habitId === habit.id && l.date === key);
    if (log?.done) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function AnalyticsView({
  habits,
  logs,
  dates,
  viewMode,
}: AnalyticsViewProps) {
  const today = new Date();
  const todayKey = formatDateKey(today);

  const doneToday = habits.filter((h) =>
    logs.find((l) => l.habitId === h.id && l.date === todayKey && l.done),
  ).length;

  const overallDone = habits.reduce((acc, h) => {
    return (
      acc +
      dates.filter((d) =>
        logs.find(
          (l) => l.habitId === h.id && l.date === formatDateKey(d) && l.done,
        ),
      ).length
    );
  }, 0);

  const totalSlots = habits.length * dates.length;
  const overallPct =
    totalSlots > 0 ? Math.round((overallDone / totalSlots) * 100) : 0;

  const periodLabel =
    viewMode === "day"
      ? "Today"
      : viewMode === "week"
        ? "This Week"
        : "This Month";

  return (
    <div className="space-y-6" data-ocid="analytics.panel">
      {/* Header summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="bg-white rounded-3xl p-6 card-shadow text-center">
          <div className="text-5xl font-bold mb-1" style={{ color: "#7c3aed" }}>
            {overallPct}%
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            {periodLabel} Completion
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 card-shadow text-center">
          <div className="text-5xl font-bold mb-1" style={{ color: "#22c55e" }}>
            {doneToday}
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            Habits Done Today
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 card-shadow text-center">
          <div className="text-5xl font-bold mb-1" style={{ color: "#f59e0b" }}>
            {habits.length}
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            Total Habits
          </div>
        </div>
      </motion.div>

      {/* Today summary */}
      {doneToday > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4"
        >
          <p className="text-sm font-semibold text-green-700">
            🎉 Amazing! You completed {doneToday} of {habits.length} habits
            today!
          </p>
        </motion.div>
      )}

      {/* Per-habit progress */}
      {habits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <h3 className="font-bold text-base mb-5 text-foreground">
            Habit Progress — {periodLabel}
          </h3>
          <div className="space-y-4">
            {habits.map((habit) => {
              const done = dates.filter((d) =>
                logs.find(
                  (l) =>
                    l.habitId === habit.id &&
                    l.date === formatDateKey(d) &&
                    l.done,
                ),
              ).length;
              const pct =
                dates.length > 0 ? Math.round((done / dates.length) * 100) : 0;
              const streak = computeStreak(habit, logs);
              return (
                <div key={habit.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: habit.color }}
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {habit.name}
                      </span>
                      {streak > 0 && (
                        <span className="text-xs text-orange-500 font-bold">
                          🔥 {streak}d streak
                        </span>
                      )}
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: habit.color }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        duration: 0.8,
                        ease: "easeOut",
                        delay: 0.2,
                      }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {done} / {dates.length} days
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Streaks card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <h3 className="font-bold text-base mb-5 text-foreground">
          🔥 Current Streaks
        </h3>
        {habits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No habits yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {habits.map((habit) => {
              const streak = computeStreak(habit, logs);
              return (
                <div
                  key={habit.id}
                  className="rounded-2xl p-4 text-center"
                  style={{ backgroundColor: hexToRgba(habit.color, 0.15) }}
                >
                  <div
                    className="text-3xl font-bold mb-1"
                    style={{ color: habit.color }}
                  >
                    {streak}
                  </div>
                  <div className="text-xs font-semibold text-foreground truncate">
                    {habit.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {streak === 1 ? "day" : "days"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
