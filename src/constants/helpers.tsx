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
import { orderBy, uniqBy } from 'lodash';

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

export const repairJobProcessSteps = ["Serialized Assets", "Loading Ticket", "Receiving Ticket", "End"];
export const repairJobStatus = ["New", "In Progress", "Completed"];

export const accountTemplateFileName = 'Accounts-Template.xlsx';
export const accountImportErrorFileName = 'Accounts-Errors.xlsx';

export const contactTemplateFileName = 'Contacts-Template.xlsx';
export const contactImportErrorFileName = 'Contacts-Errors.xlsx';

export const leadTemplateFileName = 'Leads-Template.xlsx';
export const leadImportErrorFileName = 'Leads-Errors.xlsx';

export const opportunityTemplateFileName = 'Opportunities-Template.xlsx';
export const opportunityImportErrorFileName = 'Opportunities-Errors.xlsx';

export const quoteStepColors = {
  "accepted by customer": { backgroundColor: "#008000", color: "#fff" },
  "not booked by customer": { backgroundColor: "#ba181b", color: "#fff" },

  "re-open": { backgroundColor: "#ff7d00", color: "#fff" },
  "invalid by customer": { backgroundColor: "#eb5e28", color: "#fff" },

  "not booked": { backgroundColor: "#2b2d42", color: "#fff" },
  "building quote": { backgroundColor: "#023e7d", color: "#fff" },

  "__default__": { backgroundColor: "#023e7d", color: "#fff" }
}


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
  priceTemplate: 'Price Template',
  product: 'Product',
  productTemplate: 'Product Template',
  doa: 'DOA',
  termsAndConditions: 'Terms & Conditions',
  equiptmentRentalMaster: 'Equiptment Rental Master',
  projectStrategy: 'Project Sales',
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
  receivingTicket: 'Receiving Ticket',
  salesOrder: 'Sales Order',
  eCommerce: 'e-Commerce',
  packages: 'Packages',

  supplierContact: 'Supplier Contact',
  supplierAccount: 'Supplier Account',
  pricing: 'Pricing',
  priceBuilder: 'Price Builder',
  flags: 'Flags',
  projectSales: 'Project Sales',
  purchaseOrder: 'Purchase Order',
  transferAsset: 'Transfer Asset'

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
  productInventory: 'Serialized Assets',
  priceTemplate: 'Price Templates',
  product: 'Product Master',
  productTemplate: 'Product Templates',
  doa: 'DOA',
  termsAndConditions: 'T&Cs',
  equiptmentRentalMaster: 'Equiptment Rental Master',
  projectStrategy: 'Project Sales',
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
  receivingTicket: 'Receiving Tickets',
  salesOrder: 'Sales Order',
  eCommerce: 'e-Commerce',
  packages: 'Packages',
  purchaseOrder: 'Purchase Orders',
  transferAsset: 'Transfer Assets',
  address: 'Addresses',
};




export const sidebarResourceObjectFromValues = () => {

  let obj: any = {};

  Object.keys(sidebarResource).forEach((key) => {
    obj[sidebarResource[key]] = key
  })
  obj['Project Sales'] = "projectStrategy"
  return obj
}

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
  rentalManagementApi: '/rental-management',
  resource: "rental-management"
};

export const deliveryTicket = {
  deliveryTicketResource: 'deliveryTicket',
  deliveryTicketApi: '/delivery-ticket'
};

export const repairJob = {
  repairJobResource: 'repairJob',
  repairJobApi: '/repair-job'
};

export const salesOrder = {
  salesOrderResource: 'salesOrder',
  salesOrderApi: '/sales-order'
};

export const packages = {
  packageResource: 'packages',
  packageApi: '/packages'
};

export const warehouse = {
  warehouseResource: 'warehouse',
  warehouseApi: '/warehouse'
};

export const receivingTicket = {
  receivingTicketResource: 'receivingTicket',
  receivingTicketApi: '/receiving-ticket'
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
  route: '/e-product',
};

export const productInventory = {
  api: '/product-inventory',
  route: '/product-inventory',
  permission: 'productInventory'
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

export const transferAsset = {
  api: '/transfer-asset',
  route: '/transfer-asset',
  permission: 'transferAsset',
  resource: 'transferAsset'
};


export const pricingCondition = {
  resource: 'pricingCondition',
  api: '/pricing-condition',
  route: 'pricing-condition'
};


export const profileMenuItems = {
  profile: 1,
  notification: 2,
  setting: 3,
  users: 4,
  securityPrivacy: 5
};

export const getObjKeys = (val: string | boolean = '', arr: any[]) => {
  let selectedEntity = localStorage.getItem("selectedEntity")

  let isCreate = (val === "") ? true : false
  const obj = {};
  for (const key of arr) {
    let isEntityField = key?.fieldName === "entity"

    let value = key.isDefaultValue ? key.defaultValue : val;
    if (isEntityField && selectedEntity && isCreate) {
      value = key?.type === "multiSelect" ? [selectedEntity] : selectedEntity
    }
    if (key.type === 'dropDown') {
      const option = key.option?.find((data: any) => data.default === true);
      obj[key.fieldName] = value ? value : option ? option.optionValue : '';
    } else if (key.type === 'multiSelect') {
      const defaultOptions = key.option?.filter((item: any) => item.default === true);
      const options = defaultOptions?.map((data: any) => data.optionValue);
      obj[key.fieldName] = value ? value : options;
    } else if (key.type === 'freeStyleMultiSelect') {
      const defaultOptions = key.option?.filter((item: any) => item.default === true);
      const options = defaultOptions?.map((data: any) => data.optionValue);
      obj[key.fieldName] = value ? value : options;
    } else if (key.type === 'date') {
      obj[key.fieldName] = value ? value : new Date();
    } else if (key.type === 'year') {
      obj[key.fieldName] = value ? value : new Date();
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
    let defaultValue

    if (key?.isDefaultValue && key?.defaultValue) {
      defaultValue = key.defaultValue
    }
    if (key.type === 'switch' || key.type === 'checkBox') {
      obj[key.fieldName] = dataObj[key.fieldName] ? dataObj[key.fieldName] : defaultValue ? defaultValue : false;
    } else if (key.type === 'multiSelect') {
      const values = dataObj[key.fieldName] && dataObj[key.fieldName].length

        ? typeof dataObj[key.fieldName] === 'string'
          ? dataObj[key.fieldName]
          : dataObj[key.fieldName].map((val: any) => filterValues(val))
        : defaultValue || [];
      obj[key.fieldName] = values;
    } else if (key.type === 'dropDown') {
      const value = filterValues(dataObj[key.fieldName]);
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
      schema[input.fieldName] = input.required
        ? number().required(`${input.fieldLabel} is required`).nullable()
        : number().nullable();
    } else if (input.type === 'email') {
      schema[input.fieldName] =
        input.required && validEmail
          ? string().email().required(`${input.fieldLabel} is required`)
          : string().email(`${input.fieldLabel} must be a valid email`);
    } else if (input.type === 'switch' || input.type === 'checkBox') {
      schema[input.fieldName] = input.required ? boolean().required(`${input.fieldLabel} is required`) : boolean();
    } else if (input.type !== 'currencyAmount' && (input.type === 'converter' || input.isConverter === true)) {
      input.displayUnits && input.displayUnits.forEach((_unit) => {
        schema[input.fieldName + '_' + _unit.toLowerCase()] = input.required ? number().required(`${input.fieldLabel} is required`).nullable() : number().nullable();
      });
    } else if (input.type === 'currencyAmount') {
      input.displayCurrency && input.displayCurrency.forEach((_currency) => {
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
    } else {
      schema[input.fieldName] = input.required ? string().required(`${input.fieldLabel} is required`) : string();
    }
  });

  return object().shape(schema);
};

export const camelCase = (str) => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
};

export const UnCamelCase = (str) => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
    .replace(/^./, function (str) {
      return str.toUpperCase();
    });
};

export const isObjectEmpty = (obj) => {
  return Object.keys(obj).length === 0;
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
export const dateFormat = localStorage.getItem("dateFormat") ?? "MM/DD/YYYY";
export const dateTimeFormat = localStorage.getItem("dateTimeFormat") ?? "MM/DD/YYYY hh:mm A";
export const cardDateFormat = localStorage.getItem("cardDateFormat") ?? "MMM DD, YYYY";

export const dateFormatForInputControl = localStorage.getItem("dateFormatForInputControl") ?? "MM/dd/yyyy";
// export const dateTimeFormat = "MM/dd/yyyy hh:mm A"
// export const cardDateFormat = "MMM,dd yyyy"

export const yyyyMMDD = (dateToBeFormatted) => {
  return dateToBeFormatted ? moment(dateToBeFormatted).format(cardDateFormat) : dateToBeFormatted;
};

export const displayDate = (date) => {
  return date ? moment(date).format(dateFormat) : date;
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
          console.info(`Custom Error (helper.tsx > getPermissions()) => ${JSON.stringify(d)} resource not found`)
        }
      });
    }

    sidebarFieldsKeys.forEach(d => {
      if (!permissions.hasOwnProperty(d)) {
        permissions[d] = {
          isCreate: false,
          isRead: false,
          isUpdate: false,
          isDelete: false
        }
      }
    })

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

  let options = {
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
    fullFormatAmountWithCurrencyName: new Intl.NumberFormat(`${language}-${currencyData.countryCode}`, {
      currencyDisplay: 'code',
      ...options
    }).format(amount),
    amountWithouCurrencyCode: new Intl.NumberFormat(`${language}-${currencyData.countryCode}`).format(amount)
  };
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
  let mappedEntities = JSON.parse(localStorage.getItem("mappedEntities"))

  if (data.entity && data.entity.length === 0 && mappedEntities.length) {
    data.entity = [...mappedEntities]
  }
  Object.keys(data).forEach((key) => {
    if (typeof data[key] === "object") {

      if (Array.isArray(data[key])) {
        if (data[key].length > 0 && data[key][0] && data[key][0].hasOwnProperty("optionLabel")) {
          const [first, ...rest] = data[key];

          restProperties[key] = first["optionLabel"];
          restProperties[`${key}Id`] = first["optionValue"];
          restProperties[`rest${key}`] = rest
        }
        else if (typeof data[key][0] !== "object") {
          restProperties[key] = data[key].join(" , ")
        }
      }
      else {
        objectValues[key] = data[key];
      }
    } else {
      restProperties[key] = data[key];
    }
  })

  let finalObject = { ...restProperties };

  Object.keys(objectValues).forEach(d => {
    if (objectValues[d] && objectValues[d].hasOwnProperty("optionLabel")) {
      finalObject[d] = objectValues[d]["optionLabel"];
      finalObject[`${d}Id`] = objectValues[d]["optionValue"];
    }
  });

  if (data?.collaborator) {
    finalObject["isAllowedToUpdate"] = [...(data?.collaborator ?? []), data?.owner ?? {}].some(
      (obj) => obj.optionValue === user["user"]?._id
    )
  }

  if (data?.createdBy) {
    finalObject["createdBy"] = data.createdBy?.user?.concatedName
    finalObject["createdByDate"] = data.createdBy?.date
    finalObject["createdById"] = data.createdBy?.user?._id
    if (!finalObject["isAllowedToUpdate"]) {
      finalObject["isAllowedToUpdate"] = data.createdBy?.user?._id === user["user"]?._id
    }
  }
  if (data?.updatedBy) {
    finalObject["updatedBy"] = data?.updatedBy?.user?.concatedName
    finalObject["updatedByDate"] = data?.updatedBy?.date
  }
  finalObject["id"] = data?._id

  return finalObject;
}

export const getLocalStorageArrayData = (key) => {
  try {
    if (localStorage.getItem(key) && JSON.parse(localStorage.getItem(key)).length > 0) {
      return JSON.parse(localStorage.getItem(key));
    }
    return [];

  } catch (ex) {
    return []
  }
}

export const translateDataToTree = (data, parentProperty, childProperty, childrenPropertyToStore) => {
  let parents = data.filter(value => value[parentProperty] == 'undefined' || value[parentProperty] == null)
  let childrens = data.filter(value => value[parentProperty] !== 'undefined' && value[parentProperty] != null)

  let translator = (parents, childrens) => {
    parents.forEach((parent) => {
      childrens.forEach((current, index) => {
        if (current.parent === parent[childProperty]) {
          let temp = JSON.parse(JSON.stringify(childrens))
          temp.splice(index, 1)
          translator([current], temp)

          if (typeof parent[childrenPropertyToStore] !== 'undefined') {
            parent[childrenPropertyToStore].push(current)
          } else {
            parent[childrenPropertyToStore] = [current]
          }
        }
      })
    })
  }
  translator(parents, childrens)

  return parents
}

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
  const option: any = []
  array?.forEach((element, index) => {
    option.push({
      "optionLabel": element,
      "optionValue": element,
      "order": index
    })
  });
  return option;
}

export const INVENTORY_STATUS = {
  customer: 'With Customer',
  supplier: 'With Supplier',
  reserved: 'Reserved',
  inSale: 'In Sale',
  inUse: 'In-Use',
  indTransit: 'In-Transit',
  underReview: 'Under Review',
  repair: 'Repair',
  available: 'Available',
  readyToShip: 'Ready to ship',
  new: 'New',
  scrap: 'Scrap',
  lost: 'Lost',
};

export const DELIVERY_TICKET_STATUS = {
  new: 'New',
  indTransit: 'In-Transit',
  delivered: 'Delivered',
};

export const asyncForEach = async (
  array: any[],
  callback: (arrayIndex: any, i: number, array: any[]) => Promise<any>
) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};