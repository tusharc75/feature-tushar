import React, { useState, useRef, useEffect, useReducer, useCallback } from 'react';
import { IconButton, ListItem, ListItemText, List } from '@material-ui/core';
import { Clear as ClearIcon } from '@material-ui/icons';
import { kebabCase } from 'lodash';
import SentimentVeryDissatisfiedIcon from '@material-ui/icons/SentimentVeryDissatisfied';
import { useClickdOutside, useKeyPress } from 'src/hooks';
import styles from '../userManual.module.scss';
import { filterReducer, filterReducerInitialState } from 'src/pages/UserManual/SearchBar/helper';
import { ComponentCommonProps } from 'src/pages/UserManual/type';

export const SearchBar = ({ state }: ComponentCommonProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { navigate } = state;
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
    const sectionData = [];
    state?.manualData?.map((sec) => {
      sec?.resource?.map((u) => {
        const commonPath = `/${u.sectionName}/${u.resourceLabel}`;
        const list = [];
        list.push({ name: u.resourceLabel, path: commonPath, scrollKey: null });

        if (u?.sections?.length) {
          u.sections.forEach((x) => {
            list.push({
              name: x.sectionName,
              path: commonPath,
              scrollKey: `#${kebabCase(`${x.sectionName}-section-id`)}`
            });

            if (x?.subSections?.length) {
              x.subSections.forEach((c) => {
                list.push({
                  name: c.sectionName,
                  path: commonPath,
                  scrollKey: `#${kebabCase(`${c.sectionName}-section-id`)}`
                });
              });
            }
          });
        }
        sectionData.push({
          head: u.resourceLabel,
          items: list
        });
      });
    });

    setSections(sectionData);
  }, [state]);

  const handleSearch = (value) => {
    const searchedValueInLowerCase = value?.toLowerCase();
    const filteredItems = [];
    sections.forEach((section) => {
      if (Array.isArray(section.items)) {
        const items = section.items.filter((item) => item?.name?.toLowerCase().includes(searchedValueInLowerCase));
        if (items.length > 0) {
          filteredItems.push({ ...section, items });
        }
      }
    });
    filterDispatch({ type: 'setFilteredData', payload: filteredItems });
  };

  const clearSearch = useCallback(() => {
    setSearch('');
    setShowCloseButton(false);
  }, []);

  return (
    <div className={styles.searchContainer}>
      <div className={`${styles.search_input}`} style={{ borderRadius: '10px' }}>
        <IconButton className={styles.searchIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path d="M11.4233 11.5286L14.7983 14.9036" stroke="#7e818c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M7.20459 12.6536C10.1559 12.6536 12.5483 10.2611 12.5483 7.30981C12.5483 4.35854 10.1559 1.96606 7.20459 1.96606C4.25332 1.96606 1.86084 4.35854 1.86084 7.30981C1.86084 10.2611 4.25332 12.6536 7.20459 12.6536Z"
              stroke="#7e818c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </IconButton>
        <input
          type="text"
          ref={inputRef}
          value={search}
          placeholder="Search"
          onChange={(e) => {
            const searchedValue = e.target.value;
            searchedValue.length > 0 ? setShowCloseButton(true) : setShowCloseButton(false);
            setSearch(searchedValue);
            handleSearch(searchedValue);
          }}
          className=" placeholder:text-[15px] placeholder:text-gray-400 dark:placeholder:text-gray-500"
          style={{ borderRadius: '10px' }}
        />
        {showCloseButton && (
          <div className={styles.clear_icon}>
            <ClearIcon onClick={() => clearSearch()} />
          </div>
        )}
      </div>
      {search.trim() !== '' && (
        <>
          <SearchResult filterDispatch={filterDispatch} filteredData={filterState.filteredData} clearSearch={clearSearch} navigate={navigate} />
        </>
      )}
    </div>
  );
};

export const SearchResult = ({ filteredData, clearSearch, filterDispatch, navigate }) => {
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
                      key={item.name}
                      button
                      onClick={() => {
                        navigate(item.path, item.scrollKey);
                        clearSearch();
                      }}
                      className={styles.heaaderResults}
                    >
                      <ListItemText primary={<span style={{ fontWeight: 500, fontSize: '15px' }}>{item.name}</span>} />
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
