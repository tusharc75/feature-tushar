import createFastContext from './createFastContext';

export const SEARCH = 'searchQuery';
export const THEME = 'themeColor';
export const MOBILE_USER_FILTER = 'mobileUserFilter';
export const MOBILE_FILTER_FORM_DATA = 'mobileFilterFormData';
export const MOBILE_FILTER_MODEL = 'mobileFilterModel';
export const MOBILE_FILTER_CLEARED = 'mobileFilterCleared';
export const SIDEBAR_OPEN = 'isSidebarOpen';
export const SIDEBAR_OPENED_BY_BUTTON = 'isSidebarOpenedByButton';

const initialState: {
  searchQuery: string;
  themeColor: 'light' | 'dark';
  mobileUserFilter: IMobileUserFilter | null;
  mobileFilterFormData: FilterValue | null;
  mobileFilterModel: IMoileFilterModel | null;
  mobileFilterCleared: boolean;
  isSidebarOpen: boolean;
  isSidebarOpenedByButton: boolean;
} = {
  searchQuery: '',
  themeColor: 'light',
  mobileUserFilter: null,
  mobileFilterFormData: null,
  mobileFilterModel: { changedFrom: 'applyFilter', data: {} },
  mobileFilterCleared: true,
  isSidebarOpen: false,
  isSidebarOpenedByButton: false
};

const { Provider, useStore } = createFastContext(initialState);

export { Provider as FastProvider, useStore };

export type IMoileFilterModel = {
  data: { [key: string]: { filter: string } };
  changedFrom: 'showFilter' | 'applyFilter';
};

export interface IMobileUserFilter {
  _id?: string;
  title?: string;
  resource?: string;
  filterValue?: FilterValue;
  brand?: string;
  user?: string;
  createdAt?: Date;
}

export interface FilterValue {
  [key: string]: string;
}
