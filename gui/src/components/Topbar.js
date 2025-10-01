import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Divider from '@mui/material/Divider';

const drawerWidth = 240;

const Topbar = ({ handleDrawerToggle, open, ...props }) => {
  return (
    <AppBar position="absolute" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} {...props}>
      <Toolbar sx={{ position: 'relative' }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, ml: '-15px' }}
        >
          <MenuIcon />
        </IconButton>
        
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            position: 'absolute',
            left: open ? `${drawerWidth}px` : (theme) => `calc(${theme.spacing(7)} + 1px)`,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            transition: (theme) => theme.transitions.create('left', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        />

        <Typography variant="h6" noWrap component="div" sx={{ pl: 2 }}>
          ICD Viewer
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
