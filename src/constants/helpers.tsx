import React, { forwardRef } from "react";
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
  ViewColumn,
  List,
} from "@material-ui/icons";
import * as yup from "yup";
import moment from "moment";
import currencies from "./currency_with_country.json";
import { TransitionProps } from "@material-ui/core/transitions";
import { Slide } from "@material-ui/core";
import { orderBy, uniqBy } from "lodash";

export const vapidKey =
  "BFFucJ4GMNzUKVU5HaI5BsGDi0Au6MqKIr7SlzDbY6s_2JX6y3Qu5E8dMXhLpmZLwDpheOyDBxtbOmxuFH8WZe4";

export const validations = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
};

//  1048576 = 1 MB
export const imageUploadMaxSize = { size: 1048576 * 2, text: "2 MB" };
export const documentUploadMaxSize = { size: 1048576 * 10, text: "10 MB" };
export const termsAndConditionDocumentUploadMaxSize = { size: 1048576 * 2, text: "2 MB" };

export const accountTemplateFileName = "Accounts-Template.xlsx";
export const accountImportErrorFileName = "Accounts-Errors.xlsx";

export const contactTemplateFileName = "Contacts-Template.xlsx";
export const contactImportErrorFileName = "Contacts-Errors.xlsx";

export const leadTemplateFileName = "Leads-Template.xlsx";
export const leadImportErrorFileName = "Leads-Errors.xlsx";

export const opportunityTemplateFileName = "Opportunities-Template.xlsx";
export const opportunityImportErrorFileName = "Opportunities-Errors.xlsx";

export const roleTypes = [
  {
    key: "Global",
    value: 1,
  },
  {
    key: "Regional",
    value: 2,
  },
];

export const userType = {
  brandAdmin: 2,
};

export const AgGridHeaderHeight = 40;
export const AgGridRowHeight = 30;
export const AgGridFloatingFiltersHeight = 38;

export const gridPageSizes = [25, 50, 75];

export const processFieldName = "process";

export const stepsToIgnoreManualCompleteForOpportunity = ["doa"];

export const localStorageKeys = {
  currentSelectedRoleType: "currentSelectedRoleType",
};

export const sidebarResource = {
  brand: "Brand",
  role: "Role",
  product: "Product",
  entity: "Entity",
  user: "User",
  termsAndConditions: "Terms & Conditions",
  doa: "DOA",
  customerContact: "Customer Contact",
  customerAccount: "Customer Account",
  supplierContact: "Supplier Contact",
  supplierAccount: "Supplier Account",
  pricing: "Pricing",
  currencyConvertor: "Currency Convertor",
  priceBuilder: "Price Builder",
  quoteBuilder: "Quotes",
  reminder: "Reminder",
  calendar: "Calendar",
  flags: "Flags",
  lead: "Lead",
  opportunity: "Opportunity",
  projectSales: "Project Sales",
  task: "Task",
  note: "Note",
  email: "Email",
  attachment: "Attachment",
  case: "Case",
  productTemplate: "Product Template",
};

export const lead = {
  leadResource: "lead", //  Key of sidebar object
  leadApi: "/lead",
};

export const opportunity = {
  opportunityResource: "opportunity", //  Key of sidebar object
  opportunityApi: "/opportunity",
};

export const entity = {
  entityResource: "entity", //  Key of sidebar object
  entityApi: "/entity",
};

export const productTemplate = {
  productTemplateResource: "productTemplate",
  productTemplateApi: "/product-template",
};

export const quoteBuilder = {
  qbResource: "quoteBuilder",
  qbApi: "/quote-builder",
};

export const projectSales = {
  projectSalesResource: "projectSales",
  projectSalesApi: "/project-sales",
};

export const quote = {
  quoteResource: "quote",
};

export const supplierAccount = {
  accountApi: "supplier-account",
  accountRoute: "supplier-account",
  accountResource: "supplierAccount", //  Key of sidebar object
  accountPermission: "Supplier Account",
};

export const termsAndCondition = {
  api: "/termsandconditions",
  route: "/terms-conditions",
  permission: "termsAndConditions",
};

export const customerAccount = {
  accountApi: "customer-account",
  accountRoute: "customer-account",
  accountResource: "customerAccount", //  Key of sidebar object
  accountPermission: "Customer Account",
};

export const supplierContact = {
  contactApi: "supplier-contact",
  contactRoute: "supplier-contact",
  contactResource: "supplierContact", //  Key of sidebar object
  contactPermission: "Supplier Contact",
};

export const customerContact = {
  contactApi: "customer-contact",
  contactRoute: "customer-contact",
  contactResource: "customerContact", //  Key of sidebar object
  contactPermission: "Customer Contact",
};

export const profilePage = {
  profilePageRoute: "/profile",
};

export const product = {
  api: "/product",
  route: "/product",
  permission: "product",
};

export const profileMenuItems = {
  profile: 1,
  notification: 2,
  setting: 3,
  users: 4,
  securityPrivacy: 5,
};

export const getObjKeys = (val: string | boolean = "", arr: any[]) => {
  const obj = {};
  for (const key of arr) {
    let value = key.isDefaultValue ? key.defaultValue : val;
    if (key.type === "dropDown") {
      const option = key.option?.find((data: any) => data.default === true);
      obj[key.fieldName] = value ? value : option ? option.optionValue : "";
    } else if (key.type === "multiSelect") {
      const defaultOptions = key.option?.filter(
        (item: any) => item.default === true
      );
      const options = defaultOptions?.map((data: any) => data.optionValue);
      obj[key.fieldName] = value ? value : options;
    } else if (key.type === "date") {
      obj[key.fieldName] = value ? value : new Date();
    } else if (key.type === "switch" || key.type === "checkBox") {
      obj[key.fieldName] = value ? value : false;
    } else if (
      key.type !== "currencyAmount" &&
      (key.type === "converter" || key.isConverter === true)
    ) {
      key.displayUnits && key.displayUnits.forEach((_unit) => {
        obj[key.fieldName + "_" + _unit.toLowerCase()] =
          value && value !== "" ? parseFloat(value) : value;
      });
    } else if (key.type === "currencyAmount") {
      key.displayCurrency && key.displayCurrency.forEach((_currency) => {
        if (key.isConverter && key.displayUnits.length) {
          key.displayUnits && key.displayUnits.forEach((_unit) => {
            obj[
              key.fieldName +
              "_" +
              _currency.toLowerCase() +
              "_" +
              _unit.toLowerCase()
            ] = value && value !== "" ? parseFloat(value) : value;
          });
        } else {
          obj[key.fieldName + "_" + _currency.toLowerCase()] =
            value && value !== "" ? parseFloat(value) : value;
        }
      });
    } else if (key.type === "decimal") {
      obj[key.fieldName] = value && value !== "" ? parseFloat(value) : value;
    } else {
      obj[key.fieldName] = value;
    }
  }
  return obj;
};

export const getObjKeysWithValues = (dataObj: object, arr: any[]) => {
  const obj = {};

  const filterValues = (data: object | any) =>
    typeof data === "string"
      ? data
      : typeof data === "object"
        ? data.optionValue
        : "";

  for (const key of arr) {
    if (key.type === "switch" || key.type === "checkBox") {
      obj[key.fieldName] = dataObj[key.fieldName]
        ? dataObj[key.fieldName]
        : false;
    } else if (key.type === "multiSelect") {
      const values =
        dataObj[key.fieldName] && dataObj[key.fieldName].length
          ? dataObj[key.fieldName].map((val: any) => filterValues(val))
          : [];
      obj[key.fieldName] = values;
    } else if (key.type === "dropDown") {
      const value = filterValues(dataObj[key.fieldName]);
      obj[key.fieldName] = value ? value : "";
    } else if (key.type !== "currencyAmount" && (key.type === "converter" || key.isConverter === true)) {
      key.displayUnits && key.displayUnits.forEach((_unit) => {
        let fieldName = key.fieldName + "_" + _unit.toLowerCase();
        obj[fieldName] = dataObj[fieldName] ? dataObj[fieldName] : 0;
      });
    } else if (key.type === "currencyAmount") {
      key.displayCurrency && key.displayCurrency.forEach((_currency) => {
        if (key.isConverter && key.displayUnits.length) {
          key.displayUnits.forEach((_unit) => {
            let fieldName = key.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase();
            obj[fieldName] = dataObj[fieldName] ? dataObj[fieldName] : 0;
          });
        } else {
          let fieldName = key.fieldName + "_" + _currency.toLowerCase()
          obj[fieldName] = dataObj[fieldName] ? dataObj[fieldName] : 0;
        }
      });
    } else if (key.type === "decimal" || key.type === "percent" || key.type === "formula") {
      obj[key.fieldName] = dataObj[key.fieldName] || dataObj[key.fieldName] === 0 ? dataObj[key.fieldName] : 0;
    } else {
      obj[key.fieldName] = dataObj[key.fieldName] ? dataObj[key.fieldName] : "";
    }
  }
  return obj;
};

export const removeEmptyKeys = (obj: object) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== "" || null || undefined)
  );
};

/**
 * @param {Array} fields
 */
export const yupSchema = (fields: any[], validEmail = true) => {
  const schema = {};
  fields.forEach((input) => {
    if (input.type === "singleLine") {
      schema[input.fieldName] = input.required
        ? yup.string().required(`${input.fieldLabel} is required`)
        : yup.string();
    } else if (input.type === "name") {
      schema[input.fieldName] = input.required
        ? yup
          .string()
          .matches(/^([^0-9]*)$/, "Numbers aren't allowed")
          .required(`${input.fieldLabel} is required`)
        : yup.string().matches(/^([^0-9]*)$/, "Numbers aren't allowed");
    } else if (input.type === "url") {
      schema[input.fieldName] = input.required
        ? yup
          .string()
          .matches(
            /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
            "Enter valid URL"
          )
          .required(`${input.fieldLabel} is required`)
        : yup
          .string()
          .matches(
            /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
            "Enter valid URL"
          );
    } else if (input.type === "mobileNumber") {
      schema[input.fieldName] = input.required
        ? yup
          .string()
          .min(10, "Mobile number is too short")
          .required(`${input.fieldLabel} is required`)
        : yup.string().min(10, "Mobile Number is too short");
    } else if (input.type === "multiSelect") {
      schema[input.fieldName] = input.required
        ? yup.array().required(`${input.fieldLabel} is required`)
        : yup.array();
    } else if (input.type === "email") {
      schema[input.fieldName] =
        input.required && validEmail
          ? yup.string().email().required(`${input.fieldLabel} is required`)
          : yup.string().email(`${input.fieldLabel} must be a valid email`);
    } else if (input.type === "switch" || input.type === "checkBox") {
      schema[input.fieldName] = input.required
        ? yup.boolean().required(`${input.fieldLabel} is required`)
        : yup.boolean();
    } else if (
      input.type !== "currencyAmount" &&
      (input.type === "converter" || input.isConverter === true)
    ) {
      input.displayUnits && input.displayUnits.forEach((_unit) => {
        schema[input.fieldName + "_" + _unit.toLowerCase()] = input.required
          ? yup.string().required(`${input.fieldLabel} is required`)
          : yup.string();
      });
    } else if (input.type === "currencyAmount") {
      input.displayCurrency && input.displayCurrency.forEach((_currency) => {
        if (input.isConverter && input.displayUnits.length) {
          input.displayUnits.forEach((_unit) => {
            schema[
              input.fieldName +
              "_" +
              _currency.toLowerCase() +
              "_" +
              _unit.toLowerCase()
            ] = input.required
                ? yup.string().required(`${input.fieldLabel} is required`)
                : yup.string();
          });
        } else {
          schema[input.fieldName + "_" + _currency.toLowerCase()] =
            input.required
              ? yup.string().required(`${input.fieldLabel} is required`)
              : yup.string();
        }
      });
    } else if (input.type === "date") {
      schema[input.fieldName] = input.required
        ? yup.string().required(`${input.fieldLabel} is required`).nullable()
        : yup.string().nullable();
    } else {
      schema[input.fieldName] = input.required
        ? yup.string().required(`${input.fieldLabel} is required`)
        : yup.string();
    }
  });

  return yup.object().shape(schema);
};

export const camelCase = (str) => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
};

export const UnCamelCase = (str) => {
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b([A-Z]+)([A-Z])([a-z])/, "$1 $2$3")
    .replace(/^./, function (str) {
      return str.toUpperCase();
    });
};

export const isObjectEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

export const currencyCodeToSymbol = (currencyCode) => {
  return currencies.filter((obj) => obj.currencyCode === currencyCode)[0]
    .symbolNative;
};

// Function To Set Owner DataSource
export const getOwnerDropdownDataSource = (
  selectedCollaborator,
  mainDataSource
) => {
  if (!selectedCollaborator || selectedCollaborator.length === 0) {
    return mainDataSource;
  } else {
    const ownerDataSource = [];

    mainDataSource.map((d) => {
      const isCollaboratorSelected = selectedCollaborator.find(
        (collaboratorId) => collaboratorId === d.optionValue
      );
      if (!isCollaboratorSelected) {
        ownerDataSource.push(d);
      }
    });
    return ownerDataSource;
  }
};

// Function To Set Collaborator DataSource
export const getCollaboratorDropdownDataSource = (
  selectedOwnerId,
  mainDataSource
) => {
  return selectedOwnerId
    ? mainDataSource.filter((d) => d.optionValue !== selectedOwnerId)
    : mainDataSource;
};

export const initializeDropdownById = (field, fieldName, id) => {
  if (
    field.fieldData.fieldName === fieldName &&
    field.fieldData.option &&
    field.fieldData.option.length > 0
  ) {
    let options = field.fieldData.option;

    options.forEach((d) => {
      d.default = d.optionValue === id;
    });

    field.fieldData.option = options;
  }

  return field;
};
export const dateFormat = "MM/DD/YYYY";
export const dateTimeFormat = "MM/DD/YYYY hh:mm A";
export const cardDateFormat = "MMM,DD YYYY";

export const dateFormatForInputControl = "MM/dd/yyyy";
// export const dateTimeFormat = "MM/dd/yyyy hh:mm A"
// export const cardDateFormat = "MMM,dd yyyy"

export const yyyyMMDD = (dateToBeFormatted) => {
  return dateToBeFormatted
    ? moment(dateToBeFormatted).format(cardDateFormat)
    : dateToBeFormatted;
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
  Delete: forwardRef((props: any, ref: any) => (
    <DeleteOutline {...props} ref={ref} />
  )),
  DetailPanel: forwardRef((props: any, ref: any) => (
    <ChevronRight {...props} ref={ref} />
  )),
  Edit: forwardRef((props: any, ref: any) => <Edit {...props} ref={ref} />),
  Export: forwardRef((props: any, ref: any) => (
    <SaveAlt {...props} ref={ref} />
  )),
  Filter: forwardRef((props: any, ref: any) => (
    <FilterList {...props} ref={ref} />
  )),
  FirstPage: forwardRef((props: any, ref: any) => (
    <FirstPage {...props} ref={ref} />
  )),
  LastPage: forwardRef((props: any, ref: any) => (
    <LastPage {...props} ref={ref} />
  )),
  NextPage: forwardRef((props: any, ref: any) => (
    <ChevronRight {...props} ref={ref} />
  )),
  PreviousPage: forwardRef((props: any, ref: any) => (
    <ChevronLeft {...props} ref={ref} />
  )),
  ResetSearch: forwardRef((props: any, ref: any) => (
    <Clear {...props} ref={ref} />
  )),
  Search: forwardRef((props: any, ref: any) => <Search {...props} ref={ref} />),
  SortArrow: forwardRef((props: any, ref: any) => (
    <ArrowDownward {...props} ref={ref} />
  )),
  ThirdStateCheck: forwardRef((props: any, ref: any) => (
    <Remove {...props} ref={ref} />
  )),
  ViewColumn: forwardRef((props: any, ref: any) => (
    <ViewColumn {...props} ref={ref} />
  )),
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

export const getPermissions = (
  user,
  selectedEntity = undefined
): IPermission | null => {
  if (user) {
    let permissions = {};
    let data = [...user?.role?.sideBar];

    if (selectedEntity) {
      if (user?.entity && user?.entity.length && selectedEntity) {
        data = [
          ...data,
          ...user?.entity.find((entityObj) => entityObj._id === selectedEntity)
            ?.resource,
        ];
      }
    } else {
      if (user?.role?.selectedEntity) {
        data = [...data, ...user?.role?.selectedEntity?.resource];
      }
    }

    if (data) {
      const hasApproveAccountPermission = user.user.permissions.approveAccount;
      const accounts = [
        sidebarResource.customerAccount,
        sidebarResource.supplierAccount,
      ];

      const sidebarFieldsKeys = Object.keys(sidebarResource);
      const sidebarFieldsValues = Object.values(sidebarResource);

      data.forEach((d) => {
        const indexOfPermission = sidebarFieldsValues.indexOf(d.name);

        if (indexOfPermission > -1) {
          let permission = {
            isCreate: d.isCreate,
            isRead: d.isRead,
            isUpdate: d.isUpdate,
            isDelete: d.isDelete,
          };

          if (accounts.some((acountType) => acountType === d.name)) {
            permission["approveAccount"] = hasApproveAccountPermission;
          }

          permissions[sidebarFieldsKeys[indexOfPermission]] = permission;
        }
      });
    }

    return permissions;
  }
};

export const downloadExcel = (fileDetails, fileName) => {
  const extension = `.${fileName.split(".").pop()}`;
  let type = null;

  switch (extension) {
    case ".xlsx":
      type =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      break;

    default:
      break;
  }

  const blob = new Blob([fileDetails as any], { type: type });

  //Check the Browser type and download the File.
  const isIE = false || !!document["documentMode"];
  if (isIE) {
    window.navigator.msSaveBlob(blob, fileName);
  } else {
    var url = window.URL || window.webkitURL;
    let link = url.createObjectURL(blob);
    var a = document.createElement("a");
    a.setAttribute("download", fileName);
    a.setAttribute("href", link);
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
      //     if (Array.isArray(newObj[fieldData.fieldName])) {
      //         newObj[fieldData.fieldName] = obj[fieldData.fieldName].join(", ");
      //     } else {
      //         newObj[fieldData.fieldName] = "";
      //     }
      // } else if (
      if (fieldData.type === "switch" || fieldData.type === "checkBox") {
        newObj[fieldData.fieldName] = obj[fieldData.fieldName]
          ? "Active"
          : "Inactive";
      } else {
        newObj[fieldData.fieldName] = obj[fieldData.fieldName]
          ? obj[fieldData.fieldName]
          : "";
      }
    }
  }
  return newObj;
};

export const getUniqueCurrencies = () => {
  return uniqBy(currencies, "currencyCode");
}

export const formatAmountWithCurrency = (currencyCode, amount) => {
  if ((!currencyCode && !amount) || !amount || isNaN(amount)) {
    return {
      shortFormatAmount: "", fullFormatAmount: "", fullFormatAmountWithCurrencyName: ""
    }
  }

  const filterCountries = currencies.filter(
    (data) => data?.currencyCode === currencyCode
  );

  //  Make default language "en"
  let language = "en";

  if (filterCountries.length === 0) {
    return {
      shortFormatAmount: new Intl.NumberFormat(language, {
        notation: "compact",
        compactDisplay: "short",
      }).format(amount).replace(/^(\D+)/, "$1 "),
      fullFormatAmount: new Intl.NumberFormat(language, {
        notation: "compact",
        compactDisplay: "short",
      }).format(amount).replace(/^(\D+)/, "$1 "),
      fullFormatAmountWithCurrencyName: new Intl.NumberFormat(language, {
        style: 'currency',
        currencyDisplay: "code"
      }).format(amount).replace(/^(\D+)/, "$1 "),
    };
  }

  let currencyData = filterCountries[0];
  let combinedAllLanguages = filterCountries[0].languages;

  if (filterCountries.length > 1) {
    combinedAllLanguages = [...new Set(filterCountries.map(m => m.languages).flat())];

    switch (currencyCode) {
      case "AUD":
        currencyData = filterCountries.find(f => f.country === "Australia");
        break;

      case "CHF":
        currencyData = filterCountries.find(f => f.country === "Switzerland");
        break;

      case "EUR":
        currencyData = filterCountries.find(f => f.country === "France");
        break;

      case "GBP":
        currencyData = filterCountries.find(f => f.country === "United Kingdom");
        break;

      case "NOK":
        currencyData = filterCountries.find(f => f.country === "Norway");
        break;

      case "NZD":
        currencyData = filterCountries.find(f => f.country === "New Zeland");
        break;

      case "XAF":
        currencyData = filterCountries.find(f => f.country === "Cameroon");
        break;

      case "XCD":
        currencyData = filterCountries.find(f => f.country === "Dominica");
        break;

      case "XOF":
        currencyData = filterCountries.find(f => f.country === "Benin");
        break;

      case "XPF":
        currencyData = filterCountries.find(f => f.country === "French Polynesia");
        break;
    }

    //  just for safe side, if no record found, change the value to initial state;
    if (!currencyData) {
      currencyData = filterCountries[0];
    }

    currencyData.languages = [...new Set(filterCountries.map(m => m.languages).flat())];
  }

  // Check if that currency's country has multiple language,
  //  And if it has "en", then pick that one, or else take first of the array of languages
  if (
    currencyData.languages.length > 0 &&
    currencyData.languages.some((d) => d !== language)
  ) {
    language = currencyData.languages[0];
  }

  let options = {
    style: "currency",
    currency: currencyCode,
  };

  if (Number.isInteger(amount)) {
    options["maximumFractionDigits"] = 0;
  }

  //  For example I am formatting this value - 9876543210 then
  //  shortFormatAmount will be like this - 9.9 billion
  //  fullFormatAmount will be like this - 9,876,543,210

  return {
    shortFormatAmount: new Intl.NumberFormat(
      `${language}-${currencyData.countryCode}`, {
      notation: "compact",
      compactDisplay: "short",
      ...options
    }).format(amount).replace(/^(\D+)/, "$1 "),
    fullFormatAmount: new Intl.NumberFormat(
      `${language}-${currencyData.countryCode}`,
      options
    ).format(amount).replace(/^(\D+)/, "$1 "),
    fullFormatAmountWithCurrencyName: new Intl.NumberFormat(
      `${language}-${currencyData.countryCode}`, {
      currencyDisplay: "code",
      ...options
    }).format(amount).replace(/^(\D+)/, "$1 "),
  }
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
    randomSeed: 2,
  },
  interaction: {
    hover: true,
    navigationButtons: true,
    keyboard: true,
  },
  nodes: {
    fixed: {
      x: false,
      y: false,
    },
    shape: "dot",
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
    shadow: true,
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
      to: { enabled: false, scaleFactor: 1, type: "arrow" },
      // middle: { enabled: false, scaleFactor: 1, type: "arrow" },
      from: { enabled: true, scaleFactor: 1, type: "arrow" },
    },
    smooth: {
      type: "continuous",
      roundness: 0,
    },
    shadow: true,
  },
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
  const fieldsInAscendingOrder = orderBy(fieldsToOrder, ["order", "asc"]);

  fieldsInAscendingOrder.forEach((field) => {
    if (!sections.includes(field.sectionName)) {
      sections.push(field.sectionName);
    }
  });

  const customData = sections.map((name) => {
    let fields = fieldsInAscendingOrder.filter(
      (field) => field.sectionName === name
    );

    const sectionFields = fields.map((formData) => formData);
    return { name, sectionFields };
  });

  return customData;
};

export const generateUniqueId = () => {
  return `id-${new Date().getTime()}`;
};
