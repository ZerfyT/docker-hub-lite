import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CubeIcon, ArrowsClockwiseIcon, MagnifyingGlassIcon, CopyIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

export function Logs() {
  const { containers, dockerState } = useStore();
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const runningCount = containers.filter((c) => c.State === "running").length;

  const fetchLogs = async (containerId: string) => {
    setIsRefreshing(true);
    try {
      const logData = await invoke<string>("get_container_logs", { id: containerId });
      const reversedLogs = logData
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .reverse();
      setLogs(reversedLogs);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setLogs([`Error fetching logs: ${error}`]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedContainer) {
      fetchLogs(selectedContainer);
    } else if (containers.length > 0) {
      // Auto-select first container
      setSelectedContainer(containers[0].Id);
    } else {
      setLogs([]);
    }
  }, [selectedContainer, containers]);

  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logs.join("\n"));
      toast.success("Logs copied to clipboard!");
    } catch {
      toast.error("Failed to copy logs");
    }
  };

  const getLogLineStyle = (line: string) => {
    const lower = line.toLowerCase();
    if (lower.includes("error") || lower.includes("fail") || lower.includes("fatal") || lower.includes("panic"))
      return "text-red-400";
    if (lower.includes("warn")) return "text-amber-400";
    if (lower.includes("info")) return "text-blue-400";
    if (lower.includes("success") || lower.includes("ready")) return "text-emerald-400";
    if (lower.includes("debug")) return "text-violet-400";
    return "text-neutral-300";
  };

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    return logs.filter((line) => line.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [logs, searchQuery]);

  const activeContainerObj = containers.find((c) => c.Id === selectedContainer);
  const activeContainerName =
    activeContainerObj?.Names?.[0]?.replace("/", "") || selectedContainer?.substring(0, 12) || "No container selected";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          System Logs Explorer
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Inspect standard output and standard error streams across all local containers.
        </p>
      </div>

      {/* Modern Telemetry Banner */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Daemon Logging Pipeline</span>
            <span className="font-mono text-foreground font-bold">{dockerState}</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span
              className={`inline-flex items-center gap-1.5 font-semibold ${
                dockerState === "Running" ? "text-emerald-500" : "text-destructive"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  dockerState === "Running" ? "bg-emerald-500 animate-pulse" : "bg-destructive"
                }`}
              />
              {dockerState === "Running" ? "Daemon Online" : "Daemon Disconnected"}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-muted-foreground">json-file driver</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Log Telemetry Sources</span>
            <span className="font-mono text-foreground font-bold">
              {runningCount} / {containers.length} Containers
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedContainer ? `Viewing streams for ${activeContainerName}` : "Select a container to inspect stdout/stderr"}
          </p>
        </div>
      </div>

      {/* Split View Explorer */}
      <div className="flex flex-1 gap-4 overflow-hidden min-h-[450px]">
        {/* Left Sidebar: Container List */}
        <div className="w-1/3 md:w-1/4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm flex flex-col overflow-hidden shadow-xs">
          <div className="p-3 border-b border-border/50 bg-muted/30 font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Containers</span>
            <span className="font-mono">{containers.length}</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {containers.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground font-mono">
                  No containers found
                </div>
              ) : (
                containers.map((c) => {
                  const name = c.Names?.[0]?.replace("/", "") || c.Id.substring(0, 12);
                  const isSelected = selectedContainer === c.Id;
                  const isRunning = c.State === "running";

                  return (
                    <button
                      key={c.Id}
                      type="button"
                      onClick={() => setSelectedContainer(c.Id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-all text-left group ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <CubeIcon className="h-4 w-4 shrink-0" weight={isSelected ? "fill" : "regular"} />
                        <span className="truncate">{name}</span>
                      </div>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isRunning ? "bg-emerald-500" : "bg-zinc-500"
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side: Log Console Viewer */}
        <div className="flex-1 rounded-xl border border-border/80 bg-zinc-950 flex flex-col overflow-hidden relative shadow-sm">
          {/* Header Toolbar */}
          <div className="flex items-center justify-between p-3 border-b border-border/10 bg-zinc-900/60 backdrop-blur-xs gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-200 truncate">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className="font-semibold text-primary">{activeContainerName}</span>
              <span className="text-neutral-500">({filteredLogs.length} lines)</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-40 sm:w-60">
                <MagnifyingGlassIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
                <Input
                  className="pl-8 pr-7 h-7 text-xs bg-zinc-900 border-zinc-800 text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-primary rounded-lg font-mono"
                  placeholder="Filter logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={!selectedContainer}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 text-neutral-500 hover:text-neutral-200"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-zinc-900 border-zinc-800 text-neutral-300 hover:bg-zinc-800 hover:text-white rounded-lg gap-1"
                onClick={copyLogs}
                disabled={!selectedContainer || logs.length === 0}
              >
                <CopyIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 bg-zinc-900 border-zinc-800 text-neutral-300 hover:bg-zinc-800 hover:text-white rounded-lg"
                onClick={() => selectedContainer && fetchLogs(selectedContainer)}
                disabled={!selectedContainer || isRefreshing}
                title="Refresh Logs"
              >
                <ArrowsClockwiseIcon className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Console Output Area */}
          <ScrollArea className="flex-1 w-full p-4">
            <div className="font-mono text-xs leading-relaxed break-all select-text">
              {!selectedContainer ? (
                <div className="text-neutral-500 italic">Select a container from the sidebar to view output.</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-neutral-500 italic">No logs available for this container.</div>
              ) : (
                filteredLogs.map((line, index) => (
                  <div key={index} className={`py-0.5 hover:bg-white/5 transition-colors px-1 rounded ${getLogLineStyle(line)}`}>
                    {line}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
