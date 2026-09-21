import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActivityIcon, PauseIcon, PlayIcon, TrashIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      setEvents(prev => {
        const newEvents = [payload, ...prev];
        return newEvents.slice(0, 1000); // Keep last 1000 events
      });
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const filteredEvents = events.filter(e => {
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
    switch(action) {
      case "start": case "create": case "connect": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "die": case "kill": case "stop": case "destroy": case "disconnect": return "bg-destructive/10 text-destructive border-destructive/20";
      case "pull": case "push": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-muted text-muted-foreground border-border/50";
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Event Stream</h2>
          <p className="text-muted-foreground">Real-time log of Docker engine activity.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant={isPaused ? "default" : "secondary"} onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? <><PlayIcon className="mr-2" /> Resume</> : <><PauseIcon className="mr-2" /> Pause</>}
          </Button>
          <Button variant="outline" onClick={() => setEvents([])}>
            <TrashIcon className="mr-2" /> Clear
          </Button>
        </div>
      </div>

      <div className="flex items-center w-full max-w-md shrink-0">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter events..."
            className="pl-9 bg-background border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex-1 min-h-[500px]">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead className="w-[120px]">Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Attributes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                  <ActivityIcon size={48} className="mx-auto mb-4 opacity-20" />
                  {events.length === 0 ? "Listening for Docker events..." : "No events match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((e, i) => (
                <TableRow key={i} className="font-mono text-sm hover:bg-muted/30">
                  <TableCell className="text-muted-foreground">
                    {new Date(e.timeNano ? e.timeNano / 1000000 : e.time * 1000).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase text-[10px] tracking-wider">{e.Type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`uppercase text-[10px] tracking-wider ${getActionColor(e.Action)}`}>
                      {e.Action}
                    </Badge>
                  </TableCell>
                  <TableCell className="truncate max-w-[200px]" title={e.Actor?.ID}>
                    {e.Actor?.Attributes?.name || (e.Actor?.ID?.substring(0, 12) ?? "N/A")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-[300px]">
                    {e.Actor?.Attributes ? Object.entries(e.Actor.Attributes)
                      .filter(([k]) => k !== "name")
                      .map(([k, v]) => `${k}=${v}`).join(", ") : ""}
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
