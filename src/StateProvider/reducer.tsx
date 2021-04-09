import { getPermissions } from "../constants/helpers";
import { SET_USER, USER_LOADING, SET_ROLE, SET_SELECTED_ENTITY } from "./actionTypes";

export const initialState = {
  user: null,
  userLoading: false,
  token: localStorage.getItem("token"),
  role: null,
  selectedEntity: null,
  permissions: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
      return { ...state, user: action.payload, permissions: getPermissions(action.payload) };

    case SET_ROLE:
      return { ...state, role: action.payload };

    case USER_LOADING:
      return { ...state, userLoading: action.payload };

    case SET_SELECTED_ENTITY:
      return {
        ...state, selectedEntity: action.payload,
        permissions: getPermissions(state.user, action.payload)
      };

    default:
      return state;
  }
};

export default reducer;
