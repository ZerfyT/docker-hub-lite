import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { PlusIcon } from "@phosphor-icons/react";
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

      {/* Modern Telemetry Banner */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Docker Networks</span>
            <span className="font-mono text-foreground font-bold">{networks.length} Total</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-500 font-semibold">
              {customCount} Custom Bridges
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-muted-foreground">
              {builtinCount} Default (bridge, host, none)
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Subnet Isolation</span>
            <span className="font-mono text-foreground font-bold">{customCount} Isolated</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Virtual software-defined bridges enabling inter-container DNS and traffic routing
          </p>
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
