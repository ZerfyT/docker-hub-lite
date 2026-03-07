import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ContainerTable, Container } from "@/components/dashboard/ContainerTable";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

export function Containers() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchContainers = async () => {
    try {
      const data = await invoke<Container[]>("get_containers");
      setContainers(data);
    } catch (error) {
      console.error("Failed to fetch containers:", error);
    }
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 3000);
    return () => clearInterval(interval);
  }, []);

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
