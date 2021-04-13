import { forwardRef } from "react";
import { checkEmailExist } from "../axios/index";
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
} from "@material-ui/icons";
import * as yup from "yup";
import moment from "moment";

export const accountTemplateFileName = "Accounts-Template.xlsx";
export const accountImportErrorFileName = "Accounts-Errors.xlsx";

export const contactTemplateFileName = "Contacts-Template.xlsx";
export const contactImportErrorFileName = "Contacts-Errors.xlsx";

export const leadTemplateFileName = "Leads-Template.xlsx";
export const leadImportErrorFileName = "Leads-Errors.xlsx";

export const opportunityTemplateFileName = "Opportunities-Template.xlsx";
export const opportunityImportErrorFileName = "Opportunities-Errors.xlsx";

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
  quoteBuilder: "Quote Builder",
  reminder: "Reminder",
  calendar: "Calendar",
  flags: "Flags",
  lead: "Lead",
  opportunity: "Opportunity",
};

export const lead = {
  leadResource: "lead", //  Key of sidebar object
  leadApi: "/lead"
};

export const opportunity = {
  opportunityResource: "opportunity", //  Key of sidebar object
  opportunityApi: "/opportunity"
};

export const supplierAccount = {
  accountApi: "supplier-account",
  accountRoute: "supplier-account",
  accountResource: "supplierAccount", //  Key of sidebar object
  accountPermission: "Supplier Account",
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

export const getObjKeys = (val: string | boolean = "", arr: any[]) => {
  const obj = {};
  for (const key of arr) {
    if (key.type === "dropDown") {
      const option = key.option?.find((data: any) => data.default === true);
      obj[key.fieldName] = val ? val : option ? option.optionValue : "";
    } else if (key.type === "multiSelect") {
      const defaultOptions = key.option?.filter(
        (item: any) => item.default === true
      );
      const options = defaultOptions?.map((data: any) => data.optionValue);
      obj[key.fieldName] = val ? val : options;
    } else if (key.type === "switch" || key.type === "checkBox") {
      obj[key.fieldName] = val ? val : false;
    } else {
      obj[key.fieldName] = val;
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
      const values = dataObj[key.fieldName].length
        ? dataObj[key.fieldName].map((val: any) => filterValues(val))
        : [];
      obj[key.fieldName] = values;
    } else if (key.type === "dropDown") {
      const value = filterValues(dataObj[key.fieldName]);
      obj[key.fieldName] = value ? value : "";
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

const isEmailExist = async (email) => {
  const { data } = await checkEmailExist(email);

  if (data === true) {
    return true;
  } else {
    return false;
  }
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
          .url("Enter valid url eg. https://www.hostname.com")
          .required(`${input.fieldLabel} is required`)
        : yup.string().url("Enter valid url eg. https://www.hostname.com");
    } else if (input.type === "mobileNumber") {
      schema[input.fieldName] = input.required
        ? yup
          .string()
          .min(10, "Mobile number is too short")
          .required(`${input.fieldLabel} is required`)
        : yup.string().min(10, "Mobile number is too short");
    } else if (input.type === "multiSelect") {
      schema[input.fieldName] = input.required
        ? yup
          .array()
          .required(`${input.fieldLabel} is required`)
          .length(1, "Select at least one service access")
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
      return index == 0 ? word.toLowerCase() : word.toUpperCase();
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
        (collaboratorId) => collaboratorId == d.optionValue
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
    ? mainDataSource.filter((d) => d.optionValue != selectedOwnerId)
    : mainDataSource;
};

export const initializeDropdownById = (field, fieldName, id) => {
  if (
    field.fieldData.fieldName === fieldName &&
    field.fieldData.option &&
    field.fieldData.option.length > 0
  ) {
    let options = field.fieldData.option;

    options.map((d) => {
      d.default = d.optionValue === id;
    });

    field.fieldData.option = options;
  }

  return field;
};
export const yyyyMMDD = (dateToBeFormatted) => {
  return dateToBeFormatted
    ? moment(dateToBeFormatted).format("YYYY-MM-DD")
    : dateToBeFormatted;
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

export const getPermissions = (user, selectedEntity = undefined): IPermission | null => {

  let permissions = {};
  let data = [...user?.role?.sideBar]

  if (selectedEntity) {
    if (user?.entity && user.entity.length && selectedEntity) {
      data = [...data, ...user.entity.find(entityObj => entityObj._id === selectedEntity)?.resource]
    }
  }
  else {
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
};

export const downloadExcel = (fileDetails, fileName) => {
  const extension = `.${fileName.split('.').pop()}`;
  let type = null;
  
  switch (extension) {
    case ".xlsx":
      type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
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
}