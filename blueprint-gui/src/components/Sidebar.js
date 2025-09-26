import React from 'react';
import { styled } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
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
import TableViewIcon from '@mui/icons-material/TableView';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DescriptionIcon from '@mui/icons-material/Description';

import { useLanguage } from '../contexts/LanguageContext';

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

const Sidebar = ({ open, handleSecondaryToggle, handleModalOpen, handleHelpClick }) => {
  const { t } = useLanguage();

  const mainNavItems = [
    { text: t('Home'), icon: <HomeIcon />, path: '/' },
    { text: t('Search'), icon: <SearchIcon />, path: '/search' },
    { text: t('Workspace'), icon: <FolderOpenIcon /> },
  ];

  const appNavItems = [
    { text: t('Sheet'), icon: <TableViewIcon />, path: '/sheet', color: 'rgba(102, 255, 102, 0.2)' },
    { text: t('Flowchart'), icon: <AccountTreeIcon />, path: '/flowchart', color: 'rgba(255, 178, 102, 0.2)' },
    { text: t('Docs'), icon: <DescriptionIcon />, path: '/docs', color: 'rgba(102, 178, 255, 0.2)' },
  ];

  const bottomNavItems = [
      { text: t('Settings'), icon: <SettingsIcon />, path: '/settings' },
      { text: t('Help'), icon: <HelpOutlineIcon /> },
      { text: t('Profile'), icon: <AccountCircleIcon /> },
  ];

  const handleBottomNavClick = (item) => {
    if (item.path) {
      handleSecondaryToggle(item);
    } else if (item.text === t('Help')) {
      handleHelpClick();
    } else if (item.text === t('Profile')) {
      handleModalOpen(item.text);
    }
  };

  return (
    <Drawer variant="permanent" open={open}>
      <Toolbar />
      <Box sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Main Navigation */}
        <List>
          {mainNavItems.map((item) => (
            <ListItem key={item.text} disablePadding onClick={() => handleSecondaryToggle(item)}>
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        {/* App Navigation */}
        <List>
          {appNavItems.map((item) => (
            <ListItem key={item.text} disablePadding onClick={() => handleSecondaryToggle(item)}>
              <ListItemButton>
                <ListItemIcon sx={{ color: item.color }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* Bottom Navigation */}
        <Box sx={{ marginTop: 'auto' }}>
          <Divider />
          <List>
            {bottomNavItems.map((item) => (
              <ListItem key={item.text} disablePadding onClick={() => handleBottomNavClick(item)}>
                <ListItemButton>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;