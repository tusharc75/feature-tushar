
export const yupSchemaForBulkEdit = (fields: any[], values: any[]) => {
    const schema = {};
    values.forEach((element) => {
        fields.forEach((input) => {
            if (input.required && !Boolean(element[`${input.fieldName}`])) {
                schema[`${element._id}_${input.fieldName}`] = `${input.fieldLabel} is required`;
            }
        });
    });
    return schema;
};