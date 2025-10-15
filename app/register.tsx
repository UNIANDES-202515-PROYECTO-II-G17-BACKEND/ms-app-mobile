import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import theme from './common/theme';
import { CountryCode, register } from './services/authService';

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
    country: 'mx' as CountryCode,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof typeof formData) => (event: any) => {
    const value = event?.target?.value ?? event?.nativeEvent?.text ?? '';
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setLoading(true);
      
      await register({
        username: formData.username,
        password: formData.password,
        institution_name: formData.institutionName,
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
    <ThemeProvider theme={theme}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        bgcolor="secondary.main"
      >
        <Image source={require('../assets/images/logo.png')} alt="MediSupply Logo" width={100} height={100} />
        <Box width="300px" mt={2}>
          <TextField
            label={t('institutionName')}
            value={formData.institutionName}
            onChange={handleInputChange('institutionName')}
            variant="outlined"
            margin="normal"
            fullWidth
          />
          <TextField
            label={t('nit')}
            value={formData.nit}
            onChange={handleInputChange('nit')}
            variant="outlined"
            margin="normal"
            fullWidth
          />
          <TextField
            label={t('phone')}
            value={formData.phone}
            onChange={handleInputChange('phone')}
            variant="outlined"
            margin="normal"
            fullWidth
          />
          <TextField
            label={t('email')}
            value={formData.email}
            onChange={handleInputChange('email')}
            type="email"
            variant="outlined"
            margin="normal"
            fullWidth
          />
          <TextField
            label={t('username')}
            value={formData.username}
            onChange={handleInputChange('username')}
            variant="outlined"
            margin="normal"
            fullWidth
          />
          <TextField
            label={t('password')}
            value={formData.password}
            onChange={handleInputChange('password')}
            type="password"
            variant="outlined"
            margin="normal"
            fullWidth
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>{t('country')}</InputLabel>
            <Select
              value={formData.country}
              label={t('country')}
              onChange={handleInputChange('country')}
            >
              <MenuItem value="mx">México</MenuItem>
              <MenuItem value="co">Colombia</MenuItem>
              <MenuItem value="pe">Perú</MenuItem>
              <MenuItem value="ar">Argentina</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            {t('register')}
          </Button>
          
          <Button
            onClick={() => router.replace('/login')}
            variant="text"
            color="primary"
            fullWidth
            sx={{ mt: 1 }}
          >
            {t('backToLogin')}
          </Button>

          {error && (
            <Box mt={1} color="error.main">
              {error}
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

