import { useStore } from "@/store/useStore";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MoonIcon, SunIcon, ArrowsClockwise, BroomIcon, ShieldWarningIcon, RocketLaunchIcon, CodeIcon, TerminalWindowIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AppSettings() {
  const { mode, setMode, isPolling, setIsPolling, systemPrune, daemonJson, daemonJsonError, fetchDaemonJson, editDaemonJsonExternal } = useStore();
  const [pruneDialogOpen, setPruneDialogOpen] = useState(false);
  const [isPruning, setIsPruning] = useState(false);
  const [autoStart, setAutoStart] = useState(false);

  useEffect(() => {
    fetchDaemonJson();
    // Check autostart status
    const checkAutostart = async () => {
      try {
        setAutoStart(await isEnabled());
      } catch (e) {
        console.error("Failed to check autostart", e);
      }
    };
    checkAutostart();
  }, [fetchDaemonJson]);

  const toggleAutoStart = async (checked: boolean) => {
    try {
      if (checked) {
        await enable();
      } else {
        await disable();
      }
      setAutoStart(checked);
    } catch (e) {
      toast.error(`Failed to change auto-start setting: ${e}`);
    }
  };

  const handlePrune = async () => {
    setIsPruning(true);
    toast.info("Starting system prune... This may take a moment.");
    try {
      const msg = await systemPrune();
      toast.success(msg || "System pruned successfully.");
    } catch (e: any) {
      toast.error(`Prune failed: ${e}`);
    } finally {
      setIsPruning(false);
      setPruneDialogOpen(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">App Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your Docker Lite desktop preferences and system integration.</p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs">
          <div className="p-6 pb-4 border-b border-border/50">
            <h3 className="font-semibold leading-none tracking-tight">Appearance</h3>
            <p className="text-sm text-muted-foreground mt-1.5">Customize the visual theme and presentation.</p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  {mode === "dark" ? <MoonIcon size={20} /> : <SunIcon size={20} />}
                </div>
                <div>
                  <Label className="text-base font-medium">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Switch between light and dark color schemes.</p>
                </div>
              </div>
              <Switch
                checked={mode === "dark"}
                onCheckedChange={(checked) => setMode(checked ? "dark" : "light")}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs">
          <div className="p-6 pb-4 border-b border-border/50">
            <h3 className="font-semibold leading-none tracking-tight">Behavior</h3>
            <p className="text-sm text-muted-foreground mt-1.5">Manage how Docker Lite interacts with your local daemon.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <ArrowsClockwise size={20} />
                </div>
                <div>
                  <Label className="text-base font-medium">Auto-Refresh</Label>
                  <p className="text-sm text-muted-foreground">Automatically poll Docker daemon for changes in the background.</p>
                </div>
              </div>
              <Switch
                checked={isPolling}
                onCheckedChange={setIsPolling}
              />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs">
          <div className="p-6 pb-4 border-b border-border/50">
            <h3 className="font-semibold leading-none tracking-tight">Disk Space & Cleanup</h3>
            <p className="text-sm text-muted-foreground mt-1.5">Free up storage by pruning unused Docker cache.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-destructive/10 p-2 rounded-lg text-destructive">
                  <BroomIcon size={20} />
                </div>
                <div>
                  <Label className="text-base font-medium">System Prune</Label>
                  <p className="text-sm text-muted-foreground">Remove all unused containers, networks, images, and build layers.</p>
                </div>
              </div>
              <Button variant="destructive" onClick={() => setPruneDialogOpen(true)} disabled={isPruning}>
                {isPruning ? "Pruning..." : "Prune System"}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs">
          <div className="p-6 pb-4 border-b border-border/50">
            <h3 className="font-semibold leading-none tracking-tight">System Integrations</h3>
            <p className="text-sm text-muted-foreground mt-1.5">OS-level integrations and startup behavior.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <RocketLaunchIcon size={20} />
                </div>
                <div>
                  <Label className="text-base font-medium">Launch on Startup</Label>
                  <p className="text-sm text-muted-foreground">Automatically start Docker Lite when you sign in.</p>
                </div>
              </div>
              <Switch
                checked={autoStart}
                onCheckedChange={toggleAutoStart}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 pb-4 border-b border-border/50">
            <h3 className="font-semibold leading-none tracking-tight">Docker Daemon Configuration</h3>
            <p className="text-sm text-muted-foreground mt-1.5">View and edit <code>daemon.json</code>.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <CodeIcon size={20} />
                </div>
                <div>
                  <Label className="text-base font-medium">daemon.json</Label>
                  <p className="text-sm text-muted-foreground">Raw configuration file for the Docker Engine.</p>
                </div>
              </div>
              <Button variant="outline" onClick={async () => {
                try {
                  await editDaemonJsonExternal();
                  toast.info("Opened external terminal to edit daemon.json");
                } catch (e) {
                  toast.error(`Failed to open terminal: ${e}`);
                }
              }}>
                <TerminalWindowIcon className="mr-2 h-4 w-4" /> Edit Externally
              </Button>
            </div>

            <div className="bg-muted/30 border border-border/50 rounded-lg overflow-hidden">
              {daemonJsonError ? (
                <div className="p-4 flex items-start gap-3 text-destructive bg-destructive/5">
                  <ShieldWarningIcon size={20} className="mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Permission Denied or Not Found</h4>
                    <p className="text-xs mt-1 opacity-90">{daemonJsonError}</p>
                    <p className="text-xs mt-2 text-muted-foreground">
                      Editing or viewing <code>/etc/docker/daemon.json</code> usually requires root/administrator privileges.
                      Click <strong>Edit Externally</strong> to open a sudo prompt in your terminal.
                    </p>
                  </div>
                </div>
              ) : (
                <pre className="p-4 text-xs font-mono overflow-auto max-h-[300px] text-muted-foreground">
                  {daemonJson || "Loading daemon configuration..."}
                </pre>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 pb-4 border-b border-border/50">
            <h3 className="font-semibold leading-none tracking-tight">Resource Limits</h3>
            <p className="text-sm text-muted-foreground mt-1.5">CPU, Memory, Swap, and Virtual Disk</p>
          </div>
          <div className="p-6">
            <div className="bg-muted/50 p-4 rounded-lg border border-border/50 text-sm text-muted-foreground">
              <p>
                <strong>Note:</strong> Global resource limits for Docker (such as maximum CPU cores, Memory limit, and Swap) are controlled by your host virtualization environment (e.g., Docker Desktop settings, WSL2 <code>.wslconfig</code>, or Colima).
              </p>
              <p className="mt-2">
                You can view your engine's currently allocated limits in the <strong>System Info</strong> tab. To modify these limits, please use your virtualization provider's native configuration tools.
              </p>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={pruneDialogOpen} onOpenChange={setPruneDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldWarningIcon className="h-5 w-5" />
              Destructive Action
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all stopped containers, all networks not used by at least one container, all dangling images, and all dangling volumes.
              <br /><br />
              <strong>Are you absolutely sure you want to proceed?</strong> This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPruning}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => {
              e.preventDefault();
              handlePrune();
            }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isPruning}>
              {isPruning ? "Pruning..." : "Yes, Prune System"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
