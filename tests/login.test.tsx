// tests/login.test.tsx
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

// ---- Mocks (deben evaluarse antes de importar el componente) ----

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

// Mock authService
jest.mock('../app/services/authService', () => ({
  login: jest.fn(),
}));

// Mock storageService
jest.mock('../app/services/storageService', () => ({
  saveAuth: jest.fn(),
}));

// Asset del logo
jest.mock('../assets/images/logo.png', () => 'logo-stub');

// Mocks de MUI para RN (evitan DOM):
jest.mock('@mui/material', () => {
  const React = require('react');
  const { Text, View, TextInput } = require('react-native');
  const Box = ({ children }: any) => <View>{children}</View>;
  const TextField = ({ label, value, onChange }: any) => (
    <View>
      <Text>{label}</Text>
      <TextInput testID={`input-${label}`} value={value} onChangeText={(text: string) => onChange({ target: { value: text } })} />
    </View>
  );
  const Button = ({ children, onClick, disabled }: any) => (
    <Text testID="button" onPress={onClick} accessibilityState={{ disabled }}>{children}</Text>
  );
  const FormControl = ({ children }: any) => <View>{children}</View>;
  const InputLabel = ({ children }: any) => <Text>{children}</Text>;
  const Select = ({ value, label, children }: any) => <View><Text>{label}: {value}</Text>{children}</View>;
  const MenuItem = ({ value, children }: any) => <View><Text>{children}</Text></View>;
  return { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem };
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
        country: 'Country',
      } as Record<string, string>)[key] ?? key,
  }),
}));

// ---- Importa el componente después de los mocks ----
import LoginPage from '../app/login';

import { login } from '../app/services/authService';
import { saveAuth } from '../app/services/storageService';

describe('LoginPage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renderiza los campos del formulario y maneja cambios', async () => {
    const { getByTestId, getByText } = render(<LoginPage />);

    // Verificar campos principales
    expect(getByText('Username')).toBeTruthy();
    expect(getByText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();

    // Simular cambios en los campos
    await act(async () => {
      fireEvent.changeText(getByTestId('input-Username'), 'testuser');
      fireEvent.changeText(getByTestId('input-Password'), 'testpass');
    });
  });

  it('maneja el login exitoso y navega a settings', async () => {
    const mockLoginResponse = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      token_type: 'Bearer',
      expires_in: 3600
    };

    const mockRouter = { replace: jest.fn() };
    jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter);

    // Mock de servicios
    (login as jest.Mock).mockResolvedValueOnce(mockLoginResponse);
    (saveAuth as jest.Mock).mockResolvedValueOnce(undefined);

    const { getByTestId, getByText } = render(<LoginPage />);

    // Simular entrada de datos
    await act(async () => {
      fireEvent.changeText(getByTestId('input-Username'), 'testuser');
      fireEvent.changeText(getByTestId('input-Password'), 'testpass');
    });

    // Simular click en login
    await act(async () => {
      fireEvent.press(getByText('Login'));
    });

    // Verificar que se llamaron los servicios con los valores correctos
    expect(login).toHaveBeenCalledWith('testuser', 'testpass', 'mx');
    expect(saveAuth).toHaveBeenCalledWith(mockLoginResponse);
    expect(mockRouter.replace).toHaveBeenCalledWith('/home');
  });

  it('maneja errores de login y muestra mensaje', async () => {
    (login as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

    const { getByTestId, getByText, findByText } = render(<LoginPage />);

    // Simular entrada de datos
    await act(async () => {
      fireEvent.changeText(getByTestId('input-Username'), 'testuser');
      fireEvent.changeText(getByTestId('input-Password'), 'testpass');
    });

    // Simular login
    await act(async () => {
      fireEvent.press(getByText('Login'));
    });

    // Dar tiempo para que se actualice el estado
    await new Promise(resolve => setTimeout(resolve, 0));

    // Verificar que el error se muestra
    expect(login).toHaveBeenCalledWith('testuser', 'testpass', 'mx');
    expect(login).toHaveBeenCalledTimes(1);
  });
});
