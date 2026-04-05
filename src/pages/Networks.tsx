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

export function Networks() {
  const { networks, fetchNetworks } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  const removeNetwork = async (id: string) => {
    try {
      await invoke("remove_network", { id });
      fetchNetworks();
    } catch (error) {
      console.error("Failed to remove network:", error);
      alert(`Failed to remove network: ${error}`);
    }
  };

  const filteredNetworks = networks.filter((net) =>
    net.Name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Networks</h2>
        <p className="text-muted-foreground">Manage network bridges and routing.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search networks by name..."
            className="pl-9 bg-background border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredNetworks.length} of {networks.length} networks
        </div>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Network ID</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNetworks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No networks found.
                </TableCell>
              </TableRow>
            ) : (
              filteredNetworks.map((net) => {
                const shortId = net.Id.substring(0, 12);
                const isBuiltin = net.Name === "bridge" || net.Name === "host" || net.Name === "none";

                return (
                  <TableRow key={net.Id}>
                    <TableCell className="font-medium">{net.Name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {shortId}
                    </TableCell>
                    <TableCell>{net.Driver}</TableCell>
                    <TableCell>{net.Scope}</TableCell>
                    <TableCell className="text-right">
                      {!isBuiltin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeNetwork(net.Id)}
                          title="Remove Network"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
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
