import React, { useState, useRef, useCallback, useEffect } from 'react';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Icon } from '@blueprintjs/core';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CheckIcon from '@mui/icons-material/Check';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { useLanguage } from '../contexts/LanguageContext';
import TreeView from './TreeView';

const initialDrawerWidth = 240;
const minDrawerWidth = 150;
const maxDrawerWidth = 500;

const SecondarySidebar = ({ open, setOpen, workspacePath, setWorkspacePath, uiScale }) => {
  const { t } = useLanguage();
  const [drawerWidth, setDrawerWidth] = useState(initialDrawerWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const [renderTree, setRenderTree] = useState(false);
  const [settingsAnchorPos, setSettingsAnchorPos] = useState(null);
  const [settings, setSettings] = useState({ showIcons: true, showOnStart: false });
  const [selectedNode, setSelectedNode] = useState(null);
  const [treeData, setTreeData] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

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

  useEffect(() => {
    setSelectedNode(null);
    const loadTree = async () => {
        if (workspacePath) {
            const items = await window.electron.readDirectory(workspacePath);
            setTreeData(items);
        } else {
            setTreeData([]);
        }
    };
    loadTree();
  }, [workspacePath, refreshKey]);

  const refreshTreeView = () => setRefreshKey(prev => prev + 1);

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
  }, [isResizing]);

  const handleMouseUp = useCallback(() => setIsResizing(false), []);

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
    PopperProps: {
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 2],
          },
        },
      ],
    },
  };

  return (
    <Box
      ref={sidebarRef}
      onTransitionEnd={() => { if (open) setRenderTree(true); }}
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        overflow: 'hidden',
        transition: isResizing ? 'none' : (theme) => theme.transitions.create('width'),
        position: 'relative',
        paddingTop: '40px',
      }}
    >
      <Box sx={{ width: drawerWidth, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'background.paper' }}>
        <Toolbar sx={{ minHeight: '48px !important', p: '0 8px !important', justifyContent: 'space-between' }}>
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
        <Divider sx={{ my: 0 }} />
        <Box sx={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            width: '12px',
            height: '12px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#555' : '#ccc',
            borderRadius: '6px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#777' : '#aaa',
          }
        }}>
          {isResizing && <Box sx={{ position: 'absolute', inset: 0, zIndex: 1, backgroundColor: 'rgba(0,0,0,0.05)' }} />}
          {renderTree && workspacePath ? (
            <TreeView
              treeData={treeData}
              showIcons={settings.showIcons}
              uiScale={uiScale}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              refreshTreeView={refreshTreeView}
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
export default SecondarySidebar;