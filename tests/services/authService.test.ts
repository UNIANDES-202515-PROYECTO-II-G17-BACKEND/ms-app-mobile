import { login, register, type RegisterRequest } from '../../app/services/authService';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('authService', () => {
  const mockSuccessResponse = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'Bearer',
    expires_in: 3600
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('login', () => {
    it('should call API with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
        text: () => Promise.resolve(''),
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      } as Response;
      mockFetch.mockResolvedValueOnce(mockResponse);

      const username = 'testuser';
      const password = 'testpass';
      const country = 'mx';

      await login(username, password, country);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Country': country,
          },
          body: JSON.stringify({ username, password }),
        }
      );
    });

    it('should return auth response on success', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
        text: () => Promise.resolve(''),
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      } as Response;
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await login('user', 'pass', 'mx');
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should throw error on API failure', async () => {
      const errorMessage = 'Invalid credentials';
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve(errorMessage),
        json: () => Promise.reject(new Error('Should not be called')),
        headers: new Headers(),
      } as Response;
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(login('user', 'wrong', 'mx'))
        .rejects
        .toThrow('Login failed: 401 Invalid credentials');
    });

    it('should use mx as default country if not provided', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
        text: () => Promise.resolve(''),
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      } as Response;
      mockFetch.mockResolvedValueOnce(mockResponse);

      await login('user', 'pass');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Country': 'mx'
          })
        })
      );
    });

    it('should accept valid country codes', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
        text: () => Promise.resolve(''),
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      } as Response;
      
      const validCountries = ['mx', 'co', 'pe', 'ar'] as const;
      for (const country of validCountries) {
        mockFetch.mockResolvedValueOnce(mockResponse);
        await login('user', 'pass', country);
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-Country': country
            })
          })
        );
      }
    });

    it('should handle non-JSON error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Internal server error'),
        json: () => Promise.reject(new Error('Invalid JSON')),
        headers: new Headers(),
      } as Response;
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(login('user', 'pass'))
        .rejects
        .toThrow('Login failed: 500 Internal server error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(login('user', 'pass'))
        .rejects
        .toThrow('Network error');
    });
  });

  describe('register', () => {
    const mockRegisterData: RegisterRequest = {
      username: 'testuser',
      password: 'testpass',
      institution_name: 'Test Hospital',
    };

    it('should call API with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(''),
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      } as Response;
      mockFetch.mockResolvedValueOnce(mockResponse);

      const country = 'co';
      await register(mockRegisterData, country);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Country': country,
          },
          body: JSON.stringify({
            ...mockRegisterData,
            role: 'institutional_customer',
          }),
        }
      );
    });

    it('should use mx as default country if not provided', async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(''),
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      } as Response;
      mockFetch.mockResolvedValueOnce(mockResponse);

      await register(mockRegisterData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Country': 'mx'
          })
        })
      );
    });

    it('should throw error on API failure', async () => {
      const errorMessage = 'Username already exists';
      const mockResponse = {
        ok: false,
        status: 409,
        statusText: 'Conflict',
        text: () => Promise.resolve(errorMessage),
        headers: new Headers(),
      } as Response;
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(register(mockRegisterData))
        .rejects
        .toThrow('Registration failed: 409 Username already exists');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(register(mockRegisterData))
        .rejects
        .toThrow('Network error');
    });

    it('should always set role as institutional_customer', async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(''),
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      } as Response;
      mockFetch.mockResolvedValueOnce(mockResponse);

      const customData = {
        ...mockRegisterData,
        role: 'admin' // intentar enviar un rol diferente
      };

      await register(customData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            ...customData,
            role: 'institutional_customer', // debería sobrescribir el rol
          }),
        })
      );
    });

    it('should handle non-JSON error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Internal server error'),
        headers: new Headers(),
      } as Response;
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(register(mockRegisterData))
        .rejects
        .toThrow('Registration failed: 500 Internal server error');
    });

    it('should accept all valid country codes', async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(''),
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      } as Response;
      
      const validCountries = ['mx', 'co', 'pe', 'ar'] as const;
      for (const country of validCountries) {
        mockFetch.mockResolvedValueOnce(mockResponse);
        await register(mockRegisterData, country);
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-Country': country
            })
          })
        );
      }
    });
  });
});