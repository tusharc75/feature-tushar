export type DNDFrom = 'sidebar' | 'technician';
type DNDFromSidebar = { data: Service; from: 'sidebar' };
type DNDFromTechnician = { data: Activity; from: 'technician' };
export type DNDData = { id: string } & (DNDFromSidebar | DNDFromTechnician);

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
  status?: any;
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

export type Over = {
  event?: DragEvent;
  item?: null;
  isCluster?: boolean;
  items?: null;
  group?: string;
  customTime?: null;
  what?: string;
  pageX?: number;
  pageY?: number;
  x?: number;
  y?: number;
  time?: Date;
  snappedTime?: Date;
};

export type Service = TService | TJob;

export type TService = {
  _id?: string;
  fieldServiceOrderNumber?: string;
  customerContact?: CustomerContact;
  billingAddress?: IngAddress;
  shippingAddress?: IngAddress;
  currency?: string;
  pdfTemplate?: PDFTemplate;
  estimateStartDate?: Date;
  estimateEndDate?: Date;
  status?: string;
  owner?: CustomerContact;
  collaborator?: any[];
  brand?: string;
  createdBy?: CreatedBy;
  processStatus?: string;
  updatedBy?: CreatedBy;
  warehouse?: string;
  service?: SService;
  wellNumber?: any[];
  index?: number;
  resourceId?: string;
  serviceName?: string;
  serviceId?: string;
  competencies?: string;
  resourceNumber?: string;
};
export type TJob = {
  _id?: string;
  fieldServiceOrderNumber?: string;
  customerContact?: CustomerContact;
  billingAddress?: IngAddress;
  shippingAddress?: IngAddress;
  currency?: string;
  pdfTemplate?: PDFTemplate;
  estimateStartDate?: Date;
  estimateEndDate?: Date;
  status?: string;
  owner?: CustomerContact;
  collaborator?: any[];
  brand?: string;
  createdBy?: AtedBy;
  processStatus?: string;
  updatedBy?: AtedBy;
  warehouse?: string;
  wellNumber?: any[];
  index?: number;
  resourceId?: string;
  resourceNumber?: string;
  service?: SService;
};

export type SService = {
  materialId?: string;
  type?: string;
  unit?: string[];
  pricingMethod?: string[];
  qty?: number;
  parentId?: null;
  estimateStartDate?: Date;
  estimateEndDate?: Date;
  _id?: string;
  price_usd?: number;
  finalPrice_usd?: number;
  description?: string;
  qtyDisplay?: number;
  serviceName?: string;
  serviceDescription?: string;
  serviceImage?: string;
  preWork?: boolean;
  customerNotificationOnComplete?: boolean;
  costPrice?: number;
  serviceType?: string;
  listPrice?: number;
  user?: string;
  brand?: string;
  entity?: string;
  createdBy?: CreatedBy;
  history?: CreatedBy[];
  updatedBy?: CreatedBy;
  steps?: Step[];
  competencies?: any[];
  uniqueId?: string;
  competencyType?: any;
};
export type Step = {
  _id?: string;
  stepName?: string;
  order?: number;
  leadDay?: number;
  costPrice?: number;
  listPrice?: number;
  isPassFail?: boolean;
  isPassAddon?: boolean;
  passAddon?: any[];
  isFailAddon?: boolean;
  failAddon?: any[];
  isJumpStepPass?: boolean;
  jumpStepsPass?: any[];
  isJumpStepFail?: boolean;
  jumpStepsFail?: any[];
  isQuoteRevisionOnFail?: boolean;
  returnToServiceOnFail?: string;
  isReturnToServiceOnFail?: boolean;
  isReturnToStepOnFail?: boolean;
  returnToStepOnFail?: string;
};
export type IngAddress = {
  city?: string;
  zipCode?: string;
  optionValue?: string;
  optionLabel?: string;
};
export type AtedBy = {
  user?: string;
  date?: Date;
};
export type CustomerContact = {
  email?: string;
  optionValue?: string;
  optionLabel?: string;
};
export type PDFTemplate = {
  owner?: string;
  collaborator?: any[];
  optionValue?: string;
  optionLabel?: string;
};
