export type UserRole = 'institutional_customer' | 'admin' | 'seller';

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

export interface InstitutionalCustomer {
  id: number;
  username: string;
  role: UserRole;
  institution_name: string;
  full_name: string | null;
  document_type: string | null;
  document_number: string | null;
  email: string | null;
  telephone: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Seller {
  id: number;
  username: string;
  role: UserRole;
  institution_name: string;
  full_name: string | null;
  document_type: string | null;
  document_number: string | null;
  email: string | null;
  telephone: string | null;
  created_at: string;
  updated_at: string | null;
}

const BASE_URL = 'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1';

let cachedUserInfo: UserInfo | null = null;

export const getCurrentUser = async (country?: string): Promise<UserInfo> => {
  // Si tenemos la información en caché y no está expirada, la retornamos
  if (cachedUserInfo && cachedUserInfo.exp * 1000 > Date.now()) {
    return cachedUserInfo;
  }

  const token = await getStoredToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Si no se proporciona el país, obtenerlo del storage
  const userCountry = country || await getUserCountry();

  const resp = await fetch(`${BASE_URL}/usuarios/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Country': userCountry,
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

import { getAccessToken, getUserCountry } from './storageService';

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

export const hasRole = async (requiredRole: UserRole, country?: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser(country);
    return user.role === requiredRole;
  } catch {
    return false;
  }
};

export const getInstitutionalCustomers = async (
  country?: string,
  limit: number = 50,
  offset: number = 0
): Promise<InstitutionalCustomer[]> => {
  const userCountry = country || await getUserCountry();
  
  const response = await fetch(
    `${BASE_URL}/usuarios?role=institutional_customer&limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        'X-Country': userCountry,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch institutional customers: ${response.status} ${text}`);
  }

  const customers = await response.json() as InstitutionalCustomer[];
  return customers;
};

export const getSellers = async (
  country?: string,
  limit: number = 50,
  offset: number = 0
): Promise<Seller[]> => {
  const userCountry = country || await getUserCountry();
  
  const response = await fetch(
    `${BASE_URL}/usuarios?role=seller&limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        'X-Country': userCountry,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch sellers: ${response.status} ${text}`);
  }

  const sellers = await response.json() as Seller[];
  console.log('Sellers from API:', sellers);
  return sellers;
};

export default {
  getCurrentUser,
  hasRole,
  clearUserCache,
  getInstitutionalCustomers,
  getSellers,
};