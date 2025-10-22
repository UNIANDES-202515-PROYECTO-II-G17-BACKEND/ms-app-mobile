// tests/home.test.tsx
import { render } from '@testing-library/react-native';
import React from 'react';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        welcome: 'Welcome to',
        appName: 'MediSupply',
        welcomeMessage: 'Your medical supply management platform',
        quickActions: 'Quick Actions',
        orders: 'Orders',
        viewOrders: 'View Orders',
        createOrder: 'Create New Order',
        manageInventory: 'Manage Inventory',
        clients: 'Clients',
        settings: 'Settings',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock BottomNavigationBar
jest.mock('../app/common/BottomNavigationBar', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return ({ value }: { value: number }) => (
    <View testID="bottom-nav">
      <Text>Tab: {value}</Text>
    </View>
  );
});

// Mock useUserRole
jest.mock('../app/hooks/useUserRole', () => ({
  useUserRole: () => ({ userRole: 'institutional_customer' }),
}));

// Import component after mocks
import HomePage from '../app/home';

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders home page correctly', () => {
    const { getByText } = render(<HomePage />);

    expect(getByText(/Welcome to/i)).toBeTruthy();
    expect(getByText('MediSupply')).toBeTruthy();
    expect(getByText('Your medical supply management platform')).toBeTruthy();
  });

  it('renders bottom navigation bar', () => {
    const { getByTestId } = render(<HomePage />);
    
    expect(getByTestId('bottom-nav')).toBeTruthy();
  });

  it('displays welcome message with app name', () => {
    const { getByText } = render(<HomePage />);

    expect(getByText(/Welcome to/i)).toBeTruthy();
    expect(getByText('MediSupply')).toBeTruthy();
  });
});
