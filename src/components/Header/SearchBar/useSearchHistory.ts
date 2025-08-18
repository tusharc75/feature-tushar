import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { itemDb, tables } from 'src/components/Header/SearchBar/db';
import { Item, SearchKeyword } from 'src/components/Header/SearchBar/types';
import { useUrlWithoutMongoId } from 'src/hooks/useUrlWithoutMongoId';
import { useData } from 'src/StateProvider/Provider';

const useSearchHistory = (items?: Item[]) => {
  const { state }: any = useData();
  const user = state.user || {};
  const itemsIdMap = useMemo(() => {
    const mapData = new Map<string, Item>();
    if (!items || items?.length === 0) return mapData;
    for (const item of items) {
      mapData.set(item.resourceId, item);
    }
    return mapData;
  }, [items]);

  const userAndBrandId = useMemo(() => `${user?.user?._id}_${user?.user?.brand}`, [user?.user?._id, user.user?.brand]);

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
      const data = await itemDb
        .table<SearchKeyword>(tables.KEYWORDS_TABLE)
        .where('pathName')
        .equals(pathname)
        .where('userAndBrandId')
        .equals(userAndBrandId)
        .sortBy('timeStamp', 'desc')
        .toArray();

      setSearchedKeywords(data);
    } catch (error) {
      console.error(error);
    }
  }, [depth, pathname, userAndBrandId]);

  useEffect(() => {
    fetchAllKeywordData();
  }, [fetchAllKeywordData]);

  const fetchAllItemData = useCallback(async () => {
    try {
      await itemDb.open();
      const data = await itemDb.table<Item>(tables.ITEMS_TABLE).where('userAndBrandId').equals(userAndBrandId).sortBy('timeStamp', 'desc').toArray();
      let newData = data;
      if (itemsIdMap.size > 0) {
        newData = data.map((d) => {
          if (itemsIdMap.has(d.resourceId)) {
            const itemFromMap = itemsIdMap.get(d.resourceId);
            return {
              ...d,
              resourceLabel: itemFromMap.resourceLabel,
              resourceLabelLowerCase: itemFromMap.resourceLabelLowerCase,
              homePageLabel: itemFromMap.homePageLabel,
              name: itemFromMap.name,
              sectionName: itemFromMap.sectionName,
              sectionNameLowerCase: itemFromMap.sectionNameLowerCase
            };
          }
          return d;
        });
      }

      setSearchItems(newData);
    } catch (error) {
      console.error(error);
    }
  }, [userAndBrandId, itemsIdMap]);

  useEffect(() => {
    fetchAllItemData();
  }, [fetchAllItemData]);

  const handleSelectItem = useCallback(
    async (data: Item) => {
      data = { ...data, timeStamp: Date.now(), type: 'history', sectionName: 'History', frequency: 1, userAndBrandId: userAndBrandId };
      try {
        await itemDb.open();
        const isInDatabase = ((await itemDb
          .table<Item>(tables.ITEMS_TABLE)
          .where('name')
          .equals(data.name)
          .where('userAndBrandId')
          .equals(userAndBrandId)
          .toArray()) ||
          (await itemDb
            .table<Item>(tables.ITEMS_TABLE)
            .where('resourceId')
            .equals(data.resourceId)
            .where('userAndBrandId')
            .equals(userAndBrandId)
            .toArray()))[0];
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
    [searchedItems, fetchAllItemData, userAndBrandId]
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
          const data: SearchKeyword = { keyword, frequency: 1, timeStamp: Date.now(), pathName: pathname, userAndBrandId: userAndBrandId };
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
    [depth, pathname, searchedKeywords, fetchAllKeywordData, userAndBrandId]
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
