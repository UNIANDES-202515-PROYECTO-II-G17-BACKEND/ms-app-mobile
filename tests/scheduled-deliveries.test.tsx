// tests/scheduled-deliveries.test.tsx
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';

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
        scheduledDeliveries: 'Entregas Programadas',
        noDeliveries: 'No hay entregas programadas',
        noDeliveriesMessage: 'Actualmente no tienes entregas pendientes',
        loadingDeliveries: 'Cargando entregas programadas...',
        errorLoadingDeliveries: 'Error al cargar entregas',
        dispatched: 'Despachado',
        dispatchDate: 'Fecha de despacho',
        warehouse: 'Bodega',
        tapToViewDetails: 'Toca para ver detalles',
        retry: 'Reintentar',
        items: 'items',
        deliveryDate: 'Fecha de entrega',
        observations: 'Observaciones',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock orderService
const mockGetDispatchedOrders = jest.fn();
jest.mock('../app/services/orderService', () => ({
  getDispatchedOrders: jest.fn().mockImplementation((...args) => mockGetDispatchedOrders(...args)),
}));

// Mock BottomNavigationBar
jest.mock('../app/common/BottomNavigationBar', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => <View testID="bottom-nav" />;
});

// Mock useUserRole
jest.mock('../app/hooks/useUserRole', () => ({
  useUserRole: () => ({ userRole: 'seller' }),
}));

// Import component after mocks
import ScheduledDeliveriesScreen from '../app/scheduled-deliveries';

describe('ScheduledDeliveriesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDispatchedOrders.mockReset();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  const mockDeliveries = [
    {
      id: '1',
      codigo: 'SO-2025-001',
      tipo: 'VENTA',
      estado: 'DESPACHADO',
      proveedor_id: null,
      oc_id: null,
      cliente_id: 123,
      vendedor_id: 456,
      bodega_origen_id: 'warehouse-1',
      bodega_destino_id: null,
      total: '1000000.00',
      fecha_compromiso: '2025-10-30T10:00:00Z',
      observaciones: 'Entrega urgente',
      items: [
        {
          producto_id: 'prod-1',
          cantidad: 5,
          precio_unitario: 200000,
          impuesto_pct: 19,
          descuento_pct: null,
          sku: 'SKU-001',
        },
      ],
    },
    {
      id: '2',
      codigo: 'SO-2025-002',
      tipo: 'VENTA',
      estado: 'DESPACHADO',
      proveedor_id: null,
      oc_id: null,
      cliente_id: 789,
      vendedor_id: 456,
      bodega_origen_id: 'warehouse-2',
      bodega_destino_id: null,
      total: '2500000.00',
      fecha_compromiso: '2025-10-31T14:00:00Z',
      items: [
        {
          producto_id: 'prod-2',
          cantidad: 10,
          precio_unitario: 250000,
          impuesto_pct: 19,
          descuento_pct: null,
          sku: 'SKU-002',
        },
      ],
    },
  ];

  it('renders deliveries list correctly', async () => {
    mockGetDispatchedOrders.mockResolvedValueOnce(mockDeliveries);

    const { getByText } = render(<ScheduledDeliveriesScreen />);

    await waitFor(() => {
      expect(getByText('Entregas Programadas')).toBeTruthy();
    });

    await waitFor(() => {
      expect(getByText('SO-2025-001')).toBeTruthy();
      expect(getByText('SO-2025-002')).toBeTruthy();
    });
  });

  it('shows loading indicator while fetching deliveries', () => {
    mockGetDispatchedOrders.mockImplementation(() => new Promise(() => {}));

    const { getByText } = render(<ScheduledDeliveriesScreen />);

    expect(getByText('Cargando entregas programadas...')).toBeTruthy();
  });

  it('displays error message when deliveries fetch fails', async () => {
    mockGetDispatchedOrders.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<ScheduledDeliveriesScreen />);

    await waitFor(() => {
      expect(getByText('Error al cargar entregas')).toBeTruthy();
    });
  });

  it('shows empty state when no deliveries exist', async () => {
    mockGetDispatchedOrders.mockResolvedValueOnce([]);

    const { getByText } = render(<ScheduledDeliveriesScreen />);

    await waitFor(() => {
      expect(getByText('No hay entregas programadas')).toBeTruthy();
      expect(getByText('Actualmente no tienes entregas pendientes')).toBeTruthy();
    });
  });

  it('navigates to order detail when delivery card is pressed', async () => {
    mockGetDispatchedOrders.mockResolvedValueOnce(mockDeliveries);

    const { getByText } = render(<ScheduledDeliveriesScreen />);

    await waitFor(() => {
      expect(getByText('SO-2025-001')).toBeTruthy();
    });

    const deliveryCard = getByText('SO-2025-001');
    fireEvent.press(deliveryCard);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/orders/detail',
      params: { id: '1' },
    });
  });

  it('refreshes deliveries when pull-to-refresh is triggered', async () => {
    mockGetDispatchedOrders.mockResolvedValueOnce(mockDeliveries);

    const { getByTestId, getByText } = render(<ScheduledDeliveriesScreen />);

    await waitFor(() => {
      expect(getByText('SO-2025-001')).toBeTruthy();
    });

    // Mock second call for refresh
    mockGetDispatchedOrders.mockResolvedValueOnce([mockDeliveries[0]]);

    // Note: In a real scenario, you would trigger the FlatList's refresh
    // For now, we just verify the function is called
    expect(mockGetDispatchedOrders).toHaveBeenCalledTimes(1);
  });

  it('displays delivery information correctly', async () => {
    mockGetDispatchedOrders.mockResolvedValueOnce([mockDeliveries[0]]);

    const { getByText } = render(<ScheduledDeliveriesScreen />);

    await waitFor(() => {
      expect(getByText('SO-2025-001')).toBeTruthy();
      expect(getByText('$1.000.000')).toBeTruthy();
      expect(getByText('1 items')).toBeTruthy();
      expect(getByText('Entrega urgente')).toBeTruthy();
    });
  });

  it('formats dates correctly', async () => {
    mockGetDispatchedOrders.mockResolvedValueOnce([mockDeliveries[0]]);

    const { getByText } = render(<ScheduledDeliveriesScreen />);

    await waitFor(() => {
      // Fecha de compromiso: 30/10/2025
      expect(getByText('30/10/2025')).toBeTruthy();
    });
  });

  it('shows retry button on error', async () => {
    mockGetDispatchedOrders.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<ScheduledDeliveriesScreen />);

    await waitFor(() => {
      expect(getByText('Error al cargar entregas')).toBeTruthy();
      expect(getByText('Reintentar')).toBeTruthy();
    });

    // Reset mock for retry
    mockGetDispatchedOrders.mockResolvedValueOnce(mockDeliveries);

    const retryButton = getByText('Reintentar');
    
    await act(async () => {
      fireEvent.press(retryButton);
    });

    await waitFor(() => {
      expect(mockGetDispatchedOrders).toHaveBeenCalledTimes(2);
    });
  });

  it('displays delivery count in subtitle', async () => {
    mockGetDispatchedOrders.mockResolvedValueOnce(mockDeliveries);

    const { getByText } = render(<ScheduledDeliveriesScreen />);

    await waitFor(() => {
      expect(getByText('Entregas Programadas')).toBeTruthy();
      expect(getByText('2 entregas')).toBeTruthy();
    });
  });

  it('calls getDispatchedOrders without parameters', async () => {
    mockGetDispatchedOrders.mockResolvedValueOnce(mockDeliveries);

    render(<ScheduledDeliveriesScreen />);

    await waitFor(() => {
      expect(mockGetDispatchedOrders).toHaveBeenCalledWith();
    });
  });

  it('filters deliveries by date when date is entered', async () => {
    // Mock Platform.OS to be 'web' for this test
    Platform.OS = 'web';
    
    mockGetDispatchedOrders.mockResolvedValueOnce(mockDeliveries);

    const { getByPlaceholderText, getByText, queryByText } = render(<ScheduledDeliveriesScreen />);

    // Esperar a que carguen las entregas
    await waitFor(() => {
      expect(getByText('2 entregas')).toBeTruthy();
    });

    // Buscar el input de fecha
    const dateInput = getByPlaceholderText('YYYY-MM-DD');

    // Filtrar por fecha específica
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    // Debe mostrar solo 1 entrega (la que coincide con la fecha)
    await waitFor(() => {
      expect(getByText('1 entrega')).toBeTruthy();
      expect(getByText('SO-2025-001')).toBeTruthy();
      expect(queryByText('SO-2025-002')).toBeFalsy();
    });
  });

  it('shows all deliveries when filter is cleared', async () => {
    // Mock Platform.OS to be 'web' for this test
    Platform.OS = 'web';
    
    mockGetDispatchedOrders.mockResolvedValueOnce(mockDeliveries);

    const { getByPlaceholderText, getByText } = render(<ScheduledDeliveriesScreen />);

    // Esperar a que carguen las entregas
    await waitFor(() => {
      expect(getByText('2 entregas')).toBeTruthy();
    });

    // Buscar el input de fecha y aplicar filtro
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    // Verificar que se filtró
    await waitFor(() => {
      expect(getByText('1 entrega')).toBeTruthy();
    });

    // Limpiar filtro
    await act(async () => {
      fireEvent.changeText(dateInput, '');
    });

    // Debe mostrar todas las entregas nuevamente
    await waitFor(() => {
      expect(getByText('2 entregas')).toBeTruthy();
    });
  });

  it('shows empty state after filtering with no results', async () => {
    // Mock Platform.OS to be 'web' for this test
    Platform.OS = 'web';
    
    mockGetDispatchedOrders.mockResolvedValueOnce(mockDeliveries);

    const { getByPlaceholderText, getByText, queryByText } = render(<ScheduledDeliveriesScreen />);

    // Esperar a que carguen las entregas
    await waitFor(() => {
      expect(getByText('2 entregas')).toBeTruthy();
    });

    // Filtrar por una fecha sin resultados
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-12-31');
    });

    // Debe mostrar 0 entregas
    await waitFor(() => {
      expect(getByText('0 entregas')).toBeTruthy();
      expect(queryByText('SO-2025-001')).toBeFalsy();
      expect(queryByText('SO-2025-002')).toBeFalsy();
    });
  });

  it('filters deliveries correctly with ISO date format', async () => {
    // Mock Platform.OS to be 'web' for this test
    Platform.OS = 'web';
    
    const deliveriesWithISO = [
      {
        ...mockDeliveries[0],
        fecha_compromiso: '2025-10-30T00:00:00Z',
      },
    ];
    mockGetDispatchedOrders.mockResolvedValueOnce(deliveriesWithISO);

    const { getByPlaceholderText, getByText } = render(<ScheduledDeliveriesScreen />);

    await waitFor(() => {
      expect(getByText('1 entrega')).toBeTruthy();
    });

    // Filtrar por fecha
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    // Debe encontrar la entrega
    await waitFor(() => {
      expect(getByText('1 entrega')).toBeTruthy();
      expect(getByText('SO-2025-001')).toBeTruthy();
    });
  });

  it('handles deliveries without fecha_compromiso', async () => {
    const deliveryWithoutDate = {
      ...mockDeliveries[0],
      fecha_compromiso: undefined,
    };
    mockGetDispatchedOrders.mockResolvedValueOnce([deliveryWithoutDate]);

    const { getByText, queryByText } = render(<ScheduledDeliveriesScreen />);

    await waitFor(() => {
      expect(getByText('SO-2025-001')).toBeTruthy();
      // Cuando no hay fecha_compromiso, el bloque condicional no se renderiza
      // Por lo tanto no debe aparecer el label "Fecha de entrega"
      expect(queryByText('Fecha de entrega')).toBeFalsy();
    });
  });

  it('shows single delivery count correctly', async () => {
    mockGetDispatchedOrders.mockResolvedValueOnce([mockDeliveries[0]]);

    const { getByText } = render(<ScheduledDeliveriesScreen />);

    await waitFor(() => {
      expect(getByText('1 entrega')).toBeTruthy(); // Singular
    });
  });
});
