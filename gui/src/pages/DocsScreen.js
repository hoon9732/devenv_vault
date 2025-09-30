import React from 'react';
import Typography from '@mui/material/Typography';
import { useLanguage } from '../contexts/LanguageContext';

const DocsScreen = () => {
  const { t } = useLanguage();
  return <Typography variant="h4">{t('Docs')}</Typography>;
};

export default DocsScreen;
