import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CubeIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";

export function Logs() {
  const { containers } = useStore();
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);
  const [logs, setLogs] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = async (containerId: string) => {
    setIsRefreshing(true);
    try {
      const logData = await invoke<string>("get_container_logs", { id: containerId });
      setLogs(logData);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setLogs(`Error fetching logs: ${error}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedContainer) {
      fetchLogs(selectedContainer);
    } else {
      setLogs("Select a container from the sidebar to view its logs.");
    }
  }, [selectedContainer]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Logs</h2>
        <p className="text-muted-foreground">Inspect raw standard output and error logs from your containers.</p>
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
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left truncate ${
                        isSelected 
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
        <div className="flex-1 border rounded-md bg-muted/10 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b bg-muted/20 text-foreground">
            <div className="font-mono text-sm font-medium">
              {selectedContainer 
                ? containers.find(c => c.Id === selectedContainer)?.Names?.[0]?.replace("/", "") || selectedContainer.substring(0, 12)
                : "No Container Selected"
              }
            </div>
            
            {selectedContainer && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                onClick={() => fetchLogs(selectedContainer)}
                disabled={isRefreshing}
              >
                <ArrowsClockwiseIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
          <ScrollArea className="flex-1 p-4">
            <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap wrap-break-word leading-relaxed">
              {logs || "No logs available."}
            </pre>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
