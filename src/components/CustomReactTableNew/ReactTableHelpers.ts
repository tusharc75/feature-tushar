import { FilterFn, SortingFn, sortingFns } from '@tanstack/react-table';
import { RankingInfo, rankItem, compareItems } from '@tanstack/match-sorter-utils';
import { childrenProperty } from './utils';

export const fuzzyFilter: FilterFn<any> = (row, columnId, filterValue, addMeta) => {
  // Do not filter
  if (filterValue === '' || filterValue === null || filterValue === undefined) return row;

  // In case of a complex filter, the parent component should provide the filter logic
  if (typeof filterValue !== 'string') {
    return [];
  }
  const textSearchValues = filterValue.trim().toLocaleLowerCase();

  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), textSearchValues);

  // Store the itemRank info
  addMeta({
    itemRank
  });

  //   const nestedExist = itemRank.passed || (Array.isArray(row[childrenProperty]) && !!columnFilter(row[childrenProperty], columnIds, filterValue).length);

  // Return if the item should be filtered in/out
  return itemRank.passed;
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
