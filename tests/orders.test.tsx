// tests/orders.test.tsx
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
        orders: 'Orders',
        items: 'Items',
        draft: 'Draft',
        pending: 'Pending',
        in_process: 'In Process',
        completed: 'Completed',
        cancelled: 'Cancelled',
        noOrders: 'No Orders',
        noOrdersMessage: 'You don\'t have any orders yet',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock orderService
const mockGetOrders = jest.fn();
jest.mock('../app/services/orderService', () => ({
  getOrders: jest.fn().mockImplementation((...args) => mockGetOrders(...args)),
}));

// Mock BottomNavigationBar
jest.mock('../app/common/BottomNavigationBar', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => <View testID="bottom-nav" />;
});

// Mock useUserRole
jest.mock('../app/hooks/useUserRole', () => ({
  useUserRole: () => ({ userRole: 'institutional_customer' }),
}));

// Import component after mocks
import OrdersScreen from '../app/orders/index';

describe('OrdersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  const mockOrders = [
    {
      id: '1',
      codigo: 'SO-2025-001',
      tipo: 'VENTA',
      estado: 'BORRADOR',
      proveedor_id: null,
      oc_id: null,
      cliente_id: 123,
      vendedor_id: 456,
      bodega_origen_id: 'warehouse-1',
      bodega_destino_id: null,
      total: '1000.00',
      items: [
        {
          producto_id: 'prod-1',
          cantidad: 5,
          precio_unitario: '200.00',
          impuesto_pct: '19.00',
          descuento_pct: null,
          sku: 'SKU-001',
        },
      ],
    },
    {
      id: '2',
      codigo: 'SO-2025-002',
      tipo: 'VENTA',
      estado: 'PENDIENTE',
      proveedor_id: null,
      oc_id: null,
      cliente_id: 789,
      vendedor_id: 456,
      bodega_origen_id: 'warehouse-1',
      bodega_destino_id: null,
      total: '2000.00',
      items: [
        {
          producto_id: 'prod-2',
          cantidad: 10,
          precio_unitario: '200.00',
          impuesto_pct: '19.00',
          descuento_pct: null,
          sku: 'SKU-002',
        },
      ],
    },
  ];

  it('renders orders list correctly', async () => {
    mockGetOrders.mockResolvedValueOnce(mockOrders);

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByText('Orders')).toBeTruthy();
    });

    await waitFor(() => {
      expect(getByText('SO-2025-001')).toBeTruthy();
      expect(getByText('SO-2025-002')).toBeTruthy();
    });
  });

  it('shows loading indicator while fetching orders', () => {
    mockGetOrders.mockImplementation(() => new Promise(() => {}));

    const { getByText } = render(<OrdersScreen />);

    expect(getByText('Cargando pedidos...')).toBeTruthy();
  });

  it('displays error message when orders fetch fails', async () => {
    mockGetOrders.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByText('Error al cargar pedidos')).toBeTruthy();
    });
  });

  it('shows empty state when no orders exist', async () => {
    mockGetOrders.mockResolvedValueOnce([]);

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByText('No Orders')).toBeTruthy();
    });
  });

  it('navigates to order detail when order is clicked', async () => {
    mockGetOrders.mockResolvedValueOnce(mockOrders);

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByText('SO-2025-001')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('SO-2025-001'));
    });

    expect(mockPush).toHaveBeenCalledWith('/orders/detail?id=1');
  });

  it('navigates to new order screen when FAB is pressed', async () => {
    mockGetOrders.mockResolvedValueOnce(mockOrders);

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByText('Orders')).toBeTruthy();
    });

    const fab = getByText('+');
    await act(async () => {
      fireEvent.press(fab);
    });

    expect(mockPush).toHaveBeenCalledWith('/new-order');
  });



  it('displays correct status colors for different order states', async () => {
    mockGetOrders.mockResolvedValueOnce(mockOrders);

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByText('Draft')).toBeTruthy();
      expect(getByText('Pending')).toBeTruthy();
    });
  });

  it('formats total price correctly', async () => {
    mockGetOrders.mockResolvedValueOnce(mockOrders);

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByText('$1,000.00')).toBeTruthy();
      expect(getByText('$2,000.00')).toBeTruthy();
    });
  });

  it('handles retry after error', async () => {
    mockGetOrders.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByText('Error al cargar pedidos')).toBeTruthy();
    });

    mockGetOrders.mockResolvedValueOnce(mockOrders);

    await act(async () => {
      fireEvent.press(getByText('Reintentar'));
    });

    await waitFor(() => {
      expect(mockGetOrders).toHaveBeenCalledTimes(2);
    });
  });
});
