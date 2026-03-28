import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Menu,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Habit, UserProfile } from "../backend.d";
import AddHabitModal from "../components/AddHabitModal";
import AnalyticsView from "../components/AnalyticsView";
import DonutChart from "../components/DonutChart";
import EditHabitModal from "../components/EditHabitModal";
import HabitGrid from "../components/HabitGrid";
import ShareModal from "../components/ShareModal";
import Sidebar from "../components/Sidebar";
import {
  useGetCallerUserProfile,
  useGetHabits,
  useGetLogs,
  useRemoveHabit,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";
import {
  formatDateKey,
  formatDisplayDate,
  formatMonthYear,
  formatWeekRange,
  getGreeting,
  getMonthDates,
  getWeekDates,
} from "../utils/dateUtils";

type ViewMode = "day" | "week" | "month";

interface DashboardProps {
  userProfile: UserProfile;
}

export default function Dashboard({ userProfile }: DashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(new Date());
  const [addHabitOpen, setAddHabitOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [editHabitOpen, setEditHabitOpen] = useState(false);
  const today = useMemo(() => new Date(), []);

  // Settings state
  const [settingsName, setSettingsName] = useState("");
  const [settingsEditing, setSettingsEditing] = useState(false);
  const saveProfile = useSaveCallerUserProfile();
  const removeHabit = useRemoveHabit();
  const { data: callerProfile } = useGetCallerUserProfile();

  const { dates, startDate, endDate, rangeLabel } = useMemo(() => {
    let dates: Date[];
    let startDate: string;
    let endDate: string;
    let rangeLabel: string;

    if (viewMode === "day") {
      dates = [anchor];
      startDate = formatDateKey(anchor);
      endDate = formatDateKey(anchor);
      rangeLabel = formatDisplayDate(anchor);
    } else if (viewMode === "week") {
      dates = getWeekDates(anchor);
      startDate = formatDateKey(dates[0]);
      endDate = formatDateKey(dates[6]);
      rangeLabel = formatWeekRange(dates);
    } else {
      dates = getMonthDates(anchor);
      startDate = formatDateKey(dates[0]);
      endDate = formatDateKey(dates[dates.length - 1]);
      rangeLabel = formatMonthYear(anchor);
    }
    return { dates, startDate, endDate, rangeLabel };
  }, [viewMode, anchor]);

  const {
    data: habits = [],
    isLoading: habitsLoading,
    isError: habitsError,
  } = useGetHabits(true);
  const {
    data: logs = [],
    isLoading: logsLoading,
    isError: logsError,
  } = useGetLogs(startDate, endDate, true);
  const isLoading = habitsLoading || logsLoading;
  const isError = habitsError || logsError;

  const habitColors = habits.map((h) => ({ name: h.name, color: h.color }));

  const navigate = (dir: -1 | 1) => {
    const next = new Date(anchor);
    if (viewMode === "day") next.setDate(next.getDate() + dir);
    else if (viewMode === "week") next.setDate(next.getDate() + dir * 7);
    else next.setMonth(next.getMonth() + dir);
    setAnchor(next);
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditHabit(habit);
    setEditHabitOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!settingsName.trim()) return;
    try {
      await saveProfile.mutateAsync({ name: settingsName.trim() });
      toast.success("Profile updated!");
      setSettingsEditing(false);
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const handleDeleteHabitFromSettings = async (habitId: string) => {
    if (!confirm("Delete this habit and all its logs?")) return;
    try {
      await removeHabit.mutateAsync(habitId);
      toast.success("Habit deleted");
    } catch {
      toast.error("Failed to delete habit");
    }
  };

  const progressSection = viewMode !== "day" && habits.length > 0 && (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="bg-white rounded-3xl card-shadow p-6"
    >
      <h3 className="font-bold text-base mb-6 text-foreground">
        {viewMode === "week" ? "Weekly" : "Monthly"} Progress
      </h3>
      <div className="flex flex-wrap gap-8 justify-center">
        {habits.map((habit) => {
          const done = dates.filter((d) =>
            logs.find(
              (l) =>
                l.habitId === habit.id && l.date === formatDateKey(d) && l.done,
            ),
          ).length;
          const pct =
            dates.length > 0 ? Math.round((done / dates.length) * 100) : 0;
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
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Overall completion
          </span>
          <span className="text-lg font-bold text-foreground">
            {Math.round(
              (habits.reduce((acc, h) => {
                const done = dates.filter((d) =>
                  logs.find(
                    (l) =>
                      l.habitId === h.id &&
                      l.date === formatDateKey(d) &&
                      l.done,
                  ),
                ).length;
                return acc + done;
              }, 0) /
                Math.max(habits.length * dates.length, 1)) *
                100,
            )}
            %
          </span>
        </div>
      </div>
    </motion.div>
  );

  const isDashboard = activeNav === "dashboard" || activeNav === "calendar";

  return (
    <div className="flex min-h-screen gradient-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setSidebarOpen(false);
          }}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:sticky top-0 h-screen z-40 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar
          userName={userProfile.name}
          activeNav={activeNav}
          onNavChange={(id) => {
            setActiveNav(id);
            setSidebarOpen(false);
          }}
          onAddHabit={() => {
            setAddHabitOpen(true);
            setSidebarOpen(false);
          }}
          onShare={() => {
            setShareOpen(true);
            setSidebarOpen(false);
          }}
          habitColors={habitColors}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6">
        {/* Mobile topbar */}
        <div className="flex md:hidden items-center gap-3 mb-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-xl"
            onClick={() => setSidebarOpen(true)}
            data-ocid="dashboard.menu.button"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-bold text-lg">Habit Tracker</span>
          {sidebarOpen && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl ml-auto"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {activeNav === "analytics"
                ? "Analytics 📊"
                : activeNav === "settings"
                  ? "Settings ⚙️"
                  : `${getGreeting()}, ${userProfile.name}! 👋`}
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              {formatDisplayDate(today)}
            </p>
          </div>

          {/* View toggle — only on dashboard/calendar */}
          {isDashboard && (
            <div
              data-ocid="dashboard.view.tab"
              className="flex items-center bg-white rounded-xl p-1 card-shadow"
            >
              {(["day", "week", "month"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  data-ocid={`dashboard.${v}.tab`}
                  onClick={() => setViewMode(v)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                    viewMode === v
                      ? "bg-foreground text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Date navigation — only on dashboard */}
        {isDashboard && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <button
              type="button"
              data-ocid="dashboard.pagination_prev"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white card-shadow hover:bg-accent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {rangeLabel}
            </span>
            <button
              type="button"
              data-ocid="dashboard.pagination_next"
              onClick={() => navigate(1)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white card-shadow hover:bg-accent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              data-ocid="dashboard.today.button"
              onClick={() => setAnchor(new Date())}
              className="ml-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-white card-shadow text-muted-foreground hover:text-foreground transition-colors"
            >
              Today
            </button>
          </motion.div>
        )}

        {/* ── ANALYTICS VIEW ── */}
        {activeNav === "analytics" && (
          <AnalyticsView
            habits={habits}
            logs={logs}
            dates={dates}
            viewMode={viewMode}
          />
        )}

        {/* ── SETTINGS VIEW ── */}
        {activeNav === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
            data-ocid="settings.panel"
          >
            {/* Profile section */}
            <div className="bg-white rounded-3xl card-shadow p-6">
              <h3 className="font-bold text-base mb-4 text-foreground">
                👤 Profile
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #C7B8EA 0%, #AEC6CF 100%)",
                    }}
                  >
                    {(callerProfile?.name || userProfile.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {callerProfile?.name || userProfile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Habit Tracker Member
                    </p>
                  </div>
                </div>

                {settingsEditing ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor="settings-name"
                        className="text-sm font-medium"
                      >
                        Display Name
                      </Label>
                      <Input
                        id="settings-name"
                        data-ocid="settings.input"
                        value={settingsName}
                        onChange={(e) => setSettingsName(e.target.value)}
                        placeholder="Your name"
                        className="rounded-xl"
                      />
                    </div>
                    <Button
                      type="button"
                      data-ocid="settings.save_button"
                      onClick={handleSaveProfile}
                      disabled={saveProfile.isPending || !settingsName.trim()}
                      className="rounded-xl bg-foreground text-primary-foreground hover:opacity-90 mt-5"
                    >
                      {saveProfile.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      data-ocid="settings.cancel_button"
                      onClick={() => setSettingsEditing(false)}
                      className="rounded-xl mt-5"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    data-ocid="settings.edit_button"
                    onClick={() => {
                      setSettingsName(
                        callerProfile?.name || userProfile.name || "",
                      );
                      setSettingsEditing(true);
                    }}
                    className="rounded-xl"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Name
                  </Button>
                )}
              </div>
            </div>

            {/* Habits section */}
            <div className="bg-white rounded-3xl card-shadow p-6">
              <h3 className="font-bold text-base mb-4 text-foreground">
                ✨ My Habits
              </h3>
              {habits.length === 0 ? (
                <p
                  className="text-sm text-muted-foreground"
                  data-ocid="settings.habits.empty_state"
                >
                  No habits yet. Add your first habit!
                </p>
              ) : (
                <div className="space-y-3" data-ocid="settings.habits.list">
                  {habits.map((habit, idx) => (
                    <div
                      key={habit.id}
                      data-ocid={`settings.habits.item.${idx + 1}`}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-colors"
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: habit.color }}
                      />
                      <span className="flex-1 text-sm font-semibold text-foreground">
                        {habit.name}
                      </span>
                      <button
                        type="button"
                        data-ocid={`settings.habits.edit_button.${idx + 1}`}
                        onClick={() => handleOpenEdit(habit)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-accent"
                        title="Edit habit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        data-ocid={`settings.habits.delete_button.${idx + 1}`}
                        onClick={() => handleDeleteHabitFromSettings(habit.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        title="Delete habit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── DASHBOARD / CALENDAR VIEW ── */}
        {isDashboard && (
          <>
            {/* Habit grid */}
            <motion.div
              key={`${viewMode}-${startDate}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl card-shadow p-4 md:p-6"
            >
              {isLoading ? (
                <div
                  data-ocid="dashboard.loading_state"
                  className="flex items-center justify-center py-20"
                >
                  <div className="w-10 h-10 rounded-full border-4 border-accent border-t-foreground animate-spin" />
                </div>
              ) : isError ? (
                <div
                  data-ocid="dashboard.error_state"
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="text-4xl mb-3">⚠️</div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Could not load habits
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please refresh the page and try again.
                  </p>
                </div>
              ) : (
                <HabitGrid
                  habits={habits}
                  logs={logs}
                  viewMode={viewMode}
                  dates={dates}
                  today={today}
                  onEditHabit={handleOpenEdit}
                />
              )}
            </motion.div>

            {progressSection}
          </>
        )}

        <footer className="text-center pt-4 pb-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </main>

      <AddHabitModal open={addHabitOpen} onOpenChange={setAddHabitOpen} />
      <ShareModal open={shareOpen} onOpenChange={setShareOpen} />
      <EditHabitModal
        open={editHabitOpen}
        onOpenChange={setEditHabitOpen}
        habit={editHabit}
      />
    </div>
  );
}
