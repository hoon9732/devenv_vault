import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const TreeViewItem = ({ item, refreshTreeView, onNewItem, depth, showIcons, uiScale }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);

  const handleToggle = async () => {
    if (item.isDirectory) {
      setIsOpen(!isOpen);
      if (!children.length) {
        const fetchedChildren = await window.electron.readDirectory(item.path);
        setChildren(fetchedChildren);
      }
    }
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX / uiScale,
            mouseY: event.clientY / uiScale,
          }
        : null,
    );
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleNewFile = () => {
    onNewItem('file', item.isDirectory ? item.path : window.electron.path.dirname(item.path));
    handleClose();
  };

  const handleNewFolder = () => {
    onNewItem('folder', item.isDirectory ? item.path : window.electron.path.dirname(item.path));
    handleClose();
  };

  const handleDelete = async () => {
    let result;
    if (item.isDirectory) {
      result = await window.electron.deleteDirectory(item.path);
    } else {
      result = await window.electron.deleteFile(item.path);
    }

    if (result.success) {
      refreshTreeView();
    } else {
      console.error(result.error);
    }

    handleClose();
  };

  return (
    <>
      <ListItem disablePadding sx={{ pl: depth * 1.5, py: 0 }} onContextMenu={handleContextMenu}>
        <ListItemButton onClick={handleToggle} sx={{ py: 0.2, px: 1 }}>
          <ListItemIcon sx={{ minWidth: 'auto', mr: 0.5 }}>
            {item.isDirectory ? (
              isOpen ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />
            ) : (
              <Box sx={{ width: 20 }} /> // Placeholder for alignment
            )}
          </ListItemIcon>
          {showIcons && (
            <ListItemIcon sx={{ minWidth: 'auto', mr: 0.5 }}>
              {item.isDirectory ? <FolderIcon fontSize="small" /> : <InsertDriveFileIcon fontSize="small" />}
            </ListItemIcon>
          )}
          <ListItemText primary={item.name} primaryTypographyProps={{ sx: { fontSize: '0.875rem' } }} />
        </ListItemButton>
      </ListItem>
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        disablePortal
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: 0,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#252526' : '#f3f3f3',
            border: (theme) => `1px solid ${theme.palette.divider}`,
          },
        }}
        MenuListProps={{ dense: true, sx: { py: 0.5 } }}
      >
        <MenuItem sx={{ py: 0.25, px: 1.5, minHeight: 'auto' }} onClick={handleNewFile}><ListItemText primary="New File" primaryTypographyProps={{ sx: { fontSize: '0.875rem', fontWeight: 400 } }} /></MenuItem>
        <MenuItem sx={{ py: 0.25, px: 1.5, minHeight: 'auto' }} onClick={handleNewFolder}><ListItemText primary="New Folder" primaryTypographyProps={{ sx: { fontSize: '0.875rem', fontWeight: 400 } }} /></MenuItem>
        <MenuItem sx={{ py: 0.25, px: 1.5, minHeight: 'auto' }} onClick={handleDelete}><ListItemText primary="Delete" primaryTypographyProps={{ sx: { fontSize: '0.875rem', fontWeight: 400 } }} /></MenuItem>
      </Menu>
      {item.isDirectory && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {children.map((child) => (
              <TreeViewItem key={child.path} item={child} refreshTreeView={refreshTreeView} onNewItem={onNewItem} depth={depth + 1} showIcons={showIcons} uiScale={uiScale} />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const TreeView = ({ rootPath, onNewItem, refreshTreeView, showIcons, uiScale }) => {
  const [rootItems, setRootItems] = useState([]);

  useEffect(() => {
    const loadRoot = async () => {
      if (rootPath) {
        const items = await window.electron.readDirectory(rootPath);
        setRootItems(items);
      }
    };
    loadRoot();
  }, [rootPath, refreshTreeView]);

  return (
    <List dense>
      {rootItems.map((item) => (
        <TreeViewItem key={item.path} item={item} refreshTreeView={refreshTreeView} onNewItem={onNewItem} depth={1} showIcons={showIcons} uiScale={uiScale} />
      ))}
    </List>
  );
};

export default TreeView;
