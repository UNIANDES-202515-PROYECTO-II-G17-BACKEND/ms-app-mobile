import GroupIcon from '@mui/icons-material/Group';
import HomeIcon from '@mui/icons-material/Home';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserRole } from '../services/userService';

interface BottomNavigationBarProps {
  value: number;
  setValue: (newValue: number) => void;
  role?: UserRole;
}

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({ 
  value, 
  setValue, 
  role = 'institutional_customer' 
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  const handleNavigation = (newValue: number) => {
    setValue(newValue);
    
    if (role === 'seller') {
      // Navegación para seller: Inicio, Clientes, Rutas, Ajustes
      switch (newValue) {
        case 0:
          router.push('/');
          break;
        case 1:
          // router.push('/clients'); // TODO: Crear pantalla de clientes
          break;
        case 2:
          // router.push('/routes'); // TODO: Crear pantalla de rutas
          break;
        case 3:
          router.push('/settings');
          break;
      }
    } else if (role === 'institutional_customer') {
      // Navegación para cliente institucional: Inicio, Pedidos, Entregas, Ajustes
      switch (newValue) {
        case 0:
          router.push('/');
          break;
        case 1:
          router.push('/new-order' as any);
          break;
        case 2:
          // router.push('/deliveries'); // TODO: Crear pantalla de entregas
          break;
        case 3:
          router.push('/settings');
          break;
      }
    } else {
      // Admin u otros roles - misma navegación que seller por defecto
      switch (newValue) {
        case 0:
          router.push('/');
          break;
        case 1:
          // router.push('/orders');
          break;
        case 2:
          // router.push('/deliveries');
          break;
        case 3:
          router.push('/settings');
          break;
      }
    }
  };

  if (role === 'seller') {
    return (
      <BottomNavigation
        value={value}
        onChange={(event, newValue) => handleNavigation(newValue)}
        sx={{ bgcolor: 'secondary.main', color: 'primary.main' }}
        showLabels
      >
        <BottomNavigationAction label={t('home')} icon={<HomeIcon />} sx={{ color: 'primary.main' }} />
        <BottomNavigationAction label={t('clients')} icon={<GroupIcon />} sx={{ color: 'primary.main' }} />
        <BottomNavigationAction label={t('routes')} icon={<MapIcon />} sx={{ color: 'primary.main' }} />
        <BottomNavigationAction label={t('settings')} icon={<SettingsIcon />} sx={{ color: 'primary.main' }} />
      </BottomNavigation>
    );
  }

  // Clinte institucional y Admin 
  return (
    <BottomNavigation
      value={value}
      onChange={(event, newValue) => handleNavigation(newValue)}
      sx={{ bgcolor: 'secondary.main', color: 'primary.main' }}
      showLabels
    >
      <BottomNavigationAction label={t('home')} icon={<HomeIcon />} sx={{ color: 'primary.main' }} />
      <BottomNavigationAction label={t('orders')} icon={<ShoppingCartIcon />} sx={{ color: 'primary.main' }} />
      <BottomNavigationAction label={t('deliveries')} icon={<LocalShippingIcon />} sx={{ color: 'primary.main' }} />
      <BottomNavigationAction label={t('settings')} icon={<SettingsIcon />} sx={{ color: 'primary.main' }} />
    </BottomNavigation>
  );
};

export default BottomNavigationBar;