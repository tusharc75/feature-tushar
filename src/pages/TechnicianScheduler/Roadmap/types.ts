export interface TActivity {
  _id?: string;
  photo?: string;
  employeeNumber?: string;
  firstName?: string;
  lastName?: string;
  address?: Address;
  email?: string;
  phone?: string;
  description?: string;
  createDate?: Date;
  brand?: string;
  createdBy?: CreatedBy;
  competency?: string[];
  history?: CreatedBy[];
  updatedBy?: CreatedBy;
  competencies?: Address[];
  competencyType?: Address;
  fieldTicket?: PokedexFieldTicket[];
  child?: TActivity[];
}

export interface Address {
  optionValue?: string;
  optionLabel?: string;
}

export interface CreatedBy {
  user?: string;
  date?: Date;
}

export interface PokedexFieldTicket {
  _id?: string;
  brand?: string;
  service?: string;
  technician?: string;
  referenceId?: string;
  referenceType?: string;
  uniqueId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  fieldTicket?: FieldTicketFieldTicket[];
  serviceDetail?: ServiceDetail;
}

export interface FieldTicketFieldTicket {
  _id?: string;
  fieldTicketNumber?: string;
  currency?: Currency;
  fieldServiceOrder?: string;
  pdfTemplate?: string;
  service?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  description?: string;
  status?: string;
  technician?: string;
  steps?: any[];
  brand?: string;
  createdBy?: CreatedBy;
  cost?: Cost[];
  history?: History[];
  createDate?: Date;
  customerAccount?: string;
  billingAddress?: string;
  shippingAddress?: string;
  warehouse?: string;
  wellName?: string;
  wellNumber?: string[];
  estimateStartDate?: Date;
  estimateEndDate?: Date;
  owner?: string;
  collaborator?: string[];
  processStatus?: string;
  updatedBy?: CreatedBy;
  invoice?: string;
  numberOfWells?: string;
  signature?: string;
  pdf?: string;
}

export interface Cost {
  description?: string;
  qty?: number;
  unit?: string;
  price_usd?: number;
  totalPrice_usd?: number;
  finalPrice_usd?: number;
  _id?: string;
}

export type Currency = 'USD';

export interface History {
  user?: string;
  date?: Date;
  action?: string;
}

export interface ServiceDetail {
  _id?: string;
  serviceName?: string;
  serviceType?: string;
  serviceDescription?: string;
  serviceImage?: string;
  unit?: string[];
  pricingMethod?: string[];
  competency?: string[];
  preWork?: boolean;
  user?: string;
  brand?: string;
  entity?: string;
  createdBy?: CreatedBy;
  steps?: Step[];
  history?: CreatedBy[];
  updatedBy?: CreatedBy;
  competencies?: string[];
  competencyType?: string;
  collaborator?: any[];
  wellNumber?: any[];
}

export interface Step {
  _id?: string;
  fields?: any[];
  order?: number;
  stepName?: string;
  leadDay?: number;
  costPrice?: number;
  listPrice?: number;
  currency?: Currency;
  isPassFail?: boolean;
  isFailAddon?: boolean;
  failAddon?: any[];
  isPassAddon?: boolean;
  passAddon?: any[];
  isJumpStepPass?: boolean;
  jumpStepsPass?: any[];
  isJumpStepFail?: boolean;
  jumpStepsFail?: any[];
  isQuoteRevisionOnFail?: boolean;
  isReturnToStepOnFail?: boolean;
  returnToStepOnFail?: string;
  isReturnToServiceOnFail?: boolean;
  returnToServiceOnFail?: string;
  isSkipServiceOnPass?: boolean;
  skipServiceOnPass?: any[];
  isSkipServiceOnFail?: boolean;
  skipServiceOnFail?: any[];
  isAddStepsOnPass?: boolean;
  isAddStepsOnFail?: boolean;
}
