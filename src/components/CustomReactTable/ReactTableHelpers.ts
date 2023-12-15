import { FilterFn, SortingFn, sortingFns } from '@tanstack/react-table';
import { RankingInfo, rankItem, compareItems } from '@tanstack/match-sorter-utils';

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>;
  }
  interface FilterMeta {
    itemRank: RankingInfo;
  }
}

export const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Do not filter
  if (value === '' || value === null || value === undefined) return row;

  // In case of a complex filter, the parent component should provide the filter logic
  if (typeof value !== 'string') {
    return [];
  }
  const textSearchValues = value.trim().toLocaleLowerCase();

  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), textSearchValues);

  // Store the itemRank info
  addMeta({
    itemRank
  });

  // Return if the item should be filtered in/out
  return itemRank.passed;
};

// To prevent table from filtering on server side,
export const serverFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  return true;
};

export const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
  let dir = 0;

  // Only sort by rank if the column has ranking information
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(rowA.columnFiltersMeta[columnId]?.itemRank!, rowB.columnFiltersMeta[columnId]?.itemRank!);
  }

  // Provide an alphanumeric fallback for when the item ranks are equal
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

// To prevent table from ranking rows in server side table,
export const serverSort = (rowA, rowB, columnId) => {
  return 0;
};
