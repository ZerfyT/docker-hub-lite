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
import { TrashIcon, DotsThreeVerticalIcon, CopyIcon, DownloadIcon } from "@phosphor-icons/react";
import { invoke } from "@tauri-apps/api/core";
import { useStore, VolumeSummary } from "@/store/useStore";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTablePagination } from "./DataTablePagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VolumeTableProps {
  volumes: VolumeSummary[];
  onRefresh: () => void;
  selected?: string[];
  onSelectedChange?: (selected: string[]) => void;
}

export function VolumeTable({ volumes, onRefresh, selected = [], onSelectedChange }: VolumeTableProps) {
  const { systemDf } = useStore();
  const [volumeToDelete, setVolumeToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.ceil(volumes.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages) || 1;

  const paginatedVolumes = volumes.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const removeVolume = async (name: string) => {
    try {
      await invoke("remove_volume", { name });
      toast.success("Volume removed successfully");
      onRefresh();
    } catch (error) {
      toast.error(`Failed to remove volume: ${error}`);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleBackup = async (volName: string) => {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const path = await save({
        filters: [{ name: 'Tar Archive', extensions: ['tar.gz'] }],
        defaultPath: `${volName}-backup.tar.gz`
      });
      if (path) {
        toast.promise(invoke("backup_volume", { name: volName, path }), {
          loading: `Creating backup of ${volName}...`,
          success: "Backup created successfully!",
          error: (err) => `Failed to backup volume: ${err}`,
        });
      }
    } catch (err) {
      toast.error(`Failed to open save dialog: ${err}`);
    }
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      onSelectedChange?.(volumes.map(vol => vol.Name));
    } else {
      onSelectedChange?.([]);
    }
  };

  const toggleSelection = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (selected.includes(name)) {
      onSelectedChange?.(selected.filter(s => s !== name));
    } else {
      onSelectedChange?.([...selected, name]);
    }
  };

  const allSelected = volumes.length > 0 && selected.length === volumes.length;
  const someSelected = selected.length > 0 && selected.length < volumes.length;

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden text-sm">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="w-10 text-center pl-4">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold w-30">Size</TableHead>
            <TableHead className="font-semibold w-25">Status</TableHead>
            <TableHead className="font-semibold">Driver</TableHead>
            <TableHead className="font-semibold">Mountpoint</TableHead>
            <TableHead className="text-right font-semibold pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {volumes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No volumes found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedVolumes.map((vol) => {
              const isSelected = selected.includes(vol.Name);
              const dfData = systemDf?.Volumes?.find((v: any) => v.Name === vol.Name);
              const size = dfData?.UsageData?.Size || 0;
              const refCount = dfData?.UsageData?.RefCount || 0;

              return (
                <TableRow key={vol.Name} className={`hover:bg-muted/30 transition-colors group cursor-pointer ${isSelected ? "bg-primary/5" : ""}`} onClick={(e) => toggleSelection(e, vol.Name)}>
                  <TableCell className="pl-4" onClick={(e) => toggleSelection(e, vol.Name)}>
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                  </TableCell>
                  <TableCell className="font-medium border-l border-transparent">
                    {vol.Name.substring(0, 32)}{vol.Name.length > 32 ? '...' : ''}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatSize(size)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {refCount > 0 ? (
                      <span className="text-green-500 font-medium">In Use</span>
                    ) : (
                      <span className="text-neutral-500">Unused</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {vol.Driver}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs truncate max-w-[250px]" title={vol.Mountpoint}>
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(vol.Mountpoint); toast.success("Mountpoint Copied!"); }}>
                      {vol.Mountpoint}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <DotsThreeVerticalIcon className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => handleBackup(vol.Name)}>
                            <DownloadIcon className="mr-2 h-4 w-4" /> Backup Volume
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            await navigator.clipboard.writeText(vol.Mountpoint);
                            toast.success("Mountpoint copied!");
                          }}>
                            <CopyIcon className="mr-2 h-4 w-4" /> Copy Mountpoint
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setVolumeToDelete(vol.Name)}>
                            <TrashIcon className="mr-2 h-4 w-4" /> Delete volume
                          </DropdownMenuItem>
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

      {volumes.length > 0 && (
        <DataTablePagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          setPageSize={setPageSize}
          setCurrentPage={setCurrentPage}
        />
      )}

      <AlertDialog open={!!volumeToDelete} onOpenChange={(open) => !open && setVolumeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the volume. It will destroy any data stored within it. If a container is actively using this volume, deletion will fail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (volumeToDelete) {
                  removeVolume(volumeToDelete);
                  setVolumeToDelete(null);
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
