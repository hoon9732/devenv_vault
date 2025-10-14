import React from 'react';
import Page from '../components/Page';
import ProfileContent from '../components/ProfileContent';

const ProfileScreen = () => {
  return (
    <Page icon="user" title="Profile">
      <ProfileContent />
    </Page>
  );
};

export default ProfileScreen;
