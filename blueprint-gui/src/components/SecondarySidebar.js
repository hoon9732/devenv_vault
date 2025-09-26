import React from 'react';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import CloseIcon from '@mui/icons-material/Close';
import { useLanguage } from '../contexts/LanguageContext';
import TreeView from './TreeView';

const drawerWidth = 240;

const SecondarySidebar = ({ open, setOpen, workspacePath, setWorkspacePath }) => {
  const { t } = useLanguage();

  const handleOpenWorkspace = async () => {
    if (window.electron) {
      const path = await window.electron.setWorkspacePath();
      if (path) {
        setWorkspacePath(path);
      }
    }
  };

  return (
    <Box
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#252526' : '#f3f3f3',
        color: (theme) => theme.palette.mode === 'dark' ? '#cccccc' : '#333333',
        overflow: 'hidden',
        transition: (theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Toolbar sx={{ minHeight: '48px !important', p: '0 8px !important', justifyContent: 'space-between' }}>
        <Box>
          <Tooltip title={t('Open New Workspace')}>
            <IconButton onClick={handleOpenWorkspace}>
              <FolderOpenIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('New File')}>
            <IconButton>
              <NoteAddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('New Folder')}>
            <IconButton>
              <CreateNewFolderIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Tooltip title={t('Close Sidebar')}>
          <IconButton onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
      <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
        {workspacePath ? (
          <TreeView rootPath={workspacePath} />
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Button variant="contained" onClick={handleOpenWorkspace}>
              {t('Open Workspace')}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SecondarySidebar;