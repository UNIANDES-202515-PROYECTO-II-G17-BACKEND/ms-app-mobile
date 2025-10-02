import GroupIcon from '@mui/icons-material/Group';
import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface BottomNavigationBarProps {
  value: number;
  setValue: (newValue: number) => void;
}

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({ value, setValue }) => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <BottomNavigation
      value={value}
      onChange={(event, newValue) => {
        setValue(newValue);
        if (newValue === 0) {
          router.push('/login');
        }
      }}
      sx={{ bgcolor: 'secondary.main', color: 'primary.main' }}
      showLabels
    >
      <BottomNavigationAction label={t('home')} icon={<HomeIcon />} sx={{ color: 'primary.main' }} />
      <BottomNavigationAction label={t('clients')} icon={<GroupIcon />} sx={{ color: 'primary.main' }} />
      <BottomNavigationAction label={t('routes')} icon={<MapIcon />} sx={{ color: 'primary.main' }} />
      <BottomNavigationAction label={t('settings')} icon={<SettingsIcon />} sx={{ color: 'primary.main' }} />
    </BottomNavigation>
  );
};

export default BottomNavigationBar;