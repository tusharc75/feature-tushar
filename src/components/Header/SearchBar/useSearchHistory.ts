import { useCallback, useMemo, useRef } from 'react';
import { Item, SearchKeyword } from 'src/components/Header/SearchBar/types';
import useIndexedDb from 'src/hooks/useIndexedDb';
import useLocalStorage from 'src/hooks/useLocalStore';
import { useUrlWithoutMongoId } from 'src/hooks/useUrlWithoutMongoId';

const SEARCH_DB_NAME = 'equipt_search_data';
const SEARCH_ITEMS_STORE_NAME = 'equip_tSearchItems';
const SEARCH_KEYWORDS_STORE_NAME = 'equip_tSearchKeywords';

const useSearchHistory = () => {
  // const searchItemDb = useIndexedDb<Item, 'id'>({
  //   dbName: SEARCH_DB_NAME,
  //   storeName: SEARCH_ITEMS_STORE_NAME,
  //   uniqueKey: 'id',
  //   debug: import.meta.env.DEV
  // });
  // const searchKeywordDb = useIndexedDb<SearchKeyword, 'id'>({
  //   dbName: SEARCH_DB_NAME,
  //   storeName: SEARCH_KEYWORDS_STORE_NAME,
  //   uniqueKey: 'id',
  //   debug: import.meta.env.DEV
  // });
  const [searchedItems, setSearchItems] = useLocalStorage<Item[]>(SEARCH_ITEMS_STORE_NAME, []);
  const [searchedKeywordsObject, setSearchKeywordsObject] = useLocalStorage<Record<string, SearchKeyword[]>>(SEARCH_KEYWORDS_STORE_NAME, {});
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
    async (data: Item) => {
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
        // try {
        //   await searchItemDb.add(data);
        // } catch (error) {
        //   console.log(error);
        // }
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
