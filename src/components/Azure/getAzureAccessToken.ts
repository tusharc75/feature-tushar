
const getAzureAcessToken = async (msalInstance) => {
    const activeAccount = msalInstance.getActiveAccount(); // This will only return a non-null value if you have logic somewhere else that calls the setActiveAccount API
    const accounts = msalInstance.getAllAccounts();
    const ResourceUrl = "https://graph.microsoft.com";
    if (!activeAccount && accounts.length === 0) {
        return "" 
    }
    const request = {
        scopes: ["https://graph.microsoft.com/Mail.Send",ResourceUrl+"/OnlineMeetings.ReadWrite"],
        account: activeAccount || accounts[0]
    };

    const authResult = await msalInstance.acquireTokenSilent(request);

    return authResult.accessToken
};

export default getAzureAcessToken;