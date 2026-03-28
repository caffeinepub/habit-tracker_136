import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Calendar,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Calendar, label: "Calendar", id: "calendar" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
  { icon: Settings, label: "Settings", id: "settings" },
];

interface SidebarProps {
  userName: string;
  activeNav: string;
  onNavChange: (id: string) => void;
  onAddHabit: () => void;
  onShare: () => void;
  habitColors: { name: string; color: string }[];
}

export default function Sidebar({
  userName,
  activeNav,
  onNavChange,
  onAddHabit,
  onShare,
  habitColors,
}: SidebarProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    toast.success("Logged out successfully");
  };

  return (
    <aside
      className="w-[260px] shrink-0 h-screen sticky top-0 flex flex-col z-20"
      style={{
        background:
          "linear-gradient(180deg, #ffffff 0%, oklch(0.98 0.025 290) 100%)",
        boxShadow: "2px 0 20px 0 rgba(140, 120, 200, 0.12)",
      }}
    >
      {/* Brand */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
            style={{
              background: "linear-gradient(135deg, #C7B8EA 0%, #7c6fcd 100%)",
            }}
          >
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-foreground">
              Habit Tracker
            </h1>
            <p className="text-xs text-muted-foreground">Stay consistent ✨</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            data-ocid={`nav.${item.id}.link`}
            onClick={() => onNavChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeNav === item.id
                ? "text-white shadow-sm"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            }`}
            style={
              activeNav === item.id
                ? {
                    background:
                      "linear-gradient(135deg, #7c6fcd 0%, #a78bfa 100%)",
                    boxShadow: "0 2px 12px 0 rgba(124, 111, 205, 0.35)",
                  }
                : {}
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Add Habit */}
      <div className="px-4 pb-4">
        <Button
          type="button"
          data-ocid="sidebar.add_habit.primary_button"
          onClick={onAddHabit}
          className="w-full rounded-xl font-bold tracking-wide text-sm text-white border-0"
          style={{
            background: "linear-gradient(135deg, #7c6fcd 0%, #a78bfa 100%)",
            boxShadow: "0 2px 12px 0 rgba(124, 111, 205, 0.3)",
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          ADD HABIT +
        </Button>
      </div>

      <Separator />

      {/* Habit color legend */}
      {habitColors.length > 0 && (
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            My Habits
          </p>
          <div className="space-y-2">
            {habitColors.map((h) => (
              <div key={h.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: h.color }}
                />
                <span className="text-sm text-foreground truncate">
                  {h.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto">
        <Separator />
        <div className="p-4 space-y-2">
          <Button
            type="button"
            variant="outline"
            data-ocid="sidebar.share.secondary_button"
            onClick={onShare}
            className="w-full rounded-xl justify-start text-sm"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share My Tracker
          </Button>
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-medium text-foreground truncate">
              {userName || "User"}
            </span>
            <button
              type="button"
              data-ocid="sidebar.logout.button"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
