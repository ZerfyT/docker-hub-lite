import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play } from "@phosphor-icons/react";

export function ExecTab({ containerId, isRunning }: { containerId: string, isRunning: boolean }) {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<{ cmd: string; out: string; error?: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const runCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!command.trim() || !isRunning) return;

    const currentCmd = command;
    setCommand("");
    setIsLoading(true);

    try {
      // Basic splitting for shell args
      const args = ["sh", "-c", currentCmd];
      // Note: we're using "sh -c <cmd>" so pipelines and spaces are evaluated by the container's shell
      const output = await invoke<string>("exec_command", { id: containerId, cmd: args });
      
      setHistory((prev) => [...prev, { cmd: currentCmd, out: output }]);
    } catch (error) {
      setHistory((prev) => [...prev, { cmd: currentCmd, out: String(error), error: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRunning) {
    return (
      <div className="flex h-full items-center justify-center border-t border-border/50 text-muted-foreground p-8">
        Container is not running. Exec is unavailable.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/10 border-t border-border/50">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {history.length === 0 && (
            <div className="text-muted-foreground text-xs font-mono mb-4">
              Type a command to execute it inside the container using `sh -c`. This is a non-interactive shell.
            </div>
          )}
          {history.map((entry, i) => (
            <div key={i} className="font-mono text-[13px]">
              <div className="text-primary font-bold">$ {entry.cmd}</div>
              <pre className={`whitespace-pre-wrap leading-relaxed mt-1 ${entry.error ? 'text-destructive' : 'text-foreground'}`}>
                {entry.out || "\n"}
              </pre>
            </div>
          ))}
          {isLoading && <div className="text-muted-foreground text-sm animate-pulse font-mono">Running...</div>}
        </div>
      </ScrollArea>
      <div className="p-3 border-t bg-muted/20">
        <form onSubmit={runCommand} className="flex items-center gap-2">
          <span className="text-muted-foreground font-bold font-mono pl-2">$</span>
          <Input 
            value={command} 
            onChange={(e) => setCommand(e.target.value)}
            placeholder="ls -la /" 
            className="flex-1 bg-background border-border text-foreground font-mono h-9"
            disabled={isLoading}
            autoFocus
          />
          <Button type="submit" size="sm" variant="secondary" disabled={isLoading || !command.trim()}>
            <Play className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
