import { createContext, useContext, useReducer, useEffect } from "react";
import reducer, { initialState } from "./reducer";
import { SET_USER, USER_LOADING } from "./actionTypes";
import { UserMe } from "../axios";

const StateContext = createContext();

export const Provider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {

    UserMe().then((res) => {
      const { data } = res;
      dispatch({ type: SET_USER, payload: data });

      dispatch({ type: USER_LOADING, payload: false });
    })
      .catch((err) => {
        dispatch({ type: USER_LOADING, payload: false });
        console.log(err);
      });
  }, []);

  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
};

export const useData = () => useContext(StateContext);
