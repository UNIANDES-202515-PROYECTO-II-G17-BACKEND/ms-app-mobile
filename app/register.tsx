import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CountryCode, register } from './services/authService';

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [formData, setFormData] = useState({
    institutionName: '',
    nit: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    username: '',
    password: '',
    country: 'mx' as CountryCode,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setError('');
      setLoading(true);
      
      await register({
        username: formData.username,
        password: formData.password,
        institution_name: formData.institutionName,
        address: formData.address,
        city: formData.city,
      }, formData.country);
      
      // Navigate to login on success
      router.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../assets/images/logo.png')} 
          style={styles.logo}
        />
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('institutionName')}</Text>
            <TextInput
              testID="input-Institution Name"
              style={styles.input}
              value={formData.institutionName}
              onChangeText={(text) => setFormData({ ...formData, institutionName: text })}
              placeholder={t('institutionName')}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('nit')}</Text>
            <TextInput
              testID="input-NIT"
              style={styles.input}
              value={formData.nit}
              onChangeText={(text) => setFormData({ ...formData, nit: text })}
              placeholder={t('nit')}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('phone')}</Text>
            <TextInput
              testID="input-Phone"
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder={t('phone')}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('email')}</Text>
            <TextInput
              testID="input-Email"
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder={t('email')}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('address')}</Text>
            <TextInput
              testID="input-Address"
              style={styles.input}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder={t('address')}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('city')}</Text>
            <TextInput
              testID="input-City"
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholder={t('city')}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('username')}</Text>
            <TextInput
              testID="input-Username"
              style={styles.input}
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              placeholder={t('username')}
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('password')}</Text>
            <TextInput
              testID="input-Password"
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder={t('password')}
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <CountrySelect
            label={t('country')}
            value={formData.country}
            onChange={(value) => setFormData({ ...formData, country: value })}
          />

          <TouchableOpacity
            testID="button-Register"
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Cargando...' : t('register')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="button-Back to Login"
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.secondaryButtonText}>
              {t('backToLogin')}
            </Text>
          </TouchableOpacity>

          {error && (
            <View testID="error-box" style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// Custom Select Component
interface SelectOption {
  label: string;
  value: CountryCode;
}

interface CountrySelectProps {
  label: string;
  value: CountryCode;
  onChange: (value: CountryCode) => void;
}

const CountrySelect: React.FC<CountrySelectProps> = ({ label, value, onChange }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const options: SelectOption[] = [
    { label: 'México', value: 'mx' },
    { label: 'Colombia', value: 'co' },
    { label: 'Perú', value: 'pe' },
    { label: 'Argentina', value: 'ar' },
  ];

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={styles.selectContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectButtonText}>
          {selectedOption?.label || 'Seleccione un país'}
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
            <ScrollView>
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
    paddingTop: 40,
    paddingBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 32,
  },
  form: {
    width: '100%',
    maxWidth: 300,
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
  selectContainer: {
    marginBottom: 16,
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
  selectArrow: {
    fontSize: 12,
    color: '#6750A4',
    marginLeft: 8,
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
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#6750A4',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#6750A4',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
});

