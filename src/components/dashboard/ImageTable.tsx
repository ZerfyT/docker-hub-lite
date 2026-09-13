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

export interface Image {
  Id: string;
  RepoTags: string[];
  Created: number;
  Size: number;
  Containers: number;
}

interface ImageTableProps {
  images: Image[];
  onRefresh: () => void;
  selected?: string[];
  onSelectedChange?: (selected: string[]) => void;
}

export function ImageTable({ images, onRefresh, selected = [], onSelectedChange }: ImageTableProps) {
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
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden text-sm">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="w-[40px] text-center pl-4">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead className="font-semibold">Repository & Tag</TableHead>
            <TableHead className="font-semibold">Image ID</TableHead>
            <TableHead className="font-semibold">In Use</TableHead>
            <TableHead className="font-semibold">Created</TableHead>
            <TableHead className="font-semibold">Size</TableHead>
            <TableHead className="text-right font-semibold pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No images found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedImages.map((img) => {
              const primaryTag = img.RepoTags && img.RepoTags.length > 0 ? img.RepoTags[0] : "<none>:<none>";
              const [repo, tag] = primaryTag.split(":");
              const shortId = img.Id.replace("sha256:", "").substring(0, 12);
              const createdDate = new Date(img.Created * 1000).toLocaleDateString();
              const isSelected = selected.includes(img.Id);

              return (
                <TableRow key={img.Id} className={`hover:bg-muted/30 transition-colors group cursor-pointer ${isSelected ? "bg-primary/5" : ""}`} onClick={(e) => toggleSelection(e, img.Id)}>
                  <TableCell className="pl-4" onClick={(e) => toggleSelection(e, img.Id)}>
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                  </TableCell>
                  <TableCell className="font-medium border-l border-transparent">
                    <div className="flex flex-col">
                      <span>{repo}</span>
                      <span className="text-xs text-muted-foreground">{tag}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {shortId}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {img.Containers > 0 ? (
                      <span className="text-green-500 font-medium">{img.Containers} Container(s)</span>
                    ) : (
                      <span className="text-neutral-500">Unused</span>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <DotsThreeVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={async () => {
                            try {
                              await invoke("quick_run_image", { id: img.Id });
                              toast.success("Container launched successfully");
                              onRefresh();
                            } catch (e) {
                              toast.error(`Failed to quick run: ${e}`);
                            }
                          }}>
                            <PlayIcon className="mr-2 h-4 w-4" /> Quick Run
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
