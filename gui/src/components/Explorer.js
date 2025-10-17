import React, { useState, useRef, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import ScaledTooltip from './ScaledTooltip';
import ScaledMenuItem from './ScaledMenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Popover from '@mui/material/Popover';
import MenuList from '@mui/material/MenuList';
import {
  Button,
  Classes,
  Tree,
  Icon,
} from '@blueprintjs/core';
import { useLanguage } from '../contexts/LanguageContext';
import './Explorer.css';

const NewFolderInput = ({ onCreate, onCancel }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onCreate(inputValue);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onCancel}
                  onClick={(e) => e.stopPropagation()}
                  className="bp5-input"
                  style={{ marginLeft: '4px' }}
                />      );
    };
    
    NewFolderInput.propTypes = {
      onCreate: PropTypes.func.isRequired,
      onCancel: PropTypes.func.isRequired,
    };
    
    const initialDrawerWidth = 240;
    const minDrawerWidth = 160;
    const maxDrawerWidth = 480;
    

const Explorer = ({
  open,
  setOpen,
  workspacePath,
  setWorkspacePath,
  isInitialLoad,
  onOpenFile,
  uiScale,
}) => {
  const { t } = useLanguage();
  const [drawerWidth, setDrawerWidth] = useState(initialDrawerWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizable, setIsResizable] = useState(true);
  const sidebarRef = useRef(null);
  const [renderTree, setRenderTree] = useState(false);
  const [settings, setSettings] = useState({
    showIcons: true,
    showOnStart: false,
    showAnimation: true,
  });
  const [nodes, setNodes] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuPosition, setMenuPosition] = useState(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [clipboard, setClipboard] = useState(null);

  const findAndInsertNode = (nodes, parentPath, newNode) => {
    return nodes.map(node => {
      if (node.path === parentPath) {
        return {
          ...node,
          isExpanded: true,
          childNodes: [newNode, ...(node.childNodes || [])],
        };
      }
      if (node.childNodes) {
        return {
          ...node,
          childNodes: findAndInsertNode(node.childNodes, parentPath, newNode),
        };
      }
      return node;
    });
  };

  const handleCancelCreateFolder = useCallback(() => {
    setIsCreatingFolder(false);
    const removeInput = (nodes) => {
      return nodes
        .filter((node) => node.id !== 'new-folder-input')
        .map((node) => {
          if (node.childNodes) {
            return { ...node, childNodes: removeInput(node.childNodes) };
          }
          return node;
        });
    };
    setNodes((prevNodes) => removeInput(prevNodes));
  }, []);

  const handleNewFolderClick = (node) => {
    handleCloseContextMenu();
    if (isCreatingFolder) return;
    setIsCreatingFolder(true);

    const newNode = {
      id: 'new-folder-input',
      label: (
        <NewFolderInput
          onCreate={(name) => handleCreateFolder(name, node)}
          onCancel={handleCancelCreateFolder}
        />
      ),
      icon: 'folder-new',
    };

    if (node) {
      const parentPath = node.isDirectory ? node.path : node.path.substring(0, node.path.lastIndexOf('\\'));
      setNodes(prevNodes => findAndInsertNode(prevNodes, parentPath, newNode));
    } else {
      setNodes((prevNodes) => [newNode, ...prevNodes]);
    }
  };

  const handleCreateFolder = useCallback(async (folderName, node) => {
    let parentPath;

    if (node) {
      if (node.isDirectory) {
        parentPath = node.path;
      } else {
        // If it's a file, create the folder in its parent directory
        parentPath = node.path.substring(0, node.path.lastIndexOf('\\'));
      }
    } else {
      parentPath = workspacePath;
    }

    if (parentPath && folderName) {
      const newPath = `${parentPath}\\${folderName}`;
      await window.electron.createDirectory(newPath);
      setIsCreatingFolder(false);
      refreshTreeView();
    } else {
      handleCancelCreateFolder();
    }
  }, [workspacePath, handleCancelCreateFolder]);

  const handleClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom,
      left: rect.left,
    });
  };

  const handleCloseMenu = () => {
    setMenuPosition(null);
  };

  // Helper function to convert file system items to Blueprint Tree nodes
  const toTreeNodes = useCallback(
    (items) => {
      return items.map((item) => ({
        id: item.path,
        label: <div onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, item); }}>{item.name}</div>,
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
        setSettings((prev) => ({ ...prev, ...fetchedSettings }));
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
    if (node.id === 'new-folder-input') {
      return;
    }

    // Custom deep clone to avoid circular JSON error from React components in nodes
    const deepCloneNodes = (nodesToClone) => {
      return nodesToClone.map((nodeToClone) => {
        const clonedNode = { ...nodeToClone };
        if (nodeToClone.childNodes) {
          clonedNode.childNodes = deepCloneNodes(nodeToClone.childNodes);
        }
        return clonedNode;
      });
    };

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
    const newNodes = deepCloneNodes(nodes);
    forEachNode(newNodes, (n) => {
      if (n.id !== 'new-folder-input') {
        n.isSelected = false;
      }
    });

    setNodes(
      findAndMutateNode(newNodes, node.id, (n) => ({ ...n, isSelected: true })),
    );

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

  const handleSettingChange = (settingName) => {
    const newSettings = { ...settings, [settingName]: !settings[settingName] };
    setSettings(newSettings);
    if (window.electron) window.electron.setWorkspaceSettings(newSettings);
  };

  const handleFixedSizeToggle = () => {
    const newResizableState = !isResizable;
    setIsResizable(newResizableState);
    if (!newResizableState) {
      setDrawerWidth(initialDrawerWidth);
    }
  };

  const handleContextMenu = (e, node) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX + 2,
      mouseY: e.clientY - 6,
      node,
    });
  };

  const handleCut = (node) => {
    setClipboard({ action: 'cut', node });
    handleCloseContextMenu();
  };

  const handleCopy = (node) => {
    setClipboard({ action: 'copy', node });
    handleCloseContextMenu();
  };

  const handlePaste = async (destinationNode) => {
    if (!clipboard) return;

    const { action, node: sourceNode } = clipboard;
    
    let destinationPath;
    if (destinationNode) {
      destinationPath = destinationNode.isDirectory ? destinationNode.path : destinationNode.path.substring(0, destinationNode.path.lastIndexOf('\\'));
    } else {
      destinationPath = workspacePath;
    }

    const newPath = `${destinationPath}\\${sourceNode.name}`;

    if (action === 'cut') {
      await window.electron.movePath(sourceNode.path, newPath);
      setClipboard(null);
    } else if (action === 'copy') {
      await window.electron.copyPath(sourceNode.path, newPath);
    }

    refreshTreeView();
    handleCloseContextMenu();
  };

  const handleDelete = async (node) => {
    await window.electron.deletePath(node.path);
    refreshTreeView();
    handleCloseContextMenu();
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };
  
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
          !settings.showAnimation || isResizing || (open && isInitialLoad)
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
          border: 'none',
        }}
      >
        <div className="explorer-topbar">
          <div className="explorer-topbar-upper">
            <div className="explorer-topbar-left">
              <ScaledTooltip
                title={t('Open Workspace')}
                placement="top"
                uiScale={uiScale}
              >
                <Button
                  minimal
                  icon="folder-open"
                  onClick={handleOpenWorkspace}
                />
              </ScaledTooltip>
              <ScaledTooltip
                title={t('New Folder')}
                placement="top"
                uiScale={uiScale}
              >
                <Button
                  minimal
                  icon="folder-new"
                  disabled={!workspacePath || isCreatingFolder}
                  onClick={() => handleNewFolderClick(null)}
                />
              </ScaledTooltip>
            </div>
            <div className="explorer-topbar-right">
              <ScaledTooltip title={t('Refresh')} placement="top" uiScale={uiScale}>
                <Button
                  minimal
                  icon="refresh"
                  disabled={!workspacePath}
                  onClick={refreshTreeView}
                />
              </ScaledTooltip>
              <ScaledTooltip title={t('More')} placement="top" uiScale={uiScale}>
                <Button minimal icon="more" onClick={handleClick} />
              </ScaledTooltip>
              <Popover
                open={Boolean(menuPosition)}
                onClose={handleCloseMenu}
                anchorReference="anchorPosition"
                anchorPosition={menuPosition}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                PaperProps={{
                  sx: {
                    borderRadius: 0,
                  },
                }}
              >
                <MenuList
                  dense
                  className="scaled-menu"
                >
                  <ScaledMenuItem uiScale={uiScale} onClick={() => { handleSettingChange('showIcons'); handleCloseMenu(); }}>
                    <ListItemIcon>
                      <Icon icon={settings.showIcons ? 'tick' : 'blank'} />
                    </ListItemIcon>
                    {t('Show Icons')}
                  </ScaledMenuItem>
                  <ScaledMenuItem uiScale={uiScale} onClick={() => { handleSettingChange('showOnStart'); handleCloseMenu(); }}>
                    <ListItemIcon>
                      <Icon icon={settings.showOnStart ? 'tick' : 'blank'} />
                    </ListItemIcon>
                    {t('Show on Start')}
                  </ScaledMenuItem>
                  <ScaledMenuItem uiScale={uiScale} onClick={() => { handleSettingChange('showAnimation'); handleCloseMenu(); }}>
                    <ListItemIcon>
                      <Icon icon={settings.showAnimation ? 'tick' : 'blank'} />
                    </ListItemIcon>
                    {t('Show Animation')}
                  </ScaledMenuItem>
                  <ScaledMenuItem uiScale={uiScale} onClick={() => { handleFixedSizeToggle(); handleCloseMenu(); }}>
                    <ListItemIcon>
                      <Icon icon={!isResizable ? 'tick' : 'blank'} />
                    </ListItemIcon>
                    {t('Fixed Size')}
                  </ScaledMenuItem>
                </MenuList>
              </Popover>
              <ScaledTooltip title={t('Close')} placement="top" uiScale={uiScale}>
                <Button minimal icon="cross" onClick={handleClose} />
              </ScaledTooltip>
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
          onContextMenu={(e) => handleContextMenu(e, null)}
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
                <Button intent="primary" onClick={handleOpenWorkspace}>
                  {t('Open Workspace')}
                </Button>
              </Box>
            )
          )}
        </Box>
        <Popover
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          sx: {
            borderRadius: 0,
          },
        }}
      >
        <MenuList dense className="scaled-menu">
          <ScaledMenuItem uiScale={uiScale} onClick={() => handleNewFolderClick(contextMenu.node)}>
            {t('New Folder')}
          </ScaledMenuItem>
          <ScaledMenuItem uiScale={uiScale} onClick={() => handleCut(contextMenu.node)} disabled={!contextMenu?.node}>
            {t('Cut')}
          </ScaledMenuItem>
          <ScaledMenuItem uiScale={uiScale} onClick={() => handleCopy(contextMenu.node)} disabled={!contextMenu?.node}>
            {t('Copy')}
          </ScaledMenuItem>
          <ScaledMenuItem uiScale={uiScale} onClick={() => handlePaste(contextMenu.node)} disabled={!clipboard}>
            {t('Paste')}
          </ScaledMenuItem>
          <ScaledMenuItem uiScale={uiScale} onClick={() => handleDelete(contextMenu.node)} disabled={!contextMenu?.node}>
            {t('Delete')}
          </ScaledMenuItem>
          <ScaledMenuItem uiScale={uiScale} disabled>
            {t('Rename')}
          </ScaledMenuItem>
        </MenuList>
      </Popover>
      </Box>
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

Explorer.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  workspacePath: PropTypes.string,
  setWorkspacePath: PropTypes.func.isRequired,
  isInitialLoad: PropTypes.bool.isRequired,
  onOpenFile: PropTypes.func.isRequired,
  uiScale: PropTypes.number.isRequired,
  theme: PropTypes.object.isRequired,
};

export default Explorer;
