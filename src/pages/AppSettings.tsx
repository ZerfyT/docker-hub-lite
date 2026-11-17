import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GearIcon,
  MoonIcon,
  SunIcon,
  ArrowsClockwiseIcon,
  BroomIcon,
  ShieldWarningIcon,
  CodeIcon,
  TerminalWindowIcon,
  QuestionIcon,
  InfoIcon,
  CopyIcon,
  CheckIcon,
  HardDrivesIcon,
  CpuIcon,
  PulseIcon,
  KeyboardIcon,
  SlidersHorizontalIcon,
  StackIcon,
  BookOpenIcon,
  SpinnerGapIcon,
  CubeIcon,
  ShareNetworkIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PruneConfirmation {
  target: "image" | "container" | "volume" | "builder" | "network" | "system";
  all?: boolean;
  volumes?: boolean;
  title: string;
  description: string;
  command: string;
  warningNotice?: string;
}

export function AppSettings() {
  const navigate = useNavigate();
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const isPolling = useStore((s) => s.isPolling);
  const setIsPolling = useStore((s) => s.setIsPolling);
  const pollingInterval = useStore((s) => s.pollingInterval);
  const setPollingInterval = useStore((s) => s.setPollingInterval);
  const enableTelemetry = useStore((s) => s.enableTelemetry);
  const setEnableTelemetry = useStore((s) => s.setEnableTelemetry);
  const confirmDestructive = useStore((s) => s.confirmDestructive);
  const setConfirmDestructive = useStore((s) => s.setConfirmDestructive);
  const containerShell = useStore((s) => s.containerShell);
  const setContainerShell = useStore((s) => s.setContainerShell);
  const defaultLogTail = useStore((s) => s.defaultLogTail);
  const setDefaultLogTail = useStore((s) => s.setDefaultLogTail);
  const systemPrune = useStore((s) => s.systemPrune);
  const executeCustomPrune = useStore((s) => s.executeCustomPrune);
  const daemonJson = useStore((s) => s.daemonJson);
  const daemonJsonError = useStore((s) => s.daemonJsonError);
  const fetchDaemonJson = useStore((s) => s.fetchDaemonJson);
  const editDaemonJsonExternal = useStore((s) => s.editDaemonJsonExternal);
  const dockerState = useStore((s) => s.dockerState);
  const dockerStateError = useStore((s) => s.dockerStateError);
  const systemInfo = useStore((s) => s.systemInfo);
  const systemDf = useStore((s) => s.systemDf);
  const fetchFastData = useStore((s) => s.fetchFastData);
  const fetchSystemInfo = useStore((s) => s.fetchSystemInfo);
  const fetchSystemDf = useStore((s) => s.fetchSystemDf);

  const [activeTab, setActiveTab] = useState<"general" | "engine" | "storage" | "tools" | "help">("general");
  const [autoStart, setAutoStart] = useState(false);
  const [copiedDiag, setCopiedDiag] = useState(false);
  const [copiedDaemonJson, setCopiedDaemonJson] = useState(false);

  // Unified Targeted Resource Prune Confirmation State
  const [activeConfirmation, setActiveConfirmation] = useState<PruneConfirmation | null>(null);
  const [isExecutingPrune, setIsExecutingPrune] = useState(false);
  const [pruneOutput, setPruneOutput] = useState<string | null>(null);
  const [copiedOutput, setCopiedOutput] = useState(false);

  useEffect(() => {
    fetchDaemonJson();
    const checkAutostart = async () => {
      try {
        setAutoStart(await isEnabled());
      } catch (e) {
        console.error("Failed to check autostart", e);
      }
    };
    checkAutostart();
  }, [fetchDaemonJson]);

  const toggleAutoStart = async (checked: boolean) => {
    try {
      if (checked) {
        await enable();
      } else {
        await disable();
      }
      setAutoStart(checked);
      toast.success(checked ? "Launch on startup enabled" : "Launch on startup disabled");
    } catch (e) {
      toast.error(`Failed to change auto-start setting: ${e}`);
    }
  };

  const handleConfirmPrune = async () => {
    if (!activeConfirmation) return;
    setIsExecutingPrune(true);
    setPruneOutput(null);

    try {
      let output: string;
      if (activeConfirmation.target === "system") {
        output = await systemPrune();
      } else {
        output = await executeCustomPrune({
          target: activeConfirmation.target,
          all: !!activeConfirmation.all,
          volumes: !!activeConfirmation.volumes,
        });
      }
      setPruneOutput(output);
      toast.success(`${activeConfirmation.title} completed`);
      await Promise.allSettled([fetchFastData(), fetchSystemInfo(), fetchSystemDf()]);
    } catch (e: any) {
      setPruneOutput(`Error executing prune:\n${e}`);
      toast.error(`Prune failed: ${e}`);
    } finally {
      setIsExecutingPrune(false);
      setActiveConfirmation(null);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const totalImageSize = systemDf?.LayersSize || 0;
  const totalVolumeSize = systemDf?.Volumes?.reduce((acc: number, v: any) => acc + (v.UsageData?.Size || 0), 0) || 0;
  const buildCacheSize = systemDf?.BuildCache?.reduce((acc: number, b: any) => acc + (b.Size || 0), 0) || 0;
  const totalReclaimable =
    (systemDf?.Images?.filter((img: any) => (img.Containers || 0) === 0)?.reduce((acc: number, img: any) => acc + (img.Size || 0), 0) || 0) +
    (systemDf?.Volumes?.filter((v: any) => v.UsageData?.RefCount === 0)?.reduce((acc: number, v: any) => acc + (v.UsageData?.Size || 0), 0) || 0) +
    (systemDf?.BuildCache?.filter((b: any) => !b.InUse)?.reduce((acc: number, b: any) => acc + (b.Size || 0), 0) || 0);

  const generateDiagnosticReport = () => {
    return [
      `# Docker Lite Diagnostic Report`,
      `Generated: ${new Date().toISOString()}`,
      ``,
      `## Engine Status`,
      `- State: ${dockerState || "Unknown"}`,
      `- Error Notice: ${dockerStateError || "None"}`,
      `- Docker Server Version: ${systemInfo?.server_version || "N/A"}`,
      `- Docker Root Dir: ${systemInfo?.docker_root_dir || "/var/lib/docker"}`,
      `- Storage Driver: ${systemInfo?.driver || "N/A"}`,
      ``,
      `## Host Environment`,
      `- OS: ${systemInfo?.operating_system || "Linux"}`,
      `- Kernel Version: ${systemInfo?.kernel_version || "N/A"}`,
      `- CPU Cores: ${systemInfo?.ncpu || "N/A"}`,
      `- Total Memory: ${systemInfo?.mem_total ? (systemInfo.mem_total / (1024 * 1024 * 1024)).toFixed(2) + " GB" : "N/A"}`,
      ``,
      `## Application Settings`,
      `- Color Scheme: ${mode}`,
      `- Background Polling: ${isPolling ? `Active (${pollingInterval / 1000}s)` : "Disabled"}`,
      `- Host Telemetry: ${enableTelemetry ? "Active (1s interval)" : "Paused"}`,
      `- Destructive Confirmation: ${confirmDestructive ? "Enabled" : "Disabled"}`,
      `- Default Container Shell: ${containerShell}`,
      `- Default Log Tail: ${defaultLogTail} lines`,
      `- Auto-Start on Boot: ${autoStart ? "Enabled" : "Disabled"}`,
    ].join("\n");
  };

  const copyDiagnostics = () => {
    navigator.clipboard.writeText(generateDiagnosticReport());
    setCopiedDiag(true);
    toast.success("Diagnostic report copied to clipboard!");
    setTimeout(() => setCopiedDiag(false), 2000);
  };

  const copyDaemonJson = () => {
    if (!daemonJson) return;
    navigator.clipboard.writeText(daemonJson);
    setCopiedDaemonJson(true);
    toast.success("daemon.json copied to clipboard!");
    setTimeout(() => setCopiedDaemonJson(false), 2000);
  };

  const tabs = [
    { id: "general", label: "General & Appearance", icon: GearIcon },
    { id: "engine", label: "Docker Daemon", icon: CodeIcon },
    { id: "storage", label: "Storage & Cleanup", icon: HardDrivesIcon },
    { id: "tools", label: "Developer Tools", icon: TerminalWindowIcon },
    { id: "help", label: "Help & Diagnostics", icon: QuestionIcon },
  ] as const;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <SlidersHorizontalIcon className="h-6 w-6 text-primary" weight="fill" />
            Application & System Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure your Docker Lite workspace preferences, daemon integrations, resource management, and help resources.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`font-mono text-xs px-2.5 py-1 ${
              dockerState === "Running"
                ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                : "border-destructive/30 text-destructive bg-destructive/10"
            }`}
          >
            Engine: {dockerState || "Offline"}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 border-border/70">
            v0.2.0
          </Badge>
        </div>
      </div>

      {/* Top Telemetry Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Engine Health
          </span>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span
              className={`w-2 h-2 rounded-full ${
                dockerState === "Running" ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span>{dockerState === "Running" ? "Active & Healthy" : "Disconnected"}</span>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground truncate">
            {systemInfo?.server_version ? `v${systemInfo.server_version}` : "Daemon unreachable"}
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Polling Frequency
          </span>
          <div className="text-sm font-semibold font-mono text-foreground">
            {isPolling ? `${pollingInterval / 1000}s interval` : "Paused"}
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            {isPolling ? "Dynamic telemetry enabled" : "Manual refresh only"}
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Reclaimable Cache
          </span>
          <div className="text-sm font-semibold font-mono text-foreground truncate">
            {formatBytes(totalReclaimable)}
          </div>
          <p className="text-[10px] text-muted-foreground truncate">Dangling images & volumes</p>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Active Theme
          </span>
          <div className="text-sm font-semibold text-foreground capitalize flex items-center gap-1.5">
            {mode === "dark" ? <MoonIcon className="h-4 w-4 text-primary" /> : <SunIcon className="h-4 w-4 text-amber-500" />}
            <span>{mode} Mode</span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">Ergonomic OKLCH palette</p>
        </div>
      </div>

      {/* Accessible Segmented Tab Bar */}
      <div
        role="tablist"
        aria-label="Settings categories"
        className="flex items-center gap-1.5 p-1 bg-muted/40 backdrop-blur-xs rounded-xl border border-border/70 overflow-x-auto max-w-full"
      >
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all select-none ${
                isSelected
                  ? "bg-background text-foreground shadow-xs border border-border/60 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} weight={isSelected ? "fill" : "regular"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL & APPEARANCE */}
      <div
        role="tabpanel"
        id="panel-general"
        aria-labelledby="tab-general"
        tabIndex={0}
        hidden={activeTab !== "general"}
        className="space-y-6 focus-visible:outline-none"
      >
        {/* Appearance Settings */}
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden">
          <div className="p-6 pb-4 border-b border-border/50">
            <h3 className="font-semibold text-base leading-none text-foreground flex items-center gap-2">
              <SunIcon className="h-4 w-4 text-primary" weight="fill" />
              Theme & Presentation
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5">
              Customize the visual ergonomics of Docker Lite. Designed to reduce eye strain during extended development sessions.
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Toggle between high-contrast Dark theme and gentle, glare-free Light theme.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={mode === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("light")}
                  className="h-8 gap-1.5 text-xs font-medium"
                >
                  <SunIcon className="h-3.5 w-3.5" />
                  Light
                </Button>
                <Button
                  variant={mode === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("dark")}
                  className="h-8 gap-1.5 text-xs font-medium"
                >
                  <MoonIcon className="h-3.5 w-3.5" />
                  Dark
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/40">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Launch on System Startup</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically start Docker Lite in the background when logging into your desktop session.
                </p>
              </div>
              <Switch checked={autoStart} onCheckedChange={toggleAutoStart} />
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/40">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Continuous Host Resource Telemetry</Label>
                <p className="text-xs text-muted-foreground">
                  Sample host hardware CPU and memory every 1s for uninterrupted resource telemetry across page navigation.
                </p>
              </div>
              <Switch checked={enableTelemetry} onCheckedChange={setEnableTelemetry} />
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/40">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Safety Confirmation on Destructive Actions</Label>
                <p className="text-xs text-muted-foreground">
                  Require explicit confirmation before permanently removing containers, images, volumes, or networks.
                </p>
              </div>
              <Switch checked={confirmDestructive} onCheckedChange={setConfirmDestructive} />
            </div>
          </div>
        </div>
      </div>

      {/* TAB 2: DOCKER ENGINE & DAEMON */}
      <div
        role="tabpanel"
        id="panel-engine"
        aria-labelledby="tab-engine"
        tabIndex={0}
        hidden={activeTab !== "engine"}
        className="space-y-6 focus-visible:outline-none"
      >
        {/* Polling & Engine Sync */}
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden">
          <div className="p-6 pb-4 border-b border-border/50">
            <h3 className="font-semibold text-base leading-none text-foreground flex items-center gap-2">
              <ArrowsClockwiseIcon className="h-4 w-4 text-primary" weight="fill" />
              Engine Synchronization & Polling
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5">
              Control background polling rates and real-time state synchronization with the Docker daemon.
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Background Auto-Refresh</Label>
                <p className="text-xs text-muted-foreground">
                  Periodically poll the local Docker daemon for container lifecycle changes, status shifts, and resource statistics.
                </p>
              </div>
              <Switch checked={isPolling} onCheckedChange={setIsPolling} />
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/40">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Polling Frequency</Label>
                <p className="text-xs text-muted-foreground">
                  Adjust how frequently state is polled. Faster rates give instant updates, while slower rates save battery.
                </p>
              </div>
              <Select
                value={pollingInterval.toString()}
                onValueChange={(val) => setPollingInterval(parseInt(val, 10))}
                disabled={!isPolling}
              >
                <SelectTrigger className="w-52 h-9 text-xs rounded-lg border-border/70 bg-background">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/70">
                  <SelectItem value="2000" className="text-xs">2 seconds (High Precision)</SelectItem>
                  <SelectItem value="4000" className="text-xs">4 seconds (Balanced - Default)</SelectItem>
                  <SelectItem value="10000" className="text-xs">10 seconds (Battery Saver)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* daemon.json Inspector */}
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden">
          <div className="p-6 pb-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-base leading-none text-foreground flex items-center gap-2">
                <CodeIcon className="h-4 w-4 text-primary" weight="fill" />
                Daemon Configuration File (daemon.json)
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5">
                Engine configuration located at <code>/etc/docker/daemon.json</code> (Linux) or host engine settings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyDaemonJson}
                disabled={!daemonJson}
                className="h-8 gap-1.5 text-xs rounded-lg"
              >
                {copiedDaemonJson ? <CheckIcon className="h-3.5 w-3.5 text-emerald-500" /> : <CopyIcon className="h-3.5 w-3.5" />}
                Copy JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await editDaemonJsonExternal();
                    toast.info("Opened external terminal to edit daemon.json");
                  } catch (e) {
                    toast.error(`Failed to open terminal: ${e}`);
                  }
                }}
                className="h-8 gap-1.5 text-xs rounded-lg"
              >
                <TerminalWindowIcon className="h-3.5 w-3.5" />
                Edit Externally
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-muted/30 border border-border/60 rounded-xl overflow-hidden">
              {daemonJsonError ? (
                <div className="p-4 flex items-start gap-3 text-destructive bg-destructive/5">
                  <ShieldWarningIcon size={20} className="mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">Notice: Access Restriction or Missing Config</h4>
                    <p className="text-xs mt-1 opacity-90">{daemonJsonError}</p>
                    <p className="text-xs mt-2 text-muted-foreground">
                      Accessing <code>/etc/docker/daemon.json</code> typically requires elevated root/administrator privileges.
                      Click <strong>Edit Externally</strong> to open a sudo prompt in your preferred terminal emulator.
                    </p>
                  </div>
                </div>
              ) : (
                <pre className="p-4 text-xs font-mono overflow-auto max-h-[260px] text-muted-foreground leading-relaxed">
                  {daemonJson || "Loading daemon configuration..."}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Host Limits Advisory */}
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden">
          <div className="p-6 pb-4 border-b border-border/50">
            <h3 className="font-semibold text-base leading-none text-foreground flex items-center gap-2">
              <CpuIcon className="h-4 w-4 text-primary" weight="fill" />
              Engine Resource Allocations
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5">CPU cores, memory ceiling, swap partitions, and virtual disk size.</p>
          </div>
          <div className="p-6">
            <div className="bg-muted/40 p-4 rounded-xl border border-border/60 text-xs text-muted-foreground space-y-2">
              <p>
                <strong>Virtualization Host Governance:</strong> Global hardware limits for the Docker daemon (such as maximum CPU cores, memory limits, and swap) are governed by your host operating system and virtualization provider (e.g. systemd limits, WSL2 <code>.wslconfig</code>, Colima, or Docker Desktop).
              </p>
              <p>
                To view allocated hardware limits in real-time, inspect the{" "}
                <button
                  type="button"
                  onClick={() => navigate("/system-info")}
                  className="text-primary hover:underline font-semibold"
                >
                  System Info Inspector
                </button>{" "}
                or use your host virtualization manager to tune CPU core assignment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 3: STORAGE & CLEANUP */}
      <div
        role="tabpanel"
        id="panel-storage"
        aria-labelledby="tab-storage"
        tabIndex={0}
        hidden={activeTab !== "storage"}
        className="space-y-6 focus-visible:outline-none"
      >
        {/* Storage Allocation Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image Layers</span>
              <StackIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight text-foreground">
              {formatBytes(totalImageSize)}
            </div>
            <p className="text-xs text-muted-foreground">{systemDf?.Images?.length || 0} cached images</p>
          </div>

          <div className="p-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Local Volumes</span>
              <HardDrivesIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight text-foreground">
              {formatBytes(totalVolumeSize)}
            </div>
            <p className="text-xs text-muted-foreground">{systemDf?.Volumes?.length || 0} active/detached volumes</p>
          </div>

          <div className="p-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Build Cache</span>
              <BroomIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight text-foreground">
              {formatBytes(buildCacheSize)}
            </div>
            <p className="text-xs text-muted-foreground">{systemDf?.BuildCache?.length || 0} build stages</p>
          </div>

          <div className="p-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reclaimable Cache</span>
              <TrashIcon className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatBytes(totalReclaimable)}
            </div>
            <p className="text-xs text-muted-foreground">Unreferenced space</p>
          </div>
        </div>

        {/* TARGETED RESOURCE CLEANUPS WITH CONFIRMATION MODALS */}
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden">
          <div className="p-6 pb-4 border-b border-border/50">
            <h3 className="font-semibold text-base leading-none text-foreground flex items-center gap-2">
              <BroomIcon className="h-4 w-4 text-primary" weight="fill" />
              Targeted Resource Cleanups
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5">
              Execute safe, isolated cleanup operations targeted specifically at individual resource types. Every action requires deliberate confirmation.
            </p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Clean Images */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <StackIcon className="h-4 w-4" weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Clean Only Images</h4>
                    <p className="text-[11px] text-muted-foreground font-mono">docker image prune</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Remove dangling untagged layers or all unreferenced images not associated with running containers.
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isExecutingPrune}
                    onClick={() => setActiveConfirmation({
                      target: "image",
                      all: false,
                      title: "Prune Dangling Images?",
                      description: "This will remove all untagged, dangling intermediate image layers from local cache.",
                      warningNotice: "Tagged images and images used by existing containers will not be affected.",
                      command: "docker image prune -f",
                    })}
                    className="flex-1 text-xs h-8"
                    title="Prune dangling untagged images only"
                  >
                    Dangling Only
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isExecutingPrune}
                    onClick={() => setActiveConfirmation({
                      target: "image",
                      all: true,
                      title: "Prune All Unused Images?",
                      description: "This will remove all images that are not actively associated with at least one existing container.",
                      warningNotice: "Any unreferenced tagged images will be erased from local cache and must be re-pulled.",
                      command: "docker image prune -a -f",
                    })}
                    className="flex-1 text-xs h-8"
                    title="Prune all unreferenced images (-a)"
                  >
                    All Unused (-a)
                  </Button>
                </div>
              </div>
            </div>

            {/* Clean Volumes */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <HardDrivesIcon className="h-4 w-4" weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Clean Only Volumes</h4>
                    <p className="text-[11px] text-muted-foreground font-mono">docker volume prune</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Reclaim storage by removing detached anonymous or named storage volumes not mounted to containers.
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isExecutingPrune}
                    onClick={() => setActiveConfirmation({
                      target: "volume",
                      all: false,
                      title: "Prune Anonymous Volumes?",
                      description: "This will remove all anonymous local volumes not mounted to at least one container.",
                      warningNotice: "Named volumes will remain untouched.",
                      command: "docker volume prune -f",
                    })}
                    className="flex-1 text-xs h-8"
                    title="Prune anonymous unused volumes"
                  >
                    Anonymous
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isExecutingPrune}
                    onClick={() => setActiveConfirmation({
                      target: "volume",
                      all: true,
                      title: "Prune All Unused Volumes?",
                      description: "This will permanently remove all detached anonymous and named storage volumes.",
                      warningNotice: "Data stored in detached volumes will be permanently erased and cannot be recovered.",
                      command: "docker volume prune -a -f",
                    })}
                    className="flex-1 text-xs h-8"
                    title="Prune all unused named & anonymous volumes (-a)"
                  >
                    All Unused (-a)
                  </Button>
                </div>
              </div>
            </div>

            {/* Clean Build Cache */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <CodeIcon className="h-4 w-4" weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Clean Build Cache</h4>
                    <p className="text-[11px] text-muted-foreground font-mono">docker builder prune</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Clear BuildKit build cache stages and temporary intermediate compilation artifacts.
                </p>
              </div>
              <div className="pt-2 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExecutingPrune}
                  onClick={() => setActiveConfirmation({
                    target: "builder",
                    all: true,
                    title: "Prune All Build Cache?",
                    description: "This will clear all BuildKit cached compilation stages and temporary build layers.",
                    warningNotice: "Subsequent Dockerfile builds may take longer as cache layers are rebuilt.",
                    command: "docker builder prune -a -f",
                  })}
                  className="w-full text-xs h-8 gap-1.5"
                >
                  <BroomIcon className="h-3.5 w-3.5" />
                  Prune All Build Cache (-a)
                </Button>
              </div>
            </div>

            {/* Clean Containers */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <CubeIcon className="h-4 w-4" weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Clean Containers</h4>
                    <p className="text-[11px] text-muted-foreground font-mono">docker container prune</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Remove all stopped containers in <code>exited</code>, <code>dead</code>, or <code>created</code> states.
                </p>
              </div>
              <div className="pt-2 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExecutingPrune}
                  onClick={() => setActiveConfirmation({
                    target: "container",
                    all: false,
                    title: "Prune Stopped Containers?",
                    description: "This will delete all containers currently in exited, dead, or created states.",
                    warningNotice: "Running containers will NOT be stopped or removed.",
                    command: "docker container prune -f",
                  })}
                  className="w-full text-xs h-8 gap-1.5"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  Prune Stopped Containers
                </Button>
              </div>
            </div>

            {/* Clean Networks */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <ShareNetworkIcon className="h-4 w-4" weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Clean Networks</h4>
                    <p className="text-[11px] text-muted-foreground font-mono">docker network prune</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Remove all custom user-defined network bridges not attached to at least one container.
                </p>
              </div>
              <div className="pt-2 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExecutingPrune}
                  onClick={() => setActiveConfirmation({
                    target: "network",
                    all: false,
                    title: "Prune Unused Networks?",
                    description: "This will remove all user-defined bridge networks not connected to any active container.",
                    warningNotice: "Default Docker networks (bridge, host, none) are preserved.",
                    command: "docker network prune -f",
                  })}
                  className="w-full text-xs h-8 gap-1.5"
                >
                  <ShareNetworkIcon className="h-3.5 w-3.5" />
                  Prune Unused Networks
                </Button>
              </div>
            </div>

            {/* Full System Prune Card */}
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                    <ShieldWarningIcon className="h-4 w-4" weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Full System Prune</h4>
                    <p className="text-[11px] text-muted-foreground font-mono">docker system prune -a --volumes</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Comprehensive engine purge: cleans stopped containers, dangling images, unused volumes, and build layers.
                </p>
              </div>
              <div className="pt-2 border-t border-border/40">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isExecutingPrune}
                  onClick={() => setActiveConfirmation({
                    target: "system",
                    all: true,
                    volumes: true,
                    title: "Execute Full System Prune?",
                    description: "This performs a complete purge of stopped containers, unused networks, dangling & unused images, and detached volumes.",
                    warningNotice: "Active running containers will remain safe, but all unreferenced resources will be permanently removed.",
                    command: "docker system prune -a --volumes -f",
                  })}
                  className="w-full text-xs h-8 gap-1.5"
                >
                  <BroomIcon className="h-3.5 w-3.5" />
                  Execute Full Prune
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Engine Output Console (appears when prune completes) */}
        {pruneOutput && (
          <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs animate-in fade-in duration-200">
            <div className="p-3 bg-muted/40 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalWindowIcon className="h-4 w-4 text-primary" />
                <span className="font-semibold text-xs text-foreground">Docker Engine Execution Output</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(pruneOutput);
                    setCopiedOutput(true);
                    toast.success("Output copied!");
                    setTimeout(() => setCopiedOutput(false), 2000);
                  }}
                  className="h-6 text-[11px] px-2"
                >
                  {copiedOutput ? <CheckIcon className="h-3 w-3 text-emerald-500" /> : <CopyIcon className="h-3 w-3" />}
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPruneOutput(null)}
                  className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </Button>
              </div>
            </div>
            <pre className="p-4 text-xs font-mono text-muted-foreground overflow-auto max-h-[240px] whitespace-pre-wrap leading-relaxed">
              {pruneOutput}
            </pre>
          </div>
        )}
      </div>

      {/* TAB 4: DEVELOPER TOOLS */}
      <div
        role="tabpanel"
        id="panel-tools"
        aria-labelledby="tab-tools"
        tabIndex={0}
        hidden={activeTab !== "tools"}
        className="space-y-6 focus-visible:outline-none"
      >
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden">
          <div className="p-6 pb-4 border-b border-border/50">
            <h3 className="font-semibold text-base leading-none text-foreground flex items-center gap-2">
              <TerminalWindowIcon className="h-4 w-4 text-primary" weight="fill" />
              Terminal & CLI Integration
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5">
              Fine-tune default execution environments, container shell spawning, and log inspection parameters.
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Default Container Interactive Shell</Label>
                <p className="text-xs text-muted-foreground">
                  The primary shell executable invoked when launching external terminals or running container exec commands.
                </p>
              </div>
              <Select value={containerShell} onValueChange={setContainerShell}>
                <SelectTrigger className="w-56 h-9 text-xs rounded-lg border-border/70 bg-background">
                  <SelectValue placeholder="Select shell" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/70">
                  <SelectItem value="default" className="text-xs">Smart Fallback (bash || sh)</SelectItem>
                  <SelectItem value="bash" className="text-xs">GNU Bash (/bin/bash)</SelectItem>
                  <SelectItem value="sh" className="text-xs">POSIX Shell (/bin/sh)</SelectItem>
                  <SelectItem value="zsh" className="text-xs">Zsh (/bin/zsh)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/40">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Default Log Tail Buffer</Label>
                <p className="text-xs text-muted-foreground">
                  Initial line count retrieved when opening container logs or daemon log inspectors.
                </p>
              </div>
              <Select
                value={defaultLogTail.toString()}
                onValueChange={(val) => setDefaultLogTail(parseInt(val, 10))}
              >
                <SelectTrigger className="w-56 h-9 text-xs rounded-lg border-border/70 bg-background">
                  <SelectValue placeholder="Select line count" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/70">
                  <SelectItem value="50" className="text-xs">50 lines</SelectItem>
                  <SelectItem value="150" className="text-xs">150 lines (Default)</SelectItem>
                  <SelectItem value="300" className="text-xs">300 lines</SelectItem>
                  <SelectItem value="500" className="text-xs">500 lines</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/40">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Auto-Detected Terminal Emulators</Label>
                <p className="text-xs text-muted-foreground">
                  Supported desktop emulators on Linux and macOS: GNOME Terminal, Konsole, x-terminal-emulator, xterm, Terminal.app.
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs px-2.5 py-1">
                Auto-Resolving
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 5: HELP & INFO & DIAGNOSTICS */}
      <div
        role="tabpanel"
        id="panel-help"
        aria-labelledby="tab-help"
        tabIndex={0}
        hidden={activeTab !== "help"}
        className="space-y-6 focus-visible:outline-none"
      >
        {/* About App Card */}
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden">
          <div className="p-6 pb-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-base leading-none text-foreground flex items-center gap-2">
                <InfoIcon className="h-4 w-4 text-primary" weight="fill" />
                About Docker Lite
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5">
                Next-generation, ultra-fast native desktop container studio built on Tauri v2 and Rust.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyDiagnostics}
              className="h-8 gap-1.5 text-xs rounded-lg shrink-0"
            >
              {copiedDiag ? <CheckIcon className="h-3.5 w-3.5 text-emerald-500" /> : <CopyIcon className="h-3.5 w-3.5" />}
              {copiedDiag ? "Copied Report" : "Copy Diagnostic Report"}
            </Button>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Engine Stack</span>
              <p className="font-medium text-foreground">Tauri 2.0 • Rust Bollard • Tokio</p>
            </div>
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Frontend Architecture</span>
              <p className="font-medium text-foreground">React 19 • TypeScript • Tailwind v4</p>
            </div>
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Engine Socket Path</span>
              <p className="font-mono text-foreground truncate">/var/run/docker.sock</p>
            </div>
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Server Version</span>
              <p className="font-mono text-foreground">{systemInfo?.server_version || "Unavailable"}</p>
            </div>
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Operating System</span>
              <p className="font-mono text-foreground">{systemInfo?.operating_system || "Linux"}</p>
            </div>
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Kernel Release</span>
              <p className="font-mono text-foreground truncate">{systemInfo?.kernel_version || "Linux Kernel"}</p>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Cheat Sheet */}
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden">
          <div className="p-6 pb-4 border-b border-border/50">
            <h3 className="font-semibold text-base leading-none text-foreground flex items-center gap-2">
              <KeyboardIcon className="h-4 w-4 text-primary" weight="fill" />
              Keyboard Navigation & Shortcuts
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5">
              Essential keyboard shortcuts and navigation patterns for high productivity.
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <span className="text-muted-foreground">Focus Filter / Search Input</span>
                <kbd className="px-2 py-0.5 rounded bg-muted font-mono font-semibold text-[11px] border border-border/70">
                  Tab
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <span className="text-muted-foreground">Toggle Checkbox Selection</span>
                <kbd className="px-2 py-0.5 rounded bg-muted font-mono font-semibold text-[11px] border border-border/70">
                  Space
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <span className="text-muted-foreground">Close Active Modal or Sheet</span>
                <kbd className="px-2 py-0.5 rounded bg-muted font-mono font-semibold text-[11px] border border-border/70">
                  Esc
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <span className="text-muted-foreground">Refresh Docker Engine State</span>
                <kbd className="px-2 py-0.5 rounded bg-muted font-mono font-semibold text-[11px] border border-border/70">
                  Header Button
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting Common Issues */}
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden">
          <div className="p-6 pb-4 border-b border-border/50">
            <h3 className="font-semibold text-base leading-none text-foreground flex items-center gap-2">
              <QuestionIcon className="h-4 w-4 text-primary" weight="fill" />
              Troubleshooting Common Docker Issues
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5">
              Quick fixes and diagnostic commands for common daemon and networking problems.
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Issue: Cannot connect to the Docker daemon at unix:///var/run/docker.sock
              </div>
              <p className="text-xs text-muted-foreground">
                The Docker background daemon service is stopped. Start or enable the systemd service:
              </p>
              <div className="flex items-center justify-between p-2 rounded-lg bg-background font-mono text-[11px] border border-border/60">
                <code>sudo systemctl start docker && sudo systemctl enable docker</code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText("sudo systemctl start docker && sudo systemctl enable docker");
                    toast.success("Command copied!");
                  }}
                  title="Copy command"
                >
                  <CopyIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Issue: Permission denied while attempting to connect to the Docker daemon
              </div>
              <p className="text-xs text-muted-foreground">
                Your current Linux user does not belong to the <code>docker</code> usergroup:
              </p>
              <div className="flex items-center justify-between p-2 rounded-lg bg-background font-mono text-[11px] border border-border/60">
                <code>sudo usermod -aG docker $USER && newgrp docker</code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText("sudo usermod -aG docker $USER && newgrp docker");
                    toast.success("Command copied!");
                  }}
                  title="Copy command"
                >
                  <CopyIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Issue: Bind for 0.0.0.0:&lt;PORT&gt; failed: port is already allocated
              </div>
              <p className="text-xs text-muted-foreground">
                Another process or container is currently binding the desired host port:
              </p>
              <div className="flex items-center justify-between p-2 rounded-lg bg-background font-mono text-[11px] border border-border/60">
                <code>sudo lsof -i :&lt;PORT&gt; || sudo ss -tulpn | grep :&lt;PORT&gt;</code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText("sudo lsof -i :8080 || sudo ss -tulpn | grep :8080");
                    toast.success("Command copied!");
                  }}
                  title="Copy command"
                >
                  <CopyIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Helpful Resources & Quick Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/logs")}
            className="h-12 justify-start gap-2.5 rounded-xl border-border/70 bg-card/60 text-xs"
          >
            <TerminalWindowIcon className="h-4 w-4 text-primary shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-foreground">Daemon Logs</p>
              <p className="text-[10px] text-muted-foreground">Stream real-time log output</p>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/events")}
            className="h-12 justify-start gap-2.5 rounded-xl border-border/70 bg-card/60 text-xs"
          >
            <PulseIcon className="h-4 w-4 text-primary shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-foreground">Docker Events</p>
              <p className="text-[10px] text-muted-foreground">Audit event stream buffer</p>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/system-info")}
            className="h-12 justify-start gap-2.5 rounded-xl border-border/70 bg-card/60 text-xs"
          >
            <InfoIcon className="h-4 w-4 text-primary shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-foreground">System Info</p>
              <p className="text-[10px] text-muted-foreground">Inspect engine parameters</p>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open("https://docs.docker.com", "_blank")}
            className="h-12 justify-start gap-2.5 rounded-xl border-border/70 bg-card/60 text-xs"
          >
            <BookOpenIcon className="h-4 w-4 text-primary shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-foreground">Official Docs</p>
              <p className="text-[10px] text-muted-foreground">Docker engine reference</p>
            </div>
          </Button>
        </div>
      </div>

      {/* Unified Targeted Resource Prune Confirmation Modal */}
      <AlertDialog open={!!activeConfirmation} onOpenChange={(open) => !open && setActiveConfirmation(null)}>
        <AlertDialogContent className="rounded-xl border border-border shadow-xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldWarningIcon className="h-5 w-5" />
              {activeConfirmation?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-xs leading-relaxed text-muted-foreground pt-1">
              <p>{activeConfirmation?.description}</p>
              {activeConfirmation?.warningNotice && (
                <span className="block font-medium text-foreground bg-muted/50 p-2.5 rounded-lg border border-border/60">
                  {activeConfirmation.warningNotice}
                </span>
              )}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-background font-mono text-[11px] border border-border/60 text-foreground">
                <span className="text-primary font-bold select-none">$</span>
                <code className="truncate">{activeConfirmation?.command}</code>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isExecutingPrune} className="text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmPrune();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs gap-1.5"
              disabled={isExecutingPrune}
            >
              {isExecutingPrune ? (
                <>
                  <SpinnerGapIcon className="h-3.5 w-3.5 animate-spin" />
                  Pruning...
                </>
              ) : (
                <>
                  <TrashIcon className="h-3.5 w-3.5" />
                  Confirm & Prune
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
