import { SET_USER, USER_LOADING, SET_ROLE, SET_SELECTED_ENTITY } from "./actionTypes";

export const initialState = {
  user: null,
  userLoading: false,
  token: localStorage.getItem("token"),
  role: null,
  selectedEntity: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
      return { ...state, user: action.payload };

    case SET_ROLE:
      return { ...state, role: action.payload };

    case USER_LOADING:
      return { ...state, userLoading: action.payload };

    case SET_SELECTED_ENTITY:
      return { ...state, selectedEntity: action.payload };

    default:
      return state;
  }
};

export default reducer;
