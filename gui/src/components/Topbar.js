import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';

const Topbar = ({ handleDrawerToggle, open, ...props }) => {
  const iconAreaWidth = (theme) => theme.spacing(7);

  return (
    <AppBar
      position="absolute"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: (theme) => theme.palette.appBar.background,
      }}
      {...props}
    >
      <Toolbar disableGutters>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: iconAreaWidth,
          alignSelf: 'stretch',
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#333333' : '#e0e0e0',
        }}>
          <IconButton
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            sx={{
              color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        <Divider orientation="vertical" flexItem />

        <Typography variant="h6" noWrap component="div" sx={{ pl: 2, color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}>
          ICD Viewer
        </Typography>
      </Toolbar>
      <Divider />
    </AppBar>
  );
};

export default Topbar;
