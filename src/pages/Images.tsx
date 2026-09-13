import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { InfoIcon } from "@phosphor-icons/react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { ImageTable } from "@/components/dashboard/ImageTable";
import { TableActionsBar } from "@/components/dashboard/TableActionsBar";

export function Images() {
  const { images, fetchImages, systemDf } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const danglingImagesCount = images.filter(img => !img.RepoTags || img.RepoTags.includes("<none>:<none>")).length;
  const totalSize = systemDf?.LayersSize || 0;

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0.00 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredImages = images.filter((img) =>
    img.RepoTags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleBulkAction = async (action: string) => {
    if (selected.length === 0) return;

    const isRemove = action === "remove_image";
    const confirmMessage = isRemove ? "Are you sure you want to delete the selected images?" : "Are you sure?";

    if (confirm(confirmMessage)) {
      let successCount = 0;
      let failCount = 0;

      for (const id of selected) {
        try {
          await invoke(action, { id });
          successCount++;
        } catch (error) {
          console.error(`Failed to execute ${action} on ${id}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully executed action on ${successCount} image(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to execute action on ${failCount} image(s)`);
      }

      setSelected([]);
      fetchImages();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 relative">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Images</h2>
        </div>
      </div>

      <div className="flex items-center gap-16 mb-4 mt-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold flex items-center gap-1.5">
            Images <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="text-primary font-medium text-sm mt-1 flex gap-2 items-center">
            {images.length} Total
            {danglingImagesCount > 0 && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-amber-500">{danglingImagesCount} Unused</span>
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
        itemName="images"
        searchPlaceholder="Search images by repository or tag..."
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCount={selected.length}
        onDelete={() => handleBulkAction("remove_image")}
        filteredCount={filteredImages.length}
        totalCount={images.length}
      />

      <div className="rounded-md border bg-background overflow-hidden relative">
        <ImageTable
          images={filteredImages}
          onRefresh={fetchImages}
          selected={selected}
          onSelectedChange={setSelected}
        />
      </div>
    </div>
  );
}
