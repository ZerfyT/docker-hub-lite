import { useStore } from "@/store/useStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableActionsBar } from "@/components/dashboard/TableActionsBar";
import { useState, useMemo } from "react";
import { PlugsIcon, ArrowSquareOutIcon } from "@phosphor-icons/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useNavigate } from "react-router-dom";

export function Ports() {
  const navigate = useNavigate();
  const { containers } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  const allPorts = useMemo(() => {
    const list: any[] = [];
    containers.forEach((c) => {
      if (c.Ports && c.Ports.length > 0) {
        c.Ports.forEach((p) => {
          list.push({
            containerId: c.Id,
            containerName: c.Names[0]?.replace("/", "") || "Unknown",
            ip: p.IP || "0.0.0.0",
            publicPort: p.PublicPort,
            privatePort: p.PrivatePort,
            type: p.Type,
          });
        });
      }
    });
    // Sort so published ports are at the top
    return list.sort((a, b) => {
      if (a.publicPort && !b.publicPort) return -1;
      if (!a.publicPort && b.publicPort) return 1;
      return 0;
    });
  }, [containers]);

  const publishedCount = allPorts.filter((p) => p.publicPort).length;
  const internalCount = allPorts.length - publishedCount;

  const filteredPorts = useMemo(() => {
    if (!searchQuery) return allPorts;
    const lowerQuery = searchQuery.toLowerCase();
    return allPorts.filter(
      (p) =>
        p.containerName.toLowerCase().includes(lowerQuery) ||
        (p.publicPort && p.publicPort.toString().includes(lowerQuery)) ||
        p.privatePort.toString().includes(lowerQuery)
    );
  }, [allPorts, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Port Forwarding</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Active network mappings, exposed socket bindings, and published host ports.
        </p>
      </div>

      {/* Modern Telemetry Banner */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Port Forwarding Inventory</span>
            <span className="font-mono text-foreground font-bold">{allPorts.length} Mapped</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 text-emerald-500 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {publishedCount} Published
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-muted-foreground">{internalCount} Internal</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Host Loopback Binding</span>
            <span className="font-mono text-foreground font-bold">127.0.0.1</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Directly accessible via localhost in your web browser or API clients
          </p>
        </div>
      </div>

      <TableActionsBar
        itemName="ports"
        searchPlaceholder="Search by port number or container name..."
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalCount={allPorts.length}
        filteredCount={filteredPorts.length}
      />

      <div
        tabIndex={0}
        role="region"
        aria-label="Ports list"
        className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs overflow-x-auto text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
      >
        <Table>
          <TableHeader className="bg-muted/50 backdrop-blur-xs sticky top-0 z-10">
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="font-semibold text-foreground min-w-[180px]">Container</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[220px]">Host & Container Binding</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[100px]">Protocol</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[120px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPorts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border/60">
                      <PlugsIcon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No port bindings found</p>
                    <p className="text-xs text-muted-foreground">
                      Containers with mapped ports will appear here automatically.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPorts.map((p, i) => (
                <TableRow
                  key={`${p.containerId}-${i}`}
                  className="hover:bg-muted/40 transition-colors border-border/50"
                >
                  <TableCell
                    className="font-medium cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/containers/${p.containerId}`)}
                  >
                    <span className="font-semibold text-foreground hover:underline">
                      {p.containerName}
                    </span>
                  </TableCell>
                  <TableCell>
                    {p.publicPort ? (
                      <button
                        type="button"
                        onClick={() => openUrl(`http://localhost:${p.publicPort}`)}
                        className="font-mono text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md inline-flex items-center gap-1.5 hover:bg-primary/20 transition-colors group"
                        title="Open mapped port in browser"
                      >
                        <span className="opacity-70">{p.ip}:</span>
                        <span className="font-bold underline">{p.publicPort}</span>
                        <span className="opacity-70">&rarr; {p.privatePort}</span>
                        <ArrowSquareOutIcon className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded-md border border-border/50">
                        {p.privatePort} (Container Internal)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="uppercase font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50 tracking-wider">
                      {p.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    {p.publicPort ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Published</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/50">
                        <span>Exposed</span>
                      </span>
                    )}
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
