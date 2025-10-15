import { clearAuth, getAccessToken, getAuth, saveAuth } from '../../app/services/storageService';

// Mock the module factory
const mockMultiSet = jest.fn();
const mockMultiRemove = jest.fn();
const mockGetItem = jest.fn();
const mockMultiGet = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    multiSet: mockMultiSet,
    multiRemove: mockMultiRemove,
    getItem: mockGetItem,
    multiGet: mockMultiGet,
  },
}));

describe('storageService', () => {
  beforeEach(() => {
    // Reset mock implementations
    mockMultiSet.mockReset();
    mockMultiRemove.mockReset();
    mockGetItem.mockReset();
    mockMultiGet.mockReset();

    // Default success responses
    mockMultiSet.mockResolvedValue(undefined);
    mockMultiRemove.mockResolvedValue(undefined);
    mockGetItem.mockResolvedValue(null);
    mockMultiGet.mockResolvedValue([]);
  });

  describe('saveAuth', () => {
    const mockAuth = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600
    };

    it('should save all tokens to AsyncStorage', async () => {
      const mockNow = 1000000000;
      jest.spyOn(Date, 'now').mockImplementation(() => mockNow);

      await saveAuth(mockAuth);

      expect(mockMultiSet).toHaveBeenCalledWith([
        ['access_token', mockAuth.access_token],
        ['refresh_token', mockAuth.refresh_token],
        ['expires_at', String(mockNow / 1000 + mockAuth.expires_in)],
      ]);

      jest.restoreAllMocks(); // restore Date.now
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      const mockError = new Error('Storage error');
      mockMultiSet.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      await saveAuth(mockAuth);

      expect(consoleSpy).toHaveBeenCalledWith('Failed saving auth tokens', mockError);
      consoleSpy.mockRestore();
    });
  });

  describe('clearAuth', () => {
    it('should remove all auth tokens from AsyncStorage', async () => {
      await clearAuth();

      expect(mockMultiRemove).toHaveBeenCalledWith([
        'access_token',
        'refresh_token',
        'expires_at'
      ]);
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      const mockError = new Error('Storage error');
      mockMultiRemove.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      await clearAuth();

      expect(consoleSpy).toHaveBeenCalledWith('Failed clearing auth tokens', mockError);
      consoleSpy.mockRestore();
    });
  });

  describe('getAccessToken', () => {
    it('should return token from AsyncStorage', async () => {
      const mockToken = 'test-access-token';
      mockGetItem.mockResolvedValue(mockToken);

      const result = await getAccessToken();

      expect(mockGetItem).toHaveBeenCalledWith('access_token');
      expect(result).toBe(mockToken);
    });

    it('should return null on AsyncStorage error', async () => {
      mockGetItem.mockRejectedValue(new Error('Storage error'));

      const result = await getAccessToken();

      expect(result).toBeNull();
    });

    it('should return null when token not found', async () => {
      mockGetItem.mockResolvedValue(null);

      const result = await getAccessToken();

      expect(result).toBeNull();
    });
  });

  describe('getAuth', () => {
    it('should return AuthResponse when all tokens are present', async () => {
      const mockNow = 1000000000;
      const expiresAt = mockNow / 1000 + 3600;
      
      jest.spyOn(Date, 'now').mockImplementation(() => mockNow);
      
      mockMultiGet.mockResolvedValue([
        ['access_token', 'test-access-token'],
        ['refresh_token', 'test-refresh-token'],
        ['expires_at', String(expiresAt)],
      ]);

      const result = await getAuth();

      expect(mockMultiGet).toHaveBeenCalledWith([
        'access_token',
        'refresh_token',
        'expires_at',
      ]);
      expect(result).toEqual({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });

      jest.restoreAllMocks();
    });

    it('should return null when access token is missing', async () => {
      mockMultiGet.mockResolvedValue([
        ['access_token', null],
        ['refresh_token', 'test-refresh-token'],
        ['expires_at', '1000000000'],
      ]);

      const result = await getAuth();

      expect(result).toBeNull();
    });

    it('should return null when refresh token is missing', async () => {
      mockMultiGet.mockResolvedValue([
        ['access_token', 'test-access-token'],
        ['refresh_token', null],
        ['expires_at', '1000000000'],
      ]);

      const result = await getAuth();

      expect(result).toBeNull();
    });

    it('should return null when expires_at is missing', async () => {
      mockMultiGet.mockResolvedValue([
        ['access_token', 'test-access-token'],
        ['refresh_token', 'test-refresh-token'],
        ['expires_at', null],
      ]);

      const result = await getAuth();

      expect(result).toBeNull();
    });

    it('should return null on AsyncStorage error', async () => {
      mockMultiGet.mockRejectedValue(new Error('Storage error'));

      const result = await getAuth();

      expect(result).toBeNull();
    });
  });
});