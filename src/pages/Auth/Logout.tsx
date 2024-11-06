import { useContext, useEffect } from 'react';
import axiosInstance from '../../axios/axiosInstance';
import { SET_SELECTED_ENTITY, SET_USER } from '../../StateProvider/actionTypes';
import { useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { deleteDatabase } from 'src/constants/indexdbhelper';

const Logout = () => {
  const history = useHistory();
  const { dispatch }: any = useData();
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    const logoutUser = async () => {
      deleteDatabase();
      await axiosInstance()
        .get('/user/logout')
        .then(() => {
          history.push('/');
          dispatch({ type: SET_USER, payload: null });
          dispatch({ type: SET_SELECTED_ENTITY, payload: null });
          localStorage.clear();
          history.push('/login');
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    };
    logoutUser().then();
  }, [dispatch, history, toastConfig]);

  return <div>Loading...</div>;
};

export default Logout;
