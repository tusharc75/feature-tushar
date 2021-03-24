import { checkEmailExist } from '../axios/index'
import currencies from "./currency_with_country.json";
import { validateEmail } from '../services/util'
import * as yup from "yup";
// import currencies from "./currency_with_country.json";

export const getObjKeys = (val = "", arr) => {
    const obj = {};
    for (const key of arr) {
        if (key.type === "dropDown") {
            obj[key.fieldName] = val
                ? val
                : key.option?.find((item) => item.default === true);
        } else if (key.type === "currency") {
            obj[key.fieldName] = val
                ? val
                : currencies?.find((item) => item.countryCode === "USA");
        } else if (key.type === "multiSelect") {
            const defaultOptions = key.option?.filter(
                (item) => item.default === true
            );
            obj[key.fieldName] = val ? val : defaultOptions;
        } else if (key.type === "switch" || key.type === "checkBox") {
            obj[key.fieldName] = val ? val : false;
        } else {
            obj[key.fieldName] = val;
        }
    }

    return obj;
};

export const getObjKeysWithValues = (dataObj, arr) => {
    const obj = {}
    for (const key of arr) {
        if (key.type === 'switch' || key.type === 'checkbox') {
            obj[key.fieldName] = dataObj[key.fieldName]
                ? dataObj[key.fieldName]
                : false
        } else if (key.type === 'mutliSelect') {
            obj[key.fieldName] = dataObj[key.fieldName] ? dataObj[key.fieldName] : []
        } else if (key.type === 'dropDown') {
            obj[key.fieldName] = dataObj[key.fieldName] ? dataObj[key.fieldName] : {}
        } else if (key.type === 'currency') {
            obj[key.fieldName] = dataObj[key.fieldName] ? dataObj[key.fieldName] : {}
        } else {
            obj[key.fieldName] = dataObj[key.fieldName] ? dataObj[key.fieldName] : ''
        }
    }
    return obj
}

export const removeObjKey = (obj, key) => {
    delete obj[key];
    return obj;
  };

export const removeEmptyKeys = (obj) => {
    Object.keys(obj).forEach(
        (k) => !obj[k] && obj[k] !== undefined && delete obj[k]
    )
    return obj
}


export const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

export const formValidation = (values, fields) => {
    const emailRegx = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const phoneRegex = /^(\+{0,})(\d{0,})([(]{1}\d{1,3}[)]{0,}){0,}(\s?\d+|\+\d{2,3}\s{1}\d+|\d+){1}[\s|-]?\d+([\s|-]?\d+){1,2}(\s){0,}$/gm;

    const errors = {};
    fields.forEach(async (input) => {
        if (input.required && !values[input.fieldName]) {
            errors[input.fieldName] = `${input.fieldLabel} is required`;
        }

        if (input.type === "multiSelect") {
            if (input.required && !values[input.fieldName].length) {
                errors[input.fieldName] = `${input.fieldLabel} are required`;
            }
        }

        if (input.type === "email") {
            if (input.required && !values[input.fieldName]) {
                errors[input.fieldName] = `${input.fieldLabel} is required`;
            } else if (
                !emailRegx.test(String(values[input.fieldName]).toLowerCase())
            ) {
                errors[input.fieldName] = "Email is not valid";
            } else if (isEmailExist(values[input.fieldName])) {
                errors[input.fieldName] = "Email already exists!";
            }
        }

        if (input.type === "mobileNo") {
            if (input.required && !values[input.fieldName]) {
                errors[input.fieldName] = `${input.fieldLabel} is required`;
            } else if (!phoneRegex.test(values[input.fieldName])) {
                errors[input.fieldName] = "Phone number is not valid";
            }
        }
    });

    return errors;
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
export const yupSchema = (fields, validEmail = true) => {
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
        } else if (input.type === "dropDown") {
            schema[input.fieldName] = input.required
                ? yup.object().required(`${input.fieldLabel} is required`)
                : yup.object();
        } else if (input.type === "currency") {
            schema[input.fieldName] = input.required
                ? yup.object().required(`${input.fieldLabel} is required`)
                : yup.object();
        } else if (input.type === "email") {
            schema[input.fieldName] =
                input.required && validEmail
                    ? yup
                        .string()
                        .email()
                        .required(`${input.fieldLabel} is required`)
                        .test("email", "Email already exist", async function (value) {
                            let isvalidEmail = validateEmail(value);

                            if (isvalidEmail) {
                                const { path, createError, resolve } = this;
                                let { data } = await checkEmailExist(value);
                                if (data) {
                                    return createError({
                                        path,
                                        message: "Email alreday exist",
                                    });
                                }
                                return resolve(true);
                            }
                        })
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

export default function isObjectEmpty(obj) {
    return Object.keys(obj).length === 0;
}
