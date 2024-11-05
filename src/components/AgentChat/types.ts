export type Field = {
  primary: boolean;
  field: string;
  type: string;
  order: number;
  value?: string;
  lookupDependentOn?: string;
  option?: Option[];
  description?: string;
};

export type Option = {
  _id: string;
  accountName?: string;
  parentAccount?: string;
  billingAddress?: string[];
  shippingAddress?: string[];
  optionLabel: string;
  optionValue: string;
  order: number;
  default: boolean;
  customerNumber?: number | string;
  fieldServiceManager?: string[];
  lead?: any[];
  customerAccount?: string[] | string;
  entity?: string[];
  address?: string;
};
export type Data = { [key: string]: { [key: string]: string } | string };
