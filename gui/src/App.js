import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';

import TitleBar from './components/TitleBar';
import PageTopbar from './components/PageTopbar';
import Sidebar from './components/Sidebar';
import HomeScreen from './pages/HomeScreen';
import SearchScreen from './pages/SearchScreen';
import FileViewerScreen from './pages/FileViewerScreen';
import SettingsScreen from './pages/SettingsScreen';
import SheetScreen from './pages/SheetScreen';
import GraphsScreen from './pages/GraphsScreen';
import DocsScreen from './pages/DocsScreen';
import Explorer from './components/Explorer';
import { useLanguage } from './contexts/LanguageContext';
import ProfileContent from './components/ProfileContent';
import { getSettings, saveSettings } from './utils/settingsManager';
import { Dialog, Classes } from '@blueprintjs/core';

function App() {
  const [isExplorerOpen, setIsExplorerOpen] = useState(false); // Independent state for secondary sidebar visibility
  const [workspacePath, setWorkspacePath] = useState(null); // Holds the path to the current workspace
  const [fileContent, setFileContent] = useState('');
  const [themeMode, setThemeMode] = useState('dark');
  const [uiScale, setUiScale] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();

  const currentPage = location.pathname.substring(1) || 'home';

  useEffect(() => {
    setIsInitialLoad(false);
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setThemeMode(settings.theme);
      setUiScale(settings.scale);
      setIsLoading(false);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveSettings({ theme: themeMode, scale: uiScale, language });
      if (window.electron) {
        window.electron.updateTheme(themeMode);
      }
    }
  }, [themeMode, uiScale, language, isLoading]);

  useEffect(() => {
    if (!isLoading && window.electron) {
      const colors = themeMode === 'dark'
        ? { backgroundColor: '#293742', symbolColor: '#f5f8fa' } // Blueprint dark theme colors
        : { backgroundColor: '#ffffff', symbolColor: '#182026' }; // Blueprint light theme colors
      window.electron.updateTitleBarColors(colors);
    }
  }, [themeMode, isLoading]);

  // Fetch the workspace path when the app loads
  useEffect(() => {
    const loadWorkspace = async () => {
      if (window.electron) {
        const path = await window.electron.getWorkspacePath();
        const settings = await window.electron.getWorkspaceSettings();
        if (path) {
          setWorkspacePath(path);
          if (settings.showOnStart) {
            setIsExplorerOpen(true); // Open sidebar only if the setting is true
          }
        }
      }
    };
    loadWorkspace();
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

  const handleExplorerToggle = (item) => {
    // If the item has a path, navigate to it.
    if (item.path) {
      navigate(item.path);
    }

    // Special logic for the Workspace button
    if (item.text === t('Explorer')) {
      setIsExplorerOpen(!isExplorerOpen);
    }
  };

  const handleFileOpen = async () => {
    if (window.electron) {
      const content = await window.electron.openFileDialog();
      if (content) {
        setFileContent(content);
        navigate('/file-viewer');
      }
    } else {
      console.error("Electron context not available");
      setFileContent('This is a fallback content for browsers. File dialog is only available in Electron.');
      navigate('/file-viewer');
    }
  };

  const handleModalOpen = (content) => {
    if (content === 'Profile') {
      setModalContent(<ProfileContent />);
    }
    setIsModalOpen(true);
  };

  const handleAboutClick = () => {
    if (window.electron) {
      window.electron.openAboutWindow({
        theme: themeMode,
        uiScale: uiScale
      });
    }
  };

  const handleOpenFile = async (filePath) => {
    if (window.electron) {
      const result = await window.electron.readFileContent(filePath);
      if (result.success) {
        setFileContent(result.content);
        navigate('/file-viewer');
      } else {
        console.error("Failed to read file:", result.error);
        // Optionally, show an error to the user
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={{
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
      }} />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.default,
      }}>
        <TitleBar />
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <Box sx={{
            display: 'flex',
            transform: `scale(${uiScale})`,
            transformOrigin: 'top left',
            width: `${100 / uiScale}%`,
            height: `${100 / uiScale}%`,
          }} className={`${themeMode}-theme`}>
            <CssBaseline />
            <Sidebar handleFileOpen={handleFileOpen} handleExplorerToggle={handleExplorerToggle} handleModalOpen={handleModalOpen} handleAboutClick={handleAboutClick} uiScale={uiScale} />
              <Explorer 
                open={isExplorerOpen} 
                setOpen={setIsExplorerOpen}
                workspacePath={workspacePath}
                setWorkspacePath={setWorkspacePath}
                uiScale={uiScale}
                isInitialLoad={isInitialLoad}
                onOpenFile={handleOpenFile}
                theme={theme}
              />
              <Box sx={{
                display: 'flex', 
                flexDirection: 'column', 
                flexGrow: 1, 
                minWidth: 0,
              }}>
                <div>
                  <PageTopbar page={currentPage} theme={theme} />
                </div>
                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                  }}
                >
                  <Box sx={{ padding: (theme) => theme.spacing(3) }}>
                    <Routes>
                      <Route path="/" element={<HomeScreen />} />
                      <Route path="/search" element={<SearchScreen />} />
                      <Route path="/file-viewer" element={<FileViewerScreen fileContent={fileContent} />} />
                      <Route path="/settings" element={<SettingsScreen themeMode={themeMode} setThemeMode={setThemeMode} uiScale={uiScale} setUiScale={setUiScale} />} />
                      <Route path="/sheet" element={<SheetScreen />} />
                      <Route path="/graphs" element={<GraphsScreen />} />
                      <Route path="/docs" element={<DocsScreen />} />
                    </Routes>
                  </Box>
                </Box>
              </Box>
          </Box>
        </Box>
      </Box>
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('Profile')}
        className={themeMode === 'dark' ? Classes.DARK : ''}
      >
        <Box sx={{ p: 2 }}>
          {modalContent}
        </Box>
      </Dialog>
    </ThemeProvider>
  );
}
export default App;