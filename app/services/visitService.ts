const BASE_URL = 'https://medisupply-gw-5k2l9pfv.uc.gateway.dev/v1';

import { getUserCountry } from './storageService';

export interface Visit {
  id: string;
  id_vendedor: string;
  id_cliente: string;
  nombre_cliente?: string;
  direccion: string;
  ciudad: string;
  contacto: string;
  fecha: string;
  estado: 'pendiente' | 'completada' | 'cancelada';
}

export interface CreateVisitRequest {
  cliente_id: number;
  nombre_contacto: string;
  hallazgos_tecnicos: string;
  sugerencias_producto: string;
}

export interface CreateVisitDetailRequest {
  id_cliente: string;
  atendido_por: string;
  hallazgos: string;
  sugerencias_producto: string;
  foto?: any; // Opcional - será agregado en el futuro
}

export interface GetVisitsParams {
  id_vendedor?: string | number;
  fecha?: string;
  estado?: string;
}

/**
 * Obtener listado de visitas de vendedores
 * @param params Parámetros de filtro (id_vendedor, fecha, estado)
 * @param country País para el header X-Country
 * @returns Lista de visitas
 */
export const getVisits = async (
  params?: GetVisitsParams,
  country?: string
): Promise<Visit[]> => {
  try {
    const userCountry = country || await getUserCountry();
    
    const queryParams = new URLSearchParams();
    
    if (params?.id_vendedor) {
      queryParams.append('id_vendedor', String(params.id_vendedor));
    }
    if (params?.fecha) {
      queryParams.append('d', params.fecha);
    }
    if (params?.estado) {
      queryParams.append('estado', params.estado);
    }

    const url = `${BASE_URL}/visitas${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    console.log('=== GET VISITS REQUEST ===');
    console.log('URL:', url);
    console.log('Headers:', { 'X-Country': userCountry });
    console.log('Params:', params);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Country': userCountry,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text);
      throw new Error(`Failed to fetch visits: ${response.status} ${text}`);
    }

    const data = await response.json();
    console.log('=== GET VISITS RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('Total visits:', Array.isArray(data) ? data.length : 'Not an array');
    return data;
  } catch (error) {
    console.error('Error al obtener las visitas:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    }
    
    throw error;
  }
};

/**
 * Crear una nueva visita
 * @param visitData Datos de la visita a crear
 * @param country País para el header X-Country
 * @returns Visita creada
 */
export const createVisit = async (
  visitData: CreateVisitRequest,
  country?: string
): Promise<any> => {
  try {
    const userCountry = country || await getUserCountry();
    
    console.log('=== CREATE VISIT REQUEST ===');
    console.log('URL:', `${BASE_URL}/visitas`);
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'X-Country': userCountry,
    });
    console.log('Payload:', JSON.stringify(visitData, null, 2));
    
    const response = await fetch(`${BASE_URL}/visitas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Country': userCountry,
      },
      body: JSON.stringify(visitData),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text);
      throw new Error(`Failed to create visit: ${response.status} ${text}`);
    }

    const result = await response.json();
    console.log('=== CREATE VISIT RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error al crear la visita:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se pudo conectar con el servidor.');
    }
    
    throw error;
  }
};

/**
 * Crear detalle de una visita existente
 * @param visitId ID de la visita
 * @param detailData Datos del detalle de la visita
 * @param country País para el header X-Country
 * @returns Resultado de la creación del detalle
 */
export const createVisitDetail = async (
  visitId: string,
  detailData: CreateVisitDetailRequest,
  country?: string
): Promise<any> => {
  try {
    const userCountry = country || await getUserCountry();
    
    // Crear FormData para el envío
    const formData = new FormData();
    formData.append('id_cliente', detailData.id_cliente);
    formData.append('atendido_por', detailData.atendido_por);
    formData.append('hallazgos', detailData.hallazgos);
    formData.append('sugerencias_producto', detailData.sugerencias_producto);
    
    // Foto es opcional, por ahora no se envía
    // if (detailData.foto) {
    //   formData.append('foto', detailData.foto);
    // }
    
    const url = `${BASE_URL}/visitas/${visitId}/detalle`;
    
    console.log('=== CREATE VISIT DETAIL REQUEST ===');
    console.log('URL:', url);
    console.log('Visit ID:', visitId);
    console.log('Headers:', { 'X-Country': userCountry });
    console.log('Detail Data:', {
      id_cliente: detailData.id_cliente,
      atendido_por: detailData.atendido_por,
      hallazgos: detailData.hallazgos,
      sugerencias_producto: detailData.sugerencias_producto,
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Country': userCountry,
        // No establecer Content-Type, fetch lo establece automáticamente para FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text);
      throw new Error(`Failed to create visit detail: ${response.status} ${text}`);
    }

    const result = await response.json();
    console.log('=== CREATE VISIT DETAIL RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error al crear el detalle de la visita:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se pudo conectar con el servidor.');
    }
    
    throw error;
  }
};

export default {
  getVisits,
  createVisit,
  createVisitDetail,
};
