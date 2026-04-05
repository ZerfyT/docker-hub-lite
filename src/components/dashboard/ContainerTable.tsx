import { Button } from "@/components/ui/button";
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
  Info,
  Files,
  Pause,
  ArrowClockwise,
  Browsers,
  Copy,
  Trash
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

// Define the shape based on bollard's ContainerSummary
export interface Container {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Ports?: { PrivatePort: number; PublicPort?: number; Type: string }[];
}

interface ContainerTableProps {
  containers: Container[];
  onRefresh: () => void;
  selected: string[];
  onSelectedChange: (selected: string[]) => void;
}

export function ContainerTable({ containers, onRefresh, selected, onSelectedChange }: ContainerTableProps) {
  const navigate = useNavigate();

  const runAction = async (action: string, id: string) => {
    try {
      await invoke(action, { id });
      onRefresh();
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      alert(`Error: ${error}`);
    }
  };

  const handleTerminal = async (id: string) => {
    try {
      const command = Command.create('sh', ['-c', `x-terminal-emulator -e docker exec -it ${id} sh || gnome-terminal -- docker exec -it ${id} sh`]);
      await command.spawn();
    } catch (error) {
      console.error("Failed to open terminal:", error);
    }
  };

  const copyDockerRun = async (id: string) => {
    try {
      const rawInspect = await invoke<string>("inspect_container", { id });
      const inspect = JSON.parse(rawInspect);
      const image = inspect.Config.Image;
      const cmd = `docker run -d ${image}`;
      await navigator.clipboard.writeText(cmd);
      alert("Basic docker run command copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const openInBrowser = async (container: Container) => {
    // Find first public port
    const port = container.Ports?.find(p => p.PublicPort);
    if (port && port.PublicPort) {
      // Use tauri plugin opener or just raw command
      const url = `http://localhost:${port.PublicPort}`;
      try {
        const cmd = Command.create('sh', ['-c', `xdg-open ${url} || open ${url}`]);
        await cmd.spawn();
      } catch (e) {
        console.error("Failed to open browser", e);
      }
    } else {
      alert("No public ports mapped for this container.");
    }
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      onSelectedChange(containers.map(c => c.Id));
    } else {
      onSelectedChange([]);
    }
  };

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selected.includes(id)) {
      onSelectedChange(selected.filter(s => s !== id));
    } else {
      onSelectedChange([...selected, id]);
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
            <TableHead className="w-[200px] font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Container ID</TableHead>
            <TableHead className="font-semibold">Image</TableHead>
            <TableHead className="font-semibold">Port(s)</TableHead>
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
            containers.map((c) => {
              const shortId = c.Id.substring(0, 12);
              const isRunning = c.State === "running";
              const isPaused = c.State === "paused";
              const isSelected = selected?.includes(c.Id);

              return (
                <TableRow key={c.Id} className={`hover:bg-muted/30 transition-colors group cursor-pointer ${isSelected ? "bg-primary/5" : ""}`} onClick={() => navigate(`/containers/${c.Id}`)}>
                  <TableCell className="pl-4" onClick={(e) => toggleSelection(e, c.Id)}>
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                  </TableCell>
                  <TableCell className="font-medium border-l border-transparent">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : isPaused ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                      {c.Names[0]?.replace("/", "") || "Unnamed"}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono">
                    {shortId}
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[150px]" title={c.Image}>
                    {c.Image}
                  </TableCell>
                  <TableCell className="text-primary font-mono hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); openInBrowser(c); }}>
                    {c.Ports?.map(p => p.PublicPort ? `${p.PublicPort}:${p.PrivatePort}` : p.PrivatePort).join(", ") || "-"}
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
                            <Info className="mr-2 h-4 w-4" /> View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyDockerRun(c.Id)}>
                            <Copy className="mr-2 h-4 w-4" /> Copy docker run
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTerminal(c.Id)}>
                            <TerminalIcon className="mr-2 h-4 w-4" /> Open in terminal
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/containers/${c.Id}?tab=files`)}>
                            <Files className="mr-2 h-4 w-4" /> View files
                          </DropdownMenuItem>
                          {isRunning && (
                            <DropdownMenuItem onClick={() => runAction("pause_container", c.Id)}>
                              <Pause className="mr-2 h-4 w-4" /> Pause
                            </DropdownMenuItem>
                          )}
                          {isPaused && (
                            <DropdownMenuItem onClick={() => runAction("unpause_container", c.Id)}>
                              <PlayIcon className="mr-2 h-4 w-4" /> Unpause
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => runAction("restart_container", c.Id)}>
                            <ArrowClockwise className="mr-2 h-4 w-4" /> Restart
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openInBrowser(c)}>
                            <Browsers className="mr-2 h-4 w-4" /> Open with browser
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => runAction("remove_container", c.Id)}>
                            <Trash className="mr-2 h-4 w-4" /> Delete container
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
    </div>
  );
}
