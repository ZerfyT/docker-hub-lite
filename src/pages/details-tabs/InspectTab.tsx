import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon, CopyIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

export function InspectTab({ inspectData }: { inspectData: any }) {
  const [searchQuery, setSearchQuery] = useState("");

  const jsonString = useMemo(() => JSON.stringify(inspectData, null, 2) || "", [inspectData]);
  const lines = useMemo(() => jsonString.split('\n'), [jsonString]);

  const copyData = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      toast.success("Inspect data copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy inspect data");
    }
  };

  const filteredLines = useMemo(() => {
    if (!searchQuery) return lines;
    return lines.filter(line => line.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [lines, searchQuery]);

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden bg-zinc-950 relative rounded-b-md">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-border/10 bg-zinc-900/50">
        <div className="relative w-64">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-xs bg-zinc-900 border-zinc-800 text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
            placeholder="Filter inspect data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs bg-zinc-900 border-zinc-800 text-neutral-300 hover:bg-zinc-800 hover:text-white" onClick={copyData}>
            <CopyIcon className="h-4 w-4 mr-1" /> Copy All
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full h-full p-4">
        <div className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words text-blue-300">
          {filteredLines.length === 0 ? (
            <div className="text-neutral-500 italic">No matches found.</div>
          ) : (
            filteredLines.map((line, index) => (
              <div key={index} className="mb-1">
                {line}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
