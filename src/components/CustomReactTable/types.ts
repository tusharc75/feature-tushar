// export type FilterModel = Record<string, Data | MultiSelect | SingleLine | DropDown>;
export type FilterModel = { [key: string]: Data };

export type Data = {
  filter?: DateFormat | string[] | string;
  operator?: string;
  condition1?: Condition1;
};

export type DateFormat = {
  from: string;
  to: string;
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
