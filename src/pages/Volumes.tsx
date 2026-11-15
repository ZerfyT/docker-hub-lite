import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { InfoIcon, PlusIcon } from "@phosphor-icons/react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { VolumeTable } from "@/components/dashboard/VolumeTable";
import { TableActionsBar } from "@/components/dashboard/TableActionsBar";
import { Button } from "@/components/ui/button";
import { CreateVolumeModal } from "@/components/modals/CreateVolumeModal";
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

export function Volumes() {
  const { volumes, fetchVolumes, systemDf } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  let totalSize = 0;
  let unusedCount = 0;
  
  if (systemDf?.Volumes) {
    totalSize = systemDf.Volumes.reduce((acc: number, vol: any) => acc + (vol.UsageData?.Size || 0), 0);
    // Volumes with RefCount === 0 are unused
    unusedCount = systemDf.Volumes.filter((vol: any) => vol.UsageData?.RefCount === 0).length;
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0.00 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredVolumes = volumes.filter((vol) =>
    vol.Name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const executeBulkDelete = async () => {
    if (selected.length === 0) return;
    
    let successCount = 0;
    let failCount = 0;
    
    for (const name of selected) {
      try {
        await invoke("remove_volume", { name });
        successCount++;
      } catch (error) {
        console.error(`Failed to execute remove_volume on ${name}:`, error);
        failCount++;
      }
    }
    
    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} volume(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} volume(s)`);
    }
    
    setSelected([]);
    fetchVolumes();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Volumes</h2>
          <p className="text-muted-foreground text-sm">Manage persistent Docker storage volumes.</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
          <PlusIcon className="h-4 w-4" />
          Create Volume
        </Button>
      </div>

      <div className="flex items-center gap-16 mb-4 mt-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold flex items-center gap-1.5">
            Volumes <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="text-primary font-medium text-sm mt-1 flex gap-2 items-center">
            {volumes.length} Total
            {unusedCount > 0 && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-amber-500">{unusedCount} Unused</span>
              </>
            )}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold flex items-center gap-1.5">
            Total disk space <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="text-primary font-medium text-sm mt-1 flex gap-1">
            {formatBytes(totalSize)}
          </span>
        </div>
      </div>

      <TableActionsBar
        itemName="volumes"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCount={selected.length}
        onDelete={() => setDeleteDialogOpen(true)}
        filteredCount={filteredVolumes.length}
        totalCount={volumes.length}
      />

      <div className="rounded-md border bg-background overflow-hidden relative">
        <VolumeTable
          volumes={filteredVolumes}
          onRefresh={fetchVolumes}
          selected={selected}
          onSelectedChange={setSelected}
        />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected volumes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selected.length} selected volume(s)? All data stored within these volumes will be permanently erased.
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

      <CreateVolumeModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}
