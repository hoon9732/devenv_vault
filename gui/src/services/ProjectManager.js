/**
 * ProjectManager.js
 *
 * This is a headless, UI-agnostic module for managing the state of multiple ICD projects.
 * It maintains a list of projects for the outline and a single "active" project for the dock.
 */

let outlineProjects = [];
let activeProject = null;

const generateUniqueId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const ProjectManager = {
  // --- Outline Project Management ---

  /**
   * Imports a new project into the outline list. Avoids duplicates.
   * @param {object} projectData - The parsed project data to import.
   */
  importProjectToOutline: (projectData) => {
    if (!projectData || !projectData.projectId) {
      console.error('Import failed: projectData is invalid or missing projectId.');
      return;
    }
    const exists = outlineProjects.some(p => p.projectId === projectData.projectId);
    if (!exists) {
      outlineProjects.push(projectData);
    }
  },

  /**
   * Returns the list of all projects for the outline.
   * @returns {Array} The list of outline projects.
   */
  getOutlineProjects: () => {
    return outlineProjects;
  },

  // --- Active Project Management ---

  /**
   * Sets a project from the outline as the single active project.
   * @param {string} projectId - The ID of the project to set as active.
   */
  setActiveProject: (projectId) => {
    const project = outlineProjects.find(p => p.projectId === projectId);
    if (project) {
      activeProject = project;
    } else {
      console.error(`setActiveProject failed: project with id ${projectId} not found.`);
    }
  },

  /**
   * Creates a new, empty project, adds it to the outline, and sets it as active.
   * @param {string} projectName - The name for the new project.
   */
  createNewActiveProject: (projectName = 'Untitled Project') => {
    const timestamp = new Date().toISOString();
    
    // Logic to find the next available number for "Untitled Project"
    let counter = 1;
    let finalName = projectName;
    const projectNames = new Set(outlineProjects.map(p => p.metadata.projectName));
    while (projectNames.has(finalName)) {
      finalName = `${projectName} ${counter}`;
      counter++;
    }

    const newProject = {
      schemaVersion: '1.0.0',
      projectId: generateUniqueId('proj'),
      metadata: {
        projectName: finalName,
        author: '',
        createdAt: timestamp,
        updatedAt: timestamp,
        description: '',
      },
      nodes: [],
      edges: [],
    };
    outlineProjects.push(newProject);
    activeProject = newProject;
  },

  /**
   * Loads a project directly, adding it to the outline and setting it as active.
   * Used for "File > Open".
   * @param {object} projectData - The parsed project data to load.
   */
  loadProjectAsActive: (projectData) => {
    if (projectData && projectData.nodes && projectData.edges && projectData.metadata) {
      ProjectManager.importProjectToOutline(projectData); // Add to outline if not already there
      activeProject = projectData;
    } else {
      throw new Error('Invalid or corrupted project file.');
    }
  },

  /**
   * Returns the entire active project object.
   * @returns {object | null} The active project data.
   */
  getActiveProject: () => {
    return activeProject;
  },

  /**
   * Exports the active project state to a JSON string.
   * @returns {string | null} A stringified JSON representation of the active project.
   */
  exportActiveProjectToJson: () => {
    if (!activeProject) return null;
    activeProject.metadata.updatedAt = new Date().toISOString();
    return JSON.stringify(activeProject, null, 2);
  },

  // --- Active Project Data Manipulation ---

  addNodeToActiveProject: (nodeData) => {
    if (!activeProject) return null;
    
    // Logic for numbered naming
    let counter = 1;
    let finalLabel = nodeData.data.label || 'New Node';
    const nodeLabels = new Set(activeProject.nodes.map(n => n.data.label));
    while (nodeLabels.has(finalLabel)) {
      finalLabel = `${nodeData.data.label || 'New Node'} ${counter}`;
      counter++;
    }
    
    const newNode = { 
      id: generateUniqueId('node'), 
      ...nodeData, 
      data: { ...nodeData.data, label: finalLabel } 
    };
    activeProject.nodes.push(newNode);
    return newNode;
  },

  updateActiveNode: (nodeId, updates) => {
    if (!activeProject) return null;
    const node = activeProject.nodes.find(n => n.id === nodeId);
    if (node) {
      Object.assign(node, updates); // Note: For deep merges, a library might be better
      return node;
    }
    return null;
  },

  removeNodeFromActiveProject: (nodeId) => {
    if (!activeProject) return;
    activeProject.nodes = activeProject.nodes.filter(n => n.id !== nodeId);
    activeProject.edges = activeProject.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
  },

  addEdgeToActiveProject: (edgeData) => {
    if (!activeProject) return null;

    // Logic for numbered naming
    let counter = 1;
    let finalLabel = edgeData.label || 'New Edge';
    const edgeLabels = new Set(activeProject.edges.map(e => e.label));
    while (edgeLabels.has(finalLabel)) {
      finalLabel = `${edgeData.label || 'New Edge'} ${counter}`;
      counter++;
    }

    const newEdge = { 
      id: generateUniqueId('edge'), 
      ...edgeData,
      label: finalLabel
    };
    activeProject.edges.push(newEdge);
    return newEdge;
  },

  updateActiveEdge: (edgeId, updates) => {
    if (!activeProject) return null;
    const edge = activeProject.edges.find(e => e.id === edgeId);
    if (edge) {
      Object.assign(edge, updates);
      return edge;
    }
    return null;
  },

  removeEdgeFromActiveProject: (edgeId) => {
    if (!activeProject) return;
    activeProject.edges = activeProject.edges.filter(e => e.id !== edgeId);
  },
};

export default ProjectManager;
