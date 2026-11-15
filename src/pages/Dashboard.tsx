import { useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ResourceChart } from "@/components/dashboard/ResourceChart";
import { ContainerTable } from "@/components/dashboard/ContainerTable";
import { Button } from "@/components/ui/button";
import {
  CubeIcon,
  StackIcon,
  HardDrivesIcon,
  PulseIcon,
  BroomIcon,
  ArrowRightIcon,
  RocketLaunchIcon,
  ArrowDownIcon,
  PlayIcon,
} from "@phosphor-icons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/store/useStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PullImageModal } from "@/components/modals/PullImageModal";
import { RunContainerModal } from "@/components/modals/RunContainerModal";

export function Dashboard() {
  const navigate = useNavigate();
  const { containers, systemInfo, fetchContainers, systemPrune } = useStore();
  const [pullModalOpen, setPullModalOpen] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);

  const handleSystemPrune = async () => {
    try {
      toast.loading("Pruning Docker system...", { id: "prune-toast" });
      const result = await systemPrune();
      toast.success(result || "System pruned successfully!", { id: "prune-toast" });
    } catch (error) {
      toast.error(`Failed to prune system: ${error}`, { id: "prune-toast" });
    }
  };

  const runningCount = containers.filter((c) => c.State === "running").length;

  return (
    <div className="space-y-6">
      {/* Page Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            System Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time container infrastructure, host metrics, and quick workflows.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPullModalOpen(true)}
            className="gap-1.5 text-xs font-medium"
          >
            <ArrowDownIcon className="h-3.5 w-3.5" />
            Pull Image
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setRunModalOpen(true)}
            className="gap-1.5 text-xs font-medium"
          >
            <PlayIcon className="h-3.5 w-3.5" />
            New Container
          </Button>

          <Button
            size="sm"
            onClick={() => navigate("/starters")}
            className="gap-1.5 text-xs font-medium bg-primary text-primary-foreground shadow-xs"
          >
            <RocketLaunchIcon className="h-3.5 w-3.5" weight="fill" />
            Dev Starters
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 text-xs font-medium"
                title="System Prune"
              >
                <BroomIcon className="h-3.5 w-3.5" />
                Prune
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-xl border border-border shadow-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Execute System Prune?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action permanently removes all stopped containers, unused networks, dangling images, and cached build layers. Active volumes will not be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSystemPrune}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Prune System
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Containers"
          value={`${runningCount} / ${containers.length}`}
          description={`${runningCount} active, ${containers.length - runningCount} stopped`}
          icon={CubeIcon}
          variant="emerald"
        />
        <MetricCard
          title="Total Images"
          value={systemInfo?.total_images?.toString() || "0"}
          description="Local Engine Cache"
          icon={StackIcon}
          variant="blue"
        />
        <MetricCard
          title="Volume Storage"
          value={systemInfo?.volume_storage ? systemInfo.volume_storage.split(" ")[1] || systemInfo.volume_storage : "0 B"}
          description={systemInfo?.volume_storage || "Local volumes"}
          icon={HardDrivesIcon}
          variant="amber"
        />
        <MetricCard
          title="System Health"
          value={systemInfo?.system_health || "Healthy"}
          description={systemInfo?.system_health === "Healthy" ? "Daemon responding normally" : "Connection notice"}
          icon={PulseIcon}
          variant={systemInfo?.system_health === "Healthy" ? "emerald" : "default"}
        />
      </div>

      {/* Resource Telemetry Chart */}
      <div>
        <ResourceChart />
      </div>

      {/* Top Active Workloads Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CubeIcon className="w-5 h-5 text-primary" weight="fill" />
            <h3 className="text-base font-semibold text-foreground">
              Container Workloads
            </h3>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/50">
              {containers.length} total
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/containers")}
            className="text-xs font-medium text-primary hover:text-primary/80 gap-1.5 h-8 px-2.5"
          >
            <span>Manage All</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Button>
        </div>

        <ContainerTable containers={containers} onRefresh={fetchContainers} />
      </div>

      {/* Modals */}
      <PullImageModal open={pullModalOpen} onOpenChange={setPullModalOpen} />
      <RunContainerModal open={runModalOpen} onOpenChange={setRunModalOpen} />
    </div>
  );
}
