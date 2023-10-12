export interface TCategories {
  dataPoints: TDataPoints[];
  _id?: string;
  name: string;
  child?: TCategories[];
}

export type TDataPoints = {
  _id?: string;
  fieldLabel?: string;
  fieldName?: string;
  category?: Category;
  type?: string;
  description?: string;
  notes?: string;
  unit?: string;
  decimalPlaces?: string;
  deviceTemplate?: DeviceTemplate;
  active?: boolean;
  custom?: boolean;
  highValue?: number;
  lowValue?: number;
  formula?: string;
  dataPoints?: string[];
  brand?: string;
  createdBy?: AtedBy;
  history?: History[];
  updatedBy?: AtedBy;
  child?: TDataPoints[];
};

export interface Category {
  parentCategory?: string;
  optionValue?: string;
  optionLabel?: string;
}

export interface AtedBy {
  user?: User;
  date?: Date;
}

export interface User {
  _id?: string;
  firstName?: string;
  lastName?: string;
  concatedName?: string;
}

export interface DeviceTemplate {
  optionValue?: string;
  optionLabel?: string;
}

export interface History {
  user?: string;
  date?: Date;
}
