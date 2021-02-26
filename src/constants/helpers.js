import { checkEmailExist, GetFields } from '../axios/index'
export const getObjKeys = (val = "", arr) => {
    const obj = {};
    for (const key of arr) {
        console.log(key)
        if (key.type === "dropDown") {
            obj[key.fieldName] = val ? val : key.option ? key.option[0].optionLabel;
        } else if (key.type === "multiSelect") {
            obj[key.fieldName] = val ? val : [];
        } else if (key.type === "switch") {
            obj[key.fieldName] = val ? val : false;
        } else {
            obj[key.fieldName] = val;
        }
    }

    return obj;
};

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