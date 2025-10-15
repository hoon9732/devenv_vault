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
  const [themeMode, setThemeMode] = useState('dark');
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
      setThemeMode(settings.theme);
      setUiScale(settings.scale);
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

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          ...(themeMode === 'dark'
            ? {
                primary: { main: '#90caf9' },
                appBar: { background: '#293742' },
                topbar: { background: '#2d2d2d' },
              }
            : {
                primary: { main: '#1976d2' },
                background: { default: '#f4f6f8', paper: '#ffffff' },
                appBar: { background: '#ffffff' },
                topbar: { background: '#ebebeb' },
                text: { primary: '#182026' },
              }),
        },
        components: {
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: themeMode === 'dark' ? '#1e1e1e' : '#ffffff',
                color: themeMode === 'dark' ? '#ffffff' : '#000000',
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
      }),
    [themeMode],
  );

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
              <ProjectOutline open={isOutlineOpen} onClose={handleOutlineToggle} />
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
