import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomNavigationBar from './common/BottomNavigationBar';
import { useUserRole } from './hooks/useUserRole';
import { getVisits } from './services/visitService';

const HomeScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [value, setValue] = useState(0); // Default to 'Home' tab
  const { userRole } = useUserRole();
  const [visitsCount, setVisitsCount] = useState(0);

  // Cargar el contador de visitas
  useEffect(() => {
    const fetchVisitsCount = async () => {
      if (userRole === 'seller') {
        try {
          const visits = await getVisits();
          setVisitsCount(visits.length);
        } catch (error) {
          console.error('Error fetching visits count:', error);
        }
      }
    };
    
    fetchVisitsCount();
  }, [userRole]);

  const handleViewVisits = () => {
    router.push('/visits');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../assets/images/logo.png')} 
          style={styles.logo}
        />
        <Text style={styles.subtitle}>
          {t('welcome')} <Text style={{ fontWeight: 'bold' }}>{t('appName')}</Text>!
        </Text>
        <Text style={styles.subtitle}>{t('welcomeMessage')}</Text>

        {/* Botón de Ver Visitas - Solo para sellers */}
        {userRole === 'seller' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.visitsButton}
              onPress={handleViewVisits}
            >
              <Text style={styles.visitsButtonIcon}>📋</Text>
              <View style={styles.visitsButtonContent}>
                <Text style={styles.visitsButtonText}>{t('myVisits')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <BottomNavigationBar value={value} setValue={setValue} role={userRole} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6750A4',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6750A4',
  },
  actionsContainer: {
    marginTop: 32,
    width: '100%',
    maxWidth: 400,
  },
  visitsButton: {
    backgroundColor: '#6750A4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  visitsButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  visitsButtonContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  visitsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  visitsCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 2,
  },
});

export default HomeScreen;
