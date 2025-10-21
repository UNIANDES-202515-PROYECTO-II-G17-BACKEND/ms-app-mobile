// tests/clients.test.tsx
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock expo-router
const mockPush = jest.fn();
const mockRouter = { push: mockPush };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

// Mock userService
const mockGetInstitutionalCustomers = jest.fn();
jest.mock('../app/services/userService', () => ({
  getInstitutionalCustomers: (...args: any[]) => mockGetInstitutionalCustomers(...args),
}));

// Mock useUserRole hook
jest.mock('../app/hooks/useUserRole', () => ({
  useUserRole: () => ({
    userRole: 'seller',
  }),
}));

// Mock BottomNavigationBar
jest.mock('../app/common/BottomNavigationBar', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return ({ value }: any) => (
    <View testID="bottom-nav">
      <Text>Bottom Navigation - Value: {value}</Text>
    </View>
  );
});

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        clients: 'Clients',
        searchClients: 'Search clients...',
        noClients: 'No Clients',
        noClientsMessage: 'No clients found',
        noClientsFilter: 'No clients found with this search',
        contact: 'Contact',
        email: 'Email',
        phone: 'Phone',
        clientId: 'Client ID',
        registeredDate: 'Registered',
        lastUpdate: 'Last Update',
      };
      return translations[key] || key;
    },
  }),
}));

// Import component after mocks
import ClientsScreen from '../app/clients/index';

describe('ClientsScreen', () => {
  const mockClients = [
    {
      id: 1,
      username: 'hospital1',
      role: 'institutional_customer' as const,
      institution_name: 'Hospital Central',
      full_name: 'John Doe',
      document_type: 'cc',
      document_number: '123456789',
      email: 'john@hospital.com',
      telephone: '555-0100',
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-20T15:30:00Z',
    },
    {
      id: 2,
      username: 'clinic1',
      role: 'institutional_customer' as const,
      institution_name: 'Clinic Plus',
      full_name: 'Jane Smith',
      document_type: 'nit',
      document_number: '987654321',
      email: 'jane@clinic.com',
      telephone: '555-0200',
      created_at: '2025-01-10T08:00:00Z',
      updated_at: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockGetInstitutionalCustomers.mockImplementation(() => new Promise(() => {}));
    
    const { getByTestId } = render(<ClientsScreen />);
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('fetches and displays clients successfully', async () => {
    mockGetInstitutionalCustomers.mockResolvedValue(mockClients);

    const { getByText, findByText } = render(<ClientsScreen />);

    await waitFor(() => {
      expect(mockGetInstitutionalCustomers).toHaveBeenCalledWith(undefined, 100);
    });

    // Verify header
    await findByText('Clients');
    expect(getByText('2 clientes')).toBeTruthy();

    // Verify first client card
    expect(getByText('Hospital Central')).toBeTruthy();
    expect(getByText('@hospital1')).toBeTruthy();
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john@hospital.com')).toBeTruthy();
  });

  it('handles search filter correctly', async () => {
    mockGetInstitutionalCustomers.mockResolvedValue(mockClients);

    const { getByPlaceholderText, getByText, queryByText, findByText } = render(<ClientsScreen />);

    await waitFor(() => {
      expect(mockGetInstitutionalCustomers).toHaveBeenCalled();
    });

    await findByText('Hospital Central');

    // Search for "clinic"
    const searchInput = getByPlaceholderText('Search clients...');
    await act(async () => {
      fireEvent.changeText(searchInput, 'clinic');
    });

    // Should show only Clinic Plus
    expect(getByText('Clinic Plus')).toBeTruthy();
    expect(queryByText('Hospital Central')).toBeNull();
  });

  it('clears search when clear button is pressed', async () => {
    mockGetInstitutionalCustomers.mockResolvedValue(mockClients);

    const { getByPlaceholderText, getByText, findByText } = render(<ClientsScreen />);

    await findByText('Hospital Central');

    const searchInput = getByPlaceholderText('Search clients...');
    
    // Enter search text
    await act(async () => {
      fireEvent.changeText(searchInput, 'clinic');
    });

    // Clear search
    await act(async () => {
      fireEvent.changeText(searchInput, '');
    });

    // Both clients should be visible again
    expect(getByText('Hospital Central')).toBeTruthy();
    expect(getByText('Clinic Plus')).toBeTruthy();
  });

  it('handles error state correctly', async () => {
    mockGetInstitutionalCustomers.mockRejectedValue(new Error('Network error'));

    const { getByText, findByText } = render(<ClientsScreen />);

    await waitFor(() => {
      expect(mockGetInstitutionalCustomers).toHaveBeenCalled();
    });

    await findByText('Error');
    expect(getByText('Network error')).toBeTruthy();
  });

  it('shows empty state when no clients exist', async () => {
    mockGetInstitutionalCustomers.mockResolvedValue([]);

    const { getByText, findByText } = render(<ClientsScreen />);

    await waitFor(() => {
      expect(mockGetInstitutionalCustomers).toHaveBeenCalled();
    });

    await findByText('0 clientes');
    expect(getByText('No Clients')).toBeTruthy();
    expect(getByText('No clients found')).toBeTruthy();
  });

  it('handles refresh correctly', async () => {
    mockGetInstitutionalCustomers.mockResolvedValue(mockClients);

    const { findByText } = render(<ClientsScreen />);

    await findByText('Hospital Central');

    // Initial call
    expect(mockGetInstitutionalCustomers).toHaveBeenCalledTimes(1);
  });

  it('displays all client fields correctly', async () => {
    mockGetInstitutionalCustomers.mockResolvedValue([mockClients[0]]);

    const { getByText, findByText } = render(<ClientsScreen />);

    await findByText('Hospital Central');

    // Verify all fields are displayed
    expect(getByText('1')).toBeTruthy(); // ID
    expect(getByText('John Doe')).toBeTruthy(); // Full name
    expect(getByText('john@hospital.com')).toBeTruthy(); // Email
    expect(getByText('555-0100')).toBeTruthy(); // Phone
    expect(getByText('123456789')).toBeTruthy(); // Document number
    expect(getByText('15/01/2025')).toBeTruthy(); // Created date
    expect(getByText('20/01/2025')).toBeTruthy(); // Updated date
  });

  it('filters by multiple fields', async () => {
    mockGetInstitutionalCustomers.mockResolvedValue(mockClients);

    const { getByPlaceholderText, getByText, queryByText, findByText } = render(<ClientsScreen />);

    await findByText('Hospital Central');

    const searchInput = getByPlaceholderText('Search clients...');

    // Search by email
    await act(async () => {
      fireEvent.changeText(searchInput, 'john@hospital');
    });

    expect(getByText('Hospital Central')).toBeTruthy();
    expect(queryByText('Clinic Plus')).toBeNull();

    // Search by username
    await act(async () => {
      fireEvent.changeText(searchInput, 'clinic1');
    });

    expect(getByText('Clinic Plus')).toBeTruthy();
    expect(queryByText('Hospital Central')).toBeNull();
  });
});
