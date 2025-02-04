import { memo, useMemo } from 'react';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const LookupCellImpl = ({ field, original }) => {
  const text = useMemo(() => getText({ original, field }), [field, original]);
  return (
    <div>
      <h5 className="text-truncate" title={text}>
        {text ? text : <NoDataCell />}
      </h5>
    </div>
  );
};

const LookupCell = memo(LookupCellImpl);
export default LookupCell;

const getText = ({ original, field }) => {
  const key = `rest${field.fieldName}`;
  let text = Array.isArray(original[field.fieldName])
    ? original[field.fieldName]?.map((e) => e?.optionLabel)?.toString()
    : typeof original[field.fieldName] === 'string'
      ? original[field.fieldName]
      : '';

  if (Array.isArray(original[key])) text += `,${original[key]?.map((e) => e?.optionLabel)?.toString()}`;

  if (typeof original[key] === 'string') text += original[key];

  return text;
};
