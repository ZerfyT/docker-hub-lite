import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function StatsTab({ containerId, isRunning }: { containerId: string, isRunning: boolean }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    if (!isRunning) return;
    setLoading(true);
    try {
      const raw = await invoke<string>("get_container_stats_once", { id: containerId });
      setStats(JSON.parse(raw));
    } catch (error) {
      console.error("Failed to fetch stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      fetchStats();
      interval = setInterval(fetchStats, 5000);
    }
    return () => clearInterval(interval);
  }, [containerId, isRunning]);

  if (!isRunning) {
    return (
      <div className="flex h-full items-center justify-center border-t border-border/50 text-muted-foreground p-8">
        Container is not running. Start the container to view live stats.
      </div>
    );
  }

  // Basic calculation approximations (accurate enough for simple display)
  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  let cpuPerc = 0.0;
  let memUsage = "0 B", memLimit = "0 B", memPerc = 0.0;
  let netRx = 0, netTx = 0;
  let blockRead = 0, blockWrite = 0;

  if (stats) {
    // Memory
    const usage = stats.memory_stats?.usage || 0;
    const limit = stats.memory_stats?.limit || 0;
    memUsage = formatBytes(usage);
    memLimit = formatBytes(limit);
    if (limit > 0) memPerc = (usage / limit) * 100;

    // CPU Calculation (basic)
    const cpuDelta = stats.cpu_stats?.cpu_usage?.total_usage - (stats.precpu_stats?.cpu_usage?.total_usage || 0);
    const systemDelta = stats.cpu_stats?.system_cpu_usage - (stats.precpu_stats?.system_cpu_usage || 0);
    const onlineCpus = stats.cpu_stats?.online_cpus || stats.cpu_stats?.cpu_usage?.percpu_usage?.length || 1;
    if (systemDelta > 0 && cpuDelta > 0) {
      cpuPerc = (cpuDelta / systemDelta) * onlineCpus * 100;
    }

    // Network
    if (stats.networks) {
      for (const key of Object.keys(stats.networks)) {
        netRx += stats.networks[key].rx_bytes;
        netTx += stats.networks[key].tx_bytes;
      }
    }

    // Block IO
    if (stats.blkio_stats?.io_service_bytes_recursive) {
      for (const entry of stats.blkio_stats.io_service_bytes_recursive) {
        if (entry.op?.toLowerCase() === "read") blockRead += entry.value;
        if (entry.op?.toLowerCase() === "write") blockWrite += entry.value;
      }
    }
  }

  return (
    <div className="p-6 h-full overflow-y-auto space-y-4 border-t border-border/50 bg-muted/10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">Live Container Stats</h3>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <ArrowsClockwiseIcon className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CPU Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cpuPerc.toFixed(2)}%</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memUsage} <span className="text-sm text-muted-foreground font-normal">/ {memLimit}</span></div>
            <div className="text-xs text-muted-foreground mt-1">{memPerc.toFixed(2)}% of limit</div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Network I/O</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(netRx)} <span className="text-sm text-muted-foreground font-normal">/ {formatBytes(netTx)}</span></div>
            <div className="text-xs text-muted-foreground mt-1">RX / TX</div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Block I/O</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(blockRead)} <span className="text-sm text-muted-foreground font-normal">/ {formatBytes(blockWrite)}</span></div>
            <div className="text-xs text-muted-foreground mt-1">Read / Write</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
