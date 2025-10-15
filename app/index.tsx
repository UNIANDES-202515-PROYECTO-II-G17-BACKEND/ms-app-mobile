import { Box, CircularProgress, ThemeProvider, Typography } from '@mui/material';
import React from 'react';
import { I18nextProvider, useTranslation } from "react-i18next";
import BottomNavigationBar from "./common/BottomNavigationBar";
import i18n from "./common/i18n";
import theme from "./common/theme";
import { useUserRole } from './hooks/useUserRole';

function HomeScreen() {
  const { t } = useTranslation();
  const [value, setValue] = React.useState(0); // Default to 'Home' tab
  const { userRole, loading } = useUserRole();

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box bgcolor="secondary.main" height="100vh" display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box bgcolor="secondary.main" height="100vh" display="flex" flexDirection="column">
        <Box flex={1} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <Typography variant="h4" color="primary" gutterBottom>
            {t('home')}
          </Typography>
          <Typography variant="body1" color="primary">
            Bienvenido
          </Typography>
        </Box>
        <BottomNavigationBar value={value} setValue={setValue} role={userRole} />
      </Box>
    </ThemeProvider>
  );
}

export default function Index() {
  return (
    <I18nextProvider i18n={i18n}>
      <HomeScreen />
    </I18nextProvider>
  );
}
