import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagnifyingGlassIcon, TrashIcon } from "@phosphor-icons/react";

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
  totalCount
}: TableActionsBarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder || `Search ${itemName} by name...`}
            className="pl-9 bg-background border-border focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-primary h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {extraFilters}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
        {selectedCount && selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2 font-medium">{selectedCount} selected</span>
            {onDelete && (
              <Button size="icon" variant="destructive" className="h-9 w-9" onClick={onDelete} title="Delete">
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
            {extraBulkActions}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} {itemName}
        </div>
      </div>
    </div>
  );
}
