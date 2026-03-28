import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Check, Copy, Loader2, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGenerateShareToken } from "../hooks/useQueries";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShareModal({ open, onOpenChange }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const generateToken = useGenerateShareToken();

  const handleGenerate = async () => {
    try {
      const token = await generateToken.mutateAsync();
      const origin = window.location.origin;
      const hash = window.location.href.includes("#") ? "#" : "";
      setShareUrl(`${origin}${hash}/share/${token}`);
    } catch {
      toast.error("Failed to generate share link");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied! 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm" data-ocid="share.dialog">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Your Tracker
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Generate a shareable link so others can see your habit progress.
        </p>
        {!shareUrl ? (
          <Button
            data-ocid="share.primary_button"
            onClick={handleGenerate}
            disabled={generateToken.isPending}
            className="rounded-xl bg-foreground text-primary-foreground hover:opacity-90"
          >
            {generateToken.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Share2 className="w-4 h-4 mr-2" />
            )}
            Generate Link
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="rounded-xl text-xs"
                data-ocid="share.input"
              />
              <Button
                size="icon"
                variant="outline"
                data-ocid="share.secondary_button"
                onClick={handleCopy}
                className="rounded-xl shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Anyone with this link can view your habits 👀
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
