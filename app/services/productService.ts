export interface Product {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  controlado: boolean;
}

export interface Certificacion {
  id: string;
  autoridad: string;
  tipo: string;
  vigencia: string;
}

export interface Lote {
  id: string;
  codigo: string;
  vencimiento: string;
  cantidad_total: number;
}

export interface ProductDetail extends Product {
  stock_total: number;
  certificaciones: Certificacion[];
  lotes: Lote[];
}

export interface ProductLocation {
  bodega_id: string;
  bodega_nombre: string;
  stock_disponible: number;
}

const BASE_URL = 'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1';

import { getUserCountry } from './storageService';

export const getAllProducts = async (country?: string, limit: number = 100, offset: number = 0): Promise<Product[]> => {
  const userCountry = country || await getUserCountry();
  
  const response = await fetch(`${BASE_URL}/inventario/productos/todos?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: {
      'X-Country': userCountry,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch products: ${response.status} ${text}`);
  }

  return await response.json();
};

export const getProductDetail = async (productId: string, country?: string): Promise<ProductDetail> => {
  const userCountry = country || await getUserCountry();
  
  const response = await fetch(`${BASE_URL}/inventario/producto/${productId}/detalle`, {
    method: 'GET',
    headers: {
      'X-Country': userCountry,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch product detail: ${response.status} ${text}`);
  }

  return await response.json();
};

export const getProductLocations = async (productId: string, country?: string): Promise<ProductLocation[]> => {
  const userCountry = country || await getUserCountry();
  
  const response = await fetch(`${BASE_URL}/inventario/producto/${productId}/ubicaciones`, {
    method: 'GET',
    headers: {
      'X-Country': userCountry,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch product locations: ${response.status} ${text}`);
  }

  return await response.json();
};

export default {
  getAllProducts,
  getProductDetail,
  getProductLocations,
};
