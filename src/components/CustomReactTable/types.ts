// export type FilterModel = Record<string, DateData | MultiSelect | SingleLine | DropDown>;
export type FilterModel = { [key: string]: ValidFilterValues };
export type ValidFilterValues = DateData | MultiSelect | SingleLine;

export type DateData = {
  filter?: DateFormat;
};

export type DateFormat = {
  from: string;
  to: string;
};

export type MultiSelect = {
  filter?: string[];
};

export type SingleLine = {
  filter?: string;
};

export type DropDown = {
  operator: string;
  condition1: Condition1;
};

export type Condition1 = {
  filter: Filter[];
};

export type Filter = {
  optionValue: string;
  optionLabel: string;
  billingAddress: string[];
  shippingAddress: string[];
  order: number;
  default: boolean;
  fieldServiceManager: any[];
  lead: any[];
};
