import { useCallback, useMemo, useRef } from 'react';
import { Item, SearchKeyword } from 'src/components/Header/SearchBar/types';
import useLocalStorage from 'src/hooks/useLocalStore';

const SEARCH_ITEMS_KEY = 'equip_tSearchItems';
const SEARCH_KEYWORDS_KEY = 'equip_tSearchKeywords';

const useSearchHistory = () => {
  const [searchedItems, setSearchItems] = useLocalStorage<Item[]>(SEARCH_ITEMS_KEY, []);
  const [searchedKeywords, setSearchKeywords] = useLocalStorage<SearchKeyword[]>(SEARCH_KEYWORDS_KEY, []);
  const timeoutId = useRef<NodeJS.Timeout>(undefined);

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
      timeoutId.current = setTimeout(() => {
        const data: SearchKeyword = { keyword, frequency: 1, timeStamp: Date.now() };
        const indexInHitory = keywordsSortedByTimeStamp.findIndex((d) => d.keyword);
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
    [keywordsSortedByTimeStamp, searchedItems.length, setSearchKeywords]
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
