import { IndexedDb } from 'src/utils/IndexedDb';

const SEARCH_DB_NAME = 'equipt_search_data';

export const tables = {
  ITEMS_TABLE: 'searchedItems',
  KEYWORDS_TABLE: 'searchedKeywords'
};

export const itemDb = new IndexedDb(SEARCH_DB_NAME)
  .version(1)
  .store({
    [tables.ITEMS_TABLE]: `
    ++id,
    name,
    resourceId,
    frequency,
    timeStamp
  `
  })
  .store({
    [tables.KEYWORDS_TABLE]: `
    ++id,
    keyword,
    timeStamp,
    frequency,
    pathName
  `
  });
