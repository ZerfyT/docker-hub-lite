import { Fragment, useState } from "react";
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
} from "@phosphor-icons/react";
import { invoke } from "@tauri-apps/api/core";
import { Command } from "@tauri-apps/plugin-shell";
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

export function ContainerTable({ containers, onRefresh, selected, onSelectedChange }: ContainerTableProps) {
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
      const command = Command.create('run-sh', ['-c', `x-terminal-emulator -e docker exec -it ${id} sh || gnome-terminal -- docker exec -it ${id} sh`]);
      await command.spawn();
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
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden text-sm">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="w-[40px] text-center pl-4">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead className="w-[180px] font-semibold">Name</TableHead>
            <TableHead className="font-semibold w-[120px]">IP Address</TableHead>
            <TableHead className="font-semibold w-[120px]">Image</TableHead>
            <TableHead className="font-semibold">Port(s)</TableHead>
            <TableHead className="font-semibold">Created</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {containers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No containers found.
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

              const createdDate = c.Created ? new Date(c.Created * 1000).toLocaleDateString() : "-";

              return (
                <TableRow key={c.Id} className={`hover:bg-muted/30 transition-colors group cursor-pointer ${isSelected ? "bg-primary/5" : ""}`} onClick={() => navigate(`/containers/${c.Id}`)}>
                    <TableCell className="pl-4" onClick={(e) => toggleSelection(e, c.Id)}>
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                    </TableCell>
                    <TableCell className="font-medium border-l border-transparent">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : isPaused ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                          <span className="truncate max-w-[150px]">{c.Names[0]?.replace("/", "") || "Unnamed"}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground ml-4">{shortId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="cursor-pointer hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(ip); toast.success("IP Copied!"); }} title="Copy IP">
                        {ip}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[120px]" title={c.Image}>
                      {c.Image}
                    </TableCell>
                    <TableCell className="text-primary hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); openInBrowser(c); }}>
                      {c.Ports?.map(p => p.PublicPort ? `${p.PublicPort}:${p.PrivatePort}` : p.PrivatePort).join(", ") || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {createdDate}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {c.Status}
                      </span>
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
