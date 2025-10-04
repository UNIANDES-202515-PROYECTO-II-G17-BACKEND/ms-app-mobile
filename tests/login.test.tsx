// tests/login.test.tsx
import { render, screen } from '@testing-library/react-native';
import React from 'react';

// ---- Mocks (deben evaluarse antes de importar el componente) ----

// Asset del logo
jest.mock('../assets/images/logo.png', () => 'logo-stub');

// Mocks de MUI para RN (evitan DOM):
jest.mock('@mui/material', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  const Box = ({ children }: any) => <View>{children}</View>;
  const TextField = ({ label }: any) => <Text>{label}</Text>;
  const Button = ({ children }: any) => <Text>{children}</Text>;
  return { Box, TextField, Button };
});

// MUY IMPORTANTE: mockear también @mui/material/styles
jest.mock('@mui/material/styles', () => {
  const React = require('react');
  const { View } = require('react-native');
  const ThemeProvider = ({ children }: any) => <View>{children}</View>;
  // si tu theme usa createTheme, también lo puedes stubear:
  const createTheme = (..._args: any[]) => ({});
  return { ThemeProvider, createTheme };
});

// Si tu ./common/theme crea un theme real de MUI, moquéalo para evitar tocar DOM/Emotion
jest.mock('../app/common/theme', () => ({}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        username: 'Username',
        password: 'Password',
        login: 'Login',
        createAccount: 'Create Account',
      } as Record<string, string>)[key] ?? key,
  }),
}));

// ---- Importa el componente después de los mocks ----
import LoginPage from '../app/login';

describe('LoginPage', () => {
  it('renderiza los labels esperados', () => {
    render(<LoginPage />);

    expect(screen.getByText('Username')).toBeTruthy();
    expect(screen.getByText('Password')).toBeTruthy();
    expect(screen.getByText('Login')).toBeTruthy();
    expect(screen.getByText('Create Account')).toBeTruthy();
  });
});
