import React from 'react';
import { makeStyles } from '@material-ui/core';
import DetailsPage from '../../components/Shared/DetailsPage';
import axiosInstance from '../../axios/axiosInstance';
import { useMemo, useState, useContext, useEffect } from 'react';
import { formatAmountWithCurrency } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

const useStyles = makeStyles(() => ({
  detailBox: {
    // border: "1px solid #163340",
  },
  btnHeader: {
    position: 'absolute',
    top: '4px',
    right: '20px'
  }
}));

export default function DeliveryTicketDetailPage(props) {
  const { deliveryTicketData, selectedEntity } = props;
  const classes = useStyles();
  const [loadingFields, setLoadingFields] = useState(false);
  const [DeliveryTicketFields, setQuoteFields] = useState([]);
  const toastConfig = useContext(CustomToastContext);

  const getCopyOfDeliveryTicketData = useMemo(() => {
    let modifiedData = {};
    if (deliveryTicketData) {
      Object.assign(modifiedData, deliveryTicketData);
      modifiedData['estimatedAmount'] = formatAmountWithCurrency(modifiedData['currency'], modifiedData['estimatedAmount']).fullFormatAmount;

      modifiedData['invoiceAmount'] = formatAmountWithCurrency(modifiedData['currency'], modifiedData['invoiceAmount']).fullFormatAmount;
    }
    return modifiedData;
  }, [
    deliveryTicketData?.accountName,
    deliveryTicketData?.closeDate,
    deliveryTicketData?.estimatedAmount,
    deliveryTicketData?.currency,
    deliveryTicketData?.owner
  ]);

  useEffect(() => {
    if (deliveryTicketData._id) {
      getQuoteFields();
    }
  }, [deliveryTicketData._id]);

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
    <div className={`position-relative ${classes.detailBox}`}>
      {deliveryTicketData && (
        <>{!loadingFields && DeliveryTicketFields ? <DetailsPage data={getCopyOfDeliveryTicketData} fields={DeliveryTicketFields} /> : null}</>
      )}
    </div>
  );
}
