import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import './PageTopbar.css';

const PageTopbar = ({ page }) => {
  const renderTopbarContent = () => {
    switch (page) {
      case 'home':
        return <div>Home Topbar</div>;
      case 'search':
        return <div>Search Topbar</div>;
      case 'graphs':
        return <div>Graphs Topbar</div>;
      case 'docs':
        return <div>Docs Topbar</div>;
      case 'sheet':
        return <div>Sheet Topbar</div>;
      case 'settings':
        return <div>Settings Topbar</div>;
      case 'profile':
        return <div>Profile Topbar</div>;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ backgroundColor: 'topbar.background' }}>
      <Toolbar
        sx={{ minHeight: '64px !important', height: '64px', p: '0 16px !important' }}
      >
        {renderTopbarContent()}
      </Toolbar>
    </Box>
  );
};

PageTopbar.propTypes = {
  page: PropTypes.string.isRequired,
};

export default PageTopbar;
