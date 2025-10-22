import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getOrders, Order, OrderItem } from '../services/orderService';
import { getProductDetail } from '../services/productService';

interface OrderItemWithProduct extends OrderItem {
  productName?: string;
  productSku?: string;
}

const OrderDetailScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [itemsWithProducts, setItemsWithProducts] = useState<OrderItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar el detalle del pedido
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setError(null);
        setLoading(true);
        
        // Obtener todos los pedidos y filtrar por ID
        const orders = await getOrders(undefined, { tipo: 'VENTA' });
        const foundOrder = orders.find((o) => o.id === id);
        
        if (!foundOrder) {
          setError('Pedido no encontrado');
          setLoading(false);
          return;
        }
        
        setOrder(foundOrder);
        
        // Cargar información de productos para cada item
        const itemsPromises = foundOrder.items.map(async (item) => {
          try {
            const productDetail = await getProductDetail(item.producto_id);
            return {
              ...item,
              productName: productDetail.nombre,
              productSku: productDetail.sku || item.sku || 'N/A',
            };
          } catch (err) {
            console.error(`Error loading product ${item.producto_id}:`, err);
            return {
              ...item,
              productName: 'Producto no disponible',
              productSku: item.sku || 'N/A',
            };
          }
        });
        
        const itemsWithProductData = await Promise.all(itemsPromises);
        setItemsWithProducts(itemsWithProductData);
        
      } catch (err) {
        console.error('Error fetching order detail:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  // Obtener el color según el estado
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

  // Obtener el texto del estado traducido
  const getStatusText = (status: string): string => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'BORRADOR':
        return t('draft') || 'Borrador';
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

  // Formatear precio - Los valores vienen como string con formato "21420.0000"
  const formatPrice = (price: string | number): string => {
    // Convertir a número y asegurar que sea válido
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    // Si el número no es válido, retornar 0.00
    if (isNaN(numPrice)) {
      return '$0.00';
    }
    
    // Formato con coma para miles y punto para decimales (ej: $21,420.00)
    return `$${numPrice.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Renderizar cada item del pedido
  const renderItem = ({ item }: { item: OrderItemWithProduct }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.productName || 'Cargando...'}</Text>
        <Text style={styles.itemSku}>SKU: {item.productSku}</Text>
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Cantidad:</Text>
          <Text style={styles.itemValue}>{item.cantidad}</Text>
        </View>
        
        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Precio unitario:</Text>
          <Text style={styles.itemValue}>{formatPrice(item.precio_unitario)}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6750A4" />
        <Text style={styles.loadingText}>Cargando detalle del pedido...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Pedido no encontrado'}</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backIconButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{t('order') || 'Pedido'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Información del pedido */}
        <View style={styles.infoCard}>
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>{t('code') || 'Código'}:</Text>
            <Text style={styles.codeValue}>{order.codigo}</Text>
          </View>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.estado) }]}>
              <Text style={styles.statusText}>{getStatusText(order.estado)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('client') || 'Cliente'} ID:</Text>
            <Text style={styles.infoValue}>{order.cliente_id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('seller') || 'Vendedor'} ID:</Text>
            <Text style={styles.infoValue}>{order.vendedor_id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('type') || 'Tipo'}:</Text>
            <Text style={styles.infoValue}>{order.tipo}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('address') || 'Dirección'}:</Text>
            <Text style={styles.infoValue}>{order.direccion || 'N/A'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('total') || 'Total'}:</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
          </View>
        </View>

        {/* Listado de items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>
            {t('orderItems') || 'Items del pedido'} ({order.items.length})
          </Text>
          
          <FlatList
            data={itemsWithProducts}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.producto_id}-${index}`}
            scrollEnabled={false}
            contentContainerStyle={styles.itemsList}
          />
        </View>
      </ScrollView>
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
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backIconButton: {
    padding: 5,
  },
  backIcon: {
    fontSize: 28,
    color: '#6750A4',
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
    paddingLeft: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6750A4',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  placeholder: {
    width: 38,
  },
  content: {
    flex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#DC362E',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6750A4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  codeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusRow: {
    marginBottom: 15,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6750A4',
  },
  itemsSection: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  itemsList: {
    paddingBottom: 10,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 12,
    color: '#999',
  },
  itemDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemLabel: {
    fontSize: 14,
    color: '#666',
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemValueBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6750A4',
  },
});

export default OrderDetailScreen;
