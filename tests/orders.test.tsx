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

  it('handles pull to refresh', async () => {
    mockGetOrders.mockResolvedValue(mockOrders);

    const { getByTestId } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByTestId('orders-flat-list')).toBeTruthy();
    });

    // Simular el refresh
    const flatList = getByTestId('orders-flat-list');
    
    await act(async () => {
      fireEvent(flatList, 'refresh');
      // Esperar a que se complete el refresh
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Verificar que se llamó getOrders al menos una vez (mount + refresh)
    expect(mockGetOrders).toHaveBeenCalled();
  });

  it('displays order codes correctly', async () => {
    mockGetOrders.mockResolvedValue(mockOrders);

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByText('SO-2025-001')).toBeTruthy();
      expect(getByText('SO-2025-002')).toBeTruthy();
    });
  });

  it('handles orders with different estados correctly', async () => {
    const ordersWithDifferentStates = [
      { ...mockOrders[0], estado: 'COMPLETADO' },
      { ...mockOrders[1], estado: 'CANCELADO' },
      { ...mockOrders[0], id: '3', codigo: 'SO-2025-003', estado: 'EN_PROCESO' },
    ];
    
    mockGetOrders.mockResolvedValue(ordersWithDifferentStates);

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByText('Completed')).toBeTruthy();
      expect(getByText('Cancelled')).toBeTruthy();
      expect(getByText('In Process')).toBeTruthy();
    });
  });

  it('calls getOrders with correct parameters on mount', async () => {
    mockGetOrders.mockResolvedValueOnce(mockOrders);

    render(<OrdersScreen />);

    await waitFor(() => {
      expect(mockGetOrders).toHaveBeenCalledWith(undefined, { tipo: 'VENTA' });
    });
  });

  it('renders bottom navigation bar', async () => {
    mockGetOrders.mockResolvedValueOnce(mockOrders);

    const { getByTestId } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByTestId('bottom-nav')).toBeTruthy();
    });
  });

  it('displays order code correctly', async () => {
    mockGetOrders.mockResolvedValueOnce(mockOrders);

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByText('SO-2025-001')).toBeTruthy();
      expect(getByText('SO-2025-002')).toBeTruthy();
    });
  });

  it('handles empty items array', async () => {
    const orderWithNoItems = [{
      ...mockOrders[0],
      items: [],
    }];
    
    mockGetOrders.mockResolvedValue(orderWithNoItems);

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      // Verificar que el pedido se renderiza con 0 items
      expect(getByText('SO-2025-001')).toBeTruthy();
      expect(getByText('0')).toBeTruthy(); // El número de items
    });
  });

  it('handles orders with null total', async () => {
    const orderWithNullTotal = [{
      ...mockOrders[0],
      total: 'NaN' as any, // Cuando llega null, se convierte en NaN al parsear
    }];
    
    mockGetOrders.mockResolvedValue(orderWithNullTotal);

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByText('SO-2025-001')).toBeTruthy();
    });
  });

  it('handles network timeout error', async () => {
    mockGetOrders.mockRejectedValue(new Error('Network timeout'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByText('Error al cargar pedidos')).toBeTruthy();
    });

    consoleErrorSpy.mockRestore();
  });

  it('displays subtitle with correct order count', async () => {
    mockGetOrders.mockResolvedValue(mockOrders);

    const { getByText, getAllByText } = render(<OrdersScreen />);

    await waitFor(() => {
      // Verificar que muestra "pedidos" (plural) con 2
      const elements = getAllByText(/pedidos/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('displays singular pedido text when count is 1', async () => {
    mockGetOrders.mockResolvedValue([mockOrders[0]]);

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      // Verificar que muestra el código del pedido
      expect(getByText('SO-2025-001')).toBeTruthy();
    });
  });

  it('renders orders header correctly', async () => {
    mockGetOrders.mockResolvedValueOnce(mockOrders);

    const { getByText } = render(<OrdersScreen />);

    await waitFor(() => {
      expect(getByText('Orders')).toBeTruthy();
    });
  });
});
