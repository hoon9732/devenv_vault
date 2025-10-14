import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import ProjectManager from '../services/ProjectManager';

// 1. Create the context
const ProjectContext = createContext(null);

// 2. Create a custom hook for easy access to the context
export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

// 3. Create the Provider component
export const ProjectProvider = ({ children }) => {
  const [projectData, setProjectData] = useState(ProjectManager.getProject());

  // --- State Update Wrapper ---
  // This function ensures that after any data manipulation, React's state is updated,
  // which causes the UI to re-render with the new data.
  const updateState = useCallback(() => {
    setProjectData({ ...ProjectManager.getProject() });
  }, []);

  // --- Wrapped ProjectManager Functions ---
  // We wrap the ProjectManager functions to automatically trigger a state update.

  const createNewProject = useCallback((projectName) => {
    ProjectManager.createNewProject(projectName);
    updateState();
  }, [updateState]);

  const loadProject = useCallback((jsonData) => {
    try {
      ProjectManager.loadProject(jsonData);
      updateState();
    } catch (error) {
      console.error(error);
      // Here you could also set an error state to show in the UI
    }
  }, [updateState]);

  const exportProjectToJson = useCallback(() => {
    return ProjectManager.exportProjectToJson();
  }, []);

  const addNode = useCallback((nodeData) => {
    ProjectManager.addNode(nodeData);
    updateState();
  }, [updateState]);

  const updateNode = useCallback((nodeId, updates) => {
    ProjectManager.updateNode(nodeId, updates);
    updateState();
  }, [updateState]);

  const removeNode = useCallback((nodeId) => {
    ProjectManager.removeNode(nodeId);
    updateState();
  }, [updateState]);

  const addEdge = useCallback((edgeData) => {
    ProjectManager.addEdge(edgeData);
    updateState();
  }, [updateState]);

  const updateEdge = useCallback((edgeId, updates) => {
    ProjectManager.updateEdge(edgeId, updates);
    updateState();
  }, [updateState]);

  const removeEdge = useCallback((edgeId) => {
    ProjectManager.removeEdge(edgeId);
    updateState();
  }, [updateState]);


  // The value provided to consuming components
  const value = {
    projectData,
    createNewProject,
    loadProject,
    exportProjectToJson,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    updateEdge,
    removeEdge,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

ProjectProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
