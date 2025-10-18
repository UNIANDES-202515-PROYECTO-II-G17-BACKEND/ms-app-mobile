import type { AuthResponse, CountryCode } from './authService';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const EXPIRES_AT_KEY = 'expires_at';
const USER_COUNTRY_KEY = 'user_country';

const getAsyncStorage = () => {
  // require dynamically to avoid native module load during Jest tests
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@react-native-async-storage/async-storage').default;
};

export const saveAuth = async (auth: AuthResponse) => {
  try {
    const AsyncStorage = getAsyncStorage();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + auth.expires_in;
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, auth.access_token],
      [REFRESH_TOKEN_KEY, auth.refresh_token],
      [EXPIRES_AT_KEY, String(expiresAt)],
    ]);
  } catch (e) {
    // ignore storage errors for now
    // eslint-disable-next-line no-console
    console.warn('Failed saving auth tokens', e);
  }
};

export const clearAuth = async () => {
  try {
    const AsyncStorage = getAsyncStorage();
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, EXPIRES_AT_KEY, USER_COUNTRY_KEY]);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed clearing auth tokens', e);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    const AsyncStorage = getAsyncStorage();
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (e) {
    return null;
  }
};

export const getAuth = async (): Promise<AuthResponse | null> => {
  try {
    const AsyncStorage = getAsyncStorage();
    const [accessToken, refreshToken, expiresAt] = await AsyncStorage.multiGet([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      EXPIRES_AT_KEY,
    ]);

    if (!accessToken[1] || !refreshToken[1] || !expiresAt[1]) {
      return null;
    }

    return {
      access_token: accessToken[1],
      refresh_token: refreshToken[1],
      token_type: 'Bearer',
      expires_in: parseInt(expiresAt[1], 10) - Math.floor(Date.now() / 1000),
    };
  } catch (e) {
    return null;
  }
};

// Guardar el país del usuario
export const saveUserCountry = async (country: CountryCode): Promise<void> => {
  try {
    const AsyncStorage = getAsyncStorage();
    await AsyncStorage.setItem(USER_COUNTRY_KEY, country);
  } catch (e) {
    console.warn('Failed saving user country', e);
  }
};

// Obtener el país del usuario
export const getUserCountry = async (): Promise<CountryCode> => {
  try {
    const AsyncStorage = getAsyncStorage();
    const country = await AsyncStorage.getItem(USER_COUNTRY_KEY);
    return (country as CountryCode) || 'co'; // Por defecto 'co'
  } catch (e) {
    console.warn('Failed getting user country', e);
    return 'co';
  }
};

export default { saveAuth, clearAuth, getAccessToken, getAuth, saveUserCountry, getUserCountry };
