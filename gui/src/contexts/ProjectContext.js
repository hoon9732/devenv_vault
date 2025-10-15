import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import ProjectManager from '../services/ProjectManager';

const ProjectContext = createContext(null);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projectState, setProjectState] = useState({
    activeProject: ProjectManager.getActiveProject(),
    outlineProjects: ProjectManager.getOutlineProjects(),
    selection: [], // Array of selected item IDs
  });
  const [activeView, setActiveView] = useState('graph'); // Default view

  const updateState = useCallback(() => {
    setProjectState((prevState) => ({
      ...prevState,
      activeProject: ProjectManager.getActiveProject()
        ? { ...ProjectManager.getActiveProject() }
        : null,
      outlineProjects: [...ProjectManager.getOutlineProjects()],
    }));
  }, []);

  const setActiveSelection = useCallback((newSelection) => {
    setProjectState((prevState) => ({ ...prevState, selection: newSelection }));
  }, []);

  // --- Wrapped Functions ---

  const importProjectToOutline = useCallback((projectData) => {
    ProjectManager.importProjectToOutline(projectData);
    updateState();
  }, [updateState]);

  const setActiveProject = useCallback((projectId) => {
    ProjectManager.setActiveProject(projectId);
    setActiveSelection([]); // Clear selection when changing projects
    updateState();
  }, [updateState, setActiveSelection]);

  const createNewActiveProject = useCallback((projectName) => {
    ProjectManager.createNewActiveProject(projectName);
    setActiveSelection([]);
    updateState();
  }, [updateState, setActiveSelection]);

  const loadProjectAsActive = useCallback((projectData) => {
    try {
      ProjectManager.loadProjectAsActive(projectData);
      setActiveSelection([]);
      updateState();
    } catch (error) {
      console.error(error);
    }
  }, [updateState, setActiveSelection]);

  const exportActiveProjectToJson = useCallback(() => {
    return ProjectManager.exportActiveProjectToJson();
  }, []);

  const updateActiveNode = useCallback((nodeId, updates) => {
    ProjectManager.updateActiveNode(nodeId, updates);
    updateState();
  }, [updateState]);

  const updateActiveEdge = useCallback((edgeId, updates) => {
    ProjectManager.updateActiveEdge(edgeId, updates);
    updateState();
  }, [updateState]);

  // Pass-through for other functions for simplicity
  const {
    addNodeToActiveProject,
    removeNodeFromActiveProject,
    addEdgeToActiveProject,
    removeEdgeFromActiveProject,
  } = ProjectManager;


  const value = {
    activeProject: projectState.activeProject,
    outlineProjects: projectState.outlineProjects,
    selection: projectState.selection,
    activeView,
    setActiveView,
    setActiveSelection,
    importProjectToOutline,
    setActiveProject,
    createNewActiveProject,
    loadProjectAsActive,
    exportActiveProjectToJson,
    updateActiveNode,
    updateActiveEdge,
    // Re-wrapping these to include state updates and return values
    addNode: useCallback((nodeData) => {
      const newNode = addNodeToActiveProject(nodeData);
      updateState();
      return newNode;
    }, [updateState, addNodeToActiveProject]),
    removeNode: useCallback((nodeId) => {
      removeNodeFromActiveProject(nodeId);
      updateState();
    }, [updateState, removeNodeFromActiveProject]),
    addEdge: useCallback((edgeData) => {
      const newEdge = addEdgeToActiveProject(edgeData);
      updateState();
      return newEdge;
    }, [updateState, addEdgeToActiveProject]),
    removeEdge: useCallback((edgeId) => {
      removeEdgeFromActiveProject(edgeId);
      updateState();
    }, [updateState, removeEdgeFromActiveProject]),
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
