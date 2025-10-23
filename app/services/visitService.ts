const BASE_URL = 'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1';

import { getAccessToken, getUserCountry } from './storageService';

export interface CreateVisitRequest {
  cliente_id: number;
  nombre_contacto: string;
  hallazgos_tecnicos: string;
  sugerencias_producto: string;
}

export interface Visit {
  id: number;
  cliente_id: number;
  vendedor_id: number;
  nombre_contacto: string;
  hallazgos_tecnicos: string;
  sugerencias_producto: string;
  fecha_visita: string;
  created_at: string;
  updated_at: string | null;
}

export const createVisit = async (visitData: CreateVisitRequest): Promise<Visit> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const userCountry = await getUserCountry();

  const response = await fetch(`${BASE_URL}/visitas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Country': userCountry,
    },
    body: JSON.stringify(visitData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create visit: ${response.status} ${errorText}`);
  }

  return await response.json();
};

export const getVisits = async (
  clienteId?: number,
  limit: number = 50,
  offset: number = 0
): Promise<Visit[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const userCountry = await getUserCountry();
  
  let url = `${BASE_URL}/visitas?limit=${limit}&offset=${offset}`;
  if (clienteId) {
    url += `&cliente_id=${clienteId}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Country': userCountry,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch visits: ${response.status} ${errorText}`);
  }

  return await response.json();
};
