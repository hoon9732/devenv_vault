import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import Grid from '@mui/material/Grid';
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
  AccountCircle: <AccountCircle />,
  AdminPanelSettings: <AdminPanelSettings />,
  Code: <Code />,
  Face: <Face />,
  Favorite: <Favorite />,
  Fingerprint: <Fingerprint />,
  Home: <Home />,
  Pets: <Pets />,
  Star: <Star />,
};

const ProfileContent = () => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showIconPalette, setShowIconPalette] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (window.electron) {
        const profileData = await window.electron.readProfile();
        setProfile(JSON.parse(profileData));
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (window.electron) {
      await window.electron.writeProfile(JSON.stringify(profile, null, 2));
      setIsEditMode(false);
    }
  };

  if (!profile) {
    return <Typography>{t('Loading profile...')}</Typography>;
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <IconButton 
          onClick={() => isEditMode && setShowIconPalette(!showIconPalette)}
          sx={{ fontSize: 80, p: 0 }}
          disabled={!isEditMode}
        >
          {React.cloneElement(icons[profile.profileIcon], { sx: { fontSize: 80 } })}
        </IconButton>
        {isEditMode && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              opacity: 0,
              '&:hover': {
                opacity: 1,
              },
            }}
          >
            <EditIcon />
          </Box>
        )}
      </Box>

      {showIconPalette && (
        <Grid container spacing={1} sx={{ mt: 2 }}>
          {Object.keys(icons).map((iconName) => (
            <Grid item xs={4} key={iconName}>
              <IconButton onClick={() => {
                setProfile({ ...profile, profileIcon: iconName });
                setShowIconPalette(false);
              }}>
                {icons[iconName]}
              </IconButton>
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="h5" sx={{ mt: 2 }}>
        {isEditMode ? (
          <TextField
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            fullWidth
          />
        ) : (
          profile.name
        )}
      </Typography>

      <Box sx={{ mt: 2 }}>
        <Typography>
          {t('ID')}: {isEditMode ? <TextField value={profile.id} onChange={(e) => setProfile({ ...profile, id: e.target.value })} /> : profile.id}
        </Typography>
        <Typography>
          {t('Email')}: {isEditMode ? <TextField value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /> : profile.email}
        </Typography>
        <Typography>
          {t('Department')}: {isEditMode ? <TextField value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} /> : profile.department}
        </Typography>
      </Box>

      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
        {isEditMode ? (
          <Button onClick={handleSave}>{t('Save')}</Button>
        ) : (
          <IconButton onClick={() => setIsEditMode(true)}>
            <EditIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default ProfileContent;
