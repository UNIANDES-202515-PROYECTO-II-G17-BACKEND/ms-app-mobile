import { Box, FormControl, FormControlLabel, Radio, RadioGroup, ThemeProvider, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import BottomNavigationBar from './common/BottomNavigationBar';
import { changeLanguage } from './common/i18n';
import theme from './common/theme';

const SettingsScreen = () => {
  const { t } = useTranslation();
  const [value, setValue] = React.useState(3); // Default to 'Settings' tab
  const [country, setCountry] = React.useState('Colombia');
  const [language, setLanguage] = React.useState('es');

  const handleLanguageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedLanguage = event.target.value;
    console.log('Selected language:', selectedLanguage);
    setLanguage(selectedLanguage);
    await changeLanguage(selectedLanguage);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box bgcolor="secondary.main" height="100vh" display="flex" flexDirection="column">
        <Box flex={1} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <Typography variant="h4" color="primary" gutterBottom>
            {t('settings')}
          </Typography>
          <Box sx={{ maxWidth: 300, width: '100%', marginBottom: 2 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              {t('country')}
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={country}
                onChange={(event) => setCountry(event.target.value)}
              >
                <FormControlLabel value="Colombia" control={<Radio />} label="Colombia" />
                <FormControlLabel value="México" control={<Radio />} label="México" />
                <FormControlLabel value="Argentina" control={<Radio />} label="Argentina" />
              </RadioGroup>
            </FormControl>
          </Box>
          <Box sx={{ maxWidth: 300, width: '100%', marginBottom: 2 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              {t('language')}
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={language}
                onChange={handleLanguageChange}
              >
                <FormControlLabel value="es" control={<Radio />} label="Español" />
                <FormControlLabel value="en" control={<Radio />} label="Inglés" />
              </RadioGroup>
            </FormControl>
          </Box>
        </Box>
        <BottomNavigationBar value={value} setValue={setValue} />
      </Box>
    </ThemeProvider>
  );
};

export default SettingsScreen;