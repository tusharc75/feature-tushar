import { Box, IconButton, useMediaQuery } from '@mui/material';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { GiVintageRobot } from 'react-icons/gi';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import PreviewDownload from 'src/components/PreviewDownload';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ProductBuilder from '../../components/productBuilder';
import { ACTIVITY_RESOURCE, defaultActivityShow, formatAmountWithCurrency, quoteBuilder, sidebarResource } from '../../constants/helpers';
import DOAReasonDialog from './DOAReasonDialog';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const DOAApproval = () => {
  const {
    state: {
      user: { user: currentUser }
    }
  } = useData();
  const { setToastConfig } = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();

  const { id } = useParams();

  const isSmallScreen = useMediaQuery('(max-width:1300px)');

  const [QData, setQData] = useState(null);
  const [versionData, setVersionData] = useState(null);

  const [needDOA, setneedDOA] = useState(false);
  const [QStatus, setQStatus] = useState(true);
  const [showQuoteStatusChangeDialog, setShowQuoteStatusChangeDialog] = useState(false);
  const [quoteStatusChangeData, setQuoteStatusChangeData] = useState('');
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [totalCost, setTotalCost] = useState(0);
  const [totalSellingPrice, setTotalSellingPrice] = useState(0);
  const [totalMargin, setTotalMargin] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [quoteData, setQuoteData] = useState(null);
  const [productBuilderId, setProductBuilderId] = useState(null);
  const [isAddNewProduct, setIsAddNewProduct] = useState(false);
  const [isAddExistingProduct, setIsAddExistingProduct] = useState(false);
  const [columns, setColumnData] = useState([]);

  useEffect(() => {
    if (id) {
      fetchQuote();
    }
  }, [id]);

  useEffect(() => {
    if (isSmallScreen) {
      setActivityShow(true);
    }
  }, [isSmallScreen]);

  const fetchQuote = () => {
    axiosInstance()
      .get('/quote-builder/getQuotefromDOAId/' + id)
      .then(({ data }) => {
        setQuoteData(data.quote);
        setVersionData(data?.version);
        setProductBuilderId(data?.version?.productBuilderId);
        setQData(data);
        if (data?.version?.status !== 'Sent for DOA') {
          setQStatus(false);
        }
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  const QuoteStatusChange = (accepted, signature, comment) => {
    if (accepted !== 'Rejected') {
      if (needDOA) {
        axiosInstance()
          .post('/doa-request/createParent/' + id)
          .then(({ data }) => {
            history.push('/doa-request');
          })
          .catch((err) => {
            setShowQuoteStatusChangeDialog(false);
          });
      } else {
        axiosInstance()
          .post('/doa-request/doaResponse/' + id, { response: 'Accepted' })
          .then(({ data }) => {
            history.push('/doa-request');
          })
          .catch((err) => {
            setToastConfig(err);
            setShowQuoteStatusChangeDialog(false);
          });
      }
    } else {
      axiosInstance()
        .post('/doa-request/doaResponse/' + id, { response: 'Rejected', comment: comment })
        .then(({ data }) => {
          history.push('/doa-request');
        })
        .catch((err) => {
          setToastConfig(err);
          setShowQuoteStatusChangeDialog(false);
        });
    }
  };

  const productCalculationForDoa = (BuilderData) => {
    const ignoredKeys = ['fields', '_id', 'productId', 'templateFields', 'id', 'string', 'index'];

    let tempTotalCost = 0;
    let tempTotalSellingPrice = 0;
    let tempTotalMargin = 0;
    let tempTotalProfit = 0;

    let tempBuilderData = BuilderData.product?.map((data) => ({
      ...data,
      [`profitPercentPerUnit`]:
        data['profitPercentPerUnit'] === null || data['profitPercentPerUnit'] === undefined ? 0 : data['profitPercentPerUnit'],
      [`commissionPercentPerUnit`]:
        data['commissionPercentPerUnit'] === null || data['commissionPercentPerUnit'] === undefined ? 0 : data['commissionPercentPerUnit'],
      [`totalCostPerUnit_${quoteData.currency.toLowerCase()}`]:
        data[`totalCostPerUnit_${quoteData.currency.toLowerCase()}`] === null ||
        data[`totalCostPerUnit_${quoteData.currency.toLowerCase()}`] === undefined
          ? 0
          : data[`totalCostPerUnit_${quoteData.currency.toLowerCase()}`]
    }));

    const fieldArray = [];
    BuilderData.productFields?.map((data) => fieldArray.push(data));
    BuilderData.priceTemplate?.map((data) => data['fields'].map((d) => fieldArray.push(d)));
    BuilderData.productTemplate?.map((data) => data['fields'].map((d) => fieldArray.push(d)));
    tempBuilderData.forEach((quoteRows: { [x: string]: any }, i) => {
      const quoteRowKeys = Object?.keys(quoteRows);
      quoteRowKeys.forEach((key) => {
        if (ignoredKeys.indexOf(key) === -1) {
          let indexkey = key;
          let currency = '';
          if (key.includes('_')) {
            let splitKey = key.split('_');
            key = splitKey[0];
            currency = splitKey[1].toUpperCase();
          }

          if (currency === quoteData?.currency && key === 'totalCost') {
            tempTotalCost = tempTotalCost + quoteRows[indexkey];
          } else if (currency === quoteData?.currency && key === 'totalSalesPrice') {
            tempTotalSellingPrice = tempTotalSellingPrice + quoteRows[indexkey];
          } else if (currency === quoteData?.currency && key === 'totalProfit') {
            tempTotalProfit = tempTotalProfit + quoteRows[indexkey];
          } else if (currency === quoteData?.currency && key === 'totalMargin') {
            tempTotalMargin = tempTotalMargin + quoteRows[indexkey];
          }
          // }
        }
      });
    });
    setTotalCost(tempTotalCost);
    setTotalSellingPrice(tempTotalSellingPrice);
    setTotalMargin(tempTotalMargin);
    setTotalProfit(tempTotalProfit);
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs
            routes={[
              { title: 'DOA Requests', path: '/doa-request' },
              { title: QData ? `${QData?.quoteName} (V-${versionData?.versionNumber})` : '' }
            ]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <PreviewDownload
              fileName={`${`Quote-${quoteData?.quoteName}-V(${versionData?.versionNumber})`}`}
              resource={sidebarResource.quoteBuilder}
              referenceId={quoteData?._id}
              columns={columns}
              hideDetailButton={true}
              extraQueryParams={{ uniqueId: versionData?._id }}
              defaultColumns={[
                'productName',
                'unit',
                'qty',
                `salesPricePerUnit_${quoteData?.currency?.toLowerCase()}`,
                `totalSalesPrice_${quoteData?.currency?.toLowerCase()}`
              ]}
            />
            {QData && QStatus && QData?.DOA.requestTo.find((u) => u === currentUser._id) ? (
              <>
                <ThemeButton
                  onClick={() => {
                    QuoteStatusChange('Accepted', '', '');
                  }}
                  startIcon={<ThumbUpIcon />}
                  mobileTooltip="Accept"
                  iconForMobile={<ThumbUpIcon />}
                >
                  {'Accept'}
                </ThemeButton>
                <ThemeButton
                  onClick={() => {
                    setQuoteStatusChangeData('Rejected');
                    setShowQuoteStatusChangeDialog(true);
                  }}
                  startIcon={<ThumbDownIcon />}
                  mobileTooltip="Reject"
                  iconForMobile={<ThumbDownIcon />}
                >
                  {'Reject'}
                </ThemeButton>
              </>
            ) : null}
            <ActivityButton referenceId={QData?.quoteBuilderId} resource={ACTIVITY_RESOURCE.quote} resourceLabel={QData?.quoteName} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <div className="quotePanel mb-4 flex flex-wrap items-center gap-1">
          {QData && (
            <>
              <div className="quoteBox">
                <span>Total Profit</span>:{' '}
                <span title={formatAmountWithCurrency(quoteData?.currency, totalProfit).fullFormatAmount}>
                  {formatAmountWithCurrency(quoteData?.currency, totalProfit).fullFormatAmount || 0}
                </span>
              </div>
              <div className="quoteBox">
                <span>Total Cost Price</span>:{' '}
                <span title={formatAmountWithCurrency(quoteData?.currency, totalCost).fullFormatAmount}>
                  {formatAmountWithCurrency(quoteData?.currency, totalCost).fullFormatAmount || 0}
                </span>
              </div>
              <div className="quoteBox">
                <span>Total Selling Price</span>:{' '}
                <span title={formatAmountWithCurrency(quoteData?.currency, totalSellingPrice).fullFormatAmount}>
                  {formatAmountWithCurrency(quoteData?.currency, totalSellingPrice).fullFormatAmount || 0}
                </span>
              </div>
            </>
          )}
          <div></div>
        </div>
        <div className="relative">
          {productBuilderId ? (
            <ProductBuilder
              fromQuote={true}
              permissions={permissions[quoteBuilder.qbResource]}
              hasPermission={false}
              currency={quoteData?.currency}
              productBuilderId={productBuilderId}
              isAddNewProduct={isAddNewProduct}
              setIsAddNewProduct={setIsAddNewProduct}
              isAddExistingProduct={isAddExistingProduct}
              setIsAddExistingProduct={setIsAddExistingProduct}
              refreshProducts={productCalculationForDoa}
              stage={'cost'}
              isPriceBuilder={true}
              Editable={false}
              setColumnData={setColumnData}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </div>
      </Box>
      {showQuoteStatusChangeDialog && (
        <DOAReasonDialog
          reasonDialogOpen={showQuoteStatusChangeDialog}
          handleCloseDialog={() => setShowQuoteStatusChangeDialog(false)}
          QuoteStatusChange={QuoteStatusChange}
          accepted={quoteStatusChangeData}
        />
      )}
    </Box>
  );
};

export default DOAApproval;
