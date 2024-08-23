import React, { useContext, useState } from 'react';
import { Box, Button } from '@material-ui/core';
import FaceLiveNess from './FaceLiveNess';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { SET_SELECTED_ENTITY, SET_USER } from 'src/StateProvider/actionTypes';
import routes from '../Helpers/Routes';
import { camelCase } from 'lodash';
import { useHistory } from 'react-router-dom';

const LogIn = ({ dispatch, notification, chatNotification }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const handleFaceLogin = async () => {
    setCamOpen(true);
  };

  const [camOpen, setCamOpen] = useState(false);
  const handleCapture = async (sessionId: string) => {
    await axiosInstance()
      .post('/user/face/login', { sessionId })
      .then(async ({ data: response }) => {
        setCamOpen(false);
        const { data } = response;
        localStorage.setItem('token', data.token);

        if (data?.hasExistingSession) {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.existingSessionMessage
          });
        }

        dispatch({ type: SET_USER, payload: data });
        if (data?.role?.selectedEntity?._id) {
          dispatch({
            type: SET_SELECTED_ENTITY,
            payload: data.role.selectedEntity._id
          });
        }

        if (data?.user?.defaultResource) {
          if (routes[camelCase(data?.user?.defaultResource)]?.path) {
            history.push({ pathname: routes[camelCase(data?.user?.defaultResource)]?.path });
          }
        }

        axiosInstance()
          .get(`/user/notification/unseen`)
          .then(({ data: { count } }) => {
            notification.setCount(count);
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });

        axiosInstance()
          .get(`/user/user-notification/unseen`)
          .then(({ data: { count } }) => {
            chatNotification.setCount(count);
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      })
      .catch((error) => {
        setCamOpen(false);
        toastConfig.setToastConfig(error);
      });
  };
  return (
    <div>
      <Box mt={2} />
      <Button fullWidth variant="outlined" className="azure-login" onClick={handleFaceLogin}>
        Face Login
      </Button>
      {camOpen && <FaceLiveNess onClose={() => setCamOpen(false)} onComplete={handleCapture} />}
    </div>
  );
};

export default LogIn;
