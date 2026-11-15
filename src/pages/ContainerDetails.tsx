import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
  CaretLeftIcon,
  CubeIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  HardDrivesIcon,
  TerminalWindowIcon,
  FolderOpenIcon,
  ChartLineUpIcon,
  SquareIcon,
  PlayIcon,
  PauseIcon,
  ArrowClockwiseIcon,
  TrashIcon,
  KeyIcon,
  CopyIcon,
} from "@phosphor-icons/react";

import { LogsTab } from "./details-tabs/LogsTab";
import { InspectTab } from "./details-tabs/InspectTab";
import { BindMountsTab } from "./details-tabs/BindMountsTab";
import { StatsTab } from "./details-tabs/StatsTab";
import { ExecTab } from "./details-tabs/ExecTab";
import { FilesTab } from "./details-tabs/FilesTab";
import { EnvTab } from "./details-tabs/EnvTab";

export function ContainerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "logs";

  const [inspectData, setInspectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      const rawInspect = await invoke<string>("inspect_container", { id });
      setInspectData(JSON.parse(rawInspect));
    } catch (error) {
      console.error("Failed to inspect container", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(fetchDetails, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading || !inspectData) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground animate-pulse">
        <CubeIcon className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm font-medium">Loading container inspector...</span>
      </div>
    );
  }

  const isRunning = inspectData.State?.Running;
  const isPaused = inspectData.State?.Paused;
  const shortId = id?.substring(0, 12);
  const name = inspectData.Name?.replace("/", "") || "Unnamed";
  const image = inspectData.Config?.Image;

  const runAction = async (action: string) => {
    if (!id) return;
    try {
      await invoke(action, { id });
      if (action === "remove_container") {
        toast.success(`Success: ${action}`);
        navigate("/containers");
      } else {
        toast.success(`Success: ${action}`);
        await fetchDetails();
      }
    } catch (error) {
      const msg = `Error: Failed to ${action}, ${error}`;
      console.error(msg);
      toast.error(msg);
    }
  };

  const tabs = [
    { id: "logs", label: "Live Logs", icon: FileTextIcon },
    { id: "env", label: "Environment", icon: KeyIcon },
    { id: "stats", label: "Telemetry & Stats", icon: ChartLineUpIcon },
    { id: "files", label: "Filesystem", icon: FolderOpenIcon },
    { id: "exec", label: "Terminal Exec", icon: TerminalWindowIcon },
    { id: "binds", label: "Mounts & Volumes", icon: HardDrivesIcon },
    { id: "inspect", label: "Raw JSON", icon: MagnifyingGlassIcon },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] space-y-4">
      {/* Elevated Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/containers")}
            className="h-9 w-9 rounded-lg hover:bg-muted"
            title="Back to containers"
          >
            <CaretLeftIcon className="h-5 w-5" />
          </Button>

          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <CubeIcon className="h-6 w-6" weight="fill" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                {name}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  isRunning
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : isPaused
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isRunning
                      ? "bg-emerald-500 animate-pulse"
                      : isPaused
                      ? "bg-amber-500"
                      : "bg-zinc-400"
                  }`}
                />
                <span className="capitalize">{isRunning ? "Running" : isPaused ? "Paused" : "Exited"}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(shortId || "");
                  toast.success("Container ID copied");
                }}
                className="hover:text-foreground hover:underline flex items-center gap-1"
                title="Copy container ID"
              >
                <span>{shortId}</span>
                <CopyIcon className="w-3 h-3 opacity-60" />
              </button>
              <span>•</span>
              <span className="bg-muted/70 px-1.5 py-0.2 rounded border border-border/50 text-[11px] truncate max-w-[200px]">
                {image}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
          {isRunning ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
              onClick={() => runAction("stop_container")}
              title="Stop container"
            >
              <SquareIcon className="h-3.5 w-3.5 fill-current" />
              <span className="hidden sm:inline">Stop</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2.5 text-xs text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
              onClick={() => runAction("start_container")}
              title="Start container"
            >
              <PlayIcon className="h-3.5 w-3.5 fill-current" />
              <span className="hidden sm:inline">Start</span>
            </Button>
          )}

          {isRunning && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
              onClick={() => runAction("pause_container")}
              title="Pause container"
            >
              <PauseIcon className="h-3.5 w-3.5 fill-current" />
              <span className="hidden sm:inline">Pause</span>
            </Button>
          )}

          {isPaused && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
              onClick={() => runAction("unpause_container")}
              title="Unpause container"
            >
              <PlayIcon className="h-3.5 w-3.5 fill-current" />
              <span className="hidden sm:inline">Resume</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
            onClick={() => runAction("restart_container")}
            title="Restart container"
          >
            <ArrowClockwiseIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </Button>

          {isRunning && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
              onClick={async () => {
                try {
                  await invoke("open_container_terminal", { id });
                  toast.info("Opening terminal session...");
                } catch (e) {
                  toast.error(`Failed to open terminal: ${e}`);
                }
              }}
              title="Open host shell connected to container"
            >
              <TerminalWindowIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Terminal</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteDialog(true)}
            title="Delete container"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/40 backdrop-blur-xs rounded-xl border border-border/70 overflow-x-auto max-w-full">
        {tabs.map((tab) => {
          const isActive = defaultTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-background text-foreground shadow-xs border border-border/60 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <tab.icon
                className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                weight={isActive ? "fill" : "regular"}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-hidden">
        {defaultTab === "logs" && <LogsTab containerId={id!} />}
        {defaultTab === "env" && <EnvTab envList={inspectData?.Config?.Env || []} />}
        {defaultTab === "stats" && <StatsTab containerId={id!} isRunning={isRunning} />}
        {defaultTab === "files" && <FilesTab containerId={id!} isRunning={isRunning} />}
        {defaultTab === "exec" && <ExecTab containerId={id!} isRunning={isRunning} />}
        {defaultTab === "binds" && <BindMountsTab mounts={inspectData?.Mounts || []} />}
        {defaultTab === "inspect" && <InspectTab inspectData={inspectData} />}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-xl border border-border shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Container {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the container. Any container-internal data not mounted to a persistent volume will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => runAction("remove_container")}
            >
              Delete Container
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
