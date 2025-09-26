import React from 'react';
import Typography from '@mui/material/Typography';
import { useLanguage } from '../contexts/LanguageContext';

const SheetScreen = () => {
  const { t } = useLanguage();
  return <Typography variant="h4">{t('Sheet')}</Typography>;
};

export default SheetScreen;
