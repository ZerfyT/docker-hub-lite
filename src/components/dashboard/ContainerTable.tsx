import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play, Square, Terminal as TerminalIcon } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

// Define the shape based on bollard's ContainerSummary
export interface Container {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
}

interface ContainerTableProps {
  containers: Container[];
  onRefresh: () => void;
}

export function ContainerTable({ containers, onRefresh }: ContainerTableProps) {
  const startContainer = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await invoke("start_container", { id });
      onRefresh();
    } catch (error) {
      console.error("Failed to start:", error);
    }
  };

  const getStatusColor = (state: string) => {
    switch (state.toLowerCase()) {
      case "running":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "exited":
        return "bg-muted text-muted-foreground hover:bg-muted/80";
      case "error":
        return "bg-destructive/10 text-destructive hover:bg-destructive/20";
      default:
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="w-[250px] font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Image</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {containers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No containers found.
              </TableCell>
            </TableRow>
          ) : (
            containers.slice(0, 5).map((c) => (
              <TableRow key={c.Id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">
                  {c.Names[0]?.replace("/", "") || "Unnamed"}
                </TableCell>
                <TableCell className="text-muted-foreground truncate max-w-[200px]">
                  {c.Image}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`border-0 ${getStatusColor(c.State)}`}>
                    {c.State}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-2">
                    {c.Status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {c.State !== "running" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                        onClick={(e) => startContainer(c.Id, e)}
                        title="Start"
                      >
                        <Play className="h-4 w-4 fill-current" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Stop"
                      >
                        <Square className="h-4 w-4 fill-current" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Terminal"
                    >
                      <TerminalIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
