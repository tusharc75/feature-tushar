import React, { useCallback, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { SearchBarProps, UseSearchActions, UseSearchState } from 'src/components/Header/NewSearchBar/types';
import { staticHiddenResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';

const initialState: UseSearchState = {
  items: []
};

const reducer = (state: UseSearchState, action: UseSearchActions) => {
  switch (action.type) {
    case 'setItems':
      return { ...state, items: action.payload };
    default:
      return state;
  }
};

const useSearch = () => {
  const history = useHistory();
  const location = useLocation();
  const pathName = location.pathname;

  const {
    state: { user, selectedEntity }
  }: any = useData();

  const [state, setState] = React.useReducer(reducer, initialState);

  const setItems = useCallback((data: UseSearchState['items']) => {
    setState({ type: 'setItems', payload: data });
  }, []);

  const getItems = useCallback(() => {
    if (pathName !== '/') {
      setItems([]);
      return;
    }
    let entityData,
      allData = [];
    if (user?.entity && user.entity.length) {
      entityData = user.entity.find((curEntity) => curEntity._id === selectedEntity);
    }
    if (entityData?.resource) {
      allData = entityData.resource;
    }
    allData?.forEach((u) => {
      u['resourceLabel'] = u.resourceLabel ?? u.name;
      u['resourceLabelLowerCase'] = u.resourceLabel?.toLowerCase() ?? u.name?.toLowerCase();
      u['sectionNameLowerCase'] = u.sectionName?.toLowerCase();
    });
    const list = allData?.filter((u) => {
      if (u?.isHidden || staticHiddenResource?.includes(u?.name)) {
        return false;
      }
      return u.isRead && u.sectionName;
    });
    setItems(list);
  }, [selectedEntity, setItems, user.entity, pathName]);

  useEffect(() => {
    getItems();
  }, [getItems]);

  return { ...state, history, setState };
};

export default useSearch;
