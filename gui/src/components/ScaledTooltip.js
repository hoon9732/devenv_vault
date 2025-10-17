import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

const ScaledTooltip = ({ uiScale, ...props }) => {
  const StyledTooltip = styled(({ className, ...rest }) => (
    <Tooltip {...rest} classes={{ popper: className }} />
  ))(() => ({
    '& .MuiTooltip-tooltip': {
      fontSize: `${1 * uiScale}rem`,
    },
  }));

  return <StyledTooltip {...props} />;
};

ScaledTooltip.propTypes = {
  uiScale: PropTypes.number.isRequired,
};

export default ScaledTooltip;