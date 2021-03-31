import { createContext, useContext, useReducer, useEffect } from "react";
import reducer, { initialState } from "./reducer";
import { SET_USER, USER_LOADING } from "./actionTypes";
// import { UserMe } from "../axios";
import axiosInstance from "./../axios/axiosInstance";

const StateContext = createContext(null);

export const Provider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch({ type: USER_LOADING, payload: true });
      axiosInstance()
        .get("/user/me")
        .then(({ data: response }) => {
          const { data } = response;
          dispatch({ type: SET_USER, payload: data });
          dispatch({ type: USER_LOADING, payload: false });
        })
        .catch((err) => {
          localStorage.setItem("token", "");
          dispatch({ type: USER_LOADING, payload: false });
        });
    }
  }, []);

  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
};

export const useData = () => useContext(StateContext);
