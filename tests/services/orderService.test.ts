import { createOrder, getDispatchedOrders, getOrders } from '../../app/services/orderService';
import { getUserCountry } from '../../app/services/storageService';

// Mock global fetch
global.fetch = jest.fn();

// Mock storageService
jest.mock('../../app/services/storageService', () => ({
  getUserCountry: jest.fn(),
}));

const mockGetUserCountry = getUserCountry as jest.MockedFunction<typeof getUserCountry>;

describe('orderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const mockOrderPayload = {
        tipo: 'VENTA',
        cliente_id: 12345,
        vendedor_id: 9001,
        bodega_origen_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        items: [
          {
            producto_id: '11111111-1111-1111-1111-111111111111',
            cantidad: 5,
            precio_unitario: 18000.0,
            impuesto_pct: 19,
          },
        ],
        observaciones: 'Venta a cliente institucional',
      };

      const mockResponse = {
        id: 'order-123',
        ...mockOrderPayload,
        fecha_creacion: '2025-10-16T00:00:00Z',
        estado: 'PENDIENTE',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createOrder(mockOrderPayload, 'co');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/pedidos',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Country': 'co',
          },
          body: JSON.stringify(mockOrderPayload),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error when order creation fails', async () => {
      const mockOrderPayload = {
        tipo: 'VENTA',
        cliente_id: 12345,
        vendedor_id: 9001,
        bodega_origen_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        items: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      await expect(createOrder(mockOrderPayload, 'co')).rejects.toThrow(
        'Failed to create order: 400 Bad Request'
      );
    });

    it('should handle network errors', async () => {
      const mockOrderPayload = {
        tipo: 'VENTA',
        cliente_id: 12345,
        vendedor_id: 9001,
        bodega_origen_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        items: [],
      };

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(createOrder(mockOrderPayload, 'co')).rejects.toThrow('Network error');
    });

    it('should use country from storage when not provided', async () => {
      mockGetUserCountry.mockResolvedValue('mx' as any);

      const mockOrderPayload = {
        tipo: 'VENTA',
        cliente_id: 12345,
        vendedor_id: 9001,
        bodega_origen_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        items: [
          {
            producto_id: '11111111-1111-1111-1111-111111111111',
            cantidad: 5,
            precio_unitario: 18000.0,
            impuesto_pct: 19,
          },
        ],
      };

      const mockResponse = {
        id: 'order-123',
        ...mockOrderPayload,
        fecha_creacion: '2025-10-16T00:00:00Z',
        estado: 'PENDIENTE',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await createOrder(mockOrderPayload);

      expect(mockGetUserCountry).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Country': 'mx',
          }),
        })
      );
    });
  });

  // Mock data compartido para tests de getOrders y getDispatchedOrders
  const mockOrders = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      codigo: 'SO-2025-000001',
      tipo: 'VENTA',
      estado: 'PENDIENTE',
      proveedor_id: null,
      oc_id: null,
      cliente_id: 123,
      vendedor_id: 456,
      bodega_origen_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      bodega_destino_id: null,
      total: '100000.00',
      items: [
        {
          producto_id: 'prod-1',
          cantidad: 5,
          precio_unitario: 20000,
          impuesto_pct: 19,
        },
      ],
      fecha_creacion: '2025-10-16T10:00:00Z',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      codigo: 'SO-2025-000002',
      tipo: 'VENTA',
      estado: 'COMPLETADO',
      proveedor_id: null,
      oc_id: null,
      cliente_id: 123,
      vendedor_id: 789,
      bodega_origen_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      bodega_destino_id: null,
      total: '250000.00',
      items: [
        {
          producto_id: 'prod-2',
          cantidad: 10,
          precio_unitario: 25000,
          impuesto_pct: 19,
        },
      ],
      fecha_creacion: '2025-10-15T14:30:00Z',
    },
  ];

  describe('getOrders', () => {
    it('should fetch orders successfully with default parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrders,
      });

      const result = await getOrders('co');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/pedidos?limit=50&offset=0',
        {
          method: 'GET',
          headers: {
            'X-Country': 'co',
          },
        }
      );
      expect(result).toEqual(mockOrders);
    });

    it('should fetch orders with custom parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrders,
      });

      const result = await getOrders('co', {
        tipo: 'VENTA',
        estado: 'PENDIENTE',
        limit: 100,
        offset: 10,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/pedidos?tipo=VENTA&estado=PENDIENTE&limit=100&offset=10',
        {
          method: 'GET',
          headers: {
            'X-Country': 'co',
          },
        }
      );
      expect(result).toEqual(mockOrders);
    });

    it('should fetch orders with partial parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockOrders[0]],
      });

      const result = await getOrders('co', {
        tipo: 'VENTA',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/pedidos?tipo=VENTA&limit=50&offset=0',
        {
          method: 'GET',
          headers: {
            'X-Country': 'co',
          },
        }
      );
      expect(result).toEqual([mockOrders[0]]);
    });

    it('should use country from storage when not provided', async () => {
      mockGetUserCountry.mockResolvedValue('ar' as any);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrders,
      });

      await getOrders(undefined, { tipo: 'VENTA' });

      expect(mockGetUserCountry).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('pedidos'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Country': 'ar',
          }),
        })
      );
    });

    it('should throw an error when fetching orders fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(getOrders('co')).rejects.toThrow(
        'Failed to fetch orders: 500 Internal Server Error'
      );
    });

    it('should handle network errors when fetching orders', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network timeout'));

      await expect(getOrders('co')).rejects.toThrow('Network timeout');
    });

    it('should handle empty orders list', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await getOrders('co', { estado: 'CANCELADO' });

      expect(result).toEqual([]);
    });
  });

  describe('getDispatchedOrders', () => {
    it('should fetch dispatched orders with default parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrders,
      });

      const result = await getDispatchedOrders('co');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/pedidos?estado=DESPACHADO&limit=50&offset=0',
        {
          method: 'GET',
          headers: {
            'X-Country': 'co',
          },
        }
      );
      expect(result).toEqual(mockOrders);
    });

    it('should fetch dispatched orders with custom limit and offset', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockOrders[0]],
      });

      const result = await getDispatchedOrders('co', {
        limit: 10,
        offset: 5,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/pedidos?estado=DESPACHADO&limit=10&offset=5',
        {
          method: 'GET',
          headers: {
            'X-Country': 'co',
          },
        }
      );
      expect(result).toEqual([mockOrders[0]]);
    });

    it('should use country from storage when not provided', async () => {
      mockGetUserCountry.mockResolvedValue('mx' as any);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrders,
      });

      await getDispatchedOrders();

      expect(mockGetUserCountry).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('estado=DESPACHADO'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Country': 'mx',
          }),
        })
      );
    });

    it('should handle errors when fetching dispatched orders', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      await expect(getDispatchedOrders('co')).rejects.toThrow(
        'Failed to fetch orders: 404 Not Found'
      );
    });

    it('should return empty array when no dispatched orders exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await getDispatchedOrders('co');

      expect(result).toEqual([]);
    });
  });
});
