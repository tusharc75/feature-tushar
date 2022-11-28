import { getPermissions } from "../constants/helpers";
import {
  SET_USER, USER_LOADING, SET_ROLE, SET_SELECTED_ENTITY, SET_CHATTER,
  SET_CART, SET_START_TOUR, SET_GRID_METADATA
} from "./actionTypes";

export const initialState = {
  user: null,
  userLoading: false,
  token: localStorage.getItem("token"),
  role: null,
  selectedEntity: null,
  permissions: null,
  chatter: null,
  cartItems: [],
  tour: {
    path: '',
    start: false,
    stepIndex: 0,
  },
  gridMetaData: {},
  mappedEntities: []
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
      return { ...state, user: action.payload, permissions: getPermissions(action.payload) };

    case SET_ROLE:
      return { ...state, role: action.payload };

    case USER_LOADING:
      return { ...state, userLoading: action.payload };

    case SET_CHATTER:
      return { ...state, chatter: action.payload };

    case SET_START_TOUR:
      const { start, path, stepIndex } = action.payload
      return { ...state, tour: { start, path, stepIndex } };

    case SET_CART:
      return { ...state, cartItems: [...action.payload] };

    case SET_SELECTED_ENTITY:
      localStorage.setItem("selectedEntity", action.payload);
      return {
        ...state, selectedEntity: action.payload,
        permissions: getPermissions(state.user, action.payload)
      };
    case SET_GRID_METADATA:
      return {
        ...state,
        gridMetaData: action.payload
      };

    default:
      return state;
  }
};

export default reducer;
