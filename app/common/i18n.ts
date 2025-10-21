import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';

const resources = {
  en: {
    translation: {
      country: 'Country',
      language: 'Language',
      home: 'Home',
      clients: 'Clients',
      routes: 'Routes',
      settings: 'Settings',
      username: 'Username',
      password: 'Password',
      login: 'Login',
      createAccount: 'Create Account',
      register: 'Register',
      backToLogin: 'Back to Login',
      institutionName: 'Institution Name',
      nit: 'NIT',
      phone: 'Phone Number',
      email: 'Email',
      orders: 'Orders',
      deliveries: 'Deliveries',
      newOrder: 'New Order',
      newProduct: 'New Product',
      product: 'Product',
      element: 'Element',
      quantity: 'Quantity',
      deliveryDate: 'Delivery Date',
      observations: 'Observations',
      cancel: 'Cancel',
      send: 'Send',
      add: 'Add',
      stock: 'Stock',
      selectProduct: 'Select a product',
      quantityExceedsStock: 'Quantity exceeds available stock',
      logout: 'Log out',
      logoutConfirmation: 'Are you sure you want to log out?',
      // Orders screen
      all: 'All',
      pending: 'Pending',
      in_process: 'In Process',
      completed: 'Completed',
      cancelled: 'Cancelled',
      date: 'Date',
      items: 'Items',
      notes: 'Notes',
      viewDetails: 'View Details',
      noOrders: 'No Orders',
      noOrdersMessage: 'You don\'t have any orders yet',
      noOrdersFilter: 'No orders found with this filter',
      // Home screen
      welcome: 'Welcome to',
      appName: 'MediSupply',
      welcomeMessage: 'Your medical supply management platform',
      quickActions: 'Quick Actions',
      viewOrders: 'View Orders',
      createOrder: 'Create New Order',
      manageInventory: 'Manage Inventory',
      // Clients screen
      searchClients: 'Search clients...',
      noClients: 'No Clients',
      noClientsMessage: 'No clients found',
      noClientsFilter: 'No clients found with this search',
      institution: 'Institution',
      contact: 'Contact',
      clientId: 'Client ID',
      registeredDate: 'Registered',
      lastUpdate: 'Last Update',
    },
  },
  es: {
    translation: {
      country: 'País',
      language: 'Idioma',
      home: 'Inicio',
      clients: 'Clientes',
      routes: 'Rutas',
      settings: 'Ajustes',
      username: 'Usuario',
      password: 'Contraseña',
      login: 'Ingresar',
      createAccount: 'Crear cuenta',
      register: 'Registrarse',
      backToLogin: 'Volver al login',
      institutionName: 'Nombre de la institución',
      nit: 'NIT',
      phone: 'Teléfono fijo',
      email: 'Correo electrónico',
      orders: 'Pedidos',
      deliveries: 'Entregas',
      newOrder: 'Nuevo pedido',
      newProduct: 'Nuevo producto',
      product: 'Producto',
      element: 'Elemento',
      quantity: 'Cantidad',
      deliveryDate: 'Fecha de entrega',
      observations: 'Observaciones',
      cancel: 'Cancelar',
      send: 'Enviar',
      add: 'Agregar',
      stock: 'Stock',
      selectProduct: 'Selecciona un producto',
      quantityExceedsStock: 'La cantidad excede el stock disponible',
      logout: 'Cerrar sesión',
      logoutConfirmation: '¿Estás seguro de que deseas cerrar sesión?',
      // Orders screen
      all: 'Todos',
      pending: 'Pendiente',
      in_process: 'En Proceso',
      completed: 'Completado',
      cancelled: 'Cancelado',
      date: 'Fecha',
      items: 'Artículos',
      notes: 'Notas',
      viewDetails: 'Ver detalles',
      noOrders: 'No hay pedidos',
      noOrdersMessage: 'Aún no tienes pedidos registrados',
      noOrdersFilter: 'No hay pedidos con este filtro',
      // Home screen
      welcome: 'Bienvenido a',
      appName: 'MediSupply',
      welcomeMessage: 'Tu plataforma de gestión de suministros médicos',
      quickActions: 'Acciones Rápidas',
      viewOrders: 'Ver Pedidos',
      createOrder: 'Crear Nuevo Pedido',
      manageInventory: 'Gestionar Inventario',
      // Clients screen
      searchClients: 'Buscar clientes...',
      noClients: 'No hay clientes',
      noClientsMessage: 'No se encontraron clientes',
      noClientsFilter: 'No se encontraron clientes con esta búsqueda',
      institution: 'Institución',
      contact: 'Contacto',
      clientId: 'ID Cliente',
      registeredDate: 'Registrado',
      lastUpdate: 'Última actualización',
    },
  },
};

const isMobile = Platform.OS !== 'web';

if (isMobile) {
  AsyncStorage.getItem('language').then((language) => {
    i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: language || 'es', // Default language
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
        },
      });
  });
} else {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'es', // Default language for web
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
}

export const changeLanguage = async (language: string) => {
  await AsyncStorage.setItem('language', language);
  i18n.changeLanguage(language);
};

export default i18n;