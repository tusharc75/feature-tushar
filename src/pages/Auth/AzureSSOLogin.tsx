import axios from 'axios';
import { useHistory, Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useData } from 'src/StateProvider/Provider';
import { SET_GRID_METADATA, SET_SELECTED_ENTITY, SET_USER } from 'src/StateProvider/actionTypes';
import axiosInstance from 'src/axios/axiosInstance';
import { backendApi } from 'src/config';

const AzureSSOLogin = () => {
  const { dispatch }: any = useData();
  const history = useHistory()
  useEffect(() => {
    const searchParams = new URLSearchParams(document.location.search);
    const token = searchParams.get('token');
    (async () => {
      if (token) {
        const res = await axios.get(backendApi + "/user/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const { data: { data } } = res;

        localStorage.setItem('token', token);

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

        window.location.href = '/';
      } else {
        window.location.href = '/sso-login-error';
      }
    })();
  }, []);

  return <></>;
};

export default AzureSSOLogin;
