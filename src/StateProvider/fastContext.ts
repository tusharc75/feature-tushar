import createFastContext from './createFastContext';

const SEARCH = 'searchQuery';
const THEME = 'themeColor';

const initialState: { searchQuery: string; themeColor: 'light' | 'dark' } = {
  searchQuery: '',
  themeColor: 'light'
};

const { Provider, useStore } = createFastContext(initialState);

export { Provider as FastProvider, useStore, SEARCH, THEME };
