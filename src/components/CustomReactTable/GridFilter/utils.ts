const LOCALHOST_KEY_FOR_TEMP_FILTER = 'tempUserFilter';

export const getTempFilter = (resource: string) => {
  const data = localStorage.getItem(LOCALHOST_KEY_FOR_TEMP_FILTER);
  if (data) {
    return JSON.parse(data)[resource];
  }
  return false;
};

export const setTempFilter = (resource: string, data: any) => {
  const tempData = localStorage.getItem(LOCALHOST_KEY_FOR_TEMP_FILTER);
  const tempFilters = tempData ? JSON.parse(tempData) : {};
  localStorage.setItem(
    LOCALHOST_KEY_FOR_TEMP_FILTER,
    JSON.stringify({
      ...tempFilters,
      [resource]: data
    })
  );
};
