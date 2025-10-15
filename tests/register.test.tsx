// tests/register.test.tsx
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

// ---- Mocks ----

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// Mock authService
const mockRegister = jest.fn();
jest.mock('../app/services/authService', () => ({
  register: jest.fn().mockImplementation((...args) => mockRegister(...args)),
}));

// Asset del logo
jest.mock('../assets/images/logo.png', () => 'logo-stub');

// Mocks de MUI para RN
jest.mock('@mui/material', () => {
  const React = require('react');
  const { Text, View, TextInput } = require('react-native');
  const Box = ({ children, color }: any) => (
    <View testID={color === 'error.main' ? 'error-box' : undefined}>
      {typeof children === 'string' ? <Text>{children}</Text> : children}
    </View>
  );
  const TextField = ({ label, value, onChange }: any) => (
    <View>
      <Text>{label}</Text>
      <TextInput 
        testID={`input-${label}`} 
        value={value} 
        onChangeText={(text: string) => onChange({ target: { value: text } })}
      />
    </View>
  );
  const Button = ({ children, onClick, disabled }: any) => (
    <Text testID={`button-${children}`} onPress={onClick} accessibilityState={{ disabled }}>
      {children}
    </Text>
  );
  const FormControl = ({ children }: any) => <View>{children}</View>;
  const InputLabel = ({ children }: any) => <Text>{children}</Text>;
  const Select = ({ value, onChange, label, children }: any) => (
    <View>
      <Text>{label}: {value}</Text>
      <TextInput
        testID={`select-${label}`}
        value={value}
        onChangeText={(text: string) => onChange({ target: { value: text } })}
      />
      {children}
    </View>
  );
  const MenuItem = ({ value, children }: any) => <View><Text>{value}: {children}</Text></View>;
  return { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem };
});

// Mock @mui/material/styles
jest.mock('@mui/material/styles', () => {
  const React = require('react');
  const { View } = require('react-native');
  const ThemeProvider = ({ children }: any) => <View>{children}</View>;
  const createTheme = (..._args: any[]) => ({});
  return { ThemeProvider, createTheme };
});

// Mock theme
jest.mock('../app/common/theme', () => ({}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        institutionName: 'Institution Name',
        nit: 'NIT',
        phone: 'Phone',
        email: 'Email',
        username: 'Username',
        password: 'Password',
        country: 'Country',
        register: 'Register',
        backToLogin: 'Back to Login',
      } as Record<string, string>)[key] ?? key,
  }),
}));

// Import the component after mocks
import RegisterPage from '../app/register';
import { register } from '../app/services/authService';

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields correctly', () => {
    const { getByText, getByTestId } = render(<RegisterPage />);

    // Verify all form fields are present
    expect(getByText('Institution Name')).toBeTruthy();
    expect(getByText('NIT')).toBeTruthy();
    expect(getByText('Phone')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Username')).toBeTruthy();
    expect(getByText('Password')).toBeTruthy();
    expect(getByText('Country')).toBeTruthy();
    
    // Verify buttons
    expect(getByTestId('button-Register')).toBeTruthy();
    expect(getByTestId('button-Back to Login')).toBeTruthy();
  });

  it('handles input changes correctly', async () => {
    const { getByTestId } = render(<RegisterPage />);

    // Test input changes for all fields
    await act(async () => {
      fireEvent.changeText(getByTestId('input-Institution Name'), 'Test Hospital');
      fireEvent.changeText(getByTestId('input-NIT'), '123456789');
      fireEvent.changeText(getByTestId('input-Phone'), '1234567890');
      fireEvent.changeText(getByTestId('input-Email'), 'test@hospital.com');
      fireEvent.changeText(getByTestId('input-Username'), 'testuser');
      fireEvent.changeText(getByTestId('input-Password'), 'testpass');
      fireEvent.changeText(getByTestId('select-Country'), 'co');
    });

    // Verify country selection
    expect(getByTestId('select-Country').props.value).toBe('co');
  });

  it('handles successful registration', async () => {
    mockRegister.mockResolvedValueOnce({});
    
    const { getByTestId } = render(<RegisterPage />);

    // Fill out the form
    await act(async () => {
      fireEvent.changeText(getByTestId('input-Institution Name'), 'Test Hospital');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-Username'), 'testuser');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-Password'), 'testpass');
    });

    // Submit the form
    await act(async () => {
      fireEvent.press(getByTestId('button-Register'));
    });

    // Verify registration was called
    expect(mockRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'testuser',
        password: 'testpass',
        institution_name: 'Test Hospital',
      }),
      'mx'
    );

    // Verify navigation to login page
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('handles registration failure', async () => {
    const errorMessage = 'Registration failed';
    mockRegister.mockRejectedValueOnce(new Error(errorMessage));
    
    const { getByTestId, getByText } = render(<RegisterPage />);

    // Fill out minimal required form data
    await act(async () => {
      await fireEvent.changeText(getByTestId('input-Institution Name'), 'Test Hospital');
      await fireEvent.changeText(getByTestId('input-Username'), 'testuser');
      await fireEvent.changeText(getByTestId('input-Password'), 'testpass');
    });

    // Submit form and wait for error
    await act(async () => {
      await fireEvent.press(getByTestId('button-Register'));
    });

    // Error should be displayed in error box
    const errorBox = getByTestId('error-box');
    expect(errorBox).toBeTruthy();
    expect(getByText(errorMessage)).toBeTruthy();
  });

  it('navigates back to login when back button is pressed', async () => {
    const { getByTestId } = render(<RegisterPage />);

    await act(async () => {
      fireEvent.press(getByTestId('button-Back to Login'));
    });

    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});