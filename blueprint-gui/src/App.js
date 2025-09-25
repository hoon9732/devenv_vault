import React, { useState, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import HomeScreen from './pages/HomeScreen';
import SearchScreen from './pages/SearchScreen';
import HelpScreen from './pages/HelpScreen';
import FileViewerScreen from './pages/FileViewerScreen';
import SettingsScreen from './pages/SettingsScreen';

function App() {
  const [open, setOpen] = useState(true);
  const [fileContent, setFileContent] = useState('');
  const [themeMode, setThemeMode] = useState('dark');
  const navigate = useNavigate();

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

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <Topbar handleDrawerToggle={handleDrawerToggle} />
        <Sidebar open={open} handleFileOpen={handleFileOpen} />
        <Box
          component="main"
          sx={{ flexGrow: 1, p: 3, ml: open ? `240px` : 0, transition: 'margin-left 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms' }}
        >
          <Toolbar />
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/help" element={<HelpScreen />} />
            <Route path="/file-viewer" element={<FileViewerScreen fileContent={fileContent} />} />
            <Route path="/settings" element={<SettingsScreen themeMode={themeMode} setThemeMode={setThemeMode} />} />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;