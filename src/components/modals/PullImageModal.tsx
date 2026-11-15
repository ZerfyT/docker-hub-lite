import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowDownIcon,
  SpinnerGapIcon,
  MagnifyingGlassIcon,
  TagIcon,
  StarIcon,
  CheckCircleIcon,
  XIcon,
  ClockIcon,
  HardDriveIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";

interface PullImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PullProgressPayload {
  status?: string;
  progress?: string;
  id?: string;
}

export interface DockerImageSearchItem {
  name: string;
  description: string;
  is_official: boolean;
  star_count: number;
}

export interface DockerImageTag {
  name: string;
  full_size?: number | null;
  last_updated?: string | null;
}

const POPULAR_IMAGES = [
  { name: "postgres", label: "PostgreSQL", tag: "16-alpine" },
  { name: "redis", label: "Redis", tag: "alpine" },
  { name: "nginx", label: "Nginx", tag: "alpine" },
  { name: "mongo", label: "MongoDB", tag: "latest" },
  { name: "node", label: "Node.js", tag: "20-alpine" },
  { name: "alpine", label: "Alpine Linux", tag: "latest" },
  { name: "mysql", label: "MySQL", tag: "8.0" },
  { name: "rabbitmq", label: "RabbitMQ", tag: "management-alpine" },
  { name: "python", label: "Python", tag: "3.12-slim" },
  { name: "golang", label: "Go", tag: "1.22-alpine" },
];

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function PullImageModal({ open, onOpenChange }: PullImageModalProps) {
  const { fetchImages } = useStore();
  const [imageInput, setImageInput] = useState("");
  const [isPulling, setIsPulling] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);

  // Search suggestions state
  const [imageSuggestions, setImageSuggestions] = useState<DockerImageSearchItem[]>([]);
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Tag suggestions state
  const [tags, setTags] = useState<DockerImageTag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tagTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse repo and current tag
  const colonIndex = imageInput.indexOf(":");
  const repoPart = colonIndex !== -1 ? imageInput.slice(0, colonIndex).trim() : imageInput.trim();
  const tagPart = colonIndex !== -1 ? imageInput.slice(colonIndex + 1).trim() : "";

  // Listen to pull progress events
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    if (open) {
      listen<PullProgressPayload>("image-pull-progress", (event) => {
        const payload = event.payload;
        if (payload?.status) {
          const detail = [payload.id, payload.status, payload.progress].filter(Boolean).join(" ");
          setCurrentStatus(detail);
        }
      }).then((fn) => {
        unlisten = fn;
      });
    }

    return () => {
      if (unlisten) unlisten();
    };
  }, [open]);

  // Reset state on open/close
  useEffect(() => {
    if (!open) {
      setImageInput("");
      setImageSuggestions([]);
      setTags([]);
      setShowImageDropdown(false);
      setIsPulling(false);
      setCurrentStatus(null);
      setSelectedTag(null);
    }
  }, [open]);

  // Debounced image search when typing repo name
  useEffect(() => {
    if (!open || isPulling) return;

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    // Only search images if colon not typed yet and we have >= 2 chars
    if (!imageInput.includes(":") && repoPart.length >= 2) {
      setIsSearchingImages(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await invoke<DockerImageSearchItem[]>("search_docker_images", {
            term: repoPart,
          });
          setImageSuggestions(results);
          setShowImageDropdown(results.length > 0);
          setHighlightedIndex(-1);
        } catch (err) {
          console.error("Image search error:", err);
          setImageSuggestions([]);
          setShowImageDropdown(false);
        } finally {
          setIsSearchingImages(false);
        }
      }, 300);
    } else {
      setImageSuggestions([]);
      setShowImageDropdown(false);
      setIsSearchingImages(false);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [imageInput, repoPart, open, isPulling]);

  // Fetch tags for selected/typed image repo
  useEffect(() => {
    if (!open || isPulling || !repoPart || repoPart.length < 2) {
      setTags([]);
      setIsLoadingTags(false);
      return;
    }

    if (tagTimeoutRef.current) clearTimeout(tagTimeoutRef.current);

    tagTimeoutRef.current = setTimeout(async () => {
      setIsLoadingTags(true);
      try {
        const fetchedTags = await invoke<DockerImageTag[]>("get_image_tags", {
          image: repoPart,
          filter: tagPart || null,
        });

        // Sort latest and alpine tags to the top for dev convenience
        const sorted = [...fetchedTags].sort((a, b) => {
          if (a.name === "latest") return -1;
          if (b.name === "latest") return 1;
          const aAlpine = a.name.includes("alpine");
          const bAlpine = b.name.includes("alpine");
          if (aAlpine && !bAlpine) return -1;
          if (!aAlpine && bAlpine) return 1;
          return 0;
        });

        setTags(sorted);
      } catch (err) {
        console.error("Error fetching tags:", err);
        setTags([]);
      } finally {
        setIsLoadingTags(false);
      }
    }, 250);

    return () => {
      if (tagTimeoutRef.current) clearTimeout(tagTimeoutRef.current);
    };
  }, [repoPart, tagPart, open, isPulling]);

  // Update selectedTag state when tagPart changes
  useEffect(() => {
    if (tagPart) {
      setSelectedTag(tagPart);
    } else if (imageInput.includes(":")) {
      setSelectedTag("");
    } else {
      setSelectedTag(null);
    }
  }, [imageInput, tagPart]);

  // Select an image from search dropdown
  const handleSelectImageSuggestion = (name: string) => {
    setImageInput(`${name}:`);
    setShowImageDropdown(false);
  };

  // Select a tag
  const handleSelectTag = (tag: string) => {
    setImageInput(`${repoPart}:${tag}`);
    setSelectedTag(tag);
  };

  // Handle keyboard events in input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showImageDropdown && imageSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < imageSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : imageSuggestions.length - 1
        );
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        handleSelectImageSuggestion(imageSuggestions[highlightedIndex].name);
      } else if (e.key === "Escape") {
        setShowImageDropdown(false);
      }
    }
  };

  const handlePull = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const target = imageInput.trim();
    if (!target) return;

    // Default to latest tag if no tag was supplied
    const finalImage = target.includes(":") ? target : `${target}:latest`;

    setIsPulling(true);
    setShowImageDropdown(false);
    setCurrentStatus(`Contacting registry for ${finalImage}...`);

    try {
      await invoke("pull_image", { image: finalImage });
      toast.success(`Successfully pulled ${finalImage}!`);
      await fetchImages();
      setImageInput("");
      setCurrentStatus(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to pull image:", error);
      toast.error(`Failed to pull image: ${error}`);
      setCurrentStatus(null);
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isPulling && onOpenChange(v)}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-6 gap-0">
        <form onSubmit={handlePull} className="flex flex-col flex-1 overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownIcon className="h-5 w-5 text-primary" />
              Pull Docker Image
            </DialogTitle>
            <DialogDescription>
              Search Docker Hub for official repositories, inspect tags, and pull with live status.
            </DialogDescription>
          </DialogHeader>

          <div ref={containerRef} className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
            {/* Input with Search & Loading icons */}
            <div className="space-y-2 relative">
              <Label htmlFor="image-name" className="text-sm font-medium flex items-center justify-between">
                <span>Image & Tag</span>
                {repoPart && (
                  <span className="text-xs font-mono text-muted-foreground">
                    Target: <span className="text-primary font-semibold">{repoPart}{colonIndex !== -1 ? `:${tagPart || "latest"}` : ":latest"}</span>
                  </span>
                )}
              </Label>

              <div className="relative flex items-center">
                <div className="absolute left-3 text-muted-foreground pointer-events-none">
                  {isSearchingImages || isLoadingTags ? (
                    <SpinnerGapIcon className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <MagnifyingGlassIcon className="h-4 w-4" />
                  )}
                </div>

                <Input
                  id="image-name"
                  placeholder="e.g. postgres, redis:alpine, or bitnami/kafka"
                  value={imageInput}
                  onChange={(e) => {
                    setImageInput(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (imageSuggestions.length > 0 && !imageInput.includes(":")) {
                      setShowImageDropdown(true);
                    }
                  }}
                  disabled={isPulling}
                  className="pl-9 pr-8 font-mono text-sm"
                  autoFocus
                  autoComplete="off"
                />

                {imageInput && !isPulling && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageInput("");
                      setTags([]);
                      setImageSuggestions([]);
                    }}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown for Image Repositories */}
              {showImageDropdown && imageSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-popover/95 backdrop-blur-md border border-border rounded-lg shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 border-b border-border/50 flex justify-between items-center">
                    <span>Docker Hub Matches</span>
                    <span>Use ↑↓ to navigate, Enter to select</span>
                  </div>
                  {imageSuggestions.map((item, idx) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleSelectImageSuggestion(item.name)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full text-left px-3 py-2 flex flex-col gap-0.5 transition-colors border-b border-border/30 last:border-0 ${highlightedIndex === idx
                        ? "bg-primary/15 text-foreground"
                        : "hover:bg-muted/60 text-foreground"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold">
                          <span className="text-primary">{item.name}</span>
                          {item.is_official && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-blue-500/10 text-blue-500 font-sans px-1.5 py-0.2 rounded border border-blue-500/20 font-medium">
                              <CheckCircleIcon className="h-3 w-3" weight="fill" />
                              Official
                            </span>
                          )}
                        </div>
                        {item.star_count > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-500/90 font-mono">
                            <StarIcon className="h-3 w-3" weight="fill" />
                            <span>{item.star_count.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 font-sans">
                          {item.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tags Suggestions Section */}
            {repoPart && (
              <div className="space-y-2 rounded-lg border border-border/70 bg-card/60 p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium flex items-center gap-1.5 text-foreground">
                    <TagIcon className="h-3.5 w-3.5 text-primary" />
                    Available Tags for <span className="font-mono text-primary font-semibold">{repoPart}</span>
                  </Label>
                  {isLoadingTags && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <SpinnerGapIcon className="h-3 w-3 animate-spin text-primary" />
                      Fetching tags...
                    </span>
                  )}
                </div>

                {tags.length > 0 ? (
                  <ScrollArea className="h-32 pr-2">
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => {
                        const isSelected = selectedTag === tag.name || tagPart === tag.name;
                        return (
                          <button
                            key={tag.name}
                            type="button"
                            onClick={() => handleSelectTag(tag.name)}
                            className={`group inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono transition-all border ${isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                              : "bg-muted/50 hover:bg-muted text-foreground border-border/60 hover:border-primary/50"
                              }`}
                          >
                            <span>{tag.name}</span>
                            {tag.full_size && (
                              <span
                                className={`text-[10px] inline-flex items-center gap-0.5 opacity-75 font-sans ${isSelected ? "text-primary-foreground" : "text-muted-foreground"
                                  }`}
                              >
                                <HardDriveIcon className="h-2.5 w-2.5" />
                                {formatBytes(tag.full_size)}
                              </span>
                            )}
                            {tag.last_updated && !tag.full_size && (
                              <span
                                className={`text-[10px] inline-flex items-center gap-0.5 opacity-75 font-sans ${isSelected ? "text-primary-foreground" : "text-muted-foreground"
                                  }`}
                              >
                                <ClockIcon className="h-2.5 w-2.5" />
                                {formatDate(tag.last_updated)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : !isLoadingTags ? (
                  <div className="py-2 text-center text-xs text-muted-foreground">
                    Type a tag name like <span className="font-mono text-primary">latest</span> or <span className="font-mono text-primary">alpine</span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Popular Base Images (When input is empty or starting out) */}
            {!imageInput && (
              <div className="space-y-2 pt-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <SparkleIcon className="h-3.5 w-3.5 text-amber-500" />
                  Popular Base Images
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_IMAGES.map((img) => (
                    <button
                      key={img.name}
                      type="button"
                      onClick={() => !isPulling && setImageInput(`${img.name}:${img.tag}`)}
                      className="flex items-center justify-between p-2 rounded-md border border-border/60 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 transition-colors text-left group"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {img.label}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {img.name}:{img.tag}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-border/50">
                        {img.tag}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Pulling Progress Box */}
            {isPulling && (
              <div className="p-3.5 rounded-lg border border-primary/30 bg-primary/5 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <SpinnerGapIcon className="h-4 w-4 animate-spin" />
                    <span>Pulling Image Layers</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    Docker Engine
                  </Badge>
                </div>
                <div className="w-full bg-primary/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-2/3 animate-pulse rounded-full" />
                </div>
                <p className="text-xs font-mono text-muted-foreground truncate bg-background/50 p-2 rounded border border-border/40">
                  {currentStatus || "Contacting registry & verifying digests..."}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border/60 flex items-center justify-between sm:justify-between w-full">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              <span>Docker Hub v2 Online</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPulling}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPulling || !imageInput.trim()}
                className="gap-2 font-medium"
              >
                {isPulling ? (
                  <>
                    <SpinnerGapIcon className="h-4 w-4 animate-spin" />
                    Pulling...
                  </>
                ) : (
                  <>
                    <ArrowDownIcon className="h-4 w-4" />
                    Pull Image
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
