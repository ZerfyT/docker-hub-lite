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
import { PlayIcon, PlusIcon, TrashIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RunContainerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultImage?: string;
}

interface PortRow {
  hostPort: string;
  containerPort: string;
  protocol: "tcp" | "udp";
}

interface EnvRow {
  key: string;
  value: string;
}

interface VolumeRow {
  hostPath: string;
  containerPath: string;
}

export function RunContainerModal({
  open,
  onOpenChange,
  defaultImage = "",
}: RunContainerModalProps) {
  const images = useStore((s) => s.images);
  const fetchContainers = useStore((s) => s.fetchContainers);
  const fetchImages = useStore((s) => s.fetchImages);
  const [image, setImage] = useState(defaultImage);
  const [name, setName] = useState("");
  const [restartPolicy, setRestartPolicy] = useState("unless-stopped");
  const [ports, setPorts] = useState<PortRow[]>([]);
  const [envVars, setEnvVars] = useState<EnvRow[]>([]);
  const [volumes, setVolumes] = useState<VolumeRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync defaultImage when changed
  useState(() => {
    if (defaultImage) setImage(defaultImage);
  });

  const addPort = () => {
    setPorts((prev) => [...prev, { hostPort: "", containerPort: "", protocol: "tcp" }]);
  };

  const removePort = (index: number) => {
    setPorts((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePort = (index: number, field: keyof PortRow, value: string) => {
    setPorts((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addEnv = () => {
    setEnvVars((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeEnv = (index: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEnv = (index: number, field: keyof EnvRow, value: string) => {
    setEnvVars((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addVolume = () => {
    setVolumes((prev) => [...prev, { hostPath: "", containerPath: "" }]);
  };

  const removeVolume = (index: number) => {
    setVolumes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVolume = (index: number, field: keyof VolumeRow, value: string) => {
    setVolumes((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleRun = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!image.trim()) {
      toast.error("Please enter or select an image");
      return;
    }

    setLoading(true);

    try {
      const validPorts = ports
        .filter((p) => p.hostPort && p.containerPort)
        .map((p) => ({
          host_port: parseInt(p.hostPort, 10),
          container_port: parseInt(p.containerPort, 10),
          protocol: p.protocol,
        }));

      const validEnv = envVars
        .filter((e) => e.key.trim())
        .map((e) => `${e.key.trim()}=${e.value}`);

      const validVolumes = volumes
        .filter((v) => v.hostPath && v.containerPath)
        .map((v) => `${v.hostPath}:${v.containerPath}:rw`);

      const containerId = await invoke<string>("create_and_start_container", {
        args: {
          name: name.trim() || null,
          image: image.trim(),
          ports: validPorts.length ? validPorts : null,
          env: validEnv.length ? validEnv : null,
          volumes: validVolumes.length ? validVolumes : null,
          restart_policy: restartPolicy,
        },
      });

      toast.success(`Container started: ${containerId.substring(0, 12)}`);
      await fetchContainers();
      await fetchImages();
      onOpenChange(false);
      // Reset form
      setName("");
      setPorts([]);
      setEnvVars([]);
      setVolumes([]);
    } catch (error) {
      console.error("Failed to run container:", error);
      toast.error(`Error launching container: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[620px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <form onSubmit={handleRun} className="flex flex-col h-full overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <PlayIcon className="h-5 w-5 text-primary" weight="fill" />
              Run New Container
            </DialogTitle>
            <DialogDescription>
              Configure and start a new container from a local or remote image.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-2 overflow-y-auto max-h-[60vh]">
            <div className="space-y-5 pb-6">
              {/* Image & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Image Name</Label>
                  <Input
                    id="image"
                    placeholder="e.g. redis:alpine, nginx"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    list="available-images"
                    required
                  />
                  <datalist id="available-images">
                    {images.flatMap((img) =>
                      (img.RepoTags || []).filter((tag) => !tag.includes("<none>")).map((t) => (
                        <option key={t} value={t} />
                      ))
                    )}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="container-name">Container Name (Optional)</Label>
                  <Input
                    id="container-name"
                    placeholder="e.g. my-app-db"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Restart Policy */}
              <div className="space-y-2">
                <Label>Restart Policy</Label>
                <Select value={restartPolicy} onValueChange={setRestartPolicy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select restart policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unless-stopped">Unless Stopped (Recommended)</SelectItem>
                    <SelectItem value="always">Always</SelectItem>
                    <SelectItem value="on-failure">On Failure</SelectItem>
                    <SelectItem value="no">Never (No restart)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Port Mappings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Port Forwarding</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={addPort}
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Add Port
                  </Button>
                </div>
                {ports.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No ports exposed.</p>
                ) : (
                  <div className="space-y-2">
                    {ports.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          placeholder="Host Port (e.g. 8080)"
                          type="number"
                          className="h-8 text-xs font-mono"
                          value={p.hostPort}
                          onChange={(e) => updatePort(i, "hostPort", e.target.value)}
                        />
                        <span className="text-muted-foreground">&rarr;</span>
                        <Input
                          placeholder="Container Port (e.g. 80)"
                          type="number"
                          className="h-8 text-xs font-mono"
                          value={p.containerPort}
                          onChange={(e) => updatePort(i, "containerPort", e.target.value)}
                        />
                        <Select
                          value={p.protocol}
                          onValueChange={(val: "tcp" | "udp") => updatePort(i, "protocol", val)}
                        >
                          <SelectTrigger className="h-8 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tcp">TCP</SelectItem>
                            <SelectItem value="udp">UDP</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removePort(i)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Environment Variables */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Environment Variables</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={addEnv}
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Add Variable
                  </Button>
                </div>
                {envVars.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No custom environment variables.</p>
                ) : (
                  <div className="space-y-2">
                    {envVars.map((env, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          placeholder="KEY (e.g. POSTGRES_PASSWORD)"
                          className="h-8 text-xs font-mono"
                          value={env.key}
                          onChange={(e) => updateEnv(i, "key", e.target.value)}
                        />
                        <span className="text-muted-foreground">=</span>
                        <Input
                          placeholder="Value"
                          className="h-8 text-xs font-mono"
                          value={env.value}
                          onChange={(e) => updateEnv(i, "value", e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removeEnv(i)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Volumes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Volume / Bind Mounts</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={addVolume}
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Add Mount
                  </Button>
                </div>
                {volumes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No persistent volume mounts.</p>
                ) : (
                  <div className="space-y-2">
                    {volumes.map((vol, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          placeholder="Host path or named volume"
                          className="h-8 text-xs font-mono"
                          value={vol.hostPath}
                          onChange={(e) => updateVolume(i, "hostPath", e.target.value)}
                        />
                        <span className="text-muted-foreground">&rarr;</span>
                        <Input
                          placeholder="Container path (e.g. /data)"
                          className="h-8 text-xs font-mono"
                          value={vol.containerPath}
                          onChange={(e) => updateVolume(i, "containerPath", e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removeVolume(i)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 pt-3 border-t bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !image.trim()} className="gap-2">
              {loading && <SpinnerGapIcon className="h-4 w-4 animate-spin" />}
              {loading ? "Starting..." : "Run Container"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
