import { useUsermanual } from './hooks/useUsermanual';

export type MenualData = Map<string, Map<string, Resource>>;

export type TManualData = {
  sectionName: string;
  resource: Resource[];
};

export type Resource = {
  _id?: string;
  resource?: string;
  custom?: boolean;
  sectionName?: string;
  sectionOrder?: null;
  resourceOrder?: null;
  createdBy?: AtedBy;
  updatedBy?: AtedBy;
  content?: string;
  resourceLabel?: string;
};

export type AtedBy = {
  user: string;
  date: Date;
};

export type SubSection = {
  _id: string;
  sectionName: string;
  content: string;
};

export type Section = {
  _id: string;
  sectionName: string;
  content: string;
  subSections?: SubSection[];
};

// useManual
export type UseManualState = {
  manualData: MenualData;
  leftSidebarData: TManualData[];
  isSidebarOpen: boolean;
  currentRoute: Location;
  pageData: Section[];
  loading: boolean;
  searchData: SearchData[] | null;
  isMobile: boolean;
  toggleSidebar: (prev: UseManualState) => Partial<UseManualState>;
};

export type UseUsermanual = ReturnType<typeof useUsermanual>;

export type SearchData = {
  _id?: string;
  sectionName?: string;
  content?: string;
  order?: number;
  scrollKey?: string;
  path: string;
  group: string;
};

export type HeadingNode = {
  level: number;
  text: string;
  id: string;
  children: HeadingNode[];
  element: String;
};
