import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import theme from './common/theme';
import { CountryCode, login as loginRequest } from './services/authService';
import { saveAuth } from './services/storageService';

const LoginPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState<CountryCode>('mx');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const resp = await loginRequest(username, password, country);
      await saveAuth(resp);
      router.replace('/settings');
    } catch (e: any) {
      setError(e?.message ?? 'Login failed');
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
            label={t('username')}
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e: any) => setUsername(e?.target?.value ?? e.nativeEvent?.text ?? '')}
          />
          <TextField
            label={t('password')}
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e: any) => setPassword(e?.target?.value ?? e.nativeEvent?.text ?? '')}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('country')}</InputLabel>
            <Select
              value={country}
              label={t('country')}
              onChange={(e: any) => setCountry(e.target.value)}
            >
              <MenuItem value="mx">México</MenuItem>
              <MenuItem value="co">Colombia</MenuItem>
              <MenuItem value="pe">Perú</MenuItem>
              <MenuItem value="ar">Argentina</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleLogin as any}
            disabled={loading}
          >
            {t('login')}
          </Button>
          <Button
            variant="text"
            color="primary"
            fullWidth
            sx={{ mt: 1 }}
          >
            {t('createAccount')}
          </Button>
          {error ? <Box mt={1} color="error.main">{error}</Box> : null}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default LoginPage;