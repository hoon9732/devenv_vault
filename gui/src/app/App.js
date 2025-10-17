import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';

import Sidebar from '../components/Sidebar';
import Explorer from '../components/Explorer';
import ProjectOutline from '../components/ProjectOutline';
import Dock from '../dock/Dock';
import { ProjectProvider } from '../contexts/ProjectContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getSettings, saveSettings } from '../utils/settingsManager';
import { Classes } from '@blueprintjs/core';

function App() {
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [lastOpenBar, setLastOpenBar] = useState('explorer');
  const [workspacePath, setWorkspacePath] = useState(null);
  const [themeMode, setThemeMode] = useState('blueprint-dark');
  const [uiScale, setUiScale] = useState(1);
  const [isHardwareAccelerationEnabled, setIsHardwareAccelerationEnabled] =
    useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  useEffect(() => {
    setIsInitialLoad(false);
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setThemeMode(settings.theme || 'blueprint-dark');
      setUiScale(settings.scale || 1);
      setIsHardwareAccelerationEnabled(settings.hardwareAcceleration ?? true);
      setIsLoading(false);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveSettings({
        theme: themeMode,
        scale: uiScale,
        language,
        hardwareAcceleration: isHardwareAccelerationEnabled,
      });
    }
  }, [themeMode, uiScale, language, isLoading, isHardwareAccelerationEnabled]);

  useEffect(() => {
    const loadInitialSettings = async () => {
      if (window.electron) {
        const workspaceSettings = await window.electron.getWorkspaceSettings();
        if (workspaceSettings) {
          if (workspaceSettings.path) {
            setWorkspacePath(workspaceSettings.path);
          }
          if (workspaceSettings.showOnStart) {
            setIsExplorerOpen(true);
          }
        }
        
        const outlineSettings = await window.electron.getOutlineSettings();
        if (outlineSettings && outlineSettings.showOnStart) {
          setIsOutlineOpen(true);
        }
      }
    };
    loadInitialSettings();
  }, []);

  const theme = useMemo(() => {
    const [variant, mode] = themeMode.split('-');

    const blueprintDark = {
      primary: { main: '#90caf9' },
      background: { default: '#30404d', paper: '#293742' },
      appBar: { background: '#293742' },
      topbar: { background: '#2d2d2d' },
      sidebar: {
        background: '#30404d',
        hover: 'rgba(115, 134, 148, 0.3)',
        header: '#2d2d2d',
        indicator: 'rgba(255, 255, 255, 0.3)',
        pageIndicator: 'rgba(255, 255, 255, 0.15)',
      },
      dock: {
        background: '#202b33',
        topbar: '#293742',
        topbarLower: '#202b33',
        border: 'rgba(255, 255, 255, 0.15)',
      },
      explorer: {
        background: '#30404d',
        topbarUpper: 'rgba(255, 255, 255, 0.15)',
        topbarLower: 'rgba(0, 0, 0, 0.2)',
      },
      projectOutline: {
        background: '#30404d',
        border: 'rgba(255, 255, 255, 0.12)',
        topbarUpper: 'rgba(255, 255, 255, 0.15)',
        topbarLower: 'rgba(0, 0, 0, 0.2)',
        highlight: '#3d5875',
        emptyText: '#a7b6c2',
      },
      card: {
        background: '#293742',
        text: '#f5f8fa',
      },
      text: { primary: '#f5f8fa', secondary: '#a7b6c2' },
    };

    const blueprintLight = {
      primary: { main: '#1976d2' },
      background: { default: '#f4f6f8', paper: '#ffffff' },
      appBar: { background: '#ffffff' },
      topbar: { background: '#ebebeb' },
      sidebar: {
        background: '#ebebeb',
        hover: 'rgba(167, 182, 194, 0.3)',
        header: '#ebebeb',
        indicator: 'rgba(0, 0, 0, 0.2)',
        pageIndicator: 'rgba(0, 0, 0, 0.1)',
      },
      dock: {
        background: '#eef1f4',
        topbar: '#ffffff',
        topbarLower: '#f5f8fa',
        border: '#d8e1e8',
      },
      explorer: {
        background: '#f5f8fa',
        topbarUpper: 'transparent',
        topbarLower: 'transparent',
      },
      projectOutline: {
        background: '#f5f8fa',
        border: 'rgba(0, 0, 0, 0.12)',
        topbarUpper: 'transparent',
        topbarLower: 'transparent',
        highlight: '#dbeeff',
        emptyText: '#8a9ba8',
      },
      card: {
        background: '#ffffff',
        text: '#182026',
      },
      text: { primary: '#182026', secondary: '#5c7080' },
    };

    const muiDark = {
      primary: { main: '#90caf9' },
      background: { default: '#121212', paper: '#1e1e1e' },
      appBar: { background: '#1e1e1e' },
      topbar: { background: '#2d2d2d' },
      sidebar: {
        background: '#1e1e1e',
        hover: 'rgba(255, 255, 255, 0.08)',
        header: '#2d2d2d',
        indicator: 'rgba(255, 255, 255, 0.3)',
        pageIndicator: 'rgba(255, 255, 255, 0.15)',
      },
      dock: {
        background: '#121212',
        topbar: '#1e1e1e',
        topbarLower: '#121212',
        border: 'rgba(255, 255, 255, 0.12)',
      },
      explorer: {
        background: '#1e1e1e',
        topbarUpper: 'rgba(255, 255, 255, 0.15)',
        topbarLower: 'rgba(0, 0, 0, 0.2)',
      },
      projectOutline: {
        background: '#1e1e1e',
        border: 'rgba(255, 255, 255, 0.12)',
        topbarUpper: 'rgba(255, 255, 255, 0.15)',
        topbarLower: 'rgba(0, 0, 0, 0.2)',
        highlight: 'rgba(255, 255, 255, 0.12)',
        emptyText: '#b0b0b0',
      },
      card: {
        background: '#1e1e1e',
        text: '#ffffff',
      },
      text: { primary: '#ffffff', secondary: '#b0b0b0' },
    };

    const muiLight = {
      primary: { main: '#1976d2' },
      background: { default: '#f4f6f8', paper: '#ffffff' },
      appBar: { background: '#ffffff' },
      topbar: { background: '#ebebeb' },
      sidebar: {
        background: '#ffffff',
        hover: 'rgba(0, 0, 0, 0.04)',
        header: '#ebebeb',
        indicator: 'rgba(0, 0, 0, 0.2)',
        pageIndicator: 'rgba(0, 0, 0, 0.1)',
      },
      dock: {
        background: '#f4f6f8',
        topbar: '#ffffff',
        topbarLower: '#f5f8fa',
        border: 'rgba(0, 0, 0, 0.12)',
      },
      explorer: {
        background: '#ffffff',
        topbarUpper: 'transparent',
        topbarLower: 'transparent',
      },
      projectOutline: {
        background: '#ffffff',
        border: 'rgba(0, 0, 0, 0.12)',
        topbarUpper: 'transparent',
        topbarLower: 'transparent',
        highlight: 'rgba(0, 0, 0, 0.08)',
        emptyText: '#8a9ba8',
      },
      card: {
        background: '#ffffff',
        text: '#000000',
      },
      text: { primary: '#000000', secondary: '#424242' },
    };

    const getThemePalette = (variant, mode) => {
      if (variant === 'mui') {
        return {
          mode,
          ...(mode === 'dark' ? muiDark : muiLight),
        };
      }
      // Default to blueprint
      return {
        mode,
        ...(mode === 'dark' ? blueprintDark : blueprintLight),
      };
    };

    const palette = getThemePalette(variant, mode);

    return createTheme({
      palette: palette,
      components: {
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: palette.background.paper,
              color: palette.text.primary,
            },
          },
        },
        MuiListItemIcon: {
          styleOverrides: {
            root: {
              color: 'inherit',
            },
          },
        },
      },
    });
  }, [themeMode]);

  const handleHamburgerClick = () => {
    if (isExplorerOpen) {
      setIsExplorerOpen(false);
      return;
    }
    if (lastOpenBar === 'explorer') {
      setIsExplorerOpen(true);
    }
  };

  const handleExplorerToggle = (item) => {
    if (item.path) {
      navigate(item.path);
    }
    if (item.text === t('Explorer')) {
      const newOpenState = !isExplorerOpen;
      setIsExplorerOpen(newOpenState);
      if (newOpenState) {
        setLastOpenBar('explorer');
      }
    }
  };

  const handleOutlineToggle = () => {
    setIsOutlineOpen(!isOutlineOpen);
  };

  const handleAboutClick = () => {
    if (window.electron) {
      window.electron.openAboutWindow({
        theme: themeMode,
        uiScale: uiScale,
      });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles
        styles={{
          ':root': {
            '--sidebar-background': theme.palette.sidebar.background,
            '--sidebar-hover': theme.palette.sidebar.hover,
            '--sidebar-header': theme.palette.sidebar.header,
            '--sidebar-indicator': theme.palette.sidebar.indicator,
            '--sidebar-page-indicator': theme.palette.sidebar.pageIndicator,
            '--topbar-background': theme.palette.topbar.background,
            '--dock-background': theme.palette.dock.background,
            '--dock-topbar': theme.palette.dock.topbar,
            '--dock-topbar-lower': theme.palette.dock.topbarLower,
            '--dock-border': theme.palette.dock.border,
            '--explorer-background': theme.palette.explorer.background,
            '--explorer-topbar-upper': theme.palette.explorer.topbarUpper,
            '--explorer-topbar-lower': theme.palette.explorer.topbarLower,
            '--project-outline-background':
              theme.palette.projectOutline.background,
            '--project-outline-border': theme.palette.projectOutline.border,
            '--project-outline-topbar-upper':
              theme.palette.projectOutline.topbarUpper,
            '--project-outline-topbar-lower':
              theme.palette.projectOutline.topbarLower,
            '--project-outline-highlight':
              theme.palette.projectOutline.highlight,
            '--project-outline-empty-text':
              theme.palette.projectOutline.emptyText,
            '--card-background': theme.palette.card.background,
            '--card-text': theme.palette.card.text,
            '--text-primary': theme.palette.text.primary,
            '--text-secondary': theme.palette.text.secondary,
          },
          '*::-webkit-scrollbar': {
            width: '12px',
          },
          '*::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'dark' ? '#2e2e2e' : '#f1f1f1',
          },
          '*::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' ? '#555' : '#888',
            borderRadius: '6px',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.mode === 'dark' ? '#666' : '#555',
          },
        }}
      />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: theme.palette.background.default,
        }}
        className={`${themeMode === 'dark' ? Classes.DARK : 'bp6-light'} ${isHardwareAccelerationEnabled ? 'hw-acceleration-enabled' : ''}`}
      >
        <CssBaseline />
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            overflow: 'hidden',
            transform: 'translateZ(0)',
          }}
        >
          <ProjectProvider>
            <Box
              sx={{
                display: 'flex',
                transform: `scale(${uiScale})`,
                transformOrigin: 'top left',
                width: `${100 / uiScale}%`,
                height: `${100 / uiScale}%`,
              }}
            >
              <Sidebar
                handleHamburgerClick={handleHamburgerClick}
                handleExplorerToggle={handleExplorerToggle}
                handleOutlineToggle={handleOutlineToggle}
                handleAboutClick={handleAboutClick}
                uiScale={uiScale}
                isExplorerOpen={isExplorerOpen}
                isOutlineOpen={isOutlineOpen}
              />
              <Explorer
                open={isExplorerOpen}
                setOpen={setIsExplorerOpen}
                workspacePath={workspacePath}
                setWorkspacePath={setWorkspacePath}
                uiScale={uiScale}
                isInitialLoad={isInitialLoad}
                onOpenFile={() => {
                  /* Placeholder for future use */
                }}
                theme={theme}
              />
              <ProjectOutline open={isOutlineOpen} onClose={handleOutlineToggle} uiScale={uiScale} />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  minWidth: 0,
                }}
              >
                <Dock
                  uiScale={uiScale}
                  themeMode={themeMode}
                  setThemeMode={setThemeMode}
                  isHardwareAccelerationEnabled={isHardwareAccelerationEnabled}
                  setIsHardwareAccelerationEnabled={
                    setIsHardwareAccelerationEnabled
                  }
                  setUiScale={setUiScale}
                />
              </Box>
            </Box>
          </ProjectProvider>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
export default App;
