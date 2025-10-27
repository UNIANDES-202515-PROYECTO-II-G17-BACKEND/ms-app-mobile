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
import { getDispatchedOrders, Order } from './services/orderService';

const ScheduledDeliveriesScreen = () => {
  const { t } = useTranslation();
  const { userRole } = useUserRole();
  const router = useRouter();
  const [value, setValue] = useState(1);
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('');

  // Función para cargar las entregas programadas (pedidos despachados)
  const fetchDeliveries = async () => {
    try {
      setError(null);
      const data = await getDispatchedOrders();
      console.log('Entregas programadas obtenidas:', JSON.stringify(data, null, 2));
      setDeliveries(data);
      setFilteredDeliveries(data);
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Cargar entregas al montar el componente
  useEffect(() => {
    fetchDeliveries();
  }, []);

  // Filtrar entregas cuando cambia la fecha filtrada
  useEffect(() => {
    if (filterDate) {
      console.log('Filtrando por fecha:', filterDate);
      const filtered = deliveries.filter(delivery => {
        if (delivery.fecha_compromiso) {
          // Extraer solo la parte de fecha (YYYY-MM-DD)
          // Manejar tanto formato ISO completo como solo fecha
          let deliveryDate: string;
          if (delivery.fecha_compromiso.includes('T')) {
            // Formato ISO: "2024-10-27T00:00:00Z" o similar
            deliveryDate = delivery.fecha_compromiso.split('T')[0];
          } else {
            // Formato simple: "2024-10-27"
            deliveryDate = delivery.fecha_compromiso;
          }
          console.log('Comparando:', deliveryDate, 'con', filterDate);
          return deliveryDate === filterDate;
        }
        return false;
      });
      console.log('Entregas filtradas:', filtered.length, 'de', deliveries.length);
      setFilteredDeliveries(filtered);
    } else {
      console.log('Sin filtro, mostrando todas las entregas:', deliveries.length);
      setFilteredDeliveries(deliveries);
    }
  }, [filterDate, deliveries]);

  // Simula la recarga de datos
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveries();
    setRefreshing(false);
  };

  // Limpiar filtro de fecha
  const clearDateFilter = () => {
    setFilterDate('');
    setSelectedDate(new Date());
    fetchDeliveries();
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

  // Navegar al detalle de la entrega
  const handleDeliveryPress = (orderId: string) => {
    router.push({
      pathname: '/orders/detail',
      params: { id: orderId }
    });
  };

  // Renderizar cada item de entrega
  const renderDeliveryItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.deliveryCard}
      onPress={() => handleDeliveryPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.deliveryHeader}>
        <View style={styles.deliveryHeaderLeft}>
          <Text style={styles.orderCode}>{item.codigo}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>🚚 {t('dispatched') || 'Despachado'}</Text>
          </View>
        </View>
        <View style={styles.deliveryHeaderRight}>
          <Text style={styles.totalAmount}>
            ${Number(item.total || 0).toLocaleString('es-CO')}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.deliveryInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📦 {t('items') || 'Items'}:</Text>
          <Text style={styles.infoValue}>{item.items?.length || 0} {t('items') || 'items'}</Text>
        </View>

        {item.fecha_compromiso && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 {t('deliveryDate') || 'Fecha de entrega'}:</Text>
            <Text style={styles.infoValue}>{formatDate(item.fecha_compromiso)}</Text>
          </View>
        )}

        {item.observaciones && (
          <View style={styles.observationsContainer}>
            <Text style={styles.infoLabel}>📝 {t('observations') || 'Observaciones'}:</Text>
            <Text style={styles.observationsText} numberOfLines={2}>
              {item.observaciones}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>
          {t('tapToViewDetails') || 'Toca para ver detalles'} →
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Vista de carga
  if (loading) {
    return (
      <View style={styles.container}>
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
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {t('errorLoadingDeliveries') || 'Error al cargar entregas'}
          </Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDeliveries}>
            <Text style={styles.retryButtonText}>{t('retry') || 'Reintentar'}</Text>
          </TouchableOpacity>
        </View>
        <BottomNavigationBar value={value} setValue={setValue} role={userRole} />
      </View>
    );
  }

  // Vista vacía
  if (deliveries.length === 0) {
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
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>
            {t('noDeliveries') || 'No hay entregas programadas'}
          </Text>
          <Text style={styles.emptyMessage}>
            {t('noDeliveriesMessage') || 'Actualmente no tienes entregas pendientes'}
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
        <Text style={styles.filterLabel}>{t('filterByDate') || 'Filtrar por fecha'}:</Text>
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
