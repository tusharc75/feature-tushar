import { useStore, GRID_METADATA } from 'src/StateProvider/fastContext';
import { Table } from '@tanstack/react-table';

export const useGridMetaData = () => {
  const [gridMetaData, setStoreGridMetaData] = useStore((store) => store[GRID_METADATA]);
  const setGridMetaData = (data: { [key: string]: { hide: string[]; order: string[]; name?: string; id?: string } }) =>
    setStoreGridMetaData({ [GRID_METADATA]: data });
  return { gridMetaData, setGridMetaData };
};

export const getCurrentColumnSizes = (table: Table<any>) => {
  const newSizes: { [key: string]: number } = {};
  table.getAllColumns().forEach((c) => {
    newSizes[c.id] = c.getSize();
  });
  return newSizes;
};
