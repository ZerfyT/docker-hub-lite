import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import { TrashIcon, DotsThreeVertical, CopyIcon, NetworkIcon } from "@phosphor-icons/react";
import { invoke } from "@tauri-apps/api/core";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTablePagination } from "./DataTablePagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Network {
  Id: string;
  Name: string;
  Driver: string;
  Scope: string;
  IPAM?: { Config?: { Subnet?: string; Gateway?: string }[] };
  Attachable?: boolean;
}

interface NetworkTableProps {
  networks: Network[];
  onRefresh: () => void;
  selected?: string[];
  onSelectedChange?: (selected: string[]) => void;
}

export function NetworkTable({ networks, onRefresh, selected = [], onSelectedChange }: NetworkTableProps) {
  const [networkToDelete, setNetworkToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.ceil(networks.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages) || 1;
  
  const paginatedNetworks = networks.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const removeNetwork = async (id: string) => {
    try {
      await invoke("remove_network", { id });
      toast.success("Network removed successfully");
      onRefresh();
    } catch (error) {
      toast.error(`Failed to remove network: ${error}`);
    }
  };

  const copyId = async (id: string) => {
    const shortId = id.substring(0, 12);
    await navigator.clipboard.writeText(shortId);
    toast.success("Network ID copied to clipboard!");
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      // Don't select built-in networks by default in "select all"
      const selectableNetworks = networks.filter(net => !["bridge", "host", "none"].includes(net.Name)).map(net => net.Id);
      onSelectedChange?.(selectableNetworks);
    } else {
      onSelectedChange?.([]);
    }
  };

  const toggleSelection = (e: React.MouseEvent, id: string, isBuiltin: boolean) => {
    e.stopPropagation();
    if (isBuiltin) return;
    
    if (selected.includes(id)) {
      onSelectedChange?.(selected.filter(s => s !== id));
    } else {
      onSelectedChange?.([...selected, id]);
    }
  };

  const selectableCount = networks.filter(net => !["bridge", "host", "none"].includes(net.Name)).length;
  const allSelected = selectableCount > 0 && selected.length === selectableCount;
  const someSelected = selected.length > 0 && selected.length < selectableCount;

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden text-sm">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="w-[40px] text-center pl-4">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={toggleAll}
                disabled={selectableCount === 0}
              />
            </TableHead>
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Subnet</TableHead>
            <TableHead className="font-semibold">Driver</TableHead>
            <TableHead className="font-semibold">Scope</TableHead>
            <TableHead className="font-semibold">Attachable</TableHead>
            <TableHead className="text-right font-semibold pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {networks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No networks found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedNetworks.map((net) => {
              const shortId = net.Id.substring(0, 12);
              const isBuiltin = net.Name === "bridge" || net.Name === "host" || net.Name === "none";
              const isSelected = selected.includes(net.Id);
              const subnet = net.IPAM?.Config?.[0]?.Subnet || "-";

              return (
                <TableRow key={net.Id} className={`hover:bg-muted/30 transition-colors group ${!isBuiltin ? 'cursor-pointer' : ''} ${isSelected ? "bg-primary/5" : ""}`} onClick={(e) => toggleSelection(e, net.Id, isBuiltin)}>
                  <TableCell className="pl-4" onClick={(e) => toggleSelection(e, net.Id, isBuiltin)}>
                    <Checkbox checked={isSelected} className={isBuiltin ? "opacity-50" : "pointer-events-none"} disabled={isBuiltin} />
                  </TableCell>
                  <TableCell className="font-medium border-l border-transparent">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        {net.Name}
                        {isBuiltin && <span className="ml-2 text-[10px] uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm">Built-in</span>}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{shortId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(subnet); toast.success("Subnet Copied!"); }} title="Copy Subnet">
                      {subnet}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {net.Driver}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {net.Scope}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {net.Attachable ? (
                      <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded-full uppercase font-medium tracking-wider">Yes</span>
                    ) : (
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-full uppercase font-medium tracking-wider">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <DotsThreeVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => copyId(net.Id)}>
                            <CopyIcon className="mr-2 h-4 w-4" /> Copy ID
                          </DropdownMenuItem>
                          {subnet !== "-" && (
                            <DropdownMenuItem onClick={async () => {
                              await navigator.clipboard.writeText(subnet);
                              toast.success("Subnet copied!");
                            }}>
                              <NetworkIcon className="mr-2 h-4 w-4" /> Copy Subnet
                            </DropdownMenuItem>
                          )}
                          {!isBuiltin && (
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setNetworkToDelete(net.Id)}>
                              <TrashIcon className="mr-2 h-4 w-4" /> Delete network
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      
      {networks.length > 0 && (
        <DataTablePagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          setPageSize={setPageSize}
          setCurrentPage={setCurrentPage}
        />
      )}

      <AlertDialog open={!!networkToDelete} onOpenChange={(open) => !open && setNetworkToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the network. Containers connected to this network may lose connectivity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (networkToDelete) {
                  removeNetwork(networkToDelete);
                  setNetworkToDelete(null);
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
