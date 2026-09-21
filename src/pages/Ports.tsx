import { useStore } from "@/store/useStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableActionsBar } from "@/components/dashboard/TableActionsBar";
import { useState, useMemo } from "react";
import { PlugsIcon } from "@phosphor-icons/react";

export function Ports() {
  const { containers } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  const allPorts = useMemo(() => {
    const list: any[] = [];
    containers.forEach(c => {
      if (c.Ports && c.Ports.length > 0) {
        c.Ports.forEach(p => {
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

  const filteredPorts = useMemo(() => {
    if (!searchQuery) return allPorts;
    const lowerQuery = searchQuery.toLowerCase();
    return allPorts.filter(p =>
      p.containerName.toLowerCase().includes(lowerQuery) ||
      (p.publicPort && p.publicPort.toString().includes(lowerQuery)) ||
      p.privatePort.toString().includes(lowerQuery)
    );
  }, [allPorts, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Port Forwarding</h2>
        <p className="text-muted-foreground">View all exposed and published ports across your containers.</p>
      </div>

      <TableActionsBar
        itemName="ports"
        searchPlaceholder="Search by port or container name..."
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalCount={allPorts.length}
        filteredCount={filteredPorts.length}
      />

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Container</TableHead>
              <TableHead>Binding</TableHead>
              <TableHead>Protocol</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPorts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <PlugsIcon size={48} className="mx-auto mb-4 opacity-20" />
                  No ports found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredPorts.map((p, i) => (
                <TableRow key={`${p.containerId}-${i}`}>
                  <TableCell className="font-medium">{p.containerName}</TableCell>
                  <TableCell>
                    {p.publicPort ? (
                      <span className="font-mono text-sm bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                        <span className="text-muted-foreground">{p.ip}:</span>
                        <span className="text-primary font-bold">{p.publicPort}</span>
                        <span className="text-muted-foreground">{p.privatePort}</span>
                      </span>
                    ) : (
                      <span className="font-mono text-sm text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                        {p.privatePort} (Internal)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase font-mono text-[10px] tracking-wider">{p.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {p.publicPort ? (
                      <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-none border-0">Published</Badge>
                    ) : (
                      <Badge variant="secondary" className="shadow-none border-0">Exposed</Badge>
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
