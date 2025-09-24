import React, { useState } from 'react';
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

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f4f6f8',
    },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1f2a38',
          color: '#ffffff',
        },
      },
    },
    MuiListItemIcon: {
        styleOverrides: {
            root: {
                color: '#ffffff',
            }
        }
    }
  },
});

function App() {
  const [open, setOpen] = useState(true);
  const [fileContent, setFileContent] = useState('');
  const navigate = useNavigate();

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
      // Fallback for web browser testing
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
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
