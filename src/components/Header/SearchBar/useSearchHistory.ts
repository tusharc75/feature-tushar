import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { itemDb, tables } from 'src/components/Header/SearchBar/db';
import { Item, SearchKeyword } from 'src/components/Header/SearchBar/types';
import { useUrlWithoutMongoId } from 'src/hooks/useUrlWithoutMongoId';

const useSearchHistory = () => {
  const [searchedItems, setSearchItems] = useState<Item[]>([]);
  const [searchedKeywords, setSearchedKeywords] = useState<SearchKeyword[]>([]);
  const timeoutId = useRef<NodeJS.Timeout>(undefined);
  const { pathname } = useUrlWithoutMongoId();

  const depth = useMemo(() => {
    if (pathname === '/') return 1;
    return pathname.split('/').length;
  }, [pathname]);

  const fetchAllKeywordData = useCallback(async () => {
    if (depth !== 2) return;
    try {
      await itemDb.open();
      const data = (await itemDb.table<SearchKeyword>(tables.KEYWORDS_TABLE).where('pathName').equals(pathname).toArray()).sort(
        (a, b) => b.timeStamp - a.timeStamp
      );
      setSearchedKeywords(data);
    } catch (error) {
      console.error(error);
    }
  }, [depth, pathname]);

  useEffect(() => {
    fetchAllKeywordData();
  }, [fetchAllKeywordData]);

  const fetchAllItemData = useCallback(async () => {
    try {
      await itemDb.open();
      const data = (await itemDb.table<Item>(tables.ITEMS_TABLE).getAll()).sort((a, b) => b.timeStamp - a.timeStamp);
      setSearchItems(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchAllItemData();
  }, [fetchAllItemData]);

  const handleSelectItem = useCallback(
    async (data: Item) => {
      data = { ...data, timeStamp: Date.now(), type: 'history', sectionName: 'History', frequency: 1 };
      try {
        await itemDb.open();
        const isInDatabase = (await itemDb.table<Item>(tables.ITEMS_TABLE).where('name').equals(data.name).toArray())[0];

        // if already exist in history update the timestamp and frequency only
        if (isInDatabase) {
          await itemDb.table<Item>(tables.ITEMS_TABLE).put({ ...isInDatabase, timeStamp: Date.now(), frequency: isInDatabase.frequency + 1 });
          return;
        }
        if (searchedItems.length >= 10) {
          const lastId = searchedItems[searchedItems.length - 1].id;
          await itemDb.table<Item>(tables.ITEMS_TABLE).delete(lastId);
          await itemDb.table<Item>(tables.ITEMS_TABLE).add(data);
        } else {
          await itemDb.table<Item>(tables.ITEMS_TABLE).add(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        fetchAllItemData();
      }
    },
    [searchedItems, fetchAllItemData]
  );

  const handleRemoveItemFromHistory = useCallback(async (item: Item) => {
    try {
      await itemDb.open();
      await itemDb.table<Item>(tables.ITEMS_TABLE).delete(item.id);
      setSearchItems((prev) => prev.filter((d) => d.id !== item.id));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleSetHistoryKeyword = useCallback(
    (keyword: string) => {
      clearTimeout(timeoutId.current);
      if (!keyword || depth !== 2) return;
      timeoutId.current = setTimeout(async () => {
        try {
          await itemDb.open();
          const data: SearchKeyword = { keyword, frequency: 1, timeStamp: Date.now(), pathName: pathname };
          const isInDatabase = (await itemDb.table<SearchKeyword>(tables.KEYWORDS_TABLE).where('keyword').equals(data.keyword).toArray())[0];

          // if already exist in history update the timestamp and frequency only
          if (isInDatabase) {
            await itemDb
              .table<SearchKeyword>(tables.KEYWORDS_TABLE)
              .put({ ...isInDatabase, timeStamp: Date.now(), frequency: isInDatabase.frequency + 1 });
            return;
          }

          if (searchedKeywords.length >= 10) {
            const lastId = searchedKeywords[searchedKeywords.length - 1].id;
            await itemDb.table<SearchKeyword>(tables.KEYWORDS_TABLE).delete(lastId);
            await itemDb.table<SearchKeyword>(tables.KEYWORDS_TABLE).add(data);
          } else {
            await itemDb.table<SearchKeyword>(tables.KEYWORDS_TABLE).add(data);
          }
        } catch (error) {
          console.error(error);
        } finally {
          fetchAllKeywordData();
        }
      }, 1000);
    },
    [depth, pathname, searchedKeywords, fetchAllKeywordData]
  );

  const handleRemoveKeywordFromHistory = useCallback(async (item: SearchKeyword) => {
    try {
      await itemDb.open();
      await itemDb.table<SearchKeyword>(tables.KEYWORDS_TABLE).delete(item.id);
      setSearchedKeywords((prev) => prev.filter((d) => d.id !== item.id));
    } catch (error) {
      console.error(error);
    }
  }, []);

  return {
    historyItems: searchedItems,
    handleSelectItem,
    handleRemoveItemFromHistory,
    historyKeywords: searchedKeywords,
    handleSetHistoryKeyword,
    handleRemoveKeywordFromHistory
  };
};

export default useSearchHistory;
