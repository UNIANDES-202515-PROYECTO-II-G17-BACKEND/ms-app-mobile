import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import BottomNavigationBar from '../common/BottomNavigationBar';
import { useUserRole } from '../hooks/useUserRole';
import { getOrders, Order } from '../services/orderService';

const OrdersScreen = () => {
  const { t } = useTranslation();
  const { userRole } = useUserRole();
  const router = useRouter();
  const [value, setValue] = useState(1); // Orders tab
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar los pedidos
  const fetchOrders = async () => {
    try {
      setError(null);
      // Ya no necesitamos obtener el país manualmente
      const data = await getOrders(undefined, { tipo: 'VENTA' });
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Cargar pedidos al montar el componente
  useEffect(() => {
    fetchOrders();
  }, []);

  // Simula la recarga de datos
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // Obtener el color según el estado (API usa estados en mayúsculas)
  const getStatusColor = (status: string): string => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'BORRADOR':
        return '#9E9E9E'; // Gray
      case 'PENDIENTE':
        return '#FF9800'; // Orange
      case 'EN_PROCESO':
        return '#2196F3'; // Blue
      case 'COMPLETADO':
        return '#4CAF50'; // Green
      case 'CANCELADO':
        return '#F44336'; // Red
      default:
        return '#9E9E9E';
    }
  };

  // Obtener el texto del estado traducido (API usa estados en mayúsculas)
  const getStatusText = (status: string): string => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'BORRADOR':
        return 'Pendiente';
      case 'PENDIENTE':
        return t('pending') || 'Pendiente';
      case 'EN_PROCESO':
        return t('in_process') || 'En Proceso';
      case 'COMPLETADO':
        return t('completed') || 'Completado';
      case 'CANCELADO':
        return t('cancelled') || 'Cancelado';
      default:
        return status;
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Filtrar órdenes (normalizar estados para la comparación)
  const filteredOrders = selectedFilter === 'all' 
    ? orders 
    : orders.filter(order => {
        const normalizedStatus = order.estado.toLowerCase().replace('_', '_');
        return normalizedStatus === selectedFilter;
      });

  // Renderizar cada item de la lista
  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => {
        // TODO: Navegar a detalle del pedido
        console.log('Ver detalle de pedido:', item.id);
      }}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>{item.codigo}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) }]}>
          <Text style={styles.statusText}>{getStatusText(item.estado)}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>{t('items') || 'Artículos'}:</Text>
          <Text style={styles.orderValue}>{item.items.length}</Text>
        </View>
        
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Total:</Text>
          <Text style={styles.orderValue}>${parseFloat(item.total).toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Renderizar cuando no hay órdenes
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>{t('noOrders') || 'No hay pedidos'}</Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter === 'all' 
          ? (t('noOrdersMessage') || 'Aún no tienes pedidos registrados')
          : (t('noOrdersFilter') || 'No hay pedidos con este filtro')
        }
      </Text>
    </View>
  );

  // Mostrar loading durante la carga inicial
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6750A4" />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
      </View>
    );
  }

  // Mostrar error si hubo un problema
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Error al cargar pedidos</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            fetchOrders();
          }}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('orders') || 'Pedidos'}</Text>
        <Text style={styles.subtitle}>
          {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
        </Text>
      </View>
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={filteredOrders.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6750A4']}
            tintColor="#6750A4"
          />
        }
      />

      {/* Botón flotante para crear nuevo pedido */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/new-order')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <BottomNavigationBar value={value} setValue={setValue} role={userRole} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6750A4',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#6750A4',
    borderColor: '#6750A4',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderDetails: {
    gap: 8,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  orderValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6750A4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 32,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC362E',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: '#6750A4',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrdersScreen;
