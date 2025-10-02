import { Box, Button, TextField } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import theme from './common/theme';

const LoginPage = () => {
  const { t } = useTranslation();

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
          />
          <TextField
            label={t('password')}
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
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
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default LoginPage;