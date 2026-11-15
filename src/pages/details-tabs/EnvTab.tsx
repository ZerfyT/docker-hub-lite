import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KeyIcon, CopyIcon, EyeIcon, EyeSlashIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface EnvTabProps {
  envList?: string[];
}

export function EnvTab({ envList = [] }: EnvTabProps) {
  const [search, setSearch] = useState("");
  const [showSecrets, setShowSecrets] = useState(false);

  const parsedEnv = useMemo(() => {
    return envList.map((entry) => {
      const idx = entry.indexOf("=");
      if (idx === -1) {
        return { key: entry, value: "" };
      }
      return {
        key: entry.substring(0, idx),
        value: entry.substring(idx + 1),
      };
    });
  }, [envList]);

  const filteredEnv = useMemo(() => {
    if (!search) return parsedEnv;
    const q = search.toLowerCase();
    return parsedEnv.filter(
      (e) => e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q)
    );
  }, [parsedEnv, search]);

  const isSensitive = (key: string) => {
    const k = key.toLowerCase();
    return (
      k.includes("pass") ||
      k.includes("secret") ||
      k.includes("token") ||
      k.includes("key") ||
      k.includes("auth") ||
      k.includes("cert") ||
      k.includes("cred")
    );
  };

  const copyEnvFile = async () => {
    const content = parsedEnv.map((e) => `${e.key}=${e.value}`).join("\n");
    try {
      await navigator.clipboard.writeText(content);
      toast.success(".env file format copied to clipboard!");
    } catch {
      toast.error("Failed to copy environment variables");
    }
  };

  const copySingle = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(`${key}=${value}`);
      toast.success(`Copied ${key}`);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden bg-card text-card-foreground relative rounded-b-md">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20 gap-3">
        <div className="relative w-72">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search environment variables..."
            className="pl-8 h-8 text-xs bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setShowSecrets(!showSecrets)}
          >
            {showSecrets ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            {showSecrets ? "Mask Secrets" : "Reveal Secrets"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={copyEnvFile}
            disabled={parsedEnv.length === 0}
          >
            <CopyIcon className="h-4 w-4" />
            Copy as .env
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full h-full">
        {filteredEnv.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <KeyIcon size={40} className="mb-2 opacity-20" />
            <p className="text-sm">No environment variables found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-1/3">Variable Name</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-16 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnv.map((e, i) => {
                const sensitive = isSensitive(e.key);
                const displayVal =
                  sensitive && !showSecrets ? "••••••••••••••••" : e.value || '""';

                return (
                  <TableRow key={i} className="font-mono text-xs hover:bg-muted/30">
                    <TableCell className="font-semibold text-primary">
                      <div className="flex items-center gap-1.5">
                        <span>{e.key}</span>
                        {sensitive && (
                          <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 h-4 text-amber-500 border-amber-500/30">
                            secret
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="break-all text-muted-foreground select-all">
                      {displayVal}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => copySingle(e.key, e.value)}
                        title="Copy variable"
                      >
                        <CopyIcon className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  );
}
