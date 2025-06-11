import { camelCase } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import FieldList from 'src/components/FormBuilder/FieldList';
import { OPERATION_ON_LINE_ITEMS } from 'src/components/FormBuilder/helper';
import { formatAmountWithCurrency } from 'src/constants/helpers';

const FinalPriceBox = ({ allFields, data, childFields = [], material = [] }) => {

  const fields = useMemo(() => {
    return allFields?.filter(
      (f) => f?.fieldData?.type === FieldList.PERCENT.type
        && Object.values(OPERATION_ON_LINE_ITEMS)?.includes(f?.fieldData?.operationOnLineItems)
        && data[`${camelCase(f?.fieldData?.fieldName)}Amount`]
    );
  }, [allFields, data]);

  const [childFieldSum, setChildFieldSum] = useState([]);
  const [subTotal, setSubTotal] = useState(0);

  useEffect(() => {
    const sumFields = []
    childFields?.filter((e) => e?.showTotalInCard)?.forEach((field) => {
      let fieldName = field.fieldName + '_' + (field.displayCurrency[0] || data?.currency)?.toLowerCase();
      const total = material?.filter((f) => f.hasOwnProperty(fieldName) && !isNaN(f[fieldName]))
        .reduce((sum, row) => Number(row[fieldName]) + sum, 0);
      if (total) {
        sumFields.push({ fieldLabel: field?.fieldLabel, total })
      }
    })
    setChildFieldSum(sumFields)

    const subTotalField = `finalPrice_${data?.currency?.toLowerCase()}`
    const subTotalTemp = material?.filter((f) => !f.parentId && f.hasOwnProperty(subTotalField) && !isNaN(f[subTotalField])).reduce((sum, row) => Number(row[subTotalField]) + sum, 0);
    setSubTotal(subTotalTemp)

  }, [childFields, material]);

  return (
    <> {(fields && fields?.length > 0 && data?.finalAmount || childFieldSum?.length > 0) ? (
      <div className="flex w-full items-center justify-end">
        <div className="w-96 p-3 rounded-lg shadow-lg dark:bg-gray-800"> <div className="text-right mb-4">
          {childFieldSum?.map((f) => {
            return (<div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">{f?.fieldLabel}</span>
              <span className={`font-semibold  text-gray-900 dark:text-gray-100`}>
                {formatAmountWithCurrency(data?.currency, f?.total)?.fullFormatAmount || ''}</span>
            </div>
            );
          })}
          {fields?.length > 0 && <>
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
          </>}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-bold text-gray-800 dark:text-gray-200">Total</span>
            <span className="font-extrabold text-gray-900 dark:text-gray-100">{formatAmountWithCurrency(data?.currency, fields?.length ? data?.finalAmount || 0 : subTotal || 0)?.fullFormatAmount || ''}</span>
          </div>
        </div>
        </div>
      </div>
    ) : null}
    </>
  );
};

export default FinalPriceBox;
