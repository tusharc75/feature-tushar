import { useStore, GRID_METADATA } from 'src/StateProvider/fastContext';

export const useGridMetaData = () => {
  const [gridMetaData, setStoreGridMetaData] = useStore((store) => store[GRID_METADATA]);
  const setGridMetaData = (data: { [key: string]: { hide: string[]; order: string[] } }) => setStoreGridMetaData({ [GRID_METADATA]: data });
  return { gridMetaData, setGridMetaData };
};
