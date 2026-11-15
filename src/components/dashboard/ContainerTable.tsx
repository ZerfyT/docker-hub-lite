import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlayIcon,
  SquareIcon,
  TerminalIcon,
  DotsThreeVertical,
  InfoIcon,
  Files,
  PauseIcon,
  ArrowClockwiseIcon,
  Browsers,
  CopyIcon,
  TrashIcon,
  CubeIcon,
} from "@phosphor-icons/react";
import { invoke } from "@tauri-apps/api/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTablePagination } from "./DataTablePagination";

// Define the shape based on bollard's ContainerSummary
export interface Container {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Created: number;
  Ports?: { PrivatePort: number; PublicPort?: number; Type: string }[];
  NetworkSettings?: { Networks: Record<string, { IPAddress: string }> };
}

interface ContainerTableProps {
  containers: Container[];
  onRefresh: () => void;
  selected?: string[];
  onSelectedChange?: (selected: string[]) => void;
}

export function ContainerTable({ containers, onRefresh, selected = [], onSelectedChange }: ContainerTableProps) {
  const navigate = useNavigate();
  const [containerToDelete, setContainerToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.ceil(containers.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedContainers = containers.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const runAction = async (action: string, id: string) => {
    try {
      await invoke(action, { id });
      toast.success(`Success: ${action}`);
      onRefresh();
    } catch (error) {
      const msg = `Error: Failed to ${action}, ${error}`;
      console.error(msg);
      toast.error(msg);
    }
  };

  const handleTerminal = async (id: string) => {
    try {
      await invoke("open_container_terminal", { id });
      toast.info("Opening terminal session...");
    } catch (error) {
      const msg = `Error: Failed to open terminal, ${error}`;
      console.error(msg);
      toast.error(msg);
    }
  };

  const copyDockerRun = async (id: string) => {
    try {
      const rawInspect = await invoke<string>("inspect_container", { id });
      const inspect = JSON.parse(rawInspect);
      const image = inspect.Config.Image;
      const cmd = `docker run -d ${image}`;
      await navigator.clipboard.writeText(cmd);
      toast.success("Docker run command copied to clipboard!");
    } catch (error) {
      const msg = `Error: Failed to copy docker run command, ${error}`;
      console.error(msg);
      toast.error(msg);
    }
  };

  const openInBrowser = async (container: Container) => {
    // Find first public port
    const port = container.Ports?.find(p => p.PublicPort);
    if (port && port.PublicPort) {
      const url = `http://localhost:${port.PublicPort}`;
      try {
        await openUrl(url);
      } catch (error) {
        const msg = `Error: Failed to open browser, ${error}`;
        console.error(msg);
        toast.error(msg);
      }
    } else {
      toast.error("Error: No public ports mapped for this container.");
    }
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      onSelectedChange?.(containers.map(c => c.Id));
    } else {
      onSelectedChange?.([]);
    }
  };

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selected?.includes(id)) {
      onSelectedChange?.(selected.filter(s => s !== id));
    } else {
      onSelectedChange?.([...selected, id]);
    }
  };

  const allSelected = containers.length > 0 && selected?.length === containers.length;
  const someSelected = selected?.length > 0 && selected?.length < containers.length;

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Containers list"
      className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs overflow-x-auto text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
    >
      <Table>
        <TableHeader className="bg-muted/50 backdrop-blur-xs sticky top-0 z-10">
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="w-[44px] text-center pl-4">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={toggleAll}
                aria-label="Select all containers"
              />
            </TableHead>
            <TableHead className="font-semibold text-foreground min-w-[180px]">Name & ID</TableHead>
            <TableHead className="font-semibold text-foreground min-w-[120px]">IP Address</TableHead>
            <TableHead className="font-semibold text-foreground min-w-[160px]">Image</TableHead>
            <TableHead className="font-semibold text-foreground min-w-[120px]">Ports</TableHead>
            <TableHead className="font-semibold text-foreground min-w-[100px]">Created</TableHead>
            <TableHead className="font-semibold text-foreground min-w-[140px]">Status</TableHead>
            <TableHead className="text-right font-semibold text-foreground pr-4 min-w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {containers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border/60">
                    <CubeIcon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No containers found</p>
                  <p className="text-xs text-muted-foreground">
                    Launch a new container or deploy a ready-made stack from Dev Starters.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            paginatedContainers.map((c) => {
              const shortId = c.Id.substring(0, 12);
              const isRunning = c.State === "running";
              const isPaused = c.State === "paused";
              const isSelected = selected?.includes(c.Id);

              const networks = c.NetworkSettings?.Networks ? Object.values(c.NetworkSettings.Networks) : [];
              const ip = networks.find(n => n.IPAddress)?.IPAddress || "-";

              const createdDate = c.Created ? new Date(c.Created * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "-";

              return (
                <TableRow
                  key={c.Id}
                  className={`hover:bg-muted/40 transition-colors group cursor-pointer border-border/50 ${
                    isSelected ? "bg-primary/8 hover:bg-primary/12" : ""
                  }`}
                  onClick={() => navigate(`/containers/${c.Id}`)}
                >
                    <TableCell className="pl-4" onClick={(e) => toggleSelection(e, c.Id)}>
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isRunning ? 'bg-emerald-500 shadow-xs' : isPaused ? 'bg-amber-500' : 'bg-zinc-500'}`}></span>
                          <span className="font-semibold text-foreground truncate max-w-[160px] group-hover:text-primary transition-colors">
                            {c.Names[0]?.replace("/", "") || "Unnamed"}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground ml-4">
                          {shortId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {ip !== "-" ? (
                        <span
                          className="cursor-pointer hover:text-primary transition-colors hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(ip);
                            toast.success("IP copied!");
                          }}
                          title="Click to copy IP"
                        >
                          {ip}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs truncate max-w-[160px]" title={c.Image}>
                      <span className="bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">
                        {c.Image}
                      </span>
                    </TableCell>
                    <TableCell>
                      {c.Ports && c.Ports.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.Ports.filter(p => p.PublicPort).map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openInBrowser(c);
                              }}
                              className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1"
                              title="Open mapped port in browser"
                            >
                              <span>{p.PublicPort}</span>
                              <Browsers className="w-2.5 h-2.5 opacity-70" />
                            </button>
                          ))}
                          {c.Ports.every(p => !p.PublicPort) && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {c.Ports[0].PrivatePort}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {createdDate}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                            isRunning
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : isPaused
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isRunning
                                ? "bg-emerald-500 animate-pulse"
                                : isPaused
                                ? "bg-amber-500"
                                : "bg-zinc-400"
                            }`}
                          />
                          <span className="capitalize">{c.State}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                        {isRunning ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => runAction("stop_container", c.Id)}
                            title="Stop"
                          >
                            <SquareIcon className="h-4 w-4 fill-current" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary/80"
                            onClick={() => runAction("start_container", c.Id)}
                            title="Start"
                          >
                            <PlayIcon className="h-4 w-4 fill-current" />
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <DotsThreeVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => navigate(`/containers/${c.Id}`)}>
                              <InfoIcon className="mr-2 h-4 w-4" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyDockerRun(c.Id)}>
                              <CopyIcon className="mr-2 h-4 w-4" /> Copy docker run
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTerminal(c.Id)}>
                              <TerminalIcon className="mr-2 h-4 w-4" /> Open in terminal
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => runAction("commit_container", c.Id)}>
                              <Files className="mr-2 h-4 w-4" /> Commit as Image
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/containers/${c.Id}?tab=files`)}>
                              <Files className="mr-2 h-4 w-4" /> View files
                            </DropdownMenuItem>
                            {isRunning && (
                              <DropdownMenuItem onClick={() => runAction("pause_container", c.Id)}>
                                <PauseIcon className="mr-2 h-4 w-4" /> Pause
                              </DropdownMenuItem>
                            )}
                            {isPaused && (
                              <DropdownMenuItem onClick={() => runAction("unpause_container", c.Id)}>
                                <PlayIcon className="mr-2 h-4 w-4" /> Unpause
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => runAction("restart_container", c.Id)}>
                              <ArrowClockwiseIcon className="mr-2 h-4 w-4" /> Restart
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openInBrowser(c)}>
                              <Browsers className="mr-2 h-4 w-4" /> Open with browser
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {isRunning && (
                              <DropdownMenuItem className="text-amber-600 focus:text-amber-600" onClick={() => runAction("kill_container", c.Id)}>
                                <SquareIcon className="mr-2 h-4 w-4" /> Kill container (Force)
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setContainerToDelete(c.Id)}>
                              <TrashIcon className="mr-2 h-4 w-4" /> Delete container
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
      {containers.length > 0 && (
        <DataTablePagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          setPageSize={setPageSize}
          setCurrentPage={setCurrentPage}
        />
      )}
      <AlertDialog open={!!containerToDelete} onOpenChange={(open) => !open && setContainerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the container. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (containerToDelete) {
                  runAction("remove_container", containerToDelete);
                  setContainerToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
