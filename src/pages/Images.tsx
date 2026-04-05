import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagnifyingGlassIcon, TrashIcon } from "@phosphor-icons/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/store/useStore";

export function Images() {
  const { images, fetchImages } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  const removeImage = async (id: string) => {
    try {
      await invoke("remove_image", { id });
      fetchImages();
    } catch (error) {
      console.error("Failed to remove image:", error);
      alert(`Failed to remove image: ${error}`);
    }
  };

  const filteredImages = images.filter((img) =>
    img.RepoTags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Images</h2>
        <p className="text-muted-foreground">Manage your local Docker images and reclaim space.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search images by repository or tag..."
            className="pl-9 bg-background border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredImages.length} of {images.length} images
        </div>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repository & Tag</TableHead>
              <TableHead>Image ID</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredImages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No images found.
                </TableCell>
              </TableRow>
            ) : (
              filteredImages.map((img) => {
                const primaryTag = img.RepoTags && img.RepoTags.length > 0 ? img.RepoTags[0] : "<none>:<none>";
                const [repo, tag] = primaryTag.split(":");
                const shortId = img.Id.replace("sha256:", "").substring(0, 12);
                const createdDate = new Date(img.Created * 1000).toLocaleDateString();

                return (
                  <TableRow key={img.Id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{repo}</span>
                        <span className="text-xs text-muted-foreground">{tag}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {shortId}
                    </TableCell>
                    <TableCell>{createdDate}</TableCell>
                    <TableCell>{formatSize(img.Size)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeImage(img.Id)}
                        title="Remove Image"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
