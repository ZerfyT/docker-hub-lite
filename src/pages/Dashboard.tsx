import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ResourceChart } from "@/components/dashboard/ResourceChart";
import { ContainerTable, Container } from "@/components/dashboard/ContainerTable";
import { Button } from "@/components/ui/button";
import { CubeIcon, StackIcon, HardDrivesIcon, PulseIcon, TrashIcon } from "@phosphor-icons/react";
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

interface SystemInfo {
  total_images: number;
  volume_storage: string;
  system_health: string;
}

export function Dashboard() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  const fetchData = async () => {
    try {
      const portsData = await invoke<Container[]>("get_containers");
      setContainers(portsData);

      const sysData = await invoke<SystemInfo>("get_system_info");
      setSystemInfo(sysData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSystemPrune = async () => {
    try {
      // Temporary placeholder: invoke("system_prune");
      console.log("System Prune Triggered");
      alert("System pruned successfully!");
    } catch (error) {
      console.error("Failed to prune system", error);
    }
  };

  const runningCount = containers.filter((c) => c.State === "running").length;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
          <p className="text-muted-foreground">Monitor and manage your host engine.</p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <TrashIcon className="h-4 w-4" />
              System Prune
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all stopped containers, all networks not used by at least one container, all dangling images, and all dangling build cache.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSystemPrune}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Running Containers"
          value={`${runningCount} / ${containers.length}`}
          description="Total active vs installed"
          icon={CubeIcon}
        />
        <MetricCard
          title="Total Images"
          value={systemInfo?.total_images.toString() || "..."}
          description="Local Engine"
          icon={StackIcon}
        />
        <MetricCard
          title="Volume Storage"
          value={systemInfo ? systemInfo.volume_storage.split(" ")[1] : "..."}
          description={systemInfo?.volume_storage || "..."}
          icon={HardDrivesIcon}
        />
        <MetricCard
          title="System Health"
          value={systemInfo?.system_health || "..."}
          description={systemInfo?.system_health === "Healthy" ? "Engine behaving normally" : "Connection issue"}
          icon={PulseIcon}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-7">
          <ResourceChart />
        </div>
      </div>

      {/* Quick Access Row */}
      <div className="space-y-4 pb-12">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-medium">Top Containers</h3>
          <p className="text-sm text-muted-foreground cursor-pointer hover:underline">View All</p>
        </div>
        <ContainerTable containers={containers} onRefresh={fetchData} />
      </div>
    </>
  );
}
