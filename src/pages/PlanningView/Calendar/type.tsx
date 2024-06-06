export type OnSelectDataType = {
  customerAccount: CustomerAccount;
  qty: number;
  referenceId: string;
  resource: string;
  resourceLabel: string;
  warehouse: CustomerAccount;
  serializedProduct: boolean;
};

export type CustomerAccount = {
  optionValue: string;
  optionLabel: string;
};
