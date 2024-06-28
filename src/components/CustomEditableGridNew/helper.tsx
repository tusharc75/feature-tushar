
export const yupSchemaForBulkEdit = (fields: any[], values: any[]) => {
	const schema = {};
	values.forEach((element) => {
		fields.forEach((input) => {
			if (['singleLine', 'multiLine', 'percent', 'currencyAmount', 'dropDown', 'multiSelect', 'decimal', 'checkBox', 'date', 'dateTime']?.includes(input?.type) && input.required && !Boolean(element[`${input.fieldName}`])) {
				schema[`${element._id}_${input.fieldName}`] = `${input.fieldLabel} is required`;
			}
		});
	});
	return schema;
};