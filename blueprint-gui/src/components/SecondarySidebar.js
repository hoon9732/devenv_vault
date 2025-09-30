import React, { useState, useRef, useCallback, useEffect } from 'react';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CheckIcon from '@mui/icons-material/Check';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useLanguage } from '../contexts/LanguageContext';
import TreeView from './TreeView';

const initialDrawerWidth = 240;
const minDrawerWidth = 150;
const maxDrawerWidth = 500;

const SecondarySidebar = ({ open, setOpen, workspacePath, setWorkspacePath }) => {
  const { t } = useLanguage();
  const [drawerWidth, setDrawerWidth] = useState(initialDrawerWidth);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({ type: '', path: '' });
  const [itemName, setItemName] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const [renderTree, setRenderTree] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [settings, setSettings] = useState({ showIcons: true, showOnStart: false });

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
    // When closing, unmount the tree immediately to prevent lag
    if (!open) {
      setRenderTree(false);
    }
  }, [open]);

  const handleOpenWorkspace = async () => {
    if (window.electron) {
      const path = await window.electron.setWorkspacePath();
      if (path) {
        setWorkspacePath(path);
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const refreshTreeView = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleNewItem = (type, path) => {
    setDialogConfig({ type, path: path || workspacePath });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setItemName('');
  };

  const handleDialogSubmit = async () => {
    if (!itemName) return;
    const { type, path } = dialogConfig;
    const fullPath = `${path}\${itemName}`;
    let result;
    if (type === 'file') {
      result = await window.electron.createFile(fullPath);
    } else {
      result = await window.electron.createDirectory(fullPath);
    }
    if (result.success) {
      refreshTreeView();
    } else {
      console.error(result.error);
    }
    handleDialogClose();
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e) => {
    if (sidebarRef.current) {
      const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
      if (newWidth > minDrawerWidth && newWidth < maxDrawerWidth) {
        window.requestAnimationFrame(() => {
          if (sidebarRef.current) {
            sidebarRef.current.style.width = `${newWidth}px`;
            if (sidebarRef.current.firstChild) {
              sidebarRef.current.firstChild.style.width = `${newWidth}px`;
            }
          }
        });
      }
    }
  }, []);

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    if (sidebarRef.current) {
      const newWidth = parseFloat(sidebarRef.current.style.width);
      setDrawerWidth(newWidth);
      sidebarRef.current.style.width = ''; // Clean up inline style to allow CSS transition
      if (sidebarRef.current.firstChild) {
        sidebarRef.current.firstChild.style.width = '';
      }
    }
  };

  const handleSettingsClick = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleSettingChange = (settingName) => {
    const newSettings = { ...settings, [settingName]: !settings[settingName] };
    setSettings(newSettings);
    if (window.electron) {
      window.electron.setWorkspaceSettings(newSettings);
    }
  };

  return (
    <Box
      ref={sidebarRef}
      onTransitionEnd={() => { if (open) setRenderTree(true); }}
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        overflow: 'hidden',
        transition: isResizing ? 'none' : (theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        position: 'relative',
      }}
    >
      <Box sx={{
        width: drawerWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#252526' : '#f3f3f3',
        color: (theme) => theme.palette.mode === 'dark' ? '#cccccc' : '#333333',
      }}>
        <Toolbar />
        <Toolbar sx={{ minHeight: '48px !important', p: '0 8px !important', justifyContent: 'space-between', flexShrink: 0 }}>
          <Box>
            <Tooltip title={t('Open New Workspace')}>
              <IconButton onClick={handleOpenWorkspace}>
                <FolderOpenIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('New File')}>
              <IconButton onClick={() => handleNewItem('file')}>
                <NoteAddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('New Folder')}>
              <IconButton onClick={() => handleNewItem('folder')}>
                <CreateNewFolderIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Box>
            <Tooltip title={t('Settings')}>
              <IconButton onClick={handleSettingsClick}>
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('Close Sidebar')}>
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
        <Box sx={{ overflowY: 'auto', flexGrow: 1, position: 'relative' }}>
          {isResizing && <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, backgroundColor: 'rgba(0,0,0,0.05)' }} />}
          {renderTree && workspacePath ? (
            <TreeView
              rootPath={workspacePath}
              key={refreshKey}
              onNewItem={handleNewItem}
              refreshTreeView={refreshTreeView}
              showIcons={settings.showIcons}
            />
          ) : (
            renderTree && !workspacePath && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button variant="contained" onClick={handleOpenWorkspace}>
                  {t('Open Workspace')}
                </Button>
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
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>{dialogConfig.type === 'file' ? t('Create New File') : t('Create New Folder')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('Please enter a name for the new ' + dialogConfig.type + '.')}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label={t('Name')}
            type="text"
            fullWidth
            variant="standard"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>{t('Cancel')}</Button>
          <Button onClick={handleDialogSubmit}>{t('Create')}</Button>
        </DialogActions>
      </Dialog>
      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={handleSettingsClose}
        MenuListProps={{ dense: true, sx: { py: 0.5 } }}
        PaperProps={{ 
          sx: { 
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#252526' : '#f3f3f3',
            border: (theme) => `1px solid ${theme.palette.divider}`
          } 
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleSettingChange('showIcons')} sx={{ pl: 1, py: 0.2, minHeight: 'auto' }}>
          <Box sx={{ width: '20px', display: 'flex', alignItems: 'center' }}>
            {settings.showIcons && <CheckIcon sx={{ fontSize: '1rem' }} />}
          </Box>
          <ListItemText primary={t('Workspace Icons')} primaryTypographyProps={{ sx: { fontSize: '0.875rem' } }} />
        </MenuItem>
        <MenuItem onClick={() => handleSettingChange('showOnStart')} sx={{ pl: 1, py: 0.2, minHeight: 'auto' }}>
          <Box sx={{ width: '20px', display: 'flex', alignItems: 'center' }}>
            {settings.showOnStart && <CheckIcon sx={{ fontSize: '1rem' }} />}
          </Box>
          <ListItemText primary={t('Show Workspace on Start')} primaryTypographyProps={{ sx: { fontSize: '0.875rem' } }} />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SecondarySidebar;
