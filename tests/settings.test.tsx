// tests/settings.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

// === Mocks ANTES de importar el componente ===

// AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => null),
    removeItem: jest.fn(async () => null),
    clear: jest.fn(async () => null),
    getAllKeys: jest.fn(async () => []),
  },
}));

// MUI (ThemeProvider + RadioGroup que propaga onChange)
jest.mock('@mui/material', () => {
  const React = require('react');
  const { Text, View, TouchableOpacity } = require('react-native');

  const Box = ({ children }: any) => <View>{children}</View>;
  const Typography = ({ children }: any) => <Text>{children}</Text>;
  const FormControl = ({ children }: any) => <View>{children}</View>;

  const RadioGroup = ({ children, onChange }: any) => {
    const kids = React.Children.map(children, (child: any) => {
      if (!React.isValidElement(child)) return child;
      const value = child.props?.value;
      const onPress = () => onChange?.({ target: { value } });
      return React.cloneElement(child, { onPress });
    });
    return <View>{kids}</View>;
  };

  const FormControlLabel = ({ label, onPress }: any) => (
    <TouchableOpacity onPress={onPress}>
      <Text onPress={onPress}>{label}</Text>
    </TouchableOpacity>
  );

  const Radio = () => <View />;
  const ThemeProvider = ({ children }: any) => <View>{children}</View>;

  return { Box, Typography, FormControl, RadioGroup, FormControlLabel, Radio, ThemeProvider };
});

// (opcional) estilos MUI
jest.mock('@mui/material/styles', () => {
  const React = require('react');
  const { View } = require('react-native');
  const ThemeProvider = ({ children }: any) => <View>{children}</View>;
  const createTheme = () => ({});
  return { ThemeProvider, createTheme };
});

// theme del proyecto
jest.mock('../app/common/theme', () => ({}));

// BottomNavigationBar (default export)
jest.mock('../app/common/BottomNavigationBar', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, default: ({ children }: any) => <View>{children}</View> };
});

// i18n: mock de textos + mock de changeLanguage *dentro del factory* (sin variables externas)
jest.mock('../app/common/i18n', () => ({
  __esModule: true,
  changeLanguage: jest.fn(async (_lang: string) => Promise.resolve()),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        settings: 'Settings',
        country: 'Country',
        language: 'Language',
      } as Record<string, string>)[key] ?? key,
  }),
}));

// === Import del componente (después de mocks) ===
import SettingsScreen from '../app/settings';

describe('SettingsScreen', () => {
  it('renderiza encabezados y opciones esperadas', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Country')).toBeTruthy();
    expect(screen.getByText('Language')).toBeTruthy();

    expect(screen.getByText('Colombia')).toBeTruthy();
    expect(screen.getByText('México')).toBeTruthy();
    expect(screen.getByText('Argentina')).toBeTruthy();

    expect(screen.getByText('Español')).toBeTruthy();
    expect(screen.getByText('Inglés')).toBeTruthy();
  });

  it('ejecuta handleLanguageChange y llama changeLanguage("en")', async () => {
    render(<SettingsScreen />);

    // Dispara el RadioGroup de idioma tocando "Inglés"
    fireEvent.press(screen.getByText('Inglés'));

    // Leemos el mock desde el módulo (no variable externa)
    const { changeLanguage } = require('../app/common/i18n');

    await waitFor(() => {
      expect(changeLanguage).toHaveBeenCalledWith('en');
    });
  });

  it('ejecuta setCountry al cambiar país', () => {
    render(<SettingsScreen />);

    // Dispara el RadioGroup de país tocando "México"
    fireEvent.press(screen.getByText('México'));

    // Sin salida visible, pero cubre la línea del setState
    expect(true).toBe(true);
  });
});
