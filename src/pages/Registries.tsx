import { useStore } from "@/store/useStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      isDockerHub: registry.includes("docker.io"),
    }));
  }, [dockerConfig]);

  const filteredRegistries = useMemo(() => {
    if (!searchQuery) return registries;
    const lowerQuery = searchQuery.toLowerCase();
    return registries.filter((r) => r.registry.toLowerCase().includes(lowerQuery));
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
      const cmd = Command.create("sh", ["-c", script]);
      await cmd.spawn();
      toast.info("Opened terminal for Docker login");
    } catch (e) {
      toast.error(`Failed to launch terminal: ${e}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Registries & Credentials
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage authenticated container registries and Docker Hub credentials.
          </p>
        </div>
        <Button onClick={handleExternalLogin} className="gap-2 text-xs font-medium">
          <LockKeyIcon className="h-4 w-4" />
          <span>Add / Login</span>
        </Button>
      </div>

      {/* Modern Telemetry Banner */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Stored Credentials</span>
            <span className="font-mono text-foreground font-bold">
              {registries.length} Authenticated
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 text-emerald-500 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Session
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-muted-foreground">~/.docker/config.json</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Default Upstream</span>
            <span className="font-mono text-foreground font-bold">index.docker.io/v1/</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Official Docker Hub repository index with public & private namespace access
          </p>
        </div>
      </div>

      <TableActionsBar
        itemName="registries"
        searchPlaceholder="Search registries..."
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalCount={registries.length}
        filteredCount={filteredRegistries.length}
      />

      <div
        tabIndex={0}
        role="region"
        aria-label="Registries list"
        className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs overflow-x-auto text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
      >
        <Table>
          <TableHeader className="bg-muted/50 backdrop-blur-xs sticky top-0 z-10">
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="font-semibold text-foreground min-w-[240px]">Registry URL</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[140px]">Auth Status</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[140px]">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegistries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border/60">
                      <ShieldCheckIcon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No authenticated registries</p>
                    <p className="text-xs text-muted-foreground">
                      Use the "Add / Login" button above to log into Docker Hub or a private registry.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRegistries.map((r, i) => (
                <TableRow key={i} className="hover:bg-muted/40 transition-colors border-border/50">
                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    {r.registry}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Authenticated</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    {r.isDockerHub ? (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        Docker Hub
                      </span>
                    ) : (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                        Private Registry
                      </span>
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
