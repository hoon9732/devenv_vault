import React from 'react';
import './PageTopbar.css';

const PageTopbar = ({ page, theme }) => {
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
      default:
        return null;
    }
  };

  return (
    <div 
      className="page-topbar" 
      style={{ 
        backgroundColor: theme.palette.topbar.background,
        borderBottomColor: theme.palette.divider
      }}
    >
      {renderTopbarContent()}
    </div>
  );
};

export default PageTopbar;
