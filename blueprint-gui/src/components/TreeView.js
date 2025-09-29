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

const TreeViewItem = ({ item, refreshTreeView, onNewItem, depth, showIcons }) => {
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
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
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
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleNewFile}>New File</MenuItem>
        <MenuItem onClick={handleNewFolder}>New Folder</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
      {item.isDirectory && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {children.map((child) => (
              <TreeViewItem key={child.path} item={child} refreshTreeView={refreshTreeView} onNewItem={onNewItem} depth={depth + 1} showIcons={showIcons} />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const TreeView = ({ rootPath, onNewItem, refreshTreeView, showIcons }) => {
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
        <TreeViewItem key={item.path} item={item} refreshTreeView={refreshTreeView} onNewItem={onNewItem} depth={1} showIcons={showIcons} />
      ))}
    </List>
  );
};

export default TreeView;
