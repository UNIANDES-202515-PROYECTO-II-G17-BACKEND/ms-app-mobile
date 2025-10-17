const BASE_URL = 'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1';

export interface OrderItem {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  impuesto_pct: number;
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

export const createOrder = async (
  orderData: CreateOrderRequest,
  country: string
): Promise<CreateOrderResponse> => {
  const response = await fetch(`${BASE_URL}/pedidos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Country': country,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create order: ${response.status} ${text}`);
  }

  return await response.json();
};

export default {
  createOrder,
};
