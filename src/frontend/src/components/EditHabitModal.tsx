import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Habit } from "../backend.d";
import { useAddHabit, useRemoveHabit } from "../hooks/useQueries";

const PRESET_COLORS = [
  { name: "Pink", value: "#FFB3C6" },
  { name: "Green", value: "#B5EAD7" },
  { name: "Purple", value: "#C7B8EA" },
  { name: "Peach", value: "#FFDAC1" },
  { name: "Yellow", value: "#FDFD96" },
  { name: "Blue", value: "#AEC6CF" },
  { name: "Coral", value: "#FFB7A5" },
];

interface EditHabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
}

export default function EditHabitModal({
  open,
  onOpenChange,
  habit,
}: EditHabitModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  const [isSaving, setIsSaving] = useState(false);

  const removeHabit = useRemoveHabit();
  const addHabit = useAddHabit();

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setColor(habit.color);
    }
  }, [habit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habit || !name.trim()) return;
    setIsSaving(true);
    try {
      await removeHabit.mutateAsync(habit.id);
      await addHabit.mutateAsync({ name: name.trim(), color });
      toast.success("Habit updated!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update habit");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-2xl max-w-sm"
        data-ocid="edit_habit.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Habit ✏️</DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Editing a habit will reset its completion history.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-habit-name" className="font-semibold">
              Habit Name
            </Label>
            <Input
              id="edit-habit-name"
              data-ocid="edit_habit.input"
              placeholder="e.g. Morning Walk, Read 30 min..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Pick a Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.name}
                  onClick={() => setColor(c.value)}
                  className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    borderColor: color === c.value ? "#3d3560" : "transparent",
                    boxShadow:
                      color === c.value
                        ? "0 0 0 2px white, 0 0 0 4px #3d356066"
                        : "none",
                  }}
                />
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="edit_habit.cancel_button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="edit_habit.save_button"
              disabled={!name.trim() || isSaving}
              className="rounded-xl bg-foreground text-primary-foreground hover:opacity-90"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
