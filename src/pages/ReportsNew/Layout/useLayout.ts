import { useMediaQuery } from '@material-ui/core';
import React from 'react';
import { LayoutActions, LayoutState } from 'src/pages/ReportsNew/Layout/types';

const initialState: LayoutState = {
  isSidebarOpen: true,
  transitionComplete: true
};
const reducer = (state: LayoutState, action: LayoutActions) => {
  switch (action.type) {
    case 'setIsSidebarOpen':
      return { ...state, isSidebarOpen: action.payload };
    case 'setTransitionComplete':
      return { ...state, transitionComplete: action.payload };
    default:
      return state;
  }
};

const useLayout = () => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const isMobile = useMediaQuery('(max-width:1024px)');
  const { isSidebarOpen } = state;

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    dispatch({ type: 'setTransitionComplete', payload: false });
    dispatch({ type: 'setIsSidebarOpen', payload: newState });
    setTimeout(() => {
      dispatch({ type: 'setTransitionComplete', payload: true });
    }, 400);
  };

  return { ...state, isMobile, toggleSidebar, dispatch };
};
export default useLayout;
