import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableActionsBar } from "@/components/dashboard/TableActionsBar";
import { ActivityIcon, PauseIcon, PlayIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [search, setSearch] = useState("");
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  useEffect(() => {
    invoke("start_event_stream").catch(console.error);

    const unlisten = listen("docker-event", (event: any) => {
      if (isPausedRef.current) return;

      const payload = event.payload;
      setEvents((prev) => {
        const newEvents = [payload, ...prev];
        return newEvents.slice(0, 500); // Keep last 500 events to maintain low memory usage
      });
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const filteredEvents = events.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (e.Action && e.Action.toLowerCase().includes(s)) ||
      (e.Type && e.Type.toLowerCase().includes(s)) ||
      (e.Actor?.ID && e.Actor.ID.toLowerCase().includes(s)) ||
      (e.Actor?.Attributes?.name && e.Actor.Attributes.name.toLowerCase().includes(s))
    );
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case "start":
      case "create":
      case "connect":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "die":
      case "kill":
      case "stop":
      case "destroy":
      case "disconnect":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "pull":
      case "push":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground border-border/50";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Event Stream
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time audit log of Docker daemon lifecycle events, image pulls, and state changes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isPaused ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="text-xs gap-1.5 h-8"
          >
            {isPaused ? (
              <>
                <PlayIcon className="h-3.5 w-3.5 fill-current" />
                Resume Stream
              </>
            ) : (
              <>
                <PauseIcon className="h-3.5 w-3.5 fill-current" />
                Pause Stream
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEvents([])}
            className="text-xs gap-1.5 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Clear event buffer"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Modern Telemetry Banner */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Event Ingestion Stream</span>
            <span className="font-mono text-foreground font-bold">{events.length} Buffered</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span
              className={`inline-flex items-center gap-1.5 font-semibold ${
                isPaused ? "text-amber-500" : "text-emerald-500"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPaused ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                }`}
              />
              {isPaused ? "Paused" : "Live Streaming"}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-muted-foreground">FIFO buffer (1,000 max)</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Daemon Event Pipeline</span>
            <span className="font-mono text-foreground font-bold">docker.events()</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Subscribed to Bollard socket event channel for real-time reactivity
          </p>
        </div>
      </div>

      <TableActionsBar
        itemName="events"
        searchPlaceholder="Filter events by action, type, or container..."
        searchQuery={search}
        setSearchQuery={setSearch}
        totalCount={events.length}
        filteredCount={filteredEvents.length}
      />

      <div
        tabIndex={0}
        role="region"
        aria-label="Docker events stream"
        className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs overflow-x-auto text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
      >
        <Table>
          <TableHeader className="bg-muted/50 backdrop-blur-xs sticky top-0 z-10">
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="font-semibold text-foreground min-w-[160px]">Timestamp</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[100px]">Type</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[100px]">Action</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[180px]">Target Resource</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[240px]">Attributes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border/60">
                      <ActivityIcon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {events.length === 0 ? "Listening for Docker events..." : "No matching events"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Start, stop, or inspect containers to observe live engine broadcasts.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((e, i) => (
                <TableRow
                  key={i}
                  className="font-mono text-xs hover:bg-muted/40 transition-colors border-border/50"
                >
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(
                      e.timeNano ? e.timeNano / 1000000 : e.time * 1000
                    ).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </TableCell>
                  <TableCell>
                    <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50 tracking-wider">
                      {e.Type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`uppercase text-[10px] px-1.5 py-0.5 rounded font-semibold border ${getActionColor(
                        e.Action
                      )}`}
                    >
                      {e.Action}
                    </span>
                  </TableCell>
                  <TableCell className="truncate max-w-[200px] font-semibold text-foreground" title={e.Actor?.ID}>
                    {e.Actor?.Attributes?.name || (e.Actor?.ID?.substring(0, 12) ?? "N/A")}
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground truncate max-w-[300px]">
                    {e.Actor?.Attributes
                      ? Object.entries(e.Actor.Attributes)
                          .filter(([k]) => k !== "name")
                          .map(([k, v]) => `${k}=${v}`)
                          .join(", ")
                      : ""}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
