/**
 * ProjectManager.js
 * 
 * This is a headless, UI-agnostic module for managing the state of an ICD project.
 * It handles creating, loading, modifying, and exporting project data based on the defined JSON schema.
 * This manager acts as the single source of truth for the application's data.
 */

// A private variable to hold the current project data in memory.
let currentProject = null;

/**
 * Generates a unique ID for nodes and edges.
 * @param {string} prefix - 'node' or 'edge'
 * @returns {string} A unique identifier string.
 */
const generateUniqueId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const ProjectManager = {
  /**
   * Creates a new, empty project structure and sets it as the current project.
   * @param {string} projectName - The name for the new project.
   * @returns {object} The newly created project object.
   */
  createNewProject: (projectName = 'Untitled Project') => {
    const timestamp = new Date().toISOString();
    currentProject = {
      schemaVersion: '1.0.0',
      projectId: generateUniqueId('proj'),
      metadata: {
        projectName: projectName,
        author: '',
        createdAt: timestamp,
        updatedAt: timestamp,
        description: '',
      },
      nodes: [],
      edges: [],
    };
    return currentProject;
  },

  /**
   * Loads project data from a parsed JSON object.
   * @param {object} projectData - The parsed JSON data to load.
   * @throws {Error} If the project data is invalid.
   */
  loadProject: (projectData) => {
    // Basic validation
    if (projectData && projectData.nodes && projectData.edges && projectData.metadata) {
      currentProject = projectData;
      console.log('Project loaded successfully:', currentProject.metadata.projectName);
    } else {
      throw new Error('Invalid or corrupted project file.');
    }
  },

  /**
   * Returns the entire current project object.
   * @returns {object | null} The current project data.
   */
  getProject: () => {
    return currentProject;
  },

  /**
   * Exports the current project state to a JSON string.
   * @returns {string} A stringified JSON representation of the project.
   */
  exportProjectToJson: () => {
    if (!currentProject) return null;
    currentProject.metadata.updatedAt = new Date().toISOString();
    return JSON.stringify(currentProject, null, 2); // Pretty-print with 2-space indentation
  },

  // --- Node Management ---

  /**
   * Adds a new node to the project.
   * @param {object} nodeData - The data for the new node (e.g., { type, position, data }).
   * @returns {object} The newly added node.
   */
  addNode: (nodeData) => {
    if (!currentProject) return null;
    const newNode = {
      id: generateUniqueId('node'),
      ...nodeData,
    };
    currentProject.nodes.push(newNode);
    return newNode;
  },

  /**
   * Updates an existing node's data.
   * @param {string} nodeId - The ID of the node to update.
   * @param {object} updates - An object containing the properties to update.
   * @returns {object | null} The updated node object or null if not found.
   */
  updateNode: (nodeId, updates) => {
    if (!currentProject) return null;
    const node = currentProject.nodes.find(n => n.id === nodeId);
    if (node) {
      // Deep merge might be needed for nested properties in a real app
      Object.assign(node, updates);
      return node;
    }
    return null;
  },

  /**
   * Removes a node and any connected edges.
   * @param {string} nodeId - The ID of the node to remove.
   */
  removeNode: (nodeId) => {
    if (!currentProject) return;
    // Remove the node
    currentProject.nodes = currentProject.nodes.filter(n => n.id !== nodeId);
    // Remove any edges connected to this node
    currentProject.edges = currentProject.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
  },

  // --- Edge Management ---

  /**
   * Adds a new edge between two nodes.
   * @param {object} edgeData - Data for the new edge (e.g., { source, target, label, data }).
   * @returns {object} The newly added edge.
   */
  addEdge: (edgeData) => {
    if (!currentProject) return null;
    const newEdge = {
      id: generateUniqueId('edge'),
      ...edgeData,
    };
    currentProject.edges.push(newEdge);
    return newEdge;
  },

  /**
   * Updates an existing edge's data.
   * @param {string} edgeId - The ID of the edge to update.
   * @param {object} updates - An object containing the properties to update.
   * @returns {object | null} The updated edge object or null if not found.
   */
  updateEdge: (edgeId, updates) => {
    if (!currentProject) return null;
    const edge = currentProject.edges.find(e => e.id === edgeId);
    if (edge) {
      Object.assign(edge, updates);
      return edge;
    }
    return null;
  },

  /**
   * Removes an edge.
   * @param {string} edgeId - The ID of the edge to remove.
   */
  removeEdge: (edgeId) => {
    if (!currentProject) return;
    currentProject.edges = currentProject.edges.filter(e => e.id !== edgeId);
  },
};

// We export the manager as a singleton object.
export default ProjectManager;
