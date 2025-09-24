import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const HelpScreen = () => {
  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      {/* Placeholder for logo */}
      <img src="logo.png" alt="logo" style={{ width: 150, height: 150, marginBottom: 20 }} />
      <Typography variant="h5">ICD Viewer</Typography>
      <Typography variant="body1">Created by: Your Name</Typography>
      <Typography variant="body2" color="text.secondary">
        Copyright © {new Date().getFullYear()}, Apache License 2.0
      </Typography>
    </Box>
  );
};

export default HelpScreen;
