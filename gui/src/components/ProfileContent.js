import React, { useState, useEffect } from 'react';
import { Button, Card, Elevation, H3, H5, InputGroup, Icon, Popover, Menu, MenuItem } from '@blueprintjs/core';
import { useLanguage } from '../contexts/LanguageContext';
import './ProfileContent.css';

const iconNames = [
  'user', 'person', 'shield', 'new-person', 'endorsed', 'id-number',
  'code', 'cog', 'comparison',
];

const ProfileContent = () => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (window.electron) {
        try {
          const profileData = await window.electron.readProfile();
          const parsedProfile = JSON.parse(profileData);
          setProfile(parsedProfile);
          setEditData(parsedProfile);
        } catch (error) {
          console.error("Failed to read or parse profile:", error);
        }
      }
    };
    fetchProfile();
  }, []);

  const handleEdit = () => {
    setEditData(profile);
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditData(profile);
  };

  const handleSave = async () => {
    if (window.electron) {
      try {
        await window.electron.writeProfile(JSON.stringify(editData, null, 2));
        setProfile(editData);
        setIsEditMode(false);
      } catch (error) {
        console.error("Failed to save profile:", error);
      }
    }
  };

  const handleFieldChange = (field) => (event) => {
    setEditData({ ...editData, [field]: event.target.value });
  };

  const handleIconSelect = (iconName) => {
    setEditData({ ...editData, profileIcon: iconName });
  };

  if (!profile) {
    return <div>{t('Loading profile...')}</div>;
  }

  const dataToShow = isEditMode ? editData : profile;

  const iconMenu = (
    <div className="icon-popover-content">
      <div className="icon-grid">
        {iconNames.map((name) => (
          <Button
            key={name}
            className="icon-grid-item"
            icon={<Icon icon={name} size={24} />}
            onClick={() => handleIconSelect(name)}
            minimal
          />
        ))}
      </div>
    </div>
  );

  return (
    <Card elevation={Elevation.TWO} className="profile-container">
      <div className="profile-top-actions">
        {isEditMode ? (
          <>
            <Button intent="primary" text={t('Save')} onClick={handleSave} style={{ marginRight: '8px' }} />
            <Button text={t('Cancel')} onClick={handleCancel} />
          </>
        ) : (
          <Button icon="edit" minimal large className="profile-edit-button" onClick={handleEdit} />
        )}
      </div>

      <div className="profile-icon-container">
        <Popover content={iconMenu} placement="right" disabled={!isEditMode}>
          <Button 
            className={`profile-icon-button ${isEditMode ? 'editable' : ''}`}
            large 
            minimal
          >
            <Icon icon={dataToShow.profileIcon} size={160} />
            {isEditMode && (
              <div className="profile-icon-overlay">
                <Icon icon="edit" size={64} color="white" />
              </div>
            )}
          </Button>
        </Popover>
      </div>

      <div className="profile-name-input-container">
        <InputGroup
          large
          disabled={!isEditMode}
          value={dataToShow.name}
          onChange={handleFieldChange('name')}
          className={`profile-name-input ${isEditMode ? 'editable' : ''}`}
        />
      </div>

      <div className="profile-details-grid">
        {['id', 'email', 'department'].map((field) => (
          <React.Fragment key={field}>
            <H5 className="profile-detail-label">{t(field.charAt(0).toUpperCase() + field.slice(1))}:</H5>
            <div className={`profile-detail-value ${isEditMode ? 'editable' : ''}`}>
              <InputGroup
                disabled={!isEditMode}
                value={dataToShow[field]}
                onChange={handleFieldChange(field)}
              />
            </div>
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
};

export default ProfileContent;