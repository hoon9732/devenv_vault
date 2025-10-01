import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import { Icon } from '@blueprintjs/core';
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
                sx={{ 
                    pl: depth * 2, 
                    py: 0, 
                    backgroundColor: isSelected ? 'action.selected' : 'transparent',
                    // Give the item its own background to sit on top of the indented block
                    '&:not(.Mui-selected)': {
                        backgroundColor: 'background.paper'
                    }
                }}
                onContextMenu={handleContextMenu}
            >
                <ListItemButton 
                    onClick={handleToggle} 
                    sx={{ 
                        py: 0.2, 
                        px: 1,
                        transform: 'translateZ(0)', // Prevent flickering of children
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 'auto', mr: 0.5, transform: 'translateZ(0)' }}>
                        {item.isDirectory ? (isOpen ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />) : <Box sx={{ width: 20 }} />}
                    </ListItemIcon>
                    {showIcons && (
                        <ListItemIcon sx={{ 
                            minWidth: 'auto', 
                            mr: 0.5, 
                            fontSize: '16px',
                            '-webkit-font-smoothing': 'subpixel-antialiased',
                            imageRendering: '-webkit-optimize-contrast'
                        }}>
                            {item.isDirectory ? <Icon icon="folder-close" /> : <Icon icon="document" />}
                        </ListItemIcon>
                    )}
                    <ListItemText 
                        primary={item.name} 
                        primaryTypographyProps={{ 
                            sx: { 
                                fontSize: '0.875rem',
                                transform: 'translateZ(0)', // Optimization to prevent flickering on collapse
                            } 
                        }} 
                    />
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
                <Collapse in={isOpen} timeout={200} unmountOnExit>
                    <Box
                        sx={(theme) => ({
                            paddingLeft: theme.spacing(2),
                            backgroundColor: theme.palette.action.hover,
                        })}
                    >
                        {children.map((child) => (
                            <TreeViewItem key={child.path} item={child} depth={depth} {...{ showIcons, uiScale, selectedNode, setSelectedNode, refreshTreeView }} />
                        ))}
                    </Box>
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