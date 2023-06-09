import React, { useState, useContext, useMemo, useEffect } from 'react';
import { Dialog, List, ListItem, ListItemIcon, ListItemText, Box, Checkbox, Button, TextField, CircularProgress, Grid } from '@material-ui/core';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { GiReceiveMoney } from 'react-icons/gi';

import { currencyCodeToSymbol, CustomDialogTransition, formatAmountWithCurrency, quotation, QUOTATION_STATUS } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import DashboardModal, { ModalHead } from 'src/components/DashboardModal';

const QuotationSummeryDialog = ({ quotationData, versionId, onClose }) => {
  const [quotationSummary, setQuotationSummary] = useState({
    totalProfit: null,
    totalcost: null,
    totalsale: null
  });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [redCard, setRedCard] = useState(false);

  useEffect(() => {
    if (quotationData) {
      fetchProductInventory();
    }
  }, [quotationData]);

  const fetchProductInventory = async () => {
    var data: any = [];
    var inventory: any = [];
    const response = await axiosInstance().get(`${quotation.api}/productpackage/${quotationData._id}/${versionId}`);
    data = response?.data?.data;
    inventory = data?.inventory ? data?.inventory : [];
    const rows = data.material.filter((e) => e.parentId === null);
    const totalFinalPrice = rows
      .filter(
        (f) =>
          f?.parentId === null &&
          f?.hasOwnProperty('finalPrice_' + quotationData?.currency?.toLowerCase()) &&
          !isNaN(f['finalPrice_' + quotationData?.currency?.toLowerCase()])
      )
      .reduce((sum, row) => row['finalPrice_' + quotationData?.currency?.toLowerCase()] + sum, 0);
    const totalSupplierPrice = rows
      .filter(
        (f) =>
          f?.parentId === null &&
          f?.hasOwnProperty('supplierPrice_' + quotationData?.currency?.toLowerCase()) &&
          !isNaN(f['supplierPrice_' + quotationData?.currency?.toLowerCase()])
      )
      .reduce((sum, row) => row['supplierPrice_' + quotationData?.currency?.toLowerCase()] + sum, 0);
    setQuotationSummary({
      totalProfit: formatAmountWithCurrency(quotationData?.currency, totalFinalPrice - totalSupplierPrice),
      totalcost: formatAmountWithCurrency(quotationData?.currency, totalSupplierPrice),
      totalsale: formatAmountWithCurrency(quotationData?.currency, totalFinalPrice)
    });
  };

  const findProfitPercentage = (CP, Profit) => {
    let parsedCP = parseInt(CP?.amountWithouCurrencyCode?.replace(/[^0-9]/g, '') ?? 0);
    let profit = parseInt(Profit?.amountWithouCurrencyCode?.replace(/[^0-9]/g, '') ?? 0);
    return ((profit * 100) / parsedCP).toFixed(2);
  };

  const defaultTotalValue = useMemo(() => {
    let result = '0';
    if (quotationData && quotationData?.currency) {
      result = `${currencyCodeToSymbol(quotationData.currency)} 0`;
    }
    return result;
  }, [quotationData]);

  return (
    <>
      <DashboardModal
        handleClose={onClose}
        open={true}
        dialogProps={{
          fullScreen: fullScreen || isMobile || isTablet,
          maxWidth: 'md'
        }}
        modalHead={{
          title: 'Quotation Summary',
          icon: <GiReceiveMoney />,
          fullScreenOption: true
        }}
      >
        <div className="quoteHeader">
          <div className={redCard ? 'quoteBox quoteRed' : 'quoteBox quoteProfit'}>
            <span className="quoteAmount" title={quotationSummary?.totalProfit?.fullFormatAmount}>
              {quotationSummary?.totalProfit?.fullFormatAmount ? quotationSummary?.totalProfit?.fullFormatAmount : defaultTotalValue}{' '}
              {quotationSummary?.totalcost?.fullFormatAmount
                ? `(${findProfitPercentage(quotationSummary?.totalcost, quotationSummary?.totalProfit)} %)`
                : ''}
            </span>
            <div className={'quoteBoxContent'}>
              <span className={'quoteDetailHeading'}>Total Profit </span>
            </div>
          </div>
          <div className="quoteBox quoteCost">
            <span className="quoteAmount" title={quotationSummary?.totalcost?.fullFormatAmount}>
              {quotationSummary?.totalcost?.fullFormatAmount ? quotationSummary?.totalcost?.fullFormatAmount : defaultTotalValue}
            </span>
            <div className={'quoteBoxContent'}>
              <span className={'quoteDetailHeading'}>Total Cost Price </span>
            </div>
          </div>
          {redCard ? (
            <div className="quoteBox quoteRed">
              <div className={'quoteBoxContent'}>
                {' '}
                <span>Total Selling Price </span>
              </div>
              <span className="quoteAmount" title={quotationSummary?.totalsale?.fullFormatAmount}>
                {quotationSummary?.totalsale?.fullFormatAmount ? quotationSummary?.totalsale?.fullFormatAmount : defaultTotalValue}
              </span>
            </div>
          ) : (
            <div className="quoteBox quoteSale">
              <span className="quoteAmount" title={quotationSummary?.totalsale?.fullFormatAmount}>
                {quotationSummary?.totalsale?.fullFormatAmount ? quotationSummary?.totalsale?.fullFormatAmount : defaultTotalValue}
              </span>
              <div className={'quoteBoxContent'}>
                <span className={'quoteDetailHeading'}>Total Selling Price </span>
              </div>
            </div>
          )}
        </div>
      </DashboardModal>
    </>
  );
};

export default QuotationSummeryDialog;
