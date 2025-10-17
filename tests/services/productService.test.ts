import { getAllProducts, getProductDetail, getProductLocations } from '../../app/services/productService';

// Mock global fetch
global.fetch = jest.fn();

describe('productService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('should fetch all products successfully', async () => {
      const mockProducts = [
        {
          id: '1',
          sku: 'SKU001',
          nombre: 'Product 1',
          categoria: 'Category 1',
          controlado: false,
        },
        {
          id: '2',
          sku: 'SKU002',
          nombre: 'Product 2',
          categoria: 'Category 2',
          controlado: true,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      const result = await getAllProducts('co', 100, 0);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/inventario/productos/todos?limit=100&offset=0',
        {
          method: 'GET',
          headers: {
            'X-Country': 'co',
          },
        }
      );
      expect(result).toEqual(mockProducts);
    });

    it('should throw an error when fetching products fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(getAllProducts('co', 100, 0)).rejects.toThrow(
        'Failed to fetch products: 500 Internal Server Error'
      );
    });
  });

  describe('getProductDetail', () => {
    it('should fetch product detail successfully', async () => {
      const mockProductDetail = {
        id: '1',
        sku: 'SKU001',
        nombre: 'Product 1',
        categoria: 'Category 1',
        controlado: false,
        stock_total: 100,
        certificaciones: [],
        lotes: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductDetail,
      });

      const result = await getProductDetail('1', 'co');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/inventario/producto/1/detalle',
        {
          method: 'GET',
          headers: {
            'X-Country': 'co',
          },
        }
      );
      expect(result).toEqual(mockProductDetail);
    });

    it('should throw an error when fetching product detail fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      await expect(getProductDetail('999', 'co')).rejects.toThrow(
        'Failed to fetch product detail: 404 Not Found'
      );
    });
  });

  describe('getProductLocations', () => {
    it('should fetch product locations successfully', async () => {
      const mockLocations = [
        {
          bodega_id: 'bodega-1',
          bodega_nombre: 'Bodega Principal',
          stock_disponible: 50,
        },
        {
          bodega_id: 'bodega-2',
          bodega_nombre: 'Bodega Secundaria',
          stock_disponible: 30,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLocations,
      });

      const result = await getProductLocations('product-123', 'co');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/inventario/producto/product-123/ubicaciones',
        {
          method: 'GET',
          headers: {
            'X-Country': 'co',
          },
        }
      );
      expect(result).toEqual(mockLocations);
    });

    it('should throw an error when fetching product locations fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      });

      await expect(getProductLocations('product-123', 'co')).rejects.toThrow(
        'Failed to fetch product locations: 403 Forbidden'
      );
    });
  });
});
