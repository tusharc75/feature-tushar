import { camelCase } from 'lodash';
import { useMemo } from 'react';
import FieldList from 'src/components/FormBuilder/FieldList';
import { OPERATION_ON_LINE_ITEMS } from 'src/components/FormBuilder/helper';
import { getUniqueCurrencies } from 'src/constants/helpers';

const FinalPriceBox = ({ allFields, data }) => {
  const fields = useMemo(() => {
    return allFields?.filter(
      (f) => f?.fieldData?.type === FieldList.PERCENT.type && Object.values(OPERATION_ON_LINE_ITEMS)?.includes(f?.fieldData?.operationOnLineItems)
    );
  }, [allFields]);

  const currencySymbol = useMemo(
    () => getUniqueCurrencies().find((d) => d.currencyCode === (data?.currency || 'USD'))?.symbolNative,
    [data?.currency]
  );

  return (
    <>
      {fields && fields?.length > 0 ? (
        <div className="flex w-full items-center justify-end">
          <div className="p-2">
            <div className="flex items-center justify-between">
              <p>Sub Total : </p>
              <p>{`${currencySymbol} ${data?.subTotal || 0}`}</p>
            </div>
            {fields?.map((f) => {
              return (
                <div className="flex items-center justify-between">
                  <p>{f?.fieldData?.fieldLabel} : </p>
                  <p>{`${currencySymbol} ${data[`${camelCase(f?.fieldData?.fieldName)}Amount`]}`}</p>
                </div>
              );
            })}
            <div className="flex items-center justify-between">
              <p>Final Amount : </p>
              <p>{`${currencySymbol} ${data?.finalAmount || 0}`}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default FinalPriceBox;
