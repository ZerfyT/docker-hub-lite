import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";

export function LogsTab({ containerId }: { containerId: string }) {
  const [logs, setLogs] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = async () => {
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
    fetchLogs();
  }, [containerId]);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-t border-border/50 relative">
      {/* Small refresh button floating top right */}
      <div className="absolute top-2 right-4 z-10">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          onClick={fetchLogs}
          disabled={isRefreshing}
        >
          <ArrowsClockwiseIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <pre className="text-[13px] font-mono text-gray-300 whitespace-pre-wrap wrap-break-word leading-relaxed">
          {logs || "No logs available."}
        </pre>
      </ScrollArea>
    </div>
  );
}
