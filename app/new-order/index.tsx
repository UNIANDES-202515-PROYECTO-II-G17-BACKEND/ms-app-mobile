import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Fab, IconButton, List, ListItem, ListItemText, TextField, ThemeProvider, Typography } from '@mui/material';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import theme from '../common/theme';
import { useOrder } from '../contexts/OrderContext';
import { getAccessToken } from '../services/storageService';
import { getCurrentUser } from '../services/userService';

const NewOrderScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { products, removeProduct, clearProducts } = useOrder();
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderObservations, setOrderObservations] = useState('');

  const handleCancel = () => {
    clearProducts();
    router.push('/');
  };

  const handleSend = async () => {
    try {
      // Obtener el usuario autenticado
      const user = await getCurrentUser('co');
      const token = await getAccessToken();

      // Estructura del payload que se enviaría al servicio
      const orderPayload = {
        usuario_id: user.id,
        fecha_entrega: deliveryDate,
        observaciones_generales: orderObservations,
        productos: products.map(product => ({
        producto_id: product.id,
        sku: product.sku,
        nombre: product.nombre,
        cantidad: product.cantidad,
        observaciones: product.observaciones || null
      })),
      total_productos: products.length,
      cantidad_total: products.reduce((sum, p) => sum + p.cantidad, 0)
    };

    console.log('==============================================');
    console.log('📦 DATOS QUE SE ENVIARÍAN AL SERVICIO DE PEDIDOS:');
    console.log('==============================================');
    console.log(`Usuario ID: ${user.id}`);
    console.log(`Usuario: ${user.username}`);
    console.log(`Token: ${token?.substring(0, 20)}...`);
    console.log('==============================================');
    console.log(JSON.stringify(orderPayload, null, 2));
    console.log('==============================================');
    console.log('Resumen:');
    console.log(`- Usuario ID: ${user.id}`);
    console.log(`- Fecha de entrega: ${deliveryDate || 'No especificada'}`);
    console.log(`- Total de productos: ${products.length}`);
    console.log(`- Cantidad total de items: ${orderPayload.cantidad_total}`);
    console.log(`- Observaciones: ${orderObservations || 'Ninguna'}`);
    console.log('==============================================');
    
    // TODO: Implementar llamada al servicio de creación de pedido
    // const response = await orderService.createOrder(orderPayload, token);
    
    // Limpiar productos después de enviar
    clearProducts();
    router.push('/');
    } catch (error) {
      console.error('Error al preparar el pedido:', error);
      // TODO: Mostrar mensaje de error al usuario
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
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            {t('send')}
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default NewOrderScreen;
