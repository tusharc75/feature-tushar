export const azureConfig = {
  clientId: "c38ff8c7-33a3-4fe6-a516-58360d3d2216",
  redirectUri: process?.env?.REACT_APP_AZURE_REDIRECT_URL || "https://master.d3ljse87c8zeuu.amplifyapp.com/",
  authority: "https://login.microsoftonline.com/05260ce1-1bef-43b0-84b5-8bb380cd295b",
  cache: "localStorage", // This configures where your cache will be stored
}

export const backendApi = process?.env?.REACT_APP_API_URL || "https://oms-backend.vebholic.com";