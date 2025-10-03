import { getPermissions } from '../constants/helpers';
import { SET_USER, USER_LOADING, SET_ROLE, SET_SELECTED_ENTITY, SET_CHATTER, SET_CART, SET_START_TOUR, SET_SEARCH, SET_FILES_UPLOAD_PROGRESS } from './actionTypes';

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
  gridMetaData: {},
  filesUploadProgress: []
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

    case SET_FILES_UPLOAD_PROGRESS:
      let filesUploadProgress = [...state?.filesUploadProgress]
      if (action?.payload && filesUploadProgress?.some(u => u?._id === action?.payload?._id)) {
        filesUploadProgress = filesUploadProgress?.map(u => {
          if (u?._id === action?.payload?._id) {
            const { _id, ...rest } = action?.payload
            return {
              ...u,
              ...rest
            }
          }
          return u
        })
      } else if (action?.payload) {
        filesUploadProgress = [...filesUploadProgress, action?.payload]
      } else {
        filesUploadProgress = []
      }
      return {
        ...state, filesUploadProgress:
          [...filesUploadProgress],
        isFilesUploading: filesUploadProgress?.find((e) => e?.status === 'uploading') ? true : false
      }
    default:
      return state;
  }
};

export default reducer;
