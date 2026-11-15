import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { InfoIcon, PlusIcon } from "@phosphor-icons/react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { NetworkTable } from "@/components/dashboard/NetworkTable";
import { TableActionsBar } from "@/components/dashboard/TableActionsBar";
import { Button } from "@/components/ui/button";
import { CreateNetworkModal } from "@/components/modals/CreateNetworkModal";
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

export function Networks() {
  const { networks, fetchNetworks } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const builtinCount = networks.filter(net => ["bridge", "host", "none"].includes(net.Name)).length;
  const customCount = networks.length - builtinCount;

  const filteredNetworks = networks.filter((net) =>
    net.Name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const executeBulkDelete = async () => {
    if (selected.length === 0) return;

    let successCount = 0;
    let failCount = 0;

    for (const id of selected) {
      try {
        await invoke("remove_network", { id });
        successCount++;
      } catch (error) {
        console.error(`Failed to execute remove_network on ${id}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} network(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} network(s)`);
    }

    setSelected([]);
    fetchNetworks();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Networks</h2>
          <p className="text-muted-foreground text-sm">Manage container network interfaces and drivers.</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
          <PlusIcon className="h-4 w-4" />
          Create Network
        </Button>
      </div>

      <div className="flex items-center gap-16 mb-4 mt-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold flex items-center gap-1.5">
            Networks <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="text-primary font-medium text-sm mt-1 flex gap-2 items-center">
            {networks.length} Total
            <span className="text-muted-foreground">/</span>
            <span className="text-green-500">{customCount} Custom</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-neutral-500">{builtinCount} Built-in</span>
          </span>
        </div>
      </div>

      <TableActionsBar
        itemName="networks"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCount={selected.length}
        onDelete={() => setDeleteDialogOpen(true)}
        filteredCount={filteredNetworks.length}
        totalCount={networks.length}
      />

      <div className="rounded-md border bg-background overflow-hidden relative">
        <NetworkTable
          networks={filteredNetworks}
          onRefresh={fetchNetworks}
          selected={selected}
          onSelectedChange={setSelected}
        />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected networks?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selected.length} selected network(s)? Built-in networks and networks in active use cannot be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateNetworkModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}
