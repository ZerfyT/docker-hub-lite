import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowsClockwiseIcon, CpuIcon, MemoryIcon, HardDrivesIcon, GlobeIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContainerStatsChart } from "../../components/dashboard/ContainerStatsChart";

export function StatsTab({ containerId, isRunning }: { containerId: string, isRunning: boolean }) {
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    if (!isRunning) return;
    setLoading(true);
    try {
      const raw = await invoke<string>("get_container_stats_once", { id: containerId });
      const parsed = JSON.parse(raw);
      setStats(parsed);

      let cpuPerc = 0.0;
      let netRx = 0, netTx = 0;
      let blockRead = 0, blockWrite = 0;
      
      const usage = parsed.memory_stats?.usage || 0;
      const cache = parsed.memory_stats?.stats?.cache || 0;
      const memUsage = Math.max(0, usage - cache);

      const cpuDelta = parsed.cpu_stats?.cpu_usage?.total_usage - (parsed.precpu_stats?.cpu_usage?.total_usage || 0);
      const systemDelta = parsed.cpu_stats?.system_cpu_usage - (parsed.precpu_stats?.system_cpu_usage || 0);
      const onlineCpus = parsed.cpu_stats?.online_cpus || parsed.cpu_stats?.cpu_usage?.percpu_usage?.length || 1;
      if (systemDelta > 0 && cpuDelta > 0) {
        cpuPerc = (cpuDelta / systemDelta) * onlineCpus * 100;
      }
      
      if (parsed.networks) {
        for (const key of Object.keys(parsed.networks)) {
          netRx += parsed.networks[key].rx_bytes;
          netTx += parsed.networks[key].tx_bytes;
        }
      }
      if (parsed.blkio_stats?.io_service_bytes_recursive) {
        for (const entry of parsed.blkio_stats.io_service_bytes_recursive) {
          if (entry.op?.toLowerCase() === "read") blockRead += entry.value;
          if (entry.op?.toLowerCase() === "write") blockWrite += entry.value;
        }
      }

      setHistory(prev => {
        const newData = [...prev, {
          time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: Number(cpuPerc.toFixed(2)),
          mem: memUsage,
          netRx,
          netTx,
          blockRead,
          blockWrite
        }];
        return newData.slice(-30);
      });
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

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Derive current values
  let currentCpuPerc = 0.0;
  let currentMemUsage = "0 B", currentMemLimit = "0 B", currentMemPerc = 0.0;
  let currentNetRx = 0, currentNetTx = 0;
  let currentBlockRead = 0, currentBlockWrite = 0;
  let onlineCpus = 1;

  if (stats) {
    const usage = stats.memory_stats?.usage || 0;
    const cache = stats.memory_stats?.stats?.cache || 0;
    const actualUsage = Math.max(0, usage - cache);
    const limit = stats.memory_stats?.limit || 0;
    currentMemUsage = formatBytes(actualUsage);
    currentMemLimit = formatBytes(limit);
    if (limit > 0) currentMemPerc = (actualUsage / limit) * 100;

    const cpuDelta = stats.cpu_stats?.cpu_usage?.total_usage - (stats.precpu_stats?.cpu_usage?.total_usage || 0);
    const systemDelta = stats.cpu_stats?.system_cpu_usage - (stats.precpu_stats?.system_cpu_usage || 0);
    onlineCpus = stats.cpu_stats?.online_cpus || stats.cpu_stats?.cpu_usage?.percpu_usage?.length || 1;
    if (systemDelta > 0 && cpuDelta > 0) {
      currentCpuPerc = (cpuDelta / systemDelta) * onlineCpus * 100;
    }

    if (stats.networks) {
      for (const key of Object.keys(stats.networks)) {
        currentNetRx += stats.networks[key].rx_bytes;
        currentNetTx += stats.networks[key].tx_bytes;
      }
    }

    if (stats.blkio_stats?.io_service_bytes_recursive) {
      for (const entry of stats.blkio_stats.io_service_bytes_recursive) {
        if (entry.op?.toLowerCase() === "read") currentBlockRead += entry.value;
        if (entry.op?.toLowerCase() === "write") currentBlockWrite += entry.value;
      }
    }
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden relative rounded-b-md border-t border-border/50 bg-muted/5">
      <div className="flex items-center justify-between p-6 pb-2">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Live Container Analytics
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Polling interval: 5 seconds</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <ArrowsClockwiseIcon className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <ScrollArea className="flex-1 w-full h-full p-6 pt-4">
        {/* Current Stats Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-none border-border/50 bg-background/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CPU Usage</CardTitle>
              <CpuIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentCpuPerc.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-1">{onlineCpus} cores allocated</p>
            </CardContent>
          </Card>

          <Card className="shadow-none border-border/50 bg-background/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Memory</CardTitle>
              <MemoryIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMemUsage}</div>
              <p className="text-xs text-muted-foreground mt-1">{currentMemPerc.toFixed(1)}% of {currentMemLimit}</p>
            </CardContent>
          </Card>

          <Card className="shadow-none border-border/50 bg-background/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Network (RX / TX)</CardTitle>
              <GlobeIcon className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">{formatBytes(currentNetRx)} <span className="text-sm font-normal text-muted-foreground">/ {formatBytes(currentNetTx)}</span></div>
              <p className="text-xs text-muted-foreground mt-1">Total transferred</p>
            </CardContent>
          </Card>

          <Card className="shadow-none border-border/50 bg-background/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Block I/O</CardTitle>
              <HardDrivesIcon className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">{formatBytes(currentBlockRead)} <span className="text-sm font-normal text-muted-foreground">/ {formatBytes(currentBlockWrite)}</span></div>
              <p className="text-xs text-muted-foreground mt-1">Total read / write</p>
            </CardContent>
          </Card>
        </div>

        {/* Live Charts */}
        <ContainerStatsChart data={history} />
      </ScrollArea>
    </div>
  );
}
