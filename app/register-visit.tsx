import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { getInstitutionalCustomers, InstitutionalCustomer } from './services/userService';
import { createVisit, createVisitDetail } from './services/visitService';

// Custom Alert Component
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

// Custom Select Component
interface SelectOption {
  label: string;
  value: number;
}

interface CustomSelectProps {
  label: string;
  value: number | '';
  options: SelectOption[];
  onChange: (value: number) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  t: any; // Translation function
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
  label, 
  value, 
  options, 
  onChange, 
  disabled = false,
  loading = false,
  error = false,
  t
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label} *</Text>
      <TouchableOpacity
        style={[
          styles.selectButton,
          disabled && styles.selectButtonDisabled,
          error && styles.inputError
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.selectButtonText,
          !selectedOption && styles.selectPlaceholder
        ]}>
          {selectedOption ? selectedOption.label : `${t('selectClient')}`}
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
              <Text style={styles.modalCloseButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const RegisterVisitScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Obtener parámetros de la visita seleccionada
  const clientId = params.clientId ? Number(params.clientId) : null;
  const clientName = params.clientName as string || '';
  const contactName = params.contactName as string || '';
  const visitId = params.visitId as string || '';
  
  // Form state
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [nombreContacto, setNombreContacto] = useState('');
  const [hallazgosTecnicos, setHallazgosTecnicos] = useState('');
  const [sugerenciasProducto, setSugerenciasProducto] = useState('');
  const [mediaFiles, setMediaFiles] = useState<ImagePicker.ImagePickerAsset[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [clients, setClients] = useState<InstitutionalCustomer[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});

  // Pre-cargar datos si vienen de una visita existente
  useEffect(() => {
    if (clientId) {
      setSelectedClientId(clientId);
    }
    if (contactName) {
      setNombreContacto(contactName);
    }
  }, [clientId, contactName]);

  useEffect(() => {
    // Solo cargar clientes si no viene un clientId pre-seleccionado
    if (!clientId) {
      loadClients();
    }
  }, [clientId]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const data = await getInstitutionalCustomers();
      setClients(data);
    } catch (err) {
      console.error('Error loading clients:', err);
      setError(t('errorLoadingClients'));
    } finally {
      setLoadingClients(false);
    }
  };

  const pickMedia = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setError(t('mediaPermissionDenied') || 'Se necesitan permisos para acceder a la galería');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: false,
        quality: 0.8,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled && result.assets) {
        setMediaFiles(result.assets);
      }
    } catch (err) {
      console.error('Error picking media:', err);
      setError(t('errorPickingMedia') || 'Error al seleccionar archivo');
    }
  };

  const removeMedia = (index: number) => {
    const newMediaFiles = mediaFiles.filter((_, i) => i !== index);
    setMediaFiles(newMediaFiles);
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: boolean} = {};
    
    // Solo validar cliente y contacto si no vienen de parámetros
    if (!clientId && !selectedClientId) {
      errors.cliente = true;
    }
    if (!contactName && !nombreContacto.trim()) {
      errors.nombreContacto = true;
    }
    if (!hallazgosTecnicos.trim()) {
      errors.hallazgosTecnicos = true;
    }
    if (!sugerenciasProducto.trim()) {
      errors.sugerenciasProducto = true;
    }

    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setError(t('pleaseCompleteAllFields'));
      return false;
    }
    
    return true;
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (!validateForm()) {
        return;
      }

      setLoading(true);

      // Usar clientId del parámetro si existe, sino el seleccionado
      const finalClientId = clientId || (selectedClientId as number);
      const finalContactName = contactName || nombreContacto.trim();

      // Si viene de una visita existente (tiene visitId), crear detalle
      if (visitId) {
        const detailData: any = {
          id_cliente: String(finalClientId),
          atendido_por: finalContactName,
          hallazgos: hallazgosTecnicos.trim(),
          sugerencias_producto: sugerenciasProducto.trim(),
        };

        // Agregar foto si existe (solo la primera por ahora)
        if (mediaFiles.length > 0) {
          const file = mediaFiles[0];
          const fileName = file.uri.split('/').pop() || 'photo.jpg';
          const fileType = file.type === 'video' ? 'video/mp4' : 'image/jpeg';
          
          detailData.foto = {
            uri: file.uri,
            type: fileType,
            name: fileName,
          };
        }

        await createVisitDetail(visitId, detailData);
      } else {
        // Si no, crear nueva visita (comportamiento anterior)
        const visitData = {
          cliente_id: finalClientId,
          nombre_contacto: finalContactName,
          hallazgos_tecnicos: hallazgosTecnicos.trim(),
          sugerencias_producto: sugerenciasProducto.trim(),
        };

        await createVisit(visitData);
      }

      setSuccessMessage(t('visitRegisteredSuccess'));
      
      // Reset form
      setSelectedClientId('');
      setNombreContacto('');
      setHallazgosTecnicos('');
      setSugerenciasProducto('');
      setMediaFiles([]);
      setFieldErrors({});
      
      // Redirect after a brief delay
      setTimeout(() => {
        router.push('/home');
      }, 2000);
    } catch (err) {
      console.error('Error creating visit:', err);
      setError(err instanceof Error ? err.message : t('errorRegisteringVisit'));
    } finally {
      setLoading(false);
    }
  };

  const clientOptions: SelectOption[] = clients.map(client => ({
    label: `${client.institution_name} - ${client.username}`,
    value: client.id
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('registerVisit')}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Mostrar información de la visita si viene de parámetros */}
        {clientId && (
          <View style={styles.visitInfoCard}>
            <Text style={styles.visitInfoTitle}>📋 {t('visitInformation') || 'Información de la Visita'}</Text>
            <View style={styles.visitInfoRow}>
              <Text style={styles.visitInfoLabel}>🏢 {t('client')}:</Text>
              <Text style={styles.visitInfoValue}>{clientName}</Text>
            </View>
            <View style={styles.visitInfoRow}>
              <Text style={styles.visitInfoLabel}>👤 {t('contact')}:</Text>
              <Text style={styles.visitInfoValue}>{contactName}</Text>
            </View>
          </View>
        )}

        {/* Cliente - Solo mostrar si NO viene de parámetros */}
        {!clientId && (
          <CustomSelect
            label={t('client')}
            value={selectedClientId}
            options={clientOptions}
            onChange={(value) => {
              setSelectedClientId(value);
              setFieldErrors({...fieldErrors, cliente: false});
            }}
            disabled={loadingClients}
            loading={loadingClients}
            error={fieldErrors.cliente}
            t={t}
          />
        )}

        {/* Nombre del Contacto - Solo mostrar si NO viene de parámetros */}
        {!contactName && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('contactName')} *</Text>
            <TextInput
              style={[
                styles.input,
                fieldErrors.nombreContacto && styles.inputError
              ]}
              value={nombreContacto}
              onChangeText={(text) => {
                setNombreContacto(text);
                setFieldErrors({...fieldErrors, nombreContacto: false});
              }}
              placeholder={t('enterContactName')}
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Hallazgos Técnicos */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('technicalFindings')} *</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              fieldErrors.hallazgosTecnicos && styles.inputError
            ]}
            value={hallazgosTecnicos}
            onChangeText={(text) => {
              setHallazgosTecnicos(text);
              setFieldErrors({...fieldErrors, hallazgosTecnicos: false});
            }}
            placeholder={t('describeTechnicalFindings')}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Sugerencias de Producto */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('productSuggestions')} *</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              fieldErrors.sugerenciasProducto && styles.inputError
            ]}
            value={sugerenciasProducto}
            onChangeText={(text) => {
              setSugerenciasProducto(text);
              setFieldErrors({...fieldErrors, sugerenciasProducto: false});
            }}
            placeholder={t('describeProductSuggestions')}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Fotos y Videos */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('photosVideos') || 'Fotos y Videos'}</Text>
          
          <TouchableOpacity
            style={[
              styles.mediaButton,
              (loading || mediaFiles.length > 0) && styles.mediaButtonDisabled
            ]}
            onPress={pickMedia}
            disabled={loading || mediaFiles.length > 0}
          >
            <Text style={styles.mediaButtonIcon}>📷</Text>
            <Text style={styles.mediaButtonText}>
              {t('addPhotoVideo') || 'Agregar Foto o Video'}
            </Text>
          </TouchableOpacity>

          {/* Media Preview */}
          {mediaFiles.length > 0 && (
            <View style={styles.mediaPreviewContainer}>
              <Text style={styles.mediaPreviewTitle}>
                1 archivo seleccionado
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScrollView}>
                {mediaFiles.map((media, index) => (
                  <View key={index} style={styles.mediaPreviewItem}>
                    {media.type === 'image' ? (
                      <Image source={{ uri: media.uri }} style={styles.mediaPreviewImage} />
                    ) : (
                      <View style={styles.videoPreview}>
                        <Text style={styles.videoPreviewIcon}>🎥</Text>
                        <Text style={styles.videoPreviewText}>Video</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.mediaRemoveButton}
                      onPress={() => removeMedia(index)}
                    >
                      <Text style={styles.mediaRemoveButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.helpText}>
          <Text style={styles.helpTextContent}>
            * {t('requiredFields')}
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
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
            styles.submitButton,
            loading && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>{t('send')}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backButtonText: {
    fontSize: 28,
    color: '#6750A4',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6750A4',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
    borderColor: '#DC362E',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
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
  helpText: {
    marginTop: 8,
    marginBottom: 16,
  },
  helpTextContent: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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
  submitButton: {
    backgroundColor: '#6750A4',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
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
  visitInfoCard: {
    backgroundColor: '#E8DEF8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#6750A4',
  },
  visitInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6750A4',
    marginBottom: 12,
  },
  visitInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D0BCFF',
  },
  visitInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  visitInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  mediaButton: {
    backgroundColor: '#6750A4',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mediaButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  mediaButtonIcon: {
    fontSize: 20,
  },
  mediaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaPreviewContainer: {
    marginTop: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
  },
  mediaPreviewTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  mediaScrollView: {
    marginTop: 4,
  },
  mediaPreviewItem: {
    marginRight: 12,
    position: 'relative',
  },
  mediaPreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  videoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewIcon: {
    fontSize: 32,
  },
  videoPreviewText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  mediaRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#DC362E',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaRemoveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterVisitScreen;
