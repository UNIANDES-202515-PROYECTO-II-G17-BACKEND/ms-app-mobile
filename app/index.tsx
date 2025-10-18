import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { I18nextProvider } from "react-i18next";
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import i18n from "./common/i18n";
import { getAccessToken } from './services/storageService';

function HomeScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const token = await getAccessToken();
      
      if (token) {
        // Usuario autenticado, redirigir a home
        router.replace('/home');
      } else {
        // Usuario no autenticado, redirigir a login
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      // En caso de error, redirigir a login
      router.replace('/login');
    } finally {
      setChecking(false);
    }
  };

  // Mostrar loading mientras verifica la autenticación
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.contentContainer}>
        <Image 
          source={require('../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>MediSupply</Text>
        <View style={styles.loadingSection}>
          <ActivityIndicator size="large" color="#6750A4" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6750A4',
    marginBottom: 40,
    letterSpacing: 1,
  },
  loadingSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default function Index() {
  return (
    <I18nextProvider i18n={i18n}>
      <HomeScreen />
    </I18nextProvider>
  );
}
