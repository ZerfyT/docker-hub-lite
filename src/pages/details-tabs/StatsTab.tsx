import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowsClockwiseIcon, CpuIcon, HardDriveIcon, HardDrivesIcon, GlobeIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContainerStatsChart } from "../../components/dashboard/ContainerStatsChart";

export function StatsTab({ containerId, isRunning }: { containerId: string; isRunning: boolean }) {
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

      setHistory((prev) => {
        const newData = [
          ...prev,
          {
            time: new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            cpu: Number(cpuPerc.toFixed(2)),
            mem: memUsage,
            netRx,
            netTx,
            blockRead,
            blockWrite,
          },
        ];
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
      interval = setInterval(fetchStats, 4000);
    }
    return () => clearInterval(interval);
  }, [containerId, isRunning]);

  if (!isRunning) {
    return (
      <div className="flex h-full items-center justify-center border border-dashed border-border/70 rounded-xl text-muted-foreground p-8 font-mono text-sm bg-muted/10">
        Container is stopped. Start the container to stream real-time metrics.
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

  let currentCpuPerc = 0;
  let currentMemUsage = "0 B";
  let currentMemLimit = "0 B";
  let currentMemPerc = 0;
  let currentNetRx = 0;
  let currentNetTx = 0;
  let currentBlockRead = 0;
  let currentBlockWrite = 0;
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
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden rounded-xl border border-border/70 bg-card/40 backdrop-blur-xs">
      <div className="flex items-center justify-between p-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              Container Telemetry & Hardware Gauges
            </h3>
            <p className="text-[11px] text-muted-foreground">Streaming sampled every 4 seconds</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="h-8 gap-1.5 text-xs rounded-lg"
        >
          <ArrowsClockwiseIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 w-full p-4">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {/* CPU Card */}
          <Card className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs">
            <CardContent className="p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  CPU
                </span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <CpuIcon className="h-4 w-4" weight="fill" />
                </div>
              </div>
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                {currentCpuPerc.toFixed(1)}%
              </div>
              <p className="text-[11px] text-muted-foreground">{onlineCpus} core(s) allocated</p>
              <div className="w-full bg-muted/60 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, currentCpuPerc)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Memory Card */}
          <Card className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs">
            <CardContent className="p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Memory
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <HardDriveIcon className="h-4 w-4" weight="fill" />
                </div>
              </div>
              <div className="text-xl font-bold font-mono tracking-tight text-foreground truncate">
                {currentMemUsage}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {currentMemPerc.toFixed(1)}% of {currentMemLimit}
              </p>
              <div className="w-full bg-muted/60 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, currentMemPerc)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Network Card */}
          <Card className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs">
            <CardContent className="p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Network (RX/TX)
                </span>
                <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <GlobeIcon className="h-4 w-4" weight="fill" />
                </div>
              </div>
              <div className="text-lg font-bold font-mono tracking-tight text-foreground truncate">
                {formatBytes(currentNetRx)}
              </div>
              <p className="text-[11px] font-mono text-muted-foreground truncate">
                TX: {formatBytes(currentNetTx)}
              </p>
              <div className="w-full bg-violet-500/20 h-1 rounded-full overflow-hidden">
                <div className="bg-violet-500 h-full w-2/3" />
              </div>
            </CardContent>
          </Card>

          {/* Block I/O Card */}
          <Card className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs">
            <CardContent className="p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Block Storage
                </span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <HardDrivesIcon className="h-4 w-4" weight="fill" />
                </div>
              </div>
              <div className="text-lg font-bold font-mono tracking-tight text-foreground truncate">
                {formatBytes(currentBlockRead)}
              </div>
              <p className="text-[11px] font-mono text-muted-foreground truncate">
                Write: {formatBytes(currentBlockWrite)}
              </p>
              <div className="w-full bg-amber-500/20 h-1 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Charts */}
        <ContainerStatsChart data={history} />
      </ScrollArea>
    </div>
  );
}
