import axios from 'axios';
import { useEffect } from 'react';
import { useData } from 'src/StateProvider/Provider';
import { SET_SELECTED_ENTITY, SET_USER } from 'src/StateProvider/actionTypes';
import { backendApi } from 'src/config';

const AzureSSOLogin = () => {

  const { dispatch }: any = useData();
  useEffect(() => {
    const searchParams = new URLSearchParams(document.location.search);
    const token = searchParams.get('token');
    (async () => {
      if (token) {
        const res = await axios.get(backendApi + '/user/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const {
          data: { data }
        } = res;
        dispatch({ type: SET_USER, payload: data });
        if (data?.role?.selectedEntity?._id) {
          dispatch({
            type: SET_SELECTED_ENTITY,
            payload: data.role.selectedEntity._id
          });
        }
        localStorage.setItem('token', token);
        window.location.href = '/';
      } else {
        window.location.href = '/sso-login-error';
      }
    })();
  }, []);

  return <></>;
};

export default AzureSSOLogin;
