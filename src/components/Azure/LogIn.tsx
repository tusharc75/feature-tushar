import React from "react";
import { Button } from "@material-ui/core";
import {
  useAccount,
  useMsal
} from "@azure/msal-react";
import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";
import { SiMicrosoftoffice } from "react-icons/si";
import axios from "axios";

const LogIn = () => {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const azureLogin = async () => {
    try {
      await instance.loginPopup();
    } catch (e) { }
  }
  return (
    <>
      <AuthenticatedTemplate>
        <p>{account?.name}</p>
        <Button
          fullWidth
          startIcon={<SiMicrosoftoffice />}
          variant="outlined"
          className="logo-bg-color"
          onClick={() => instance.logout()}
        >
          Log Out
        </Button>
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Button
          startIcon={<SiMicrosoftoffice />}
          fullWidth
          className="logo-bg-color"
          variant="contained"
          onClick={azureLogin}
        >
          Office 365 Login
        </Button>
      </UnauthenticatedTemplate>
    </>
  );
};

export default LogIn;
