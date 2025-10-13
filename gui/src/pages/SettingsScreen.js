import React from 'react';
import { Card, H4, H5, Text, HTMLSelect, Switch } from '@blueprintjs/core';
import { useLanguage } from '../contexts/LanguageContext';

const SettingsScreen = ({ 
  themeMode, 
  setThemeMode, 
  uiScale, 
  setUiScale,
  isHardwareAccelerationEnabled,
  setIsHardwareAccelerationEnabled
}) => {
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

  const handleHardwareAccelerationChange = () => {
    setIsHardwareAccelerationEnabled(!isHardwareAccelerationEnabled);
  };

  const displayedScale = Math.round(uiScale * 100);
  const scaleOptions = [70, 80, 90, 100, 110, 120, 130, 140, 150];

  return (
    <div style={{ width: '100%', maxWidth: 800 }}>
      <H4 style={{ marginBottom: '20px' }}>{t('Settings')}</H4>

      <Card elevation={2} style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <H5>{t('UI Scale')}</H5>
          <Text muted>{t('Adjust the overall interface scale.')}</Text>
        </div>
        <HTMLSelect
          style={{ minWidth: '150px' }}
          value={displayedScale}
          onChange={handleScaleChange}
          options={scaleOptions.map(o => ({ label: `${o}%`, value: o }))}
        />
      </Card>
	  
      <Card elevation={2} style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <H5>{t('Theme')}</H5>
          <Text muted>{t('Select your preferred color mode.')}</Text>
        </div>
        <HTMLSelect
          style={{ minWidth: '150px' }}
          value={themeMode}
          onChange={handleThemeChange}
          options={[
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]}
        />
      </Card>

      <Card elevation={2} style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <H5>{t('Language')}</H5>
          <Text muted>{t('Choose the application language.')}</Text>
        </div>
        <HTMLSelect
          style={{ minWidth: '150px' }}
          value={language}
          onChange={handleLanguageChange}
          options={[
            { label: 'English', value: 'en' },
            { label: 'Korean', value: 'ko' },
          ]}
        />
      </Card>

      <Card elevation={2} style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <H5>{t('Hardware Acceleration')}</H5>
          <Text muted>{t('Enable hardware acceleration for smoother animations. May increase resource usage.')}</Text>
        </div>
        <Switch
          checked={isHardwareAccelerationEnabled}
          onChange={handleHardwareAccelerationChange}
          large
        />
      </Card>
    </div>
  );
};

export default SettingsScreen;
