export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

const BASE_URL = 'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1';

export type CountryCode = 'mx' | 'co' | 'pe' | 'ar';

export const login = async (username: string, password: string, country: CountryCode = 'mx'): Promise<AuthResponse> => {
  const url = `${BASE_URL}/auth/login`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Country': country,
    },
    body: JSON.stringify({ username, password }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Login failed: ${resp.status} ${text}`);
  }

  const data = (await resp.json()) as AuthResponse;
  return data;
};

export default { login };
