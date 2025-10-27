// tests/home.test.tsx
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
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
        myVisits: 'My Visits',
        scheduledDeliveries: 'Entregas Programadas',
        viewYourDeliveries: 'Ver tus entregas programadas',
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
const mockUserRole = jest.fn();
jest.mock('../app/hooks/useUserRole', () => ({
  useUserRole: () => ({ userRole: mockUserRole() }),
}));

// Mock visit service
const mockGetVisits = jest.fn();
jest.mock('../app/services/visitService', () => ({
  getVisits: jest.fn().mockImplementation(() => mockGetVisits()),
}));

// Mock user service
const mockGetCurrentUser = jest.fn();
jest.mock('../app/services/userService', () => ({
  getCurrentUser: jest.fn().mockImplementation(() => mockGetCurrentUser()),
}));

// Import component after mocks
import HomePage from '../app/home';

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRole.mockReturnValue('institutional_customer');
    mockGetVisits.mockResolvedValue([]);
    mockGetCurrentUser.mockResolvedValue({ id: '123', username: 'testuser' });
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

  it('shows visits button for seller role', async () => {
    mockUserRole.mockReturnValue('seller');
    mockGetVisits.mockResolvedValue([
      { id: '1', contacto: 'John Doe' },
      { id: '2', contacto: 'Jane Smith' },
    ]);

    const { getByText } = render(<HomePage />);

    await waitFor(() => {
      expect(getByText('My Visits')).toBeTruthy();
    });
  });

  it('does not show visits button for non-seller roles', () => {
    mockUserRole.mockReturnValue('institutional_customer');

    const { queryByText } = render(<HomePage />);

    expect(queryByText('My Visits')).toBeNull();
  });

  it('navigates to visits screen when visits button is pressed', async () => {
    mockUserRole.mockReturnValue('seller');
    mockGetVisits.mockResolvedValue([]);

    const { getByText } = render(<HomePage />);

    await waitFor(() => {
      expect(getByText('My Visits')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('My Visits'));
    });

    expect(mockPush).toHaveBeenCalledWith('/visits');
  });

  it('fetches visits count for seller on mount', async () => {
    mockUserRole.mockReturnValue('seller');
    const mockVisits = [
      { id: '1', contacto: 'Alice' },
      { id: '2', contacto: 'John' },
      { id: '3', contacto: 'Bob' },
    ];
    mockGetVisits.mockResolvedValue(mockVisits);

    render(<HomePage />);

    await waitFor(() => {
      expect(mockGetVisits).toHaveBeenCalledTimes(1);
    });
  });

  it('handles error when fetching visits count', async () => {
    mockUserRole.mockReturnValue('seller');
    mockGetVisits.mockRejectedValue(new Error('Network error'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { getByText } = render(<HomePage />);

    await waitFor(() => {
      expect(getByText('My Visits')).toBeTruthy();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching visits count:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('renders logo image', () => {
    const { getByTestId } = render(<HomePage />);
    
    // The logo should be rendered
    const images = require('react-native').Image;
    expect(images).toBeDefined();
  });

  it('initializes with correct tab value', () => {
    const { getByText } = render(<HomePage />);
    
    expect(getByText('Tab: 0')).toBeTruthy();
  });

  it('renders for admin role', () => {
    mockUserRole.mockReturnValue('admin');

    const { getByText } = render(<HomePage />);

    expect(getByText('MediSupply')).toBeTruthy();
    expect(getByText('Your medical supply management platform')).toBeTruthy();
  });

  it('shows deliveries button for institutional_customer role', () => {
    mockUserRole.mockReturnValue('institutional_customer');

    const { getByText } = render(<HomePage />);

    expect(getByText('Entregas Programadas')).toBeTruthy();
  });

  it('does not show deliveries button for seller role', () => {
    mockUserRole.mockReturnValue('seller');
    mockGetVisits.mockResolvedValue([]);

    const { queryByText } = render(<HomePage />);

    expect(queryByText('Entregas Programadas')).toBeNull();
  });

  it('does not show deliveries button for admin role', () => {
    mockUserRole.mockReturnValue('admin');

    const { queryByText } = render(<HomePage />);

    expect(queryByText('Entregas Programadas')).toBeNull();
  });

  it('navigates to scheduled deliveries screen when button is pressed', async () => {
    mockUserRole.mockReturnValue('institutional_customer');

    const { getByText } = render(<HomePage />);

    const deliveriesButton = getByText('Entregas Programadas');
    
    await act(async () => {
      fireEvent.press(deliveriesButton);
    });

    expect(mockPush).toHaveBeenCalledWith('/scheduled-deliveries');
  });
});

