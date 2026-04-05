import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, File, ArrowLeft, ArrowClockwise } from "@phosphor-icons/react";

interface FileEntry {
  permissions: string;
  links: string;
  owner: string;
  group: string;
  size: string;
  date: string;
  time: string;
  name: string;
  isDirectory: boolean;
  isSymlink: boolean;
}

export function FilesTab({ containerId, isRunning }: { containerId: string, isRunning: boolean }) {
  const [currentPath, setCurrentPath] = useState("/");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async (dir: string) => {
    if (!isRunning) return;
    setLoading(true);
    setError(null);
    try {
      const output = await invoke<string>("exec_command", {
        id: containerId,
        cmd: ["ls", "-la", "--time-style=+%Y-%m-%d %H:%M", dir]
      });
      // Parse ls -la output
      const lines = output.trim().split("\n");
      const parsedFiles: FileEntry[] = [];

      for (const line of lines) {
        if (line.startsWith("total")) continue;

        // Example: drwxr-xr-x 1 root root 4096 Apr  5 03:29 bin
        // Using a basic regex to match standard unix ls -la
        const parts = line.split(/\s+/);
        if (parts.length >= 8) {
          const name = parts.slice(7).join(" ");
          if (name === "." || name === "..") continue;

          parsedFiles.push({
            permissions: parts[0],
            links: parts[1],
            owner: parts[2],
            group: parts[3],
            size: parts[4],
            date: parts[5],
            time: parts[6],
            name: name,
            isDirectory: parts[0].startsWith("d"),
            isSymlink: parts[0].startsWith("l"),
          });
        }
      }

      // Sort directories first
      parsedFiles.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      setFiles(parsedFiles);
      setCurrentPath(dir);
    } catch (err) {
      console.error("Failed to list files:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles("/");
  }, [containerId, isRunning]);

  const handleNavigateUp = () => {
    if (currentPath === "/") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const upPath = "/" + parts.join("/");
    fetchFiles(upPath);
  };

  const handleNavigateIn = (name: string, isDir: boolean) => {
    if (!isDir) return; // File viewing not yet supported here easily without cat
    const newPath = currentPath.endsWith("/") ? `${currentPath}${name}` : `${currentPath}/${name}`;
    fetchFiles(newPath);
  };

  if (!isRunning) {
    return (
      <div className="flex h-full items-center justify-center border-t border-border/50 text-muted-foreground p-8">
        Container must be running to browse files via exec.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-t border-border/50">
      <div className="flex items-center gap-2 p-2 border-b bg-muted/20">
        <Button variant="ghost" size="icon" onClick={handleNavigateUp} disabled={currentPath === "/" || loading}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => fetchFiles(currentPath)} disabled={loading}>
          <ArrowClockwise className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <div className="flex-1 text-sm bg-background p-1.5 px-3 rounded-md border min-h-[32px] flex items-center overflow-x-auto truncate">
          {currentPath}
        </div>
      </div>

      <ScrollArea className="flex-1 bg-card">
        {error ? (
          <div className="p-4 text-red-500 text-sm">{error}</div>
        ) : (
          <div className="w-full text-sm">
            <div className="grid grid-cols-[auto_1fr_100px_150px] gap-4 p-2 border-b text-muted-foreground font-semibold px-4 sticky top-0 bg-card z-10 shadow-sm">
              <div className="w-6"></div>
              <div>Name</div>
              <div>Size</div>
              <div>Modified</div>
            </div>
            {files.map((f, i) => (
              <div
                key={i}
                className={`grid grid-cols-[auto_1fr_100px_150px] gap-4 p-2 px-4 border-b border-border/40 hover:bg-muted/40 transition-colors ${f.isDirectory || f.isSymlink ? 'cursor-pointer' : ''}`}
                onClick={() => handleNavigateIn(f.name, f.isDirectory || f.isSymlink)}
              >
                <div className="flex items-center justify-center w-6">
                  {f.isDirectory ? <Folder className="h-4 w-4 text-primary" weight="fill" /> : <File className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className={`truncate ${f.isDirectory ? 'font-medium text-foreground' : 'text-muted-foreground font-medium'}`}>
                  {f.name}
                </div>
                <div className="text-muted-foreground text-xs flex items-center">
                  {f.isDirectory ? "-" : f.size}
                </div>
                <div className="text-muted-foreground text-xs flex items-center">
                  {f.date} {f.time}
                </div>
              </div>
            ))}
            {files.length === 0 && !loading && (
              <div className="p-8 text-center text-muted-foreground">Directory is empty</div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
