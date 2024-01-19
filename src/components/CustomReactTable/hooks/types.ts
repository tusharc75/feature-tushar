export interface FieldOption {
  _id?: string;
  fieldLabel?: string;
  type?: string;
  option?: Option[];
  required?: boolean;
  isTooltip?: boolean;
  tooltipMessage?: string;
  editAble?: boolean;
  deletAble?: boolean;
  order?: number;
  isUneditable?: boolean;
  hiddenField?: boolean;
  isDefaultValue?: boolean;
  disableOnEdit?: boolean;
  unique?: boolean;
  primaryField?: boolean;
  lookup?: boolean;
  lookupResource?: string;
  entityWiseLookup?: boolean;
  isDropdown?: boolean;
  isWarningTooltip?: boolean;
  warningTooltipMessage?: string;
  defaultValue?: string;
  fieldName?: string;
  sectionName?: string;
  formula?: string;
  inputFields?: any[];
  formulaFields?: any[];
  formulainputFields?: any[];
  formulaoption?: Formulaoption;
  resource?: string;
  brand?: Brand;
  roleType?: number;
  addManualOptionInExcel?: boolean;
  addAdditionalOption?: boolean;
  isMinMaxValue?: boolean;
  minValue?: number;
  maxValue?: number;
  isSystemGenerate?: boolean;
  maxValueServiceAdd?: string;
  minValueServiceAdd?: string;
  isColumnEditable?: boolean;
  isHideColumnSum?: boolean;
  stopHideColumn?: boolean;
  addBulkOptions?: boolean;
  lookupDependentOn?: string;
  isDependentDropdown?: boolean;
}

export type Brand = '630dbe1e9ec418610523529c';

export interface Formulaoption {}

export interface Option {
  optionValue?: string;
  optionLabel?: string;
  address?: string;
  entity?: any[];
  order?: number;
  default?: boolean;
  productCategory?: string;
  productDescription?: string;
  entities?: EntityClass[];
  email?: string;
  currency?: string;
}

export interface EntityClass {
  entity?: string[] | string;
  role?: string[];
}
