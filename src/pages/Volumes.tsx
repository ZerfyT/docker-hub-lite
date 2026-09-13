import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagnifyingGlassIcon, TrashIcon, InfoIcon } from "@phosphor-icons/react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { VolumeTable } from "@/components/dashboard/VolumeTable";

export function Volumes() {
  const { volumes, fetchVolumes, systemDf } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

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

  const handleBulkAction = async (action: string) => {
    if (selected.length === 0) return;
    
    if (confirm("Are you sure you want to delete the selected volumes?")) {
      let successCount = 0;
      let failCount = 0;
      
      for (const name of selected) {
        try {
          await invoke(action, { name });
          successCount++;
        } catch (error) {
          console.error(`Failed to execute ${action} on ${name}:`, error);
          failCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully executed action on ${successCount} volume(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to execute action on ${failCount} volume(s)`);
      }
      
      setSelected([]);
      fetchVolumes();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 relative">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Volumes</h2>
        </div>
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-sm">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search volumes by name..."
              className="pl-9 bg-background border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {selected.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-2 font-medium">{selected.length} selected</span>
              <Button size="icon" variant="destructive" className="h-9 w-9" onClick={() => handleBulkAction("remove_volume")} title="Delete">
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredVolumes.length} of {volumes.length} volumes
        </div>
      </div>

      <div className="rounded-md border bg-background overflow-hidden relative">
        <VolumeTable
          volumes={filteredVolumes}
          onRefresh={fetchVolumes}
          selected={selected}
          onSelectedChange={setSelected}
        />
      </div>
    </div>
  );
}
