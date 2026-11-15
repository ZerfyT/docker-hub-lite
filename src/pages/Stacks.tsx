import { useStore } from "@/store/useStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableActionsBar } from "@/components/dashboard/TableActionsBar";
import { Fragment, useState, useMemo } from "react";
import { StackIcon, CubeIcon, PlayIcon, SquareIcon, ArrowClockwiseIcon, CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

export function Stacks() {
  const navigate = useNavigate();
  const { containers, fetchContainers } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStack, setExpandedStack] = useState<string | null>(null);

  const handleStackAction = async (e: React.MouseEvent, stackContainers: any[], action: string, stackName: string) => {
    e.stopPropagation();
    try {
      toast.loading(`${action.replace("_container", "")}ing stack ${stackName}...`, { id: `stack-${stackName}` });
      const promises = stackContainers.map(c => invoke(action, { id: c.Id }));
      await Promise.allSettled(promises);
      await fetchContainers();
      toast.success(`Action applied to stack ${stackName}`, { id: `stack-${stackName}` });
    } catch (err) {
      toast.error(`Failed to update stack: ${err}`, { id: `stack-${stackName}` });
    }
  };

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
      status: items.every(c => c.State === "running")
        ? "Running"
        : items.some(c => c.State === "running")
        ? "Partially Running"
        : "Stopped"
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [containers]);

  const totalComposeContainers = stacks.reduce((acc, s) => acc + s.totalCount, 0);
  const runningComposeContainers = stacks.reduce((acc, s) => acc + s.runningCount, 0);

  const filteredStacks = useMemo(() => {
    if (!searchQuery) return stacks;
    const lowerQuery = searchQuery.toLowerCase();
    return stacks.filter(s => s.name.toLowerCase().includes(lowerQuery));
  }, [stacks, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Compose Stacks</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Multi-container workloads grouped by Docker Compose projects.
        </p>
      </div>

      {/* Modern Telemetry Banner */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Compose Projects</span>
            <span className="font-mono text-foreground font-bold">{stacks.length} Stack(s)</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 text-emerald-500 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {stacks.filter(s => s.status === "Running").length} Fully Running
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-muted-foreground">
              {stacks.filter(s => s.status !== "Running").length} Standby / Degraded
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Aggregated Services</span>
            <span className="font-mono text-foreground font-bold">
              {runningComposeContainers} / {totalComposeContainers} Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Total containers managed under Docker Compose definitions
          </p>
        </div>
      </div>

      <TableActionsBar
        itemName="stacks"
        searchPlaceholder="Search by stack project name..."
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalCount={stacks.length}
        filteredCount={filteredStacks.length}
      />

      <div
        tabIndex={0}
        role="region"
        aria-label="Compose stacks table"
        className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs overflow-x-auto text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
      >
        <Table>
          <TableHeader className="bg-muted/50 backdrop-blur-xs sticky top-0 z-10">
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="font-semibold text-foreground min-w-[200px]">Stack Project</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[140px]">Status</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[120px]">Containers</TableHead>
              <TableHead className="text-right font-semibold text-foreground pr-4 min-w-[160px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStacks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border/60">
                      <StackIcon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No Compose stacks found</p>
                    <p className="text-xs text-muted-foreground">
                      Containers with docker-compose labels will automatically group into stacks here.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStacks.map((s) => (
                <Fragment key={s.name}>
                  <TableRow
                    className="hover:bg-muted/40 transition-colors cursor-pointer border-border/50 group"
                    onClick={() => setExpandedStack(expandedStack === s.name ? null : s.name)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                          <StackIcon className="w-4 h-4" weight="fill" />
                        </div>
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {s.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.status === "Running" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Running</span>
                        </span>
                      )}
                      {s.status === "Partially Running" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Degraded</span>
                        </span>
                      )}
                      {s.status === "Stopped" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                          <span>Stopped</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                        <span className={`font-bold ${s.runningCount > 0 ? "text-emerald-500" : "text-foreground"}`}>
                          {s.runningCount}
                        </span>
                        <span>/</span>
                        <span>{s.totalCount} active</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border/50">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10 rounded-md"
                            onClick={(e) => handleStackAction(e, s.containers, "start_container", s.name)}
                            title="Start all stack containers"
                          >
                            <PlayIcon className="h-3.5 w-3.5 fill-current" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                            onClick={(e) => handleStackAction(e, s.containers, "stop_container", s.name)}
                            title="Stop all stack containers"
                          >
                            <SquareIcon className="h-3.5 w-3.5 fill-current" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                            onClick={(e) => handleStackAction(e, s.containers, "restart_container", s.name)}
                            title="Restart all stack containers"
                          >
                            <ArrowClockwiseIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() => setExpandedStack(expandedStack === s.name ? null : s.name)}
                        >
                          <span>{expandedStack === s.name ? "Collapse" : "Expand"}</span>
                          {expandedStack === s.name ? (
                            <CaretUpIcon className="w-3 h-3" />
                          ) : (
                            <CaretDownIcon className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {expandedStack === s.name && (
                    <TableRow className="bg-muted/20 border-b border-border/60">
                      <TableCell colSpan={4} className="p-0">
                        <div className="p-3 pl-10 space-y-2">
                          {s.containers.map((c: any) => (
                            <div
                              key={c.Id}
                              className="flex items-center justify-between bg-card/80 p-2.5 rounded-lg border border-border/60 hover:border-primary/50 cursor-pointer transition-colors"
                              onClick={() => navigate(`/containers/${c.Id}`)}
                              title="Click to view container details"
                            >
                              <div className="flex items-center gap-2.5">
                                <CubeIcon size={16} className="text-primary" />
                                <span className="text-xs font-semibold hover:text-primary hover:underline">
                                  {c.Names[0]?.replace("/", "") || "Unknown"}
                                </span>
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                                    c.State === "running"
                                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                      : "bg-muted text-muted-foreground border-border/50"
                                  }`}
                                >
                                  {c.State}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground font-mono truncate max-w-[240px]">
                                {c.Image}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
