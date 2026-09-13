import { useState, useEffect } from "react";
import { ContainerTable } from "@/components/dashboard/ContainerTable";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon, InfoIcon, PlayIcon, SquareIcon, PauseIcon, TrashIcon } from "@phosphor-icons/react";
import { useStore } from "@/store/useStore";
import { Switch } from "@/components/ui/switch";
import { invoke } from "@tauri-apps/api/core";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function Containers() {
  const { containers, fetchContainers } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyRunning, setShowOnlyRunning] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const [totalCPU, setTotalCPU] = useState(0);
  const [totalMem, setTotalMem] = useState(0);
  const [memLimit, setMemLimit] = useState(0);
  const [cpuCores, setCpuCores] = useState(0);

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0.00 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i];
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchAggregateStats = async () => {
      const runningContainers = containers.filter(c => c.State === "running");
      if (runningContainers.length === 0) {
        setTotalCPU(0);
        setTotalMem(0);
        return;
      }

      let sumCpu = 0;
      let sumMem = 0;
      let limitMem = 0;
      let limitCpu = 0;

      try {
        const statsPromises = runningContainers.map(c =>
          invoke<string>("get_container_stats_once", { id: c.Id }).catch(() => null)
        );
        const results = await Promise.all(statsPromises);

        for (const raw of results) {
          if (!raw) continue;
          const stats = JSON.parse(raw);

          const usage = stats.memory_stats?.usage || 0;
          sumMem += usage;
          if (limitMem === 0) limitMem = stats.memory_stats?.limit || 0;

          const cpuDelta = stats.cpu_stats?.cpu_usage?.total_usage - (stats.precpu_stats?.cpu_usage?.total_usage || 0);
          const systemDelta = stats.cpu_stats?.system_cpu_usage - (stats.precpu_stats?.system_cpu_usage || 0);
          const onlineCpus = stats.cpu_stats?.online_cpus || stats.cpu_stats?.cpu_usage?.percpu_usage?.length || 1;

          if (systemDelta > 0 && cpuDelta > 0) {
            sumCpu += (cpuDelta / systemDelta) * onlineCpus * 100;
          }
          if (limitCpu === 0) limitCpu = onlineCpus;
        }

        setTotalCPU(sumCpu);
        setTotalMem(sumMem);
        setMemLimit(limitMem);
        setCpuCores(limitCpu);

      } catch (e) {
        console.error("Error fetching stats for containers top bar:", e);
      }
    };

    fetchAggregateStats();
    interval = setInterval(fetchAggregateStats, 3000);
    return () => clearInterval(interval);
  }, [containers]);

  const handleBulkAction = async (action: string) => {
    if (selected.length === 0) return;
    try {
      const promises = selected.map(id => invoke(action, { id }));
      await Promise.allSettled(promises);
      fetchContainers();
      if (action === "remove_container") {
        setSelected([]);
      }
    } catch (error) {
      console.error(`Failed bulk ${action}`, error);
    }
  };

  const filteredContainers = containers.filter(
    (c) => {
      const matchesSearch = c.Names?.[0]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.Image?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = showOnlyRunning ? c.State === "running" : true;
      return matchesSearch && matchesStatus;
    }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 relative">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Containers</h2>
          <span className="text-xs text-primary cursor-pointer font-medium hover:underline pb-1">Give feedback</span>
        </div>
      </div>

      <div className="flex items-center gap-16 mb-4 mt-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold flex items-center gap-1.5">
            Container CPU usage <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="text-primary font-medium text-sm mt-1 flex gap-1">
            {totalCPU.toFixed(2)}% <span className="text-muted-foreground">/ {(cpuCores * 100).toFixed(0)}% <span className="text-[13px]">({cpuCores} CPUs available)</span></span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold flex items-center gap-1.5">
            Container memory usage <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="text-primary font-medium text-sm mt-1 flex gap-1">
            {formatBytes(totalMem)} <span className="text-muted-foreground">/ {formatBytes(memLimit)}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between space-x-12">
        <div className="flex items-center space-x-12 flex-1">
          <div className="relative w-full max-w-sm">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              className="pl-9 bg-background border-border focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-primary h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4 shrink-0">
            <div className="flex items-center space-x-2">
              <Switch
                id="running-filter"
                checked={showOnlyRunning}
                onCheckedChange={setShowOnlyRunning}
              />
              <Label htmlFor="running-filter" className="font-semibold text-sm cursor-pointer whitespace-nowrap">
                Only show running containers
              </Label>
            </div>
          </div>
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2 font-medium">{selected.length} selected</span>
            <Button size="icon" variant="destructive" className="h-9 w-9" onClick={() => handleBulkAction("remove_container")} title="Delete">
              <TrashIcon className="h-4 w-4" />
            </Button>
            <div className="flex items-center border border-border rounded-md overflow-hidden bg-background">
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-none text-primary hover:text-primary/80 hover:bg-muted" onClick={() => handleBulkAction("start_container")} title="Start">
                <PlayIcon className="h-4 w-4 fill-current" />
              </Button>
              <div className="w-[1px] h-9 bg-border" />
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-none text-muted-foreground hover:bg-muted" onClick={() => handleBulkAction("pause_container")} title="PauseIcon">
                <PauseIcon className="h-4 w-4 fill-current" />
              </Button>
              <div className="w-[1px] h-9 bg-border" />
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-none text-muted-foreground hover:bg-muted" onClick={() => handleBulkAction("stop_container")} title="Stop">
                <SquareIcon className="h-4 w-4 fill-current" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-md border bg-background overflow-hidden relative">
        <ContainerTable
          containers={filteredContainers}
          onRefresh={fetchContainers}
          selected={selected}
          onSelectedChange={setSelected}
        />
      </div>
    </div>
  );
}
