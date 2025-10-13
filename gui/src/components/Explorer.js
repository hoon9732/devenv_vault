import React, { useState, useRef, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import { Button as MuiButton } from '@mui/material';
import {
  Button,
  Classes,
  Tree,
  Popover,
  Menu,
  MenuItem,
  Tooltip,
  Icon,
} from '@blueprintjs/core';
import { useLanguage } from '../contexts/LanguageContext';
import './Explorer.css';

const initialDrawerWidth = 240;
const minDrawerWidth = 150;
const maxDrawerWidth = 500;

const Explorer = ({
  open,
  setOpen,
  workspacePath,
  setWorkspacePath,
  isInitialLoad,
  onOpenFile,
}) => {
  const { t } = useLanguage();
  const [drawerWidth, setDrawerWidth] = useState(initialDrawerWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const [renderTree, setRenderTree] = useState(false);
  const [settings, setSettings] = useState({
    showIcons: true,
    showOnStart: false,
  });
  const [nodes, setNodes] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Helper function to convert file system items to Blueprint Tree nodes
  const toTreeNodes = useCallback(
    (items) => {
      return items.map((item) => ({
        id: item.path,
        label: item.name,
        icon: settings.showIcons
          ? item.isDirectory
            ? 'folder-close'
            : 'document'
          : undefined,
        hasCaret: item.isDirectory,
        isExpanded: false,
        childNodes: [],
        nodeData: item,
      }));
    },
    [settings.showIcons],
  );

  useEffect(() => {
    const fetchSettings = async () => {
      if (window.electron) {
        const fetchedSettings = await window.electron.getWorkspaceSettings();
        setSettings(fetchedSettings);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!open) setRenderTree(false);
  }, [open]);

  // Effect to load the root of the tree when workspacePath changes
  useEffect(() => {
    const loadRoot = async () => {
      if (workspacePath) {
        const items = await window.electron.readDirectory(workspacePath);
        setNodes(toTreeNodes(items));
      } else {
        setNodes([]);
      }
    };
    loadRoot();
  }, [workspacePath, refreshKey, toTreeNodes]);

  const refreshTreeView = () => setRefreshKey((prev) => prev + 1);

  // Recursively find a node by its ID (path) and apply a mutation
  const findAndMutateNode = (nodes, id, mutation) => {
    return nodes.map((node) => {
      if (node.id === id) {
        return mutation(node);
      }
      if (node.childNodes) {
        return {
          ...node,
          childNodes: findAndMutateNode(node.childNodes, id, mutation),
        };
      }
      return node;
    });
  };

  const handleNodeExpand = async (node) => {
    // Fetch children if they haven't been loaded yet
    if (node.childNodes.length === 0) {
      const children = await window.electron.readDirectory(node.id);
      const childNodes = toTreeNodes(children);
      setNodes((currentNodes) =>
        findAndMutateNode(currentNodes, node.id, (n) => ({
          ...n,
          isExpanded: true,
          childNodes: childNodes,
        })),
      );
    } else {
      // Just expand the node if children are already loaded
      setNodes((currentNodes) =>
        findAndMutateNode(currentNodes, node.id, (n) => ({
          ...n,
          isExpanded: true,
        })),
      );
    }
  };

  const handleNodeCollapse = (node) => {
    setNodes((currentNodes) =>
      findAndMutateNode(currentNodes, node.id, (n) => ({
        ...n,
        isExpanded: false,
      })),
    );
  };

  const handleNodeClick = (node) => {
    // Use a safe, immutable recursive function to update selection
    const forEachNode = (nodes, callback) => {
      for (const n of nodes) {
        callback(n);
        if (n.childNodes) {
          forEachNode(n.childNodes, callback);
        }
      }
    };

    // Create a deep clone to avoid state mutation issues
    const newNodes = JSON.parse(JSON.stringify(nodes));
    forEachNode(newNodes, (n) => (n.isSelected = false));

    setNodes(
      findAndMutateNode(newNodes, node.id, (n) => ({ ...n, isSelected: true })),
    );

    // If it's a file, call the open file handler
    if (node.nodeData && !node.nodeData.isDirectory) {
      onOpenFile(node.id);
    }
    else {
      // If it's a directory, toggle its expansion
      if (node.isExpanded) {
        handleNodeCollapse(node);
      } else {
        handleNodeExpand(node);
      }
    }
  };

  const handleOpenWorkspace = async () => {
    if (window.electron) {
      const path = await window.electron.setWorkspacePath();
      if (path) setWorkspacePath(path);
    }
  };

  const handleClose = () => setOpen(false);

  const handleMouseDown = (e) => {
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

  const handleMouseUp = useCallback(() => setIsResizing(false), [setIsResizing]);

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

  const handleSettingChange = (settingName) => {
    const newSettings = { ...settings, [settingName]: !settings[settingName] };
    setSettings(newSettings);
    if (window.electron) window.electron.setWorkspaceSettings(newSettings);
  };

  const settingsMenu = (
    <Menu>
      <MenuItem
        icon={settings.showIcons ? 'tick' : 'blank'}
        text={t('Workspace Icons')}
        onClick={() => handleSettingChange('showIcons')}
      />
      <MenuItem
        icon={settings.showOnStart ? 'tick' : 'blank'}
        text={t('Default Workspace')}
        onClick={() => handleSettingChange('showOnStart')}
      />
    </Menu>
  );

  return (
    <Box
      ref={sidebarRef}
      onTransitionEnd={() => {
        if (open) setRenderTree(true);
      }}
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        overflow: 'hidden',
        transition:
          isResizing || (open && isInitialLoad)
            ? 'none'
            : (theme) => theme.transitions.create('width'),
        position: 'relative',
        border: 'none',
      }}
      className={Classes.FOCUS_DISABLED}
    >
      <Box
        sx={{
          width: drawerWidth,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          border: 'none',
        }}
      >
        <div className="explorer-topbar">
          <div className="explorer-topbar-upper">
            <div className="explorer-topbar-left">
              <Tooltip content={t('Open Workspace')} placement="top" usePortal={false}>
                <Button minimal icon="folder-open" onClick={handleOpenWorkspace} />
              </Tooltip>
              <Tooltip content={t('New File')} placement="top" usePortal={false}>
                <Button minimal icon="document" disabled={!workspacePath} />
              </Tooltip>
              <Tooltip content={t('New Folder')} placement="top" usePortal={false}>
                <Button minimal icon="folder-new" disabled={!workspacePath} />
              </Tooltip>
            </div>
            <div className="explorer-topbar-right">
              <Tooltip content={t('Refresh')} placement="top" usePortal={false}>
                <Button
                  minimal
                  icon="refresh"
                  disabled={!workspacePath}
                  onClick={refreshTreeView}
                />
              </Tooltip>
              <Popover
                content={settingsMenu}
                placement="bottom-end"
                usePortal={false}
              >
                <Tooltip content={t('Settings')} placement="top" usePortal={false}>
                  <Button minimal icon="more" />
                </Tooltip>
              </Popover>{' '}
              <Button minimal icon="cross" onClick={handleClose} />
            </div>
          </div>
          <div className="explorer-topbar-lower">
            {workspacePath && (
              <Icon icon="root-folder" style={{ marginRight: '8px' }} />
            )}
            <span>
              {workspacePath
                ? workspacePath.split('\\').pop()
                : t('No Workspace')}
            </span>
          </div>
        </div>
        <Box
          className="explorer-tree-container"
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            overflowX: 'auto',
          }}
        >
          {isResizing && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                backgroundColor: 'rgba(0,0,0,0.05)',
              }}
            />
          )}
          {renderTree && workspacePath ? (
            <Tree
              contents={nodes}
              onNodeClick={handleNodeClick}
              onNodeCollapse={handleNodeCollapse}
              onNodeExpand={handleNodeExpand}
              className="explorer-tree"
            />
          ) : (
            renderTree &&
            !workspacePath && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <MuiButton
                  variant="contained"
                  onClick={handleOpenWorkspace}
                >
                  {t('Open Workspace')}
                </MuiButton>
              </Box>
            )
          )}
        </Box>
      </Box>
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
    </Box>
  );
};

Explorer.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  workspacePath: PropTypes.string,
  setWorkspacePath: PropTypes.func.isRequired,
  isInitialLoad: PropTypes.bool.isRequired,
  onOpenFile: PropTypes.func.isRequired,
};

export default Explorer;

