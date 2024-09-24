import { createContext, useContext, useReducer, useEffect } from 'react';
import reducer, { initialState } from './reducer';
import axios from 'axios';
import { SET_USER, USER_LOADING, SET_SELECTED_ENTITY } from './actionTypes';
import axiosInstance from './../axios/axiosInstance';
import { sidebarResource } from 'src/constants/helpers';
import { USER_FAVOURITES, useStore } from 'src/StateProvider/fastContext';

const StateContext = createContext(null);

export const Provider = ({ children }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_favourites, setFavourites] = useStore((store) => store[USER_FAVOURITES]);
  const token = localStorage.getItem('token');
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (token && navigator.onLine) {
      dispatch({ type: USER_LOADING, payload: true });
      axiosInstance()
        .get('/user/me')
        .then(({ data: response }) => {
          const { data } = response;
          localStorage.setItem('userData', JSON.stringify(data));
          dispatch({ type: SET_USER, payload: data });

          // setUserFavorites
          const favData: { [key: string]: boolean } = {};
          data?.role?.userFavouriteResources[0]?.resources?.forEach((d: string) => {
            favData[d] = true;
          });
          setFavourites({ [USER_FAVOURITES]: favData });

          let prevSelectedEntity = localStorage.getItem('selectedEntity');
          if (prevSelectedEntity && prevSelectedEntity !== 'null') {
            dispatch({
              type: SET_SELECTED_ENTITY,
              payload: prevSelectedEntity
            });
          } else if (data?.role?.selectedEntity?._id) {
            dispatch({
              type: SET_SELECTED_ENTITY,
              payload: data.role.selectedEntity._id
            });
          }
          dispatch({ type: USER_LOADING, payload: false });
        })
        .catch((err) => {
          localStorage.setItem('token', '');
          dispatch({ type: USER_LOADING, payload: false });
        });
    } else if (token && localStorage.getItem('userData')) {
      const data = JSON.parse(localStorage.getItem('userData'));
      data?.entity?.forEach((element) => {
        element.resource = element.resource?.filter((e) =>
          [
            sidebarResource.rentalManagement,
            sidebarResource.fieldServiceOrder,
            sidebarResource.fieldServiceTechnician,
            sidebarResource.fieldTicket
          ]?.includes(e.name)
        );
      });
      dispatch({ type: SET_USER, payload: data });
      let prevSelectedEntity = localStorage.getItem('selectedEntity');
      if (prevSelectedEntity && prevSelectedEntity !== 'null') {
        dispatch({
          type: SET_SELECTED_ENTITY,
          payload: prevSelectedEntity
        });
      } else if (data?.role?.selectedEntity?._id) {
        dispatch({
          type: SET_SELECTED_ENTITY,
          payload: data.role.selectedEntity._id
        });
      }
      dispatch({ type: USER_LOADING, payload: false });
    }

    localStorage.setItem('dateFormat', 'DD/MM/YYYY');
    localStorage.setItem('dateTimeFormat', 'DD/MM/YYYY hh:mm A');
    localStorage.setItem('cardDateFormat', 'MMM DD, YYYY');
    localStorage.setItem('dateFormatForInputControl', 'dd/MM/yyyy');
    if (Intl.DateTimeFormat().resolvedOptions().timeZone?.indexOf('America/') === 0) {
      localStorage.setItem('dateFormat', 'MM/DD/YYYY');
      localStorage.setItem('dateTimeFormat', 'MM/DD/YYYY hh:mm A');
      localStorage.setItem('cardDateFormat', 'MMM DD, YYYY');
      localStorage.setItem('dateFormatForInputControl', 'MM/dd/yyyy');
    }
  }, [token]);

  return <StateContext.Provider value={{ state, dispatch }}>{children}</StateContext.Provider>;
};

export const useData = () => useContext(StateContext);
