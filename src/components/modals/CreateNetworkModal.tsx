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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NetworkIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";

interface CreateNetworkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateNetworkModal({ open, onOpenChange }: CreateNetworkModalProps) {
  const fetchNetworks = useStore((s) => s.fetchNetworks);
  const [name, setName] = useState("");
  const [driver, setDriver] = useState("bridge");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await invoke("create_network", {
        name: name.trim(),
        driver: driver.trim() || "bridge",
      });
      toast.success(`Network "${name}" created!`);
      await fetchNetworks();
      setName("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create network:", error);
      toast.error(`Failed to create network: ${error}`);
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
              <NetworkIcon className="h-5 w-5 text-primary" />
              Create Docker Network
            </DialogTitle>
            <DialogDescription>
              Create an isolated network to connect your containers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="net-name">Network Name</Label>
              <Input
                id="net-name"
                placeholder="e.g. backend-net or custom-bridge"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="net-driver">Driver</Label>
              <Select value={driver} onValueChange={setDriver} disabled={loading}>
                <SelectTrigger id="net-driver">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bridge">bridge (Standard local bridge)</SelectItem>
                  <SelectItem value="host">host (Use host network directly)</SelectItem>
                  <SelectItem value="overlay">overlay (Multi-host overlay)</SelectItem>
                  <SelectItem value="macvlan">macvlan (Assign MAC address)</SelectItem>
                </SelectContent>
              </Select>
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
              {loading ? "Creating..." : "Create Network"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
