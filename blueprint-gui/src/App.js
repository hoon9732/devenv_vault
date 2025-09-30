import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import HomeScreen from './pages/HomeScreen';
import SearchScreen from './pages/SearchScreen';
import FileViewerScreen from './pages/FileViewerScreen';
import SettingsScreen from './pages/SettingsScreen';
import SheetScreen from './pages/SheetScreen';
import FlowchartScreen from './pages/FlowchartScreen';
import DocsScreen from './pages/DocsScreen';
import SecondarySidebar from './components/SecondarySidebar';
import { useLanguage } from './contexts/LanguageContext';
import AppModal from './components/AppModal';
import ProfileContent from './components/ProfileContent';

function App() {
  const [open, setOpen] = useState(true);
  const [isSecondaryOpen, setIsSecondaryOpen] = useState(false); // Independent state for secondary sidebar visibility
  const [workspacePath, setWorkspacePath] = useState(null); // Holds the path to the current workspace
  const [fileContent, setFileContent] = useState('');
  const [themeMode, setThemeMode] = useState('light');
  const [uiScale, setUiScale] = useState(0.8);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Fetch the workspace path when the app loads
  useEffect(() => {
    const loadWorkspace = async () => {
      if (window.electron) {
        const path = await window.electron.getWorkspacePath();
        const settings = await window.electron.getWorkspaceSettings();
        if (path) {
          setWorkspacePath(path);
          if (settings.showOnStart) {
            setIsSecondaryOpen(true); // Open sidebar only if the setting is true
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
                background: { default: '#121212', paper: '#1e1e1e' },
              }
            : {
                primary: { main: '#1976d2' },
                background: { default: '#f4f6f8', paper: '#ffffff' },
              }),
        },
        components: {
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: themeMode === 'dark' ? '#1e1e1e' : '#1f2a38',
                color: '#ffffff',
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

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleSecondaryToggle = (item) => {
    // If the item has a path, navigate to it.
    if (item.path) {
      navigate(item.path);
    }

    // Special logic for the Workspace button
    if (item.text === t('Workspace')) {
      setIsSecondaryOpen(!isSecondaryOpen);
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

  const handleHelpClick = () => {
    if (window.electron) {
      window.electron.openHelpWindow(themeMode);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}>
        <Box sx={{ 
          display: 'flex',
          transform: `scale(${uiScale})`,
          transformOrigin: 'top left',
          width: `${100 / uiScale}vw`,
          height: `${100 / uiScale}vh`,
        }}>
          <CssBaseline />
          <Topbar handleDrawerToggle={handleDrawerToggle} />
          <Sidebar open={open} handleFileOpen={handleFileOpen} handleSecondaryToggle={handleSecondaryToggle} handleModalOpen={handleModalOpen} handleHelpClick={handleHelpClick} />
          <Box
            sx={{
              display: 'flex',
              flexGrow: 1,
              transition: (theme) =>
                theme.transitions.create('margin-left', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
            }}
          >
            <SecondarySidebar 
              open={isSecondaryOpen} 
              setOpen={setIsSecondaryOpen}
              workspacePath={workspacePath}
              setWorkspacePath={setWorkspacePath}
              uiScale={uiScale}
            />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: 3,
              }}
            >
              <Toolbar />
              <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/search" element={<SearchScreen />} />
                <Route path="/file-viewer" element={<FileViewerScreen fileContent={fileContent} />} />
                <Route path="/settings" element={<SettingsScreen themeMode={themeMode} setThemeMode={setThemeMode} uiScale={uiScale} setUiScale={setUiScale} />} />
                <Route path="/sheet" element={<SheetScreen />} />
                <Route path="/flowchart" element={<FlowchartScreen />} />
                <Route path="/docs" element={<DocsScreen />} />
              </Routes>
            </Box>
          </Box>
        </Box>
      </Box>
      <AppModal open={isModalOpen} handleClose={() => setIsModalOpen(false)}>
        {modalContent}
      </AppModal>
    </ThemeProvider>
  );
}

export default App;