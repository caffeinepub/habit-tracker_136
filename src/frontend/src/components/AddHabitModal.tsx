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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddHabit } from "../hooks/useQueries";

const PRESET_COLORS = [
  { name: "Pink", value: "#FFB3C6" },
  { name: "Green", value: "#B5EAD7" },
  { name: "Purple", value: "#C7B8EA" },
  { name: "Peach", value: "#FFDAC1" },
  { name: "Yellow", value: "#FDFD96" },
  { name: "Blue", value: "#AEC6CF" },
  { name: "Coral", value: "#FFB7A5" },
];

interface AddHabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddHabitModal({
  open,
  onOpenChange,
}: AddHabitModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  const addHabit = useAddHabit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addHabit.mutateAsync({ name: name.trim(), color });
      toast.success("Habit added!");
      setName("");
      setColor(PRESET_COLORS[0].value);
      onOpenChange(false);
    } catch {
      toast.error("Failed to add habit");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-2xl max-w-sm"
        data-ocid="add_habit.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Add New Habit ✨
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="habit-name" className="font-semibold">
              Habit Name
            </Label>
            <Input
              id="habit-name"
              data-ocid="add_habit.input"
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
              data-ocid="add_habit.cancel_button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="add_habit.submit_button"
              disabled={!name.trim() || addHabit.isPending}
              className="rounded-xl bg-foreground text-primary-foreground hover:opacity-90"
            >
              {addHabit.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save Habit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
