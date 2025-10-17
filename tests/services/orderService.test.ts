import { createOrder } from '../../app/services/orderService';

// Mock global fetch
global.fetch = jest.fn();

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
  });
});
