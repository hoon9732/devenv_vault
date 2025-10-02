import React from 'react';
import Typography from '@mui/material/Typography';
import { useLanguage } from '../contexts/LanguageContext';

const GraphsScreen = () => {
  const { t } = useLanguage();
  return <Typography variant="h4">{t('Graphs')}</Typography>;
};

export default GraphsScreen;
