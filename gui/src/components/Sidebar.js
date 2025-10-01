import React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { Icon } from '@blueprintjs/core';

import { useLanguage } from '../contexts/LanguageContext';

const drawerWidth = 200;


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
  width: `calc(${theme.spacing(6)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(7)} + 1px)`,
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

const Sidebar = ({ open, handleDrawerToggle, handleExplorerToggle, handleModalOpen, handleAboutClick, uiScale, ...props }) => {
  const { t } = useLanguage();
  const theme = useTheme();
  const isLightTheme = theme.palette.mode === 'light';
  const iconSize = (uiScale / 0.8) * 20; // Base size of 20px at 80% scale
  const caretIconSize = iconSize * 0.8;

  const mainNavItems = [
    { text: t('Home'), icon: <Icon icon="home" size={iconSize} />, path: '/' },
    { text: t('Search'), icon: <Icon icon="search" size={iconSize} />, path: '/search' },
    { text: t('Explorer'), icon: <Icon icon="folder-open" size={iconSize} /> },
  ];

  const appNavItems = [
    { text: t('Sheet'), icon: <Icon icon="th" size={iconSize} color={isLightTheme ? 'rgb(76, 175, 80)' : 'rgba(102, 255, 102, 0.7)'} />, path: '/sheet' },
    { text: t('Flowchart'), icon: <Icon icon="flow-linear" size={iconSize} color={isLightTheme ? 'rgb(255, 152, 0)' : 'rgba(255, 178, 102, 0.7)'} />, path: '/flowchart' },
    { text: t('Docs'), icon: <Icon icon="document" size={iconSize} color={isLightTheme ? 'rgb(33, 150, 243)' : 'rgba(102, 178, 255, 0.7)'} />, path: '/docs' },
  ];

  const bottomNavItems = [
      { text: t('Settings'), icon: <Icon icon="cog" size={iconSize} />, path: '/settings' },
      { text: t('About'), icon: <Icon icon="info-sign" size={iconSize} /> },
      { text: t('Profile'), icon: <Icon icon="user" size={iconSize} /> },
  ];

  const handleBottomNavClick = (item) => {
    if (item.path) {
      handleExplorerToggle(item);
    } else if (item.text === t('About')) {
      handleAboutClick();
    } else if (item.text === t('Profile')) {
      handleModalOpen('Profile');
    }
  };

  const tooltipProps = {
    placement: "right",
    TransitionProps: { timeout: 0 },
  };

  return (
    <Drawer variant="permanent" open={open} {...props}>
      <Box
        sx={(theme) => ({
          position: 'absolute',
          left: theme.spacing(6),
          [theme.breakpoints.up('sm')]: {
            left: theme.spacing(7),
          },
          top: 0,
          height: '100%',
          width: '1px',
          backgroundColor: theme.palette.divider,
          zIndex: theme.zIndex.drawer + 1,
        })}
      />
      <Box sx={{ paddingTop: '40px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Hamburger Menu & Arrow */}
        <Box sx={{ position: 'relative', height: '48px' }}>
          {/* Hamburger button area */}
          <Tooltip title={t('Toggle Sidebar')} {...tooltipProps}>
            <ListItemButton
              onClick={handleDrawerToggle}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: (theme) => `calc(${theme.spacing(7)} + 1px)`,
                justifyContent: 'center',
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
                <Icon icon="menu" size={iconSize} />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>

          {/* Arrow area */}
          <Box
            onClick={handleDrawerToggle}
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              left: (theme) => `calc(${theme.spacing(7)} + 1px)`,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              cursor: 'pointer',
              pointerEvents: open ? 'auto' : 'none',
              pr: open ? 0 : 2,
              '&:hover': {
                backgroundColor: open ? 'action.hover' : 'transparent',
              },
            }}
          >
            {open ? <Icon icon="caret-left" size={caretIconSize} /> : <Icon icon="caret-right" size={caretIconSize} />}
          </Box>
        </Box>
        <Divider sx={{ my: 0 }} />
        {/* Main Navigation */}
        <List disablePadding>
          {mainNavItems.map((item) => (
            <Tooltip key={item.text} title={item.text} {...tooltipProps}>
              <ListItem disablePadding onClick={() => handleExplorerToggle(item)}>
                <ListItemButton sx={{ px: 0 }}>
                  <ListItemIcon sx={{ width: (theme) => theme.spacing(7), justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ variant: 'body1' }} sx={{ ml: 2 }} />
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>

        <Divider sx={{ my: 0 }} />

        {/* App Navigation */}
        <List disablePadding>
          {appNavItems.map((item) => (
            <Tooltip key={item.text} title={item.text} {...tooltipProps}>
              <ListItem disablePadding onClick={() => handleExplorerToggle(item)}>
                <ListItemButton sx={{ px: 0 }}>
                  <ListItemIcon sx={{ width: (theme) => theme.spacing(7), justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ variant: 'body1' }} sx={{ ml: 2 }} />
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>

        {/* Bottom Navigation */}
        <Box sx={{ marginTop: 'auto' }}>
          <Divider sx={{ my: 0 }} />
          <List disablePadding>
            {bottomNavItems.map((item) => (
              <Tooltip key={item.text} title={item.text} {...tooltipProps}>
                <ListItem disablePadding onClick={() => handleBottomNavClick(item)}>
                  <ListItemButton sx={{ px: 0 }}>
                    <ListItemIcon sx={{ width: (theme) => theme.spacing(7), justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{ variant: 'body1' }} sx={{ ml: 2 }} />
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            ))}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;