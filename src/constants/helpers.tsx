import { checkEmailExist } from "../axios/index";
import { validateEmail } from "../services/util";
import * as yup from "yup";

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
    if (key.type === "switch" || key.type === "checkbox") {
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
  Object.keys(obj).forEach(
    (k) =>
      obj[k] !== false && obj[k] === "" && obj[k] !== undefined && delete obj[k]
  );
  return obj;
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
    } else if (input.type === "mobileNumber") {
      schema[input.fieldName] = input.required
        ? yup
            .string()
            .min(10, "Mobile number is too short")
            .required(`${input.fieldLabel} is required`)
        : yup.string().min(10, "Mobile number is too short");
    } else if (input.type === "number") {
      schema[input.fieldName] = input.required
        ? yup
            .number()
            .required(`${input.fieldLabel} is required`)
            .positive()
            .integer()
        : yup.number().positive().integer();
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
          ? yup
              .string()
              .email()
              .required(`${input.fieldLabel} is required`)
              // .test("email", "Email already exist", async function (value) {
              //   let isvalidEmail = validateEmail(value);

              //   if (isvalidEmail) {
              //     const { path, createError, resolve } = this;
              //     let { data } = await checkEmailExist(value);
              //     if (data) {
              //       return createError({
              //         path,
              //         message: "Email alreday exist",
              //       });
              //     }
              //     return resolve(true);
              //   }
              // })
          : yup.string().email();
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
