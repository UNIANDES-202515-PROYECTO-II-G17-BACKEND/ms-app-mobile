import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomNavigationBar from './common/BottomNavigationBar';
import { changeLanguage } from './common/i18n';
import { useUserRole } from './hooks/useUserRole';
import { clearAuth } from './services/storageService';
import { clearUserCache } from './services/userService';

// Custom Radio Button Component
interface RadioButtonProps {
  selected: boolean;
  label: string;
  onPress: () => void;
}

const RadioButton: React.FC<RadioButtonProps> = ({ selected, label, onPress }) => (
  <TouchableOpacity style={styles.radioContainer} onPress={onPress}>
    <View style={styles.radioCircle}>
      {selected && <View style={styles.selectedRadio} />}
    </View>
    <Text style={styles.radioLabel}>{label}</Text>
  </TouchableOpacity>
);

const SettingsScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { userRole } = useUserRole();
  // Settings está en índice 4 para sellers (5 tabs) y en índice 3 para clientes (4 tabs)
  const settingsIndex = userRole === 'seller' ? 4 : 3;
  const [value, setValue] = React.useState(settingsIndex);
  const [language, setLanguage] = React.useState('es');

  const handleLanguageChange = async (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    await changeLanguage(selectedLanguage);
  };

  const handleLogout = async () => {
    console.log('handleLogout called');
    console.log('Clearing auth data...');
    // Limpiar caché de usuario primero
    clearUserCache();
    // Luego limpiar tokens de autenticación
    await clearAuth();
    console.log('Auth data cleared, redirecting to login...');
    // Forzar la redirección al login
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {t('settings')}
        </Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('language')}
          </Text>
          <View style={styles.radioGroup}>
            <RadioButton
              selected={language === 'es'}
              label="Español"
              onPress={() => handleLanguageChange('es')}
            />
            <RadioButton
              selected={language === 'en'}
              label="Inglés"
              onPress={() => handleLanguageChange('en')}
            />
          </View>
        </View>

        {/* Botón de cerrar sesión */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutButtonText}>
              {t('logout') || 'Cerrar sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <BottomNavigationBar value={value} setValue={setValue} role={userRole} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6750A4',
    marginBottom: 32,
  },
  section: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6750A4',
    marginBottom: 12,
  },
  radioGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6750A4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedRadio: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6750A4',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  logoutSection: {
    width: '100%',
    maxWidth: 300,
    marginTop: 16,
  },
  logoutButton: {
    backgroundColor: '#DC362E',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;