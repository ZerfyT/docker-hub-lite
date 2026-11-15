import { useStore } from "@/store/useStore";
import { useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export function NetworkMap() {
  const { containers, networks, mode } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Simple grid layout
    const netY = 80;

    // Add Networks
    networks.forEach((net, i) => {
      newNodes.push({
        id: `net-${net.Id}`,
        type: "default",
        position: { x: 150 + i * 280, y: netY },
        data: { label: `🌐 ${net.Name}` },
        style: {
          background: "rgba(59, 130, 246, 0.12)",
          border: "1.5px solid rgba(59, 130, 246, 0.6)",
          borderRadius: "50px",
          padding: "8px 18px",
          fontWeight: "600",
          fontSize: "12px",
          color: "var(--foreground)",
          boxShadow: "0 2px 10px rgba(59, 130, 246, 0.15)",
        },
      });
    });

    const contY = 280;

    // Add Containers
    containers.forEach((c, i) => {
      const containerId = `cont-${c.Id}`;
      const isRunning = c.State === "running";

      newNodes.push({
        id: containerId,
        type: "default",
        position: { x: 100 + (i % 4) * 220, y: contY + Math.floor(i / 4) * 120 },
        data: { label: `📦 ${c.Names[0]?.replace("/", "") || "Unknown"}` },
        style: {
          background: "var(--card)",
          border: isRunning
            ? "1.5px solid rgba(16, 185, 129, 0.6)"
            : "1px solid var(--border)",
          borderRadius: "10px",
          padding: "8px 14px",
          fontSize: "12px",
          fontWeight: "500",
          color: "var(--foreground)",
          boxShadow: isRunning ? "0 0 12px rgba(16, 185, 129, 0.2)" : "none",
        },
      });

      // Add Edges
      if (c.NetworkSettings?.Networks) {
        Object.keys(c.NetworkSettings.Networks).forEach((netName) => {
          const net = networks.find((n) => n.Name === netName);
          if (net) {
            newEdges.push({
              id: `e-${c.Id}-${net.Id}`,
              source: `net-${net.Id}`,
              target: containerId,
              animated: isRunning,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isRunning ? "#10b981" : "#71717a",
              },
              style: {
                stroke: isRunning ? "#10b981" : "#71717a",
                strokeWidth: 2,
              },
            });
          }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [containers, networks, setNodes, setEdges]);

  const runningCount = containers.filter((c) => c.State === "running").length;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="shrink-0">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Network Topology Map
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Interactive visual graph of Docker networks, container node attachments, and live packet routing.
        </p>
      </div>

      {/* Modern Telemetry Banner */}
      <div className="grid gap-3 sm:grid-cols-3 shrink-0">
        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Network Bridges
          </span>
          <div className="font-mono text-xl font-bold text-blue-500">
            {networks.length} Networks
          </div>
          <p className="text-[11px] text-muted-foreground">Software-defined routing domains</p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Container Nodes
          </span>
          <div className="font-mono text-xl font-bold text-foreground">
            {containers.length} Attached
          </div>
          <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {runningCount} active route(s)
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Active Edges
          </span>
          <div className="font-mono text-xl font-bold text-primary">
            {edges.length} Connection(s)
          </div>
          <p className="text-[11px] text-muted-foreground">Animated green edges indicate traffic</p>
        </div>
      </div>

      <div
        className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs flex-1 min-h-[550px] overflow-hidden"
        style={{ width: "100%", height: "65vh" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          colorMode={mode === "dark" ? "dark" : "light"}
        >
          <Controls className="!bg-card !border-border !text-foreground !rounded-lg" />
          <MiniMap
            nodeColor={(node) => {
              if (node.id.startsWith("net-")) return "#3b82f6";
              return "#10b981";
            }}
            maskColor={mode === "dark" ? "rgba(0, 0, 0, 0.75)" : "rgba(255, 255, 255, 0.75)"}
            className="!bg-card/90 !border-border !rounded-lg"
          />
          <Background
            gap={14}
            size={1}
            color={mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
