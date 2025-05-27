export type Activity = {
  _id?: string;
  photo?: string;
  employeeNumber?: string;
  firstName?: string;
  lastName?: string;
  address?: AddressClass;
  email?: string;
  phone?: string;
  description?: string;
  createDate?: Date;
  brand?: Brand;
  createdBy?: CreatedBy;
  competency?: string[];
  history?: CreatedBy[];
  updatedBy?: CreatedBy;
  competencies?: CompetencyType[];
  user?: CompetencyType;
  technicianUnavailability?: TechnicianUnavailability[];
  technicianHistory?: TechnicianHistory[];
  competencyType?: CompetencyType;
  warehouse?: Warehouse;
  stepsData?: any[];
};

export type AddressClass = {
  optionValue?: OptionValue;
  optionLabel?: string;
  city?: string;
};

export type OptionValue = '630dbf159ec418610523553f' | '63bfc815e40bb3e086326107' | '64072e19e6d4944ddc168ca9';

export type Brand = '630dbe1e9ec418610523529c';

export type CompetencyType = {
  optionValue?: string;
  optionLabel?: string;
};

export type CreatedBy = {
  user?: string;
  date?: Date;
};

export type TechnicianHistory = {
  _id?: string;
  brand?: Brand;
  referenceType?: ReferenceType;
  status?: Status;
  technician?: string;
  referenceId?: string;
  estimateStartDate?: Date;
  estimateEndDate?: Date;
  reference?: Reference;
  warehouse?: string;
  duration?: number;
  notes?: null | string;
  startDate?: Date;
  startedBy?: string;
  endedBy?: string;
  endDate?: Date;
  title?: string;
  reason?: string;
  type?: string;
};

export type Reference = {
  estimateStartDate?: string;
  estimateEndDate?: string;
  optionValue?: string;
  optionLabel?: string;
  customerAccount?: CompetencyType;
};

export type ReferenceType = 'Field Service Order';

export type Status = 'Reserved' | 'Dispatched' | 'Returned';

export type TechnicianUnavailability = {
  _id?: string;
  technician?: string;
  title?: string;
  startDate?: Date;
  endDate?: Date;
  reason?: string;
  brand?: Brand;
  createdBy?: CreatedBy;
  updatedBy?: CreatedBy;
};

export type Warehouse = {
  entity?: string[];
  address?: string;
  manager?: string[];
  materialHandlers?: any[];
  optionValue?: string;
  optionLabel?: string;
};
