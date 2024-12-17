import { getPermissions } from '../constants/helpers';
import { SET_USER, USER_LOADING, SET_ROLE, SET_SELECTED_ENTITY, SET_CHATTER, SET_CART, SET_START_TOUR, SET_SEARCH } from './actionTypes';

export const initialState = {
  user: null,
  userLoading: false,
  token: localStorage.getItem('token'),
  role: null,
  selectedEntity: null,
  permissions: null,
  resources: null,
  chatter: null,
  cartItems: [],
  tour: {
    path: '',
    start: false,
    stepIndex: 0
  },
  gridMetaData: {}
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
      const { permissions, resources } = getPermissions?.(action.payload) || {};
      return { ...state, user: action.payload, permissions, resources };

    case SET_SEARCH:
      return { ...state, searchQuery: action.payload };

    case SET_ROLE:
      return { ...state, role: action.payload };

    case USER_LOADING:
      return { ...state, userLoading: action.payload };

    case SET_CHATTER:
      return { ...state, chatter: action.payload };

    case SET_START_TOUR:
      const { start, path, stepIndex } = action.payload;
      return { ...state, tour: { start, path, stepIndex } };

    case SET_CART:
      return { ...state, cartItems: [...action.payload] };

    case SET_SELECTED_ENTITY:
      localStorage.setItem('selectedEntity', action.payload);
      const { permissions: nPermissions, resources: nResources } = getPermissions?.(state.user, action.payload) || {};
      return {
        ...state,
        selectedEntity: action.payload,
        permissions: nPermissions,
        resources: nResources
      };
    default:
      return state;
  }
};

export default reducer;
