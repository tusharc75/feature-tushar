import React from 'react';
import { Box, Button } from '@mui/material';
import { useAccount, useMsal } from '@azure/msal-react';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { OfficeLogo } from 'src/assets/authenticationAssets';
import axios from 'axios';
import SSOLoginButton from 'src/pages/Auth/Buttons/SSOLoginButton';
import { backendApi } from 'src/config';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const LogIn = () => {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const azureLogin = async () => {
    try {
      await instance.loginPopup();
    } catch (e) { }
  };
  return (
    <>
      <AuthenticatedTemplate>
        <p>{account?.name}</p>
        <ThemeButton
          sx={{ height: 40 }}
          fullWidth
          startIcon={<OfficeLogo color="#FF5722" />}
          onClick={() => instance.logout()}>
          Log Out
        </ThemeButton>
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <ThemeButton
          startIcon={<OfficeLogo color="#FF5722" />}
          fullWidth
          onClick={azureLogin}
          sx={{ height: 40 }}
        >
          Office 365 Login
        </ThemeButton>
        <Box mt={2} />
        <SSOLoginButton />
      </UnauthenticatedTemplate>
    </>
  );
};

export default LogIn;
