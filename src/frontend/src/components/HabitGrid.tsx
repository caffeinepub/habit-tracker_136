import { Check, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Habit, HabitLog } from "../backend.d";
import { useLogHabit, useRemoveHabit } from "../hooks/useQueries";
import { formatDateKey, isSameDay, shortDay } from "../utils/dateUtils";

type ViewMode = "day" | "week" | "month";

interface HabitGridProps {
  habits: Habit[];
  logs: HabitLog[];
  viewMode: ViewMode;
  dates: Date[];
  today: Date;
  onEditHabit?: (habit: Habit) => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function HabitGrid({
  habits,
  logs,
  viewMode,
  dates,
  today,
  onEditHabit,
}: HabitGridProps) {
  const logHabit = useLogHabit();
  const removeHabit = useRemoveHabit();
  const [timeNotes, setTimeNotes] = useState<Record<string, string>>({});
  const [pendingLog, setPendingLog] = useState<string | null>(null);
  // which cell is expanded to show ✓/✗ options
  const [expandedCell, setExpandedCell] = useState<string | null>(null);

  const getLog = (habitId: string, date: Date): HabitLog | undefined => {
    const key = formatDateKey(date);
    return logs.find((l) => l.habitId === habitId && l.date === key);
  };

  const setLog = async (habit: Habit, date: Date, done: boolean) => {
    const key = `${habit.id}-${formatDateKey(date)}`;
    if (pendingLog === key) return;
    const timeNote = timeNotes[key] || getLog(habit.id, date)?.timeNote || "";
    setPendingLog(key);
    setExpandedCell(null);
    try {
      await logHabit.mutateAsync({
        habitId: habit.id,
        date: formatDateKey(date),
        done,
        timeNote,
      });
    } catch {
      toast.error("Failed to update habit");
    } finally {
      setPendingLog(null);
    }
  };

  const handleRemove = async (habitId: string) => {
    if (!confirm("Remove this habit? All logs will be deleted.")) return;
    try {
      await removeHabit.mutateAsync(habitId);
      toast.success("Habit removed");
    } catch {
      toast.error("Failed to remove habit");
    }
  };

  if (habits.length === 0) {
    return (
      <div
        data-ocid="habits.empty_state"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="text-5xl mb-4">🌱</div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          No habits yet!
        </h3>
        <p className="text-muted-foreground text-sm">
          Click "ADD HABIT +" to start tracking your first habit.
        </p>
      </div>
    );
  }

  // ── DAY VIEW ──
  if (viewMode === "day") {
    const date = dates[0] || today;
    const missedCount = habits.filter((h) => {
      const log = getLog(h.id, date);
      return log !== undefined && log.done === false;
    }).length;
    const doneCount = habits.filter(
      (h) => getLog(h.id, date)?.done === true,
    ).length;
    const unmarkedCount = habits.filter(
      (h) => getLog(h.id, date) === undefined,
    ).length;

    return (
      <div className="space-y-3" data-ocid="habits.list">
        {/* Summary banner */}
        <div className="flex flex-wrap gap-2 mb-1">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
            <Check className="w-3 h-3" /> {doneCount} Done
          </span>
          {missedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-600">
              <X className="w-3 h-3" /> {missedCount} Missed
            </span>
          )}
          {unmarkedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-500">
              ⏳ {unmarkedCount} Remaining
            </span>
          )}
        </div>

        {habits.map((habit, idx) => {
          const log = getLog(habit.id, date);
          const cellKey = `${habit.id}-${formatDateKey(date)}`;
          const isPending = pendingLog === cellKey;
          const isDone = log?.done === true;
          const isNotDone = log !== undefined && log.done === false;
          const isExpanded = expandedCell === cellKey;
          const savedTime = log?.timeNote || "";

          return (
            <div
              key={habit.id}
              data-ocid={`habits.item.${idx + 1}`}
              className="habit-card rounded-2xl bg-white transition-all"
              style={{
                borderLeft: `4px solid ${habit.color}`,
                boxShadow: `0 2px 16px 0 ${hexToRgba(habit.color, 0.18)}, 0 1px 4px 0 rgba(0,0,0,0.05)`,
              }}
            >
              <div className="flex items-center gap-3 p-4">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: habit.color }}
                />
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold shrink-0"
                  style={{
                    backgroundColor: hexToRgba(habit.color, 0.25),
                    color: "#3d3560",
                  }}
                >
                  {habit.name}
                </span>

                {/* Time input */}
                <input
                  type="text"
                  placeholder="Time (e.g. 7:00 AM)"
                  value={timeNotes[cellKey] ?? log?.timeNote ?? ""}
                  onChange={(e) =>
                    setTimeNotes((prev) => ({
                      ...prev,
                      [cellKey]: e.target.value,
                    }))
                  }
                  data-ocid={`habits.input.${idx + 1}`}
                  className="text-sm border border-border rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring bg-secondary flex-1 min-w-0 max-w-[160px]"
                />

                {/* Status button - collapsed or expanded */}
                <div className="relative shrink-0">
                  {isDone || isNotDone ? (
                    // Already logged - show status button, click to change
                    <button
                      type="button"
                      data-ocid={`habits.checkbox.${idx + 1}`}
                      onClick={() =>
                        setExpandedCell(isExpanded ? null : cellKey)
                      }
                      disabled={isPending}
                      title="Click to change"
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white transition-all hover:opacity-80 hover:scale-105"
                      style={{
                        backgroundColor: isDone ? "#22c55e" : "#ef4444",
                      }}
                    >
                      {isDone ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <X className="w-5 h-5" />
                      )}
                    </button>
                  ) : (
                    // Not logged yet - show plain box
                    <button
                      type="button"
                      data-ocid={`habits.checkbox.${idx + 1}`}
                      onClick={() =>
                        setExpandedCell(isExpanded ? null : cellKey)
                      }
                      disabled={isPending}
                      title="Mark habit"
                      className="w-10 h-10 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-gray-50 transition-all"
                    >
                      <span className="text-xs font-medium">?</span>
                    </button>
                  )}

                  {/* Expanded options */}
                  {isExpanded && (
                    <div className="absolute right-0 top-12 z-20 flex gap-2 bg-white rounded-2xl shadow-xl border border-border p-2">
                      <button
                        type="button"
                        onClick={() => setLog(habit, date, true)}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-semibold text-sm transition-all"
                      >
                        <Check className="w-4 h-4" /> Done
                      </button>
                      <button
                        type="button"
                        onClick={() => setLog(habit, date, false)}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm transition-all"
                      >
                        <X className="w-4 h-4" /> Not Done
                      </button>
                    </div>
                  )}
                </div>

                {onEditHabit && (
                  <button
                    type="button"
                    data-ocid={`habits.edit_button.${idx + 1}`}
                    onClick={() => onEditHabit(habit)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded shrink-0"
                    title="Edit habit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  data-ocid={`habits.delete_button.${idx + 1}`}
                  onClick={() => handleRemove(habit.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Time display below if saved */}
              {savedTime && (
                <div
                  className="px-4 pb-3 text-xs font-semibold"
                  style={{ color: habit.color }}
                >
                  🕐 {savedTime}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── WEEK / MONTH VIEW ──
  const colDates = dates;
  const isMonth = viewMode === "month";

  const todayMissed = habits.filter((h) => {
    const log = getLog(h.id, today);
    return log !== undefined && log.done === false;
  }).length;
  const todayDone = habits.filter(
    (h) => getLog(h.id, today)?.done === true,
  ).length;
  const todayInRange = colDates.some((d) => isSameDay(d, today));

  return (
    <div data-ocid="habits.table">
      {todayInRange && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
            <Check className="w-3 h-3" /> Today: {todayDone} done
          </span>
          {todayMissed > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-600">
              <X className="w-3 h-3" /> Today: {todayMissed} missed
            </span>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{ minWidth: isMonth ? "900px" : "520px" }}
        >
          <thead>
            <tr>
              <th className="text-left p-3 text-sm font-semibold text-muted-foreground w-36 min-w-[130px] sticky left-0 bg-white z-10">
                Habit
              </th>
              {colDates.map((d) => {
                const isToday = isSameDay(d, today);
                return (
                  <th
                    key={formatDateKey(d)}
                    className={`text-center p-1 text-xs font-semibold ${
                      isToday ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="uppercase">{shortDay(d)}</span>
                      <span
                        className={`text-sm w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-foreground text-primary-foreground font-bold"
                            : ""
                        }`}
                      >
                        {d.getDate()}
                      </span>
                    </div>
                  </th>
                );
              })}
              <th className="text-center p-2 text-xs font-semibold text-muted-foreground w-14">
                Done
              </th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {habits.map((habit, idx) => {
              const doneDays = colDates.filter(
                (d) => getLog(habit.id, d)?.done,
              ).length;
              return (
                <tr
                  key={habit.id}
                  data-ocid={`habits.row.${idx + 1}`}
                  className="border-t border-border/50"
                >
                  <td className="p-2 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-1">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold max-w-[110px] truncate"
                        style={{
                          backgroundColor: hexToRgba(habit.color, 0.3),
                          color: "#3d3560",
                        }}
                      >
                        {habit.name}
                      </span>
                      {onEditHabit && (
                        <button
                          type="button"
                          onClick={() => onEditHabit(habit)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded shrink-0"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                  {colDates.map((d) => {
                    const log = getLog(habit.id, d);
                    const cellKey = `${habit.id}-${formatDateKey(d)}`;
                    const isPending = pendingLog === cellKey;
                    const isToday = isSameDay(d, today);
                    const isDone = log?.done === true;
                    const isNotDone = log !== undefined && log.done === false;
                    const isExpanded = expandedCell === cellKey;
                    const savedTime = log?.timeNote || "";

                    return (
                      <td
                        key={formatDateKey(d)}
                        className="p-0.5 text-center align-top"
                      >
                        <div
                          className={`flex flex-col items-center justify-center gap-0.5 ${
                            isToday ? "bg-purple-50 rounded-lg py-0.5" : ""
                          }`}
                        >
                          <div className="relative">
                            {isDone || isNotDone ? (
                              <button
                                type="button"
                                data-ocid={`habits.checkbox.${idx + 1}`}
                                onClick={() =>
                                  setExpandedCell(isExpanded ? null : cellKey)
                                }
                                disabled={isPending}
                                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white transition-all hover:opacity-80"
                                style={{
                                  backgroundColor: isDone
                                    ? "#22c55e"
                                    : "#ef4444",
                                }}
                              >
                                {isDone ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <X className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                data-ocid={`habits.checkbox.${idx + 1}`}
                                onClick={() =>
                                  setExpandedCell(isExpanded ? null : cellKey)
                                }
                                disabled={isPending}
                                className="w-7 h-7 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all"
                              >
                                <span className="text-gray-300 text-xs">·</span>
                              </button>
                            )}

                            {isExpanded && (
                              <div
                                className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex flex-col gap-2 bg-white rounded-xl shadow-xl border border-border p-2"
                                style={{ minWidth: "140px" }}
                              >
                                <input
                                  type="text"
                                  placeholder="Time (e.g. 7:00 AM)"
                                  value={
                                    timeNotes[cellKey] ?? log?.timeNote ?? ""
                                  }
                                  onChange={(e) =>
                                    setTimeNotes((prev) => ({
                                      ...prev,
                                      [cellKey]: e.target.value,
                                    }))
                                  }
                                  className="text-xs border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring bg-secondary w-full"
                                />
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setLog(habit, d, true)}
                                    disabled={isPending}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-all"
                                    title="Done"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLog(habit, d, false)}
                                    disabled={isPending}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-all"
                                    title="Not Done"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Show time below the status button */}
                          {savedTime && (
                            <span
                              className="text-[9px] font-semibold leading-tight"
                              style={{ color: habit.color }}
                            >
                              {savedTime}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-2 text-center">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {doneDays}/{colDates.length}
                    </span>
                  </td>
                  <td className="p-1">
                    <button
                      type="button"
                      data-ocid={`habits.delete_button.${idx + 1}`}
                      onClick={() => handleRemove(habit.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
