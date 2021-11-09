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
      await instance.loginPopup().then(async () => {

        // localStorage.setItem("dateFormat", "MM/DD/YYYY")
        // localStorage.setItem("dateTimeFormat", "MM/DD/YYYY hh:mm A")
        // localStorage.setItem("cardDateFormat", "MMM,DD YYYY")

        // localStorage.setItem("dateFormatForInputControl", "MM/dd/yyyy")

        // await axios.get("http://ip-api.com/json").then(({ data }) => {
        //   if (data?.countryCode === "US") {
        //     localStorage.setItem("dateFormat", "DD/MM/YYYY")
        //     localStorage.setItem("dateTimeFormat", "DD/MM/YYYY hh:mm A")
        //     localStorage.setItem("cardDateFormat", "DDD,MM YYYY")

        //     localStorage.setItem("dateFormatForInputControl", "dd/MM/yyyy")
        //   }
        // });

      })
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
          onClick={azureLogin}
        >
          Office 365 Login
        </Button>
      </UnauthenticatedTemplate>
    </>
  );
};

export default LogIn;
