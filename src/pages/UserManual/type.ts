import { UseManual } from 'src/pages/UserManual/hooks/useManual';

export type TManualData = {
  sectionName: string;
  resource: Resource[];
};

export type Resource = {
  _id: string;
  resource: string;
  sections: Section[];
  createdBy: AtedBy;
  updatedBy: AtedBy;
  sectionName: string;
  resourceLabel: string;
};

export type AtedBy = {
  user: string;
  date: Date;
};

export type Section = {
  _id: string;
  sectionName: string;
  content: string;
};

export type ComponentCommonProps = {
  state: UseManual;
};

// useManual
export type UseManualState = {
  manualData: TManualData[];
  isSidebarOpen: boolean;
  currentRoute: string;
  pageData: Section[];
  loading: boolean;
};

export type ManualActions =
  | { type: 'setManualData'; payload: TManualData[] }
  | { type: 'setIsSidebarOpen'; payload: boolean }
  | { type: 'setLoading'; payload: boolean }
  | { type: 'setCurrentRoute'; payload: string }
  | { type: 'setPageData'; payload: Section[] };
