import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const HelpScreen = () => {
  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      {/* Placeholder for logo */}
      <img src="logo.png" alt="logo" style={{ width: 150, height: 150, marginBottom: 20 }} />
      <Typography variant="h5">ICD Viewer</Typography>
      <Typography variant="body1">Created by: Hanwha Aerospace</Typography>
      <Typography variant="body2" color="text.secondary">
        Copyright © {new Date().getFullYear()}, Apache License 2.0
		Licensed under the Apache License, Version 2.0 (the "License");
		you may not use this file except in compliance with the License.
		You may obtain a copy of the License at
		http://www.apache.org/licenses/LICENSE-2.0

		Unless required by applicable law or agreed to in writing, software
		distributed under the License is distributed on an "AS IS" BASIS,
		WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
		See the License for the specific language governing permissions and
		limitations under the License.
      </Typography>
    </Box>
  );
};

export default HelpScreen;
