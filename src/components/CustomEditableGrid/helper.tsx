import { object, string, array, boolean, number } from 'yup';

export const yupSchemaForBulkEdit = (fields: any[], values: any[]) => {
    const schema = {};
    values.forEach((element) => {
        fields.forEach((input) => {
            if (input.type === 'singleLine') {
                schema[`${element._id}_${input.fieldName}`] = input.required ? string().required(`${input.fieldLabel} is required`) : string();
            } else if (input.type === 'name') {
                schema[`${element._id}_${input.fieldName}`] = input.required
                    ? string()
                        .matches(/^([^0-9]*)$/, "Numbers aren't allowed")
                        .required(`${input.fieldLabel} is required`)
                    : string().matches(/^([^0-9]*)$/, "Numbers aren't allowed");
            } else if (input.type === 'multiSelect') {
                schema[`${element._id}_${input.fieldName}`] = input.required ? array().min(1, `${input.fieldLabel} is required`) : array();
            } else if (input.type === 'percent' || input.type === 'number' || input.type === 'decimal') {
                schema[`${element._id}_${input.fieldName}`] = input.required ? number().required(`${input.fieldLabel} is required`).nullable() : number().nullable();
            } else if (input.type === 'switch' || input.type === 'checkBox') {
                schema[`${element._id}_${input.fieldName}`] = input.required ? boolean().required(`${input.fieldLabel} is required`) : boolean();
            } else if (input.type !== 'currencyAmount' && (input.type === 'converter' || input.isConverter === true)) {
                input.displayUnits &&
                    input.displayUnits.forEach((_unit) => {
                        schema[`${element._id}_${input.fieldName}_${_unit.toLowerCase()}`] = input.required
                            ? number().required(`${input.fieldLabel} is required`).nullable()
                            : number().nullable();
                    });
            } else if (input.type === 'currencyAmount') {
                input.displayCurrency &&
                    input.displayCurrency.forEach((_currency) => {
                        if (input.isConverter && input.displayUnits.length) {
                            input.displayUnits.forEach((_unit) => {
                                schema[`${element._id}_${input.fieldName}_${_currency.toLowerCase()}_${_unit.toLowerCase()}`] = input.required
                                    ? number().required(`${input.fieldLabel} is required`).nullable()
                                    : number().nullable();
                            });
                        } else {
                            schema[`${element._id}_${input.fieldName}_${_currency.toLowerCase()}`] = input.required
                                ? number().required(`${input.fieldLabel} is required`).nullable()
                                : number().nullable();
                        }
                    });
            } else if (input.type === 'date') {
                schema[`${element._id}_${input.fieldName}`] = input.required ? string().required(`${input.fieldLabel} is required`).nullable() : string().nullable();
            } else {
                schema[`${element._id}_${input.fieldName}`] = input.required ? string().required(`${input.fieldLabel} is required`) : string();
            }
        });
    });
    return object().shape(schema);
};