import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Mount {
  Type: string;
  Source: string;
  Destination: string;
  Mode: string;
  RW: boolean;
  Propagation: string;
}

export function BindMountsTab({ mounts }: { mounts: Mount[] }) {
  if (!mounts || mounts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center border-t border-border/50 bg-muted/10 text-muted-foreground">
        This container has no bind mounts.
      </div>
    );
  }

  return (
    <div className="border-t border-border/50 h-full overflow-auto">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Source (Host path)</TableHead>
            <TableHead className="font-semibold">Destination (Container path)</TableHead>
            <TableHead className="font-semibold">Mode</TableHead>
            <TableHead className="font-semibold">Read/Write</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mounts.map((m, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{m.Type}</TableCell>
              <TableCell className="text-muted-foreground text-xs">{m.Source}</TableCell>
              <TableCell className="text-xs">{m.Destination}</TableCell>
              <TableCell>{m.Mode || "-"}</TableCell>
              <TableCell>{m.RW ? "Yes" : "No"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
