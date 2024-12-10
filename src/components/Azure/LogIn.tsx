import React from 'react';
import { Box, Button } from '@material-ui/core';
import { useAccount, useMsal } from '@azure/msal-react';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { OfficeLogo } from 'src/assets/authenticationAssets';
import axios from 'axios';
import SSOLoginButton from 'src/pages/Auth/Buttons/SSOLoginButton';
import { backendApi } from 'src/config';

const LogIn = () => {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const azureLogin = async () => {
    try {
      await instance.loginPopup();
    } catch (e) {}
  };
  return (
    <>
      <AuthenticatedTemplate>
        <p>{account?.name}</p>
        <Button fullWidth startIcon={<OfficeLogo color="#FF5722" />} variant="outlined" className="azure-login" onClick={() => instance.logout()}>
          Log Out
        </Button>
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Button startIcon={<OfficeLogo color="#FF5722" />} fullWidth className="azure-login" variant="outlined" onClick={azureLogin}>
          Office 365 Login
        </Button>
        <Box mt={2} />
        <SSOLoginButton />
      </UnauthenticatedTemplate>
    </>
  );
};

export default LogIn;
