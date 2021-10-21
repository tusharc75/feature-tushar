import { createContext, useContext, useReducer, useEffect } from "react";
import reducer, { initialState } from "./reducer";
import { SET_USER, USER_LOADING, SET_SELECTED_ENTITY } from "./actionTypes";
import axiosInstance from "./../axios/axiosInstance";

const StateContext = createContext(null);

export const Provider = ({ children }) => {
  const token = localStorage.getItem("token");
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (token) {
      dispatch({ type: USER_LOADING, payload: true });
      axiosInstance()
        .get("/user/me")
        .then(({ data: response }) => {
          const { data } = response;
          if (data?.entity && data?.entity.length) {
            let mappedEntities = []
            data.entity.forEach(o => {
              mappedEntities.push({ optionLabel: o?.entityName, optionValue: o?._id })
            })
            data.mappedEntities = mappedEntities
          }
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
  }, [token]);

  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
};

export const useData = () => useContext(StateContext);
