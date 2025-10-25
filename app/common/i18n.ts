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
      city: 'City',
      order: 'Order',
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
      draft: 'Draft',
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
      // Order detail screen
      code: 'Code',
      client: 'Client',
      seller: 'Seller',
      type: 'Type',
      total: 'Total',
      orderItems: 'Order Items',
      unitPrice: 'Unit Price',
      subtotal: 'Subtotal',
      loading: 'Loading',
      loadingOrderDetail: 'Loading order details...',
      orderNotFound: 'Order not found',
      back: 'Back',
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
      address: 'Address',
      // Visits screen
      visits: 'Visits',
      myVisits: 'My Visits',
      noVisits: 'No Visits',
      noVisitsMessage: 'You don\'t have any visits yet',
      noVisitsFilter: 'No visits found with this filter',
      visit: 'Visit',
      filterByDate: 'Filter by date',
      dateFormatHint: 'Format: Year-Month-Day (e.g., 2025-10-24)',
      selectDate: 'Select date',
      apply: 'Apply',
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
      city: 'Ciudad',
      order: 'Pedido',
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
      draft: 'Borrador',
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
      // Order detail screen
      code: 'Código',
      client: 'Cliente',
      seller: 'Vendedor',
      type: 'Tipo',
      total: 'Total',
      orderItems: 'Items del pedido',
      unitPrice: 'Precio unitario',
      subtotal: 'Subtotal',
      loading: 'Cargando',
      loadingOrderDetail: 'Cargando detalle del pedido...',
      orderNotFound: 'Pedido no encontrado',
      back: 'Volver',
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
      address: 'Dirección',
      // Register Visit screen
      registerVisit: 'Registrar Visita',
      contactName: 'Nombre del Contacto',
      technicalFindings: 'Hallazgos Técnicos',
      productSuggestions: 'Sugerencias de Producto',
      requiredFields: 'Campos obligatorios',
      pleaseCompleteAllFields: 'Por favor complete todos los campos obligatorios',
      visitRegisteredSuccess: 'Visita registrada exitosamente.',
      errorRegisteringVisit: 'Error al registrar la visita',
      errorLoadingClients: 'Error al cargar la lista de clientes',
      selectClient: 'Seleccione cliente',
      enterContactName: 'Ingrese el nombre del contacto',
      describeTechnicalFindings: 'Describa los hallazgos técnicos o clínicos encontrados durante la visita',
      describeProductSuggestions: 'Describa las sugerencias de productos o recomendaciones',
      close: 'Cerrar',
      // Visits screen
      visits: 'Visitas',
      myVisits: 'Mis Visitas',
      noVisits: 'No hay visitas',
      noVisitsMessage: 'Aún no tienes visitas registradas',
      noVisitsFilter: 'No hay visitas con este filtro',
      visit: 'Visita',
      filterByDate: 'Filtrar por fecha',
      dateFormatHint: 'Formato: Año-Mes-Día (ej: 2025-10-24)',
      selectDate: 'Seleccionar fecha',
      apply: 'Aplicar',
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