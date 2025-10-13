import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { useLanguage } from '../contexts/LanguageContext';

const FileViewerScreen = ({ fileContent }) => {
  const { t } = useLanguage();
  let contentToShow = fileContent;
  try {
    const parsedJson = JSON.parse(fileContent);
    contentToShow = JSON.stringify(parsedJson, null, 2);
  } catch (error) {
    // If it's not a valid JSON string, just display the content as is.
    console.error('Could not parse file content as JSON.', error);
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        {t('File Content')}
      </Typography>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          maxHeight: '70vh',
          overflow: 'auto',
          backgroundColor: '#2f2f2f',
          color: '#f1f1f1',
        }}
      >
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          <code>{contentToShow}</code>
        </pre>
      </Paper>
    </div>
  );
};

FileViewerScreen.propTypes = {
  fileContent: PropTypes.string.isRequired,
};

export default FileViewerScreen;
