import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagnifyingGlassIcon, TrashIcon, InfoIcon } from "@phosphor-icons/react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { NetworkTable } from "@/components/dashboard/NetworkTable";

export function Networks() {
  const { networks, fetchNetworks } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const builtinCount = networks.filter(net => ["bridge", "host", "none"].includes(net.Name)).length;
  const customCount = networks.length - builtinCount;

  const filteredNetworks = networks.filter((net) =>
    net.Name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  console.log(networks);


  const handleBulkAction = async (action: string) => {
    if (selected.length === 0) return;

    if (confirm("Are you sure you want to delete the selected networks?")) {
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
        toast.success(`Successfully executed action on ${successCount} network(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to execute action on ${failCount} network(s)`);
      }

      setSelected([]);
      fetchNetworks();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 relative">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Networks</h2>
        </div>
      </div>

      <div className="flex items-center gap-16 mb-4 mt-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold flex items-center gap-1.5">
            Networks <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="text-primary font-medium text-sm mt-1 flex gap-2 items-center">
            {networks.length} Total
            <span className="text-muted-foreground">/</span>
            <span className="text-green-500">{customCount} Custom</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-neutral-500">{builtinCount} Built-in</span>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
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
          {selected.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-2 font-medium">{selected.length} selected</span>
              <Button size="icon" variant="destructive" className="h-9 w-9" onClick={() => handleBulkAction("remove_network")} title="Delete">
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredNetworks.length} of {networks.length} networks
        </div>
      </div>

      <div className="rounded-md border bg-background overflow-hidden relative">
        <NetworkTable
          networks={filteredNetworks}
          onRefresh={fetchNetworks}
          selected={selected}
          onSelectedChange={setSelected}
        />
      </div>
    </div>
  );
}
