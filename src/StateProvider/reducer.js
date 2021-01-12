import { SET_USER, USER_LOADING } from "./actionTypes";

export const initialState = {
  user: null,
  userLoading: false,
  token: localStorage.getItem("token"),
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
      return { ...state, user: action.payload };

    case USER_LOADING:
      return { ...state, userLoading: action.payload };

    default:
      return state;
  }
};

export default reducer;
