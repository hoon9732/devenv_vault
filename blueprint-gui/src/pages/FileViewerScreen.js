import React from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

const FileViewerScreen = ({ fileContent }) => {
  return (
    <div>
      <Typography variant="h4" gutterBottom>JSON File Content</Typography>
      <Paper elevation={3} sx={{ p: 2, maxHeight: '70vh', overflow: 'auto' }}>
        <pre><code>{fileContent}</code></pre>
      </Paper>
    </div>
  );
};

export default FileViewerScreen;
