import { kebabCase } from 'lodash';
import React, { useCallback, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { UseSearchActions, UseSearchState } from 'src/components/Header/SearchBar/types';
import routes from 'src/components/Helpers/Routes';
import { staticHiddenResource } from 'src/constants/helpers';
import { SEARCH, useStore } from 'src/StateProvider/fastContext';
import { useData } from 'src/StateProvider/Provider';

const initialState: UseSearchState = {
  items: [],
  optionValue: null,
  inputValue: ''
};

const reducer = (state: UseSearchState, action: UseSearchActions) => {
  switch (action.type) {
    case 'setItems':
      return { ...state, items: action.payload };
    case 'setInputValue':
      return { ...state, inputValue: action.payload };
    case 'setOptionValue':
      return { ...state, optionValue: action.payload };
    default:
      return state;
  }
};

const useSearch = () => {
  const history = useHistory();
  const location = useLocation();
  const pathName = location.pathname;
  const [globalSearch, setStore] = useStore((store) => store[SEARCH]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const setInputValue = useCallback((value: UseSearchState['inputValue']) => {
    setState({ type: 'setInputValue', payload: value });
  }, []);
  const setOptionValue = useCallback((value: UseSearchState['optionValue']) => {
    setState({ type: 'setOptionValue', payload: value });
  }, []);

  const handleFocusOnSlash = React.useCallback((e: KeyboardEvent) => {
    if (!inputRef.current) return;
    const input = inputRef.current;
    const otherFocusedElements = document.querySelector(':focus-within');
    if (input.matches(':focus-within')) return;
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault();
      inputRef.current?.focus();
    }
    if (otherFocusedElements) return;
    if (e.key === '/') {
      e.preventDefault();
      inputRef.current?.focus();
    }
  }, []);

  const setGlobalSearch = useCallback(
    (value: string) => {
      setStore({ [SEARCH]: value });
    },
    [setStore]
  );

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
    const list = allData
      ?.filter((u) => {
        if (u?.isHidden || staticHiddenResource?.includes(u?.name)) {
          return false;
        }
        return u.isRead && u.sectionName;
      })
      .sort((a, b) => a.sectionName.localeCompare(b.sectionName));
    setItems(list);
  }, [selectedEntity, setItems, user.entity, pathName]);

  useEffect(() => {
    getItems();
  }, [getItems]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleFocusOnSlash);
    return () => document.removeEventListener('keydown', handleFocusOnSlash);
  }, [handleFocusOnSlash]);

  React.useEffect(() => {
    const handleRoutes = (item) => {
      switch (item.name) {
        case 'Pos':
          return routes.pos.path;
        default:
          return `/${kebabCase(item.name)}`;
      }
    };
    if (state.optionValue) {
      history.push(handleRoutes(state.optionValue));
      setOptionValue(null);
    }
  }, [history, setOptionValue, state.optionValue]);

  useEffect(() => {
    setGlobalSearch('');
  }, [pathName, setGlobalSearch]);

  return { ...state, history, globalSearch, inputRef, setInputValue, setOptionValue, setGlobalSearch, setState };
};

export default useSearch;
