import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useOrder } from '../contexts/OrderContext';
import { createOrder } from '../services/orderService';
import { getCurrentUser, getInstitutionalCustomers, getSellers, InstitutionalCustomer, Seller, UserInfo } from '../services/userService';

// Custom Alert Component to replace Snackbar
interface CustomAlertProps {
  visible: boolean;
  message: string | null;
  type: 'success' | 'error';
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ visible, message, type, onClose }) => {
  useEffect(() => {
    if (visible && message) {
      const timeout = setTimeout(() => {
        onClose();
      }, type === 'success' ? 3000 : 6000);
      return () => clearTimeout(timeout);
    }
  }, [visible, message, type, onClose]);

  if (!visible || !message) return null;

  return (
    <View style={[
      styles.alertContainer,
      type === 'error' ? styles.alertError : styles.alertSuccess
    ]}>
      <Text style={styles.alertText}>{message}</Text>
      <TouchableOpacity onPress={onClose} style={styles.alertClose}>
        <Text style={styles.alertCloseText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

// Custom Select Component to replace Material-UI Select
interface SelectOption {
  label: string;
  value: number | string;
}

interface CustomSelectProps {
  label: string;
  value: number | string;
  options: SelectOption[];
  onChange: (value: number | string) => void;
  disabled?: boolean;
  loading?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
  label, 
  value, 
  options, 
  onChange, 
  disabled = false,
  loading = false 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={styles.selectContainer}>
      <Text style={styles.selectLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.selectButton, disabled && styles.selectButtonDisabled]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.selectButtonText,
          !selectedOption && styles.selectPlaceholder
        ]}>
          {selectedOption ? selectedOption.label : `Seleccione ${label.toLowerCase()}`}
        </Text>
        <Text style={styles.selectArrow}>▼</Text>
      </TouchableOpacity>
      
      {loading && (
        <View style={styles.selectLoading}>
          <ActivityIndicator size="small" color="#6750A4" />
        </View>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView style={styles.modalScrollView}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    option.value === value && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    onChange(option.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    option.value === value && styles.modalOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const NewOrderScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { products, removeProduct, clearProducts } = useOrder();
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderObservations, setOrderObservations] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [institutionalCustomers, setInstitutionalCustomers] = useState<InstitutionalCustomer[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    loadUserAndRelatedUsers();
  }, []);

  const loadUserAndRelatedUsers = async () => {
    try {
      // Ya no necesitamos obtener el país manualmente
      const user = await getCurrentUser();
      setCurrentUser(user);
      console.log('Current user:', user);

      setLoadingUsers(true);
      
      if (user.role === 'seller') {
        // Si el usuario es seller, cargar clientes institucionales
        console.log('Loading institutional customers...');
        const customers = await getInstitutionalCustomers();
        console.log('Institutional customers loaded:', customers.length);
        setInstitutionalCustomers(customers);
      } else if (user.role === 'institutional_customer') {
        // Si el usuario es cliente institucional, cargar sellers
        console.log('Loading sellers...');
        const sellersList = await getSellers();
        console.log('Sellers loaded:', sellersList.length, sellersList);
        setSellers(sellersList);
      }
      
      setLoadingUsers(false);
    } catch (err) {
      console.error('Error loading user or related users:', err);
      setError('Error al cargar la información del usuario');
      setLoadingUsers(false);
    }
  };

  const handleCancel = () => {
    clearProducts();
    router.push('/');
  };

  const handleSend = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validar que haya productos en el pedido
      if (products.length === 0) {
        setError('Debe agregar al menos un producto al pedido');
        setLoading(false);
        return;
      }

      // Validar que todos los productos tengan bodega_id
      const productsWithoutWarehouse = products.filter(p => !p.bodega_id);
      if (productsWithoutWarehouse.length > 0) {
        setError('Algunos productos no tienen bodega asignada');
        setLoading(false);
        return;
      }

      // Obtener el usuario autenticado
      const user = currentUser || await getCurrentUser();

      // Validar que haya seleccionado un usuario (cliente o vendedor según el rol)
      if (!selectedUserId) {
        const userToSelectLabel = user.role === 'seller' ? 'un cliente institucional' : 'un vendedor';
        setError(`Debe seleccionar ${userToSelectLabel}`);
        setLoading(false);
        return;
      }

      // Asignar cliente_id y vendedor_id según el rol del usuario
      let clienteId: number;
      let vendedorId: number;

      if (user.role === 'institutional_customer') {
        // Si es cliente institucional: cliente_id = user.id, vendedor_id = seller seleccionado
        clienteId = parseInt(user.id, 10) || 12345;
        vendedorId = selectedUserId;
      } else if (user.role === 'seller') {
        // Si es vendedor: cliente_id = cliente seleccionado, vendedor_id = user.id
        clienteId = selectedUserId;
        vendedorId = parseInt(user.id, 10) || 9001;
      } else {
        // Valores por defecto para otros roles
        clienteId = 12345;
        vendedorId = 9001;
      }

      // Usar la bodega del primer producto (todas deberían ser la misma en este caso)
      const bodegaOrigenId = products[0].bodega_id!;

      // Preparar los items del pedido
      const items = products.map(product => ({
        producto_id: product.id,
        cantidad: product.cantidad,
        precio_unitario: product.precio_unitario || 0,
        impuesto_pct: product.impuesto_pct || 19,
        sku: product.sku
      }));

      // Crear el payload del pedido
      const orderPayload = {
        tipo: 'VENTA',
        cliente_id: clienteId,
        vendedor_id: vendedorId,
        bodega_origen_id: bodegaOrigenId,
        items: items,
        observaciones: orderObservations || undefined,
      };

      // Llamar al servicio de creación de pedido (ya no necesitamos pasar el país)
      const response = await createOrder(orderPayload);

      // Mostrar mensaje de éxito
      setSuccessMessage('Pedido creado exitosamente');

      // Limpiar productos después de enviar
      clearProducts();
      
      // Redirigir después de un breve delay para mostrar el mensaje
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      console.error('Error al crear el pedido:', err);
      setError(err instanceof Error ? err.message : 'Error al crear el pedido');
    } finally {
      setLoading(false);
    }
  };

  // Preparar opciones para el select
  const selectOptions: SelectOption[] = currentUser?.role === 'seller'
    ? institutionalCustomers.map(customer => ({
        label: `${customer.institution_name} - ${customer.username}`,
        value: customer.id
      }))
    : sellers.map(seller => ({
        label: seller.full_name ? `${seller.username} - ${seller.full_name}` : seller.username,
        value: seller.id
      }));

  if (loading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6750A4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('newOrder')}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Fecha de entrega */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('deliveryDate')}</Text>
          <TextInput
            style={styles.input}
            value={deliveryDate}
            onChangeText={setDeliveryDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
        </View>

        {/* Select de Usuario - Cliente Institucional para sellers, Vendedor para clientes */}
        {currentUser && (
          <CustomSelect
            label={currentUser.role === 'seller' ? 'Cliente Institucional' : 'Vendedor'}
            value={selectedUserId}
            options={selectOptions}
            onChange={(value) => setSelectedUserId(value as number)}
            disabled={loadingUsers}
            loading={loadingUsers}
          />
        )}

        {/* Lista de productos */}
        <View style={styles.productListContainer}>
          <Text style={styles.sectionTitle}>Productos</Text>
          {products.length === 0 ? (
            <Text style={styles.emptyText}>No hay productos agregados</Text>
          ) : (
            products.map((product) => (
              <View key={product.id} style={styles.productItem}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>
                    {product.nombre} ({product.sku})
                  </Text>
                  <Text style={styles.productDetails}>
                    Cantidad: {product.cantidad}
                    {product.observaciones ? ` - ${product.observaciones}` : ''}
                  </Text>
                  <Text style={styles.productStock}>Stock: {product.stock}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeProduct(product.id)}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Botón flotante para agregar producto */}
        <View style={styles.addButtonContainer}>
          <Link href="/new-order/add-product" asChild>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Agregar Producto</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Observaciones */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('observations')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={orderObservations}
            onChangeText={setOrderObservations}
            placeholder="Ingrese observaciones..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button, 
            styles.sendButton,
            (loading || products.length === 0) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={loading || products.length === 0}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>{t('send')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Custom Alerts */}
      <CustomAlert
        visible={!!error}
        message={error}
        type="error"
        onClose={() => setError(null)}
      />
      <CustomAlert
        visible={!!successMessage}
        message={successMessage}
        type="success"
        onClose={() => setSuccessMessage(null)}
      />
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6750A4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6750A4',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6750A4',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  selectContainer: {
    marginBottom: 16,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  selectButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6750A4',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonDisabled: {
    backgroundColor: '#F0F0F0',
    opacity: 0.6,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectPlaceholder: {
    color: '#999',
    fontStyle: 'italic',
  },
  selectArrow: {
    fontSize: 12,
    color: '#6750A4',
    marginLeft: 8,
  },
  selectLoading: {
    marginTop: 8,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalOptionSelected: {
    backgroundColor: '#E8DEF8',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    fontWeight: 'bold',
    color: '#6750A4',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#6750A4',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  productListContainer: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 16,
  },
  productItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 14,
    color: '#999',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC362E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButtonContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  addButton: {
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#6750A4',
  },
  addButtonText: {
    color: '#6750A4',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6750A4',
  },
  cancelButtonText: {
    color: '#6750A4',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#6750A4',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  alertContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  alertError: {
    backgroundColor: '#DC362E',
  },
  alertSuccess: {
    backgroundColor: '#2E7D32',
  },
  alertText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  alertClose: {
    marginLeft: 12,
    padding: 4,
  },
  alertCloseText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default NewOrderScreen;
