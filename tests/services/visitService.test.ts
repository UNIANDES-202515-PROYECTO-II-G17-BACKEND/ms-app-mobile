import { getUserCountry } from '../../app/services/storageService';
import { createVisit, getVisits } from '../../app/services/visitService';

// Mock global fetch
global.fetch = jest.fn();

// Mock storageService
jest.mock('../../app/services/storageService', () => ({
  getUserCountry: jest.fn(),
}));

const mockGetUserCountry = getUserCountry as jest.MockedFunction<typeof getUserCountry>;

describe('visitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVisits', () => {
    it('should fetch visits successfully', async () => {
      const mockVisits = [
        {
          id: 'cb34d1a9-c9ab-4847-af3e-4b2bfe5ecef5',
          id_vendedor: '1',
          id_cliente: '2',
          direccion: 'Cra 45 #12-34, Oficina 502',
          ciudad: 'Medellín',
          contacto: 'Laura Gómez',
          fecha: '2025-11-05',
          estado: 'pendiente',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVisits,
      });

      const result = await getVisits({ id_vendedor: 1 }, 'co');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/visitas?id_vendedor=1',
        {
          method: 'GET',
          headers: {
            'X-Country': 'co',
          },
        }
      );
      expect(result).toEqual(mockVisits);
    });

    it('should handle date filter parameter correctly', async () => {
      const mockVisits: any[] = [];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVisits,
      });

      await getVisits({ id_vendedor: 1, fecha: '2025-11-05' }, 'mx');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/visitas?id_vendedor=1&d=2025-11-05',
        {
          method: 'GET',
          headers: {
            'X-Country': 'mx',
          },
        }
      );
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(getVisits({ id_vendedor: 1 }, 'co')).rejects.toThrow(
        'Failed to fetch visits: 500 Internal Server Error'
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(getVisits({ id_vendedor: 1 }, 'co')).rejects.toThrow(
        'Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      );
    });

    it('should use country from storage when not provided', async () => {
      mockGetUserCountry.mockResolvedValue('mx' as any);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await getVisits({ id_vendedor: 1 });

      expect(mockGetUserCountry).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'X-Country': 'mx',
          },
        })
      );
    });
  });

  describe('createVisit', () => {
    it('should create a visit successfully', async () => {
      const mockVisitData = {
        cliente_id: 1,
        nombre_contacto: 'Dr. García',
        hallazgos_tecnicos: 'Equipo requiere mantenimiento',
        sugerencias_producto: 'Producto X recomendado',
      };

      const mockResponse = {
        id: 'new-visit-id',
        ...mockVisitData,
        fecha_visita: '2025-10-24',
        created_at: '2025-10-24T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createVisit(mockVisitData, 'co');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/visitas',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Country': 'co',
          },
          body: JSON.stringify(mockVisitData),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when creation fails', async () => {
      const mockVisitData = {
        cliente_id: 1,
        nombre_contacto: 'Dr. García',
        hallazgos_tecnicos: 'Equipo requiere mantenimiento',
        sugerencias_producto: 'Producto X recomendado',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      await expect(createVisit(mockVisitData, 'co')).rejects.toThrow(
        'Failed to create visit: 400 Bad Request'
      );
    });

    it('should handle network errors', async () => {
      const mockVisitData = {
        cliente_id: 1,
        nombre_contacto: 'Dr. García',
        hallazgos_tecnicos: 'Equipo requiere mantenimiento',
        sugerencias_producto: 'Producto X recomendado',
      };

      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(createVisit(mockVisitData, 'co')).rejects.toThrow(
        'Error de conexión: No se pudo conectar con el servidor.'
      );
    });
  });
});
