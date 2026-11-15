import { useStore } from "@/store/useStore";
import { useEffect } from "react";
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, MarkerType, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export function NetworkMap() {
  const { containers, networks } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Very simple grid layout
    const netY = 100;
    
    // Add Networks
    networks.forEach((net, i) => {
      newNodes.push({
        id: `net-${net.Id}`,
        type: 'default',
        position: { x: 200 + (i * 300), y: netY },
        data: { label: `🌐 ${net.Name}` },
        style: { 
          background: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.5)', 
          borderRadius: '50px', 
          padding: '10px 20px', 
          fontWeight: 'bold',
          color: 'var(--foreground)'
        }
      });
    });

    const contY = 300;

    // Add Containers
    containers.forEach((c, i) => {
      const containerId = `cont-${c.Id}`;
      newNodes.push({
        id: containerId,
        type: 'default',
        position: { x: 100 + ((i % 5) * 200), y: contY + (Math.floor(i / 5) * 120) },
        data: { label: `📦 ${c.Names[0]?.replace("/", "") || "Unknown"}` },
        style: { 
          background: 'hsl(var(--card))', 
          border: '1px solid hsl(var(--border))', 
          borderRadius: '8px', 
          padding: '10px',
          color: 'var(--foreground)'
        }
      });

      // Add Edges
      if (c.NetworkSettings?.Networks) {
        Object.keys(c.NetworkSettings.Networks).forEach(netName => {
          const net = networks.find(n => n.Name === netName);
          if (net) {
            newEdges.push({
              id: `e-${c.Id}-${net.Id}`,
              source: `net-${net.Id}`,
              target: containerId,
              animated: c.State === "running",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: c.State === "running" ? '#10b981' : '#71717a',
              },
              style: { 
                stroke: c.State === "running" ? '#10b981' : '#71717a', 
                strokeWidth: 2 
              }
            });
          }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [containers, networks]); // Note: In a real app we'd use setNodes/setEdges as deps, but keeping it simple to avoid loops

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="shrink-0">
        <h2 className="text-2xl font-bold tracking-tight">Network Topology</h2>
        <p className="text-muted-foreground">Visual map of your containers and their network connections.</p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex-1 min-h-[600px] overflow-hidden" style={{ width: '100%', height: '70vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          colorMode="dark"
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              if (node.id.startsWith('net-')) return '#3b82f6';
              return '#a1a1aa';
            }}
            maskColor="rgba(0,0,0, 0.7)"
          />
          <Background gap={12} size={1} color="rgba(255, 255, 255, 0.05)" />
        </ReactFlow>
      </div>
    </div>
  );
}
