import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowsClockwiseIcon, MagnifyingGlassIcon, CopyIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

export function LogsTab({ containerId }: { containerId: string }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
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
    fetchLogs();
  }, [containerId]);

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
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden bg-zinc-950 relative rounded-b-md">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-border/10 bg-zinc-900/50">
        <div className="relative w-64">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-xs bg-zinc-900 border-zinc-800 text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
            placeholder="Filter logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs bg-zinc-900 border-zinc-800 text-neutral-300 hover:bg-zinc-800 hover:text-white" onClick={copyLogs}>
            <CopyIcon className="h-4 w-4 mr-1" /> Copy All
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-zinc-900 border-zinc-800 text-neutral-300 hover:bg-zinc-800 hover:text-white" onClick={fetchLogs} disabled={isRefreshing} title="Refresh Logs">
            <ArrowsClockwiseIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full h-full p-4">
        <div className="font-mono text-[13px] leading-relaxed break-all">
          {filteredLogs.length === 0 ? (
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
  );
}
