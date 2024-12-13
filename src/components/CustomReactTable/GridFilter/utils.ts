import { useStore, TEMP_USER_FILTER } from 'src/StateProvider/fastContext';
export const useUserTempFilters = () => {
  const [userFilters, setUserFilter] = useStore((store) => store[TEMP_USER_FILTER]);
  const setTempFilter = (resource, data: { [key: string]: any }) => setUserFilter({ [TEMP_USER_FILTER]: { ...userFilters, [resource]: data } });
  const getTempFilter = (resource: string) => userFilters[resource];

  return { getTempFilter, setTempFilter, userFilters };
};
