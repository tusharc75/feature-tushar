import React, { useEffect } from 'react';
import { MsalAuthenticationTemplate, useAccount, useMsal } from "@azure/msal-react";
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { InteractionType } from '@azure/msal-browser';
import getAzureAcessToken from './getAzureAccessToken';
import AzureInstance from '../../AzureInstance';
function ErrorComponent({error}) {
    return <p>An Error Occurred: {error}</p>;
}

function LoadingComponent() {
    return <p>Authentication in progress...</p>;
}
const LogIn = (props)=> {
    const { instance, accounts, inProgress } = useMsal();
    const account = useAccount(accounts[0] || {});
    
    return (
        <>
        <AuthenticatedTemplate>
            
            <p>{account?.name }</p>
            <button  onClick={()=>instance.logout()}>Log Out</button>
        </AuthenticatedTemplate>
        <UnauthenticatedTemplate>
            <button style={{
                background:"#1E40AF",
                padding:"10px 15px",
                border:"none",
                color:"#F9FAFB",
                borderRadius:"5px",
                fontSize:"1.2rem",
                cursor:"pointer",
                boxShadow:"blue 0px 0px 17px -4px"
            }} onClick={()=>instance.loginPopup()} >Azure Log In</button>
        </UnauthenticatedTemplate>
        
        </>

    );
}

export default LogIn;