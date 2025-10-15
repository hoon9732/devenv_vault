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

            {isViewActive && <div className="page-indicator" />}

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
  isOutlineOpen: PropTypes.bool.isRequired,
};

export default Sidebar;
