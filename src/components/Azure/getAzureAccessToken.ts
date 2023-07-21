
const getAzureAcessToken = async (msalInstance) => {
    const activeAccount = msalInstance.getActiveAccount(); // This will only return a non-null value if you have logic somewhere else that calls the setActiveAccount API
    const accounts = msalInstance.getAllAccounts();
    const ResourceUrl = "https://graph.microsoft.com";
    let authResult;
    if (!activeAccount && accounts.length === 0) {
        return "" 
    }
    const request = {
      scopes: ["https://graph.microsoft.com/Mail.Send",ResourceUrl+"/OnlineMeetings.ReadWrite",ResourceUrl+"/Calendars.ReadWrite",ResourceUrl+"/User.Read"],
        account: activeAccount || accounts[0]
    };

    try{
      authResult  = await msalInstance.acquireTokenSilent(request);
    }catch(e){
      console.log(e)
      try{
        authResult = await msalInstance.acquireTokenPopup(request)
      }
      catch(e){
        console.log(e)
      }
    }
    console.log(authResult)
    return authResult.accessToken
};

export default getAzureAcessToken;