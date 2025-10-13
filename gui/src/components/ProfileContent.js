import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Popover from '@mui/material/Popover';
import { Icon } from '@blueprintjs/core';
import { useLanguage } from '../contexts/LanguageContext';

const iconNames = [
  'user', 'person', 'shield', 'new-person', 'endorsed', 'id-number',
  'code', 'cog', 'comparison',
];

const ProfileContent = () => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

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

  const handleIconClick = (event) => {
    if (isEditMode) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleIconClose = () => {
    setAnchorEl(null);
  };

  const handleIconSelect = (iconName) => {
    setEditData({ ...editData, profileIcon: iconName });
    handleIconClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'icon-popover' : undefined;

  if (!profile) {
    return <Typography>{t('Loading profile...')}</Typography>;
  }

  const profileIconName = isEditMode ? editData.profileIcon : profile.profileIcon;
  const dataToShow = isEditMode ? editData : profile;

  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: isEditMode ? 'rgba(0, 0, 0, 0.23)' : 'transparent',
      },
      '&:hover fieldset': {
        borderColor: isEditMode ? 'rgba(0, 0, 0, 0.87)' : 'transparent',
      },
      '&.Mui-focused fieldset': {
        borderColor: isEditMode ? 'primary.main' : 'transparent',
      },
    },
    // Ensure input text color is correct in dark mode
    '& .MuiInputBase-input.Mui-disabled': {
        '-webkit-text-fill-color': (theme) => theme.palette.text.primary,
      },
  };

  return (
    <Box sx={{ p: 2, width: 'clamp(350px, 40vw, 500px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, minHeight: '48px' }}>
        {isEditMode ? (
          <>
            <Button onClick={handleSave} sx={{ mr: 1 }}>{t('Save')}</Button>
            <Button onClick={handleCancel} color="secondary">{t('Cancel')}</Button>
          </>
        ) : (
          <IconButton onClick={handleEdit} className="profile-edit-button">
            <Icon icon="edit" />
          </IconButton>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <IconButton
          onClick={handleIconClick}
          sx={{
            width: '120px',
            height: '120px',
            cursor: isEditMode ? 'pointer' : 'default',
            p: 0,
          }}
        >
          <Icon icon={profileIconName} size={80} />
          {isEditMode && (
            <Box
              sx={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.4)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', opacity: 0, '&:hover': { opacity: 1 }
              }}
            >
              <Icon icon="edit" size={32} />
            </Box>
          )}
        </IconButton>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleIconClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Box sx={{ p: 1, width: '150px' }}>
            <Grid container spacing={1}>
              {iconNames.map((name) => (
                <Grid item xs={4} key={name}>
                  <IconButton sx={{ width: '100%', height: '100%' }} onClick={() => handleIconSelect(name)}>
                    <Icon icon={name} size={24} />
                  </IconButton>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Popover>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        disabled={!isEditMode}
        value={dataToShow.name}
        onChange={handleFieldChange('name')}
        sx={{ ...textFieldStyles, mb: 2 }}
        inputProps={{ style: { textAlign: 'center', fontSize: '1.5rem', padding: '6px 12px' } }}
      />

      <Grid container spacing={1.5}>
        {['id', 'email', 'department'].map((field) => (
          <Grid item container alignItems="center" xs={12} key={field}>
            <Grid item xs={4}>
              <Typography variant="body2" align="left">
                {t(field.charAt(0).toUpperCase() + field.slice(1))}:
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <TextField
                fullWidth
                variant="outlined"
                disabled={!isEditMode}
                value={dataToShow[field]}
                onChange={handleFieldChange(field)}
                sx={textFieldStyles}
                inputProps={{style: {padding: '6px 12px'}}}
              />
            </Grid>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProfileContent;
