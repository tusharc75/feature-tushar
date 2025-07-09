import { useCallback, useMemo, useRef } from 'react';
import { Item, SearchKeyword } from 'src/components/Header/SearchBar/types';
import useLocalStorage from 'src/hooks/useLocalStore';
import { useUrlWithoutMongoId } from 'src/hooks/useUrlWithoutMongoId';
const SEARCH_ITEMS_KEY = 'equip_tSearchItems';
const SEARCH_KEYWORDS_KEY = 'equip_tSearchKeywords';

const useSearchHistory = () => {
  const [searchedItems, setSearchItems] = useLocalStorage<Item[]>(SEARCH_ITEMS_KEY, []);
  const [searchedKeywordsObject, setSearchKeywordsObject] = useLocalStorage<Record<string, SearchKeyword[]>>(SEARCH_KEYWORDS_KEY, {});
  const timeoutId = useRef<NodeJS.Timeout>(undefined);
  const { pathname } = useUrlWithoutMongoId();

  const depth = useMemo(() => {
    if (pathname === '/') return 1;
    return pathname.split('/').length;
  }, [pathname]);

  const setSearchKeywords = useCallback(
    (data: SearchKeyword[]) => {
      if (depth > 2) return;
      const newData = { ...searchedKeywordsObject, [pathname]: data };
      setSearchKeywordsObject(newData);
    },
    [setSearchKeywordsObject, searchedKeywordsObject, pathname, depth]
  );

  const searchedKeywords = useMemo(() => {
    if (depth > 2) return [];
    return searchedKeywordsObject[pathname] || [];
  }, [pathname, searchedKeywordsObject, depth]);

  const itemsSortedByTimeStamp = useMemo(() => {
    return [...searchedItems].sort((a, b) => b.timeStamp - a.timeStamp) || [];
  }, [searchedItems]);

  const handleSelectItem = useCallback(
    (data: Item) => {
      data = { ...data, timeStamp: Date.now(), type: 'history', sectionName: 'History', frequency: 1 };
      const indexInHitory = itemsSortedByTimeStamp.findIndex((d) => d.name === data.name);

      // if already exist in history update the timestamp and frequency only
      if (indexInHitory > -1) {
        const newData = [...itemsSortedByTimeStamp];
        newData[indexInHitory].timeStamp = Date.now();
        newData[indexInHitory].frequency = newData[indexInHitory].frequency + 1;
        setSearchItems(newData);
        return;
      }

      if (searchedItems.length >= 10) {
        const newData = [...itemsSortedByTimeStamp];
        newData.pop();
        setSearchItems([...newData, data]);
      } else {
        setSearchItems([...itemsSortedByTimeStamp, data]);
      }
    },
    [searchedItems.length, setSearchItems, itemsSortedByTimeStamp]
  );

  const handleRemoveItemFromHistory = useCallback(
    (item: Item) => {
      setSearchItems(itemsSortedByTimeStamp.filter((d) => d.name !== item.name));
    },
    [itemsSortedByTimeStamp, setSearchItems]
  );

  const keywordsSortedByTimeStamp = useMemo(() => {
    return [...searchedKeywords].sort((a, b) => b.timeStamp - a.timeStamp) || [];
  }, [searchedKeywords]);

  const handleSetHistoryKeyword = useCallback(
    (keyword: string) => {
      clearTimeout(timeoutId.current);
      if (!keyword) return;
      timeoutId.current = setTimeout(() => {
        const data: SearchKeyword = { keyword, frequency: 1, timeStamp: Date.now(), pathName: pathname };
        const indexInHitory = keywordsSortedByTimeStamp.findIndex((d) => d.keyword === keyword);

        // if already exist in history update the timestamp and frequency only
        if (indexInHitory > -1) {
          const newData = [...keywordsSortedByTimeStamp];
          newData[indexInHitory].timeStamp = Date.now();
          newData[indexInHitory].frequency = newData[indexInHitory].frequency + 1;
          setSearchKeywords(newData);
          return;
        }

        if (searchedItems.length >= 10) {
          const newData = [...keywordsSortedByTimeStamp];
          newData.pop();
          setSearchKeywords([...newData, data]);
        } else {
          setSearchKeywords([...keywordsSortedByTimeStamp, data]);
        }
      }, 1000);
    },
    [keywordsSortedByTimeStamp, searchedItems.length, setSearchKeywords, pathname]
  );
  const handleRemoveKeywordFromHistory = useCallback(
    (item: SearchKeyword) => {
      setSearchKeywords(keywordsSortedByTimeStamp.filter((d) => d.keyword !== item.keyword));
    },
    [keywordsSortedByTimeStamp, setSearchKeywords]
  );

  return {
    historyItems: itemsSortedByTimeStamp,
    handleSelectItem,
    handleRemoveItemFromHistory,
    historyKeywords: keywordsSortedByTimeStamp,
    handleSetHistoryKeyword,
    handleRemoveKeywordFromHistory
  };
};

export default useSearchHistory;
