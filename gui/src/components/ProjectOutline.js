import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import {
  Button,
  Classes,
  InputGroup,
  Tooltip,
  Icon,
  Popover,
  Menu,
  MenuItem,
  Tree,
} from '@blueprintjs/core';
import { useProject } from '../contexts/ProjectContext';
import './ProjectOutline.css';

const initialDrawerWidth = 240;
const minDrawerWidth = 160;
const maxDrawerWidth = 480;

const ProjectOutline = ({ open, onClose }) => {
  const {
    outlineProjects,
    activeProject,
    selection,
    setActiveSelection,
    importProjectToOutline,
    setActiveProject,
  } = useProject();
  const [nodes, setNodes] = useState([]);
  const [settings, setSettings] = useState({
    showIcons: true,
    showOnStart: false,
    showAnimation: true,
  });
  const [drawerWidth, setDrawerWidth] = useState(initialDrawerWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizable, setIsResizable] = useState(true);
  const sidebarRef = useRef(null);

  // Load settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      if (window.electron) {
        const fetchedSettings = await window.electron.getOutlineSettings();
        setSettings(fetchedSettings);
      }
    };
    fetchSettings();
  }, []);

  // Rebuild the tree ONLY when the data it depends on changes.
  useEffect(() => {
    const toTreeNodes = (projects) => {
      return projects.map((proj) => {
        const oldNode = nodes.find((n) => n.id === proj.projectId);
        const isExpanded = oldNode
          ? oldNode.isExpanded
          : activeProject && proj.projectId === activeProject.projectId;

        return {
          id: proj.projectId,
          icon: settings.showIcons ? 'projects' : undefined,
          label: proj.metadata.projectName,
          hasCaret: true,
          isExpanded: isExpanded,
          isSelected: selection.includes(proj.projectId),
          className:
            activeProject && proj.projectId === activeProject.projectId
              ? 'active-project'
              : '',
          childNodes: [
            {
              id: `${proj.projectId}-nodes`,
              icon: settings.showIcons ? 'database' : undefined,
              label: `Nodes (${proj.nodes.length})`,
              hasCaret: proj.nodes.length > 0,
              childNodes: proj.nodes.map((n) => ({
                id: n.id,
                icon: settings.showIcons ? 'symbol-square' : undefined,
                label: n.data.label,
                isSelected: selection.includes(n.id),
              })),
            },
            {
              id: `${proj.projectId}-edges`,
              icon: settings.showIcons ? 'flow-linear' : undefined,
              label: `Edges (${proj.edges.length})`,
              hasCaret: proj.edges.length > 0,
              childNodes: proj.edges.map((e) => ({
                id: e.id,
                icon: settings.showIcons ? 'exchange' : undefined,
                label: e.label,
                isSelected: selection.includes(e.id),
              })),
            },
          ],
        };
      });
    };
    setNodes(toTreeNodes(outlineProjects));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineProjects, activeProject, selection, settings.showIcons]);

  const handleSettingChange = (settingName) => {
    setSettings((prevSettings) => {
      const newSettings = {
        ...prevSettings,
        [settingName]: !prevSettings[settingName],
      };
      if (window.electron) {
        window.electron.setOutlineSettings(newSettings);
      }
      return newSettings;
    });
  };

  const handleFixedSizeToggle = () => {
    const newResizableState = !isResizable;
    setIsResizable(newResizableState);
    if (!newResizableState) {
      setDrawerWidth(initialDrawerWidth);
    }
  };

  const handleImportProject = async () => {
    if (window.electron) {
      const results = await window.electron.openFileDialog(true); // Pass true for multi-select
      if (results) {
        results.forEach((result) => {
          if (result && result.content) {
            try {
              const projectJson = JSON.parse(result.content);
              importProjectToOutline(projectJson);
            } catch (error) {
              console.error('Failed to parse project file:', error);
            }
          }
        });
      }
    }
  };

  const handleNodeCollapse = (node) => {
    const newNodes = [...nodes];
    Tree.nodeFromPath(node.path, newNodes).isExpanded = false;
    setNodes(newNodes);
  };

  const handleNodeExpand = (node) => {
    const newNodes = [...nodes];
    Tree.nodeFromPath(node.path, newNodes).isExpanded = true;
    setNodes(newNodes);
  };

  const handleNodeClick = (node, nodePath, e) => {
    if (e.target.classList.contains('bp6-tree-node-caret')) {
      if (node.isExpanded) {
        handleNodeCollapse(node);
      } else {
        handleNodeExpand(node);
      }
      return;
    }

    // Determine the project ID for the clicked node
    let projectId = '';
    if (nodePath.length === 1) {
      projectId = node.id;
    } else {
      // Find the parent project by traversing the outlineProjects structure
      for (const proj of outlineProjects) {
        if (
          proj.nodes.some((n) => n.id === node.id) ||
          proj.edges.some((e) => e.id === node.id)
        ) {
          projectId = proj.projectId;
          break;
        }
      }
    }

    // If the clicked item's project is not active, make it active
    if (projectId && activeProject?.projectId !== projectId) {
      setActiveProject(projectId);
    }

    // Handle selection
    const isMultiSelect = e.metaKey || e.ctrlKey;
    const newSelection = isMultiSelect ? [...selection] : [];
    if (!newSelection.includes(node.id)) {
      newSelection.push(node.id);
    }
    setActiveSelection(newSelection);
  };

  const handleMouseDown = (e) => {
    if (!isResizable) return;
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (isResizing && sidebarRef.current) {
        const newWidth =
          e.clientX - sidebarRef.current.getBoundingClientRect().left;
        if (newWidth > minDrawerWidth && newWidth < maxDrawerWidth)
          setDrawerWidth(newWidth);
      }
    },
    [isResizing, sidebarRef, setDrawerWidth],
  );

  const handleMouseUp = useCallback(
    () => setIsResizing(false),
    [setIsResizing],
  );

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const settingsMenu = (
    <Menu>
      <MenuItem
        icon={settings.showIcons ? 'tick' : 'blank'}
        text="Show Icons"
        onClick={() => handleSettingChange('showIcons')}
      />
      <MenuItem
        icon={settings.showOnStart ? 'tick' : 'blank'}
        text="Show on Start"
        onClick={() => handleSettingChange('showOnStart')}
      />
      <MenuItem
        icon={settings.showAnimation ? 'tick' : 'blank'}
        text="Show Animation"
        onClick={() => handleSettingChange('showAnimation')}
      />
      <MenuItem
        icon={!isResizable ? 'tick' : 'blank'}
        text="Fixed Size"
        onClick={handleFixedSizeToggle}
      />
    </Menu>
  );

  const renderContent = () => {
    if (outlineProjects.length === 0) {
      return (
        <div className="project-outline-content empty">
          <p>No projects imported.</p>
          <p>
            Click the <Icon icon="import" size={12} /> button to import a
            project.
          </p>
        </div>
      );
    }

    return (
      <div className="project-outline-content">
        <Tree
          contents={nodes}
          onNodeCollapse={handleNodeCollapse}
          onNodeExpand={handleNodeExpand}
          onNodeClick={handleNodeClick}
          className="outline-tree"
        />
      </div>
    );
  };

  return (
    <Box
      ref={sidebarRef}
      className={`project-outline-container ${Classes.FOCUS_DISABLED}`}
      sx={{
        width: open ? drawerWidth : 0,
        transition:
          !settings.showAnimation || isResizing
            ? 'none'
            : 'width 0.3s ease-in-out',
        position: 'relative', // Needed for the resize handle
      }}
    >
      <div className="outline-inner-container" style={{ width: drawerWidth }}>
        <div className="outline-topbar">
          <div className="outline-topbar-upper">
            <div className="outline-topbar-left">
              <Tooltip
                content="Import Project(s)"
                placement="top"
                usePortal={false}
              >
                <Button minimal icon="import" onClick={handleImportProject} />
              </Tooltip>
            </div>
            <div className="outline-topbar-right">
              <Popover
                content={settingsMenu}
                placement="bottom-end"
                usePortal={false}
              >
                <Tooltip content="More" placement="top" usePortal={false}>
                  <Button minimal icon="more" />
                </Tooltip>
              </Popover>
              <Tooltip content="Close" placement="top" usePortal={false}>
                <Button minimal icon="cross" onClick={onClose} />
              </Tooltip>
            </div>
          </div>
          <div className="outline-topbar-lower">
            <InputGroup
              leftIcon="search"
              placeholder="Search projects..."
              round
              small
              disabled={outlineProjects.length === 0}
            />
          </div>
        </div>
        {renderContent()}
      </div>
      {isResizable && (
        <Box
          onMouseDown={handleMouseDown}
          sx={{
            width: '5px',
            cursor: 'col-resize',
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
          }}
        />
      )}
    </Box>
  );
};

ProjectOutline.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ProjectOutline;
