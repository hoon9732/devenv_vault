import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import Grid from '@mui/material/Grid';
import Popover from '@mui/material/Popover';
import AccountCircle from '@mui/icons-material/AccountCircle';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import Code from '@mui/icons-material/Code';
import Face from '@mui/icons-material/Face';
import Favorite from '@mui/icons-material/Favorite';
import Fingerprint from '@mui/icons-material/Fingerprint';
import Home from '@mui/icons-material/Home';
import Pets from '@mui/icons-material/Pets';
import Star from '@mui/icons-material/Star';
import { useLanguage } from '../contexts/LanguageContext';

const icons = {
  AccountCircle: AccountCircle,
  AdminPanelSettings: AdminPanelSettings,
  Code: Code,
  Face: Face,
  Favorite: Favorite,
  Fingerprint: Fingerprint,
  Home: Home,
  Pets: Pets,
  Star: Star,
};

const iconNames = Object.keys(icons);

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

  const ProfileIcon = icons[isEditMode ? editData.profileIcon : profile.profileIcon];
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
    <Box sx={{ p: 2, width: 'clamp(450px, 50vw, 600px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, minHeight: '48px' }}>
        {isEditMode ? (
          <>
            <Button onClick={handleSave} sx={{ mr: 1 }}>{t('Save')}</Button>
            <Button onClick={handleCancel} color="secondary">{t('Cancel')}</Button>
          </>
        ) : (
          <IconButton onClick={handleEdit}>
            <EditIcon />
          </IconButton>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <IconButton
          onClick={handleIconClick}
          sx={{
            width: 'clamp(120px, 30vh, 180px)',
            height: 'clamp(120px, 30vh, 180px)',
            cursor: isEditMode ? 'pointer' : 'default'
          }}
        >
          <ProfileIcon sx={{ width: '100%', height: '100%' }} />
          {isEditMode && (
            <Box
              sx={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.4)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', opacity: 0, '&:hover': { opacity: 1 }
              }}
            >
              <EditIcon />
            </Box>
          )}
        </IconButton>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleIconClose}
          anchorOrigin={{ vertical: 'center', horizontal: 'left' }}
          transformOrigin={{ vertical: 'center', horizontal: 'right' }}
        >
          <Box sx={{ p: 1, maxWidth: '150px' }}>
            <Grid container spacing={1}>
              {iconNames.map((name) => (
                <Grid item xs={4} key={name}>
                  <IconButton onClick={() => handleIconSelect(name)}>
                    {React.createElement(icons[name])}
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
        inputProps={{ style: { textAlign: 'center', fontSize: '2.125rem', padding: '8.5px 14px' } }}
      />

      <Grid container spacing={2} justifyContent="center">
        {['id', 'email', 'department'].map((field) => (
          <Grid item container alignItems="center" xs={12} sm={10} md={8} key={field}>
            <Grid item xs={4}>
              <Typography variant="subtitle1" align="left" sx={{ fontWeight: 'bold' }}>
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
                inputProps={{style: {padding: '8.5px 14px'}}}
              />
            </Grid>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProfileContent;
