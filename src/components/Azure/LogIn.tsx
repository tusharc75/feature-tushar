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

function ErrorComponent({ error }) {
  return <p>An Error Occurred: {error}</p>;
}

function LoadingComponent() {
  return <p>Authentication in progress...</p>;
}
const LogIn = (props) => {
  const { instance, accounts, inProgress } = useMsal();
  const account = useAccount(accounts[0] || {});

  return (
    <>
      <AuthenticatedTemplate>
        <p>{account?.name}</p>
        <Button
          fullWidth
          startIcon={<SiMicrosoftoffice />}
          variant="outlined"
          color="primary"
          onClick={() => instance.logout()}
        >
          Log Out
        </Button>
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Button
          startIcon={<SiMicrosoftoffice />}
          fullWidth
          variant="contained"
          color="secondary"
          onClick={() => instance.loginPopup()}
        >
          Office 365 Login
        </Button>
      </UnauthenticatedTemplate>
    </>
  );
};

export default LogIn;
