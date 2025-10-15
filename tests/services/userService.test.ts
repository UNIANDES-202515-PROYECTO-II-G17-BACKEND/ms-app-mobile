import { getAccessToken } from '../../app/services/storageService';
import { clearUserCache, getCurrentUser, hasRole, type UserInfo } from '../../app/services/userService';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock storageService
jest.mock('../../app/services/storageService', () => ({
  getAccessToken: jest.fn(),
}));

const mockGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;

describe('userService', () => {
  const mockUserInfo: UserInfo = {
    id: "2",
    username: "testUser",
    role: "institutional_customer",
    institution_name: "Test Hospital",
    is_active: true,
    scope: "user",
    iss: "ms-usuarios-autenticacion",
    aud: "medisupply-api",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora en el futuro
    full_name: null,
    document_type: null,
    document_number: null,
    email: null,
    telephone: null
  };

  beforeEach(() => {
    mockFetch.mockReset();
    mockGetAccessToken.mockReset();
    clearUserCache();
    jest.clearAllTimers();
  });

  describe('getCurrentUser', () => {
    it('should fetch user info with correct parameters', async () => {
      const mockToken = 'test-access-token';
      const country = 'co';
      
      mockGetAccessToken.mockResolvedValueOnce(mockToken);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      const result = await getCurrentUser(country);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/usuarios/me',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'X-Country': country,
          },
        }
      );
      expect(result).toEqual(mockUserInfo);
    });

    it('should return cached user info if not expired', async () => {
      const mockToken = 'test-access-token';
      mockGetAccessToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      // Primera llamada para cachear
      const result1 = await getCurrentUser('co');
      
      // Segunda llamada debería usar caché
      const result2 = await getCurrentUser('co');

      // Fetch solo debería haberse llamado una vez
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockUserInfo);
      expect(result2).toEqual(mockUserInfo);
    });

    it('should refresh cache if user info is expired', async () => {
      const expiredUserInfo = {
        ...mockUserInfo,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hora en el pasado
      };

      const freshUserInfo = {
        ...mockUserInfo,
        username: 'freshUser',
      };

      const mockToken = 'test-access-token';
      mockGetAccessToken.mockResolvedValue(mockToken);
      
      // Primera llamada con info expirada
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(expiredUserInfo),
      });

      await getCurrentUser('co');

      // Segunda llamada debería refrescar porque está expirado
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(freshUserInfo),
      });

      const result = await getCurrentUser('co');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.username).toBe('freshUser');
    });

    it('should throw error if no token is found', async () => {
      mockGetAccessToken.mockResolvedValueOnce(null);

      await expect(getCurrentUser('co'))
        .rejects
        .toThrow('No authentication token found');
    });

    it('should throw error on API failure', async () => {
      const mockToken = 'test-access-token';
      const errorMessage = 'Invalid token';
      
      mockGetAccessToken.mockResolvedValueOnce(mockToken);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve(errorMessage),
      });

      await expect(getCurrentUser('co'))
        .rejects
        .toThrow('Failed to get user info: 401 Invalid token');
    });

    it('should handle network errors', async () => {
      const mockToken = 'test-access-token';
      
      mockGetAccessToken.mockResolvedValueOnce(mockToken);
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getCurrentUser('co'))
        .rejects
        .toThrow('Network error');
    });

    it('should handle getAccessToken errors', async () => {
      mockGetAccessToken.mockRejectedValueOnce(new Error('Storage error'));

      await expect(getCurrentUser('co'))
        .rejects
        .toThrow('No authentication token found');
    });
  });

  describe('hasRole', () => {
    it('should return true if user has required role', async () => {
      const mockToken = 'test-access-token';
      mockGetAccessToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      const result = await hasRole('institutional_customer', 'co');
      expect(result).toBe(true);
    });

    it('should return false if user has different role', async () => {
      const mockToken = 'test-access-token';
      const adminUser = { ...mockUserInfo, role: 'admin' as const };
      
      mockGetAccessToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(adminUser),
      });

      const result = await hasRole('institutional_customer', 'co');
      expect(result).toBe(false);
    });

    it('should return false on any error', async () => {
      mockGetAccessToken.mockResolvedValueOnce(null);

      const result = await hasRole('institutional_customer', 'co');
      expect(result).toBe(false);
    });

    it('should use mx as default country', async () => {
      const mockToken = 'test-access-token';
      mockGetAccessToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      await hasRole('institutional_customer');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Country': 'mx'
          })
        })
      );
    });

    it('should return false on API errors', async () => {
      const mockToken = 'test-access-token';
      
      mockGetAccessToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      const result = await hasRole('institutional_customer', 'co');
      expect(result).toBe(false);
    });

    it('should handle all supported roles', async () => {
      const mockToken = 'test-access-token';
      mockGetAccessToken.mockResolvedValue(mockToken);

      const roles: Array<{ role: 'institutional_customer' | 'admin' | 'provider', expected: boolean }> = [
        { role: 'institutional_customer', expected: true },
        { role: 'admin', expected: false },
        { role: 'provider', expected: false },
      ];

      for (const { role, expected } of roles) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserInfo),
        });

        const result = await hasRole(role, 'co');
        expect(result).toBe(expected);
        
        clearUserCache(); // Clear cache between tests
      }
    });
  });

  describe('clearUserCache', () => {
    it('should clear cached user info', async () => {
      const mockToken = 'test-access-token';
      mockGetAccessToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      // Hacer una llamada para cachear
      await getCurrentUser('co');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Limpiar caché
      clearUserCache();

      // La siguiente llamada debería hacer fetch nuevamente
      await getCurrentUser('co');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle malformed JSON responses', async () => {
      const mockToken = 'test-access-token';
      
      mockGetAccessToken.mockResolvedValueOnce(mockToken);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(getCurrentUser('co'))
        .rejects
        .toThrow('Invalid JSON');
    });

    it('should handle empty token string', async () => {
      mockGetAccessToken.mockResolvedValueOnce('');

      await expect(getCurrentUser('co'))
        .rejects
        .toThrow('No authentication token found');
    });

    it('should handle different country codes', async () => {
      const mockToken = 'test-access-token';
      const countries = ['mx', 'co', 'pe', 'ar'];
      
      mockGetAccessToken.mockResolvedValue(mockToken);

      for (const country of countries) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserInfo),
        });

        await getCurrentUser(country);
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-Country': country
            })
          })
        );

        clearUserCache(); // Clear cache between tests
      }
    });
  });
});