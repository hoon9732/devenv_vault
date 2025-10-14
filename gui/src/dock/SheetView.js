import React from 'react';
import { Table, Column, Cell, EditableCell } from '@blueprintjs/table';
import { useProject } from '../contexts/ProjectContext';
import './SheetView.css';

const SheetView = () => {
  const { projectData, updateNode, updateEdge } = useProject();

  if (!projectData) {
    return null;
  }

  // --- Helper function to get all unique, flattened property keys ---
  const getUniqueProperties = (items) => {
    const propertyKeys = new Set();
    const recurse = (obj, prefix = '') => {
      if (!obj || typeof obj !== 'object') return;
      for (const key in obj) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (
          typeof obj[key] === 'object' &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          recurse(obj[key], newKey);
        } else {
          propertyKeys.add(newKey);
        }
      }
    };

    items.forEach((item) => {
      if (item.data && item.data.properties) {
        recurse(item.data.properties);
      }
    });
    return Array.from(propertyKeys).sort(); // Sort for consistent column order
  };

  // --- Generic Change Handler ---
  const handleCellChange = (
    value,
    rowIndex,
    propIndex,
    items,
    properties,
    updateFn,
  ) => {
    const itemToUpdate = items[rowIndex];
    const propertyKey = properties[propIndex];

    // Create a deep copy to avoid direct state mutation
    const newProperties = JSON.parse(
      JSON.stringify(itemToUpdate.data.properties),
    );

    // Traverse the key path and update the final value
    const keys = propertyKey.split('.');
    let current = newProperties;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]] = current[keys[i]] || {};
    }
    current[keys[keys.length - 1]] = value;

    updateFn(itemToUpdate.id, {
      data: { ...itemToUpdate.data, properties: newProperties },
    });
  };

  // --- Node Table Logic ---
  const nodeProperties = getUniqueProperties(projectData.nodes);
  const handleNodeCellChange = (value, rowIndex, propIndex) =>
    handleCellChange(
      value,
      rowIndex,
      propIndex,
      projectData.nodes,
      nodeProperties,
      updateNode,
    );

  // --- Edge Table Logic ---
  const edgeProperties = getUniqueProperties(projectData.edges);
  const handleEdgeCellChange = (value, rowIndex, propIndex) =>
    handleCellChange(
      value,
      rowIndex,
      propIndex,
      projectData.edges,
      edgeProperties,
      updateEdge,
    );

  return (
    <div className="sheet-view-container">
      <div className="sheet-table-section">
        <h4>Nodes</h4>
        <Table
          numRows={projectData.nodes.length}
          enableColumnReordering={true}
          key={`nodes-${projectData.nodes.length}`} // Force re-render on row change
        >
          <Column
            name="ID"
            cellRenderer={(rowIndex) => (
              <Cell>{projectData.nodes[rowIndex].id}</Cell>
            )}
          />
          <Column
            name="Label"
            cellRenderer={(rowIndex) => (
              <EditableCell
                value={projectData.nodes[rowIndex].data.label || ''}
                onConfirm={(value) => {
                  const node = projectData.nodes[rowIndex];
                  updateNode(node.id, {
                    data: { ...node.data, label: value },
                  });
                }}
              />
            )}
          />
          {nodeProperties.map((propKey, propIndex) => (
            <Column
              key={propKey}
              name={propKey}
              cellRenderer={(rowIndex) => {
                const node = projectData.nodes[rowIndex];
                const value = propKey
                  .split('.')
                  .reduce(
                    (obj, key) => (obj && obj[key] !== undefined ? obj[key] : ''),
                    node.data.properties,
                  );
                return (
                  <EditableCell
                    value={String(value ?? '')}
                    onConfirm={(val) =>
                      handleNodeCellChange(val, rowIndex, propIndex)
                    }
                  />
                );
              }}
            />
          ))}
        </Table>
      </div>

      <div className="sheet-table-section">
        <h4>Edges</h4>
        <Table
          numRows={projectData.edges.length}
          enableColumnReordering={true}
          key={`edges-${projectData.edges.length}`} // Force re-render on row change
        >
          <Column
            name="ID"
            cellRenderer={(rowIndex) => (
              <Cell>{projectData.edges[rowIndex].id}</Cell>
            )}
          />
          <Column
            name="Label"
            cellRenderer={(rowIndex) => (
              <EditableCell
                value={projectData.edges[rowIndex].label || ''}
                onConfirm={(value) => {
                  const edge = projectData.edges[rowIndex];
                  updateEdge(edge.id, { ...edge, label: value });
                }}
              />
            )}
          />
          <Column
            name="Source"
            cellRenderer={(rowIndex) => (
              <Cell>{projectData.edges[rowIndex].source}</Cell>
            )}
          />
          <Column
            name="Target"
            cellRenderer={(rowIndex) => (
              <Cell>{projectData.edges[rowIndex].target}</Cell>
            )}
          />
          {edgeProperties.map((propKey, propIndex) => (
            <Column
              key={propKey}
              name={propKey}
              cellRenderer={(rowIndex) => {
                const edge = projectData.edges[rowIndex];
                const value = propKey
                  .split('.')
                  .reduce(
                    (obj, key) => (obj && obj[key] !== undefined ? obj[key] : ''),
                    edge.data.properties,
                  );
                return (
                  <EditableCell
                    value={String(value ?? '')}
                    onConfirm={(val) =>
                      handleEdgeCellChange(val, rowIndex, propIndex)
                    }
                  />
                );
              }}
            />
          ))}
        </Table>
      </div>
    </div>
  );
};

export default SheetView;
