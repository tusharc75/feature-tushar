import { IndexedDb } from 'src/utils/IndexedDb';

const SEARCH_DB_NAME = 'equipt_search_history';

export const tables = {
  ITEMS_TABLE: 'searchedItems',
  KEYWORDS_TABLE: 'searchedKeywords'
};

export const itemDb = new IndexedDb(SEARCH_DB_NAME)
  .version(3)
  .store({
    [tables.ITEMS_TABLE]: `
    ++id,
    name,
    resourceId,
    frequency,
    timeStamp,
    userAndBrandId
  `
  })
  .store({
    [tables.KEYWORDS_TABLE]: `
    ++id,
    keyword,
    timeStamp,
    frequency,
    pathName,
    userAndBrandId
  `
  });
