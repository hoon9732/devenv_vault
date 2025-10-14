import React, { useEffect, useCallback, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  addEdge as rfAddEdge,
  SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useProject } from '../contexts/ProjectContext';
import './GraphView.css';

const GraphView = ({ uiScale }) => {
  const {
    activeProject,
    selection,
    setActiveSelection,
    addNode,
    removeNode,
    addEdge,
    removeEdge,
    updateActiveNode,
  } = useProject();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // --- 1. One-Way Sync: Context -> Graph ---
  // Load data from the central project state ONLY when the active project ID changes.
  useEffect(() => {
    if (activeProject) {
      setNodes(
        activeProject.nodes.map((n) => ({ ...n, data: { label: n.data.label } })),
      );
      setEdges(
        activeProject.edges.map((e) => ({
          ...e,
          type: 'step',
          markerEnd: { type: MarkerType.ArrowClosed },
        })),
      );
      if (reactFlowInstance) {
        setTimeout(() => reactFlowInstance.fitView(), 50);
      }
    } else {
      setNodes([]);
      setEdges([]);
    }
    // This effect deliberately runs ONLY when the active project itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.projectId, setNodes, setEdges, reactFlowInstance]);

  // This separate effect synchronizes selection from the context TO the graph.
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({ ...n, selected: selection.includes(n.id) })),
    );
    setEdges((eds) =>
      eds.map((e) => ({ ...e, selected: selection.includes(e.id) })),
    );
  }, [selection, setNodes, setEdges]);


  // --- 2. Sync Back: Graph -> Context ---
  // This effect watches for selection changes within React Flow and pushes them
  // back to the central context.
  const onSelectionChange = useCallback(
    ({ nodes, edges }) => {
      const newSelection = [
        ...nodes.map((n) => n.id),
        ...edges.map((e) => e.id),
      ];
      setActiveSelection(newSelection);
    },
    [setActiveSelection],
  );

  const onConnect = useCallback(
    (params) => {
      const newEdgeData = {
        source: params.source,
        target: params.target,
        label: 'New Edge',
        data: { properties: {} },
      };
      const newEdgeWithId = addEdge(newEdgeData);
      if (newEdgeWithId) {
        setEdges((eds) =>
          rfAddEdge(
            {
              ...params,
              id: newEdgeWithId.id,
              type: 'step',
              markerEnd: { type: MarkerType.ArrowClosed },
            },
            eds,
          ),
        );
      }
    },
    [setEdges, addEdge],
  );

  const onNodeDrag = useCallback(
    (event, node) => {
      if (!reactFlowInstance) return;
      const flowBounds = reactFlowInstance.getViewport();
      const correctedMovementX = event.movementX / (flowBounds.zoom * uiScale);
      const correctedMovementY = event.movementY / (flowBounds.zoom * uiScale);

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return {
              ...n,
              position: {
                x: n.position.x + correctedMovementX,
                y: n.position.y + correctedMovementY,
              },
            };
          }
          return n;
        }),
      );
    },
    [reactFlowInstance, setNodes, uiScale],
  );

  const onNodeDragStop = useCallback(
    (_, node) => {
      updateActiveNode(node.id, { position: node.position });
    },
    [updateActiveNode],
  );

  const handlePaneContextMenu = (event) => {
    event.preventDefault();
    if (!reactFlowInstance || !reactFlowWrapper.current) return;

    const pane = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: (event.clientX - pane.left) / uiScale,
      y: (event.clientY - pane.top) / uiScale,
    });

    addNode({
      position,
      data: { label: 'New Node' },
      properties: {},
    });
  };

  const onNodesDelete = useCallback(
    (deletedNodes) => {
      deletedNodes.forEach((node) => removeNode(node.id));
    },
    [removeNode],
  );

  const onEdgesDelete = useCallback(
    (deletedEdges) => {
      deletedEdges.forEach((edge) => removeEdge(edge.id));
    },
    [removeEdge],
  );

  return (
    <div className="graph-view-container" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onSelectionChange={onSelectionChange}
        onInit={setReactFlowInstance}
        fitView
        snapToGrid={true}
        snapGrid={[15, 15]}
        deleteKeyCode={['Backspace', 'Delete']}
        panOnDrag={[1]}
        nodeDragThreshold={0}
        connectionLineType="step"
        selectionMode={SelectionMode.Partial}
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={15} size={1} />
      </ReactFlow>
    </div>
  );
};

GraphView.propTypes = {
  uiScale: PropTypes.number.isRequired,
};

export default GraphView;

