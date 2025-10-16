import { Alert, Box, Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, TextField, ThemeProvider, Typography } from '@mui/material';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import theme from '../common/theme';
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
      <ThemeProvider theme={theme}>
        <Box bgcolor="secondary.main" minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box bgcolor="secondary.main" minHeight="100vh" display="flex" flexDirection="column">
        {/* Content */}
        <Box flex={1} p={3}>
          <Typography variant="h5" color="primary" align="center" mb={3}>
            {t('newProduct')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Select de Elemento (Producto) */}
          <Box mb={2}>
            <FormControl fullWidth>
              <InputLabel id="product-select-label">{t('element')}</InputLabel>
              <Select
                labelId="product-select-label"
                value={selectedProductId}
                label={t('element')}
                onChange={(e) => setSelectedProductId(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                <MenuItem value="">
                  <em>{t('selectProduct')}</em>
                </MenuItem>
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.nombre} ({product.sku})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Mostrar stock del producto seleccionado */}
          {loadingDetail && (
            <Box display="flex" justifyContent="center" mb={2}>
              <CircularProgress size={24} />
            </Box>
          )}

          {productDetail && !loadingDetail && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                {t('stock')}: {productDetail.stock_total}
              </Typography>
            </Box>
          )}

          {/* Campo Cantidad */}
          <Box mb={2}>
            <TextField
              fullWidth
              label={t('quantity')}
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              error={!!quantityError}
              helperText={quantityError}
              inputProps={{ min: 1 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          </Box>

          {/* Campo Observaciones */}
          <Box mb={3}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label={t('observations')}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          </Box>
        </Box>

        {/* Botones de acción */}
        <Box p={2} display="flex" gap={2}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleCancel}
            sx={{
              borderColor: 'primary.main',
              color: 'primary.main',
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            {t('cancel')}
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleAdd}
            disabled={isAddDisabled}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&:disabled': {
                bgcolor: 'grey.300',
                color: 'grey.500',
              },
            }}
          >
            {t('add')}
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AddProductScreen;
