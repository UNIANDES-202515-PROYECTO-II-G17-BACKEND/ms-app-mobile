import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';

const resources = {
  en: {
    translation: {
      country: 'Country',
      language: 'Language',
      home: 'Home',
      clients: 'Clients',
      routes: 'Routes',
      settings: 'Settings',
      username: 'Username',
      password: 'Password',
      login: 'Login',
      createAccount: 'Create Account',
    },
  },
  es: {
    translation: {
      country: 'País',
      language: 'Idioma',
      home: 'Inicio',
      clients: 'Clientes',
      routes: 'Rutas',
      settings: 'Ajustes',
      username: 'Usuario',
      password: 'Contraseña',
      login: 'Ingresar',
      createAccount: 'Crear cuenta',
    },
  },
};

const isMobile = Platform.OS !== 'web';

if (isMobile) {
  AsyncStorage.getItem('language').then((language) => {
    i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: language || 'es', // Default language
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
        },
      });
  });
} else {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'es', // Default language for web
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
}

export const changeLanguage = async (language: string) => {
  await AsyncStorage.setItem('language', language);
  i18n.changeLanguage(language);
};

export default i18n;