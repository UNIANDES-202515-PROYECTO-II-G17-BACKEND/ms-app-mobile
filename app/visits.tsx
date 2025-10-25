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
import { getCurrentUser, getInstitutionalCustomers } from './services/userService';
import { getVisits, Visit } from './services/visitService';

const VisitsScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('');
  const [clientsMap, setClientsMap] = useState<Map<string, string>>(new Map());

  // Función para cargar los clientes
  const fetchClients = async () => {
    try {
      const clients = await getInstitutionalCustomers();
      const map = new Map<string, string>();
      clients.forEach(client => {
        map.set(client.id.toString(), client.institution_name);
      });
      setClientsMap(map);
      console.log('=== CLIENTS MAP ===');
      console.log('Total clients loaded:', map.size);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  // Función para cargar las visitas
  const fetchVisits = async (date?: string) => {
    try {
      setError(null);
      const user = await getCurrentUser();
      console.log('=== AUTHENTICATED USER ===');
      console.log('User ID:', user.id);
      console.log('User:', JSON.stringify(user, null, 2));
      
      const params: any = {
        id_vendedor: user.id,
      };
      
      // Si hay una fecha seleccionada, agregarla a los parámetros
      if (date) {
        params.fecha = date;
      }
      
      console.log('=== FETCH VISITS PARAMS ===');
      console.log('Params being sent:', params);
      
      const data = await getVisits(params);
      setVisits(data);
    } catch (err) {
      console.error('Error fetching visits:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Cargar visitas al montar el componente
  useEffect(() => {
    const loadData = async () => {
      await fetchClients();
      await fetchVisits(filterDate);
    };
    loadData();
  }, []);

  // Simula la recarga de datos
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVisits(filterDate);
    setRefreshing(false);
  };

  // Limpiar filtro de fecha
  const clearDateFilter = () => {
    setFilterDate('');
    setSelectedDate(new Date());
    fetchVisits('');
  };

  // Aplicar filtro de fecha
  const applyDateFilter = () => {
    const formattedDate = formatDateToAPI(selectedDate);
    setFilterDate(formattedDate);
    fetchVisits(formattedDate);
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
        fetchVisits(formattedDate);
      }
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Función para obtener el color del estado
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return '#FFA726'; // Orange
      case 'finalizada':
        return '#66BB6A'; // Green
      case 'cancelada':
        return '#EF5350'; // Red
      default:
        return '#9E9E9E'; // Gray
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return t('pending');
      case 'completada':
        return t('completed');
      case 'cancelada':
        return t('cancelled');
      case 'finalizada':
        return t('finalized');
      default:
        return estado;
    }
  };

  // Renderizar cada visita
  const renderVisitItem = ({ item }: { item: Visit }) => {
    const clientName = clientsMap.get(item.id_cliente) || `ID: ${item.id_cliente}`;
    const isCompleted = item.estado === 'finalizada';
    
    const handlePress = () => {
      if (isCompleted) {
        return; // No hacer nada si está finalizada
      }
      
      // Navegar al registro de visita con los datos pre-cargados
      router.push({
        pathname: '/register-visit',
        params: {
          clientId: item.id_cliente,
          clientName: clientName,
          contactName: item.contacto,
          visitId: item.id
        }
      } as any);
    };
    
    return (
      <TouchableOpacity 
        style={styles.visitCard}
        onPress={handlePress}
        activeOpacity={isCompleted ? 1 : 0.7}
        disabled={isCompleted}
      >
        <View style={styles.visitHeader}>
          <View style={styles.visitHeaderLeft}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) }]}>
              <Text style={styles.statusText}>{getStatusText(item.estado)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.visitDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>👤 {t('contact')}:</Text>
            <Text style={styles.detailValue}>{item.contacto}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🏢 {t('client')}:</Text>
            <Text style={styles.detailValue}>{clientName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🏙️ {t('city')}:</Text>
            <Text style={styles.detailValue}>{item.ciudad}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 {t('address')}:</Text>
            <Text style={styles.detailValue}>{item.direccion}</Text>
          </View>
        </View>

        {/* Indicador visual de que es clickeable - solo si NO está finalizada */}
        {!isCompleted && (
          <View style={styles.visitFooter}>
            <Text style={styles.clickHintText}>
              {t('tapToRegisterDetails') || 'Toca para registrar detalles'}
            </Text>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Renderizar cuando no hay visitas
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>{t('noVisits')}</Text>
      <Text style={styles.emptySubtitle}>{t('noVisitsMessage')}</Text>
    </View>
  );

  // Mostrar spinner mientras carga
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6750A4" testID="loading-indicator" />
      </View>
    );
  }

  // Mostrar error si ocurrió
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{t('myVisits')}</Text>
          </View>
          <Text style={styles.subtitle}>0 visitas</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️</Text>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('myVisits')}</Text>
        </View>
        <Text style={styles.subtitle}>
          {visits.length} {visits.length === 1 ? 'visita' : 'visitas'}
        </Text>
      </View>

      {/* Date Filter */}
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
                  fetchVisits(text);
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

      {/* Visits List */}
      <FlatList
        data={visits}
        renderItem={renderVisitItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6750A4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  listContainer: {
    padding: 16,
  },
  visitCard: {
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
  visitCardDisabled: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  visitHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visitDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  visitDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  newVisitButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#6750A4',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newVisitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC362E',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  visitFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clickHintText: {
    fontSize: 13,
    color: '#6750A4',
    fontWeight: '500',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#6750A4',
    fontWeight: 'bold',
  },
});

export default VisitsScreen;
