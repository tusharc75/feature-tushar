export const azureConfig = {
  clientId: "142e5e36-d1bf-440f-80b4-33cbf72fffa2",
  redirectUri: process?.env?.REACT_APP_AZURE_REDIRECT_URL || "https://master.d3ljse87c8zeuu.amplifyapp.com/",
  authority: "https://login.microsoftonline.com/83272d2c-ded5-45c6-ab6e-ac6c62b36b01",
  cache: "localStorage", // This configures where your cache will be stored
}

export const TRACKING_ID = "UA-196035023-2";//Google analytics tracking id

export const backendApi = process?.env?.REACT_APP_API_URL || "https://development.oms-backend.vebholic.com";