import { Box, Button, TextField } from '@mui/material';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';
import logo from '../assets/images/logo.png';

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [formData, setFormData] = useState({
    institutionName: '',
    nit: '',
    phone: '',
    email: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof typeof formData) => (event: { target: { value: string } }) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setLoading(true);
      
      // TODO: Implement registration logic
      
      // Navigate to login on success
      router.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Box sx={{ maxWidth: 400, width: '100%' }}>
        <Image source={logo} alt="MediSupply Logo" style={styles.logo} />
        <Box sx={{ mt: 2 }}>
          <TextField
            label={t('institutionName')}
            value={formData.institutionName}
            onChange={handleInputChange('institutionName')}
            margin="normal"
            fullWidth
          />
          <TextField
            label={t('nit')}
            value={formData.nit}
            onChange={handleInputChange('nit')}
            margin="normal"
            fullWidth
          />
          <TextField
            label={t('phone')}
            value={formData.phone}
            onChange={handleInputChange('phone')}
            margin="normal"
            fullWidth
          />
          <TextField
            label={t('email')}
            value={formData.email}
            onChange={handleInputChange('email')}
            type="email"
            margin="normal"
            fullWidth
          />
          <TextField
            label={t('username')}
            value={formData.username}
            onChange={handleInputChange('username')}
            margin="normal"
            fullWidth
          />
          <TextField
            label={t('password')}
            value={formData.password}
            onChange={handleInputChange('password')}
            type="password"
            margin="normal"
            fullWidth
          />
          
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
          >
            {t('register')}
          </Button>
          
          <Button
            onClick={() => router.replace('/login')}
            variant="text"
            fullWidth
            sx={{ mt: 1 }}
          >
            {t('backToLogin')}
          </Button>

          {error && (
            <Box sx={{ mt: 2, color: 'error.main' }}>
              {error}
            </Box>
          )}
        </Box>
      </Box>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
});