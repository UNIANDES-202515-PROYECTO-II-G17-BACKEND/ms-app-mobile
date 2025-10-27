const BASE_URL = 'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1';

import { getUserCountry } from './storageService';

export interface OrderItem {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  impuesto_pct: number;
  descuento_pct?: number | null;
  sku?: string;
}

export interface CreateOrderRequest {
  tipo: string;
  cliente_id: number;
  vendedor_id: number;
  bodega_origen_id: string;
  fecha_entrega?: string;
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
  fecha_compromiso?: string;
  observaciones?: string;
  direccion?: string;
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
  try {
    const userCountry = country || await getUserCountry();
    
    // Asegurar que los números son números y no strings
    const sanitizedData = {
      ...orderData,
      items: orderData.items.map(item => ({
        ...item,
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
        impuesto_pct: Number(item.impuesto_pct),
        descuento_pct: item.descuento_pct ? Number(item.descuento_pct) : undefined
      }))
    };
    
    console.log('Enviando pedido:', JSON.stringify(sanitizedData, null, 2));
    
    const response = await fetch(`${BASE_URL}/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Country': userCountry,
      },
      body: JSON.stringify(sanitizedData),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text);
      throw new Error(`Failed to create order: ${response.status} ${text}`);
    }

    const result = await response.json();
    console.log('Pedido creado exitosamente:', result);
    return result;
  } catch (error) {
    console.error('Error al crear el pedido:', error);
    
    // Verificar si es un error de red/CORS
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet o que el API esté disponible.');
    }
    
    throw error;
  }
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

  const orders = await response.json();
  
  // Convertir precio_unitario de string a número en los items
  return orders.map((order: Order) => ({
    ...order,
    items: order.items.map(item => ({
      ...item,
      precio_unitario: typeof item.precio_unitario === 'string' 
        ? parseFloat(item.precio_unitario) 
        : item.precio_unitario,
      impuesto_pct: typeof item.impuesto_pct === 'string'
        ? parseFloat(item.impuesto_pct)
        : item.impuesto_pct,
      descuento_pct: item.descuento_pct && typeof item.descuento_pct === 'string'
        ? parseFloat(item.descuento_pct)
        : item.descuento_pct,
    })),
  }));
};

/**
 * Obtiene los pedidos con estado DESPACHADO
 * @param country - País del usuario (opcional, se obtiene de storage si no se provee)
 * @param params - Parámetros opcionales (limit, offset)
 * @returns Promise con la lista de pedidos despachados
 */
export const getDispatchedOrders = async (
  country?: string,
  params?: Omit<GetOrdersParams, 'estado'>
): Promise<Order[]> => {
  return getOrders(country, {
    ...params,
    estado: 'DESPACHADO',
  });
};

export default {
  createOrder,
  getOrders,
  getDispatchedOrders,
};
