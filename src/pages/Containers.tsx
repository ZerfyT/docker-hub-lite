import { useState } from "react";
import { ContainerTable } from "@/components/dashboard/ContainerTable";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useStore } from "@/store/useStore";

export function Containers() {
  const { containers, fetchContainers } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContainers = containers.filter(
    (c) =>
      c.Names?.[0]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.Image?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Containers</h2>
        <p className="text-muted-foreground">Manage, start, stop, and monitor all your Docker containers.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search containers by name or image..."
            className="pl-9 bg-background border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredContainers.length} of {containers.length} containers
        </div>
      </div>

      <div className="rounded-md border bg-background">
        <ContainerTable containers={filteredContainers} onRefresh={fetchContainers} />
      </div>
    </div>
  );
}
