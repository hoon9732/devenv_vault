import React from 'react';
import PropTypes from 'prop-types';
import Menu from '@mui/material/Menu';

const ScaledMenu = ({ uiScale, children, ...props }) => {
  return (
    <Menu
      {...props}
      className="scaled-menu"
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { uiScale })
      )}
    </Menu>
  );
};

ScaledMenu.propTypes = {
  uiScale: PropTypes.number.isRequired,
  children: PropTypes.node.isRequired,
};

export default ScaledMenu;
