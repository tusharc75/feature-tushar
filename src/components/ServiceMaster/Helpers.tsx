import { array, boolean, number, object, string } from "yup";

export const yupSchemaServiceMaster = (fields: any[]) => {
    const schema = {};
    fields.forEach((input) => {
        if (input.type === 'singleLine') {
            schema[input.fieldName] = input.required ? string().required(`${input.fieldLabel} is required`) : string();
        } else if (input.type === 'multiSelect') {
            schema[input.fieldName] = input.required ? array().min(1, `${input.fieldLabel} is required`) : array();
        } else if (input.type === 'percent' || input.type === 'decimal') {
            schema[input.fieldName] = input.required ? number().required(`${input.fieldLabel} is required`).nullable() : number().nullable();
        }
        else if (input.type === 'number') {
            schema[input.fieldName] = input.required && input?.rangeValidation ?
            number().required(`${input.fieldLabel} is required`).min(Number(input?.minValue), `${input.fieldLabel} should be greater than  ${input?.minValue}`).max(Number(input?.maxValue), `${input.fieldLabel} should be less than  ${input?.maxValue}`).nullable()
            : schema[input.fieldName] = input.required ?
                number().required(`${input.fieldLabel} is required`).nullable()
                : number().nullable();
        }
        else if (input.type === 'switch' || input.type === 'checkBox') {
            schema[input.fieldName] = input.required ? boolean().required(`${input.fieldLabel} is required`) : boolean();
        } else if (input.type === 'date') {
            schema[input.fieldName] = input.required ? string().required(`${input.fieldLabel} is required`).nullable() : string().nullable();
        } else {
            schema[input.fieldName] = input.required ? string().required(`${input.fieldLabel} is required`) : string();
        }
    });

    return object().shape(schema);
};