import { ScrollArea } from "@/components/ui/scroll-area";

export function InspectTab({ inspectData }: { inspectData: any }) {
  return (
    <div className="flex flex-col h-full bg-muted/10 border-t border-border/50">
      <ScrollArea className="flex-1 p-4">
        <pre className="text-[13px] text-primary whitespace-pre-wrap leading-relaxed">
          {JSON.stringify(inspectData, null, 2)}
        </pre>
      </ScrollArea>
    </div>
  );
}
