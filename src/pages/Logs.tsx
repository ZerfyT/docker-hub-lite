import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CubeIcon, ArrowsClockwiseIcon, MagnifyingGlassIcon, CopyIcon, InfoIcon } from "@phosphor-icons/react";
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

  const fetchLogs = async (containerId: string) => {
    setIsRefreshing(true);
    try {
      const logData = await invoke<string>("get_container_logs", { id: containerId });
      const reversedLogs = logData
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
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
    } else {
      setLogs([]);
    }
  }, [selectedContainer]);

  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logs.join('\n'));
      toast.success("Logs copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy logs");
    }
  };

  const getLogLineStyle = (line: string) => {
    const lower = line.toLowerCase();
    if (lower.includes('error') || lower.includes('fail') || lower.includes('fatal') || lower.includes('panic')) return 'text-red-400';
    if (lower.includes('warn')) return 'text-yellow-400';
    if (lower.includes('info')) return 'text-blue-400';
    if (lower.includes('success') || lower.includes('ready')) return 'text-green-400';
    if (lower.includes('debug')) return 'text-purple-400';
    return 'text-neutral-300';
  };

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    return logs.filter(line => line.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [logs, searchQuery]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex flex-col gap-2 relative">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Logs</h2>
        </div>
      </div>

      <div className="flex items-center gap-16 mb-4 mt-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold flex items-center gap-1.5">
            Docker Daemon <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="text-primary font-medium text-sm mt-1 flex gap-1 items-center">
            {dockerState === "Running" ? (
              <span className="text-green-500">Healthy</span>
            ) : (
              <span className="text-red-500">Disconnected</span>
            )}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold flex items-center gap-1.5">
            Active Sources <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="text-primary font-medium text-sm mt-1 flex gap-1 items-center">
            {containers.filter(c => c.State === "running").length} Running Containers
          </span>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Sidebar: Container List */}
        <div className="w-1/3 md:w-1/4 border rounded-md bg-background flex flex-col">
          <div className="p-3 border-b bg-muted/20 font-medium text-sm">
            Containers ({containers.length})
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {containers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No containers</div>
              ) : (
                containers.map((c) => {
                  const name = c.Names?.[0]?.replace("/", "") || c.Id.substring(0, 12);
                  const isSelected = selectedContainer === c.Id;

                  return (
                    <button
                      key={c.Id}
                      onClick={() => setSelectedContainer(c.Id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left truncate ${isSelected
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      <CubeIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side: Log Viewer */}
        <div className="flex-1 border rounded-md bg-zinc-950 flex flex-col overflow-hidden relative">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-3 border-b border-border/10 bg-zinc-900/50">
            <div className="text-sm font-medium text-neutral-200 truncate flex-1 pr-4">
              {selectedContainer
                ? containers.find(c => c.Id === selectedContainer)?.Names?.[0]?.replace("/", "") || selectedContainer.substring(0, 12)
                : "No Container Selected"
              }
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48 lg:w-64">
                <MagnifyingGlassIcon className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 h-8 text-xs bg-zinc-900 border-zinc-800 text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
                  placeholder="Filter logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={!selectedContainer}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs bg-zinc-900 border-zinc-800 text-neutral-300 hover:bg-zinc-800 hover:text-white" 
                onClick={copyLogs}
                disabled={!selectedContainer || logs.length === 0}
              >
                <CopyIcon className="h-4 w-4 mr-1" /> Copy All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 bg-zinc-900 border-zinc-800 text-neutral-300 hover:bg-zinc-800 hover:text-white" 
                onClick={() => selectedContainer && fetchLogs(selectedContainer)} 
                disabled={!selectedContainer || isRefreshing} 
                title="Refresh Logs"
              >
                <ArrowsClockwiseIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 w-full h-full p-4">
            <div className="font-mono text-[13px] leading-relaxed break-all">
              {!selectedContainer ? (
                <div className="text-neutral-500 italic">Select a container from the sidebar to view its logs.</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-neutral-500 italic">No logs available.</div>
              ) : (
                filteredLogs.map((line, index) => (
                  <div key={index} className={`mb-1 ${getLogLineStyle(line)}`}>
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
