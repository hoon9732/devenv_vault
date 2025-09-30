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
import { useLanguage } from '../contexts/LanguageContext';

const TreeViewItem = ({ item, depth, showIcons, uiScale, selectedNode, setSelectedNode, refreshTreeView }) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [children, setChildren] = useState([]);
    const [contextMenu, setContextMenu] = useState(null);
    const isSelected = selectedNode?.path === item.path;

    useEffect(() => {
        if (item.isDirectory && isOpen) {
            const fetchChildren = async () => {
                const fetchedChildren = await window.electron.readDirectory(item.path);
                setChildren(fetchedChildren);
            };
            fetchChildren();
        }
    }, [isOpen, item.path, item.isDirectory, refreshTreeView]);

    const handleToggle = () => {
        setSelectedNode(item);
        if (item.isDirectory) {
            setIsOpen(!isOpen);
        }
    };

    const handleContextMenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setSelectedNode(item);
        setContextMenu({ mouseX: event.clientX, mouseY: event.clientY });
    };

    const handleClose = () => setContextMenu(null);
    
    const handleDelete = async () => {
        const result = item.isDirectory
            ? await window.electron.deleteDirectory(item.path)
            : await window.electron.deleteFile(item.path);
        if (result.success) {
            refreshTreeView(); 
        } else {
            console.error(result.error);
        }
        handleClose();
    };

    return (
        <>
            <ListItem
                disablePadding
                sx={{ pl: depth * 1, py: 0, backgroundColor: isSelected ? 'action.hover' : 'transparent' }}
                onContextMenu={handleContextMenu}
            >
                <ListItemButton onClick={handleToggle} sx={{ py: 0.2, px: 1 }}>
                    <ListItemIcon sx={{ minWidth: 'auto', mr: 0.5 }}>
                        {item.isDirectory ? (isOpen ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />) : <Box sx={{ width: 20 }} />}
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
                transitionDuration={0}
                anchorReference="anchorPosition"
                anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
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
                <MenuItem sx={{ pl: 1 }} onClick={handleDelete}>{t('Delete')}</MenuItem>
            </Menu>
            {item.isDirectory && (
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {children.map((child) => (
                            <TreeViewItem key={child.path} item={child} depth={depth + 1} {...{ showIcons, uiScale, selectedNode, setSelectedNode, refreshTreeView }} />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
};

const TreeView = (props) => {
    const { treeData } = props;

    return (
        <List dense sx={{ padding: 0 }}>
            {treeData.map((item) => (
                <TreeViewItem key={item.path} item={item} depth={0} {...props} />
            ))}
        </List>
    );
};

export default TreeView;