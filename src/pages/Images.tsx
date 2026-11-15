import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowDownIcon, PlayIcon } from "@phosphor-icons/react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { ImageTable } from "@/components/dashboard/ImageTable";
import { TableActionsBar } from "@/components/dashboard/TableActionsBar";
import { Button } from "@/components/ui/button";
import { PullImageModal } from "@/components/modals/PullImageModal";
import { RunContainerModal } from "@/components/modals/RunContainerModal";
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

export function Images() {
  const { images, fetchImages, systemDf } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pullModalOpen, setPullModalOpen] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [selectedImageForRun, setSelectedImageForRun] = useState("");

  const danglingImagesCount = images.filter(img => !img.RepoTags || img.RepoTags.includes("<none>:<none>")).length;
  const totalSize = systemDf?.LayersSize || 0;

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0.00 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredImages = images.filter((img) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchesTag = img.RepoTags?.some((tag) => tag.toLowerCase().includes(query));
    const matchesId = img.Id?.toLowerCase().includes(query);
    return Boolean(matchesTag || matchesId);
  });

  const executeBulkDelete = async () => {
    if (selected.length === 0) return;

    let successCount = 0;
    let failCount = 0;

    for (const id of selected) {
      try {
        await invoke("remove_image", { id });
        successCount++;
      } catch (error) {
        console.error(`Failed to execute remove_image on ${id}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} image(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} image(s)`);
    }

    setSelected([]);
    fetchImages();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Images</h2>
          <p className="text-muted-foreground text-sm">Manage local Docker images and pull from registries.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setPullModalOpen(true)}>
            <ArrowDownIcon className="h-4 w-4" />
            Pull Image
          </Button>
          <Button className="gap-2" onClick={() => { setSelectedImageForRun(""); setRunModalOpen(true); }}>
            <PlayIcon className="h-4 w-4 fill-current" />
            Run Container
          </Button>
        </div>
      </div>

      {/* Modern Telemetry Banner */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Local Image Cache</span>
            <span className="font-mono text-foreground font-bold">{images.length} Image(s)</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-primary font-semibold">
              {images.filter(img => img.Containers > 0).length} In Use
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-muted-foreground">
              {images.filter(img => !img.Containers || img.Containers === 0).length} Standby
            </span>
            {danglingImagesCount > 0 && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-amber-500 font-semibold">{danglingImagesCount} Dangling</span>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Disk Space Occupied</span>
            <span className="font-mono text-foreground font-bold">{formatBytes(totalSize)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Cached container layers stored by Docker Engine
          </p>
        </div>
      </div>

      <TableActionsBar
        itemName="images"
        searchPlaceholder="Search images by repository, tag, or ID..."
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCount={selected.length}
        onDelete={() => setDeleteDialogOpen(true)}
        filteredCount={filteredImages.length}
        totalCount={images.length}
      />

      <div className="rounded-md border bg-background overflow-hidden relative">
        <ImageTable
          images={filteredImages}
          onRefresh={fetchImages}
          selected={selected}
          onSelectedChange={setSelected}
          onRunImage={(img) => {
            setSelectedImageForRun(img);
            setRunModalOpen(true);
          }}
        />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected images?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selected.length} selected image(s)? Images currently used by containers cannot be removed until those containers are deleted.
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
      <PullImageModal open={pullModalOpen} onOpenChange={setPullModalOpen} />
      <RunContainerModal
        open={runModalOpen}
        onOpenChange={setRunModalOpen}
        defaultImage={selectedImageForRun}
      />
    </div>
  );
}
