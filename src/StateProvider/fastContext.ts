import createFastContext from './createFastContext';

export const SEARCH = 'searchQuery';

const { Provider, useStore } = createFastContext({
  searchQuery: ''
});

export { Provider as FastProvider, useStore };
