import { ScrollArea } from "@/components/ui/scroll-area";

export function InspectTab({ inspectData }: { inspectData: any }) {
  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-t border-border/50">
      <ScrollArea className="flex-1 p-4">
        <pre className="text-[13px] font-mono text-[#ce9178] whitespace-pre-wrap leading-relaxed">
          {JSON.stringify(inspectData, null, 2)}
        </pre>
      </ScrollArea>
    </div>
  );
}
