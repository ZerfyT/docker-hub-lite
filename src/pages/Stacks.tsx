import { useStore } from "@/store/useStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableActionsBar } from "@/components/dashboard/TableActionsBar";
import { useState, useMemo } from "react";
import { StackIcon, CubeIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function Stacks() {
  const { containers } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStack, setExpandedStack] = useState<string | null>(null);

  const stacks = useMemo(() => {
    const map = new Map<string, any[]>();
    
    containers.forEach(c => {
      const projectName = c.Labels?.["com.docker.compose.project"];
      if (projectName) {
        if (!map.has(projectName)) {
          map.set(projectName, []);
        }
        map.get(projectName)!.push(c);
      }
    });

    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      containers: items,
      runningCount: items.filter(c => c.State === "running").length,
      totalCount: items.length,
      status: items.every(c => c.State === "running") ? "Running" : (items.some(c => c.State === "running") ? "Partially Running" : "Stopped")
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [containers]);

  const filteredStacks = useMemo(() => {
    if (!searchQuery) return stacks;
    const lowerQuery = searchQuery.toLowerCase();
    return stacks.filter(s => s.name.toLowerCase().includes(lowerQuery));
  }, [stacks, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Compose Stacks</h2>
        <p className="text-muted-foreground">Manage and view containers grouped by their Docker Compose project.</p>
      </div>

      <TableActionsBar
        itemName="stacks"
        searchPlaceholder="Search by stack name..."
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalCount={stacks.length}
        filteredCount={filteredStacks.length}
      />

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Stack Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Containers</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStacks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <StackIcon size={48} className="mx-auto mb-4 opacity-20" />
                  No Docker Compose stacks found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStacks.map((s) => (
                <>
                  <TableRow key={s.name} className="group">
                    <TableCell className="font-medium text-base">
                      <div className="flex items-center gap-2">
                        <StackIcon className="text-muted-foreground" />
                        {s.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.status === "Running" && <Badge variant="default" className="bg-green-500/10 text-green-500 border-0 hover:bg-green-500/20">Running</Badge>}
                      {s.status === "Partially Running" && <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-0 hover:bg-yellow-500/20">Degraded</Badge>}
                      {s.status === "Stopped" && <Badge variant="outline" className="text-muted-foreground">Stopped</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-mono">
                        <span className={s.runningCount === s.totalCount ? "text-green-500" : "text-foreground"}>{s.runningCount}</span>
                        <span>/</span>
                        <span>{s.totalCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setExpandedStack(expandedStack === s.name ? null : s.name)}
                      >
                        {expandedStack === s.name ? "Hide" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {expandedStack === s.name && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={4} className="p-0 border-b">
                        <div className="p-4 pl-12 space-y-2">
                          {s.containers.map((c: any) => (
                            <div key={c.Id} className="flex items-center justify-between bg-background p-3 rounded-md border border-border/50">
                              <div className="flex items-center gap-3">
                                <CubeIcon size={16} className="text-muted-foreground" />
                                <span className="font-medium">{c.Names[0]?.replace("/", "") || "Unknown"}</span>
                                <Badge variant="outline" className="text-[10px] uppercase font-mono">{c.State}</Badge>
                              </div>
                              <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                                {c.Image}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
