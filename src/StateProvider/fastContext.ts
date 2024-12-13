import { StateWalkmeInstance, WalkmeData } from 'src/components/CustomIntro';
import createFastContext from './createFastContext';

export const SEARCH = 'searchQuery';
export const THEME = 'themeColor';
export const MOBILE_USER_FILTER = 'mobileUserFilter';
export const MOBILE_FILTER_FORM_DATA = 'mobileFilterFormData';
export const MOBILE_FILTER_MODEL = 'mobileFilterModel';
export const MOBILE_FILTER_CLEARED = 'mobileFilterCleared';
export const SIDEBAR_OPEN = 'isSidebarOpen';
export const SIDEBAR_OPENED_BY_BUTTON = 'isSidebarOpenedByButton';
export const WALK_ME_STEPS = 'walkMeSteps';
export const WALK_ME_INSTANCE = 'walkMeInstance';
export const GRID_METADATA = 'gridMetaData';
export const USER_FAVOURITES = 'userFavorites';
export const TEMP_USER_FILTER = 'tempUserFilter';

const initialState: {
  searchQuery: string;
  themeColor: 'light' | 'dark';
  mobileUserFilter: IMobileUserFilter | null;
  mobileFilterFormData: FilterValue | null;
  mobileFilterModel: IMoileFilterModel | null;
  mobileFilterCleared: boolean;
  isSidebarOpen: boolean;
  isSidebarOpenedByButton: boolean;
  walkMeSteps: WalkmeData[];
  walkMeInstance: StateWalkmeInstance | null;
  gridMetaData: { [key: string]: { hide: string[]; order: string[]; name?: string; id?: string } | null };
  userFavorites: { [key: string]: boolean } | null;
  tempUserFilter: { [key: string]: any };
} = {
  searchQuery: '',
  themeColor: 'light',
  mobileUserFilter: null,
  mobileFilterFormData: null,
  mobileFilterModel: { changedFrom: 'applyFilter', data: {} },
  mobileFilterCleared: true,
  isSidebarOpen: false,
  isSidebarOpenedByButton: false,
  walkMeSteps: [],
  walkMeInstance: null,
  gridMetaData: {},
  userFavorites: null,
  tempUserFilter: {}
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
