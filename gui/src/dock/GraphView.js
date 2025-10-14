import React, { useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useProject } from '../contexts/ProjectContext';
import './GraphView.css';

const GraphView = () => {
  const { projectData } = useProject();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (projectData) {
      // Transform project data into React Flow's expected format
      const transformedNodes = projectData.nodes.map((node) => ({
        id: node.id,
        position: node.position,
        data: { label: node.data.label },
        // You can add custom node types here later
        // type: 'custom',
      }));

      const transformedEdges = projectData.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'step', // Use step edge for orthogonal lines
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }));

      setNodes(transformedNodes);
      setEdges(transformedEdges);
    }
  }, [projectData, setNodes, setEdges]);

  return (
    <div className="graph-view-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        snapToGrid={true}
        snapGrid={[15, 15]}
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={15} size={1} />
      </ReactFlow>
    </div>
  );
};

export default GraphView;
