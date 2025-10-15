export type UserRole = 'institutional_customer' | 'admin' | 'provider';

export interface UserInfo {
  id: string;
  username: string;
  role: UserRole;
  institution_name: string;
  is_active: boolean;
  scope: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  full_name: string | null;
  document_type: string | null;
  document_number: string | null;
  email: string | null;
  telephone: string | null;
}

const BASE_URL = 'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1';

let cachedUserInfo: UserInfo | null = null;

export const getCurrentUser = async (country: string): Promise<UserInfo> => {
  // Si tenemos la información en caché y no está expirada, la retornamos
  if (cachedUserInfo && cachedUserInfo.exp * 1000 > Date.now()) {
    return cachedUserInfo;
  }

  const token = await getStoredToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const resp = await fetch(`${BASE_URL}/usuarios/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Country': country,
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to get user info: ${resp.status} ${text}`);
  }

  const userInfo = await resp.json() as UserInfo;
  cachedUserInfo = userInfo;
  return userInfo;
};

import { getAccessToken } from './storageService';

const getStoredToken = async (): Promise<string | null> => {
  try {
    return await getAccessToken();
  } catch {
    return null;
  }
};

export const clearUserCache = () => {
  cachedUserInfo = null;
};

export const hasRole = async (requiredRole: UserRole, country: string = 'mx'): Promise<boolean> => {
  try {
    const user = await getCurrentUser(country);
    return user.role === requiredRole;
  } catch {
    return false;
  }
};

export default {
  getCurrentUser,
  hasRole,
  clearUserCache,
};