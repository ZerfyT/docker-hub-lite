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

export function Volumes() {
  const { volumes, fetchVolumes } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  const removeVolume = async (name: string) => {
    try {
      await invoke("remove_volume", { name });
      fetchVolumes();
    } catch (error) {
      console.error("Failed to remove volume:", error);
      alert(`Failed to remove volume: ${error}`);
    }
  };

  const filteredVolumes = volumes.filter((vol) =>
    vol.Name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Volumes</h2>
        <p className="text-muted-foreground">Manage persistent storage volumes for your containers.</p>
      </div>

      <div className="flex items-center justify-between">
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
        <div className="text-sm text-muted-foreground">
          Showing {filteredVolumes.length} of {volumes.length} volumes
        </div>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Mountpoint</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVolumes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No volumes found.
                </TableCell>
              </TableRow>
            ) : (
              filteredVolumes.map((vol) => (
                <TableRow key={vol.Name}>
                  <TableCell className="font-mono text-sm font-medium">
                    {vol.Name.substring(0, 24)}...
                  </TableCell>
                  <TableCell>{vol.Driver}</TableCell>
                  <TableCell className="text-muted-foreground text-xs truncate max-w-[200px]" title={vol.Mountpoint}>
                    {vol.Mountpoint}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeVolume(vol.Name)}
                      title="Remove Volume"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
