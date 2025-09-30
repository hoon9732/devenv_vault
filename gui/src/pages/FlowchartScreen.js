import React from 'react';
import Typography from '@mui/material/Typography';
import { useLanguage } from '../contexts/LanguageContext';

const FlowchartScreen = () => {
  const { t } = useLanguage();
  return <Typography variant="h4">{t('Flowchart')}</Typography>;
};

export default FlowchartScreen;
