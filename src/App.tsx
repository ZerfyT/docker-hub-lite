import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ResourceChart } from "@/components/dashboard/ResourceChart";
import { ContainerTable, Container } from "@/components/dashboard/ContainerTable";
import { Button } from "@/components/ui/button";
import { Box, Layers, HardDrive, Activity, Trash2 } from "lucide-react";

interface SystemInfo {
  total_images: number;
  volume_storage: string;
  system_health: string;
}

function App() {
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

  const runningCount = containers.filter((c) => c.State === "running").length;

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
          <p className="text-muted-foreground">Monitor and manage your host engine.</p>
        </div>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          System Prune
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Running Containers"
          value={`${runningCount} / ${containers.length}`}
          description="Total active vs installed"
          icon={Box}
        />
        <MetricCard
          title="Total Images"
          value={systemInfo?.total_images.toString() || "..."}
          description="Local Engine"
          icon={Layers}
        />
        <MetricCard
          title="Volume Storage"
          value={systemInfo ? systemInfo.volume_storage.split(" ")[1] : "..."}
          description={systemInfo?.volume_storage || "..."}
          icon={HardDrive}
        />
        <MetricCard
          title="System Health"
          value={systemInfo?.system_health || "..."}
          description={systemInfo?.system_health === "Healthy" ? "Engine behaving normally" : "Connection issue"}
          icon={Activity}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-7">
          <ResourceChart />
        </div>
      </div>

      {/* Quick Access Row */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-medium">Top Containers</h3>
          <p className="text-sm text-muted-foreground cursor-pointer hover:underline">View All</p>
        </div>
        <ContainerTable containers={containers} onRefresh={fetchData} />
      </div>
    </AppLayout>
  );
}

export default App;