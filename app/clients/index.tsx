import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import BottomNavigationBar from '../common/BottomNavigationBar';
import { useUserRole } from '../hooks/useUserRole';
import { getInstitutionalCustomers, InstitutionalCustomer } from '../services/userService';

const ClientsScreen = () => {
  const { t } = useTranslation();
  const { userRole } = useUserRole();
  const [value, setValue] = useState(2); // Clients tab
  const [clients, setClients] = useState<InstitutionalCustomer[]>([]);
  const [filteredClients, setFilteredClients] = useState<InstitutionalCustomer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Función para cargar los clientes
  const fetchClients = async () => {
    try {
      setError(null);
      const data = await getInstitutionalCustomers(undefined, 100); // Traer hasta 100 clientes
      setClients(data);
      setFilteredClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Cargar clientes al montar el componente
  useEffect(() => {
    fetchClients();
  }, []);

  // Filtrar clientes localmente cuando cambia el query de búsqueda
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(client => 
        client.institution_name.toLowerCase().includes(query) ||
        client.username.toLowerCase().includes(query) ||
        (client.full_name && client.full_name.toLowerCase().includes(query)) ||
        (client.email && client.email.toLowerCase().includes(query))
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  // Simula la recarga de datos
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Renderizar cada cliente
  const renderClientItem = ({ item }: { item: InstitutionalCustomer }) => (
    <View style={styles.clientCard}>
      <View style={styles.clientHeader}>
        <Text style={styles.institutionName}>{item.institution_name}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      
      <View style={styles.clientDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('clientId')}:</Text>
          <Text style={styles.detailValue}>{item.id}</Text>
        </View>

        {item.full_name && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('contact')}:</Text>
            <Text style={styles.detailValue}>{item.full_name}</Text>
          </View>
        )}
        
        {item.email && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('email')}:</Text>
            <Text style={styles.detailValue}>{item.email}</Text>
          </View>
        )}
        
        {item.telephone && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('phone')}:</Text>
            <Text style={styles.detailValue}>{item.telephone}</Text>
          </View>
        )}
        
        {item.document_number && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{item.document_type?.toUpperCase()}:</Text>
            <Text style={styles.detailValue}>{item.document_number}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('registeredDate')}:</Text>
          <Text style={styles.detailValue}>{formatDate(item.created_at)}</Text>
        </View>

        {item.updated_at && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('lastUpdate')}:</Text>
            <Text style={styles.detailValue}>{formatDate(item.updated_at)}</Text>
          </View>
        )}
      </View>
    </View>
  );

  // Renderizar cuando no hay clientes
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery ? t('noClientsFilter') : t('noClients')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Intenta con otro término de búsqueda'
          : t('noClientsMessage')}
      </Text>
    </View>
  );

  // Mostrar spinner mientras carga
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6750A4" />
      </View>
    );
  }

  // Mostrar error si ocurrió
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('clients')}</Text>
          <Text style={styles.subtitle}>
            {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
          </Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️</Text>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
        <BottomNavigationBar value={value} setValue={setValue} role={userRole} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('clients')}</Text>
        <Text style={styles.subtitle}>
          {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchClients')}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Text 
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            ✕
          </Text>
        )}
      </View>

      {/* Lista de clientes */}
      <FlatList
        data={filteredClients}
        renderItem={renderClientItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={filteredClients.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6750A4']}
            tintColor="#6750A4"
          />
        }
      />

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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 8,
    padding: 8,
    fontSize: 18,
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
  clientCard: {
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
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  institutionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  username: {
    fontSize: 14,
    color: '#6750A4',
    fontWeight: '500',
  },
  clientDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginRight: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ClientsScreen;
