import { useMemo } from 'react';
import FieldList from 'src/components/FormBuilder/FieldList';
import { OPERATION_ON_LINE_ITEMS } from 'src/components/FormBuilder/helper';
import { formatAmountWithCurrency } from 'src/constants/helpers';

const FinalPriceBox = ({ allFields, data }) => {


  const fields = useMemo(() => {
    return allFields?.filter((f) => f?.fieldData?.type === FieldList.PERCENT.type
      && Object.values(OPERATION_ON_LINE_ITEMS)?.includes(f?.fieldData?.operationOnLineItems));
  }, [allFields]);

  return (
    <>
      {fields && fields?.length > 0 && data?.finalAmount ? (
        <div className="flex w-full items-center justify-end">
          <div className="p-2">
            <div className="flex items-center justify-between">
              <p>Sub Total : </p>
              <p>{formatAmountWithCurrency(data?.currency, data?.subTotal || 0)?.fullFormatAmount || ''}</p>
            </div>
            {fields?.map((f) => {
              return (
                <div className="flex items-center justify-between">
                  <p>{f?.fieldData?.fieldLabel} : </p>
                  <p>{formatAmountWithCurrency(data?.currency, data[`${f?.fieldData?.fieldName}Amount`] || 0)?.fullFormatAmount || ''}</p>
                </div>
              );
            })}
            <div className="flex items-center justify-between">
              <p>Total : </p>
              <p>{formatAmountWithCurrency(data?.currency, data?.finalAmount || 0)?.fullFormatAmount || ''}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default FinalPriceBox;
