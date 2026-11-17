import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HardDrivesIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";

interface CreateVolumeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateVolumeModal({ open, onOpenChange }: CreateVolumeModalProps) {
  const fetchVolumes = useStore((s) => s.fetchVolumes);
  const [name, setName] = useState("");
  const [driver, setDriver] = useState("local");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await invoke("create_volume", {
        name: name.trim(),
        driver: driver.trim() || "local",
      });
      toast.success(`Volume "${name}" created!`);
      await fetchVolumes();
      setName("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create volume:", error);
      toast.error(`Failed to create volume: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardDrivesIcon className="h-5 w-5 text-primary" />
              Create Docker Volume
            </DialogTitle>
            <DialogDescription>
              Create a new persistent volume for container storage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vol-name">Volume Name</Label>
              <Input
                id="vol-name"
                placeholder="e.g. postgres_data or app_cache"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vol-driver">Driver</Label>
              <Input
                id="vol-driver"
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                disabled={loading}
                placeholder="local"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()} className="gap-2">
              {loading && <SpinnerGapIcon className="h-4 w-4 animate-spin" />}
              {loading ? "Creating..." : "Create Volume"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
