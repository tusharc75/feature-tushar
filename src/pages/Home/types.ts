export type ItemData = {
  name: string;
  resourceLabel: string;
  sectionName: string;
  homePageLabel?: null | string;
  roleType: number;
  isRead: boolean;
  isCreate: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  resourceId: string;
  isHidden: boolean;
  order: number;
  resourceLabelLowerCase: string;
  sectionNameLowerCase: string;
};

export type Section = {
  icon: React.ReactNode;
  text: string;
  color: Color;
  sideBarIcon: SideBarIcon;
  gradient: string[];
  head: string;
  items: Item[];
};

export type Color = '#ffffff';

export type Store = {};

export type IconProps = {
  colors: string[];
};

export type Item = {
  name: string;
  resourceLabel: string;
  sectionName: string;
  homePageLabel?: null | string;
  roleType: number;
  isRead: boolean;
  isCreate: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  resourceId: string;
  isHidden: boolean;
  order: number;
  resourceLabelLowerCase: string;
  sectionNameLowerCase: string;
};

export type SideBarIcon = {
  key: null;
  ref: null;
  props: SideBarIconProps;
  _owner: null;
  _store: Store;
};

export type SideBarIconProps = {
  size?: number;
  className?: string;
};
