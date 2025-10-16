import React from 'react';
import PropTypes from 'prop-types';
import ProfileContent from '../components/ProfileContent';

const ProfileScreen = ({ uiScale }) => {
  return <ProfileContent uiScale={uiScale} />;
};

ProfileScreen.propTypes = {
  uiScale: PropTypes.number.isRequired,
};

export default ProfileScreen;
