import { Box } from '@material-ui/core';
import DetailsPage from '../../../components/Shared/DetailsPage';
import axiosInstance from '../../../axios/axiosInstance';
import { useMemo, useState, useContext, useEffect } from 'react';
import { formatAmountWithCurrency } from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';


export default function QuoteDetailPage({
  quoteData,
  selectedEntity,
  ifQuoteApprovedAapproved
}) {
  const [loadingFields, setLoadingFields] = useState(false);
  const [quoteFields, setQuoteFields] = useState([]);
  const toastConfig = useContext(CustomToastContext);

  const getCopyOfQuoteData = useMemo(() => {
    let modifiedData = {};
    if (quoteData) {
      Object.assign(modifiedData, quoteData);
      modifiedData['estimatedAmount'] = formatAmountWithCurrency(modifiedData['currency'], modifiedData['estimatedAmount']).fullFormatAmount;

      modifiedData['invoiceAmount'] = formatAmountWithCurrency(modifiedData['currency'], modifiedData['invoiceAmount']).fullFormatAmount;
    }
    return modifiedData;
  }, [quoteData?.accountName, quoteData?.closeDate, quoteData?.estimatedAmount, quoteData?.currency, quoteData?.owner]);

  useEffect(() => {
    if (quoteData._id) {
      getQuoteFields();
    }
  }, [quoteData._id]);

  const getQuoteFields = () => {
    if (selectedEntity) {
      setLoadingFields(true);
      axiosInstance()
        .get(`/field?resource=Quotes&entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          setQuoteFields(data);
          setLoadingFields(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoadingFields(false);
        });
    }
  };

  return (
    <div className={`position-relative`}>
      {quoteData && (
        <>
          {!loadingFields && quoteFields ? (
            <DetailsPage
              data={getCopyOfQuoteData}
              fields={!ifQuoteApprovedAapproved ? quoteFields.filter((_f) => _f.fieldData.sectionName !== 'Post-Quote Information') : quoteFields}
            />
          ) : <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>}
        </>
      )}
    </div>
  );
}
