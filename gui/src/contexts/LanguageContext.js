import React, { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { translations } from '../services/i18n';
import { getSettings } from '../utils/settingsManager';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setLanguage(settings.language);
    };
    loadSettings();
  }, []);

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useLanguage = () => useContext(LanguageContext);
