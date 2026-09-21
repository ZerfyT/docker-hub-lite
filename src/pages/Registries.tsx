import { useStore } from "@/store/useStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableActionsBar } from "@/components/dashboard/TableActionsBar";
import { useState, useMemo, useEffect } from "react";
import { LockKeyIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Command } from "@tauri-apps/plugin-shell";

export function Registries() {
  const { dockerConfig, fetchDockerConfig } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDockerConfig();
  }, [fetchDockerConfig]);

  const registries = useMemo(() => {
    if (!dockerConfig || !dockerConfig.auths) return [];
    
    return Object.entries(dockerConfig.auths).map(([registry, details]) => ({
      registry,
      details,
      isDockerHub: registry.includes("docker.io")
    }));
  }, [dockerConfig]);

  const filteredRegistries = useMemo(() => {
    if (!searchQuery) return registries;
    const lowerQuery = searchQuery.toLowerCase();
    return registries.filter(r => r.registry.toLowerCase().includes(lowerQuery));
  }, [registries, searchQuery]);

  const handleExternalLogin = async () => {
    try {
      const script = `
        if command -v gnome-terminal >/dev/null 2>&1; then
            gnome-terminal -- docker login
        elif command -v konsole >/dev/null 2>&1; then
            konsole -e docker login
        elif command -v x-terminal-emulator >/dev/null 2>&1; then
            x-terminal-emulator -e "docker login"
        elif command -v xterm >/dev/null 2>&1; then
            xterm -e "docker login"
        else
            exit 1
        fi
      `;
      const cmd = Command.create('sh', ['-c', script]);
      await cmd.spawn();
      toast.info("Opened terminal for Docker login");
    } catch (e) {
      toast.error(`Failed to launch terminal: ${e}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Registries & Credentials</h2>
          <p className="text-muted-foreground">Manage your authenticated Docker image registries.</p>
        </div>
        <Button onClick={handleExternalLogin}>
          <LockKeyIcon className="mr-2" />
          Add / Login
        </Button>
      </div>

      <TableActionsBar
        itemName="registries"
        searchPlaceholder="Search registries..."
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalCount={registries.length}
        filteredCount={filteredRegistries.length}
      />

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Registry URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegistries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                  <ShieldCheckIcon size={48} className="mx-auto mb-4 opacity-20" />
                  No authenticated registries found in config.json.
                </TableCell>
              </TableRow>
            ) : (
              filteredRegistries.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.registry}</TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-none border-0">
                      Authenticated
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.isDockerHub ? (
                      <Badge variant="outline" className="border-primary text-primary">Docker Hub</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Private Registry</Badge>
                    )}
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
