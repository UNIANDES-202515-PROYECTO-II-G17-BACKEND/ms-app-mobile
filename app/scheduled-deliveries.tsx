import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import BottomNavigationBar from './common/BottomNavigationBar';
import { useUserRole } from './hooks/useUserRole';
import { getDeliveries, RouteStop } from './services/logisticsService';

// Tipo extendido para las entregas con información de la ruta
type Delivery = RouteStop & { 
  ruta_id: string; 
  fecha_ruta: string; 
  estado_ruta: string;
};

const ScheduledDeliveriesScreen = () => {
  const { t } = useTranslation();
  const { userRole } = useUserRole();
  const router = useRouter();
  const [value, setValue] = useState(1);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('');

  // Crear un mapa de rutas únicas con números consecutivos
  const getRouteNumber = (rutaId: string): number => {
    const uniqueRoutes = Array.from(new Set(filteredDeliveries.map(d => d.ruta_id)));
    return uniqueRoutes.indexOf(rutaId) + 1;
  };

  // Función para validar formato de fecha YYYY-MM-DD
  const isValidDateFormat = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
  };

  // Función para cargar las entregas programadas desde el servicio de logística
  const fetchDeliveries = async (fecha: string) => {
    // Solo hacer fetch si la fecha tiene el formato correcto
    if (!isValidDateFormat(fecha)) {
      console.log('Fecha inválida o vacía, no se hará fetch:', fecha);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Llamar al servicio con la fecha especificada
      const data = await getDeliveries(fecha);
      console.log('Entregas programadas obtenidas:', JSON.stringify(data, null, 2));
      setDeliveries(data);
      setFilteredDeliveries(data);
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setDeliveries([]);
      setFilteredDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  // NO cargar entregas al montar - esperar a que el usuario seleccione una fecha válida
  useEffect(() => {
    // Inicializar loading en false
    setLoading(false);
  }, []);

  // Cargar entregas cuando cambia la fecha filtrada (solo si tiene formato válido)
  useEffect(() => {
    if (filterDate && isValidDateFormat(filterDate)) {
      console.log('Fecha seleccionada:', filterDate);
      fetchDeliveries(filterDate);
    } else if (filterDate === '') {
      // Si se limpia el filtro, limpiar también los datos
      setDeliveries([]);
      setFilteredDeliveries([]);
    }
  }, [filterDate]);

  // Simula la recarga de datos
  const onRefresh = async () => {
    if (!filterDate || !isValidDateFormat(filterDate)) {
      // Si no hay fecha válida seleccionada, no recargar
      return;
    }
    setRefreshing(true);
    await fetchDeliveries(filterDate);
    setRefreshing(false);
  };

  // Limpiar filtro de fecha
  const clearDateFilter = () => {
    setFilterDate('');
    setSelectedDate(new Date());
    setDeliveries([]);
    setFilteredDeliveries([]);
  };

  // Aplicar filtro de fecha
  const applyDateFilter = () => {
    const formattedDate = formatDateToAPI(selectedDate);
    setFilterDate(formattedDate);
    // Aquí filtraremos las entregas por fecha
    setShowDatePicker(false);
  };

  // Formatear fecha para la API (YYYY-MM-DD)
  const formatDateToAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Manejar cambio de fecha en el picker
  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      if (Platform.OS === 'android') {
        const formattedDate = formatDateToAPI(date);
        setFilterDate(formattedDate);
      }
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    
    // Extraer solo la parte de fecha (YYYY-MM-DD) sin conversión de zona horaria
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    
    return `${day}/${month}/${year}`;
  };

  // Función para obtener el emoji según el estado
  const getStatusEmoji = (estado: string): string => {
    switch (estado.toUpperCase()) {
      case 'ENTREGADA':
        return '✅';
      case 'PENDIENTE':
        return '⏳';
      case 'EN_CAMINO':
        return '🚚';
      case 'CANCELADA':
        return '❌';
      default:
        return '📦';
    }
  };

  // Función para obtener la etiqueta del estado
  const getStatusLabel = (estado: string): string => {
    switch (estado.toUpperCase()) {
      case 'ENTREGADA':
        return t('delivered') || 'Entregada';
      case 'PENDIENTE':
        return t('pending') || 'Pendiente';
      case 'EN_CAMINO':
        return t('inTransit') || 'En camino';
      case 'CANCELADA':
        return t('cancelled') || 'Cancelada';
      default:
        return estado;
    }
  };

  // Función para obtener el estilo según el estado
  const getStatusStyle = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'ENTREGADA':
        return { backgroundColor: '#E8F5E9' };
      case 'PENDIENTE':
        return { backgroundColor: '#FFF3E0' };
      case 'EN_CAMINO':
        return { backgroundColor: '#E3F2FD' };
      case 'CANCELADA':
        return { backgroundColor: '#FFEBEE' };
      default:
        return { backgroundColor: '#F5F5F5' };
    }
  };

  // Renderizar cada item de entrega
  const renderDeliveryItem = ({ item }: { item: Delivery }) => {
    const routeNumber = getRouteNumber(item.ruta_id);
    
    return (
      <View style={styles.deliveryCard}>
        <View style={styles.deliveryHeader}>
          <View style={styles.deliveryHeaderLeft}>
            <Text style={styles.routeIdText}>🚚 Ruta #{routeNumber}</Text>
            <Text style={styles.orderCode}>Parada #{item.orden}</Text>
            <View style={[styles.statusBadge, getStatusStyle(item.estado)]}>
              <Text style={styles.statusText}>{getStatusEmoji(item.estado)} {getStatusLabel(item.estado)}</Text>
            </View>
          </View>
          <View style={styles.deliveryHeaderRight}>
            <Text style={styles.cityText}>{item.ciudad}</Text>
          </View>
        </View>

      <View style={styles.divider} />

      <View style={styles.deliveryInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>� {t('address') || 'Dirección'}:</Text>
          <Text style={styles.infoValue} numberOfLines={2}>{item.direccion}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>� {t('client') || 'Cliente'}:</Text>
          <Text style={styles.infoValue}>ID: {item.cliente_id}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📦 {t('orders') || 'Pedidos'}:</Text>
          <Text style={styles.infoValue}>{item.pedido_ids.length} {item.pedido_ids.length === 1 ? t('order') || 'pedido' : t('orders') || 'pedidos'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>� {t('routeDate') || 'Fecha ruta'}:</Text>
          <Text style={styles.infoValue}>{formatDate(item.fecha_ruta)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🚚 {t('routeStatus') || 'Estado ruta'}:</Text>
          <Text style={styles.infoValue}>{item.estado_ruta}</Text>
        </View>
      </View>
    </View>
    );
  };

  // Vista de carga (solo mostrar si hay una fecha válida y se está cargando)
  if (loading && filterDate && isValidDateFormat(filterDate)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {t('scheduledDeliveries') || 'Entregas Programadas'}
            </Text>
          </View>
          <Text style={styles.subtitle}>Cargando...</Text>
        </View>

        {/* Filtro de fecha siempre visible */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>
            {t('filterByDate') || 'Filtrar por fecha'}
          </Text>
          <View style={styles.dateFilterRow}>
            {Platform.OS === 'web' ? (
              <TextInput
                style={styles.datePickerButton}
                value={filterDate}
                onChangeText={setFilterDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            ) : (
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.datePickerButton}
              >
                <Text style={styles.datePickerButtonText}>
                  📅 {filterDate || (t('selectDate') || 'Seleccionar fecha')}
                </Text>
              </TouchableOpacity>
            )}
            
            {filterDate !== '' && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearDateFilter}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {showDatePicker && Platform.OS !== 'web' && (
            <>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.datePickerActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.cancelButtonText}>{t('cancel') || 'Cancelar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.applyButton}
                    onPress={applyDateFilter}
                  >
                    <Text style={styles.applyButtonText}>{t('apply') || 'Aplicar'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6750A4" />
          <Text style={styles.loadingText}>
            {t('loadingDeliveries') || 'Cargando entregas programadas...'}
          </Text>
        </View>
        <BottomNavigationBar value={value} setValue={setValue} role={userRole} />
      </View>
    );
  }

  // Vista de error
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {t('scheduledDeliveries') || 'Entregas Programadas'}
            </Text>
          </View>
          <Text style={styles.subtitle}>0 entregas</Text>
        </View>

        {/* Filtro de fecha siempre visible */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>
            {t('filterByDate') || 'Filtrar por fecha'}
          </Text>
          <View style={styles.dateFilterRow}>
            {Platform.OS === 'web' ? (
              <TextInput
                style={styles.datePickerButton}
                value={filterDate}
                onChangeText={setFilterDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            ) : (
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.datePickerButton}
              >
                <Text style={styles.datePickerButtonText}>
                  📅 {filterDate || (t('selectDate') || 'Seleccionar fecha')}
                </Text>
              </TouchableOpacity>
            )}
            
            {filterDate !== '' && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearDateFilter}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {showDatePicker && Platform.OS !== 'web' && (
            <>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.datePickerActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.cancelButtonText}>{t('cancel') || 'Cancelar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.applyButton}
                    onPress={applyDateFilter}
                  >
                    <Text style={styles.applyButtonText}>{t('apply') || 'Aplicar'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {t('errorLoadingDeliveries') || 'Error al cargar entregas'}
          </Text>
          <Text style={styles.errorDetail}>{error}</Text>
          {filterDate && isValidDateFormat(filterDate) && (
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => fetchDeliveries(filterDate)}
            >
              <Text style={styles.retryButtonText}>{t('retry') || 'Reintentar'}</Text>
            </TouchableOpacity>
          )}
        </View>
        <BottomNavigationBar value={value} setValue={setValue} role={userRole} />
      </View>
    );
  }

  // Vista vacía
  if (deliveries.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {t('scheduledDeliveries') || 'Entregas Programadas'}
            </Text>
          </View>
          <Text style={styles.subtitle}>0 entregas</Text>
        </View>
        
        {/* Filtro de fecha siempre visible */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>
            {t('filterByDate') || 'Filtrar por fecha'}
          </Text>
          <View style={styles.dateFilterRow}>
            {Platform.OS === 'web' ? (
              <TextInput
                style={styles.datePickerButton}
                value={filterDate}
                onChangeText={setFilterDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            ) : (
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.datePickerButton}
              >
                <Text style={styles.datePickerButtonText}>
                  📅 {filterDate || (t('selectDate') || 'Seleccionar fecha')}
                </Text>
              </TouchableOpacity>
            )}
            
            {filterDate !== '' && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearDateFilter}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {showDatePicker && Platform.OS !== 'web' && (
            <>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.datePickerActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.cancelButtonText}>{t('cancel') || 'Cancelar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.applyButton}
                    onPress={applyDateFilter}
                  >
                    <Text style={styles.applyButtonText}>{t('apply') || 'Aplicar'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🚚</Text>
          <Text style={styles.emptyTitle}>
            {filterDate && isValidDateFormat(filterDate)
              ? (t('noDeliveries') || 'No hay entregas programadas')
              : filterDate && !isValidDateFormat(filterDate)
              ? (t('invalidDateFormat') || 'Formato de fecha inválido')
              : (t('selectDatePrompt') || 'Ingresa una fecha para filtrar')
            }
          </Text>
          <Text style={styles.emptyMessage}>
            {filterDate && isValidDateFormat(filterDate)
              ? (t('noDeliveriesMessage') || 'No hay entregas para esta fecha')
              : filterDate && !isValidDateFormat(filterDate)
              ? (t('useDateFormat') || 'Por favor usa el formato YYYY-MM-DD (ej: 2025-10-29)')
              : (t('selectDateMessage') || 'Ingresa una fecha en formato YYYY-MM-DD para consultar las entregas programadas')
            }
          </Text>
        </View>
        <BottomNavigationBar value={value} setValue={setValue} role={userRole} />
      </View>
    );
  }

  // Vista principal
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {t('scheduledDeliveries') || 'Entregas Programadas'}
          </Text>
        </View>
        <Text style={styles.subtitle}>
          {filteredDeliveries.length} {filteredDeliveries.length === 1 ? 'entrega' : 'entregas'}
        </Text>
      </View>

      {/* Filtro de fecha */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>{t('filterByDate') || 'Filtrar por fecha'}</Text>
        <View style={styles.dateFilterRow}>
          {Platform.OS === 'web' ? (
            // Input HTML para web
            <TextInput
              style={styles.datePickerButton}
              placeholder="YYYY-MM-DD"
              value={filterDate}
              onChangeText={(text) => {
                setFilterDate(text);
                // Validar formato de fecha antes de aplicar
                if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
                  // El filtro se aplicará automáticamente por el useEffect
                }
              }}
              placeholderTextColor="#999"
            />
          ) : (
            // DatePicker nativo para iOS/Android
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerButtonText}>
                📅 {filterDate || t('selectDate') || 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>
          )}
          
          {filterDate !== '' && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearDateFilter}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {showDatePicker && Platform.OS !== 'web' && (
          <>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
            />
            {Platform.OS === 'ios' && (
              <View style={styles.datePickerActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('cancel') || 'Cancelar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={applyDateFilter}
                >
                  <Text style={styles.applyButtonText}>{t('apply') || 'Aplicar'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      <FlatList
        data={filteredDeliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6750A4']}
            tintColor="#6750A4"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: '#6750A4',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6750A4',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deliveryHeaderLeft: {
    flex: 1,
  },
  deliveryHeaderRight: {
    alignItems: 'flex-end',
  },
  routeIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6750A4',
    marginBottom: 4,
  },
  orderCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  statusBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6750A4',
  },
  cityText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  deliveryInfo: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  observationsContainer: {
    marginTop: 4,
  },
  observationsText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#6750A4',
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6750A4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#6750A4',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#F8F5FF',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#6750A4',
    fontWeight: '500',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#6750A4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#EF5350',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ScheduledDeliveriesScreen;
