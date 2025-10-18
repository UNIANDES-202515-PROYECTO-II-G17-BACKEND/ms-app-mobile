const BASE_URL = 'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1';

import { getUserCountry } from './storageService';

export interface OrderItem {
  producto_id: string;
  cantidad: number;
  precio_unitario: number | string;
  impuesto_pct: number | string;
  descuento_pct?: number | string | null;
  sku?: string;
}

export interface CreateOrderRequest {
  tipo: string;
  cliente_id: number;
  vendedor_id: number;
  bodega_origen_id: string;
  items: OrderItem[];
  observaciones?: string;
}

export interface CreateOrderResponse {
  id: string;
  tipo: string;
  cliente_id: number;
  vendedor_id: number;
  bodega_origen_id: string;
  items: OrderItem[];
  observaciones?: string;
  fecha_creacion: string;
  estado: string;
}

// Interfaz para el listado de pedidos (basado en la respuesta del API)
export interface Order {
  id: string;
  codigo: string;
  tipo: string;
  estado: string;
  proveedor_id: number | null;
  oc_id: string | null;
  cliente_id: number;
  vendedor_id: number;
  bodega_origen_id: string;
  bodega_destino_id: string | null;
  total: string;
  items: OrderItem[];
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface GetOrdersParams {
  tipo?: string;
  estado?: string;
  limit?: number;
  offset?: number;
}

export const createOrder = async (
  orderData: CreateOrderRequest,
  country?: string
): Promise<CreateOrderResponse> => {
  const userCountry = country || await getUserCountry();
  
  const response = await fetch(`${BASE_URL}/pedidos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Country': userCountry,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create order: ${response.status} ${text}`);
  }

  return await response.json();
};

export const getOrders = async (
  country?: string,
  params?: GetOrdersParams
): Promise<Order[]> => {
  const userCountry = country || await getUserCountry();
  
  const queryParams = new URLSearchParams();
  
  if (params?.tipo) queryParams.append('tipo', params.tipo);
  if (params?.estado) queryParams.append('estado', params.estado);
  queryParams.append('limit', String(params?.limit ?? 50));
  queryParams.append('offset', String(params?.offset ?? 0));

  const url = `${BASE_URL}/pedidos?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Country': userCountry,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch orders: ${response.status} ${text}`);
  }

  return await response.json();
};

export default {
  createOrder,
  getOrders,
};
