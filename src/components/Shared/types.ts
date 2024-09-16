export type TableData = {
  resource: Resource;
  fields: SingleField[];
};

export type SingleField = {
  fieldData: FieldData;
  isCreate: boolean;
  isRead: boolean;
  isUpdate: boolean;
  isReadDisabled: boolean;
  isCreateDisabled: boolean;
  isUpdateDisabled: boolean;
  isDeleteDisabled: boolean;
  isHiddenDisabled: boolean;
};

export type FieldData = {
  _id: string;
  fieldName: string;
  fieldLabel: string;
  required: boolean;
  unique?: boolean;
  type: string;
  sectionName: string;
  order: number;
  resource: string;
  editAble: boolean;
  defaultValue?: DefaultValue;
  disableOnEdit?: boolean;
  hiddenField?: boolean;
  isDefaultValue?: boolean;
  primaryField?: boolean;
  brand: Brand;
  createdBy?: CreatedBy;
  roleType?: number | null;
  option?: FieldDataOption[];
  isTooltip?: boolean;
  tooltipMessage?: string;
  deletAble?: boolean;
  lookup?: boolean;
  lookupResource?: string;
  addAdditionalOption?: boolean;
  isDropdown?: boolean;
  isWarningTooltip?: boolean;
  warningTooltipMessage?: string;
  addManualOptionInExcel?: boolean;
  addBulkOptions?: boolean;
  entityWiseLookup?: boolean;
  isMinMaxValue?: boolean;
  minValue?: number;
  maxValue?: number;
  minValueServiceAdd?: string;
  maxValueServiceAdd?: string;
  isSystemGenerate?: boolean;
  isColumnEditable?: boolean;
  isHideColumnSum?: boolean;
  lookupDependentOn?: LookupDependentOn;
  sectionProperties?: Formulaoption;
  columnSize?: number;
  dataList?: boolean;
  dataListId?: DataListID;
  formula?: Formula;
  formulaFields?: any[];
  formulainputFields?: any[];
  formulaoption?: Formulaoption;
  htmlDescription?: HTMLDescription;
  inputFields?: string[];
  isFieldEntityWise?: boolean;
  lookupPreFilterFields?: any[];
  preFilters?: string[];
  showInPdf?: boolean;
  stopHideColumn?: boolean;
  subFields?: SubField[];
  visibilityCondition?: VisibilityCondition[];
  decimalPlaces?: number;
  isDependentDropdown?: boolean;
  isUneditable?: boolean;
  systemGeneratedPrefix?: string;
  systemGeneratedPrefixDigit?: number;
  systemGeneratedStartNumber?:number;
  systemGeneratedAutoIncrement?: boolean;
  lookupDependentOnField?: LookupDependentOnField;
  isShowFieldDependentOn?: boolean;
  lookUpField?: string;
  lookUpFieldDisplay?: string;
  additionalInfoSection?: string;
  showAdditionalInfoPopup?: boolean;
  dropdowDependentOn?: string;
  isFormula?: boolean;
  signatureUsers?: string[];
  displayCurrency?: string[];
  returnType?: string;
  sectionVisibilityCondition?: any[];
  isVlookup?: boolean;
};

export type Brand = '630dbe1e9ec418610523529c';

export type CreatedBy = {
  user: User;
  date: Date;
};

export type User = '61b84437885fdf02d9104cb0';

export type DataListID = '' | '66168bf9f57ade5fc063ca36' | '66168c00f57ade5fc063ca37';

export type DefaultValue =
  | ''
  | '#e0dcdc'
  | 'Auto Calculated'
  | 'USD - United States Dollar - ($)'
  | '6501a8af26e04f64601d350f'
  | 'auto inc'
  | 'Auto Generate'
  | 'Available'
  | 'AUTO INC'
  | 'New'
  | 'Auto Generated'
  | 'USD'
  | 'auc number'
  | 'Auto'
  | 'Auto Increment'
  | 'auto increment'
  | 'Unqualified';

export type Formula = '' | 'return inspectionDate' | 'return ' | 'return vehicle';

export type Formulaoption = {};

export type HTMLDescription = '' | '<p>abcdef</p>' | '<h3><strong>Demo Information</strong></h3>';

export type LookupDependentOn =
  | ''
  | 'customerAccount'
  | 'supplierAccount'
  | 'wellName'
  | 'transferFromPlant'
  | 'transfertoPlant'
  | 'marketSegment'
  | 'customerAccountName'
  | 'pickupFrom'
  | 'deliveryTo'
  | 'competencyType'
  | 'customerSite'
  | 'dropdown3';

export type LookupDependentOnField = '' | 'accountName' | 'billingAddress' | 'shippingAddress';

export type FieldDataOption = {
  optionLabel: string;
  optionValue?: string;
  order?: number;
  default?: boolean;
  id?: number;
  outcome?: Outcome;
};

export type Outcome = 'Won' | 'Lost';

export type SubField = {
  _id: string;
  fieldLabel: string;
  type: string;
  option: SubFieldOption[];
  required: boolean;
  isTooltip: boolean;
  tooltipMessage: string;
  editAble: boolean;
  deletAble: boolean;
  order: number;
  hiddenField: boolean;
  isDefaultValue: boolean;
  disableOnEdit: boolean;
  unique?: boolean;
  primaryField?: boolean;
  lookup: boolean;
  lookupResource: string;
  dataList: boolean;
  dataListId: string;
  preFilters: any[];
  htmlDescription: string;
  entityWiseLookup: boolean;
  isMinMaxValue: boolean;
  minValue: number;
  maxValue: number;
  minValueServiceAdd: string;
  maxValueServiceAdd: string;
  isDropdown: boolean;
  visibilityCondition: any[];
  subFields: any[];
  isSystemGenerate: boolean;
  isFieldEntityWise: boolean;
  isColumnEditable: boolean;
  stopHideColumn: boolean;
  isHideColumnSum: boolean;
  showInPdf: boolean;
  isWarningTooltip: boolean;
  warningTooltipMessage: string;
  defaultValue: string;
  formula: string;
  inputFields: any[];
  formulaFields: any[];
  formulainputFields: any[];
  formulaoption: Formulaoption;
  sectionName: string;
  fieldName: string;
  roleType: number;
  addManualOptionInExcel?: boolean;
  addAdditionalOption?: boolean;
  addBulkOptions?: boolean;
  lookupDependentOn?: string;
};

export type SubFieldOption = {
  optionLabel: string;
  optionValue: string;
  order: number;
  default: boolean;
};

export type VisibilityCondition = {
  index: number;
  logic: string;
  fields: VisibilityConditionField[];
};

export type VisibilityConditionField = {
  fieldName: string;
  value: string;
};

export type Resource = {
  name: string;
  resourceLabel: string;
  sectionName: string;
  roleType: number;
  isRead: boolean;
  isCreate: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  resourceId: string;
  order?: number;
  homePageLabel?: null | string;
  isHidden: boolean;
  isReadDisabled: boolean;
  isCreateDisabled: boolean;
  isUpdateDisabled: boolean;
  isDeleteDisabled: boolean;
  isHiddenDisabled: boolean;
};
