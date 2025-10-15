import { login } from '../../app/services/authService';

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
  });
});