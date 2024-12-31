import React, { useState, useMemo, useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { GiReceiveMoney } from 'react-icons/gi';
import { LightIcon } from 'src/assets/svg/svgIcons';
import { currencyCodeToSymbol, formatAmountWithCurrency, quotation } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import DashboardModal from 'src/components/DashboardModal';
import { useData } from 'src/StateProvider/Provider';

interface CssObj {
  [index: string]: React.CSSProperties;
}

const styles: CssObj = {
  aiCard: {
    border: '1px solid var(--common-border-color)',
    boxShadow: '0px 5.44444px 27.2222px rgba(0, 0, 0, 0.06)',
    borderRadius: '8px',
    padding: '16px 20px 20px',
    marginTop: 22,
    minHeight: 200
  },
  cardHead: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 18
  },
  chip: {
    boxShadow: `-3px 3px 6px rgba(220, 220, 220, 0.2), 
    3px -3px 6px rgba(220, 220, 220, 0.2), 
    -3px -3px 6px rgba(255, 255, 255, 0.9), 
    3px 3px 8px rgba(220, 220, 220, 0.9), 
    inset 1px 1px 2px rgba(255, 255, 255, 0.3), 
    inset -1px -1px 2px rgba(220, 220, 220, 0.5)`,
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    padding: '6px 10px',
    fontWeight: 400,
    fontSize: '12px',
    lineHeight: '16px',
    maxWidth: 'max-content'
  },
  chipContainer: {
    display: 'grid',
    gap: 9,
    marginTop: 14
  }
};

const QuotationSummeryDialog = ({ quotationData, versionId, onClose }) => {
  const [quotationSummary, setQuotationSummary] = useState({
    totalProfit: null,
    totalcost: null,
    totalsale: null
  });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [redCard, setRedCard] = useState(false);

  const {
    state: { resources }
  }: any = useData();

  useEffect(() => {
    if (quotationData) {
      fetchProductInventory();
    }
  }, [quotationData]);

  const fetchProductInventory = async () => {
    var data: any = [];
    var inventory: any = [];
    var additionalData: any = [];
    const response = await axiosInstance().get(`${quotation.api}/productpackage/${quotationData._id}/${versionId}`);
    const additionalCostResponce = await axiosInstance().get(`${quotation.api}/additionalcost/${quotationData._id}/${versionId}`);
    data = response?.data?.data;
    additionalData = additionalCostResponce?.data?.data || [];
    inventory = data?.inventory ? data?.inventory : [];
    let rows = data.material.filter((e) => e.parentId === null);
    rows = [...rows, ...additionalData];
    const totalFinalPrice = rows
      .filter(
        (f) =>
          !f?.parentId &&
          f?.hasOwnProperty('finalPrice_' + quotationData?.currency?.toLowerCase()) &&
          !isNaN(f['finalPrice_' + quotationData?.currency?.toLowerCase()])
      )
      .reduce((sum, row) => row['finalPrice_' + quotationData?.currency?.toLowerCase()] + sum, 0);
    const totalSupplierPrice = rows
      .filter(
        (f) =>
          !f?.parentId &&
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
          maxWidth: 'sm'
        }}
        modalHead={{
          title: `${resources?.quotation?.titleSingular} Summary`,
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

interface ChipInterface extends React.HTMLAttributes<HTMLDivElement> {
  lebel: string | React.ReactNode;
}

const RenderChip: React.FC<ChipInterface> = ({ lebel, style, ...rest }) => {
  return (
    <div style={{ ...style, ...styles.chip }} {...rest}>
      <LightIcon />
      <span>{lebel}</span>
    </div>
  );
};

export default QuotationSummeryDialog;
