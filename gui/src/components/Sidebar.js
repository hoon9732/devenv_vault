import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import ScaledTooltip from './ScaledTooltip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import {
  Divider,
  Icon,
} from '@blueprintjs/core';
import { useLanguage } from '../contexts/LanguageContext';
import { useProject } from '../contexts/ProjectContext';
import './Sidebar.css';

const collapsedWidth = 57; // Approx theme.spacing(7)

const Sidebar = ({
  handleExplorerToggle,
  handleOutlineToggle,
  handleAboutClick,
  uiScale,
  handleHamburgerClick,
  isExplorerOpen,
  isOutlineOpen,
}) => {
  const { t } = useLanguage();
  const { activeView, setActiveView } = useProject();
  const theme = useTheme();
  const iconSize = 20 + (uiScale - 1) * 10;

  const mainNavItems = [
    { text: t('Home'), icon: 'home', view: 'graph' },
    { text: t('Explorer'), icon: 'folder-open' },
    { text: t('Project Outline'), icon: 'diagram-tree' },
  ];

  const bottomNavItems = [
    { text: t('Settings'), icon: 'cog', view: 'settings' },
    { text: t('About'), icon: 'info-sign' },
    { text: t('Profile'), icon: 'user', view: 'profile' },
  ];

  const handleItemClick = (item) => {
    if (item.text === t('Project Outline')) {
      handleOutlineToggle();
    } else if (item.text === t('Explorer')) {
      handleExplorerToggle(item);
    } else if (item.text === t('About')) {
      handleAboutClick();
    } else if (item.view) {
      setActiveView(item.view);
    }
  };

  const renderMenuItem = (item) => {
    const isExplorerActive = item.text === t('Explorer') && isExplorerOpen;
    const isOutlineActive = item.text === t('Project Outline') && isOutlineOpen;
    const isSidebarActive = isExplorerActive || isOutlineActive;

    const isViewActive = item.view && item.view === activeView;

    return (
      <ScaledTooltip
        title={item.text}
        placement="right"
        key={item.text}
        uiScale={uiScale}
      >
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            sx={{
              height: '48px',
              padding: 0,
              color: theme.palette.text.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isSidebarActive && <div className="sidebar-indicator" />}
            {isViewActive && <div className="page-indicator" />}
            <ListItemIcon sx={{ minWidth: 0 }}>
              <Icon icon={item.icon} size={iconSize} color={item.color} />
            </ListItemIcon>
          </ListItemButton>
        </ListItem>
      </ScaledTooltip>
    );
  };

  return (
    <Box
      sx={{
        width: collapsedWidth,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: theme.palette.sidebar.background,
        color: theme.palette.text.primary,
      }}
    >
      <List
        sx={{
          padding: 0,
          flexShrink: 0,
          width: collapsedWidth,
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleHamburgerClick}
            className="hamburger-button"
            sx={{
              height: '64px',
              padding: 0,
              color: 'inherit',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ListItemIcon sx={{ minWidth: 0 }}>
              <Icon
                icon={isExplorerOpen ? 'menu-closed' : 'menu-open'}
                size={iconSize}
              />
            </ListItemIcon>
          </ListItemButton>
        </ListItem>
      </List>

      <List
        sx={{
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 0,
          width: collapsedWidth,
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        {mainNavItems
          .flatMap((item, index) => [
            renderMenuItem(item),
            index < mainNavItems.length - 1 ? (
              <Divider
                style={{ margin: 0, borderColor: 'transparent' }}
                key={`d-main-${index}`}
              />
            ) : null,
          ])
          .filter(Boolean)}
      </List>

      <Box sx={{ marginTop: 'auto', flexShrink: 0, overflow: 'hidden' }}>
        <List
          sx={{
            padding: 0,
            width: collapsedWidth,
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          <Divider style={{ margin: 0, borderColor: 'transparent' }} />
          {bottomNavItems
            .flatMap((item, index) => [
              renderMenuItem(item),
              index < bottomNavItems.length - 1 ? (
                <Divider
                  style={{ margin: 0, borderColor: 'transparent' }}
                  key={`d-bottom-${index}`}
                />
              ) : null,
            ])
            .filter(Boolean)}
        </List>
      </Box>
    </Box>
  );
};

Sidebar.propTypes = {
  handleExplorerToggle: PropTypes.func.isRequired,
  handleOutlineToggle: PropTypes.func.isRequired,
  handleAboutClick: PropTypes.func.isRequired,
  uiScale: PropTypes.number.isRequired,
  handleHamburgerClick: PropTypes.func.isRequired,
  isExplorerOpen: PropTypes.bool.isRequired,
  isOutlineOpen: PropTypes.bool.isRequired,
};

export default Sidebar;
