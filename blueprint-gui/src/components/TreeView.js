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

const TreeViewItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState([]);

  const handleToggle = async () => {
    if (item.isDirectory) {
      setIsOpen(!isOpen);
      if (!children.length) {
        const fetchedChildren = await window.electron.readDirectory(item.path);
        setChildren(fetchedChildren);
      }
    }
  };

  return (
    <>
      <ListItem disablePadding sx={{ pl: 2 }}>
        <ListItemButton onClick={handleToggle}>
          <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
            {item.isDirectory ? (
              isOpen ? <ExpandMoreIcon /> : <ChevronRightIcon />
            ) : (
              <Box sx={{ width: 24 }} /> // Placeholder for alignment
            )}
          </ListItemIcon>
          <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
            {item.isDirectory ? <FolderIcon /> : <InsertDriveFileIcon />}
          </ListItemIcon>
          <ListItemText primary={item.name} />
        </ListItemButton>
      </ListItem>
      {item.isDirectory && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {children.map((child) => (
              <TreeViewItem key={child.path} item={child} />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const TreeView = ({ rootPath }) => {
  const [rootItems, setRootItems] = useState([]);

  useEffect(() => {
    const loadRoot = async () => {
      if (rootPath) {
        const items = await window.electron.readDirectory(rootPath);
        setRootItems(items);
      }
    };
    loadRoot();
  }, [rootPath]);

  return (
    <List dense>
      {rootItems.map((item) => (
        <TreeViewItem key={item.path} item={item} />
      ))}
    </List>
  );
};

export default TreeView;
