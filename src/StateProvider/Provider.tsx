import { createContext, useContext, useReducer, useEffect, useState } from "react";
import reducer, { initialState } from "./reducer";
import { SET_USER, USER_LOADING, SET_SELECTED_ENTITY } from "./actionTypes";
import axiosInstance from "./../axios/axiosInstance";

const StateContext = createContext(null);

export const Provider = ({ children }) => {
  const token = localStorage.getItem("token");
  const [state, dispatch] = useReducer(reducer, initialState);


  useEffect(() => {
    if (token && navigator.onLine) {
      dispatch({ type: USER_LOADING, payload: true });
      axiosInstance()
        .get("/user/me")
        .then(({ data: response }) => {
          const { data } = response;
          localStorage.setItem("userOfflineData", JSON.stringify(data))
          dispatch({ type: SET_USER, payload: data });
          let prevSelectedEntity = localStorage.getItem("selectedEntity")
          if (prevSelectedEntity && prevSelectedEntity !== 'null') {
            dispatch({
              type: SET_SELECTED_ENTITY,
              payload: prevSelectedEntity,
            });
          }
          else if (data?.role?.selectedEntity?._id) {
            dispatch({
              type: SET_SELECTED_ENTITY,
              payload: data.role.selectedEntity._id,
            });
          }
          dispatch({ type: USER_LOADING, payload: false });
        })
        .catch((err) => {
          localStorage.setItem("token", "");
          dispatch({ type: USER_LOADING, payload: false });
        });
    }
    else if (!navigator.onLine && localStorage.getItem("userOfflineData")) {
      const data: any = JSON.parse(localStorage.getItem("userOfflineData"))
      dispatch({ type: SET_USER, payload: data });
      let prevSelectedEntity = localStorage.getItem("selectedEntity")
      if (prevSelectedEntity && prevSelectedEntity !== 'null') {
        dispatch({
          type: SET_SELECTED_ENTITY,
          payload: prevSelectedEntity,
        });
      }
      else if (data?.role?.selectedEntity?._id) {
        dispatch({
          type: SET_SELECTED_ENTITY,
          payload: data.role.selectedEntity._id,
        });
      }
      dispatch({ type: USER_LOADING, payload: false });
    }

    localStorage.setItem("dateFormat", "DD/MM/YYYY")
    localStorage.setItem("dateTimeFormat", "DD/MM/YYYY hh:mm A")
    localStorage.setItem("cardDateFormat", "MMM DD, YYYY")

    localStorage.setItem("dateFormatForInputControl", "dd/MM/yyyy")

    if (Intl.DateTimeFormat().resolvedOptions().timeZone?.indexOf("America/") === 0) {
      localStorage.setItem("dateFormat", "MM/DD/YYYY")
      localStorage.setItem("dateTimeFormat", "MM/DD/YYYY hh:mm A")
      localStorage.setItem("cardDateFormat", "MMM DD, YYYY")

      localStorage.setItem("dateFormatForInputControl", "MM/dd/yyyy")
    }

  }, [token]);

  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
};

export const useData = () => useContext(StateContext);
