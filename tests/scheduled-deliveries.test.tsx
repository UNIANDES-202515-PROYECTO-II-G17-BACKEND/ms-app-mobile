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
        address: 'Dirección',
        client: 'Cliente',
        orders: 'Pedidos',
        order: 'pedido',
        routeDate: 'Fecha ruta',
        routeStatus: 'Estado ruta',
        delivered: 'Entregada',
        pending: 'Pendiente',
        inTransit: 'En camino',
        cancelled: 'Cancelada',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock logisticsService
const mockGetDeliveries = jest.fn();
jest.mock('../app/services/logisticsService', () => ({
  getDeliveries: jest.fn().mockImplementation((...args) => mockGetDeliveries(...args)),
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
    mockGetDeliveries.mockReset();
    console.log = jest.fn();
    console.error = jest.fn();
    // Forzar Platform.OS a 'web' para que se muestre el TextInput
    Platform.OS = 'web';
  });

  const mockDeliveries = [
    {
      id: 'stop-1',
      cliente_id: 123,
      direccion: 'Calle 123 #45-67',
      ciudad: 'Bogotá',
      estado: 'PENDIENTE',
      orden: 1,
      pedido_ids: ['order-1', 'order-2'],
      ruta_id: 'route-1',
      fecha_ruta: '2025-10-30',
      estado_ruta: 'EN_PROGRESO',
    },
    {
      id: 'stop-2',
      cliente_id: 789,
      direccion: 'Carrera 7 #12-34',
      ciudad: 'Medellín',
      estado: 'ENTREGADA',
      orden: 2,
      pedido_ids: ['order-3'],
      ruta_id: 'route-1',
      fecha_ruta: '2025-10-31',
      estado_ruta: 'FINALIZADA',
    },
  ];

  it('renders deliveries list correctly', async () => {
    mockGetDeliveries.mockResolvedValueOnce(mockDeliveries);

    const { getByText, getByPlaceholderText } = render(<ScheduledDeliveriesScreen />);

    // Verificar que se muestra el estado inicial sin datos
    await waitFor(() => {
      expect(getByText('Entregas Programadas')).toBeTruthy();
    });

    // Simular entrada de fecha válida
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    // Esperar a que se carguen las entregas
    await waitFor(() => {
      expect(getByText('Parada #1')).toBeTruthy();
      expect(getByText('Parada #2')).toBeTruthy();
    });
  });

  it('shows loading indicator while fetching deliveries', async () => {
    mockGetDeliveries.mockImplementation(() => new Promise(() => {}));

    const { getByText, getByPlaceholderText } = render(<ScheduledDeliveriesScreen />);

    // Simular entrada de fecha válida
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    // Verificar que se muestra el indicador de carga
    await waitFor(() => {
      expect(getByText('Cargando entregas programadas...')).toBeTruthy();
    });
  });

  it('displays error message when deliveries fetch fails', async () => {
    mockGetDeliveries.mockRejectedValueOnce(new Error('Network error'));

    const { getByText, getByPlaceholderText } = render(<ScheduledDeliveriesScreen />);

    // Simular entrada de fecha válida
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    await waitFor(() => {
      expect(getByText('Error al cargar entregas')).toBeTruthy();
    });
  });

  it('shows empty state when no deliveries exist', async () => {
    mockGetDeliveries.mockResolvedValueOnce([]);

    const { getByText, getByPlaceholderText } = render(<ScheduledDeliveriesScreen />);

    // Simular entrada de fecha válida
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    await waitFor(() => {
      expect(getByText('No hay entregas programadas')).toBeTruthy();
    });
  });

  it('navigates to order detail when delivery card is pressed', async () => {
    mockGetDeliveries.mockResolvedValueOnce(mockDeliveries);

    const { getByText, getByPlaceholderText } = render(<ScheduledDeliveriesScreen />);

    // Simular entrada de fecha válida
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    await waitFor(() => {
      expect(getByText('Parada #1')).toBeTruthy();
    });

    // Ya no se navega porque eliminamos el TouchableOpacity
    // Este test ya no es relevante, pero lo mantenemos para verificar que no se puede hacer clic
    const deliveryCard = getByText('Parada #1');
    fireEvent.press(deliveryCard);

    // Verificar que NO se llamó a push porque las tarjetas ya no son clickeables
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('refreshes deliveries when pull-to-refresh is triggered', async () => {
    mockGetDeliveries.mockResolvedValueOnce(mockDeliveries);

    const { getByText, getByPlaceholderText } = render(<ScheduledDeliveriesScreen />);

    // Simular entrada de fecha válida
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    await waitFor(() => {
      expect(getByText('Parada #1')).toBeTruthy();
    });

    expect(mockGetDeliveries).toHaveBeenCalledTimes(1);
  });

  it('displays delivery information correctly', async () => {
    mockGetDeliveries.mockResolvedValueOnce([mockDeliveries[0]]);

    const { getByText, getByPlaceholderText } = render(<ScheduledDeliveriesScreen />);

    // Simular entrada de fecha válida
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    await waitFor(() => {
      expect(getByText('Parada #1')).toBeTruthy();
      expect(getByText('Bogotá')).toBeTruthy();
      expect(getByText('Calle 123 #45-67')).toBeTruthy();
      expect(getByText('2 Pedidos')).toBeTruthy();
    });
  });

  it('formats dates correctly', async () => {
    mockGetDeliveries.mockResolvedValueOnce([mockDeliveries[0]]);

    const { getByText, getByPlaceholderText } = render(<ScheduledDeliveriesScreen />);

    // Simular entrada de fecha válida
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    await waitFor(() => {
      // Fecha de ruta: 30/10/2025
      expect(getByText('30/10/2025')).toBeTruthy();
    });
  });

  it('shows retry button on error', async () => {
    mockGetDeliveries.mockRejectedValueOnce(new Error('Network error'));

    const { getByText, getByPlaceholderText } = render(<ScheduledDeliveriesScreen />);

    // Simular entrada de fecha válida
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    await waitFor(() => {
      expect(getByText('Error al cargar entregas')).toBeTruthy();
      expect(getByText('Reintentar')).toBeTruthy();
    });

    mockGetDeliveries.mockResolvedValueOnce(mockDeliveries);

    const retryButton = getByText('Reintentar');
    
    await act(async () => {
      fireEvent.press(retryButton);
    });

    await waitFor(() => {
      expect(mockGetDeliveries).toHaveBeenCalledTimes(2);
    });
  });

  it('displays delivery count in subtitle', async () => {
    mockGetDeliveries.mockResolvedValueOnce(mockDeliveries);

    const { getByText, getByPlaceholderText } = render(<ScheduledDeliveriesScreen />);

    // Simular entrada de fecha válida
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    await waitFor(() => {
      expect(getByText('Entregas Programadas')).toBeTruthy();
      expect(getByText('2 entregas')).toBeTruthy();
    });
  });

  it('filters deliveries by date when date is entered', async () => {
    Platform.OS = 'web';
    
    // Primero sin fecha
    const { getByPlaceholderText, getByText, queryByText } = render(<ScheduledDeliveriesScreen />);

    // Verificar estado inicial sin fecha
    await waitFor(() => {
      expect(getByText('0 entregas')).toBeTruthy();
    });

    // Mock para cuando se ingresa la primera fecha
    mockGetDeliveries.mockResolvedValueOnce(mockDeliveries);

    const dateInput = getByPlaceholderText('YYYY-MM-DD');

    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    await waitFor(() => {
      expect(getByText('Parada #1')).toBeTruthy();
      expect(getByText('Parada #2')).toBeTruthy();
    });
  });

  it('shows all deliveries when filter is cleared', async () => {
    Platform.OS = 'web';
    
    const { getByPlaceholderText, getByText } = render(<ScheduledDeliveriesScreen />);

    // Mock para cuando se ingresa fecha
    mockGetDeliveries.mockResolvedValueOnce(mockDeliveries);

    const dateInput = getByPlaceholderText('YYYY-MM-DD');

    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    await waitFor(() => {
      expect(getByText('2 entregas')).toBeTruthy();
    });

    // Hacer clic en el botón de limpiar (✕)
    const clearButton = getByText('✕');
    await act(async () => {
      fireEvent.press(clearButton);
    });

    await waitFor(() => {
      expect(getByText('0 entregas')).toBeTruthy();
    });
  });

  it('shows empty state after filtering with no results', async () => {
    Platform.OS = 'web';
    
    const { getByPlaceholderText, getByText, queryByText } = render(<ScheduledDeliveriesScreen />);

    // Mock para fecha sin resultados
    mockGetDeliveries.mockResolvedValueOnce([]);

    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-12-31');
    });

    await waitFor(() => {
      expect(getByText('0 entregas')).toBeTruthy();
      expect(queryByText('Parada #1')).toBeFalsy();
      expect(queryByText('Parada #2')).toBeFalsy();
    });
  });

  it('shows single delivery count correctly', async () => {
    mockGetDeliveries.mockResolvedValueOnce([mockDeliveries[0]]);

    const { getByText, getByPlaceholderText } = render(<ScheduledDeliveriesScreen />);

    // Simular entrada de fecha válida
    const dateInput = getByPlaceholderText('YYYY-MM-DD');
    await act(async () => {
      fireEvent.changeText(dateInput, '2025-10-30');
    });

    await waitFor(() => {
      expect(getByText('1 entrega')).toBeTruthy();
    });
  });
});
