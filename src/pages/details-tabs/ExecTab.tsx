import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayIcon, CopyIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

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

  const copyHistory = async () => {
    try {
      const text = history.map(h => `$ ${h.cmd}\n${h.out}`).join('\n\n');
      await navigator.clipboard.writeText(text);
      toast.success("Execution history copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy history");
    }
  };

  if (!isRunning) {
    return (
      <div className="flex h-full w-full min-h-0 items-center justify-center bg-zinc-950 text-neutral-500 rounded-b-md">
        Container is not running. Exec is unavailable.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden bg-zinc-950 relative rounded-b-md font-mono text-[13px]">
      {/* Toolbar */}
      <div className="flex items-center justify-end p-2 border-b border-border/10 bg-zinc-900/50">
        <Button variant="outline" size="sm" className="h-8 text-xs bg-zinc-900 border-zinc-800 text-neutral-300 hover:bg-zinc-800 hover:text-white" onClick={copyHistory} disabled={history.length === 0}>
          <CopyIcon className="h-4 w-4 mr-1" /> Copy History
        </Button>
      </div>

      <ScrollArea className="flex-1 w-full h-full p-4" ref={scrollRef}>
        <div className="space-y-4">
          {history.length === 0 && (
            <div className="text-neutral-500 italic">
              Type a command to execute it inside the container using `sh -c`. This is a non-interactive shell.
            </div>
          )}
          {history.map((entry, i) => (
            <div key={i} className="leading-relaxed">
              <div className="text-blue-400 font-semibold">$ {entry.cmd}</div>
              <pre className={`whitespace-pre-wrap break-all mt-1 ${entry.error ? 'text-red-400' : 'text-neutral-300'}`}>
                {entry.out || "\n"}
              </pre>
            </div>
          ))}
          {isLoading && <div className="text-yellow-400 animate-pulse">Executing...</div>}
        </div>
      </ScrollArea>
      <div className="p-3 border-t border-border/10 bg-zinc-900/80">
        <form onSubmit={runCommand} className="flex items-center gap-2">
          <span className="text-blue-400 font-bold pl-2">$</span>
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="ls -la /"
            className="flex-1 bg-zinc-950 border-zinc-800 text-neutral-200 placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-primary h-9 font-mono text-[13px]"
            disabled={isLoading}
            autoFocus
          />
          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" disabled={isLoading || !command.trim()}>
            <PlayIcon className="h-4 w-4" weight="fill" />
          </Button>
        </form>
      </div>
    </div>
  );
}
