import NoDataCell from 'src/components/Helpers/NoDataCell';

const LookupCell = ({ field, original }) => {
  let text = Array.isArray(original[field.fieldName])
    ? original[field.fieldName]?.map((e) => e?.optionLabel)?.toString()
    : typeof original[field.fieldName] === 'string'
      ? original[field.fieldName]
      : '';

  const key = `rest${field.fieldName}`;

  if (Array.isArray(original[key])) text += `,${original[key]?.map((e) => e?.optionLabel)?.toString()}`;

  if (typeof original[key] === 'string') text += original[key];

  return (
    <div>
      <h5 className="text-truncate" title={text}>
        {text ? text : <NoDataCell />}
      </h5>
    </div>
  );
};

export default LookupCell;
