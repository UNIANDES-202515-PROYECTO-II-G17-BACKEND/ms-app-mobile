import { useRouter } from 'expo-router';
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
import { getAllProducts, getProductDetail, getProductLocations, Product, ProductDetail, ProductLocation } from '../services/productService';

const AddProductScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { addProduct } = useOrder();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [productLocations, setProductLocations] = useState<ProductLocation[]>([]);
  const [quantity, setQuantity] = useState('');
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadProductDetail(selectedProductId);
    } else {
      setProductDetail(null);
    }
  }, [selectedProductId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts('co', 100, 0);
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const loadProductDetail = async (productId: string) => {
    try {
      setLoadingDetail(true);
      const [detail, locations] = await Promise.all([
        getProductDetail(productId, 'co'),
        getProductLocations(productId, 'co')
      ]);
      setProductDetail(detail);
      setProductLocations(locations);
    } catch (err) {
      console.error('Error loading product detail:', err);
      setError('Error al cargar el detalle del producto');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    
    if (productDetail && value) {
      const numValue = parseInt(value, 10);
      if (numValue > productDetail.stock_total) {
        setQuantityError(t('quantityExceedsStock'));
      } else {
        setQuantityError(null);
      }
    } else {
      setQuantityError(null);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleAdd = () => {
    if (!selectedProductId || !quantity || quantityError || !productDetail) {
      return;
    }

    // Obtener la primera bodega disponible (si existe)
    const bodegaId = productLocations.length > 0 ? productLocations[0].bodega_id : undefined;

    // Agregar producto al pedido usando el contexto
    addProduct({
      id: selectedProductId,
      nombre: productDetail.nombre,
      sku: productDetail.sku,
      cantidad: parseInt(quantity, 10),
      stock: productDetail.stock_total,
      observaciones: observations || undefined,
      bodega_id: bodegaId,
      precio_unitario: 0, // Valor por defecto, se puede ajustar según necesidad
      impuesto_pct: 19, // IVA por defecto para Colombia
    });

    router.back();
  };

  const isAddDisabled = !selectedProductId || !quantity || !!quantityError || parseInt(quantity, 10) <= 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6750A4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('newProduct')}</Text>

        {error && (
          <View style={styles.errorAlert}>
            <Text style={styles.errorAlertText}>{error}</Text>
          </View>
        )}

        {/* Select de Elemento (Producto) */}
        <ProductSelect
          label={t('element')}
          value={selectedProductId}
          products={products}
          onChange={setSelectedProductId}
        />

        {/* Mostrar stock del producto seleccionado */}
        {loadingDetail && (
          <View style={styles.loadingDetail}>
            <ActivityIndicator size="small" color="#6750A4" />
          </View>
        )}

        {productDetail && !loadingDetail && (
          <View style={styles.stockContainer}>
            <Text style={styles.stockText}>
              {t('stock')}: {productDetail.stock_total}
            </Text>
          </View>
        )}

        {/* Campo Cantidad */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('quantity')}</Text>
          <TextInput
            style={[styles.input, quantityError && styles.inputError]}
            value={quantity}
            onChangeText={handleQuantityChange}
            placeholder={t('quantity')}
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          {quantityError && (
            <Text style={styles.errorText}>{quantityError}</Text>
          )}
        </View>

        {/* Campo Observaciones */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('observations')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={observations}
            onChangeText={setObservations}
            placeholder={t('observations')}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button, 
            styles.addButton,
            isAddDisabled && styles.addButtonDisabled
          ]}
          onPress={handleAdd}
          disabled={isAddDisabled}
        >
          <Text style={styles.addButtonText}>{t('add')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Custom Product Select Component
interface ProductSelectProps {
  label: string;
  value: string;
  products: Product[];
  onChange: (value: string) => void;
}

const ProductSelect: React.FC<ProductSelectProps> = ({ label, value, products, onChange }) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedProduct = products.find(p => p.id === value);

  return (
    <View style={styles.selectContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          styles.selectButtonText,
          !selectedProduct && styles.selectPlaceholder
        ]}>
          {selectedProduct 
            ? `${selectedProduct.nombre} (${selectedProduct.sku})` 
            : t('selectProduct')}
        </Text>
        <Text style={styles.selectArrow}>▼</Text>
      </TouchableOpacity>

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
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  !value && styles.modalOptionSelected
                ]}
                onPress={() => {
                  onChange('');
                  setModalVisible(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  !value && styles.modalOptionTextSelected
                ]}>
                  {t('selectProduct')}
                </Text>
              </TouchableOpacity>
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.modalOption,
                    product.id === value && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    onChange(product.id);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    product.id === value && styles.modalOptionTextSelected
                  ]}>
                    {product.nombre} ({product.sku})
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
  errorAlert: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorAlertText: {
    color: '#C62828',
    fontSize: 14,
  },
  selectContainer: {
    marginBottom: 16,
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
  inputError: {
    borderColor: '#C62828',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    color: '#C62828',
    fontSize: 12,
    marginTop: 4,
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
  loadingDetail: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stockContainer: {
    backgroundColor: '#E8DEF8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  stockText: {
    fontSize: 14,
    color: '#333',
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
  addButton: {
    backgroundColor: '#6750A4',
  },
  addButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddProductScreen;
