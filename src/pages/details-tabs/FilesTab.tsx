import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderIcon, FileIcon, ArrowLeftIcon, ArrowClockwiseIcon, PencilSimpleIcon, FloppyDiskIcon, DownloadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

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
  symlinkTarget?: string;
}

const formatSize = (bytesStr: string, isDir: boolean) => {
  if (isDir) return "-";
  if (bytesStr.includes(",")) return bytesStr; // Device files (major, minor)
  const bytes = parseInt(bytesStr, 10);
  if (isNaN(bytes)) return bytesStr;
  if (bytes === 0) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1) return "< 1 KB";
  if (kb >= 1024) return (kb / 1024).toFixed(1) + " MB";
  return Math.round(kb) + " KB";
};

const getFileType = (f: FileEntry) => {
  if (f.isSymlink) return "Symlink";
  if (f.isDirectory) return "Dir";
  return "File";
};

export function FilesTab({ containerId, isRunning }: { containerId: string, isRunning: boolean }) {
  const [currentPath, setCurrentPath] = useState("/");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File Viewer State
  const [activeFile, setActiveFile] = useState<{ path: string, name: string, content: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [fileActionLoading, setFileActionLoading] = useState(false);

  const fetchFiles = async (dir: string) => {
    if (!isRunning) return;
    setLoading(true);
    setError(null);
    try {
      let output = await invoke<string>("exec_command", {
        id: containerId,
        cmd: ["ls", "-la", "--time-style=+%Y-%m-%d %H:%M", dir]
      });

      // Fallback for BusyBox/Alpine which do not support --time-style
      if (output.includes("unrecognized option") || output.includes("invalid option") || output.includes("illegal option") || output.includes("Usage:")) {
        output = await invoke<string>("exec_command", {
          id: containerId,
          cmd: ["ls", "-la", dir]
        });
      }

      const lines = output.trim().split("\n");
      const parsedFiles: FileEntry[] = [];

      for (const line of lines) {
        if (line.startsWith("total") || line.trim() === "") continue;

        const parts = line.split(/\s+/);
        if (parts.length >= 8) {
          const isDevice = parts[0].startsWith('c') || parts[0].startsWith('b');
          let dateIndex = 5;
          let size = parts[4];

          if (isDevice) {
            size = parts[4] + " " + parts[5];
            dateIndex = 6;
          }

          let date = "";
          let time = "";
          let nameIndex = 0;

          // Check if date format is GNU style (YYYY-MM-DD)
          if (/^\d{4}-\d{2}-\d{2}$/.test(parts[dateIndex])) {
            date = parts[dateIndex];
            time = parts[dateIndex + 1];
            nameIndex = dateIndex + 2;
          } else {
            // Busybox / standard style (e.g. Jan 15 10:30 or Jan 15 2023)
            date = `${parts[dateIndex]} ${parts[dateIndex + 1]} ${parts[dateIndex + 2]}`;
            time = "";
            nameIndex = dateIndex + 3;
          }

          let name = parts.slice(nameIndex).join(" ");
          if (name === "." || name === "..") continue;

          let isSymlink = parts[0].startsWith("l");
          let symlinkTarget = undefined;
          if (isSymlink && name.includes(" -> ")) {
            const nameParts = name.split(" -> ");
            name = nameParts[0];
            symlinkTarget = nameParts.slice(1).join(" -> ");
          }

          parsedFiles.push({
            permissions: parts[0],
            links: parts[1],
            owner: parts[2],
            group: parts[3],
            size: size,
            date: date,
            time: time,
            name: name,
            isDirectory: parts[0].startsWith("d"),
            isSymlink: isSymlink,
            symlinkTarget: symlinkTarget
          });
        }
      }

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
    fetchFiles(upPath || "/");
  };

  const handleNavigateIn = async (name: string, isDir: boolean, isSymlink: boolean) => {
    const newPath = currentPath.endsWith("/") ? `${currentPath}${name}` : `${currentPath}/${name}`;
    if (isDir) {
      fetchFiles(newPath);
    } else if (isSymlink) {
      setFileActionLoading(true);
      try {
        const check = await invoke<string>("exec_command", {
          id: containerId,
          cmd: ["sh", "-c", `if [ -d "${newPath}" ]; then echo "DIR"; else echo "FILE"; fi`]
        });
        setFileActionLoading(false);
        if (check.trim() === "DIR") {
          fetchFiles(newPath);
        } else {
          openFile(newPath, name);
        }
      } catch (err) {
        setFileActionLoading(false);
        toast.error("Failed to resolve symlink");
      }
    } else {
      openFile(newPath, name);
    }
  };

  const openFile = async (path: string, name: string) => {
    setFileActionLoading(true);
    try {
      // 1. Known binary extensions check
      const binaryExts = ['.zip', '.tar', '.gz', '.tgz', '.bz2', '.xz', '.rar', '.7z', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.pdf', '.exe', '.dll', '.so', '.dylib', '.a', '.o', '.bin', '.jar', '.class', '.pyc', '.pyo', '.pyd', '.db', '.sqlite', '.sqlite3', '.mp3', '.mp4', '.avi', '.mkv', '.mov', '.wav'];
      const lowerName = name.toLowerCase();
      if (binaryExts.some(ext => lowerName.endsWith(ext))) {
        toast.error("Cannot open known binary files in the text viewer.");
        setFileActionLoading(false);
        return;
      }

      // 2. File size check (limit to ~2MB)
      const sizeCheck = await invoke<string>("exec_command", {
        id: containerId,
        cmd: ["sh", "-c", `stat -c%s "${path}" 2>/dev/null || wc -c < "${path}"`]
      });
      const bytes = parseInt(sizeCheck.trim());
      if (!isNaN(bytes) && bytes > 1024 * 1024 * 2) {
        toast.error("File is too large to open in viewer (max 2MB).");
        setFileActionLoading(false);
        return;
      }

      // 3. Read file
      const output = await invoke<string>("exec_command", {
        id: containerId,
        cmd: ["cat", path]
      });

      // 4. Null byte check for extensionless binaries
      if (output.includes('\0')) {
        toast.error("File appears to be binary. Cannot open in text viewer.");
        setFileActionLoading(false);
        return;
      }

      setActiveFile({ path, name, content: output });
      setEditContent(output);
      setIsEditing(false);
    } catch (err) {
      toast.error(`Failed to read file: ${err}`);
    } finally {
      setFileActionLoading(false);
    }
  };

  const saveFile = async () => {
    setFileActionLoading(true);
    try {
      // Use Blob to safely convert UTF-8 string to base64 in the browser
      const blob = new Blob([editContent]);
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64data = (reader.result as string).split(',')[1];
          await invoke("exec_command", {
            id: containerId,
            cmd: ["sh", "-c", `echo "${base64data}" | base64 -d > "${activeFile?.path}"`]
          });
          toast.success("File saved successfully!");
          setActiveFile(prev => prev ? { ...prev, content: editContent } : null);
          setIsEditing(false);
        } catch (err) {
          toast.error(`Failed to save file: ${err}`);
        } finally {
          setFileActionLoading(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      toast.error(`Failed to process file: ${err}`);
      setFileActionLoading(false);
    }
  };

  const downloadFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Download started");
  };

  if (!isRunning) {
    return (
      <div className="flex h-full items-center justify-center border-t border-border/50 text-muted-foreground p-8">
        Container must be running to browse files via exec.
      </div>
    );
  }

  // File Viewer View
  if (activeFile) {
    return (
      <div className="flex flex-col h-full w-full min-h-0 overflow-hidden relative rounded-b-md border-t border-border/50 bg-background">
        <div className="flex items-center justify-between p-2 border-b bg-muted/20">
          <div className="flex items-center gap-2 overflow-hidden">
            <Button variant="ghost" size="sm" onClick={() => setActiveFile(null)} disabled={fileActionLoading}>
              <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="text-sm font-medium truncate text-muted-foreground">
              {activeFile.path}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} disabled={fileActionLoading}>
                  <PencilSimpleIcon className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={downloadFile} disabled={fileActionLoading}>
                  <DownloadSimpleIcon className="h-4 w-4 mr-1" /> Download
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditContent(activeFile.content); }} disabled={fileActionLoading}>
                  <XIcon className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button variant="default" size="sm" onClick={saveFile} disabled={fileActionLoading}>
                  <FloppyDiskIcon className="h-4 w-4 mr-1" /> Save
                </Button>
              </>
            )}
          </div>
        </div>
        <ScrollArea className="flex-1 w-full h-full bg-zinc-950">
          {fileActionLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          {isEditing ? (
            <textarea
              className="w-full h-full min-h-[500px] bg-zinc-950 text-neutral-200 p-4 font-mono text-[13px] leading-relaxed resize-none focus:outline-none focus:ring-0 border-0"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <div className="p-4 font-mono text-[13px] leading-relaxed text-neutral-200 whitespace-pre-wrap break-words">
              {activeFile.content}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  // Directory Browser View
  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden relative rounded-b-md border-t border-border/50">
      <div className="flex items-center gap-2 p-2 border-b bg-muted/20">
        <Button variant="ghost" size="icon" onClick={handleNavigateUp} disabled={currentPath === "/" || loading}>
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => fetchFiles(currentPath)} disabled={loading}>
          <ArrowClockwiseIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <div className="flex-1 text-sm bg-background p-1.5 px-3 rounded-md border min-h-[32px] flex items-center overflow-x-auto truncate">
          {currentPath}
        </div>
      </div>

      <ScrollArea className="flex-1 w-full h-full bg-card">
        {fileActionLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        {error ? (
          <div className="p-4 text-red-500 text-sm">{error}</div>
        ) : (
          <div className="w-full text-sm pb-4 min-w-[750px] overflow-x-auto">
            <div className="grid grid-cols-[auto_1fr_100px_80px_100px_120px_140px] gap-4 p-2 border-b text-muted-foreground font-semibold px-4 sticky top-0 bg-card z-10 shadow-sm">
              <div className="w-6"></div>
              <div>Name</div>
              <div>Size</div>
              <div>Type</div>
              <div>Perms</div>
              <div>Owner</div>
              <div>Modified</div>
            </div>
            {files.map((f, i) => (
              <div
                key={i}
                className={`grid grid-cols-[auto_1fr_100px_80px_100px_120px_140px] gap-4 p-2 px-4 border-b border-border/40 hover:bg-muted/40 transition-colors cursor-pointer`}
                onClick={() => handleNavigateIn(f.name, f.isDirectory, f.isSymlink)}
              >
                <div className="flex items-center justify-center w-6">
                  {f.isDirectory ? <FolderIcon className="h-4 w-4 text-primary" weight="fill" /> : <FileIcon className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className={`truncate ${f.isDirectory ? 'font-medium text-foreground' : 'text-muted-foreground font-medium'}`}>
                  {f.name} {f.symlinkTarget && <span className="text-muted-foreground/60 font-normal">→ {f.symlinkTarget}</span>}
                </div>
                <div className="text-muted-foreground text-xs flex items-center">
                  {formatSize(f.size, f.isDirectory)}
                </div>
                <div className="text-muted-foreground text-xs flex items-center">
                  {getFileType(f)}
                </div>
                <div className="text-muted-foreground text-xs flex items-center font-mono">
                  {f.permissions}
                </div>
                <div className="text-muted-foreground text-xs flex items-center truncate">
                  {f.owner}:{f.group}
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
