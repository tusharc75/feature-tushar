import { camelCase } from 'lodash';
import { useMemo } from 'react';
import FieldList from 'src/components/FormBuilder/FieldList';
import { OPERATION_ON_LINE_ITEMS } from 'src/components/FormBuilder/helper';
import { formatAmountWithCurrency } from 'src/constants/helpers';

const FinalPriceBox = ({ allFields, data }) => {
  const fields = useMemo(() => {
    return allFields?.filter(
      (f) =>
        f?.fieldData?.type === FieldList.PERCENT.type &&
        Object.values(OPERATION_ON_LINE_ITEMS)?.includes(f?.fieldData?.operationOnLineItems) &&
        data[`${camelCase(f?.fieldData?.fieldName)}Amount`]
    );
  }, [allFields]);

  return (
    <>
      {fields && fields?.length > 0 && data?.finalAmount ? (
        <div className="flex w-full items-center justify-end">
          <div className="w-96 p-3 rounded-lg shadow-lg dark:bg-gray-800"> <div className="text-right mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Sub Total</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{formatAmountWithCurrency(data?.currency, data?.subTotal || 0)?.fullFormatAmount || ''}</span>
            </div>
            {fields?.map((f) => {
              return (<div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">{f?.fieldData?.fieldLabel} {`(${data[f?.fieldData?.fieldName]}%)`}</span>
                <span className={`font-semibold ${f?.fieldData?.operationOnLineItems === OPERATION_ON_LINE_ITEMS.substract ? ` text-red-600` : ` text-gray-900 dark:text-gray-100`}`}>
                  {f?.fieldData?.operationOnLineItems === OPERATION_ON_LINE_ITEMS.substract ? '- ' : ''}
                  {formatAmountWithCurrency(data?.currency, data[`${camelCase(f?.fieldData?.fieldName)}Amount`])?.fullFormatAmount || ''}</span>
              </div>
              );
            })}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-bold text-gray-800 dark:text-gray-200">Total</span>
              <span className="font-extrabold text-gray-900 dark:text-gray-100">{formatAmountWithCurrency(data?.currency, data?.finalAmount || 0)?.fullFormatAmount || ''}</span> </div>
          </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default FinalPriceBox;
