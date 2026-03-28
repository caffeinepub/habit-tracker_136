import { Activity, Calendar, Check } from "lucide-react";
import { motion } from "motion/react";
import type { Habit, HabitLog } from "../backend.d";
import DonutChart from "../components/DonutChart";
import { useGetSharedTracker } from "../hooks/useQueries";
import {
  formatDateKey,
  getMonthDates,
  isSameDay,
  shortDay,
} from "../utils/dateUtils";

interface SharePageProps {
  token: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function SharedHabitGrid({
  habits,
  logs,
}: { habits: Habit[]; logs: HabitLog[] }) {
  const today = new Date();
  const monthDates = getMonthDates(today);

  const getLog = (habitId: string, date: Date) =>
    logs.find((l) => l.habitId === habitId && l.date === formatDateKey(date));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth: "900px" }}>
        <thead>
          <tr>
            <th className="text-left p-3 text-sm font-semibold text-muted-foreground w-40 sticky left-0 bg-white z-10">
              Habit
            </th>
            {monthDates.map((d) => {
              const isToday = isSameDay(d, today);
              return (
                <th
                  key={formatDateKey(d)}
                  className={`text-center p-1 text-xs font-semibold ${
                    isToday ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{shortDay(d)}</span>
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
            <th className="text-center p-2 text-xs text-muted-foreground">
              Done
            </th>
          </tr>
        </thead>
        <tbody>
          {habits.map((habit) => {
            const doneDays = monthDates.filter(
              (d) => getLog(habit.id, d)?.done,
            ).length;
            return (
              <tr key={habit.id} className="border-t border-border/50">
                <td className="p-3 sticky left-0 bg-white z-10">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: hexToRgba(habit.color, 0.3),
                      color: "#3d3560",
                    }}
                  >
                    {habit.name}
                  </span>
                </td>
                {monthDates.map((d) => {
                  const log = getLog(habit.id, d);
                  return (
                    <td key={formatDateKey(d)} className="p-1 text-center">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center mx-auto"
                        style={{
                          backgroundColor: log?.done ? habit.color : "#f5f3fc",
                        }}
                      >
                        {log?.done && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </td>
                  );
                })}
                <td className="p-2 text-center text-xs font-semibold text-muted-foreground">
                  {doneDays}/{monthDates.length}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function SharePage({ token }: SharePageProps) {
  const { data, isLoading, isError } = useGetSharedTracker(token);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div data-ocid="share_page.loading_state" className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-accent border-t-foreground animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tracker...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div
          data-ocid="share_page.error_state"
          className="text-center bg-white rounded-3xl card-shadow p-10 max-w-sm"
        >
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold mb-2">Tracker Not Found</h2>
          <p className="text-muted-foreground text-sm">
            This share link may have expired or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const { habits, logs } = data;
  const today = new Date();
  const monthDates = getMonthDates(today);

  return (
    <div className="min-h-screen gradient-bg">
      <header className="bg-white sidebar-shadow sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #C7B8EA 0%, #AEC6CF 100%)",
            }}
          >
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base">Habit Tracker</h1>
            <p className="text-xs text-muted-foreground">
              Shared view — read only
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold">
              {today.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {habits.length} habits tracked
          </p>
        </motion.div>

        {habits.length === 0 ? (
          <div data-ocid="share_page.empty_state" className="text-center py-20">
            <div className="text-5xl mb-4">🌱</div>
            <p className="text-muted-foreground">No habits to show yet.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl card-shadow p-6">
              <SharedHabitGrid habits={habits} logs={logs} />
            </div>
            <div className="bg-white rounded-3xl card-shadow p-6">
              <h3 className="font-bold text-base mb-6">Monthly Progress</h3>
              <div className="flex flex-wrap gap-8 justify-center">
                {habits.map((habit) => {
                  const done = monthDates.filter((d) =>
                    logs.find(
                      (l) =>
                        l.habitId === habit.id &&
                        l.date === formatDateKey(d) &&
                        l.done,
                    ),
                  ).length;
                  const pct = Math.round((done / monthDates.length) * 100);
                  return (
                    <DonutChart
                      key={habit.id}
                      percentage={pct}
                      color={habit.color}
                      size={90}
                      label={habit.name}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="text-center py-6">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
