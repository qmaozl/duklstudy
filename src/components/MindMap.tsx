import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'react-flow-renderer';
import { Card } from './ui/card';

interface MindMapProps {
  concepts: string[];
}

const MindMap: React.FC<MindMapProps> = ({ concepts }) => {
  const initialNodes = useMemo(() => {
    const nodes: Node[] = [];
    
    // Create root node
    nodes.push({
      id: 'root',
      type: 'default',
      data: { label: 'Main Concepts' },
      position: { x: 400, y: 50 },
      style: {
        background: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        border: '2px solid hsl(var(--primary))',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '14px',
        fontWeight: 'bold',
      },
    });

    // Create child nodes in a circular layout
    const angleStep = (2 * Math.PI) / concepts.length;
    const radius = 200;

    concepts.forEach((concept, index) => {
      const angle = index * angleStep;
      const x = 400 + radius * Math.cos(angle);
      const y = 250 + radius * Math.sin(angle);

      nodes.push({
        id: `concept-${index}`,
        type: 'default',
        data: { label: concept },
        position: { x, y },
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '12px',
        },
      });
    });

    return nodes;
  }, [concepts]);

  const initialEdges = useMemo(() => {
    return concepts.map((_, index) => ({
      id: `edge-${index}`,
      source: 'root',
      target: `concept-${index}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'hsl(var(--primary))' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'hsl(var(--primary))',
      },
    }));
  }, [concepts]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (concepts.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No concepts to visualize
      </Card>
    );
  }

  return (
    <Card className="w-full h-[500px] overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Controls />
        <Background color="hsl(var(--muted))" gap={16} />
      </ReactFlow>
    </Card>
  );
};

export default MindMap;
