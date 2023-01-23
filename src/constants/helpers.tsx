import React, { forwardRef } from 'react';
import {
  AddBox,
  ArrowDownward,
  Check,
  ChevronLeft,
  ChevronRight,
  Clear,
  DeleteOutline,
  Edit,
  FilterList,
  FirstPage,
  LastPage,
  Remove,
  SaveAlt,
  Search,
  ViewColumn
} from '@material-ui/icons';
import { object, string, array, boolean, number } from 'yup';
import moment from 'moment';
import currencies from './currency_with_country.json';
import { TransitionProps } from '@material-ui/core/transitions';
import { Slide } from '@material-ui/core';
import { kebabCase, orderBy, uniqBy } from 'lodash';

export const staticHiddenResource = ['Dashboard', 'Report'];

export const defaultActivityShow = false;

export const vapidKey = 'BFFucJ4GMNzUKVU5HaI5BsGDi0Au6MqKIr7SlzDbY6s_2JX6y3Qu5E8dMXhLpmZLwDpheOyDBxtbOmxuFH8WZe4';

export const validations = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
};

export const documentUploadSupportExtensions =
  '.odp,.ods,.odt,.docx,.doc,.csv,.pot,.pps,.ppt,.pptx,.pdf,.xls,.xlsx,.ico,.tif,.tiff,.jpe,.png,.jpg,.jpeg,.gif,.txt,.jflsn';

//  1048576 = 1 MB
export const imageUploadMaxSize = { size: 1048576 * 2, text: '2 MB' };
export const documentUploadMaxSize = { size: 1048576 * 10, text: '10 MB' };
export const termsAndConditionDocumentUploadMaxSize = {
  size: 1048576 * 2,
  text: '2 MB'
};

export const repairJobProcessSteps = ['Serialized Assets', 'Repair Process'];
export const salesOrderProcessSteps = ['Add Products', 'Services and Consumables', 'Invoice'];
export const invoiceProcessSteps = ['Add Products', 'Ready To Invoice'];
export const quotationProcessSteps = ['Add Products', 'Services and Consumables', 'Quote Builder', 'Send To Customer', 'End'];
export const purchaseOrderSteps = ['Add Products', 'Receive Products'];
export const rentalManagementSteps = [
  'Add Products',
  'Add Services',
  // 'Add Consumables',
  'Add-on',
  'Quotation',
  'Serialized Asset',
  'Loading Ticket',
  'Receiving Ticket',
  'Final Slip'
];
export const transferInventorySteps = ['Add Products', 'Serialized Assets', 'Loading Ticket'];
export const subleaseSteps = ['Add Products', 'Start Sublease', 'End Sublease'];
export const bulkAssetCreationSteps = ['Add Products', 'Serialized Asset'];
export const repairOrderSteps = ['Add Assets', 'Work Order', 'Quotation', 'Post Work Service', 'Loading Ticket', 'Invoice'];
export const demandOrderSteps = ['Add Products'];

export const accountTemplateFileName = 'Accounts-Template.xlsx';
export const accountImportErrorFileName = 'Accounts-Errors.xlsx';

export const contactTemplateFileName = 'Contacts-Template.xlsx';
export const contactImportErrorFileName = 'Contacts-Errors.xlsx';

export const leadTemplateFileName = 'Leads-Template.xlsx';
export const leadImportErrorFileName = 'Leads-Errors.xlsx';

export const opportunityTemplateFileName = 'Opportunities-Template.xlsx';
export const opportunityImportErrorFileName = 'Opportunities-Errors.xlsx';

export const quoteStepColors = {
  'accepted by customer': { backgroundColor: '#008000', color: '#fff' },
  'not booked by customer': { backgroundColor: '#ba181b', color: '#fff' },

  're-open': { backgroundColor: '#ff7d00', color: '#fff' },
  'invalid by customer': { backgroundColor: '#eb5e28', color: '#fff' },

  'not booked': { backgroundColor: '#2b2d42', color: '#fff' },
  'building quote': { backgroundColor: '#023e7d', color: '#fff' },

  __default__: { backgroundColor: '#023e7d', color: '#fff' }
};

export const roleTypes = [
  {
    key: 'Global',
    value: 1
  },
  {
    key: 'Regional',
    value: 2
  }
];

export const userType = {
  brandAdmin: 2
};

export const AgGridHeaderHeight = 40;
export const AgGridRowHeight = 30;
export const AgGridFloatingFiltersHeight = 38;

export const gridPageSizes = [25, 50, 75];
export const gridLoadingTimeout = 500;
export const processFieldName = 'process';

export const stepsToIgnoreManualCompleteForOpportunity = ['doa'];

export const localStorageKeys = {
  currentSelectedRoleType: 'currentSelectedRoleType'
};

export const formFieldNames = {
  marketSegment: 'marketSegment',
  subMarketSegment: 'subMarketSegment',
  parentAccount: 'parentAccount'
};

export const sidebarResource = {
  customerAccount: 'Customer Account',
  user: 'User',
  customerContact: 'Customer Contact',
  brand: 'Brand',
  entity: 'Entity',
  role: 'Role',
  lead: 'Lead',
  opportunity: 'Opportunity',
  field: 'Field',
  productCategory: 'Product Category',
  productInventory: 'Product Inventory',
  serializedAsset: 'Serialized Asset',
  priceTemplate: 'Price Template',
  product: 'Product',
  productTemplate: 'Product Template',
  doa: 'DOA',
  termsAndConditions: 'Terms & Conditions',
  equiptmentRentalMaster: 'Equiptment Rental Master',
  productBuilder: 'Product Builder',
  formBuilder: 'Form Builder',
  currencyConverter: 'Currency Converter',
  quoteBuilder: 'Quotes',
  PNQBuilder: 'PNQ Builder',
  DOARequest: 'DOA Request',
  task: 'Task',
  case: 'Case',
  note: 'Note',
  event: 'Event',
  email: 'Email',
  attachment: 'Attachment',
  reminder: 'Reminder',
  calendar: 'Calendar',
  dashboard: 'Dashboard',
  budget: 'Budget',
  marketSegment: 'Market Segment',
  quotePdfTemplate: 'Quote Pdf Template',
  warehouse: 'Warehouse',
  rentalManagement: 'Rental Management',
  deliveryTicket: 'Delivery Ticket',
  pricingCondition: 'Pricing Condition',
  repairJob: 'Repair Job',
  salesOrder: 'Sales Order',
  invoice: 'Invoice',
  eCommercePolicy: 'e-Commerce Policy',
  packages: 'Packages',
  supplierContact: 'Supplier Contact',
  supplierAccount: 'Supplier Account',
  pricing: 'Pricing',
  priceBuilder: 'Price Builder',
  flags: 'Flags',
  purchaseOrder: 'Purchase Order',
  transferAsset: 'Transfer Asset',
  address: 'Address',
  sublease: 'Sublease',
  transferInventory: 'Transfer Inventory',
  zone: 'Zone',
  projectSales: 'Project Sales',
  wellMaster: 'Well Master',
  bulkAssetCreation: 'Bulk Asset Creation',
  pos: 'Pos',
  repairType: 'Repair Type',
  report: 'Report',
  resourceCalendar: 'Resource Calendar',
  cageManagement: 'Cage Management',
  productAuction: 'Product Auction',
  inventoryToAsset: 'Inventory to Asset',
  inventoryCycle: 'Inventory Cycle',
  dashboardMaster: 'Dashboard Master',
  scheduleReport: 'Schedule Report',
  cycleCountDetermination: 'Cycle Count Determination',
  cycleCountPhysicalInventory: 'Cycle Count Physical Inventory',
  quotation: 'Quotation',
  serviceMaster: 'Service Master',
  leadTimeMaster: 'Lead Time Master',
  repairOrder: 'Repair Order',
  productionOrder: 'Production Order',
  serviceOrder: 'Service Order',
  workOrder: 'Work Order',
  workOrderSupervisor: 'Work Order Supervisor',
  workOrderTechnician: 'Work Order Technician',
  freqentlyAskedQuestion: 'Frequently Asked Question',
  blog: 'Blog',
  demandOrder: 'Demand Order',
  surveys: 'Surveys',
  supportTicket: 'Support Ticket',
  eCommerceHome: 'e-Commerce Home',
  contactUs: 'Contact Us',
  employeeMaster: 'Employee Master',
  competencyMaster: 'Competency Master',
  technicianScheduler: 'Technician Scheduler'
};

export const primaryFields = {
  serializedAsset: 'assetNumber',
  rentalManagement: 'rentalJobName',
  transferAsset: 'transferAssetNumber',
  repairJob: 'repairJobName',
  purchaseOrder: 'purchaseOrderNumber',
  deliveryTicket: 'ticketName'
};

export const RESOURCE_LABEL = {
  account: 'Supplier Accounts',
  warehouse: 'Plants',
  customerAccount: 'Customer Accounts',
  user: 'Users',
  contact: 'Supplier Contacts',
  customerContact: 'Customer Contacts',
  brand: 'Brands',
  entity: 'Entities',
  role: 'Roles',
  lead: 'Leads',
  opportunity: 'Opportunities',
  field: 'Fields',
  productCategory: 'Product Categories',
  productInventory: 'Product Inventory',
  serializedAsset: 'Serialized Assets',
  priceTemplate: 'Price Templates',
  product: 'Product Master',
  productTemplate: 'Product Templates',
  doa: 'DOA',
  termsAndConditions: 'T&Cs',
  equiptmentRentalMaster: 'Equiptment Rental Master',
  projectSales: 'Project Sales',
  productBuilder: 'Price Builder',
  formBuilder: 'Form Builder',
  currencyConverter: 'Currency Converter',
  quoteBuilder: 'Quotes',
  PNQBuilder: 'PNQ Builder',
  DOARequest: 'DOA Requests',
  task: 'Tasks',
  case: 'Cases',
  note: 'Notes',
  event: 'Events',
  email: 'Emails',
  attachment: 'Attachments',
  reminder: 'Reminders',
  calendar: 'Calendar',
  dashboard: 'Dashboards',
  budget: 'Budgets',
  marketSegment: 'Market Segments',
  quotePdfTemplate: 'PDF Templates',
  rentalManagement: 'Rental Job',
  deliveryTicket: 'Delivery Tickets',
  pricingCondition: 'Pricing Setup',
  repairJob: 'Repair Jobs',
  salesOrder: 'Sales Order',
  invoice: 'Invoice',
  eCommercePolicy: 'e-Commerce Policy',
  packages: 'Packages',
  purchaseOrder: 'Purchase Orders',
  transferAsset: 'Transfer Assets',
  address: 'Addresses',
  sublease: 'Sublease',
  transferInventory: 'Transfer Inventory',
  zone: 'Zone',
  wellMaster: 'Well Master',
  bulkAssetCreation: 'Bulk Asset Creation',
  pos: 'eRECS',
  repairType: 'Repair Types',
  report: 'Report',
  scheduleReport: 'Schedule Report',
  resourceCalendar: 'Resource Calendar',
  cageManagement: 'Cage Management',
  productAuction: 'Product Auction',
  inventoryToAsset: 'Inventory to Asset',
  importExport: 'Import-Export',
  inventoryCycle: 'Inventory Cycle',
  cycleCountDetermination: 'Cycle Count Determination',
  cycleCountPhysicalInventory: 'Cycle Count Physical Inventory',
  quotation: 'Quotation',
  serviceMaster: 'Service Master',
  leadTimeMaster: 'Lead Time Master',
  repairOrder: 'Repair Order',
  productionOrder: 'Production Order',
  serviceOrder: 'Service Order',
  workOrder: 'Work Order',
  workOrderSupervisor: 'Work Order Supervisor',
  workOrderTechnician: 'Work Order Technician',
  freqentlyAskedQuestion: 'Frequently Asked Question',
  blog: 'Blog',
  eCommerceHome: 'e-Commerce Home',
  surveys: 'Surveys',
  contactUs: 'Contact Us',
  supportTicket: 'Support Ticket',
  demandOrder: 'Demand Order',
  employeeMaster: 'Employee Master',
  competencyMaster: 'Competency Master',
  technicianScheduler: 'Technician Scheduler'
};

export const CHILD_RESOURCE = {
  rentalManagementProduct: 'Rental Management Product',
  rentalManagementCost: 'Rental Management Cost',
  purchaseOrderProduct: 'Purchase Order Product',
  purchaseOrderService: 'Purchase Order Service',
  bulkAssetCreationProduct: 'Bulk Asset Creation Product',
  repairJobAsset: 'Repair Job Asset',
  invoiceProduct: 'Invoice Product',
  salesOrderProduct: 'Sales Order Product',
  salesOrderCost: 'Sales Order Cost',
  subleaseProduct: 'Sublease Product',
  quotationProduct: 'Quotation Product',
  quotationCost: 'Quotation Cost',
  quotationService: 'Quotation Service',
  repairOrderProduct: 'Repair Order Product',
  serviceOrderDetails: 'Service Order Detail'

};

export const sidebarResourceObjectFromValues = () => {
  let obj: any = {};
  Object.keys(sidebarResource).forEach((key) => {
    obj[sidebarResource[key]] = key;
  });
  return obj;
};

export const lead = {
  leadResource: 'lead', //  Key of sidebar object
  leadApi: '/lead'
};

export const opportunity = {
  opportunityResource: 'opportunity', //  Key of sidebar object
  opportunityApi: '/opportunity'
};

export const entity = {
  entityResource: 'entity', //  Key of sidebar object
  entityApi: '/entity'
};

export const productTemplate = {
  productTemplateResource: 'productTemplate',
  productTemplateApi: '/product-template',
  productTemplateRoute: 'product-template'
};

export const priceTemplate = {
  priceTemplateResource: 'priceTemplate',
  priceTemplateApi: '/price-template',
  priceTemplateRoute: 'price-template'
};

export const quoteBuilder = {
  qbResource: 'quoteBuilder',
  qbApi: '/quote-builder'
};

export const rentalManagement = {
  api: '/rental-management',
  rentalManagementResource: 'rentalManagement',
  resource: 'rental-management'
};

export const deliveryTicket = {
  resource: 'deliveryTicket',
  api: '/delivery-ticket'
};

export const repairJob = {
  resource: 'repairJob',
  api: '/repair-job'
};

export const repairOrder = {
  resource: 'repairOrder',
  api: '/repair-order'
};

export const productionOrder = {
  resource: 'productionOrder',
  api: '/production-order'
};

export const serviceOrder = {
  resource: 'serviceOrder',
  api: '/service-order'
};

export const employeeMaster = {
  resource: 'employeeMaster',
  api: '/employee-master'
};

export const salesOrder = {
  api: '/sales-order',
  resource: 'sales-order'
};

export const invoice = {
  api: '/invoice',
  resource: 'invoice'
};

export const quotation = {
  api: '/quotation',
  resource: 'quotation'
};

export const demandOrder = {
  api: '/demand-order',
  resource: 'demandOrder'
};

export const technicianScheduler = {
  api: '/technician-scheduler',
  resource: 'technicianScheduler'
};

export const packages = {
  resource: 'Packages',
  api: '/packages',
  permissions: 'packages'
};

export const warehouse = {
  warehouseResource: 'warehouse',
  warehouseApi: '/warehouse'
};

export const wellMaster = {
  resource: 'wellMaster',
  api: '/well-master',
  route: 'well-master'
};

export const projectSales = {
  projectSalesResource: 'projectSales',
  projectSalesApi: '/project-sales',
  projectSalesRoute: 'project-sales'
};

export const quote = {
  quoteResource: 'quote'
};

export const supplierAccount = {
  accountApi: 'supplier-account',
  accountRoute: 'supplier-account',
  accountResource: 'supplierAccount', //  Key of sidebar object
  accountPermission: 'Supplier Account',
  accountResourceLabel: 'account'
};

export const termsAndCondition = {
  api: '/termsandconditions',
  route: '/terms-conditions',
  permission: 'termsAndConditions'
};

export const customerAccount = {
  accountApi: 'customer-account',
  accountRoute: 'customer-account',
  accountResource: 'customerAccount', //  Key of sidebar object
  accountPermission: 'Customer Account',
  accountResourceLabel: 'customerAccount'
};

export const supplierContact = {
  contactApi: 'supplier-contact',
  contactRoute: 'supplier-contact',
  contactResource: 'supplierContact', //  Key of sidebar object
  contactPermission: 'Supplier Contact',
  contactResourceLabel: 'contact'
};

export const customerContact = {
  contactApi: 'customer-contact',
  contactRoute: 'customer-contact',
  contactResource: 'customerContact', //  Key of sidebar object
  contactPermission: 'Customer Contact',
  contactResourceLabel: 'customerContact'
};

export const profilePage = {
  profilePageRoute: '/profile'
};

export const product = {
  api: '/product',
  route: '/product',
  permission: 'product'
};

export const eProduct = {
  api: '/e-product',
  route: '/e-product'
};

export const serializedAsset = {
  api: '/serialized-asset',
  route: '/serialized-asset',
  permission: 'serializedAsset',
  resource: 'Serialized Asset'
};

export const workOrderSupervisor = {
  api: '/work-order-supervisor',
  route: '/work-order-supervisor',
  permission: 'workOrderSupervisor',
  resource: 'Work Order Supervisor'
};

export const convertInventory = {
  api: '/convert-inventory-to-asset',
  route: '/inventory-to-asset',
  permission: 'inventoryToAsset',
  resource: 'Inventory to Asset'
};

export const productInventory = {
  api: '/product-inventory',
  route: '/product-inventory',
  permission: 'productInventory',
  resource: 'product-inventory'
};
export const budget = {
  budgetApi: '/budget',
  budgetRoute: '/budget',
  budgetPermission: 'budget',
  resource: 'budget'
};

export const quotePdfTemplate = {
  quotePdfTemplateApi: '/quote-pdf-template',
  quotePdfTemplateRoute: '/quote-pdf-template',
  quotePdfTemplateTimeoutPermission: 'quotePdfTmeplate'
};

export const marketSegment = {
  marketSegmentApi: '/market-segment',
  marketSegmentResource: 'marketSegment'
};

export const address = {
  addressApi: '/address',
  addressResource: 'address'
};

export const purchaseOrder = {
  api: '/purchase-order',
  route: '/purchase-order',
  permission: 'purchaseOrder',
  resource: 'purchaseOrder'
};

export const sublease = {
  api: '/sublease',
  route: '/sublease',
  permission: 'sublease',
  resource: 'sublease'
};

export const transferAsset = {
  api: '/transfer-asset',
  route: '/transfer-asset',
  permission: 'transferAsset',
  resource: 'transferAsset'
};

export const transferInventory = {
  api: '/transfer-inventory',
  route: '/transfer-inventory',
  permission: 'transferInventory',
  resource: 'transferInventory'
};

export const pricingCondition = {
  resource: 'pricingCondition',
  api: '/pricing-condition',
  route: 'pricing-condition'
};

export const bulkAssetCreation = {
  api: '/bulk-asset-creation',
  route: '/bulk-asset-creation',
  permission: 'bulkAssetCreation',
  resource: 'bulkAssetCreation'
};

export const repairType = {
  api: '/repair-type',
  route: '/repair-type',
  permission: 'Repair Type',
  resource: 'Repair Type'
};
export const cageManagement = {
  api: '/cage-management',
  route: '/cage-management',
  permission: 'Cage Management',
  resource: 'Cage Management'
};
export const productAuction = {
  api: '/product-auction',
  route: '/product-auction',
  permission: 'Product Auction',
  resource: 'Product Auction'
};

export const cycleCountPhysicalInventory = {
  api: '/inventory-cycle/physical-inventory',
  route: '/cycle-count-physical-inventory',
  permission: 'Cycle Count Physical Inventory',
  resource: 'Cycle Count Physical Inventory'
};

export const serviceMaster = {
  api: '/service-master',
  route: '/service-master',
  permission: 'Service Master',
  resource: 'Service Master'
};
export const leadTimeMaster = {
  api: '/lead-time-master',
  route: '/lead-time-master',
  permission: 'Lead Time Master',
  resource: 'Lead Time Master'
};

export const workOrder = {
  resource: 'Work Order',
  api: '/work-order'
};

export const profileMenuItems = {
  profile: 1,
  notification: 2,
  setting: 3,
  users: 4,
  securityPrivacy: 5
};

export const SCHEDULE_FREQUENCY = ['Daily', 'Weekly', 'Monthly'];
export const FREQUENCY_WEEKS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const getObjKeys = (val: string | boolean = '', arr: any[]) => {
  //let selectedEntity = localStorage.getItem("selectedEntity")
  //let isCreate = (val === "") ? true : false

  const obj = {};
  for (const key of arr) {
    let value = key.isDefaultValue ? key.defaultValue : val;

    //let isEntityField = key?.fieldName === "entity"
    // if (isEntityField && selectedEntity && isCreate) {
    //   value = key?.type === "multiSelect" ? [selectedEntity] : selectedEntity
    // }

    if (key.type === 'dropDown') {
      let option = key.option?.find((data: any) => data.default === true);
      if (!option && key.required && key.option?.length === 1) {
        option = key.option[0];
      }
      obj[key.fieldName] = value ? value : option ? option.optionValue : '';
    } else if (key.type === 'multiSelect') {
      let defaultOptions = key.option?.filter((item: any) => item.default === true);
      if (defaultOptions?.length === 0 && key.required && key.option?.length === 1) {
        defaultOptions = key.option;
      }
      const options = defaultOptions?.map((data: any) => data.optionValue);
      obj[key.fieldName] = value ? (typeof value === 'string' ? [value] : value) : options;
    } else if (key.type === 'freeStyleMultiSelect') {
      const defaultOptions = key.option?.filter((item: any) => item.default === true);
      const options = defaultOptions?.map((data: any) => data.optionValue);
      obj[key.fieldName] = value ? value : options;
    } else if (key.type === 'date') {
      obj[key.fieldName] = value ? value : new Date();
    } else if (key.type === 'year') {
      obj[key.fieldName] = value ? value : new Date();
    } else if (key.type === 'colorPicker') {
      obj[key.fieldName] = value ? value : '#aaaaaa';
    } else if (key.type === 'switch' || key.type === 'checkBox') {
      obj[key.fieldName] = value ? value : false;
    } else if (key.type !== 'currencyAmount' && (key.type === 'converter' || key.isConverter === true)) {
      key.displayUnits &&
        key.displayUnits.forEach((_unit) => {
          obj[key.fieldName + '_' + _unit.toLowerCase()] = value && value !== '' ? parseFloat(value) : value;
        });
    } else if (key.type === 'currencyAmount') {
      key.displayCurrency &&
        key.displayCurrency.forEach((_currency) => {
          if (key.isConverter && key.displayUnits.length) {
            key.displayUnits &&
              key.displayUnits.forEach((_unit) => {
                obj[key.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()] = value && value !== '' ? parseFloat(value) : value;
              });
          } else {
            obj[key.fieldName + '_' + _currency.toLowerCase()] = value && value !== '' ? parseFloat(value) : value;
          }
        });
    } else if (key.type === 'decimal') {
      obj[key.fieldName] = value && value !== '' ? parseFloat(value) : value;
    } else {
      obj[key.fieldName] = value;
    }
  }
  return obj;
};

export const getObjKeysWithValues = (dataObj: object, arr: any[]) => {
  const obj = {};

  const filterValues = (data: object | any) => (typeof data === 'string' ? data : typeof data === 'object' ? data.optionValue : '');
  for (const key of arr) {
    let defaultValue;

    if (key?.isDefaultValue && key?.defaultValue) {
      defaultValue = key.defaultValue;
    }
    if (key.type === 'switch' || key.type === 'checkBox') {
      obj[key.fieldName] = dataObj[key.fieldName] ? dataObj[key.fieldName] : defaultValue ? defaultValue : false;
    } else if (key.type === 'multiSelect') {
      const values =
        dataObj[key.fieldName] && dataObj[key.fieldName].length
          ? typeof dataObj[key.fieldName] === 'string'
            ? [dataObj[key.fieldName]]
            : dataObj[key.fieldName].map((val: any) => filterValues(val))
          : defaultValue || [];
      obj[key.fieldName] = values;
    } else if (key.type === 'dropDown') {
      const value =
        dataObj[key.fieldName] && Array.isArray(dataObj[key.fieldName]) && dataObj[key.fieldName]?.length
          ? dataObj[key.fieldName][0]
          : filterValues(dataObj[key.fieldName]);
      obj[key.fieldName] = value ? value : defaultValue || '';
    } else if (key.type === 'converter' || key.type === 'currencyAmount' || key.isConverter === true) {
      if (key.type !== 'currencyAmount' && (key.type === 'converter' || key.isConverter === true)) {
        key.displayUnits &&
          key.displayUnits.forEach((_unit) => {
            let fieldName = key.fieldName + '_' + _unit.toLowerCase();
            if (key.fieldName.includes('_')) {
              fieldName = key.fieldName;
            }
            obj[fieldName] = dataObj[fieldName] ? dataObj[fieldName] : defaultValue || 0;
          });
      } else if (key.type === 'currencyAmount' && (key.type === 'converter' || key.isConverter === true)) {
        key.displayCurrency &&
          key.displayCurrency.forEach((_currency) => {
            key.displayUnits &&
              key.displayUnits.forEach((_unit) => {
                let fieldName = key.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
                if (key.fieldName.includes('_')) {
                  fieldName = key.fieldName;
                }
                obj[fieldName] = dataObj[fieldName] ? dataObj[fieldName] : 0;
              });
          });
      } else if (key.type === 'currencyAmount') {
        key.displayCurrency &&
          key.displayCurrency.forEach((_currency) => {
            let fieldName = key.fieldName + '_' + _currency.toLowerCase();
            if (key.fieldName.includes('_')) {
              fieldName = key.fieldName;
            }
            obj[fieldName] = dataObj[fieldName] ? dataObj[fieldName] : 0;
          });
      }
    } else if (key.type === 'decimal' || key.type === 'percent' || key.type === 'formula') {
      obj[key.fieldName] = dataObj[key.fieldName] || dataObj[key.fieldName] === 0 ? dataObj[key.fieldName] : defaultValue || 0;
    } else {
      obj[key.fieldName] = dataObj[key.fieldName] ? dataObj[key.fieldName] : defaultValue || '';
    }
  }
  return obj;
};

export const removeEmptyKeys = (obj: object) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== '' || null || undefined));
};

/**
 * @param {Array} fields
 */
export const yupSchema = (fields: any[], validEmail = true) => {
  const schema = {};
  fields.forEach((input) => {
    if (input.type === 'singleLine') {
      schema[input.fieldName] = input.required ? string().required(`${input.fieldLabel} is required`) : string();
    } else if (input.type === 'name') {
      schema[input.fieldName] = input.required
        ? string()
          .matches(/^([^0-9]*)$/, "Numbers aren't allowed")
          .required(`${input.fieldLabel} is required`)
        : string().matches(/^([^0-9]*)$/, "Numbers aren't allowed");
    } else if (input.type === 'url') {
      schema[input.fieldName] = input.required
        ? string()
          .matches(
            /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
            'Enter valid URL'
          )
          .required(`${input.fieldLabel} is required`)
        : string().matches(
          /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
          'Enter valid URL'
        );
    } else if (input.type === 'mobileNumber') {
      schema[input.fieldName] = input.required
        ? string().min(10, 'Mobile number is too short').required(`${input.fieldLabel} is required`)
        : string().min(10, 'Mobile number is too short');
    } else if (input.type === 'multiSelect') {
      schema[input.fieldName] = input.required ? array().min(1, `${input.fieldLabel} is required`) : array();
    } else if (input.type === 'percent' || input.type === 'number' || input.type === 'decimal') {
      schema[input.fieldName] = input.required ? number().required(`${input.fieldLabel} is required`).nullable() : number().nullable();
    } else if (input.type === 'email') {
      schema[input.fieldName] =
        input.required && validEmail
          ? string().email().required(`${input.fieldLabel} is required`)
          : string().email(`${input.fieldLabel} must be a valid email`);
    } else if (input.type === 'switch' || input.type === 'checkBox') {
      schema[input.fieldName] = input.required ? boolean().required(`${input.fieldLabel} is required`) : boolean();
    } else if (input.type !== 'currencyAmount' && (input.type === 'converter' || input.isConverter === true)) {
      input.displayUnits &&
        input.displayUnits.forEach((_unit) => {
          schema[input.fieldName + '_' + _unit.toLowerCase()] = input.required
            ? number().required(`${input.fieldLabel} is required`).nullable()
            : number().nullable();
        });
    } else if (input.type === 'currencyAmount') {
      input.displayCurrency &&
        input.displayCurrency.forEach((_currency) => {
          if (input.isConverter && input.displayUnits.length) {
            input.displayUnits.forEach((_unit) => {
              schema[input.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()] = input.required
                ? number().required(`${input.fieldLabel} is required`).nullable()
                : number().nullable();
            });
          } else {
            schema[input.fieldName + '_' + _currency.toLowerCase()] = input.required
              ? number().required(`${input.fieldLabel} is required`).nullable()
              : number().nullable();
          }
        });
    } else if (input.type === 'date') {
      schema[input.fieldName] = input.required ? string().required(`${input.fieldLabel} is required`).nullable() : string().nullable();
    } else if (input.type === 'freeStyleMultiSelect') {
      schema[input.fieldName] = input.required ? array().required(`${input.fieldLabel} is required`) : array();
    } else if (input.type === 'colorPicker') {
      schema[input.fieldName] = input.required ? string().required(`${input.fieldLabel} is required`).nullable() : string().nullable();
    } else if (input.type === 'multiImageUpload') {
      schema[input.fieldName] = input.required ? array().required(`${input.fieldLabel} is required`).nullable() : array().nullable();
    } else if (input.type === 'multiFileUpload') {
      schema[input.fieldName] = input.required ? array().required(`${input.fieldLabel} is required`).nullable() : array().nullable();
    } else {
      schema[input.fieldName] = input.required ? string().required(`${input.fieldLabel} is required`) : string();
    }
  });

  return object().shape(schema);
};

export const UnCamelCase = (str) => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
    .replace(/^./, function (str) {
      return str?.toUpperCase();
    });
};

export const isObjectEmpty = (obj) => {
  return Object.keys(obj)?.length === 0;
};

export const currencyCodeToSymbol = (currencyCode) => {
  return currencies.filter((obj) => obj.currencyCode === currencyCode)[0].symbolNative;
};

// Function To Set Owner DataSource
export const getOwnerDropdownDataSource = (selectedCollaborator, mainDataSource) => {
  if (!selectedCollaborator || selectedCollaborator.length === 0) {
    return mainDataSource;
  } else {
    const ownerDataSource = [];

    mainDataSource.map((d) => {
      const isCollaboratorSelected = selectedCollaborator.find((collaboratorId) => collaboratorId === d?.optionValue);
      if (!isCollaboratorSelected) {
        ownerDataSource.push(d);
      }
    });
    return ownerDataSource;
  }
};

// Function To Set Collaborator DataSource
export const getCollaboratorDropdownDataSource = (selectedOwnerId, mainDataSource) => {
  return selectedOwnerId ? mainDataSource.filter((d) => d?.optionValue !== selectedOwnerId) : mainDataSource;
};

export const initializeDropdownById = (field, fieldName, id) => {
  if (field.fieldData.fieldName === fieldName && field.fieldData.option && field.fieldData.option.length > 0) {
    let options = field.fieldData.option;

    options.forEach((d) => {
      d.default = d?.optionValue === id;
    });

    field.fieldData.option = options;
  }

  return field;
};
export const dateFormat = localStorage.getItem('dateFormat') ?? 'MM/DD/YYYY';
export const dateTimeFormat = localStorage.getItem('dateTimeFormat') ?? 'MM/DD/YYYY hh:mm A';
export const cardDateFormat = localStorage.getItem('cardDateFormat') ?? 'MMM DD, YYYY';

export const dateFormatForInputControl = localStorage.getItem('dateFormatForInputControl') ?? 'MM/dd/yyyy';
// export const dateTimeFormat = "MM/dd/yyyy hh:mm A"
// export const cardDateFormat = "MMM,dd yyyy"

export const yyyyMMDD = (dateToBeFormatted) => {
  return dateToBeFormatted ? moment(dateToBeFormatted).format(cardDateFormat) : dateToBeFormatted;
};

export const displayDate = (date) => {
  return date ? moment(date).format(dateFormat) : date;
};

export const displayDateTime = (date) => {
  return date ? moment(date).format(dateTimeFormat) : date;
};

export const displayCardDate = (date) => {
  return date ? moment(date).format(cardDateFormat) : date;
};

export const materialTableIcons: any = {
  Add: forwardRef((props: any, ref: any) => <AddBox {...props} ref={ref} />),
  Check: forwardRef((props: any, ref: any) => <Check {...props} ref={ref} />),
  Clear: forwardRef((props: any, ref: any) => <Clear {...props} ref={ref} />),
  Delete: forwardRef((props: any, ref: any) => <DeleteOutline {...props} ref={ref} />),
  DetailPanel: forwardRef((props: any, ref: any) => <ChevronRight {...props} ref={ref} />),
  Edit: forwardRef((props: any, ref: any) => <Edit {...props} ref={ref} />),
  Export: forwardRef((props: any, ref: any) => <SaveAlt {...props} ref={ref} />),
  Filter: forwardRef((props: any, ref: any) => <FilterList {...props} ref={ref} />),
  FirstPage: forwardRef((props: any, ref: any) => <FirstPage {...props} ref={ref} />),
  LastPage: forwardRef((props: any, ref: any) => <LastPage {...props} ref={ref} />),
  NextPage: forwardRef((props: any, ref: any) => <ChevronRight {...props} ref={ref} />),
  PreviousPage: forwardRef((props: any, ref: any) => <ChevronLeft {...props} ref={ref} />),
  ResetSearch: forwardRef((props: any, ref: any) => <Clear {...props} ref={ref} />),
  Search: forwardRef((props: any, ref: any) => <Search {...props} ref={ref} />),
  SortArrow: forwardRef((props: any, ref: any) => <ArrowDownward {...props} ref={ref} />),
  ThirdStateCheck: forwardRef((props: any, ref: any) => <Remove {...props} ref={ref} />),
  ViewColumn: forwardRef((props: any, ref: any) => <ViewColumn {...props} ref={ref} />)
};

interface IPermission {
  [key: string]: {
    isCreate: boolean;
    isRead: boolean;
    isUpdate: boolean;
    isDelete: boolean;
    approveAccount?: boolean;
  };
}

export const isFieldNotTouched = (data, values) => {
  return Object.values(simplifyValues(data.initialValues, data.fields)).toString() === Object.values(simplifyValues(values, data.fields)).toString();
};

export const getPermissions = (user, selectedEntity = undefined): IPermission | null => {
  if (user) {
    let permissions = {};
    let routesAndTitle = {};

    let data = [...user?.role?.sideBar];

    if (selectedEntity) {
      if (user?.entity && user?.entity.length && selectedEntity) {
        data = [...data, ...user?.entity.find((entityObj) => entityObj._id === selectedEntity)?.resource];
      }
    } else {
      if (user?.role?.selectedEntity) {
        data = [...data, ...user?.role?.selectedEntity?.resource];
      }
    }

    const sidebarFieldsKeys = Object.keys(sidebarResource);
    const sidebarFieldsValues = Object.values(sidebarResource);

    if (data) {
      const hasApproveAccountPermission = user.user.permissions.approveAccount;
      const accounts = [sidebarResource.customerAccount, sidebarResource.supplierAccount];

      data.forEach((d) => {
        const indexOfPermission = sidebarFieldsValues.indexOf(d.name);

        if (indexOfPermission > -1) {
          let permission = {
            isCreate: d.isCreate,
            isRead: d.isRead,
            isUpdate: d.isUpdate,
            isDelete: d.isDelete
          };

          if (accounts.some((acountType) => acountType === d.name)) {
            permission['approveAccount'] = hasApproveAccountPermission;
          }

          permissions[sidebarFieldsKeys[indexOfPermission]] = permission;

          routesAndTitle[sidebarFieldsKeys[indexOfPermission]] = {
            title: d.resourceLabel || d.name
          };
        } else {
          console.info(`Custom Error (helper.tsx > getPermissions()) => ${JSON.stringify(d)} resource not found`);
        }
      });
    }

    // sidebarFieldsKeys.forEach((d) => {
    //   if (!permissions.hasOwnProperty(d)) {
    //     permissions[d] = {
    //       isCreate: false,
    //       isRead: false,
    //       isUpdate: false,
    //       isDelete: false
    //     };
    //   }
    // });

    localStorage.setItem('routes', JSON.stringify(routesAndTitle));
    return permissions;
  }
};

export const downloadExcel = (fileDetails, fileName) => {
  const extension = `.${fileName.split('.').pop()}`;
  let type = null;

  switch (extension) {
    case '.xlsx':
      type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      break;

    default:
      break;
  }

  const blob = new Blob([fileDetails as any], { type: type });

  //Check the Browser type and download the File.
  const isIE = false || !!document['documentMode'];
  if (isIE) {
    //@ts-ignore
    window.navigator.msSaveBlob(blob, fileName);
  } else {
    var url = window.URL || window.webkitURL;
    let link = url.createObjectURL(blob);
    var a = document.createElement('a');
    a.setAttribute('download', fileName);
    a.setAttribute('href', link);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

export const simplifyValues = (obj, fields) => {
  const newObj = {};
  if (obj) {
    for (const fieldData of fields) {
      // if (fieldData.type === "multiSelect") {
      //     if (Array.isArray(obj[fieldData.fieldName])) {
      //         newObj[fieldData.fieldName] = obj[fieldData.fieldName].reduce
      //     }
      // } else if (
      if (fieldData.type === 'switch' || fieldData.type === 'checkBox') {
        newObj[fieldData.fieldName] = obj[fieldData.fieldName] ? 'Active' : 'Inactive';
      } else {
        newObj[fieldData.fieldName] = obj[fieldData.fieldName] ? obj[fieldData.fieldName] : '';
      }
    }
  }
  return newObj;
};

// export const review = {
//   reviewsApi: '/product/review'
// };

export const getUniqueCurrencies = () => {
  return uniqBy(currencies, 'currencyCode');
};

export const formatAmountWithCurrency = (currencyCode, amount, currencyShow = true) => {
  if ((!currencyCode && !amount) || !amount || isNaN(amount)) {
    return {
      shortFormatAmount: '',
      fullFormatAmount: '',
      fullFormatAmountWithCurrencyName: ''
    };
  }

  const filterCountries = currencies.filter((data) => data?.currencyCode === currencyCode);

  //  Make default language "en"
  let language = 'en';

  if (filterCountries.length === 0) {
    return {
      shortFormatAmount: new Intl.NumberFormat(language, {
        notation: 'compact',
        compactDisplay: 'short'
      })
        .format(amount)
        .replace(/^(\D+)/, '$1 '),
      fullFormatAmount: new Intl.NumberFormat(language, {
        notation: 'compact',
        compactDisplay: 'short'
      })
        .format(amount)
        .replace(/^(\D+)/, '$1 '),
      fullFormatAmountWithCurrencyName: new Intl.NumberFormat(language, {
        //  style: "currency",
        currencyDisplay: 'code'
      }).format(amount)
    };
  }

  let currencyData = filterCountries[0];

  if (filterCountries.length > 1) {
    switch (currencyCode) {
      case 'AUD':
        currencyData = filterCountries.find((f) => f.country === 'Australia') ?? filterCountries[0];
        break;

      case 'CHF':
        currencyData = filterCountries.find((f) => f.country === 'Switzerland') ?? filterCountries[0];
        break;

      case 'EUR':
        currencyData = filterCountries.find((f) => f.country === 'France') ?? filterCountries[0];
        break;

      case 'GBP':
        currencyData = filterCountries.find((f) => f.country === 'United Kingdom') ?? filterCountries[0];
        break;

      case 'NOK':
        currencyData = filterCountries.find((f) => f.country === 'Norway') ?? filterCountries[0];
        break;

      case 'NZD':
        currencyData = filterCountries.find((f) => f.country === 'New Zeland') ?? filterCountries[0];
        break;

      case 'XAF':
        currencyData = filterCountries.find((f) => f.country === 'Cameroon') ?? filterCountries[0];
        break;

      case 'XCD':
        currencyData = filterCountries.find((f) => f.country === 'Dominica') ?? filterCountries[0];
        break;

      case 'XOF':
        currencyData = filterCountries.find((f) => f.country === 'Benin') ?? filterCountries[0];
        break;

      case 'XPF':
        currencyData = filterCountries.find((f) => f.country === 'French Polynesia') ?? filterCountries[0];
        break;
    }

    if (currencyData.languages.length === 0) {
      currencyData.languages = [...new Set(filterCountries.map((m) => m.languages).flat())];
    }
  }

  // Check if that currency's country has multiple language,
  //  And if it has "en", then pick that one, or else take first of the array of languages
  if (currencyData.languages.length > 0 && currencyData.languages.some((d) => d !== language)) {
    language = currencyData.languages[0];
  }

  let options: any = {
    style: 'currency',
    currency: currencyCode
  };

  if (currencyShow === false) options.style = 'decimal';

  if (Number.isInteger(amount)) {
    options['maximumFractionDigits'] = 0;
  }

  //  For example I am formatting this value - 9876543210 then
  //  shortFormatAmount will be like this - 9.9 billion
  //  fullFormatAmount will be like this - 9,876,543,210

  return {
    shortFormatAmount: new Intl.NumberFormat(`${language}-${currencyData.countryCode}`, {
      notation: 'compact',
      compactDisplay: 'short',
      ...options
    })
      .format(amount)
      .replace(/^(\D+)/, '$1 '),
    fullFormatAmount: new Intl.NumberFormat(`${language}-${currencyData.countryCode}`, options).format(amount).replace(/^(\D+)/, '$1 '),
    fullFormatAmountWithCurrencyName: new Intl.NumberFormat(`${language}-${currencyData.countryCode}`, {
      currencyDisplay: 'code',
      ...options
    }).format(amount),
    amountWithouCurrencyCode: new Intl.NumberFormat(`${language}-${currencyData.countryCode}`).format(amount)
  };
};

/**
 *
 * @param date From when to convert amount
 * @param amount An amount to be converted
 * @param currencyFrom Currency to convert from
 * @param currencyTo Currency to convert to
 * @returns It returns a coverted amount in numbers
 */

export const getExchangeRates = (date: string, amount: number, currencyFrom: string, currencyTo: string) => {
  if (!currencyFrom || !currencyTo) return;

  if (currencyFrom === currencyTo) return;

  if (amount <= 0) return;

  return new Promise(async (resolve, reject) => {
    try {
      const host = 'api.frankfurter.app';
      const res = await fetch(`https://${host}/${date}?amount=${amount}&from=${currencyFrom}&to=${currencyTo}`);
      const data = await res.json();

      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};

export const b64toBlob = (dataURI: string) => {
  var byteString = atob(dataURI.split(',')[1]);
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);

  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: 'image/jpeg' });
};

export const determineLightOrDark = (color: any) => {
  let r: number, g: number, b: number, hsp: number;
  // Check the format of the color, HEX or RGB?
  if (color.match(/^rgb/)) {
    // If HEX --> store the red, green, blue values in separate variables
    color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

    r = color[1];
    g = color[2];
    b = color[3];
  } else {
    // If RGB then Convert it to HEX
    color = +('0x' + color.slice(1).replace(color.length < 5 && /./g, '$&$&'));

    r = color >> 16;
    g = (color >> 8) & 255;
    b = color & 255;
  }

  // HSP (Highly Sensitive Poo) equation
  hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

  // Using the HSP value, determine whether the color is light or dark
  if (hsp > 127.5) {
    return 'light';
  } else {
    return 'dark';
  }
};

/**
 * Convert Miliseconds to Hour
 */

export const msToHour = (ms: number) => {
  let hour = ms / (1000 * 60 * 60);
  return hour.toFixed(1);
};

//  Currencies Short Form Symbols
// const SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E", "Z", "Y"];

// export const formatAmountWithCurrency = (currencyCode, amount) => {

//   if (!currencyCode && !amount || (!amount || isNaN(amount))) {
//     return {
//       shortFormatAmount: "", fullFormatAmount: ""
//     }
//   }

//   // what tier? (determines SI symbol)
//   var tier = Math.log10(Math.abs(amount)) / 3 | 0;

//   // if zero, we don't need a suffix
//   // if (tier == 0) return {
//   //   shortFormatAmount: amount, fullFormatAmount: amount
//   // }

//   // get suffix and determine scale
//   var suffix = SI_SYMBOL[tier];
//   var scale = Math.pow(10, tier * 3);

//   // scale the number
//   var scaled = amount / scale;

//   // format number and add suffix, For eg - 1.2M, 3.2k etc
//   const formattedAmount = `${(amount % scale) !== 0 ? scaled.toFixed(1) : scaled}${suffix}`;

//   const filterCountries = currencies.filter(
//     (data) => data?.currencyCode === currencyCode
//   );

//   //  Make default language "en"
//   let language = "en";

//   let options = {
//     style: "currency",
//     currency: currencyCode,
//   };

//   if (Number.isInteger(amount)) {
//     options["maximumFractionDigits"] = 0;
//   }

//   if (filterCountries.length === 0) {
//     return {
//       shortFormatAmount: formattedAmount,
//       fullFormatAmount: new Intl.NumberFormat(
//         `${language}`,
//         options
//       ).format(amount)
//         .replace(/^(\D+)/, "$1 ")
//     };
//   }

//   let currencyData = filterCountries[0];
//   let combinedAllLanguages = filterCountries[0].languages;

//   if (filterCountries.length > 1) {
//     combinedAllLanguages = [...new Set(filterCountries.map(m => m.languages).flat())];

//     switch (currencyCode) {
//       case "AUD":
//         currencyData = filterCountries.find(f => f.country === "Australia");
//         break;

//       case "CHF":
//         currencyData = filterCountries.find(f => f.country === "Switzerland");
//         break;

//       case "EUR":
//         currencyData = filterCountries.find(f => f.country === "France");
//         break;

//       case "GBP":
//         currencyData = filterCountries.find(f => f.country === "United Kingdom");
//         break;

//       case "NOK":
//         currencyData = filterCountries.find(f => f.country === "Norway");
//         break;

//       case "NZD":
//         currencyData = filterCountries.find(f => f.country === "New Zeland");
//         break;

//       case "XAF":
//         currencyData = filterCountries.find(f => f.country === "Cameroon");
//         break;

//       case "XCD":
//         currencyData = filterCountries.find(f => f.country === "Dominica");
//         break;

//       case "XOF":
//         currencyData = filterCountries.find(f => f.country === "Benin");
//         break;

//       case "XPF":
//         currencyData = filterCountries.find(f => f.country === "French Polynesia");
//         break;
//     }

//     //  just for safe side, if no record found, change the value to initial state;
//     if (!currencyData) {
//       currencyData = filterCountries[0];
//     }

//     currencyData.languages = [...new Set(filterCountries.map(m => m.languages).flat())];
//   }

//   // Check if that currency's country has multiple language,
//   //  And if it has "en", then pick that one, or else take first of the array of languages
//   if (
//     currencyData.languages.length > 0 &&
//     currencyData.languages.some((d) => d !== language)
//   ) {
//     language = currencyData.languages[0];
//   }

//   if (!currencyData) {
//     return {
//       shortFormatAmount: formattedAmount,
//       fullFormatAmount: new Intl.NumberFormat(
//         `${language}`,
//         options
//       ).format(amount).replace(/^(\D+)/, "$1 ")
//     };
//   }

//   return {
//     shortFormatAmount: `${currencyData.symbolNative} ${formattedAmount}`,
//     fullFormatAmount: new Intl.NumberFormat(
//       `${language}-${currencyData.countryCode}`,
//       options
//     ).format(amount).replace(/^(\D+)/, "$1 ")

//     // `${currencyData.symbolNative} ${amount}`,
//   };
// }

export const graphOptions = {
  layout: {
    randomSeed: 2
  },
  interaction: {
    hover: true,
    navigationButtons: true,
    keyboard: true
  },
  nodes: {
    fixed: {
      x: false,
      y: false
    },
    shape: 'dot',
    // size: 13,
    borderWidth: 1.5,
    borderWidthSelected: 2,
    // font: {
    //   size: 15,
    //   align: "center",
    //   bold: {
    //     color: "#bbbdc0",
    //     size: 15,
    //     vadjust: 0,
    //     mod: "bold",
    //   },
    // },
    shadow: true
  },
  edges: {
    width: 0.01,
    // color: {
    //   color: "#D3D3D3",
    //   highlight: "#797979",
    //   hover: "#797979",
    //   opacity: 1.0,
    // },
    arrows: {
      to: { enabled: false, scaleFactor: 1, type: 'arrow' },
      // middle: { enabled: false, scaleFactor: 1, type: "arrow" },
      from: { enabled: true, scaleFactor: 1, type: 'arrow' }
    },
    smooth: {
      type: 'continuous',
      roundness: 0
    },
    shadow: true
  }
};

export const CustomDialogTransition = React.forwardRef(function Transition(
  props: TransitionProps & { children?: React.ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

//  Don't use this for details screen as the model being passed is different
export const setFieldsInAscendingOrder = (fieldsToOrder) => {
  const sections = [];
  const fieldsInAscendingOrder = orderBy(fieldsToOrder, ['order', 'asc']);

  fieldsInAscendingOrder.forEach((field) => {
    if (!sections.includes(field.sectionName)) {
      sections.push(field.sectionName);
    }
  });

  const customData = sections.map((name) => {
    let fields = fieldsInAscendingOrder.filter((field) => field.sectionName === name);

    const sectionFields = fields.map((formData) => formData);
    return { name, sectionFields };
  });

  return customData;
};

export const generateUniqueId = () => {
  return `id-${new Date().getTime()}`;
};

export const generateUniqueIdOnly = () => {
  return new Date().getTime();
};

export const prepareDataForGrid = (data, user = {}) => {
  let objectValues = {};
  let restProperties = {};

  Object.keys(data).forEach((key) => {
    if (typeof data[key] === 'object') {
      if (Array.isArray(data[key])) {
        if (data[key].length > 0 && data[key][0] && data[key][0].hasOwnProperty('optionLabel')) {
          const [first, ...rest] = data[key];

          restProperties[key] = first['optionLabel'];
          restProperties[`${key}Id`] = first['optionValue'];
          restProperties[`rest${key}`] = rest;
        } else if (typeof data[key][0] !== 'object') {
          restProperties[key] = data[key].join(' , ');
        } else {
          restProperties[key] = data[key];
        }
      } else {
        objectValues[key] = data[key];
      }
    } else {
      restProperties[key] = data[key];
    }
  });

  let finalObject = { ...restProperties };

  Object.keys(objectValues).forEach((d) => {
    if (objectValues[d] && objectValues[d].hasOwnProperty('optionLabel')) {
      finalObject[d] = objectValues[d]['optionLabel'];
      finalObject[`${d}Id`] = objectValues[d]['optionValue'];
    }
  });

  if (data?.collaborator) {
    finalObject['isAllowedToUpdate'] = [...(data?.collaborator ?? []), data?.owner ?? {}].some((obj) => obj.optionValue === user['user']?._id);
  }

  if (data?.createdBy) {
    finalObject['createdBy'] = data.createdBy?.user?.concatedName;
    finalObject['createdByDate'] = data.createdBy?.date;
    finalObject['createdById'] = data.createdBy?.user?._id;
    if (!finalObject['isAllowedToUpdate']) {
      finalObject['isAllowedToUpdate'] = data.createdBy?.user?._id === user['user']?._id;
    }
  }
  if (data?.updatedBy) {
    finalObject['updatedBy'] = data?.updatedBy?.user?.concatedName;
    finalObject['updatedByDate'] = data?.updatedBy?.date;
  }
  finalObject['id'] = data?._id;

  return finalObject;
};

export const getLocalStorageArrayData = (key) => {
  try {
    if (localStorage.getItem(key) && JSON.parse(localStorage.getItem(key)).length > 0) {
      return JSON.parse(localStorage.getItem(key));
    }
    return [];
  } catch (ex) {
    return [];
  }
};

export const removeLocalStorage = (key) => {
  try {
    localStorage.setItem(key, JSON.stringify([]));
  } catch (err) {
    return [];
  }
};

export const translateDataToTree = (data, parentProperty, childProperty, childrenPropertyToStore) => {
  let parents = data.filter((value) => value[parentProperty] == 'undefined' || value[parentProperty] == null);
  let childrens = data.filter((value) => value[parentProperty] !== 'undefined' && value[parentProperty] != null);

  let translator = (parents, childrens) => {
    parents.forEach((parent) => {
      childrens.forEach((current, index) => {
        if (current.parent === parent[childProperty]) {
          let temp = JSON.parse(JSON.stringify(childrens));
          temp.splice(index, 1);
          translator([current], temp);

          if (typeof parent[childrenPropertyToStore] !== 'undefined') {
            parent[childrenPropertyToStore].push(current);
          } else {
            parent[childrenPropertyToStore] = [current];
          }
        }
      });
    });
  };
  translator(parents, childrens);

  return parents;
};

export function treeToFlatArray(array, childrenProperty) {
  var result = [];
  array.forEach(function (a) {
    result.push(a);
    if (a.hasOwnProperty(childrenProperty) && Array.isArray(a[childrenProperty])) {
      result = result.concat(treeToFlatArray(a[childrenProperty], childrenProperty));
    }
  });

  return result;
}

export const arrayToDropwdownOption = (array) => {
  const option: any = [];
  array?.forEach((element, index) => {
    option.push({
      optionLabel: element,
      optionValue: element,
      order: index
    });
  });
  return option;
};

export const INVENTORY_STATUS = {
  new: 'New',
  available: 'Available',
  reserved: 'Reserved',
  inSale: 'In Sale',
  inUse: 'In-Use',
  indTransit: 'In-Transit',
  underReview: 'Under Review',
  repair: 'Repair',
  readyToShip: 'Ready to ship',
  scrap: 'Scrap',
  lost: 'Lost',
  customer: 'With Customer',
  supplier: 'With Supplier',
  returned: 'Returned',
  needRepair: 'Need Repair',
  needRecert: 'Need Recert',
  inRepair: 'In-Repair',
  notApplied: 'N/A'
};

export const INVENTORY_HISTORY_TYPE = {
  rental: 'Rental',
  repair: 'Repair',
  deliveryTicket: 'Delivery Ticket',
  loadingTicket: 'Loading Ticket',
  receivingTicket: 'Receiving Ticket',
  returnTicket: 'Return Ticket',
  purchaseOrder: 'Purchase Order',
  inventory: 'Inventory',
  serializedAssets: 'Serialized Assets',
  transferAssets: 'Transfer Assets',
  salesOrder: 'Sales Order',
  sublease: 'Sublease',
  bulkAssetCreation: 'Bulk Asset Creation',
  transferInventory: 'Transfer Inventory',
  inventoryToAsset: 'Inventory to Asset',
  quotation: 'Quotation',
  invoice: 'Invoice'
};

export const DELIVERY_TICKET_STATUS = {
  new: 'New',
  indTransit: 'In-Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export const RENTAL_STATUS = {
  new: 'New',
  cancelled: 'Cancelled',
  inProgress: 'In-Progress',
  jobPartiallyStarted: 'Job Partially Started',
  jobStarted: 'Job Started',
  jobPartiallyEnded: 'Job Partially Ended',
  jobEnded: 'Job Ended',
  readyToInvoice: 'Ready to Invoice',
  invoiced: 'Invoiced',
  closed: 'Closed'
};

export const RENTAL_INTERNAL_ASSET_STATUS = {
  reserved: 'Reserved',
  inUse: 'In-Use',
  complete: 'Complete',
  return: 'Return',
  consumed: 'Consumed'
} as const;

export const REPAIR_JOB_STATUS = {
  new: 'New',
  inProgress: 'In-Progress',
  completed: 'Completed'
};

export const DELIVERY_TICKET_MAPPED_STATUS = {
  'Sign-off - Dispatch': DELIVERY_TICKET_STATUS.indTransit,
  'Sign-off - Delivery': DELIVERY_TICKET_STATUS.delivered
};

export const DELIVERY_TICKET_TYPE = {
  loading: 'Loading',
  receiving: 'Receiving',
  return: 'Return',
  delivery: 'Delivery'
};

export const DELIVERY_TICKET_REFRENCE_TYPE = {
  rentalJob: 'Rental Job',
  transferAsset: 'Transfer Asset',
  repairJob: 'Repair Job',
  salesOrder: 'Sales Order',
  sublease: 'Sublease',
  transferInventory: 'Transfer Inventory',
  repairOrder: 'Repair Order'
};

export const DELIVERY_FROM_TO_TYPE = {
  plant: 'Plant',
  customer: 'Customer',
  supplier: 'Supplier'
};

export const SUBLEASE_STATUS = {
  new: 'New',
  inProgress: 'In-Progress',
  issued: 'Issued',
  completed: 'Completed'
};

export const PURCHASE_ORDER_STATUS = {
  //new: 'New',
  //inProgress: 'In-Progress',
  //issued: 'Issued',
  open: 'Open',
  partialReceived: 'Partial Received',
  received: 'Received',
  //readyToInvoice: 'Ready to Invoice',
  //invoiced: 'Invoiced',
  closed: 'Closed'
} as const;

export const INVENTORY_OWNER_TYPE = {
  brand: 'Brand',
  supplierAccount: 'Supplier Account',
  customerAccount: 'Customer Account'
} as const;

export const TRANSFER_INVENTORY_STATUS = {
  new: 'New',
  inProgress: 'In Progress',
  readyToShip: 'Ready to ship',
  inTransit: 'In-Transit',
  delivered: 'Delivered'
};

export const REPAIR_PROCESS_STATUS = {
  start: 'Start',
  complete: 'Complete',
  failed: 'Failed'
} as const;

export const asyncForEach = async (array: any[], callback: (arrayIndex: any, i: number, array: any[]) => Promise<any>) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

export const ACTIVITY_RESOURCE = {
  customerAccount: 'customerAccount',
  customerContact: 'customerContact',
  supplierAccount: 'supplierAccount',
  supplierContact: 'supplierContact',
  lead: 'lead',
  opportunity: 'opportunity',
  quote: 'quote',
  projectSales: 'projectSales',
  rentalManagement: 'rentalManagement',
  repairJob: 'repairJob',
  transferAsset: 'transferAsset',
  purchaseOrder: 'purchaseOrder',
  deliveryTicket: 'deliveryTicket',
  sublease: 'sublease',
  salesOrder: 'salesOrder',
  invoice: 'invoice',
  bulkAssetCreation: 'bulkAssetCreation',
  serializedAsset: 'serializedAsset',
  transferInventory: 'transferInventory',
  quotation: 'quotation',
  repairOrder: 'repairOrder',
  productionOrder: 'productionOrder',
  serviceOrder: 'serviceOrder',
  workOrder: 'workOrder',
  demandOrder: 'demandOrder',
};

export const REPORT_LIST = [
  { title: sidebarResource.rentalManagement, permission: 'rentalManagement', key: 'rentalManagement', type: 'dynamic' },
  { title: sidebarResource.salesOrder, permission: 'salesOrder', key: 'salesOrder', type: 'dynamic' },
  { title: sidebarResource.serializedAsset, permission: 'serializedAsset', key: 'serializedAsset', type: 'dynamic' },
  { title: sidebarResource.lead, permission: 'lead', key: 'lead', type: 'dynamic' },
  { title: sidebarResource.opportunity, permission: 'opportunity', key: 'opportunity', type: 'dynamic' },
  { title: sidebarResource.quoteBuilder, permission: 'quoteBuilder', key: 'quoteBuilder', type: 'dynamic' },
  { title: sidebarResource.projectSales, permission: 'projectSales', key: 'projectSales', type: 'dynamic' },
  { title: sidebarResource.purchaseOrder, permission: 'purchaseOrder', key: 'purchaseOrder', type: 'dynamic' },
  { title: 'Purchase Order Details', permission: 'purchaseOrder', key: 'purchaseOrderType', type: 'purchaseOrderDetails' },
  { title: 'Inventory Evaluation', permission: 'purchaseOrder', key: 'purchaseOrderType', type: 'inventoryEvaluation' },
  { title: 'Inventory History', permission: 'purchaseOrder', key: 'purchaseOrderType', type: 'inventoryHistory' },
  { title: 'Average Price By Supplier', permission: 'purchaseOrder', key: 'purchaseOrderType', type: 'averagePriceBySupplier' }
];

export const RESOURCE_CALENDAR = [
  { title: sidebarResource.rentalManagement, key: 'rentalManagement' },
  { title: sidebarResource.quoteBuilder, key: 'quoteBuilder' }
];

export const PDF_RESOURCE_LIST = [
  { title: sidebarResource.quoteBuilder, value: sidebarResource.quoteBuilder, key: 'quoteBuilder' },
  { title: sidebarResource.quotation, value: sidebarResource.quotation, key: 'quotation' },
  { title: sidebarResource.rentalManagement, value: sidebarResource.rentalManagement, key: 'rentalManagement' },
  { title: sidebarResource.repairJob, value: sidebarResource.repairJob, key: 'repairJob' },
  { title: sidebarResource.purchaseOrder, value: sidebarResource.purchaseOrder, key: 'purchaseOrder' },
  { title: sidebarResource.deliveryTicket, value: sidebarResource.deliveryTicket, key: 'deliveryTicket' },
  { title: sidebarResource.transferAsset, value: sidebarResource.transferAsset, key: 'transferAsset' },
  { title: sidebarResource.sublease, value: sidebarResource.sublease, key: 'sublease' },
  { title: sidebarResource.bulkAssetCreation, value: sidebarResource.bulkAssetCreation, key: 'bulkAssetCreation' },
  { title: sidebarResource.transferInventory, value: sidebarResource.transferInventory, key: 'transferInventory' },
  { title: sidebarResource.salesOrder, value: sidebarResource.salesOrder, key: 'salesOrder' },
  { title: sidebarResource.repairOrder, value: sidebarResource.repairOrder, key: 'repairOrder' },
  { title: sidebarResource.workOrder, value: sidebarResource.workOrder, key: 'workOrder' },
  { title: sidebarResource.invoice, value: sidebarResource.invoice, key: 'invoice' },
  { title: sidebarResource.demandOrder, value: sidebarResource.demandOrder, key: 'demandOrder' },
  { title: sidebarResource.productionOrder, value: sidebarResource.productionOrder, key: 'productionOrder' },
  { title: sidebarResource.serviceOrder, value: sidebarResource.serviceOrder, key: 'serviceOrder' }
];

export const getApi = (resource: string) => {
  switch (kebabCase(resource)) {
    case 'quote':
      return 'quote-builder';
    default:
      return kebabCase(resource);
  }
};

export const getData = (resource: string, data: any) => {
  switch (kebabCase(resource)) {
    case 'customer-account':
      return {
        name: `${data.accountName}`,
        id: data._id
      };
    case 'customer-contact':
      return {
        name: `${data?.salutation ? data?.salutation : ''} ${data?.firstName ? data?.firstName : ''} ${data?.middleName ? data?.middleName : ''} ${data?.lastName ? data?.lastName : ''
          }`,
        id: data._id
      };
    case 'supplier-account':
      return {
        name: `${data.accountName}`,
        id: data._id
      };
    case 'supplier-contact':
      return {
        name: `${data?.salutation ? data?.salutation : ''} ${data?.firstName ? data?.firstName : ''} ${data?.middleName ? data?.middleName : ''} ${data?.lastName ? data?.lastName : ''
          }`,
        id: data._id
      };
    case 'lead':
      return {
        name: `${data.concatedName}`,
        id: data._id
      };
    case 'opportunity':
      return {
        name: `${data.opportunityName}`,
        id: data._id
      };
    case 'quote':
      return {
        name: `${data.quoteName}`,
        id: data._id
      };
    case 'project-sales':
      return {
        name: `${data.projectName}`,
        id: data._id
      };
    case 'rental-management':
      return {
        name: `${data.rentalJobName}`,
        id: data._id
      };
    case 'repair-job':
      return {
        name: `${data.repairJobName}`,
        id: data._id
      };
    case 'transfer-asset':
      return {
        name: `${data.transferAssetNumber}`,
        id: data._id
      };
    case 'purchase-order':
      return {
        name: `${data.purchaseOrderNumber}`,
        id: data._id
      };
    case 'delivery-ticket':
      return {
        name: `${data.ticketName}`,
        id: data._id
      };
    case 'sublease':
      return {
        name: `${data.subleaseName}`,
        id: data._id
      };
    case 'sales-order':
      return {
        name: `${data.salesOrderNo}`,
        id: data._id
      };
    case 'invoice':
      return {
        name: `${data.invoiceNumber}`,
        id: data._id
      };
    case 'serialized-asset':
      return {
        name: `${data.assetNumber}`,
        id: data._id
      };
    case 'bulk-asset-creation':
      return {
        name: `${data.baNumber}`,
        id: data._id
      };
    case 'transfer-inventory':
      return {
        name: `${data.transferNumber}`,
        id: data._id
      };
    case 'quotation':
      return {
        name: `${data.quotationNumber}`,
        id: data._id
      };
    case 'demand-order':
      return {
        name: `${data?.demandOrderNumber}`,
        id: data._id
      };
    case 'production-order':
      return {
        name: `${data?.productionOrderNumber}`,
        id: data._id
      };
    case 'service-order':
      return {
        name: `${data?.serviceOrderNumber}`,
        id: data._id
      };
    case 'repair-order':
      return {
        name: `${data?.repairOrderNumber}`,
        id: data._id
      };
    case 'work-order':
      return {
        name: `${data?.workOrderNumber}`,
        id: data._id
      };
    default:
      break;
  }
};

export const COLOUR_MASTER = {
  rentalJob: {
    background: '#c3d5e6',
    borderColor: '#6c89a6'
  },
  cancelledRentalJob: {
    background: '#00FF00',
    borderColor: '#999999'
  },
  closedRentalJob: {
    background: '#4BB543',
    borderColor: '#999999'
  },
  repairJob: {
    background: '#c3d5e6',
    borderColor: '#6c89a6'
  },
  closedRepairJob: {
    background: '#4BB543',
    borderColor: '#999999'
  },
  package: {
    background: '#acdce6',
    borderColor: '#81afb8'
  },
  product: {
    background: '#97c9bf',
    borderColor: '#70948d'
  },
  assets: {
    background: '#ffd65b',
    borderColor: '#f5c431'
  },
  lostAssets: {
    background: '#ff9980',
    borderColor: '#db765c'
  },
  scrapAssets: {
    background: '#ff9980',
    borderColor: '#db765c'
  },
  purchaseOrder: {
    background: '#FFA500',
    borderColor: '#6c89a6'
  },
  sublease: {
    background: '#FFE4C0',
    borderColor: '#FFE4C0'
  },
  transferAsset: {
    background: '#ecc19c',
    borderColor: '#d98298'
  },
  bulkAsset: {
    background: '#FFA500',
    borderColor: '#6c89a6'
  },
  loadingTicket: {
    background: '#e6c6e6',
    borderColor: '#b38fb3'
  },
  deliveredLoadingTicket: {
    background: '#e6c6e6',
    borderColor: '#b38fb3'
  },
  receivingTicket: {
    background: '#cfdb7f',
    borderColor: '#aeb86e'
  },
  deliveredReceivingTicket: {
    background: '#cfdb7f',
    borderColor: '#aeb86e'
  },
  returnTicket: {
    background: '#ff9980',
    borderColor: '#db765c'
  },
  deliveredReturnTicket: {
    background: '#ff9980',
    borderColor: '#db765c'
  },
  replaceAssetColor: {
    background: '#FFFF99',
    borderColor: '#FFFF99'
  }
};

export const leadTimeStatusDropdown = ['Production', 'Supplier', 'Assemble', 'Freight', 'Customer'];

export const QUOTATION_STATUS = {
  buildingQuote: 'Building Quote',
  waitingForSupplierPrice: 'Waiting for Supplier Price',
  sentToCustomer: 'Sent to Customer',
  acceptByCustomer: 'Accepted by Customer',
  rejectByCustomer: 'Rejected by Customer'
};

export const WORKORDER_SERVICE_COLOR = {
  preWork: 'rgba(254, 249, 230, 1)',
  quote: 'rgba(169, 43, 3, .1)',
  postWork: 'rgba(222, 249, 255, 1)'
};

export const WORKORDER_SERVICE_STATUS = {
  pending: 'Pending',
  backlog: 'Backlog',
  inProgress: 'In-Progress',
  completed: 'Completed',
  failed: 'Failed'
};

export const WORKORDER_SERVICE_STEP_STATUS = {
  start: 'start',
  pause: 'pause',
  end: 'end',
  completed: 'Completed',
  passed: 'Passed',
  failed: 'Failed',
  skipped: 'Skipped',
  needReperform: 'Need Reperform'
};

export const REPAIR_ORDER_TYPE = {
  internal: 'Asset Repair',
  external: 'Customer Owned Asset Repair'
};

export const REPAIR_ORDER_STATUS = {
  new: 'New',
  inProgress: 'In-Progress',
  preWork: 'Pre-Work In-Progress',
  postWork: 'Post-Work In-Progress',
  buildingQuote: 'Building Quote',
  waitingQuote: 'Waiting On Quote',
  quoteAccepted: 'Quote Accepted',
  quoteRejected: 'Quote Rejected',
  readyToInvoice: 'Ready to Invoice',
  invoiced: 'Invoiced',
  completed: 'Completed'
};

export const PRODUCTION_ORDER_STATUS = {
  new: 'New',
  inProgress: 'In-Progress',
  preWork: 'Pre-Work In-Progress',
  postWork: 'Post-Work In-Progress',
  buildingQuote: 'Building Quote',
  waitingQuote: 'Waiting On Quote',
  quoteAccepted: 'Quote Accepted',
  quoteRejected: 'Quote Rejected',
  readyToInvoice: 'Ready to Invoice',
  invoiced: 'Invoiced',
  completed: 'Completed'
};

export const WORK_ORDER_STATUS = {
  new: 'New',
  preWork: 'Pre-Work In-Progress',
  // buildingQuote: 'Building Quote',
  // waitingQuote: 'Waiting On Quote',
  // quoteAccepted: 'Quote Accepted',
  // quoteRejected: 'Quote Rejected',
  postWork: 'Post-Work In-Progress',
  completed: 'Completed'
};

export const convertMsToTime = (milliseconds: any) => {
  function padTo2Digits(num) {
    num = num - Math.floor(num) !== 0 ? num.toFixed(1) : num;
    return num.toString().padStart(2, '0');
  }

  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;

  let time = '';

  if (hours === 0) {
    time = `00:${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;
  }
  if (hours === 0 && minutes === 0) {
    time = `00:${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;
  }
  if (hours > 0 && hours < 24) {
    time = `${padTo2Digits(hours)}:${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;
  }
  if (hours >= 24) {
    time = `${padTo2Digits(hours / 24)}d`;
  }
  return time;
};

export const ECOM_SECTIONS = [
  {
    type: 'imageSlider',
    label: 'Image Slider'
  },
  {
    type: 'image',
    label: 'Image'
  },
  {
    type: 'menu',
    label: 'Menu'
  },
  {
    type: 'productCategory',
    label: 'Product Category'
  },
  {
    type: 'productList',
    label: 'Product List'
  }
];
