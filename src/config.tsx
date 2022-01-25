export const azureConfig = {
  clientId: process?.env?.REACT_APP_AZURE_CLIENT_ID,
  redirectUri: process?.env?.REACT_APP_AZURE_REDIRECT_URL,
  authority: `https://login.microsoftonline.com/${process?.env?.REACT_APP_AZURE_TENANT_ID}`,
  cache: 'localStorage' // This configures where your cache will be stored
};

export const TRACKING_ID = 'UA-196035023-2'; //Google analytics tracking id

export const backendApi = 
localStorage.getItem('backendApi') ?? (process?.env?.REACT_APP_API_URL || 'https://master.oms-backend.vebholic.com');
