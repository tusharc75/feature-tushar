import { useState, useContext, useEffect } from 'react';
import { useData } from '../../StateProvider/Provider';
import { SET_USER, SET_SELECTED_ENTITY, SET_GRID_METADATA } from '../../StateProvider/actionTypes';
import axiosInstance from './../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useAccount, useMsal } from '@azure/msal-react';
import { isEmpty } from 'lodash';
import getAzureAcessToken from '../../components/Azure/getAzureAccessToken';
import LogIn from '../../components/Azure/LogIn';

const AzureLogin = () => {
  const toastConfig = useContext(CustomToastContext);
  const { dispatch }: any = useData();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [counter, setCounter] = useState(0);
  const [invalidAzureLogin, setInvalidAzureLogin] = useState(false);
  useEffect(() => {
    if (!isEmpty(account)) {
      (async () => {
        try {
          const graphToken = await getAzureAcessToken(instance);
          const res = await axiosInstance().post('/user/login/azure', {
            'graph-token': graphToken
          });
          const { data } = res.data;
          localStorage.setItem('token', data.token);
          let mappedEntities = [];
          if (data.entity && data.entity.length) {
            data.entity.forEach((o) => {
              mappedEntities = [...mappedEntities, { optionLabel: o?.entityName, optionValue: o?._id }];
            });
          }
          localStorage.setItem('mappedEntities', JSON.stringify(mappedEntities));
          dispatch({ type: SET_USER, payload: data });
          if (data?.role?.selectedEntity?._id) {
            dispatch({
              type: SET_SELECTED_ENTITY,
              payload: data.role.selectedEntity._id
            });
          }
          if (data?.user?.gridMetaData) {
            let tempMetaData = JSON.stringify(data?.user?.gridMetaData);
            localStorage.setItem('gridMetaData', tempMetaData);
            dispatch({ type: SET_GRID_METADATA, payload: data?.user?.gridMetaData });
          }
        } catch (e) {
          setCounter(10);
          setInvalidAzureLogin(true);
          toastConfig.setToastConfig(e);
        }
      })();
    }
  }, [account]);
  useEffect(() => {
    if (invalidAzureLogin) {
      if (invalidAzureLogin && counter) {
        setTimeout(() => setCounter(counter - 1), 1000);
      } else {
        instance.logout();
        setInvalidAzureLogin(false);
      }
    }
  }, [invalidAzureLogin, counter]);

  return (
    <div>
      <AuthenticatedTemplate>
        {invalidAzureLogin ? <span>Not authorized. Logging out in {counter}</span> : <span>Logging In ... </span>}
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <LogIn />
      </UnauthenticatedTemplate>
    </div>
  );
};

export default AzureLogin;
