import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserRole } from '../services/userService';

// Iconos simples usando emojis o texto (puedes reemplazar con react-native-vector-icons si lo prefieres)
const HomeIcon = () => <Text style={styles.icon}>🏠</Text>;
const ShoppingCartIcon = () => <Text style={styles.icon}>🛒</Text>;
const GroupIcon = () => <Text style={styles.icon}>👥</Text>;
const MapIcon = () => <Text style={styles.icon}>🗺️</Text>;
const LocalShippingIcon = () => <Text style={styles.icon}>🚚</Text>;
const SettingsIcon = () => <Text style={styles.icon}>⚙️</Text>;

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
      // Navegación para seller: Inicio, Pedidos, Clientes, Rutas, Ajustes
      switch (newValue) {
        case 0:
          router.push('/home');
          break;
        case 1:
          router.push('/new-order' as any);
          break;
        case 2:
          // router.push('/clients'); // TODO: Crear pantalla de clientes
          break;
        case 3:
          // router.push('/routes'); // TODO: Crear pantalla de rutas
          break;
        case 4:
          router.push('/settings');
          break;
      }
    } else if (role === 'institutional_customer') {
      // Navegación para cliente institucional: Inicio, Pedidos, Entregas, Ajustes
      switch (newValue) {
        case 0:
          router.push('/home');
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
          router.push('/home');
          break;
        case 1:
          router.push('/new-order' as any);
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
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.tab, value === 0 && styles.activeTab]}
          onPress={() => handleNavigation(0)}
        >
          <HomeIcon />
          <Text style={[styles.label, value === 0 && styles.activeLabel]}>
            {t('home')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, value === 1 && styles.activeTab]}
          onPress={() => handleNavigation(1)}
        >
          <ShoppingCartIcon />
          <Text style={[styles.label, value === 1 && styles.activeLabel]}>
            {t('orders')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, value === 2 && styles.activeTab]}
          onPress={() => handleNavigation(2)}
        >
          <GroupIcon />
          <Text style={[styles.label, value === 2 && styles.activeLabel]}>
            {t('clients')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, value === 3 && styles.activeTab]}
          onPress={() => handleNavigation(3)}
        >
          <MapIcon />
          <Text style={[styles.label, value === 3 && styles.activeLabel]}>
            {t('routes')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, value === 4 && styles.activeTab]}
          onPress={() => handleNavigation(4)}
        >
          <SettingsIcon />
          <Text style={[styles.label, value === 4 && styles.activeLabel]}>
            {t('settings')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Cliente institucional y Admin 
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, value === 0 && styles.activeTab]}
        onPress={() => handleNavigation(0)}
      >
        <HomeIcon />
        <Text style={[styles.label, value === 0 && styles.activeLabel]}>
          {t('home')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, value === 1 && styles.activeTab]}
        onPress={() => handleNavigation(1)}
      >
        <ShoppingCartIcon />
        <Text style={[styles.label, value === 1 && styles.activeLabel]}>
          {t('orders')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, value === 2 && styles.activeTab]}
        onPress={() => handleNavigation(2)}
      >
        <LocalShippingIcon />
        <Text style={[styles.label, value === 2 && styles.activeLabel]}>
          {t('deliveries')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, value === 3 && styles.activeTab]}
        onPress={() => handleNavigation(3)}
      >
        <SettingsIcon />
        <Text style={[styles.label, value === 3 && styles.activeLabel]}>
          {t('settings')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6', // Purple color from the image
    paddingVertical: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#7C3AED',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 2,
    textAlign: 'center',
  },
  activeLabel: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BottomNavigationBar;