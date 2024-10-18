import React, { useState, useRef, useEffect, useReducer, useCallback } from 'react';
import { IconButton, ListItem, ListItemText, List, ListItemIcon } from '@material-ui/core';
import { Clear as ClearIcon } from '@material-ui/icons';
import { useData } from '../../StateProvider/Provider';
import { SET_SEARCH } from '../../StateProvider/actionTypes';
import routes from '../Helpers/Routes';
import { kebabCase } from 'lodash';
import { staticHiddenResource } from '../../constants/helpers';
import SentimentVeryDissatisfiedIcon from '@material-ui/icons/SentimentVeryDissatisfied';
import { usePathname, useClickdOutside, useKeyPress } from 'src/hooks';
import styles from './Header.module.scss';
import CallMadeIcon from '@material-ui/icons/CallMade';
import { useStore, SEARCH } from 'src/StateProvider/fastContext';
import { useLocation } from 'react-router-dom';

import { filterReducerInitialState, filterReducer } from './helper';
import UserFavoriteIcon from 'src/components/UserFavouriteIcon';

export const SearchBar = ({ user, selectedEntity, history }) => {
  // const {
  //   state: { searchQuery },
  //   dispatch
  // }: any = useData();
  const [searchQuery, setStore] = useStore((store) => store[SEARCH]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [sections, setSections] = useState([]);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [search, setSearch] = useState('');
  const [filterState, filterDispatch] = useReducer(filterReducer, filterReducerInitialState);

  useEffect(() => {
    filterDispatch({ type: 'resetIndex' });
  }, [search.trim() !== '', search]);

  const handleFocusOnSlash = (e: KeyboardEvent) => {
    if (!inputRef.current) return;
    const input = inputRef.current;
    const otherFocusedElements = document.querySelector(':focus-within');
    if (otherFocusedElements) return;
    if (input.matches(':focus-within')) return;
    if (e.key === '/') {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleFocusOnSlash);
    return () => document.removeEventListener('keydown', handleFocusOnSlash);
  }, []);

  useEffect(() => {
    let arr = [];
    let allData = [];
    let entityData;
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
      !arr.includes(u.sectionName) && arr.push(u.sectionName);
    });

    var data = arr.map((sec) => {
      const list = allData?.filter((u) => {
        if (u?.isHidden || staticHiddenResource?.includes(u?.name)) {
          return false;
        }
        return sec === u.sectionName && u.isRead;
      });

      return {
        head: sec,
        items: list
      };
    });

    setSections(data);
  }, [user, selectedEntity]);

  const handleSearch = (value) => {
    setStore({ [SEARCH]: value });
    const searchedValueInLowerCase = value?.toLowerCase();
    const filteredItems = [];

    sections.forEach((section) => {
      const items = section.items.filter(
        (ff) => ff.sectionNameLowerCase.indexOf(searchedValueInLowerCase) > -1 || ff.resourceLabelLowerCase.indexOf(searchedValueInLowerCase) > -1
      );
      if (items.length > 0) {
        filteredItems.push({ ...section, items: items });
      }
    });
    filterDispatch({ type: 'setFilteredData', payload: filteredItems });
  };

  const clearSearch = useCallback(() => {
    setStore({ [SEARCH]: '' });
    setSearch('');
    setShowCloseButton(false);
  }, [setStore]);

  // reset search
  const location = useLocation();
  useEffect(() => {
    clearSearch();
  }, [location.pathname, clearSearch]);

  const handleRoutes = (item) => {
    switch (item.name) {
      case 'Pos':
        return routes.pos.path;
      default:
        return `/${kebabCase(item.name)}`;
    }
  };
  const pathName = usePathname();

  return (
    <div className={styles.searchContainer}>
      <div className={`${styles.search_input}`} style={{ borderRadius: showCloseButton ? '4px 4px 0 0' : '4px' }}>
        <input
          type="text"
          ref={inputRef}
          value={search}
          placeholder="Type / to search"
          onChange={(e) => {
            const searchedValue = e.target.value;
            searchedValue.length > 0 ? setShowCloseButton(true) : setShowCloseButton(false);
            setSearch(searchedValue);
            handleSearch(searchedValue);
          }}
          className=" placeholder:text-[15px] placeholder:text-gray-400 dark:placeholder:text-gray-500"
          style={{ borderRadius: showCloseButton ? '4px 4px 0 0' : '4px' }}
        />
        <IconButton className={styles.searchIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path d="M11.4233 11.5286L14.7983 14.9036" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M7.20459 12.6536C10.1559 12.6536 12.5483 10.2611 12.5483 7.30981C12.5483 4.35854 10.1559 1.96606 7.20459 1.96606C4.25332 1.96606 1.86084 4.35854 1.86084 7.30981C1.86084 10.2611 4.25332 12.6536 7.20459 12.6536Z"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </IconButton>
        {showCloseButton && (
          <div className={styles.clear_icon}>
            <ClearIcon onClick={() => clearSearch()} />
          </div>
        )}
      </div>
      {search.trim() !== '' && pathName === '/' && (
        <>
          <SearchResult
            filterDispatch={filterDispatch}
            filteredData={filterState.filteredData}
            history={history}
            handleRoutes={handleRoutes}
            clearSearch={clearSearch}
            parentIndex={filterState.parentIndex}
            childIndex={filterState.childIndex}
          />
        </>
      )}
    </div>
  );
};

export const SearchResult = ({ filteredData, history, handleRoutes, clearSearch, filterDispatch, parentIndex, childIndex }) => {
  const arrowUpPressed = useKeyPress({ targetKey: 'ArrowUp' });
  const arrowDownPressed = useKeyPress({ targetKey: 'ArrowDown' });
  const listContainerRef = React.useRef(null);

  useEffect(() => {
    if (arrowUpPressed) {
      filterDispatch({ type: 'arrowUp', element: listContainerRef.current });
    }
  }, [arrowUpPressed]);

  useEffect(() => {
    if (arrowDownPressed) {
      filterDispatch({ type: 'arrowDown', element: listContainerRef.current });
    }
  }, [arrowDownPressed]);

  const resultRef = useRef(null);
  const isClickOutside = useClickdOutside(resultRef);
  useEffect(() => {
    if (isClickOutside) {
      clearSearch();
    }
  }, [isClickOutside]);

  return (
    <div className={styles.searchResult} ref={resultRef}>
      <div
        className={`${styles.filtered_data} `}
        ref={listContainerRef}
        style={{ overflowY: filteredData.length === 0 ? 'auto' : 'scroll', scrollPadding: '48px 0 0 0', marginBottom: 20 }}
      >
        {filteredData.length !== 0 ? (
          filteredData.map((section) => {
            return (
              <List key={section.head} className={styles.resultUL} subheader={<h6 className={`${styles.list_header}`}>{section.head}</h6>}>
                {section.items.map((item) => {
                  return (
                    <ListItem
                      key={item.resourceLabel}
                      button
                      onClick={() => {
                        history.push(handleRoutes(item));
                        clearSearch();
                      }}
                      className={styles.heaaderResults}
                    >
                      <ListItemIcon className={styles.listIcon}>
                        <CallMadeIcon style={{ fontSize: 16 }} />
                      </ListItemIcon>
                      <ListItemText primary={<span style={{ fontWeight: 500, fontSize: '15px' }}>{item.resourceLabel}</span>} />
                      <UserFavoriteIcon item={item} />
                    </ListItem>
                  );
                })}
              </List>
            );
          })
        ) : (
          <div className={styles.no_result_container}>
            <SentimentVeryDissatisfiedIcon />
            <p className={styles.no_result}>Sorry, we couldn't find any result</p>
          </div>
        )}
      </div>
    </div>
  );
};
