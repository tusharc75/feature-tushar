import { createContext, useState } from 'react';

export const FiltersContext = createContext({
  savedFilters: {},
  setSavedFilters: (filters: {}) => {}
});

export const FiltersProvider = ({ children }) => {
  const [savedFilters, setSavedFilters] = useState({});

  return (
    <FiltersContext.Provider value={{ savedFilters, setSavedFilters }}>
      {children}
    </FiltersContext.Provider>
  );
};
