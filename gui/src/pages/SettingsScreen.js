import React from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import { useLanguage } from '../contexts/LanguageContext';

const SettingsScreen = ({ themeMode, setThemeMode, uiScale, setUiScale }) => {
  const { language, setLanguage, t } = useLanguage();

  const handleThemeChange = (event) => {
    setThemeMode(event.target.value);
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleScaleChange = (event) => {
    const displayedValue = event.target.value;
    const internalScale = displayedValue / 100;
    setUiScale(internalScale);
  };

  const displayedScale = Math.round(uiScale * 100);
  const scaleOptions = [70, 80, 90, 100, 110, 120, 130, 140, 150];

  const menuProps = {
    transitionDuration: 0,
    PaperProps: {
      style: {
        transform: `scale(${uiScale})`,
        transformOrigin: 'top left',
        borderRadius: 0,
      },
    },
    MenuListProps: {
      sx: {
        py: 0,
      },
    },
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800 }}>
      <Typography variant="h4" gutterBottom>{t('Settings')}</Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ mr: 2 }}>
          <Typography variant="h6">{t('UI Scale')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('Adjust the overall UI scale.')}
          </Typography>
        </Box>
        <FormControl sx={{ width: 240 }}>
          <InputLabel id="scale-select-label">{t('Scale')}</InputLabel>
          <Select
            labelId="scale-select-label"
            id="scale-select"
            value={displayedScale}
            label={t('Scale')}
            onChange={handleScaleChange}
            MenuProps={menuProps}
          >
            {scaleOptions.map(option => (
              <MenuItem key={option} value={option}>{option}%</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
	  
	  <Divider sx={{ my: 2 }} />
	  
      <Paper elevation={3} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ mr: 2 }}>
          <Typography variant="h6">{t('Theme')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('Select your preferred color mode.')}
          </Typography>
        </Box>
        <FormControl sx={{ width: 240 }}>
          <InputLabel id="theme-select-label">{t('Theme')}</InputLabel>
          <Select
            labelId="theme-select-label"
            id="theme-select"
            value={themeMode}
            label={t('Theme')}
            onChange={handleThemeChange}
            MenuProps={menuProps}
          >
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <Divider sx={{ my: 2 }} />

      <Paper elevation={3} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ mr: 2 }}>
          <Typography variant="h6">{t('Language')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('Choose the application language.')}
          </Typography>
        </Box>
        <FormControl sx={{ width: 240 }}>
          <InputLabel id="language-select-label">{t('Language')}</InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={language}
            label={t('Language')}
            onChange={handleLanguageChange}
            MenuProps={menuProps}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="ko">Korean</MenuItem>
          </Select>
        </FormControl>
      </Paper>
    </Box>
  );
};

export default SettingsScreen;