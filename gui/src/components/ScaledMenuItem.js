import React from 'react';
import PropTypes from 'prop-types';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';

const baseSize = 0.875; // Equivalent to 14px if root is 16px

const StyledMenuItem = styled(MenuItem, {
  shouldForwardProp: (prop) => prop !== 'uiScale',
})(({ uiScale }) => ({
  fontSize: `${uiScale * baseSize}rem`,
  paddingTop: `${uiScale * baseSize * 0.5}rem`,
  paddingBottom: `${uiScale * baseSize * 0.5}rem`,
  '& .MuiListItemIcon-root': {
    minWidth: 'auto',
    marginRight: `${uiScale * baseSize}rem`, // Spacing between icon and text
  },
}));

const ScaledMenuItem = ({ uiScale, children, ...props }) => {
  return (
    <StyledMenuItem uiScale={uiScale} {...props}>
      {children}
    </StyledMenuItem>
  );
};

ScaledMenuItem.propTypes = {
  uiScale: PropTypes.number.isRequired,
  children: PropTypes.node.isRequired,
};

export default ScaledMenuItem;
