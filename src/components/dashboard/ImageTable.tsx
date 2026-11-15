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
import { TrashIcon, DotsThreeVertical, CopyIcon, PlayIcon, HashIcon } from "@phosphor-icons/react";
import { invoke } from "@tauri-apps/api/core";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTablePagination } from "./DataTablePagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageSummary } from "@/store/useStore";

interface ImageTableProps {
  images: ImageSummary[];
  onRefresh: () => void;
  selected?: string[];
  onSelectedChange?: (selected: string[]) => void;
  onRunImage?: (imageTag: string) => void;
}

export function ImageTable({ images, onRefresh, selected = [], onSelectedChange, onRunImage }: ImageTableProps) {
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.ceil(images.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages) || 1;

  const paginatedImages = images.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const removeImage = async (id: string) => {
    try {
      await invoke("remove_image", { id });
      toast.success("Image removed successfully");
      onRefresh();
    } catch (error) {
      toast.error(`Failed to remove image: ${error}`);
    }
  };

  const copyId = async (id: string) => {
    const shortId = id.replace("sha256:", "").substring(0, 12);
    await navigator.clipboard.writeText(shortId);
    toast.success("Image ID copied to clipboard!");
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      onSelectedChange?.(images.map(img => img.Id));
    } else {
      onSelectedChange?.([]);
    }
  };

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selected.includes(id)) {
      onSelectedChange?.(selected.filter(s => s !== id));
    } else {
      onSelectedChange?.([...selected, id]);
    }
  };

  const allSelected = images.length > 0 && selected.length === images.length;
  const someSelected = selected.length > 0 && selected.length < images.length;

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Images list"
      className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs overflow-x-auto text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
    >
      <Table>
        <TableHeader className="bg-muted/50 backdrop-blur-xs sticky top-0 z-10">
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="w-[44px] text-center pl-4">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={toggleAll}
                aria-label="Select all images"
              />
            </TableHead>
            <TableHead className="font-semibold text-foreground min-w-[200px]">Repository & Tag</TableHead>
            <TableHead className="font-semibold text-foreground min-w-[120px]">Image ID</TableHead>
            <TableHead className="font-semibold text-foreground min-w-[120px]">In Use</TableHead>
            <TableHead className="font-semibold text-foreground min-w-[100px]">Created</TableHead>
            <TableHead className="font-semibold text-foreground min-w-[100px]">Disk Size</TableHead>
            <TableHead className="text-right font-semibold text-foreground pr-4 min-w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border/60">
                    <HashIcon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No Docker images found</p>
                  <p className="text-xs text-muted-foreground">
                    Pull an image from Docker Hub or build an image locally.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            paginatedImages.map((img) => {
              const primaryTag = img.RepoTags && img.RepoTags.length > 0 ? img.RepoTags[0] : "<none>:<none>";
              const [repo, tag] = primaryTag.split(":");
              const shortId = img.Id.replace("sha256:", "").substring(0, 12);
              const createdDate = new Date(img.Created * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              const isSelected = selected.includes(img.Id);

              return (
                <TableRow
                  key={img.Id}
                  className={`hover:bg-muted/40 transition-colors group cursor-pointer border-border/50 ${
                    isSelected ? "bg-primary/8 hover:bg-primary/12" : ""
                  }`}
                  onClick={(e) => toggleSelection(e, img.Id)}
                >
                  <TableCell className="pl-4" onClick={(e) => toggleSelection(e, img.Id)}>
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {repo}
                        </span>
                        {tag && (
                          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                            {tag}
                          </span>
                        )}
                      </div>
                      {img.RepoTags && img.RepoTags.length > 1 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{img.RepoTags.length - 1} more tag(s)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    <span
                      className="cursor-pointer hover:text-primary transition-colors hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyId(img.Id);
                      }}
                      title="Click to copy image ID"
                    >
                      {shortId}
                    </span>
                  </TableCell>
                  <TableCell>
                    {img.Containers > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {img.Containers} active
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">
                        Unused
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {createdDate}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatSize(img.Size)}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                        title="Run container with options"
                        onClick={() => onRunImage?.(img.RepoTags?.[0] && !img.RepoTags[0].includes("<none>") ? img.RepoTags[0] : img.Id)}
                      >
                        <PlayIcon className="h-4 w-4 fill-current" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <DotsThreeVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => onRunImage?.(img.RepoTags?.[0] && !img.RepoTags[0].includes("<none>") ? img.RepoTags[0] : img.Id)}>
                            <PlayIcon className="mr-2 h-4 w-4" /> Run with Options...
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            try {
                              await invoke("quick_run_image", { id: img.Id });
                              toast.success("Container launched successfully");
                              onRefresh();
                            } catch (e) {
                              toast.error(`Failed to quick run: ${e}`);
                            }
                          }}>
                            <PlayIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Quick Run (headless)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyId(img.Id)}>
                            <CopyIcon className="mr-2 h-4 w-4" /> Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            await navigator.clipboard.writeText(img.Id);
                            toast.success("Full SHA256 digest copied!");
                          }}>
                            <HashIcon className="mr-2 h-4 w-4" /> Copy Full Digest
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setImageToDelete(img.Id)}>
                            <TrashIcon className="mr-2 h-4 w-4" /> Delete image
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

      {images.length > 0 && (
        <DataTablePagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          setPageSize={setPageSize}
          setCurrentPage={setCurrentPage}
        />
      )}

      <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the image. If containers are using this image, deletion may fail unless force is used.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (imageToDelete) {
                  removeImage(imageToDelete);
                  setImageToDelete(null);
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
