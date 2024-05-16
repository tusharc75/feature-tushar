import { ReactElement } from 'react';

export type TEntity = {
  entityName?: string;
  parent?: string;
  currency?: string;
  _id?: string;
  brand?: string;
  resource?: TResource[];
  policy?: Policy;
  dashboards?: any[];
  superAdminAccessResource?: boolean;
};

export interface Policy {
  isPricingRentalManagement?: boolean;
  isPricingSublease?: boolean;
  isRentalReopen?: boolean;
  isPricingPurchaseOrder?: boolean;
  isQuoteAskSupplierPrice?: boolean;
  isProductInventorySettings?: boolean;
  isQuotationRentalManagement?: boolean;
  isProgressiveBillingRentalManagement?: boolean;
  isRentalClosed?: boolean;
}

export type TResource = {
  name?: string;
  resourceLabel?: string;
  sectionName?: string;
  roleType?: number;
  isRead?: boolean;
  isCreate?: boolean;
  isUpdate?: boolean;
  isDelete?: boolean;
  resourceId?: string;
  order?: number;
  isHidden?: boolean;
  sectionNameLowerCase?: string;
  resourceLabelLowerCase?: string;
};

export interface TSidebarItem extends TResource {
  link: string;
}

export type TSidebarSection = {
  items: TSidebarItem[] | null | undefined;
  name: string;
  link?: string;
  sectionName: string;
  icon: ReactElement;
};
