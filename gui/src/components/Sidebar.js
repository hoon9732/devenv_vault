import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import {
  Classes,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  Icon,
} from '@blueprintjs/core';
import { useLanguage } from '../contexts/LanguageContext';
import './Sidebar.css';

const collapsedWidth = 57; // Approx theme.spacing(7)

const Sidebar = ({
  handleExplorerToggle,
  handleOutlineToggle,
  handleAboutClick,
  uiScale,
  handleHamburgerClick,
  isExplorerOpen,
  location,
}) => {
  const { t } = useLanguage();
  const theme = useTheme();
  const isLightTheme = theme.palette.mode === 'light';
  const iconSize = 20 + (uiScale - 1) * 10;

  const mainNavItems = [
    { text: t('Home'), icon: 'home', path: '/' },
    { text: t('Explorer'), icon: 'folder-open' },
    { text: t('Project Outline'), icon: 'diagram-tree', path: '/search' },
  ];

  const appNavItems = [
    {
      text: t('Sheet'),
      icon: 'th',
      path: '/sheet',
      color: isLightTheme ? 'rgb(76, 175, 80)' : 'rgba(102, 255, 102, 0.7)',
    },
    {
      text: t('Graphs'),
      icon: 'data-lineage',
      path: '/graphs',
      color: isLightTheme ? 'rgb(255, 152, 0)' : 'rgba(255, 178, 102, 0.7)',
    },
    {
      text: t('Docs'),
      icon: 'document-share',
      path: '/docs',
      color: isLightTheme ? 'rgb(33, 150, 243)' : 'rgba(102, 178, 255, 0.7)',
    },
  ];

  const bottomNavItems = [
    { text: t('Settings'), icon: 'cog', path: '/settings' },
    { text: t('About'), icon: 'info-sign' },
    { text: t('Profile'), icon: 'user', path: '/profile' },
  ];

  const handleItemClick = (item) => {
    if (item.text === t('Project Outline')) {
      handleOutlineToggle();
    } else if (item.path) {
      handleExplorerToggle(item); // Re-using this handler for navigation
    } else if (item.text === t('Explorer')) {
      handleExplorerToggle(item);
    } else if (item.text === t('About')) {
      handleAboutClick();
    }
  };

  const renderMenuItem = (item) => {
    const isSidebarActive = item.text === t('Explorer') && isExplorerOpen;

    const isPageActive = item.path && item.path === location.pathname;

    const menuItem = (
      <MenuItem
        className="sidebar-menu-item"
        onClick={() => handleItemClick(item)}
        style={{
          height: '48px',
          padding: 0,
          color: theme.palette.text.primary,
          alignItems: 'center',
        }}
        text={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            {isSidebarActive && <div className="sidebar-indicator" />}

            {isPageActive && <div className="page-indicator" />}

            <div
              style={{
                width: `${collapsedWidth}px`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon icon={item.icon} size={iconSize} color={item.color} />
            </div>
          </div>
        }
      />
    );

    return (
      <Tooltip
        content={item.text}
        placement="right"
        usePortal={false}
        key={item.text}
      >
        {menuItem}
      </Tooltip>
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
      }}
      className={`${Classes.FOCUS_DISABLED} ${
        theme.palette.mode === 'dark' ? Classes.DARK : ''
      }`}
    >
      <Menu
        style={{
          padding: 0,
          flexShrink: 0,
          width: collapsedWidth,
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        <MenuItem
          className="sidebar-menu-item"
          onClick={handleHamburgerClick}
          style={{
            height: '64px',
            padding: 0,
            backgroundColor: theme.palette.topbar.background,
            color: theme.palette.text.primary,
            alignItems: 'center',
          }}
          text={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: '100%',
              }}
            >
              <div
                style={{
                  width: `${collapsedWidth}px`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon
                  icon={isExplorerOpen ? 'menu-closed' : 'menu-open'}
                  size={iconSize}
                />
              </div>
            </div>
          }
        />
      </Menu>

      <Menu
        style={{
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
        <Divider style={{ margin: 0, borderColor: 'transparent' }} />
        {appNavItems
          .flatMap((item, index) => [
            renderMenuItem(item),
            index < appNavItems.length - 1 ? (
              <Divider
                style={{ margin: 0, borderColor: 'transparent' }}
                key={`d-app-${index}`}
              />
            ) : null,
          ])
          .filter(Boolean)}
      </Menu>

      <Box sx={{ marginTop: 'auto', flexShrink: 0, overflow: 'hidden' }}>
        <Menu
          style={{
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
        </Menu>
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
  location: PropTypes.object.isRequired,
};

export default Sidebar;
