import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import TableViewIcon from '@mui/icons-material/TableView';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DescriptionIcon from '@mui/icons-material/Description';
import { useLanguage } from '../contexts/LanguageContext';

const drawerWidth = 240;
const collapsedWidth = 60;

const SecondarySidebar = ({ open, collapsed, content }) => {
  const { t } = useLanguage();

  const getItems = () => {
    // Use t('Home') to get the translated string for "Home"
    if (content === t('Home')) {
      return [
        { text: t('Sheet'), icon: <TableViewIcon /> },
        { text: t('Flowchart'), icon: <AccountTreeIcon /> },
        { text: t('Docs'), icon: <DescriptionIcon /> },
      ];
    }
    return [];
  };

  const items = getItems();
  const currentWidth = open ? (collapsed ? collapsedWidth : drawerWidth) : 0;

  return (
    <Box
      sx={{
        width: currentWidth,
        flexShrink: 0,
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#2c3e50' : '#ecf0f1',
        color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
        overflowX: 'hidden',
        transition: (theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'hidden' }}>
        <List>
          {items.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton sx={{ minHeight: 48, justifyContent: 'initial', px: 2.5 }}>
                <ListItemIcon sx={{ 
                  color: 'inherit', 
                  minWidth: 0, 
                  mr: 3,
                  justifyContent: 'center' 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: collapsed ? 0 : 1, whiteSpace: 'nowrap' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default SecondarySidebar;