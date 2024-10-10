import { Grow, Zoom } from '@material-ui/core';
import { TransitionProps } from '@material-ui/core/transitions';
import clsx, { ClassValue } from 'clsx';
import { camelCase, isArray, isEmpty, isString, lowerFirst, orderBy, uniqBy } from 'lodash';
import mimeDb from 'mime-db';
import moment from 'moment';
import React from 'react';
import { FileIcon, fileIcons } from 'src/assets/fileIcons';
import axiosInstance from 'src/axios/axiosInstance';
import { LOGIC, OPERATOR } from 'src/components/FormBuilder/helper';
import { stepIconInterface } from 'src/components/Steps/icons';
import { twMerge } from 'tailwind-merge';
import { v4 as uuid } from 'uuid';
import { array, boolean, number, object, string } from 'yup';
import currencies from './currency_with_country.json';
import { GoogleMapProps } from '@react-google-maps/api';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';

interface stepInterface extends stepIconInterface {
  name: string;
  title: string;
  date?: Date;
}

export const staticHiddenResource = ['Dashboard', 'Report'];

export const defaultActivityShow = false;

export const vapidKey = 'BFFucJ4GMNzUKVU5HaI5BsGDi0Au6MqKIr7SlzDbY6s_2JX6y3Qu5E8dMXhLpmZLwDpheOyDBxtbOmxuFH8WZe4';

export const validations = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
};

export const documentUploadSupportExtensions =
  '.odp,.ods,.odt,.docx,.doc,.csv,.pot,.pps,.ppt,.pptx,.pdf,.xls,.xlsx,.ico,.tif,.tiff,.jpe,.png,.jpg,.jpeg,.gif,.txt,.jflsn';

//  1048576 = 1 MB
export const imageUploadMaxSize = { size: 1048576 * 10, text: '10 MB' };
export const documentUploadMaxSize = { size: 1048576 * 50, text: '50 MB' };
export const termsAndConditionDocumentUploadMaxSize = {
  size: 1048576 * 10,
  text: '10 MB'
};

export const rentalManagementSteps: stepInterface[] = [
  { name: 'Add Products', title: 'Add', icon: 'add' },
  { name: 'Add Services', title: 'Services', icon: 'add' },
  { name: 'Quotation', title: 'Quotation', icon: 'quote' },
  { name: 'Serialized Asset', title: 'Assign', icon: 'serializedAssets' },
  { name: 'Loading Ticket', title: 'Loading', icon: 'ticket' },
  { name: 'On Field', title: 'On Field', icon: 'onField' },
  { name: 'Receiving Ticket', title: 'Receiving', icon: 'ticket' },
  { name: 'Final Slip', title: 'Slip', icon: 'invoice' }
];

export const RENTAL_STEPS = {
  loading: 'Loading',
  onField: 'On Field',
  receiving: 'Receiving'
};

export const fieldTicketSteps: stepInterface[] = [
  { name: 'Add', title: 'Add', icon: 'add' },
  { name: 'Submit', title: 'Submit', icon: 'end' }
];

export const fieldServiceOrderSteps: stepInterface[] = [
  { name: 'Add', title: 'Add', icon: 'add' },
  { name: 'Manual Entry', title: 'Manual Entry', icon: 'add' },
  { name: 'Submit', title: 'Submit', icon: 'end' }
];

export const demandOrderSteps = ['Add Products'];

export const productionOrderSteps: stepInterface[] = [
  { name: 'Add', title: 'Add', icon: 'add' },
  { name: 'Work Order', title: 'Work Order', icon: 'workOrder' },
  { name: 'Loading Ticket', title: 'Loading', icon: 'ticket' },
  { name: 'Final Slip', title: 'Slip', icon: 'invoice' }
];

export const jobProcessSteps: stepInterface[] = [
  { name: 'Add', title: 'Add', icon: 'add' },
  { name: 'Dispatch', title: 'Dispatch', icon: 'dispatch' }
];

export const salesOrderProcessSteps: stepInterface[] = [
  { name: 'Add Products', title: 'Add', icon: 'add' },
  { name: 'Process', title: 'Process', icon: 'process' },
  { name: 'Loading', title: 'Loading', icon: 'ticket' },
  { name: 'Invoice', title: 'Invoice', icon: 'invoice' }
];

export const bulkAssetCreationSteps: stepInterface[] = [
  { name: 'Add Products', title: 'Add', icon: 'add' },
  { name: 'Serialized Asset', title: 'Asset', icon: 'serializedAssets' }
];

export const sublease_Vendor_Steps: stepInterface[] = [
  { name: 'Add Products', title: 'Add', icon: 'add' },
  // { name: 'Start Sublease', title: 'Sublease', icon: 'startSublease' },
  { name: 'Receiving', title: 'Receiving', icon: 'receiveProduct' },
  { name: 'End Sublease', title: 'End', icon: 'end' }
];
export const sublease_InterCompany_Steps: stepInterface[] = [
  { name: 'Add Products', title: 'Add', icon: 'add' },
  { name: 'Serialized Asset', title: 'Asset', icon: 'serializedAssets' },
  { name: 'Loading Ticket', title: 'Loading', icon: 'ticket' },
  { name: 'Receiving Ticket', title: 'Receiving', icon: 'receivingTicket' },
  { name: 'Final Slip', title: 'Slip', icon: 'invoice' }
];

export const quotationProcessSteps: stepInterface[] = [
  { name: 'Add Products', title: 'Add', icon: 'add' },
  { name: 'Quote Builder', title: 'Builder', icon: 'quote' },
  { name: 'DOA', title: 'DOA', icon: 'doa' },
  { name: 'Quote Approval', title: 'Approval', icon: 'approval' },
  { name: 'End', title: 'End', icon: 'end' }
];

export const purchaseRequisitionSteps: stepInterface[] = [
  { name: 'Add', title: 'Add', icon: 'add' },
  { name: 'DOA', title: 'DOA', icon: 'doa' },
  { name: 'End', title: 'End', icon: 'end' }
];

export const invoiceProcessSteps: stepInterface[] = [
  { name: 'Add Products', title: 'Add', icon: 'add' },
  { name: 'Ready To Invoice', title: 'Invoice', icon: 'invoice' }
];

export const repairJobProcessSteps: stepInterface[] = [
  { name: 'Serialized Assets', title: 'Assets', icon: 'serializedAssets' },
  { name: 'Repair Process', title: 'Repair', icon: 'repairOrder' }
];

export const transferAssetSteps: stepInterface[] = [
  { name: 'Add Assets', title: 'Add', icon: 'add' },
  { name: 'Loading Ticket', title: 'Loading', icon: 'ticket' },
  { name: 'Receiving Ticket', title: 'Receiving', icon: 'ticket' }
];

export const transferInventorySteps: stepInterface[] = [
  { name: 'Add Products', title: 'Add', icon: 'add' },
  { name: 'Loading Ticket', title: 'Loading', icon: 'ticket' }
];

export const purchaseOrderSteps: stepInterface[] = [
  { name: 'Add Products', title: 'Add', icon: 'add' },
  { name: 'Receive Products', title: 'Receive', icon: 'receiveProduct' } // need icon
];

export const repairOrderSteps: stepInterface[] = [
  { name: 'Add Assets', title: 'Add', icon: 'add' },
  { name: 'Work Order', title: 'Work Order', icon: 'workOrder' },
  { name: 'Quotation', title: 'Quotation', icon: 'quote' },
  { name: 'Execute', title: 'Execute', icon: 'postWork' },
  { name: 'Loading Ticket', title: 'Loading', icon: 'dispatch' },
  { name: 'Slip', title: 'Slip', icon: 'invoice' }
];

export const assetsReceivingSteps: stepInterface[] = [
  { name: 'Add Assets', title: 'Add', icon: 'add' },
  { name: 'Receiving Ticket', title: 'Receiving', icon: 'receivingTicket' },
  { name: 'Complete', title: 'Complete', icon: 'end' }
];

export const serviceOrderSteps: stepInterface[] = [
  { name: 'Field Ticket', title: 'Field Tickets', icon: 'receivingTicket' },
  // { name: 'Add Services', title: 'Add', icon: 'add' },
  // { name: 'Add Products', title: 'Products', icon: 'assign' },
  // { name: 'Assign Technician', title: 'Technician', icon: 'assign' },
  // { name: 'Technician Dispatch', title: 'Dispatch', icon: 'dispatch' },
  // { name: 'Invoice', title: 'Invoice', icon: 'invoice' },
  { name: 'Field Ticket Invoice', title: 'Invoices', icon: 'invoice' }
];

export const subcontractAssemblySteps: stepInterface[] = [
  { name: 'Add', title: 'Add', icon: 'add' },
  { name: 'Loading', title: 'Loading', icon: 'ticket' },
  { name: 'Receiving', title: 'Receiving', icon: 'ticket' }
];

export const assemblyOrderSteps: stepInterface[] = [
  { name: 'Add', title: 'Add', icon: 'add' },
  { name: 'Work Order', title: 'Work Order', icon: 'workOrder' },
  { name: 'Loading', title: 'Loading', icon: 'ticket' },
  { name: 'Final Slip', title: 'Slip', icon: 'invoice' }
];

//export const WORKORDER_TECHNICIAN_SERVICE_STATUS = ['Backlog', 'Pending', 'In-Progress', 'Completed', 'In-Progress By Other'];
export const WORKORDER_TECHNICIAN_SERVICE_STATUS = ['Pending', 'In-Progress', 'Completed', 'In-Progress By Other'];

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

export const gridPageSizes = [25, 50, 100, 250, 500];
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
  termsAndConditions: 'Terms And Conditions',
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
  subleaseInvoice: 'Sublease Invoice',
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
  repairOrder: 'Repair Order',
  productionOrder: 'Production Order',
  fieldServiceOrder: 'Field Service Order',
  workOrder: 'Work Order',
  workOrderSupervisor: 'Work Order Supervisor',
  workOrderTechnician: 'Work Order Technician',
  frequentlyAskedQuestion: 'Frequently Asked Question',
  blog: 'Blog',
  demandOrder: 'Demand Order',
  surveys: 'Surveys',
  supportTicket: 'Support Ticket',
  eCommerceHome: 'e-Commerce Home',
  contactUs: 'Contact Us',
  employeeMaster: 'Employee Master',
  competencyType: 'Competency Type',
  technicianScheduler: 'Technician Scheduler',
  irtTicket: 'IRT Ticket',
  purchaseRequisition: 'Purchase Requisition',
  planning: 'Planning',
  planningCalendar: 'Planning Calendar',
  fieldTicket: 'Field Ticket',
  fieldTicketInvoice: 'Field Ticket Invoice',
  fieldServiceTechnician: `Field Service Technician`,
  rentalPlanningCalendar: `Rental Planning Calendar`,
  resourceLogs: `Resource Logs`,
  userDownloadRequest: 'User Download Request',
  truckMaster: `Truck Master`,
  job: 'Job',
  fleetDispatch: 'Fleet Dispatch',
  fleetReceiver: 'Fleet Receiver',
  storageLocation: 'Storage Location',
  transactionLock: 'Transaction Lock',
  wellNumber: 'Well Number',
  planningView: 'Planning View',
  taxMaster: 'Tax Master',
  competencies: 'Competencies',
  padMaster: 'Pad Master',
  driverMaster: 'Driver Master',
  trailerMaster: 'Trailer Master',
  iotDataPoints: 'Iot Data Points',
  iotDataPointsCategory: 'Iot Data Points Category',
  deviceTemplates: 'Device Templates',
  workStations: 'Work Stations',
  deviceTemplateAlert: 'Device Template Alert',
  chartOfAccount: 'Chart Of Account',
  rentalManagementInvoice: 'Rental Management Invoice',
  creditMemo: 'Credit Memo',
  outboundMessage: 'Outbound Message',
  payrollPolicy: 'Payroll Policy',
  triggerNotificationMaster: 'Trigger Notification Master',
  deals: 'Deals',
  triggerNotificationHistory: 'Trigger Notification History',
  userAttendance: 'User Attendance',
  dataLists: 'Data Lists',
  assetsReceiving: 'Assets Receiving',
  serializedAssetStatusChangeRequest: 'Serialized Asset Status Change Request',
  units: 'Units',
  resourceDoaRequest: 'Resource Doa Request',
  workOrderPlanning: 'Work Order Planning',
  subcontractAssembly: 'Subcontract Assembly',
  managedPackages: 'Managed Packages',
  trainAiModel: 'Train Ai Model',
  assemblyOrder: 'Assembly Order'
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
  userDownloadRequest: 'User Download Request',
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
  serializedAssetsCertification: 'Serialized Assets Certification',
  priceTemplate: 'Price Templates',
  product: 'Product Master',
  productTemplate: 'Product Templates',
  doa: 'DOA',
  termsAndConditions: 'Terms And Conditions',
  equiptmentRentalMaster: 'Equiptment Rental Master',
  projectSales: 'Project Sales',
  productBuilder: 'Price Builder',
  formBuilder: 'Form Builder',
  forms: 'Forms',
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
  rentalManagementInvoice: 'Rental Management Invoice',
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
  subleaseInvoice: 'Sublease Invoice',
  transferInventory: 'Transfer Inventory',
  zone: 'Zone',
  wellMaster: 'Well Master',
  bulkAssetCreation: 'Bulk Asset Creation',
  pos: 'eRECS',
  repairType: 'Repair Types',
  report: 'Report',
  scheduleReport: 'Schedule Report',
  resourceCalendar: 'Resource Calendar',
  scheduleCalendar: 'Schedule Calendar',
  cageManagement: 'Cage Management',
  productAuction: 'Product Auction',
  inventoryToAsset: 'Inventory to Asset',
  importExport: 'Import-Export',
  inventoryCycle: 'Inventory Cycle',
  cycleCountDetermination: 'Cycle Count Determination',
  cycleCountPhysicalInventory: 'Cycle Count Physical Inventory',
  quotation: 'Quotation',
  serviceMaster: 'Service Master',
  repairOrder: 'Repair Order',
  productionOrder: 'Production Order',
  fieldServiceOrder: 'Field Service Order',
  workOrder: 'Work Order',
  workOrderSupervisor: 'Work Order Supervisor',
  workOrderTechnician: 'Work Order Technician',
  frequentlyAskedQuestion: 'Frequently Asked Question',
  blog: 'Blog',
  eCommerceHome: 'e-Commerce Home',
  surveys: 'Surveys',
  contactUs: 'Contact Us',
  supportTicket: 'Support Ticket',
  demandOrder: 'Demand Order',
  employeeMaster: 'Employee Master',
  competencyType: 'Competency Type',
  technicianScheduler: 'Technician Scheduler',
  irtTicket: 'IRT Ticket',
  purchaseRequisition: 'Purchase Requisition',
  planning: 'Planning',
  fieldTicket: 'Field Ticket',
  fieldTicketInvoice: 'Field Ticket Invoice',
  fieldServiceTechnician: `Field Service Technician`,
  fleetDispatch: `Fleet Dispatch`,
  resourceLogs: `Resource Logs`,
  truckMaster: `Truck Master`,
  job: 'Job',
  fleetReceiver: 'Fleet Receiver',
  storageLocation: 'Storage Location',
  transactionLock: 'Transaction Lock',
  wellNumber: 'Well Number',
  taxMaster: 'Tax Master',
  competencies: 'Competencies',
  materialHandling: 'Material Handling',
  padMaster: 'Pad Master',
  driverMaster: 'Driver Master',
  trailerMaster: 'Trailer Master',
  iotDataPoints: 'IoT Data Points',
  iotChart: 'IoT Chart',
  sendOutboundMessage: 'Send Outbound Message',
  deviceTemplates: 'Device Templates',
  workStations: 'Work Stations',
  deviceTemplateAlert: 'Device Template Alert',
  chartOfAccount: 'Chart Of Account',
  creditMemo: 'Credit Memo',
  generateInvoice: 'Generate Invoice',
  repairOrderInvoice: 'Repair Order Invoice',
  payrollPolicy: 'Payroll Policy',
  triggerNotificationMaster: 'Trigger Notification Master',
  triggerNotificationHistory: 'Trigger Notification History',
  userAttendance: 'User Attendance',
  dataList: 'Data List',
  dataListitems: 'Data List Items',
  serializedAssetStatusChangeRequest: 'Serialized Asset Status Change Request',
  managedPackages: 'Managed Packages',
  integration: 'Integration',
  equiptAi: 'Equipt Ai',
  trainAiModel: 'Train Ai Model',
  workSpace: 'Work Space',
  workflow: 'Workflow',
  workflowReport: 'Workflow Report',
  assemblyOrder: 'Assembly Order'
};

export const CHILD_RESOURCE = {
  rentalManagementProduct: 'Rental Management Product',
  rentalManagementCost: 'Rental Management Cost',
  purchaseOrderProduct: 'Purchase Order Product',
  purchaseOrderCost: 'Purchase Order Cost',
  purchaseOrderService: 'Purchase Order Service',
  bulkAssetCreationProduct: 'Bulk Asset Creation Product',
  repairJobAsset: 'Repair Job Asset',
  invoiceProduct: 'Invoice Product',
  salesOrderProduct: 'Sales Order Product',
  salesOrderProcess: 'Sales Order Process',
  salesOrderCost: 'Sales Order Cost',
  subleaseProduct: 'Sublease Product',
  quotationProduct: 'Quotation Product',
  quotationCost: 'Quotation Cost',
  quotationService: 'Quotation Service',
  repairOrderProduct: 'Repair Order Product',
  planningMaterial: 'Planning Material',
  purchaseRequisitionDetail: 'Purchase Requisition Detail',
  purchaseRequisitionCost: 'Purchase Requisition Cost',
  fieldServiceOrderDetails: 'Field Service Order Detail',
  fieldServiceOrderAddon: 'Field Service Order Addon',
  fieldTicketCost: 'Field Ticket Cost',
  fieldTicketSubmit: 'Field Ticket Submit',
  fieldTicketMateial: 'Field Ticket Material',
  jobDetail: 'Job Detail',
  workOrderService: 'Work Order Service',
  demandOrderDetail: 'Demand Order Detail',
  productionOrderDetail: 'Production Order Detail',
  invoiceCost: 'Invoice Cost',
  serializedAssetsCertification: 'Serialized Assets Certificate',
  invoiceCreditMemo: 'Invoice Credit Memo',
  workOrderProduct: 'Work Order Product',
  workOrderCost: 'Work Order Cost',
  payrollHoliday: 'Payroll Holiday',
  payrollPayTypes: 'Payroll Pay Types',
  payrollPaidTimeOff: 'Payroll Paid Time Off',
  dealsMaterial: 'Deals Material',
  rentalManagementTechnician: 'Rental Management Technician',
  subcontractAssemblyMaterial: 'Subcontract Assembly Material',
  subcontractAssemblyCost: 'Subcontract Assembly Cost',
  assemblyOrderMaterial: 'Assembly Order Material'
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
  resource: 'Rental Management'
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

export const fieldServiceOrder = {
  resource: 'fieldServiceOrder',
  api: '/field-service-order'
};

export const fieldTicket = {
  resource: 'Field Ticket',
  api: '/field-ticket'
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

export const serializedAssetsCertification = {
  api: '/serialized-assets-certification',
  route: '/serialized-assets-certification',
  permission: 'serializedAssetsCertification',
  resource: 'Serialized Assets Certification'
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

export const productCategory = {
  api: '/product-category',
  route: '/product-category',
  permission: 'productCategory',
  resource: 'Product Categories'
};

export const budget = {
  api: '/budget',
  route: '/budget',
  permission: 'budget',
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

export const trainAiModel = {
  api: '/train-ai-model',
  route: '/train-ai-model',
  permission: 'trainAiModel',
  resource: 'trainAiModel'
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

export const storageLocation = {
  api: '/storage-location',
  route: '/storage-location',
  permission: 'Storage Location',
  resource: 'Storage Location'
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

export const workOrder = {
  resource: 'Work Order',
  api: '/work-order'
};

export const profileMenuItems = {
  profile: 1,
  notification: 2,
  setting: 3,
  users: 4,
  securityPrivacy: 5,
  uiPreference: 6
};

export const SCHEDULE_FREQUENCY = ['Hourly', 'Daily', 'Weekly', 'Monthly'];
export const FREQUENCY_WEEKS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const getObjKeys = (val: string | boolean = '', fields: any[]) => {
  let user = JSON.parse(localStorage.getItem('userData'));

  const obj = {};
  for (const key of fields) {
    let value = key.isDefaultValue ? (key.defaultValue === 'Current User' && user?.user?._id ? user?.user?._id : key.defaultValue) : val;

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
      if (value && isArray(value) && value?.length && key.fieldName === 'collaborator' && obj['owner']) {
        value = value?.filter((e) => obj['owner'] !== e);
      }
      const options = defaultOptions?.map((data: any) => data.optionValue);
      obj[key.fieldName] = value ? (typeof value === 'string' ? [value] : value) : options;
    } else if (key.type === 'freeStyleMultiSelect') {
      const defaultOptions = key.option?.filter((item: any) => item.default === true);
      const options = defaultOptions?.map((data: any) => data.optionValue);
      obj[key.fieldName] = value ? value : options;
    } else if (key.type === 'date') {
      obj[key.fieldName] = value ? value : new Date();
    } else if (key.type === 'dateTime') {
      obj[key.fieldName] = new Date();
    } else if (key.type === 'year') {
      obj[key.fieldName] = value ? value : new Date();
    } else if (key.type === 'colorPicker') {
      obj[key.fieldName] = value ? value : '#aaaaaa';
    } else if (key.type === 'switch' || key.type === 'checkBox') {
      obj[key.fieldName] = value ? Boolean(value) : false;
    } else if (key.type !== 'currencyAmount' && (key.type === 'converter' || key.isConverter === true)) {
      key.displayUnits &&
        key.displayUnits.forEach((_unit) => {
          obj[key.fieldName + '_' + _unit.toLowerCase()] = value && value !== '' ? parseFloat(value) : 0;
        });
    } else if (key.type === 'currencyAmount') {
      key.displayCurrency &&
        key.displayCurrency.forEach((_currency) => {
          if (key.isConverter && key.displayUnits.length) {
            key.displayUnits &&
              key.displayUnits.forEach((_unit) => {
                obj[key.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()] = value && value !== '' ? parseFloat(value) : 0;
              });
          } else {
            obj[key.fieldName + '_' + _currency.toLowerCase()] = value && value !== '' ? parseFloat(value) : 0;
          }
        });
    } else if (key.type === 'decimal') {
      obj[key.fieldName] = value && value !== '' ? parseFloat(value) : 0;
    } else if (key.type === 'lookUpDisplay') {
    } else if (key.type === 'counter' || key.type === 'multiFileUpload' || key.type === 'multiImageUpload') {
      obj[key.fieldName] = [];
    } else if (key.type === 'description') {
    } else if (key.type === 'groupSignature') {
      if (isArray(value) && value?.length) {
        obj[key.fieldName] = value?.map((e) => {
          return { signature: '', user: e };
        });
      } else {
        obj[key.fieldName] = [];
      }
    } else if (key.type === 'signature') {
      obj[key.fieldName] = '';
    } else if (key.type === 'gpsLocation') {
      obj[key.fieldName] = {};
    } else {
      obj[key.fieldName] = value;
    }
  }

  fields?.forEach((ele) => {
    if (ele?.isDefaultValue && fields?.find((e) => e?.inputFields?.includes(ele?.fieldName))) {
      const calValues = autoCalculateSpecificFields({ [ele?.fieldName]: obj[ele?.fieldName] }, obj, fields);
      Object.assign(obj, calValues);
    }
  });

  return obj;
};

export const getObjKeysWithValues = (dataObj: object, arr: any[], isClone: boolean = false, user: any = null) => {
  const obj = {};

  const filterValues = (data: object | any) => (typeof data === 'string' ? data : typeof data === 'object' ? data?.optionValue : '');
  for (const key of arr) {
    if (key.type === 'switch' || key.type === 'checkBox') {
      obj[key.fieldName] = dataObj[key.fieldName] ? dataObj[key.fieldName] : false;
    } else if ((key.type === 'multiSelect' || key.type === 'dropDown') && key?.dataList) {
      if (key.type === 'multiSelect') {
        const values =
          dataObj[key.fieldName] && dataObj[key.fieldName].length
            ? typeof dataObj[key.fieldName] === 'string'
              ? [dataObj[key.fieldName]]
              : dataObj[key.fieldName].map((val: any) => filterValues(val))
            : [];

        obj[key.fieldName] = values;

        obj[`${key.fieldName}_dataList`] = dataObj[key.fieldName] ? dataObj[key.fieldName] : [];
      } else {
        const value =
          dataObj[key.fieldName] && Array.isArray(dataObj[key.fieldName]) && dataObj[key.fieldName]?.length
            ? dataObj[key.fieldName][0]
            : filterValues(dataObj[key.fieldName]);

        obj[key.fieldName] = value ? value : '';

        obj[`${key.fieldName}_dataList`] = dataObj[key.fieldName] ? dataObj[key.fieldName] : '';
      }
    } else if (key.type === 'multiSelect') {
      let values =
        dataObj[key.fieldName] && dataObj[key.fieldName].length
          ? typeof dataObj[key.fieldName] === 'string'
            ? [dataObj[key.fieldName]]
            : dataObj[key.fieldName].map((val: any) => filterValues(val))
          : [];
      if (isClone && key.fieldName === 'collaborator') {
        values = values?.filter((e) => e !== user?.user?._id);
      }
      obj[key.fieldName] = values;
    } else if (key.type === 'dropDown') {
      const value =
        dataObj[key.fieldName] && Array.isArray(dataObj[key.fieldName]) && dataObj[key.fieldName]?.length
          ? dataObj[key.fieldName][0]
          : filterValues(dataObj[key.fieldName]);
      if (isClone && key.fieldName === 'owner') {
        obj[key.fieldName] = user?.user?._id;
      } else {
        obj[key.fieldName] = value ? value : '';
      }
    } else if (key.type === 'converter' || key.type === 'currencyAmount' || key.isConverter === true) {
      if (key.type !== 'currencyAmount' && (key.type === 'converter' || key.isConverter === true)) {
        key.displayUnits &&
          key.displayUnits.forEach((_unit) => {
            let fieldName = key.fieldName + '_' + _unit.toLowerCase();
            if (key.fieldName.includes('_')) {
              fieldName = key.fieldName;
            }
            obj[fieldName] = dataObj[fieldName] ? dataObj[fieldName] : 0;
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
      obj[key.fieldName] = dataObj[key.fieldName] || dataObj[key.fieldName] === 0 ? dataObj[key.fieldName] : 0;
    } else if (key.type === 'dateTime') {
      if (isClone) {
        obj[key.fieldName] = new Date();
      } else if (dataObj[key.fieldName]) {
        obj[key.fieldName] = dataObj[key.fieldName];
      }
    } else if (key.type === 'date') {
      if (isClone) {
        obj[key.fieldName] = new Date();
      } else if (dataObj[key.fieldName]) {
        obj[key.fieldName] = dataObj[key.fieldName];
      }
    } else if (key.type === 'lookUpDisplay') {
    } else if (key.type === 'description') {
    } else if (key.type === 'gpsLocation') {
      const values = dataObj[key.fieldName]
        ? isString(dataObj[key.fieldName])
          ? { locationName: dataObj[key.fieldName] }
          : dataObj[key.fieldName]
        : {};
      obj[key.fieldName] = values;
    } else {
      obj[key.fieldName] = dataObj[key.fieldName] ? dataObj[key.fieldName] : '';
    }
  }
  return obj;
};

export const removeEmptyKeys = (obj: object) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== '' || null || undefined));
};

/**
 * @param {Array} fields
 * @param {boolean} validEmail
 */

export const checkValue = (fields, fieldName, value1, value2) => {
  const input = fields?.find((f) => f?.fieldName === fieldName);
  if (input) {
    if (input?.type === 'checkBox' || input?.type === 'switch') {
      if (value2?.toUpperCase() === 'YES') {
        return value1;
      } else {
        return !value1;
      }
    } else if (input?.type === 'dropDown') {
      if (value2?.split(',')?.includes(value1)) {
        return true;
      } else {
        return false;
      }
    } else if (input?.type === 'multiSelect' || input?.type === 'freeStyleMultiSelect') {
      if (value2?.split(',').some((v) => (value1 || [])?.includes(v))) {
        return true;
      } else {
        return false;
      }
    } else if (input?.type === 'year') {
      return moment(new Date(value1)).year() == value2;
    } else if (input?.type === 'date') {
      return moment(value1).format('DD/MM/YYYY') == value2;
    } else if (input?.type === 'dateTime') {
      return moment(new Date(value1))?.isSame(moment(value2, 'DD/MM/YYYY HH:mm'));
    } else if (input?.type === 'number' || input?.type === 'percent' || input?.type === 'decimal' || input?.type === 'formula') {
      if (+value2 === +value1) {
        return true;
      } else {
        return false;
      }
    } else if (input?.type === 'currency') {
      if (value2?.split(',').includes(value1)) {
        return true;
      } else {
        return false;
      }
    } else {
      if (value2 === value1) {
        return true;
      } else {
        return false;
      }
    }
  } else {
    return false;
  }
};

const urlRegex = /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/;
const nameRegex = /^([^0-9]*)$/;

const validateDateWithOperator = (date1, date2, operator, type) => {
  if (!date2) {
    return true;
  }
  let newDate1 = moment(date1);
  let newDate2 = moment(date2);
  if (type === 'date') {
    newDate1 = moment(moment(date1).format('YYYY-MM-DD'), 'YYYY-MM-DD');
    newDate2 = moment(moment(date2).format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  if (operator === 'lessThan') {
    return newDate1.isBefore(newDate2);
  } else if (operator === 'lessThanOrEquals') {
    return newDate1.isBefore(newDate2) || newDate1.isSame(newDate2);
  } else if (operator === 'greaterThan') {
    return newDate1.isAfter(newDate2);
  } else if (operator === 'greaterThanOrEquals') {
    return newDate1.isAfter(newDate2) || newDate1.isSame(newDate2);
  }
  return false;
};

export const yupSchema = (fields: any[], validEmail = true) => {
  const schema = {};
  fields.forEach((input) => {
    let message = `${input.fieldLabel} is required`;

    let dateValidation = string().nullable();
    if (['date', 'dateTime']?.includes(input?.type)) {
      if (input?.required) {
        dateValidation = string().required(message).nullable();
      }

      if (input?.dateValidation && input?.dateValidation?.length > 0) {
        input?.dateValidation?.forEach((d) => {
          dateValidation = dateValidation.test(
            `${d?.fieldName}_${d?.operator}`,
            `${input?.fieldLabel} should be ${OPERATOR?.find((o) => o?.optionValue === d?.operator)?.optionLabel} from ${fields?.find((f) => f?.fieldName === d?.fieldName)?.fieldLabel}`,
            function (value) {
              const date = this?.parent[d?.fieldName];
              return validateDateWithOperator(value, date, d?.operator, input?.type);
            }
          );
        });
      }
    }

    const sectionProperties = fields?.find((f) => f?.sectionName === input?.sectionName && f?.sectionProperties)?.sectionProperties;
    let sectionVisibility = [];
    if (sectionProperties && sectionProperties?.visibilityCondition && sectionProperties?.visibilityCondition?.length) {
      sectionVisibility = sectionProperties?.visibilityCondition;
    }

    const validationFields: any = [];
    let validation: any = null;
    if (input?.visibilityCondition?.length || sectionVisibility?.length) {
      sectionVisibility?.forEach((condition) => {
        condition?.fields?.forEach((field) => {
          if (field?.fieldName && field?.value) {
            validationFields.push({ ...field, index: condition?.index, logic: condition?.logic, type: 'section' });
          }
        });
      });
      input?.visibilityCondition?.forEach((condition) => {
        condition?.fields?.forEach((field) => {
          if (field?.fieldName && field?.value) {
            validationFields.push({ ...field, index: condition?.index, logic: condition?.logic, type: 'field' });
          }
        });
      });

      validation = (...args) => {
        let validate = false;
        for (let i = 0; i < validationFields?.length;) {
          const field = validationFields[i];
          const condition =
            field?.type === 'section'
              ? sectionVisibility?.find((c) => c?.index === field?.index && c?.logic === field?.logic)
              : input?.visibilityCondition?.find((c) => c?.index === field?.index && c?.logic === field?.logic);
          if (condition?.logic === LOGIC.AND) {
            if (condition?.fields?.every((f, j) => checkValue(fields, f?.fieldName, args[i + j], f?.value))) {
              validate = true;
            } else {
              validate = false;
            }
          } else if (condition?.logic === LOGIC.OR) {
            if (condition?.fields?.some((f, j) => checkValue(fields, f?.fieldName, args[i + j], f?.value))) {
              validate = true;
            } else {
              validate = false;
            }
          }
          if (!validate) {
            break;
          }
          i = i + condition?.fields?.length;
        }
        return validate;
      };
    }

    if (input.type === 'singleLine') {
      schema[input.fieldName] = input.required
        ? validationFields?.length && validation
          ? string().when(
            validationFields?.map((f) => f?.fieldName),
            {
              is: validation,
              then: string().required(message),
              otherwise: string()
            }
          )
          : string().required(message)
        : string();
    } else if (input.type === 'name') {
      schema[input.fieldName] = input.required
        ? validationFields?.length && validation
          ? string().when(
            validationFields?.map((f) => f?.fieldName),
            {
              is: validation,
              then: string().matches(nameRegex, "Numbers aren't allowed").required(message),
              otherwise: string().matches(nameRegex, "Numbers aren't allowed")
            }
          )
          : string().matches(nameRegex, "Numbers aren't allowed").required(message)
        : string().matches(nameRegex, "Numbers aren't allowed");
    } else if (input.type === 'url') {
      schema[input.fieldName] = input.required
        ? validationFields?.length && validation
          ? string().when(
            validationFields?.map((f) => f?.fieldName),
            {
              is: validation,
              then: string().matches(urlRegex, 'Enter valid URL').required(message),
              otherwise: string().matches(urlRegex, 'Enter valid URL')
            }
          )
          : string().matches(urlRegex, 'Enter valid URL').required(message)
        : string().matches(urlRegex, 'Enter valid URL');
    } else if (input.type === 'mobileNumber') {
      schema[input.fieldName] = input.required
        ? validationFields?.length && validation
          ? string().when(
            validationFields?.map((f) => f?.fieldName),
            {
              is: validation,
              then: string().min(10, 'Mobile number is too short').required(message),
              otherwise: string().min(10, 'Mobile number is too short')
            }
          )
          : string().min(10, 'Mobile number is too short').required(message)
        : string().min(10, 'Mobile number is too short');
    } else if (input.type === 'multiSelect' || input?.type === 'freeStyleMultiSelect') {
      schema[input.fieldName] = input.required
        ? validationFields?.length && validation
          ? array().when(
            validationFields?.map((f) => f?.fieldName),
            {
              is: validation,
              then: array().min(1, message),
              otherwise: array()
            }
          )
          : array().min(1, message)
        : array();
    } else if (input.type === 'percent' || input.type === 'number' || input.type === 'decimal' || input.type === 'formula') {
      schema[input.fieldName] = input.required
        ? validationFields?.length && validation
          ? number().when(
            validationFields?.map((f) => f?.fieldName),
            {
              is: validation,
              then: number().required(message).moreThan(0, `${input.fieldLabel} must be greater than 0`).nullable(),
              otherwise: number().nullable()
            }
          )
          : number().required(message).moreThan(0, `${input.fieldLabel} must be greater than 0`).nullable()
        : number().nullable();
    } else if (input.type === 'email') {
      schema[input.fieldName] =
        input.required && validEmail
          ? validationFields?.length && validation
            ? string().when(
              validationFields?.map((f) => f?.fieldName),
              {
                is: validation,
                then: string().email().required(message),
                otherwise: string().email(`${input.fieldLabel} must be a valid email`)
              }
            )
            : string().email().required(message)
          : string().email(`${input.fieldLabel} must be a valid email`);
    } else if (input.type === 'switch' || input.type === 'checkBox') {
      schema[input.fieldName] = input.required
        ? validationFields?.length && validation
          ? boolean().when(
            validationFields?.map((f) => f?.fieldName),
            {
              is: validation,
              then: boolean().required(message),
              otherwise: boolean()
            }
          )
          : boolean().required(message)
        : boolean();
    } else if (input.type !== 'currencyAmount' && (input.type === 'converter' || input.isConverter === true)) {
      input.displayUnits &&
        input.displayUnits.forEach((_unit) => {
          schema[input.fieldName + '_' + _unit.toLowerCase()] = input.required
            ? number().required(`${input.fieldLabel} is required`).moreThan(0, `${input.fieldLabel} must be greater than 0`).nullable()
            : number().nullable();
        });
    } else if (input.type === 'currencyAmount') {
      input.displayCurrency &&
        input.displayCurrency.forEach((_currency) => {
          if (input.isConverter && input.displayUnits.length) {
            input.displayUnits.forEach((_unit) => {
              schema[input.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()] = input.required
                ? number().required(`${input.fieldLabel} is required`).moreThan(0, `${input.fieldLabel} must be greater than 0`).nullable()
                : number().nullable();
            });
          } else {
            schema[input.fieldName + '_' + _currency.toLowerCase()] = input.required
              ? number().required(`${input.fieldLabel} is required`).moreThan(0, `${input.fieldLabel} must be greater than 0`).nullable()
              : number().nullable();
          }
        });
    } else if (input.type === 'date' || input?.type === 'dateTime') {
      schema[input.fieldName] = input.required
        ? validationFields?.length && validation
          ? string().when(
            validationFields?.map((f) => f?.fieldName),
            {
              is: validation,
              then: dateValidation,
              otherwise: dateValidation
            }
          )
          : dateValidation
        : dateValidation;
    } else if (input.type === 'colorPicker') {
      schema[input.fieldName] = input.required ? string().required(`${input.fieldLabel} is required`).nullable() : string().nullable();
    } else if (input.type === 'multiImageUpload') {
      schema[input.fieldName] = input.required ? array().min(1, `${input.fieldLabel} is required`) : array().nullable();
    } else if (input.type === 'multiFileUpload') {
      schema[input.fieldName] = input.required ? array().min(1, `${input.fieldLabel} is required`) : array().nullable();
    } else if (input.type === 'counter') {
      schema[input.fieldName] = input.required ? array().min(1, `${input.fieldLabel} is required`) : array();
    } else if (input.type === 'signature') {
      schema[input.fieldName] = input.required ? string().required(`${input.fieldLabel} is required`) : string();
    } else if (input.type === 'groupSignature') {
      schema[input.fieldName] = input.required ? array().min(1, `${input.fieldLabel} is required`) : array();
    } else if (input.type === 'gpsLocation') {
      schema[input.fieldName] = input.required ? object().required(`${input.fieldLabel} is required`) : object();
    } else {
      schema[input.fieldName] = input.required
        ? validationFields?.length && validation
          ? string().when(
            validationFields?.map((f) => f?.fieldName),
            {
              is: validation,
              then: string().required(message),
              otherwise: string()
            }
          )
          : string().required(message)
        : string();
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
  if (!currencyCode) {
    return '';
  }
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
export const dateTimeFormat24Hours = `${dateFormat} HH:mm:ss`;

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

export const convertDateInDateTime = (date) => {
  if (!date) {
    return date;
  }
  var newDate = new Date(date);
  var currentDate = new Date();
  newDate.setHours(currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
  return newDate;
};

export const materialTableIcons: any = {
  // Add: forwardRef((props: any, ref: any) => <AddBox {...props} ref={ref} />),
  // Check: forwardRef((props: any, ref: any) => <Check {...props} ref={ref} />),
  // Clear: forwardRef((props: any, ref: any) => <Clear {...props} ref={ref} />),
  // Delete: forwardRef((props: any, ref: any) => <DeleteOutline {...props} ref={ref} />),
  // DetailPanel: forwardRef((props: any, ref: any) => <ChevronRight {...props} ref={ref} />),
  // Edit: forwardRef((props: any, ref: any) => <Edit {...props} ref={ref} />),
  // Export: forwardRef((props: any, ref: any) => <SaveAlt {...props} ref={ref} />),
  // Filter: forwardRef((props: any, ref: any) => <FilterList {...props} ref={ref} />),
  // FirstPage: forwardRef((props: any, ref: any) => <FirstPage {...props} ref={ref} />),
  // LastPage: forwardRef((props: any, ref: any) => <LastPage {...props} ref={ref} />),
  // NextPage: forwardRef((props: any, ref: any) => <ChevronRight {...props} ref={ref} />),
  // PreviousPage: forwardRef((props: any, ref: any) => <ChevronLeft {...props} ref={ref} />),
  // ResetSearch: forwardRef((props: any, ref: any) => <Clear {...props} ref={ref} />),
  // Search: forwardRef((props: any, ref: any) => <Search {...props} ref={ref} />),
  // SortArrow: forwardRef((props: any, ref: any) => <ArrowDownward {...props} ref={ref} />),
  // ThirdStateCheck: forwardRef((props: any, ref: any) => <Remove {...props} ref={ref} />),
  // ViewColumn: forwardRef((props: any, ref: any) => <ViewColumn {...props} ref={ref} />)
};

export const convertDateTimToDate = (date) => {
  if (!date) {
    return date;
  }
  var newDate = moment(date);
  newDate.set({ hour: 0, minute: 0, second: 0 });
  return newDate;
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

export const getPermissions = (user, selectedEntity = undefined): IPermission | null => {
  if (user) {
    try {
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
        const hasApproveAccountPermission = user?.role?.selectedEntity?.policy?.isApproveAccount ?? false;
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
            let permission = {
              isCreate: d.isCreate,
              isRead: d.isRead,
              isUpdate: d.isUpdate,
              isDelete: d.isDelete
            };
            if (accounts.some((acountType) => acountType === d.name)) {
              permission['approveAccount'] = hasApproveAccountPermission;
            }
            const k = lowerFirst(d.name.replace(/ /g, ''));
            permissions[k] = permission;
            routesAndTitle[k] = {
              title: d.resourceLabel || d.name
            };
          }
        });
      }

      localStorage.setItem('routes', JSON.stringify(routesAndTitle));
      return permissions;
    } catch (e) {
      console.log(e);
    }
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

export const getUniqueCurrencies = () => {
  return uniqBy(currencies, 'currencyCode');
};

export const formatAmountWithCurrency = (currencyCode, amount) => {
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
    fullFormatAmountWithoutSpace: new Intl.NumberFormat(`${language}-${currencyData.countryCode}`, options).format(amount).replace(/^(\D+)/, '$1'),
    fullFormatAmountWithCurrencyName: new Intl.NumberFormat(`${language}-${currencyData.countryCode}`, {
      currencyDisplay: 'code',
      ...options
    }).format(amount),
    amountWithouCurrencyCode: new Intl.NumberFormat(`${language}-${currencyData.countryCode}`, { maximumFractionDigits: 4 }).format(amount)
  };
};

export const formatTotalforTableFooter = (num: number): number => {
  if (Number.isInteger(num)) {
    return num;
  } else {
    return parseFloat(num.toFixed(2));
  }
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
    font: {
      size: 15,
      align: 'center',
      color: '#163340'
    },
    shadow: true
  },
  edges: {
    width: 0.01,
    color: '#fff',
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
  return <Grow ref={ref} {...props} />;
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
    } else if (objectValues[d] && objectValues[d].hasOwnProperty('locationName')) {
      finalObject[d] = objectValues[d];
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
  if (data?.completedBy) {
    finalObject['completedBy'] = data?.completedBy?.user?.concatedName;
    finalObject['completedByDate'] = data?.completedBy?.date;
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

export const ASSET_STATUS = {
  new: 'New',
  available: 'Available',
  reserved: 'Reserved',
  inSale: 'In Sale',
  inUse: 'In-Use',
  standBy: 'Stand By',
  standByNotChargeable: 'Stand By-Not Chargeable',
  delivered: 'Delivered',
  inTransit: 'In-Transit',
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
  customerPossession: 'Customer Possession',
  onPO: 'On PO',
  notApplied: 'N/A',
  scrapRequested: 'Scrap Requested'
};

export const ASSET_NUMBER_TYPE = {
  auto: 'Auto',
  manual: 'Manual',
  existing: 'Existing'
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
  inTransit: 'In-Transit',
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

export const PURCHASE_REQUISITION_STATUS = {
  new: 'New',
  converted: 'Converted'
};

export const DEMAND_ORDER_STATUS = {
  new: 'New',
  converted: 'Converted'
};

export const RENTAL_INTERNAL_ASSET_STATUS = {
  reserved: 'Reserved',
  inUse: 'In-Use',
  complete: 'Complete',
  return: 'Return',
  consumed: 'Consumed',
  partiallyConsumed: 'Partially Consumed',
  standBy: 'Stand By',
  standByNotChargeable: 'Stand By-Not Chargeable',
  delivered: 'Delivered'
} as const;

export const REPAIR_JOB_STATUS = {
  new: 'New',
  inProgress: 'In-Progress',
  completed: 'Completed'
};

export const DELIVERY_TICKET_MAPPED_STATUS = {
  'Sign-off - Dispatch': DELIVERY_TICKET_STATUS.inTransit,
  'Sign-off - Delivery': DELIVERY_TICKET_STATUS.delivered
};

export const DELIVERY_TICKET_TYPE = {
  loading: 'Loading',
  receiving: 'Receiving',
  return: 'Return',
  delivery: 'Delivery'
};

export const DELIVERY_TICKET_REFERENCE_TYPE = {
  rentalJob: 'Rental Job',
  transferAsset: 'Transfer Asset',
  repairJob: 'Repair Job',
  salesOrder: 'Sales Order',
  sublease: 'Sublease',
  transferInventory: 'Transfer Inventory',
  repairOrder: 'Repair Order',
  productionOrder: 'Production Order',
  subcontractAssembly: 'Subcontract Assembly'
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
  readyToInvoice: 'Ready to Invoice',
  invoiced: 'Invoiced',
  closed: 'Closed'
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

export const TRANSFER_ASSET_STATUS = {
  new: 'New',
  inProgress: 'In Progress',
  completed: 'Completed'
};

export const REPAIR_PROCESS_STATUS = {
  start: 'Start',
  complete: 'Complete',
  failed: 'Failed'
} as const;

export const PLANNING_STATUS = {
  open: 'Open',
  converted: 'Converted'
} as const;

export const SUPPORT_TICKET_STATUS = {
  pending: 'Pending',
  inProgress: 'In-Progress',
  approvalPending: 'Approval Pending',
  completed: 'Completed'
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
  fieldServiceOrder: 'fieldServiceOrder',
  workOrder: 'workOrder',
  demandOrder: 'demandOrder',
  fieldTicket: 'fieldTicket',
  truckMaster: 'truckMaster',
  job: 'Job',
  purchaseRequisition: 'purchaseRequisition',
  planning: 'planning',
  productCategory: 'productCategory',
  product: 'product',
  warehouse: 'warehouse',
  packages: 'packages',
  pricingCondition: 'pricingCondition',
  wellMaster: 'wellMaster',
  productAuction: 'productAuction',
  serviceMaster: 'serviceMaster',
  employeeMaster: 'employeeMaster',
  competencyType: 'competencyType',
  user: 'user',
  marketSegment: 'marketSegment',
  budget: 'budget',
  irtTicket: 'irtTicket',
  subcontractAssembly: 'subcontractAssembly',
  assemblyOrder: 'assemblyOrder'
};

export const LOG_RESOURCE = {
  serializedAsset: sidebarResource.serializedAsset,
  serviceMaster: sidebarResource.serviceMaster,
  truckMaster: sidebarResource.truckMaster,
  job: sidebarResource.job,
  quotation: sidebarResource.quotation,
  lead: sidebarResource.lead,
  opportunity: sidebarResource.opportunity,
  projectSales: sidebarResource.projectSales,
  invoice: sidebarResource.invoice,
  zone: sidebarResource.zone,
  eCommercePolicy: sidebarResource.eCommercePolicy,
  productAuction: sidebarResource.productAuction,
  irtTicket: sidebarResource.irtTicket,
  purchaseOrder: sidebarResource.purchaseOrder,
  rentalManagement: sidebarResource.rentalManagement,
  sublease: sidebarResource.sublease,
  transferAsset: sidebarResource.transferAsset,
  planning: sidebarResource.planning,
  fieldTicket: sidebarResource.fieldTicket,
  repairOrder: sidebarResource.repairOrder,
  workOrder: sidebarResource.workOrder,
  repairJob: sidebarResource.repairJob,
  repairType: sidebarResource.repairType,
  employeeMaster: sidebarResource.employeeMaster,
  fieldServiceOrder: sidebarResource.fieldServiceOrder,
  product: sidebarResource.product,
  demandOrder: sidebarResource.demandOrder,
  address: sidebarResource.address,
  customerAccount: sidebarResource.customerAccount,
  customerContact: sidebarResource.customerContact,
  entity: sidebarResource.entity,
  packages: sidebarResource.packages,
  pricingCondition: sidebarResource.pricingCondition,
  productCategory: sidebarResource.productCategory,
  supplierAccount: sidebarResource.supplierAccount,
  supplierContact: sidebarResource.supplierContact,
  warehouse: sidebarResource.warehouse,
  budget: sidebarResource.budget,
  marketSegment: sidebarResource.marketSegment,
  user: sidebarResource.user,
  wellMaster: sidebarResource.wellMaster,
  inventoryCycle: sidebarResource.inventoryCycle,
  competencyType: sidebarResource.competencyType,
  bulkAssetCreation: sidebarResource.bulkAssetCreation,
  salesOrder: sidebarResource.salesOrder,
  transferInventory: sidebarResource.transferInventory
};

export const INTERVALS = [
  {
    optionValue: 'perCycle',
    optionLabel: 'Per Cycle'
  },
  {
    optionValue: '1second',
    optionLabel: '1 Second'
  },
  {
    optionValue: '5seconds',
    optionLabel: '5 Seconds'
  },
  {
    optionValue: '10seconds',
    optionLabel: '10 Seconds'
  },
  {
    optionValue: '30seconds',
    optionLabel: '30 Seconds'
  },
  {
    optionValue: '1minute',
    optionLabel: '1 Minute'
  },
  {
    optionValue: '5minutes',
    optionLabel: '5 Minutes'
  },
  {
    optionValue: '15minutes',
    optionLabel: '15 Minutes'
  },
  {
    optionValue: '1hour',
    optionLabel: '1 Hour'
  },
  {
    optionValue: '6hours',
    optionLabel: '6 Hours'
  },
  {
    optionValue: '1day',
    optionLabel: '1 Day'
  }
];

export const IOT_REPORT_LIST = [
  {
    title: sidebarResource.iotDataPoints,
    key: 'iotDataPoints',
    api: '/report/iot-data-points',
    filters: [
      {
        fieldName: 'asset',
        fieldLabel: 'Serialized Asset',
        resource: sidebarResource.serializedAsset,
        lookup: true,
        type: 'dropDown',
        multiple: false,
        required: true,
        _id: '3'
      },
      {
        fieldName: 'date',
        fieldLabel: 'Date',
        type: 'date',
        required: true,
        _id: '2'
      },
      {
        fieldName: 'interval',
        fieldLabel: 'Interval',
        type: 'dropDown',
        options: INTERVALS,
        required: true,
        _id: '4'
      },
      {
        fieldName: 'dataPointsCategory',
        fieldLabel: 'Iot Data Points Category',
        resource: sidebarResource.iotDataPointsCategory,
        lookup: true,
        type: 'dropDown',
        multiple: true,
        required: true,
        _id: '5'
      },
      {
        fieldName: 'dataPoints',
        fieldLabel: 'Iot Data Points',
        resource: sidebarResource.iotDataPoints,
        lookup: true,
        type: 'dropDown',
        multiple: true,
        _id: '1'
      }
    ]
  }
];

export const REPORT_LIST = [
  {
    title: sidebarResource.rentalManagement,
    permission: 'rentalManagement',
    key: 'rentalManagement',
    type: 'dynamic'
  },
  {
    title: sidebarResource.quotation,
    permission: 'quotation',
    key: 'quotation',
    type: 'dynamic'
  },
  {
    title: sidebarResource.salesOrder,
    permission: 'salesOrder',
    key: 'salesOrder',
    type: 'dynamic'
  },
  {
    title: sidebarResource.serializedAsset,
    permission: 'serializedAsset',
    key: 'serializedAsset',
    type: 'dynamic'
  },
  {
    title: sidebarResource.transferAsset,
    permission: 'transferAsset',
    key: 'transferAsset',
    type: 'dynamic'
  },
  {
    title: sidebarResource.lead,
    permission: 'lead',
    key: 'lead',
    type: 'dynamic'
  },
  {
    title: sidebarResource.opportunity,
    permission: 'opportunity',
    key: 'opportunity',
    type: 'dynamic'
  },
  {
    title: sidebarResource.quoteBuilder,
    permission: 'quoteBuilder',
    key: 'quoteBuilder',
    type: 'dynamic'
  },
  {
    title: sidebarResource.projectSales,
    permission: 'projectSales',
    key: 'projectSales',
    type: 'dynamic'
  },
  {
    title: sidebarResource.workOrder,
    permission: 'workOrder',
    key: 'workOrder',
    type: 'dynamic'
  },
  {
    title: sidebarResource.purchaseOrder,
    permission: 'purchaseOrder',
    key: 'purchaseOrder',
    type: 'dynamic'
  },
  {
    title: sidebarResource.productionOrder,
    permission: 'productionOrder',
    key: 'productionOrder',
    type: 'dynamic'
  },
  {
    title: sidebarResource.invoice,
    permission: 'invoice',
    key: 'invoice',
    type: 'dynamic'
  },
  {
    title: 'Invoice Details',
    permission: 'invoice',
    key: 'standardReport',
    type: 'invoiceDetails'
  },
  {
    title: 'Invoice Backlog',
    permission: 'invoice',
    key: 'standardReport',
    type: 'invoiceBacklog'
  },
  {
    title: 'Syteline Invoice Integration',
    permission: 'invoice',
    key: 'standardReport',
    type: 'sytelineInvoiceIntegration'
  },
  {
    title: 'Revenue By Customer',
    permission: 'invoice',
    key: 'standardReport',
    type: 'revenueByCustomer'
  },
  {
    title: 'Lost Assets',
    permission: 'serializedAsset',
    key: 'standardReport',
    type: 'lostAssets'
  },
  {
    title: 'Purchase Order Details',
    permission: 'purchaseOrder',
    key: 'standardReport',
    type: 'purchaseOrderDetails'
  },
  {
    title: 'Purchase Order Actual Received Details',
    permission: 'purchaseOrder',
    key: 'standardReport',
    type: 'purchaseOrderActualReceivedDetails'
  },
  {
    title: 'Inventory Evaluation',
    permission: 'productInventory',
    key: 'standardReport',
    type: 'inventoryEvaluation'
  },
  {
    title: 'Inventory History',
    permission: 'productInventory',
    key: 'standardReport',
    type: 'inventoryHistory'
  },
  {
    title: 'Average Price By Supplier',
    permission: 'purchaseOrder',
    key: 'standardReport',
    type: 'averagePriceBySupplier'
  },
  {
    title: 'Number Of Assets by Status',
    permission: 'serializedAsset',
    key: 'standardReport',
    type: 'numberOfAssetsByStatus'
  },
  {
    title: 'Asset Utilization',
    permission: 'serializedAsset',
    key: 'standardReport',
    type: 'assetUtilization'
  },
  {
    title: 'Asset Statistics',
    permission: 'serializedAsset',
    key: 'standardReport',
    type: 'serializedAssetStatistics'
  },
  {
    title: 'Work Order Service',
    permission: 'workOrder',
    key: 'standardReport',
    type: 'workOrderService'
  },
  {
    title: 'Work Order Technician Work Hours',
    permission: 'workOrder',
    key: 'standardReport',
    type: 'workOrderTechnicianWorkHours'
  },
  {
    title: 'User Session',
    permission: 'user',
    key: 'standardReport',
    type: 'userSession'
  },
  {
    title: 'In Used Serialized Asset',
    permission: 'serializedAsset',
    key: 'standardReport',
    type: 'inUsedSerializedAsset'
  },
  {
    title: 'Fleet Report',
    permission: 'deals',
    key: 'standardReport',
    type: 'fleetReport'
  },
  {
    title: 'Daily Volume Report',
    permission: 'iotChart',
    key: 'standardReport',
    type: 'dailyVolumeReport',
    defaultColumn: true,
    isExportPdf: true,
    isSendMail: true
  },
  {
    title: 'Volume Report',
    permission: 'iotChart',
    key: 'standardReport',
    type: 'volumeReport',
    defaultColumn: true,
    notMultiSelectFields: ['frequency'],
    isExportPdf: true,
    isSendMail: true
  },
  {
    title: 'Unit Downtime Report',
    permission: 'iotChart',
    key: 'standardReport',
    type: 'iotUnitDowntimeReport'
  },
  {
    title: `Pad Job Volume Report`,
    permission: 'iotChart',
    key: 'standardReport',
    type: 'rentalVolumeReport',
    defaultColumn: true,
    isExportPdf: true,
    isSendMail: true
  },
  {
    title: 'IOT Data Points',
    permission: 'iotChart',
    key: 'standardReport',
    type: 'iotDataPoints',
    defaultColumn: true,
    notMultiSelectFields: ['asset', 'interval']
  },
  {
    title: 'Sales Funnel Report',
    permission: 'lead',
    key: 'standardReport',
    type: 'salesFunnel'
  }
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
  { title: sidebarResource.fieldServiceOrder, value: sidebarResource.fieldServiceOrder, key: 'fieldServiceOrder' },
  { title: sidebarResource.fieldTicket, value: sidebarResource.fieldTicket, key: 'fieldTicket' },
  { title: sidebarResource.job, value: sidebarResource.job, key: 'job' },
  { title: sidebarResource.purchaseRequisition, value: sidebarResource.purchaseRequisition, key: 'purchaseRequisition' },
  { title: sidebarResource.planning, value: sidebarResource.planning, key: 'planning' },
  { title: sidebarResource.subcontractAssembly, value: sidebarResource.subcontractAssembly, key: 'subcontractAssembly' }
];

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
    background: 'var(--error-bg)',
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
    background: 'var(--transferAsset-bg)',
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
    background: 'var(--replaceAsset-bg)',
    borderColor: 'var(--replaceAsset-bg)'
  }
};

export const leadTimeStatusDropdown = ['Production', 'Supplier', 'Assemble', 'Freight', 'Customer'];

export const QUOTATION_STATUS = {
  new: 'New',
  buildingQuote: 'Building Quote',
  waitingForSupplierPrice: 'Waiting for Supplier Price',
  sentToCustomer: 'Sent to Customer',
  acceptByCustomer: 'Accepted by Customer',
  rejectByCustomer: 'Rejected by Customer',
  converted: 'Converted',
  sentforDOA: 'Sent for DOA',
  acceptedbyDOA: 'Accepted by DOA',
  rejectedbyDOA: 'Rejected by DOA'
};

export const QUOTATION_TYPE = {
  salesOrder: 'Sales Order',
  rentalJob: 'Rental Job',
  repairOrder: 'Repair Order',
  fieldJob: 'Field Job',
  assemblyOrder: 'Assembly Order'
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
  failed: 'Failed',
  skipped: 'Skipped',
  inProgressByOther: 'In-Progress By Other'
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

export const PRODUCT_SERIAL_NUMBER_STATUS = {
  available: 'Available',
  unAvailable: 'Unavailable'
};

type ChipStatus =
  | 'Pending'
  | 'Backlog'
  | 'In-Progress'
  | 'Completed'
  | 'Failed'
  | 'Skipped'
  | 'start'
  | 'pause'
  | 'end'
  | 'Completed'
  | 'Passed'
  | 'Failed'
  | 'Skipped'
  | 'Need Reperform';

export const getChipColor = (status: ChipStatus): React.CSSProperties => {
  let color = 'var(--chip-color-inProgress)';
  let borderColor = 'var(--chip-border-inProgress)';
  let background = 'var(--chip-background-inProgress)';

  switch (true) {
    case status === 'Completed' || status === 'Passed' || status === 'end':
      color = 'var(--chip-color-completed)';
      borderColor = 'var(--chip-border-completed)';
      background = 'var(--chip-background-completed)';
      break;

    case status === 'Failed' || status === 'Need Reperform':
      color = 'var(--chip-color-failed)';
      borderColor = 'var(--chip-border-failed)';
      background = 'var(--chip-background-failed)';
      break;

    case status === 'Pending' || status === 'Backlog' || status === 'Skipped':
      color = 'var(--chip-color-pending)';
      borderColor = 'var(--chip-border-pending)';
      background = 'var(--chip-background-pending)';
      break;

    case status === 'pause' || status === 'In-Progress':
      color = 'var(--chip-color-inProgress)';
      borderColor = 'var(--chip-border-inProgress)';
      background = 'var(--chip-background-inProgress)';
      break;

    default:
      break;
  }

  return { color, borderColor, background };
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
  completed: 'Completed'
};

export const WORK_ORDER_STATUS = {
  new: 'New',
  preWork: 'Pre-Work In-Progress',
  postWork: 'Post-Work In-Progress',
  inProgress: 'In-Progress',
  onHold: 'On-hold',
  deleted: 'Deleted',
  completed: 'Completed'
};

export const WORK_ORDER_TYPE = {
  repairOrder: 'Repair Order',
  productionOrder: 'Production Order',
  assemblyOrder: 'Assembly Order'
};

export const IRT_APPROVER_STATUS = {
  send: 'Email Sent',
  approved: 'Approved',
  declined: 'Declined'
};

export const SERVICE_ORDER_STATUS = {
  new: 'New',
  inProgress: 'In-Progress',
  readyToInvoice: 'Ready to Invoice',
  invoiced: 'Invoiced',
  completed: 'Completed',
  closed: 'Closed'
};

export const MATERIAL_REQUEST_STATUS = {
  requested: 'Requested',
  processed: 'Processed',
  closed: 'Closed'
};

export const ASSETS_RECEIVING_STATUS = {
  new: 'New',
  inProgress: 'In-Progress',
  complete: 'Complete'
};

export const MATERIAL_TYPE = {
  product: 'product',
  service: 'service',
  package: 'package',
  serializedAsset: 'serializedAsset',
  manualEntry: 'manualEntry',
  other: 'other'
};

export const MATERIAL_SUB_TYPE = {
  consumable: 'consumable',
  bom: 'bom'
};

export const FIELD_TICKET_STATUS = {
  new: 'New',
  inProgress: 'In-Progress',
  submitted: 'Submitted',
  readyToInvoice: 'Ready to Invoice',
  invoiced: 'Invoiced',
  closed: 'Closed'
};

export const SUBCONTRACT_ASSEMBLY_STATUS = {
  new: 'New',
  inProgress: 'In-Progress',
  closed: 'Closed'
};

export const WORK_FLOW_STATUS = {
  open: 'Open',
  inProgress: 'In-Progress',
  completed: 'Completed'
};

export const INVOICE_STATUS = {
  new: 'New',
  inProgress: 'In-Progress',
  readyToInvoice: 'Ready to Invoice',
  invoiced: 'Invoiced',
  closed: 'Closed',
  cancelled: 'Cancelled'
};

export const SALES_ORDER_STATUS = {
  new: 'New',
  inProgress: 'In-Progress',
  readyToInvoice: 'Ready to Invoice',
  invoiced: 'Invoiced',
  closed: 'Closed'
};

export const PRICING_TYPE = [
  { optionLabel: 'Rent', optionValue: 'Rent' },
  { optionLabel: 'Sell', optionValue: 'Price' }
];

export const PRICING_SETUP_TYPE = {
  price: `Price`,
  rent: `Rent`
};

export const SERVICE_TYPE = {
  shopService: 'Shop Service',
  fieldService: 'Field Service'
};

export const SUBLEASE_TYPE = {
  vendor: 'Vendor',
  interCompany: 'Inter Company'
};

export const QUOTE_PROCESS_STATUS = {
  new: 'New',
  priceBuilder: 'Price Builder',
  quoteBuilder: 'Quote Builder',
  doaProcess: 'DOA Process',
  sendToCustomer: 'Send To Customer',
  end: 'End'
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
    _id: uuid(),
    type: 'imageSlider',
    label: 'Image Slider',
    column: '12'
  },
  {
    _id: uuid(),
    type: 'image',
    label: 'Image',
    column: '12'
  },
  {
    _id: uuid(),
    type: 'menu',
    label: 'Menu',
    column: '12'
  },
  {
    _id: uuid(),
    type: 'productCategory',
    label: 'Product Category',
    column: '12'
  },
  {
    _id: uuid(),
    type: 'productList',
    label: 'Product List',
    column: '12'
  }
];

export const TOOLTIP_MESSAGE = {
  add: "You don't have permissions to add",
  edit: "You don't have permissions to edit",
  remove: "You don't have permissions to remove"
};

export const getNestedlookupDependentOn = (fields, fieldName) => {
  const result: any = [];
  const checkNested = (fields, fieldName, result) => {
    const filterFields: any = fields.filter((d) => d.lookupDependentOn === fieldName);
    if (filterFields?.length) {
      filterFields?.forEach((ele: any) => {
        result.push({ fieldName: ele.fieldName, value: ele?.type === 'multiSelect' ? [] : '' });
        checkNested(fields, ele.fieldName, result);
      });
    }
  };
  checkNested(fields, fieldName, result);
  return result;
};

export const GenerateResourceLineNumber = (fields) => {
  const primaryField = fields?.find((e) => e?.primaryField);
  var lineNumber = '';
  if (primaryField) {
    if (primaryField?.isSystemGenerate && !primaryField?.systemGeneratedAutoIncrement) {
      const prefix =
        primaryField?.systemGeneratedPrefix && primaryField?.systemGeneratedPrefix != undefined && primaryField?.systemGeneratedPrefix != ''
          ? `${primaryField?.systemGeneratedPrefix}_`
          : '';
      lineNumber = `${prefix}${generateUniqueIdOnly()}`;
    } else if (primaryField?.isDefaultValue && primaryField?.defaultValue) {
      lineNumber = primaryField?.defaultValue;
    }
  }
  return lineNumber;
};

export const ROLE_TIER = {
  tier1: 'Tier 1',
  tier2: 'Tier 2',
  tier3: 'Tier 3'
};

export const fieldLabelToFieldName = (fieldLabel) => {
  return camelCase(fieldLabel?.replace(/[^a-zA-Z0-9]/g, ''))?.substring(0, 60);
};

export const ATTACHMENT_TYPE = {
  drawing: 'Drawing',
  certificate: 'Certificate',
  mtr: 'MTR'
};

export const FILE_PROCESS_STATUS = {
  processing: 'Processing',
  completed: 'Completed'
} as const;

export const convertBlobToBase64 = async (blobUrl) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      canvas.remove();
      resolve(dataURL);
    };
    img.onerror = () => reject('Error in converting blob to base64');
    img.src = blobUrl;
  });
};

export const IMPORT_EXPORT_STATUS = {
  new: 'New',
  inProgress: 'In-Progress',
  error: 'Error',
  completed: 'Completed',
  partialComplete: 'Partial Complete'
};

export const IMPORT_EXPORT_TYPE = {
  import: 'Import',
  export: 'Export'
};

export function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

export const getResourceLabel = (resource, user) => {
  return user?.role?.selectedEntity?.resource?.find((e) => e.name === resource)?.resourceLabel || resource;
};

export const ASSET_APPROVAL_STATUS = {
  approved: 'Approved',
  rejected: 'Rejected',
  pending: 'Pending'
};

export const STEPS_STYLE = {
  list: 'List',
  step: 'Step',
  sideBar: 'Side Bar'
};

export const DEAL_STAGE = {
  proposalSent: 'Proposal Sent',
  contractSigned: 'Contract Signed',
  renewalSent: 'Renewal Sent',
  renewalSigned: 'Renewal Signed'
};

export const cloneResourceData = (fromFields, toFields, data, currency) => {
  const overlappingFields = fromFields.filter(
    (e) => toFields?.map((e) => e.fieldName).includes(e?.fieldName) && !['lookUpDisplay']?.includes(e?.type)
  );
  const result: any = {};
  overlappingFields?.forEach((e) => {
    let fieldName = e?.fieldName;
    if (e.type === 'currencyAmount') {
      fieldName = `${e?.fieldName}_${currency?.toLowerCase()}`;
    }
    if (data[fieldName]) {
      if (e?.lookup) {
        if (e?.type === 'dropDown') {
          result[fieldName] = data[fieldName]?.optionValue || '';
        } else {
          result[fieldName] = isArray(data[fieldName]) ? data[fieldName]?.map((m) => m.optionValue) : [];
        }
      } else {
        result[fieldName] = data[fieldName];
      }
    }
  });
  delete result?.owner;
  delete result?.pdfTemplate;
  delete result?.status;
  return result;
};

export const getDefaultMyRecordType = (user, resource) => {
  let userByDefaultRecord = user?.uiPreference?.byDefaultRecord;
  if (!isArray(userByDefaultRecord) || userByDefaultRecord?.length === 0) {
    if (isArray(user?.brandPolicy?.brandByDefaultRecord)) {
      userByDefaultRecord = user?.brandPolicy?.brandByDefaultRecord;
    }
  }
  if (isArray(userByDefaultRecord)) {
    const byDefaultRecord = userByDefaultRecord?.find((e) => e.resource === resource);
    if (byDefaultRecord) {
      if (byDefaultRecord?.type === 'All') {
        return 2;
      } else {
        return 1;
      }
    } else {
      return 1;
    }
  } else {
    return 1;
  }
};

export const checkSuperAdminAccess = (user, resource) => {
  return user?.role?.selectedEntity?.superAdminAccessResource?.includes(resource) ? true : false;
};

export const DOA_RESOURCE = [
  {
    key: 'purchaseRequisition',
    resorce: sidebarResource.purchaseRequisition
  }
];

export const DoaApproveType = {
  user: 'User',
  role: 'Role'
};

export const DOAType = {
  sequence: 'Sequence',
  amount: 'Amount'
};

export const DOA_STATUS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  sentForDoa: 'Sent for DOA',
  acceptedbyDOA: 'Accepted by DOA',
  rejectedbyDOA: 'Rejected by DOA'
};

export const checkIsAllowedToEdit = (user, resource, data) => {
  let userIds = [];
  if (data?.owner?.optionValue) {
    userIds.push(data?.owner?.optionValue);
  }
  if (data?.collaborator) {
    userIds = [...userIds, ...data.collaborator?.map((e) => e.optionValue)];
  }
  if (data?.processor?.optionValue) {
    userIds.push(data?.processor?.optionValue);
  }

  if (data?.userGroup) {
    if (isArray(data?.userGroup)) {
      data?.userGroup?.forEach((e) => {
        if (e?.users?.length) {
          userIds = [...userIds, ...e.users];
        }
      });
    } else if (data?.userGroup?.users?.length) {
      userIds = [...userIds, ...data.userGroup.users];
    }
  }

  let isAllowedToEdit = userIds.includes(user?.user?._id) ? true : false;

  if (user?.role?.selectedEntity?.superAdminAccessResource?.includes(resource)) {
    isAllowedToEdit = true;
  }

  return isAllowedToEdit;
};

export const checkIsAllowedToDelete = (user, resource, owner) => {
  let isAllowedToDelete = owner === user?.user?._id ? true : false;
  if (user?.role?.selectedEntity?.superAdminAccessResource?.includes(resource)) {
    isAllowedToDelete = true;
  }
  return isAllowedToDelete;
};

export function changeItemIndex<T>(array: T[], item: T, sourceIndex: number, destinationIndex: number) {
  const newArray = Array.from(array);
  newArray.splice(sourceIndex, 1); // remove the item at index
  newArray.splice(destinationIndex, 0, item);
  return newArray;
}

export function addItemAtIndex<T>(array: T[], item: T, destinationIndex: number) {
  const newArray = [...array];
  newArray.splice(destinationIndex, 0, item);
  return newArray;
}

export function removeItemAtIndex<T>(array: T[], index: number) {
  const newArray = [...array];
  newArray.splice(index, 1);
  return newArray;
}

export function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}

export function groupByKey<T>(arr: T[] = [], keyGetter: ((d: T) => string) | string) {
  let result = {};
  result = arr.reduce((r, a) => {
    const key = typeof keyGetter === 'string' ? a[keyGetter] : keyGetter(a);
    if (r[key]) {
      r[key].push(a);
    } else {
      r[key] = [];
    }
    return r;
  }, Object.create(null));
  return result;
}

export const restoreObjKeysWithValues = (dataObj: object, fields: any[]) => {
  const obj = { ...dataObj };
  fields.forEach((field) => {
    if (field.type === 'dropDown' && field.lookup) {
      let filter: any = field?.option?.filter((e) => e.optionValue === dataObj[field.fieldName]);
      if (filter.length) {
        obj[field.fieldName] = {
          optionLabel: filter[0].optionLabel,
          optionValue: filter[0].optionValue
        };
      }
    } else if (field.type === 'multiSelect') {
      if (dataObj[field.fieldName] && dataObj[field.fieldName].length) {
        let option = [];
        dataObj[field.fieldName].forEach((e: any) => {
          const optionLabel = field?.option?.find((o) => o.optionValue === e)?.optionLabel;
          option.push({
            optionLabel: optionLabel,
            optionValue: e
          });
        });
        obj[field.fieldName] = option;
      }
    } else if (field.type === 'date') {
      obj[field.fieldName] = moment(dataObj[field.fieldName]).format('YYYY-MM-DD');
    } else {
      obj[field.fieldName] = dataObj[field.fieldName];
    }
  });
  return obj;
};
export function generateId() {
  return Date.now() + Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
}
export const colSpans = [
  'col-span-1',
  'col-span-2',
  'col-span-3',
  'col-span-4',
  'col-span-5',
  'col-span-6',
  'col-span-7',
  'col-span-8',
  'col-span-9',
  'col-span-10',
  'col-span-11',
  'col-span-12',

  'md:col-span-1',
  'md:col-span-2',
  'md:col-span-3',
  'md:col-span-4',
  'md:col-span-5',
  'md:col-span-6',
  'md:col-span-7',
  'md:col-span-8',
  'md:col-span-9',
  'md:col-span-10',
  'md:col-span-11',
  'md:col-span-12'
];

export const getFileIconSrc = (file) => {
  if (!file) return FileIcon;
  if (typeof file === 'string') {
    let extension = file.substring(file.lastIndexOf('.')).toLowerCase();
    let data = fileIcons.find((o) => o.extensions.indexOf(extension) >= 0);
    if (data && data?.icon) return data.icon;
  }
  if (mimeDb[file]) {
    let extension = `.${mimeDb[file].extensions[0]}`;
    let data = fileIcons.find((o) => o.extensions.indexOf(extension) >= 0);
    if (data && data?.icon) return data.icon;
  }
  if (file?.contentType) {
    let extension = `.${mimeDb[file.contentType].extensions[0]}`;
    let data = fileIcons.find((o) => o.extensions.indexOf(extension) >= 0);
    if (data && data?.icon) return data.icon;
  } else if (file) {
    let extension = file.substring(file.lastIndexOf('.')).toLowerCase();
    let data = fileIcons.find((o) => o.extensions.indexOf(extension) >= 0);
    if (data && data?.icon) return data.icon;
  }
  return FileIcon;
};

export const checkIfSynching = async (setToFalse = false) => {
  try {
    let api = `user/update-synching-status`;
    if (setToFalse) {
      api += `?setToFalse=true`;
    }
    const { data } = await axiosInstance().post(api);
    return data?.data;
  } catch (error) { }
};

export const columnSize = (type) => {
  if (['imageUpload', 'fileUpload', 'multiImageUpload', 'multiFileUpload', 'counter', 'description'].includes(type)) {
    return 'col-span-12';
  }
  return 'col-span-6';
};

export const gridSize = (type) => {
  if (['imageUpload', 'fileUpload', 'multiImageUpload', 'multiFileUpload', 'counter', 'description'].includes(type)) {
    return 12;
  }
  return 6;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const normalizeDate = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

function fallbackCopyTextToClipboard(text: string, callBack: (text: string) => void) {
  var textArea = document.createElement('textarea');
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
    callBack(text);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}

export function copyTextToClipboard(text: string, callBack: (text: string) => void = () => { }) {
  if (typeof callBack !== 'function') callBack = (text) => { };

  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text, callBack);
  }
  navigator.clipboard.writeText(text).then(
    function () {
      callBack(text);
    },
    function (err) {
      console.error('Async: Could not copy text: ', err);
    }
  );
}

export const HIDDEN_FIELD_TYPE = ['description'];

export function debounceCallBack<T extends (...args: any[]) => void>(func: T, timeout = 300): [(...args: Parameters<T>) => void, () => void] {
  let timer: NodeJS.Timeout;
  const debouncedFunc = (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
  const teardown = () => clearTimeout(timer);
  return [debouncedFunc, teardown];
}
export type DebounceCallBack = ReturnType<typeof debounceCallBack>;

export const MFA_METHOD = {
  emailOtp: 'emailOtp',
  totp: 'totp'
};

export const findSimilarRecords = (array, property) => {
  const similarRecords: any = {};
  array.forEach((item) => {
    if (!similarRecords[item[property]]) {
      similarRecords[item[property]] = [];
    }
    similarRecords[item[property]].push(item);
  });
  return Object.values(similarRecords).filter((group: any) => group.length > 1);
};

export function compareVersions(newVersion: number, oldVersion: number): 1 | -1 | 0 {
  if (newVersion > oldVersion) {
    return 1;
  }
  if (newVersion < oldVersion) {
    return -1;
  }
  return 0;
}

export async function handleHardReload(url = window.location.href) {
  await fetch(url, {
    headers: {
      Pragma: 'no-cache',
      Expires: '-1',
      'Cache-Control': 'no-cache'
    }
  });
  if ('caches' in window) {
    caches?.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }
  window.location.href = url;
  // This is to ensure reload with url's having '#'
  window.location.reload();
}

export const tabIndexValue = (resourceData, index) => {
  if (resourceData && resourceData?.tabs?.length > 0) {
    index = resourceData?.tabs?.length + index;
  }
  return index;
};
export const mapDarkTheme: GoogleMapProps['options']['styles'] = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }]
  }
];

export const mapLightTheme: GoogleMapProps['options']['styles'] = [
  {
    featureType: 'water',
    stylers: [{ color: '#46bcec' }, { visibility: 'on' }]
  },
  { featureType: 'landscape', stylers: [{ color: '#f2f2f2' }] },
  {
    featureType: 'road',
    stylers: [{ saturation: -100 }, { lightness: 45 }]
  },
  {
    featureType: 'road.highway',
    stylers: [{ visibility: 'simplified' }]
  }
];
