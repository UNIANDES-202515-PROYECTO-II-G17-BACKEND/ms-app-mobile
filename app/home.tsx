import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, View } from 'react-native';
import BottomNavigationBar from './common/BottomNavigationBar';
import { useUserRole } from './hooks/useUserRole';

const HomeScreen = () => {
  const { t } = useTranslation();
  const [value, setValue] = React.useState(0); // Default to 'Home' tab
  const { userRole } = useUserRole();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../assets/images/logo.png')} 
          style={styles.logo}
        />
        <Text style={styles.subtitle}>
          {t('welcome')} <Text style={{ fontWeight: 'bold' }}>{t('appName')}</Text>!
        </Text>
        <Text style={styles.subtitle}>{t('welcomeMessage')}</Text>
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
  logo: {
    width: 180,
    height: 180,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6750A4',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6750A4',
  },
});

export default HomeScreen;
