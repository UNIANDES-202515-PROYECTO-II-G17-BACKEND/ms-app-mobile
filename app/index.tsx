import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { I18nextProvider } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from 'react-native';
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
      <ActivityIndicator size="large" color="#6750A4" />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function Index() {
  return (
    <I18nextProvider i18n={i18n}>
      <HomeScreen />
    </I18nextProvider>
  );
}
