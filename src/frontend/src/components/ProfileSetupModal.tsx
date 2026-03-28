import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

interface ProfileSetupModalProps {
  open: boolean;
}

export default function ProfileSetupModal({ open }: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const saveMutation = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await saveMutation.mutateAsync({ name: name.trim() });
      toast.success(`Welcome, ${name.trim()}! 🎉`);
    } catch {
      toast.error("Failed to save profile");
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="rounded-2xl max-w-sm"
        data-ocid="profile_setup.dialog"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome! 👋
          </DialogTitle>
        </DialogHeader>
        <p className="text-center text-muted-foreground text-sm">
          Let's set up your profile. What should we call you?
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="font-semibold">
              Your Name
            </Label>
            <Input
              id="profile-name"
              data-ocid="profile_setup.input"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            data-ocid="profile_setup.submit_button"
            disabled={!name.trim() || saveMutation.isPending}
            className="w-full rounded-xl bg-foreground text-primary-foreground hover:opacity-90"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Let's Go! 🚀
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
