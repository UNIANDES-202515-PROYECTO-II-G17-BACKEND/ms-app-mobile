import { getDeliveries, getRoutes, Route } from '../../app/services/logisticsService';
import * as storageService from '../../app/services/storageService';

// Mock del módulo de storage
jest.mock('../../app/services/storageService');

// Mock de fetch
global.fetch = jest.fn();

describe('logisticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storageService.getUserCountry as jest.Mock).mockResolvedValue('co');
  });

  describe('getRoutes', () => {
    it('should fetch routes successfully without date filter', async () => {
      const mockRoutes: Route[] = [
        {
          id: '394be241-23a3-4d73-9d97-3f67e4f95260',
          fecha: '2025-10-30',
          estado: 'FINALIZADA',
          creado_en: '2025-10-28T23:39:27.701324',
          paradas: [
            {
              id: '24bfce9c-df83-4d02-9e51-831d56e94772',
              cliente_id: 2,
              direccion: 'Cll 63 24 58',
              ciudad: 'Bogotá',
              estado: 'ENTREGADA',
              orden: 1,
              pedido_ids: ['c7431282-7a05-4d66-8f3e-af3e7fa5b397'],
            },
          ],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRoutes,
      });

      const result = await getRoutes();

      // Now the service always sends a date (today's date if not provided)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/logistica/rutas?fecha='),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Country': 'co',
          },
        }
      );
      expect(result).toEqual(mockRoutes);
      expect(result).toHaveLength(1);
      expect(result[0].paradas).toHaveLength(1);
    });

    it('should fetch routes successfully with date filter', async () => {
      const mockRoutes: Route[] = [
        {
          id: '394be241-23a3-4d73-9d97-3f67e4f95260',
          fecha: '2025-11-03',
          estado: 'EN_PROGRESO',
          creado_en: '2025-11-03T08:00:00.000000',
          paradas: [
            {
              id: '24bfce9c-df83-4d02-9e51-831d56e94772',
              cliente_id: 2,
              direccion: 'Cll 63 24 58',
              ciudad: 'Bogotá',
              estado: 'PENDIENTE',
              orden: 1,
              pedido_ids: ['c7431282-7a05-4d66-8f3e-af3e7fa5b397'],
            },
          ],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRoutes,
      });

      const result = await getRoutes('2025-11-03');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/logistica/rutas?fecha=2025-11-03',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Country': 'co',
          },
        }
      );
      expect(result).toEqual(mockRoutes);
    });

    it('should return empty array when no routes found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const result = await getRoutes('2025-12-31');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw error when API returns error status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(getRoutes()).rejects.toThrow('Error al cargar entregas (500): Internal Server Error');
    });

    it('should throw network error with custom message', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(getRoutes()).rejects.toThrow(
        'Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      );
    });

    it('should use correct country header from storage', async () => {
      (storageService.getUserCountry as jest.Mock).mockResolvedValue('mx');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await getRoutes();

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

  describe('getDeliveries', () => {
    it('should flatten routes into deliveries list', async () => {
      const mockRoutes: Route[] = [
        {
          id: 'route-1',
          fecha: '2025-11-03',
          estado: 'EN_PROGRESO',
          creado_en: '2025-11-03T08:00:00.000000',
          paradas: [
            {
              id: 'stop-1',
              cliente_id: 1,
              direccion: 'Dirección 1',
              ciudad: 'Bogotá',
              estado: 'PENDIENTE',
              orden: 1,
              pedido_ids: ['pedido-1'],
            },
            {
              id: 'stop-2',
              cliente_id: 2,
              direccion: 'Dirección 2',
              ciudad: 'Medellín',
              estado: 'EN_CAMINO',
              orden: 2,
              pedido_ids: ['pedido-2', 'pedido-3'],
            },
          ],
        },
        {
          id: 'route-2',
          fecha: '2025-11-03',
          estado: 'FINALIZADA',
          creado_en: '2025-11-03T06:00:00.000000',
          paradas: [
            {
              id: 'stop-3',
              cliente_id: 3,
              direccion: 'Dirección 3',
              ciudad: 'Cali',
              estado: 'ENTREGADA',
              orden: 1,
              pedido_ids: ['pedido-4'],
            },
          ],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRoutes,
      });

      const result = await getDeliveries('2025-11-03');

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        id: 'stop-1',
        cliente_id: 1,
        ruta_id: 'route-1',
        fecha_ruta: '2025-11-03',
        estado_ruta: 'EN_PROGRESO',
      });
      expect(result[1]).toMatchObject({
        id: 'stop-2',
        cliente_id: 2,
        ruta_id: 'route-1',
        fecha_ruta: '2025-11-03',
        estado_ruta: 'EN_PROGRESO',
      });
      expect(result[2]).toMatchObject({
        id: 'stop-3',
        cliente_id: 3,
        ruta_id: 'route-2',
        fecha_ruta: '2025-11-03',
        estado_ruta: 'FINALIZADA',
      });
    });

    it('should return empty array when routes have no stops', async () => {
      const mockRoutes: Route[] = [
        {
          id: 'route-1',
          fecha: '2025-11-03',
          estado: 'EN_PROGRESO',
          creado_en: '2025-11-03T08:00:00.000000',
          paradas: [],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRoutes,
      });

      const result = await getDeliveries();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle multiple orders per delivery', async () => {
      const mockRoutes: Route[] = [
        {
          id: 'route-1',
          fecha: '2025-11-03',
          estado: 'EN_PROGRESO',
          creado_en: '2025-11-03T08:00:00.000000',
          paradas: [
            {
              id: 'stop-1',
              cliente_id: 1,
              direccion: 'Dirección 1',
              ciudad: 'Bogotá',
              estado: 'PENDIENTE',
              orden: 1,
              pedido_ids: ['pedido-1', 'pedido-2', 'pedido-3'],
            },
          ],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRoutes,
      });

      const result = await getDeliveries();

      expect(result).toHaveLength(1);
      expect(result[0].pedido_ids).toHaveLength(3);
      expect(result[0].pedido_ids).toEqual(['pedido-1', 'pedido-2', 'pedido-3']);
    });

    it('should propagate errors from getRoutes', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(getDeliveries()).rejects.toThrow('Network error');
    });
  });
});
