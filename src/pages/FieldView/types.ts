import { ASSET_STATUS } from 'src/constants/helpers';

export type FieldViewResource = 'Serialized Asset' | 'Well Master' | 'Pad Master';

// Pad Data
export type PadData = {
  _id?: string;
  padName?: string;
  customerAccount?: CustomerAccount;
  address?: Address;
  brand?: string;
  createdBy?: AtedBy;
  updatedBy?: AtedBy;
  lastActivityBy?: LastActivityBy;
  history?: History[];
};

export type Address = {
  city?: string;
  county?: string;
  state?: string;
  zipCode?: string;
  optionValue?: string;
  optionLabel?: string;
  latitude?: number;
  longitude?: number;
};

export type AtedBy = {
  user?: User;
  date?: Date;
};

export type User = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  concatedName?: string;
};

export type History = {
  user?: string;
  date?: Date;
};

export type LastActivityBy = {};

// Well Data
export type WellData = {
  _id?: string;
  wellName?: string;
  padName?: PadName;
  address?: Address;
  customerAccount?: CustomerAccount[];
  createdBy?: CreatedBy;
  updatedBy?: any;
  lastActivityBy?: any;
  amount?: number;
  totalAmount?: number;
  discount?: number;
  tax?: number;
};
export type PadName = {
  optionValue?: string;
  optionLabel?: string;
};

export type CreatedBy = {
  user?: User;
  date?: Date;
};

export type CustomerAccount = {
  taxApplicable?: boolean;
  shippingAddress?: string[];
  optionValue?: string;
  optionLabel?: string;
};

export type Status = (typeof ASSET_STATUS)[keyof typeof ASSET_STATUS];
// AssetData
export type AssetData = {
  _id?: string;
  assetNumber?: string;
  assetNumberType?: string;
  description?: string;
  serialnumber?: string;
  padName?: CurrentOwner;
  wellName?: CurrentOwner;
  wellNumber?: any[];
  gpsNumber?: string;
  status?: Status;
  subStatus?: string;
  barcode?: string;
  customer?: string;
  productCategory?: ProductCategory;
  jobCount?: number;
  mtrAttached?: boolean;
  stageCount?: number;
  mtrAttachedDate?: string;
  product?: CurrentOwner;
  warehouse?: Warehouse;
  model?: string;
  bornOnDate?: Date;
  certificateAttached?: boolean;
  certificateIssueDate?: Date;
  certificateExpiryDate?: string;
  comments?: string;
  inServiceDate?: Date;
  recertDate?: string;
  currentLocation?: CurrentLocation;
  cost?: number;
  netBookValue?: number;
  depreciationType?: string;
  depreciationPercent?: number | string;
  currentOwnerType?: string;
  currentOwner?: CurrentOwner;
  ownerType?: string;
  owner?: CurrentOwner;
  createdBy?: CreatedBy;
  productDescription?: ProductDescription;
  updatedBy?: UpdatedBy;
  id?: string;
  reserved?: boolean;
};

export type CurrentLocation = {
  city?: string;
  optionValue?: string;
  optionLabel?: string;
};

export type CurrentOwner = {
  optionValue?: string;
  optionLabel?: string;
};

export type ProductCategory = {
  chipColour?: string;
  optionValue?: string;
  optionLabel?: string;
};

export type ProductDescription = {
  _id?: string;
  optionLabel?: string;
  optionValue?: string;
};

export type UpdatedBy = {};

export type Warehouse = {
  entity?: string[];
  address?: string;
  manager?: string[];
  materialHandlers?: any[];
  optionValue?: string;
  optionLabel?: string;
};

export type TData = PadData | WellData | AssetData;
