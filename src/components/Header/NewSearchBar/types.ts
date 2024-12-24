export type Section = {
  head: string;
  items: Item[];
};
export type Item = {
  name: string;
  resourceLabel: string;
  sectionName: string;
  homePageLabel?: null | string;
  roleType: number;
  isRead: boolean;
  isCreate: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  resourceId: string;
  order: number;
  isHidden?: boolean;
  resourceLabelLowerCase: string;
  sectionNameLowerCase: string;
};

export type SelectedEntityData = string;

export type UserData = {
  user: User;
  role: Role;
  brandLogo: string;
  entity: Entity[];
  proxyBy: any[];
  gridViews: GridView[];
  gridRowsPerPage: GridRowsPerPage[];
};

export type Entity = {
  entityName: string;
  parent: string;
  currency: string;
  _id: string;
  brand: string;
  resource: Resource[];
  policy: { [key: string]: boolean };
  dashboards: any[];
  superAdminAccessResource: string[];
  entityLogo?: string;
};

export type Resource = {
  name: string;
  resourceLabel: string;
  sectionName: SectionName;
  roleType: number;
  isRead: boolean;
  isCreate: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  resourceId: string;
  isHidden?: boolean;
  homePageLabel?: null | string;
  order: number;
  resourceLabelLowerCase?: string;
  sectionNameLowerCase?: string;
};

export type SectionName = string;

export type GridRowsPerPage = {
  _id: string;
  user: ID;
  brand: string;
  date: Date;
  resource: string;
  rowsPerPage: number;
};

export type ID = string;

export type GridView = {
  _id: string;
  name: string;
  access: Access;
  default: boolean;
  order: string[];
  hide: string[];
  key: string;
  brand: string;
  user: ID;
  createdBy: AtedBy;
  updatedBy?: AtedBy;
  sizes?: { [key: string]: number };
};
export type Access = 'everyone' | 'private';
export type AtedBy = {
  user: ID;
  date: Date;
};
export type Role = {
  sideBar: any[];
  selectedEntity: SelectedEntity;
  brandSectionMaster: BrandSectionMaster[];
  userFavouriteResources: string[];
};

export type BrandSectionMaster = {
  _id: string;
  brand: string;
  description: string;
  sectionName: string;
  updatedBy: AtedBy;
  createdBy?: AtedBy;
  iconName?: string;
};

export type SelectedEntity = {
  entityName: string;
  parent: string;
  currency: string;
  _id: string;
  brand: string;
  resource: Resource[];
  policy: { [key: string]: boolean };
  dashboards: any[];
  superAdminAccessResource: string[];
};

export type User = {
  _id: ID;
  customerAccountId: null;
  customerContactId: null;
  supplierAccountId: string;
  supplierContactId: string;
  employeeMasterId: null;
  avatar: string;
  blocked: boolean;
  currency: string;
  email: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  office360User: boolean;
  title: string;
  brand: string;
  userType: number;
  eCommerceAccess: boolean;
  confirmed: boolean;
  createdBy: AtedBy;
  permissions: Permissions;
  notificationPref: NotificationPref[];
  frontendReloadRequired: boolean;
  office365User: boolean;
  reportsTo: string;
  updatedBy: AtedBy;
  selectedEntity: string;
  seen: boolean;
  isSynching: boolean;
  mfaSecret: string;
  isMFASetup: boolean;
  brandPolicy: BrandPolicy;
  userGroup: any[];
  doa: any[];
  brandLogo: string;
  timezone: string;
  brandCurrency: string;
  competencies: any[];
  brandName: string;
  brandQuoteDigitalSignature: boolean;
  dashboards: string[];
};

export type BrandPolicy = {
  _id: string;
  brand: string;
  allowNegativeInventory: boolean;
  assetDeliveredStatus: boolean;
  averageCostRoundingOff: string;
  hideInventoryCount: boolean;
  inboundEmail: string;
  inventorySoftHold: boolean;
  productInventoryIntegration: string;
  rentalInventoryDebit: boolean;
  rentalPlaning: boolean;
  rentalProgressiveBilling: boolean;
  rentalQuotation: boolean;
  rentalRepairAutoCreate: boolean;
  rentalRepairAutoCreateWithStructure: boolean;
  rentalService: boolean;
  rentalStopAssetNextStepValidation: boolean;
  repairOrderAddProductPackage: boolean;
  repairOrderPrice: boolean;
  repairOrderQuotation: boolean;
  reportAmountRoundingOff: string;
  serializedAssetCertification: boolean;
  serializedAssetFolder: string[];
  serializedAssetFolderCreate: boolean;
  servicePrePost: boolean;
  showSerializedProduct: boolean;
  storageLocation: boolean;
  subcontractPurchaseOrder: boolean;
  transactionTicketMail: boolean;
  warehouseAccessByUser: boolean;
  workOrderAutoComplete: boolean;
  workOrderConsumableRequest: boolean;
  workOrderServiceSequence: boolean;
  workOrderStepSequence: boolean;
  workOrderTechnicianConsumable: boolean;
  workOrderTimer: boolean;
  purchaseOrderSerializedAddInventory: boolean;
  purchaseOrderShowSerializedProduct: boolean;
  materialAttachmentsTrail: boolean;
  serializedAssetDepreciation: boolean;
  repairJobSendSupplierRequired: boolean;
  materialAttachmentsTrailPdf: string[];
  workOrderConsumableHide: boolean;
  workOrderConsumableConsumeHide: boolean;
  purchaseOrderAddService: boolean;
  addProductPackage: boolean;
  hideAssetPricePdf: boolean;
  rentalAutoFieldServiceOrder: boolean;
  rentalPlanning: boolean;
  repairOrderAutoLoadingTicket: boolean;
  interBrandRepairJobOrderSync: boolean;
  purchaseOrderSerializedAssetUpdate: boolean;
  serializedAssetScrapApproval: boolean;
  productInventorySerialNumberRequired: boolean;
  serializedAssetRecertNotification: boolean;
  fieldTicketRentalMaterialAdd: boolean;
  autoCreateInventory: boolean;
  hideProductInventoryCost: boolean;
  openInvoiceIntegration: boolean;
  packagePriceComponentWise: boolean;
  rentalDateChangeInAssetHistory: boolean;
  rentalInUseAssetRepair: boolean;
  autoAddTaxOnAddressAdd: boolean;
};
export type NotificationPref = {
  id: number;
  name: string;
  portal: boolean;
  email: boolean;
};
export type Permissions = {
  approveAccount: boolean;
  convertLeadToOpportunity: boolean;
  doaSetup: boolean;
  viewAndRestoreTrash: boolean;
  address: boolean;
};
