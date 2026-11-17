import { useState, useEffect, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowsClockwiseIcon,
  MagnifyingGlassIcon,
  CopyIcon,
  TrashIcon,
  PulseIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function LogsTab({ containerId }: { containerId: string }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [levelFilter, setLevelFilter] = useState<"all" | "error" | "warn">("all");
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchInitialLogs = async () => {
    setIsRefreshing(true);
    try {
      const logData = await invoke<string>("get_container_logs", { id: containerId });
      const lines = logData
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      setLogs(lines);
    } catch (error) {
      console.error("Failed to fetch initial logs:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialLogs();

    // Start background stream
    invoke("stream_container_logs", { id: containerId }).catch(console.error);

    let unlisten: (() => void) | undefined;
    listen<string>(`container-log-stream-${containerId}`, (event) => {
      const newLines = event.payload
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      setLogs((prev) => {
        const combined = [...prev, ...newLines];
        return combined.slice(-1000); // Retain last 1000 lines to keep memory lean
      });
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [containerId]);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

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
    if (lower.includes("warn")) return "text-yellow-400";
    if (lower.includes("info")) return "text-blue-400";
    if (lower.includes("success") || lower.includes("ready")) return "text-green-400";
    if (lower.includes("debug")) return "text-purple-400";
    return "text-neutral-300";
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((line) => {
      const lower = line.toLowerCase();
      if (levelFilter === "error") {
        if (!lower.includes("error") && !lower.includes("fail") && !lower.includes("fatal") && !lower.includes("panic")) {
          return false;
        }
      } else if (levelFilter === "warn") {
        if (!lower.includes("warn") && !lower.includes("error")) {
          return false;
        }
      }
      if (!searchQuery) return true;
      return lower.includes(searchQuery.toLowerCase());
    });
  }, [logs, searchQuery, levelFilter]);

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden bg-zinc-950 relative rounded-b-md">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-2.5 border-b border-border/10 bg-zinc-900/60 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-xs bg-zinc-900 border-zinc-800 text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-primary"
              placeholder="Filter logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1">
            <Badge
              variant={levelFilter === "all" ? "default" : "outline"}
              className="cursor-pointer text-[10px] px-2 py-0.5 border-zinc-800"
              onClick={() => setLevelFilter("all")}
            >
              All
            </Badge>
            <Badge
              variant={levelFilter === "error" ? "destructive" : "outline"}
              className="cursor-pointer text-[10px] px-2 py-0.5 border-zinc-800"
              onClick={() => setLevelFilter("error")}
            >
              Errors
            </Badge>
            <Badge
              variant={levelFilter === "warn" ? "secondary" : "outline"}
              className="cursor-pointer text-[10px] px-2 py-0.5 border-zinc-800"
              onClick={() => setLevelFilter("warn")}
            >
              Warnings
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 text-xs gap-1 border border-zinc-800 ${
              autoScroll ? "text-green-400 bg-green-500/10" : "text-neutral-400"
            }`}
            onClick={() => setAutoScroll(!autoScroll)}
            title="Auto-scroll to newest lines"
          >
            <PulseIcon className="h-3.5 w-3.5" />
            <span>Auto-scroll</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs bg-zinc-900 border-zinc-800 text-neutral-300 hover:text-white"
            onClick={copyLogs}
            title="Copy logs"
          >
            <CopyIcon className="h-3.5 w-3.5 mr-1" /> Copy
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs bg-zinc-900 border-zinc-800 text-neutral-300 hover:text-white"
            onClick={() => setLogs([])}
            title="Clear current view"
          >
            <TrashIcon className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-zinc-900 border-zinc-800 text-neutral-300 hover:text-white"
            onClick={fetchInitialLogs}
            disabled={isRefreshing}
            title="Force refresh"
          >
            <ArrowsClockwiseIcon className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Logs Viewport */}
      <ScrollArea className="flex-1 w-full h-full p-4" ref={scrollAreaRef}>
        <div className="font-mono text-[12px] leading-relaxed break-all select-text pb-6">
          {filteredLogs.length === 0 ? (
            <div className="text-neutral-500 italic py-8 text-center">
              {logs.length === 0 ? "Listening for container logs..." : "No logs match the filter."}
            </div>
          ) : (
            filteredLogs.map((line, index) => (
              <div key={index} className={`mb-0.5 ${getLogLineStyle(line)}`}>
                {line}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
