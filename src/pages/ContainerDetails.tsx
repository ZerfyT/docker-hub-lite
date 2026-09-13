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
  TrashIcon
} from "@phosphor-icons/react";

import { LogsTab } from "./details-tabs/LogsTab";
import { InspectTab } from "./details-tabs/InspectTab";
import { BindMountsTab } from "./details-tabs/BindMountsTab";
import { StatsTab } from "./details-tabs/StatsTab";
import { ExecTab } from "./details-tabs/ExecTab";
import { FilesTab } from "./details-tabs/FilesTab";

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
    return <div className="p-8 flex justify-center text-muted-foreground animate-pulse">Loading container details...</div>;
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
    { id: "logs", label: "Logs", icon: FileTextIcon },
    { id: "inspect", label: "Inspect", icon: MagnifyingGlassIcon },
    { id: "binds", label: "Bind mounts", icon: HardDrivesIcon },
    { id: "exec", label: "Exec", icon: TerminalWindowIcon },
    { id: "files", label: "Files", icon: FolderOpenIcon },
    { id: "stats", label: "Stats", icon: ChartLineUpIcon },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b pb-4 px-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/containers")}>
            <CaretLeftIcon className="h-5 w-5" />
          </Button>
          <div className="bg-primary/20 p-2 rounded-md">
            <CubeIcon className="h-6 w-6 text-primary" weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{name}</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span>{shortId}</span>
              <span>{image}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Status</span>
            <span className="text-sm font-medium flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-500" : isPaused ? "bg-yellow-500" : "bg-gray-500"}`}></span>
              {isRunning ? "Running" : isPaused ? "Paused" : "Exited"}
            </span>
          </div>

          {isRunning ? (
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => runAction("stop_container")} title="Stop">
              <SquareIcon className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" className="text-green-500" onClick={() => runAction("start_container")} title="Start">
              <PlayIcon className="h-4 w-4 fill-current" />
            </Button>
          )}

          {isRunning && (
            <Button size="icon" variant="ghost" className="text-muted-foreground" onClick={() => runAction("pause_container")} title="PauseIcon">
              <PauseIcon className="h-4 w-4 fill-current" />
            </Button>
          )}

          {isPaused && (
            <Button size="icon" variant="ghost" className="text-muted-foreground" onClick={() => runAction("unpause_container")} title="Unpause">
              <PlayIcon className="h-4 w-4 fill-current" />
            </Button>
          )}

          <Button size="icon" variant="ghost" className="text-muted-foreground" onClick={() => runAction("restart_container")} title="Restart">
            <ArrowClockwiseIcon className="h-4 w-4" />
          </Button>

          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-red-500 ml-2" onClick={() => setShowDeleteDialog(true)} title="Delete">
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs Naivgation */}
      <div className="flex items-center gap-6 border-b border-border/50 text-sm font-medium px-2">
        {tabs.map((tab) => {
          const isActive = defaultTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 border rounded-md overflow-hidden bg-background">
        {defaultTab === "logs" && <LogsTab containerId={id as string} />}
        {defaultTab === "inspect" && <InspectTab inspectData={inspectData} />}
        {defaultTab === "binds" && <BindMountsTab mounts={inspectData?.Mounts || []} />}
        {defaultTab === "exec" && <ExecTab containerId={id as string} isRunning={isRunning} />}
        {defaultTab === "files" && <FilesTab containerId={id as string} isRunning={isRunning} />}
        {defaultTab === "stats" && <StatsTab containerId={id as string} isRunning={isRunning} />}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the container. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => runAction("remove_container")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
