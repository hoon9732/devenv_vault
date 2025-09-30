import React from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
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
    // Convert the displayed percentage (where 100 means 1 scale) to the internal scale value
    const internalScale = displayedValue / 100;
    setUiScale(internalScale);
  };

  // Convert the internal scale to the displayed percentage
  const displayedScale = Math.round(uiScale * 100);
  const scaleOptions = [70, 80, 90, 100, 110, 120, 130, 140, 150];

  return (
    <div>
      <Typography variant="h4" gutterBottom>{t('Settings')}</Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">{t('UI Scale')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('Adjust the overall size of the application interface.')}
        </Typography>
        <FormControl sx={{ maxWidth: 240 }}>
          <InputLabel id="scale-select-label">{t('Scale')}</InputLabel>
          <Select
            labelId="scale-select-label"
            id="scale-select"
            value={displayedScale}
            label={t('Scale')}
            onChange={handleScaleChange}
          >
            {scaleOptions.map(option => (
              <MenuItem key={option} value={option}>{option}%</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
	  
	  <Divider sx={{ my: 3 }} />
	  
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">{t('Theme')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('Select your preferred color mode.')}
        </Typography>
        <FormControl sx={{ maxWidth: 240 }}>
          <InputLabel id="theme-select-label">{t('Theme')}</InputLabel>
          <Select
            labelId="theme-select-label"
            id="theme-select"
            value={themeMode}
            label={t('Theme')}
            onChange={handleThemeChange}
          >
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">{t('Language')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('Choose the application language.')}
        </Typography>
        <FormControl sx={{ maxWidth: 240 }}>
          <InputLabel id="language-select-label">{t('Language')}</InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={language}
            label={t('Language')}
            onChange={handleLanguageChange}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="ko">Korean</MenuItem>
          </Select>
        </FormControl>
      </Paper>
    </div>
  );
};

export default SettingsScreen;
