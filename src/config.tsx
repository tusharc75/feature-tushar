export const azureConfig = {
  clientId: import.meta.env?.VITE_APP_AZURE_CLIENT_ID,
  redirectUri: import.meta.env?.VITE_APP_AZURE_REDIRECT_URL,
    // authority: `https://login.microsoftonline.com/${import.meta?.env?.REACT_APP_AZURE_TENANT_ID}`,
  authority: `https://login.microsoftonline.com/common`,
  cache: 'localStorage' // This configures where your cache will be stored
};

export const TRACKING_ID = 'UA-196035023-2'; //Google analytics tracking id

export const backendApi = 
localStorage.getItem('backendApi') ?? (import.meta.env?.VITE_APP_API_URL || 'https://master.oms-backend.vebholic.com');

export const SLACK_APP_CLIENT_ID = import.meta.env?.SLACK_CLIENT_ID || '7385096952035.7416570092288'; //for demo purpose

export const SLACK_APP_SCOPES = 'channels:read,chat:write,users:read'; //change as per needed
