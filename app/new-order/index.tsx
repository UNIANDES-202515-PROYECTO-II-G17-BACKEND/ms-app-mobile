import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Alert, Box, Button, CircularProgress, Fab, IconButton, List, ListItem, ListItemText, Snackbar, TextField, ThemeProvider, Typography } from '@mui/material';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import theme from '../common/theme';
import { useOrder } from '../contexts/OrderContext';
import { createOrder } from '../services/orderService';
import { getCurrentUser } from '../services/userService';

const NewOrderScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { products, removeProduct, clearProducts } = useOrder();
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderObservations, setOrderObservations] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      const user = await getCurrentUser('co');

      // Asignar cliente_id y vendedor_id según el rol del usuario
      let clienteId: number;
      let vendedorId: number;

      if (user.role === 'institutional_customer') {
        // Si es cliente institucional: cliente_id = user.id, vendedor_id = 9001
        clienteId = parseInt(user.id, 10) || 12345;
        vendedorId = 9001;
      } else if (user.role === 'seller') {
        // Si es vendedor: cliente_id = 12345, vendedor_id = user.id
        clienteId = 12345;
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

      // Llamar al servicio de creación de pedido
      const response = await createOrder(orderPayload, 'co');

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

  return (
    <ThemeProvider theme={theme}>
      <Box bgcolor="secondary.main" minHeight="100vh" display="flex" flexDirection="column">
        {/* Content */}
        <Box flex={1} p={3}>
          <Typography variant="h5" color="primary" align="center" mb={3}>
            {t('newOrder')}
          </Typography>

          {/* Fecha de entrega */}
          <Box mb={2}>
            <TextField
              fullWidth
              label={t('deliveryDate')}
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          </Box>

          {/* Lista de productos */}
          <Box mb={3}>
            <List>
              {products.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" py={2}>
                  No hay productos agregados
                </Typography>
              ) : (
                products.map((product, index) => (
                  <ListItem
                    key={product.id}
                    sx={{
                      bgcolor: 'white',
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.300',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box flex={1}>
                      <ListItemText
                        primary={`${product.nombre} (${product.sku})`}
                        secondary={`Cantidad: ${product.cantidad}${product.observaciones ? ` - ${product.observaciones}` : ''}`}
                      />
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" color="text.secondary">
                        Stock: {product.stock}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => removeProduct(product.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))
              )}
            </List>
          </Box>

          {/* Botón flotante para agregar producto */}
          <Box display="flex" justifyContent="center" mb={3}>
            <Link href="/new-order/add-product" asChild>
              <Fab
                color="secondary"
                aria-label="add"
                sx={{
                  bgcolor: 'rgba(103, 80, 164, 0.1)',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(103, 80, 164, 0.2)',
                  },
                }}
              >
                <AddIcon />
              </Fab>
            </Link>
          </Box>

          {/* Observaciones */}
          <Box mb={3}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label={t('observations')}
              value={orderObservations}
              onChange={(e) => setOrderObservations(e.target.value)}
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
            disabled={loading}
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
            onClick={handleSend}
            disabled={loading || products.length === 0}
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
            {loading ? <CircularProgress size={24} color="inherit" /> : t('send')}
          </Button>
        </Box>

        {/* Snackbar para errores */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        {/* Snackbar para éxito */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default NewOrderScreen;
