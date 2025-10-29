const BASE_URL = 'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1';

import { getUserCountry } from './storageService';

export interface RouteStop {
  id: string;
  cliente_id: number;
  direccion: string;
  ciudad: string;
  estado: string;
  orden: number;
  pedido_ids: string[];
}

export interface Route {
  id: string;
  fecha: string;
  estado: string;
  creado_en: string;
  paradas: RouteStop[];
}

/**
 * Obtiene las rutas de logística para una fecha específica
 * @param fecha - Fecha en formato YYYY-MM-DD (si no se proporciona, usa la fecha actual)
 * @returns Lista de rutas con sus paradas
 */
export async function getRoutes(fecha?: string): Promise<Route[]> {
  try {
    const country = await getUserCountry();
    
    // Si no se proporciona fecha, usar la fecha actual
    let fechaParam = fecha;
    if (!fechaParam) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      fechaParam = `${year}-${month}-${day}`;
    }
    
    // Construir URL con parámetro de fecha (obligatorio)
    const url = `${BASE_URL}/logistica/rutas?fecha=${fechaParam}`;

    console.log('=== GET ROUTES REQUEST ===');
    console.log('URL completa:', url);
    console.log('Fecha param:', fechaParam);
    console.log('Country:', country);
    console.log('Headers:', { 'X-Country': country, 'Content-Type': 'application/json' });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Country': country,
      },
    });

    console.log('=== GET ROUTES RESPONSE ===');
    console.log('Status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text);
      console.error('Status code:', response.status);
      
      // Si es error 422, es posible que el formato de fecha sea incorrecto
      if (response.status === 422) {
        console.error('Validation error - check date format:', fechaParam);
        throw new Error(`Formato de fecha inválido o datos faltantes. Fecha enviada: ${fechaParam}`);
      }
      
      throw new Error(`Error al cargar entregas (${response.status}): ${text}`);
    }

    const data = await response.json();
    console.log('Data:', data);
    console.log('Total routes:', data.length);

    return data;
  } catch (error) {
    console.error('Error al obtener las rutas:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    }
    
    throw error;
  }
}

/**
 * Obtiene todas las paradas (entregas) de todas las rutas para una fecha
 * Útil para mostrar un listado plano de entregas
 */
export async function getDeliveries(fecha?: string): Promise<Array<RouteStop & { ruta_id: string; fecha_ruta: string; estado_ruta: string }>> {
  try {
    const routes = await getRoutes(fecha);
    
    // Aplanar las paradas de todas las rutas
    const deliveries = routes.flatMap(route => 
      route.paradas.map(parada => ({
        ...parada,
        ruta_id: route.id,
        fecha_ruta: route.fecha,
        estado_ruta: route.estado,
      }))
    );

    return deliveries;
  } catch (error) {
    console.error('Error al obtener las entregas:', error);
    throw error;
  }
}
