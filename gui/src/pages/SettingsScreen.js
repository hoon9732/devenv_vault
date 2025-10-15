import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  H5,
  Text,
  HTMLSelect,
  Switch,
  Button,
} from '@blueprintjs/core';
import { useLanguage } from '../contexts/LanguageContext';

const SettingsScreen = ({
  themeMode,
  setThemeMode,
  uiScale,
  setUiScale,
  isHardwareAccelerationEnabled,
  setIsHardwareAccelerationEnabled,
}) => {
  const { language, setLanguage, t } = useLanguage();

  const handleReset = () => {
    // Default values from settings.json and application defaults
    setThemeMode('light');
    setUiScale(0.8); // This is the '1.0x (Default)'
    setLanguage('en');
    setIsHardwareAccelerationEnabled(true);
  };

  const handleThemeChange = (event) => {
    setThemeMode(event.target.value);
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleScaleChange = (event) => {
    const newScale = parseFloat(event.target.value);
    setUiScale(newScale);
  };

  const handleHardwareAccelerationChange = () => {
    setIsHardwareAccelerationEnabled(!isHardwareAccelerationEnabled);
  };

  const scaleMappings = [
    { label: '0.75x', value: 0.6 },
    { label: '1.0x (Default)', value: 0.8 },
    { label: '1.25x', value: 1.0 },
    { label: '1.5x', value: 1.2 },
  ];

  return (
    <div style={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '20px',
        }}
      >
        <Button intent="primary" text={t('Reset to Default')} onClick={handleReset} />
      </div>
      <Card
        elevation={2}
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <H5>{t('UI Scale')}</H5>
          <Text muted>{t('Adjust the overall interface scale.')}</Text>
        </div>
        <HTMLSelect
          style={{ minWidth: '150px' }}
          value={uiScale}
          onChange={handleScaleChange}
          options={scaleMappings}
        />
      </Card>

      <Card
        elevation={2}
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
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

      <Card
        elevation={2}
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
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

      <Card
        elevation={2}
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <H5>{t('Hardware Acceleration')}</H5>
          <Text muted>
            {t(
              'Enable hardware acceleration for smoother animations. May increase resource usage.',
            )}
          </Text>
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

SettingsScreen.propTypes = {
  themeMode: PropTypes.string.isRequired,
  setThemeMode: PropTypes.func.isRequired,
  uiScale: PropTypes.number.isRequired,
  setUiScale: PropTypes.func.isRequired,
  isHardwareAccelerationEnabled: PropTypes.bool.isRequired,
  setIsHardwareAccelerationEnabled: PropTypes.func.isRequired,
};

export default SettingsScreen;
