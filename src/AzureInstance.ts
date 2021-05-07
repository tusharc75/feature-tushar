import { Configuration,  PublicClientApplication } from "@azure/msal-browser";
import { azureConfig } from "./config";

// MSAL configuration
const configuration: Configuration = {
  auth: {
    clientId: azureConfig.clientId,
    redirectUri:azureConfig.redirectUri,
    authority:azureConfig.authority
  }
};
const AzureInstance = new PublicClientApplication(configuration);
export default AzureInstance;