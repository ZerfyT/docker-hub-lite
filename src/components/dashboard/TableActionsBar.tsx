import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MagnifyingGlassIcon, TrashIcon, XIcon } from "@phosphor-icons/react";

interface TableActionsBarProps {
  itemName: string;
  searchPlaceholder?: string;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCount?: number;
  onDelete?: () => void;
  extraBulkActions?: React.ReactNode;
  extraFilters?: React.ReactNode;
  filteredCount: number;
  totalCount: number;
}

export function TableActionsBar({
  itemName,
  searchPlaceholder,
  searchQuery,
  setSearchQuery,
  selectedCount,
  onDelete,
  extraBulkActions,
  extraFilters,
  filteredCount,
  totalCount,
}: TableActionsBarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2 rounded-xl border border-border/70 bg-card/70 backdrop-blur-xs shadow-2xs">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={searchPlaceholder || `Filter ${itemName}...`}
            className="pl-9 pr-8 bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-primary h-9 text-xs rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
              title="Clear search"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {extraFilters}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
        {selectedCount && selectedCount > 0 ? (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
            <span className="text-xs text-primary font-medium font-mono">
              {selectedCount} selected
            </span>
            {onDelete && (
              <Button
                size="icon"
                variant="destructive"
                className="h-7 w-7 rounded-md"
                onClick={onDelete}
                title="Delete selected"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </Button>
            )}
            {extraBulkActions}
          </div>
        ) : null}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Showing</span>
          <Badge variant="outline" className="font-mono text-[11px] px-1.5 py-0 border-border/60">
            {filteredCount}
          </Badge>
          <span>of {totalCount}</span>
        </div>
      </div>
    </div>
  );
}
