import React from 'react';
import { Link } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';

import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const drawerWidth = 240;

const Sidebar = ({ open, handleFileOpen }) => {
  const mainNavItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Search', icon: <SearchIcon />, path: '/search' },
  ];

  const bottomNavItems = [
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
      { text: 'Help', icon: <HelpOutlineIcon />, path: '/help' },
      { text: 'Profile', icon: <AccountCircleIcon />, path: '/profile' },
  ];

  const drawerContent = (
    <div>
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {mainNavItems.map((item) => (
            <ListItem key={item.text} disablePadding component={Link} to={item.path} sx={{ color: 'inherit', textDecoration: 'none' }}>
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem key="file-explorer" disablePadding onClick={handleFileOpen}>
            <ListItemButton>
              <ListItemIcon><FolderOpenIcon /></ListItemIcon>
              <ListItemText primary="File Explorer" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%', overflow: 'auto' }}>
        <Divider />
        <List>
          {bottomNavItems.map((item) => (
             <ListItem key={item.text} disablePadding component={Link} to={item.path} sx={{ color: 'inherit', textDecoration: 'none' }}>
             <ListItemButton>
               <ListItemIcon>{item.icon}</ListItemIcon>
               <ListItemText primary={item.text} />
             </ListItemButton>
           </ListItem>
          ))}
        </List>
      </Box>
    </div>
  );

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
