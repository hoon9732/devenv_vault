import React, { useState, useRef, useCallback, useEffect } from 'react';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Icon, Tree } from '@blueprintjs/core';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CheckIcon from '@mui/icons-material/Check';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useLanguage } from '../contexts/LanguageContext';

const initialDrawerWidth = 240;
const minDrawerWidth = 150;
const maxDrawerWidth = 500;

const Explorer = ({ open, setOpen, workspacePath, setWorkspacePath, uiScale, isInitialLoad, onOpenFile }) => {
  const { t } = useLanguage();
  const [drawerWidth, setDrawerWidth] = useState(initialDrawerWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const [renderTree, setRenderTree] = useState(false);
  const [settingsAnchorPos, setSettingsAnchorPos] = useState(null);
  const [settings, setSettings] = useState({ showIcons: true, showOnStart: false });
  const [nodes, setNodes] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Helper function to convert file system items to Blueprint Tree nodes
  const toTreeNodes = (items) => {
    return items.map(item => ({
      id: item.path,
      label: item.name,
      icon: item.isDirectory ? "folder-close" : "document",
      hasCaret: item.isDirectory,
      isExpanded: false,
      childNodes: [],
      nodeData: item,
    }));
  };

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
  }, [workspacePath, refreshKey]);

  const refreshTreeView = () => setRefreshKey(prev => prev + 1);

  // Recursively find a node by its ID (path) and apply a mutation
  const findAndMutateNode = (nodes, id, mutation) => {
    return nodes.map(node => {
      if (node.id === id) {
        return mutation(node);
      }
      if (node.childNodes) {
        return { ...node, childNodes: findAndMutateNode(node.childNodes, id, mutation) };
      }
      return node;
    });
  };

  const handleNodeExpand = async (node) => {
    // Fetch children if they haven't been loaded yet
    if (node.childNodes.length === 0) {
      const children = await window.electron.readDirectory(node.id);
      const childNodes = toTreeNodes(children);
      setNodes(currentNodes => findAndMutateNode(currentNodes, node.id, n => ({ ...n, isExpanded: true, childNodes: childNodes })));
    } else {
      // Just expand the node if children are already loaded
      setNodes(currentNodes => findAndMutateNode(currentNodes, node.id, n => ({ ...n, isExpanded: true })));
    }
  };

  const handleNodeCollapse = (node) => {
    setNodes(currentNodes => findAndMutateNode(currentNodes, node.id, n => ({ ...n, isExpanded: false })));
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
    forEachNode(newNodes, n => (n.isSelected = false));

    setNodes(findAndMutateNode(newNodes, node.id, n => ({ ...n, isSelected: true })));

    // If it's a file, call the open file handler
    if (node.nodeData && !node.nodeData.isDirectory) {
      onOpenFile(node.id);
    } else {
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

  const handleMouseMove = useCallback((e) => {
    if (isResizing && sidebarRef.current) {
      const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
      if (newWidth > minDrawerWidth && newWidth < maxDrawerWidth) setDrawerWidth(newWidth);
    }
  }, [isResizing, sidebarRef, setDrawerWidth]);

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

  const handleSettingsClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSettingsAnchorPos({ top: rect.bottom, left: rect.left });
  };

  const handleSettingChange = (settingName) => {
    const newSettings = { ...settings, [settingName]: !settings[settingName] };
    setSettings(newSettings);
    if (window.electron) window.electron.setWorkspaceSettings(newSettings);
  };

  const tooltipProps = {
    placement: "top",
    TransitionProps: { timeout: 0 },
  };

  return (
    <Box
      ref={sidebarRef}
      onTransitionEnd={() => { if (open) setRenderTree(true); }}
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        overflow: 'hidden',
        transition: isResizing || (open && isInitialLoad) ? 'none' : (theme) => theme.transitions.create('width'),
        position: 'relative',
      }}
    >
      <Box sx={{ width: drawerWidth, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'background.paper' }}>
        <Toolbar sx={{ minHeight: '48px !important', height: '48px', p: '0 8px !important', justifyContent: 'space-between', backgroundColor: 'topbar.background' }}>
          <Box>
            <Tooltip title={t('Open Workspace')} {...tooltipProps}><IconButton sx={{ p: 0.75 }} onClick={handleOpenWorkspace}><Icon icon="folder-open" /></IconButton></Tooltip>
            <Tooltip title={t('New File')} {...tooltipProps}><IconButton sx={{ p: 0.75 }} disabled={!workspacePath}><Icon icon="document" /></IconButton></Tooltip>
            <Tooltip title={t('New Folder')} {...tooltipProps}><IconButton sx={{ p: 0.75 }} disabled={!workspacePath}><Icon icon="folder-new" /></IconButton></Tooltip>
            <Tooltip title={t('Refresh')} {...tooltipProps}><IconButton sx={{ p: 0.75 }} disabled={!workspacePath} onClick={refreshTreeView}><Icon icon="refresh" /></IconButton></Tooltip>
          </Box>
          <Box>
            <Tooltip title={t('Settings')} {...tooltipProps}><IconButton sx={{ p: 0.75 }} onClick={handleSettingsClick}><Icon icon="more" /></IconButton></Tooltip>
            <Tooltip title={t('Close Sidebar')} {...tooltipProps}><IconButton sx={{ p: 0.75 }} onClick={handleClose}><Icon icon="cross" /></IconButton></Tooltip>
          </Box>
        </Toolbar>
        <Box sx={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'auto',
        }}>
          {isResizing && <Box sx={{ position: 'absolute', inset: 0, zIndex: 1, backgroundColor: 'rgba(0,0,0,0.05)' }} />}
          {renderTree && workspacePath ? (
            <Tree
              contents={nodes}
              onNodeClick={handleNodeClick}
              onNodeCollapse={handleNodeCollapse}
              onNodeExpand={handleNodeExpand}
              className="explorer-tree"
            />
          ) : (
            renderTree && !workspacePath && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button variant="contained" onClick={handleOpenWorkspace}>{t('Open Workspace')}</Button>
              </Box>
            )
          )}
        </Box>
      </Box>
      <Box onMouseDown={handleMouseDown} sx={{ width: '5px', cursor: 'col-resize', position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 100 }} />
      <Menu
        open={Boolean(settingsAnchorPos)}
        onClose={() => setSettingsAnchorPos(null)}
        transitionDuration={0}
        anchorReference="anchorPosition"
        anchorPosition={settingsAnchorPos}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
            style: {
                transform: `scale(${uiScale})`,
                transformOrigin: 'top left',
                borderRadius: 0,
            },
        }}
        MenuListProps={{
            sx: {
                py: 0,
            },
        }}
      >
        <MenuItem sx={{ pl: 1 }} onClick={() => handleSettingChange('showIcons')}>
          <ListItemIcon>{settings.showIcons && <CheckIcon />}</ListItemIcon>
          <ListItemText>{t('Workspace Icons')}</ListItemText>
        </MenuItem>
        <MenuItem sx={{ pl: 1 }} onClick={() => handleSettingChange('showOnStart')}>
          <ListItemIcon>{settings.showOnStart && <CheckIcon />}</ListItemIcon>
          <ListItemText>{t('Show Workspace on Start')}</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};
export default Explorer;