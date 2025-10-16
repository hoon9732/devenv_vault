import React from 'react';
import PropTypes from 'prop-types';
import Menu from '@mui/material/Menu';

const ScaledMenu = ({ uiScale, dense, ...props }) => {
  return (
    <Menu
      {...props}
      dense={dense}
      PaperProps={{
        sx: {
          transform: `scale(${uiScale})`,
          transformOrigin: 'top left',
        },
      }}
    />
  );
};

ScaledMenu.propTypes = {
  uiScale: PropTypes.number.isRequired,
  dense: PropTypes.bool,
};

export default ScaledMenu;
