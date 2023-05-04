import { useEffect, useState, useContext, useReducer, Fragment } from "react";
import { useParams, useHistory } from "react-router-dom";
import ThumbUpIcon from "@material-ui/icons/ThumbUp";
import ThumbDownIcon from "@material-ui/icons/ThumbDown";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { Box, Button, Dialog, Grid, IconButton, Paper, Tooltip, Typography, useMediaQuery, } from "@material-ui/core";
import { GiAbstract055, GiVintageRobot } from "react-icons/gi";
import { AiOutlineEye } from "react-icons/ai";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import Activity from "../../components/Activity";
import PerformanceTuningImg from "../../assets/PerformanceTuning.png";
import {
  CustomDialogTransition,
  formatAmountWithCurrency,
  gridLoadingTimeout,
  gridPageSizes,
  defaultActivityShow,
  quoteBuilder,
  ACTIVITY_RESOURCE
} from "../../constants/helpers";
import { camelCase } from "lodash";
import { useData } from "../../StateProvider/Provider";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import { isMobile, isTablet } from "react-device-detect";
import DOAReasonDialog from "./DOAReasonDialog"
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import ProductBuilder from "../../components/productBuilder";
import Loader from "../../components/Loader";
import ActivityButton from "src/components/Activity/ActivityButton";

const DOAApproval = () => {
  const {
    state: {
      user: { user: currentUser },
    },
  } = useData();
  const { setToastConfig } = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const { id } = useParams();
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const [QData, setQData] = useState(null);
  const [needDOA, setneedDOA] = useState(false);
  const [PDFName, setPDFName] = useState("");
  const [buttontext, setButton] = useState("Accept");
  const [QStatus, setQStatus] = useState(true);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showQuoteStatusChangeDialog, setShowQuoteStatusChangeDialog] = useState(false);
  const [quoteStatusChangeData, setQuoteStatusChangeData] = useState("");
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
  var DOALimit = 0;
  var DOAsetup = false;
  const handleActivityHideShow = () => {
    setActivityShow(!showActivity)
  }
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
      .get("/quote-builder/getQuotefromDOAId/" + id)
      .then(({ data }) => {
        setPDFName(data.PDF);
        setQuoteData(data.quote)
        setProductBuilderId(data?.version?.productBuilderId)
        setQData(data);
        if (data?.version?.status !== "Sent for DOA") {
          setQStatus(false);
        }
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };



  const ViewQuote = () => {
    axiosInstance()
      .get("/user/download?fileName=" + PDFName, {
        responseType: "blob",
      })
      .then(({ data }) => {
        const file = new Blob([data], { type: "application/pdf" });
        const fileURL = URL.createObjectURL(file);
        const pdfWindow = window.open();
        pdfWindow.location.href = fileURL;
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };


  const QuoteStatusChange = (accepted, signature, comment) => {
    if (accepted !== "Rejected") {
      if (needDOA) {
        axiosInstance()
          .post("/doa-request/createParent/" + id)
          .then(({ data }) => {
            history.push("/doa-request");
          })
          .catch((err) => {
            setShowQuoteStatusChangeDialog(false)
          });
      } else {
        axiosInstance()
          .post("/doa-request/doaResponse/" + id, { response: "Accepted" })
          .then(({ data }) => {
            history.push("/doa-request");
          })
          .catch((err) => {
            setToastConfig(err);
            setShowQuoteStatusChangeDialog(false)
          });
      }
    } else {
      axiosInstance()
        .post("/doa-request/doaResponse/" + id, { response: "Rejected", comment: comment })
        .then(({ data }) => {
          history.push("/doa-request");
        })
        .catch((err) => {
          setToastConfig(err);
          setShowQuoteStatusChangeDialog(false)
        });
    }
  };

  const productCalculationForDoa = (BuilderData) => {
    const ignoredKeys = ['fields', '_id', 'productId', 'templateFields', 'id', 'string', 'srno'];

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
    BuilderData.productFields?.map((data) => fieldArray.push(data))
    BuilderData.priceTemplate?.map((data) => data["fields"].map(d => fieldArray.push(d)))
    BuilderData.productTemplate?.map((data) => data["fields"].map(d => fieldArray.push(d)))
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
              { title: "DOA Requests", path: "/doa-request" },
              { title: QData?.quoteName || id },
            ]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <Button
              onClick={() => ViewQuote()}
              variant="outlined"
              size="small"
              startIcon={<AiOutlineEye />}
              color="primary"
            >
              View
            </Button>
            <Tooltip title="AI Suggestion">
              <IconButton
                onClick={() => {
                  setShowAIDialog(true);
                }}
              >
                <GiVintageRobot />
              </IconButton>
            </Tooltip>
            {QData && QStatus &&
              QData?.DOA.requestTo.find((u) => u === currentUser._id) ? (
              <>
                <Button
                  onClick={() => {
                    QuoteStatusChange("Accepted", "", "")
                  }}
                  variant="outlined"
                  size="small"
                  startIcon={<ThumbUpIcon />}
                  color="primary"
                >
                  {buttontext}
                </Button>
                <Button
                  onClick={() => {
                    setQuoteStatusChangeData("Rejected")
                    setShowQuoteStatusChangeDialog(true)
                  }}
                  startIcon={<ThumbDownIcon />}
                  variant="contained"
                  size="small"
                  color="primary"
                >
                  Reject
                </Button>
              </>
            ) : null}
            <ActivityButton referenceId={QData?.quoteBuilderId} resource="DOA" />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Grid container className="detailHeader">
          <Grid
            item
            xs={12}
            md={5}
            sm={6}
            className="d-flex align-items-center gap-1"
          >
            <GiAbstract055 color="primary" />
            <span className="listingHeader">DOA Request</span>
          </Grid>
          <Grid
            item
            xs={12}
            md={7}
            sm={6}
            className="d-flex align-items-center gap-1"
            container
            justify="flex-end"
          >

          </Grid>
        </Grid>
        <Grid container>
          <Grid item xs={12} sm={12} md={12} lg={12} spacing={2}>
            <Grid
              item
              xs={12}
              md={12}
              sm={12}
              className="d-flex align-items-center gap-1 quotePanel"
            >
              {QData && (
                <>
                  <div className="quoteBox">
                    <span>Total Profit</span>
                    <span
                      title={
                        formatAmountWithCurrency(
                          quoteData?.currency,
                          totalProfit
                        ).fullFormatAmount
                      }
                    >
                      {
                        formatAmountWithCurrency(
                          quoteData?.currency,
                          totalProfit
                        ).fullFormatAmount || 0
                      }
                    </span>
                  </div>
                  <div className="quoteBox">
                    <span>Total Cost Price</span>
                    <span
                      title={
                        formatAmountWithCurrency(
                          quoteData?.currency,
                          totalCost
                        ).fullFormatAmount
                      }
                    >
                      {
                        formatAmountWithCurrency(
                          quoteData?.currency,
                          totalCost
                        ).fullFormatAmount || 0
                      }
                    </span>
                  </div>
                  <div className="quoteBox">
                    <span>Total Selling Price</span>
                    <span
                      title={
                        formatAmountWithCurrency(
                          quoteData?.currency,
                          totalSellingPrice
                        ).fullFormatAmount
                      }
                    >
                      {
                        formatAmountWithCurrency(
                          quoteData?.currency,
                          totalSellingPrice
                        ).fullFormatAmount || 0
                      }
                    </span>
                  </div>
                </>
              )}
              <div></div>
            </Grid>
            {productBuilderId ? (
              <ProductBuilder
                fromQuote={true}
                permissions={permissions[quoteBuilder.qbResource]}
                hasPermission={false}
                currency={quoteData?.currency.toLowerCase()}
                productBuilderId={productBuilderId}
                isAddNewProduct={isAddNewProduct}
                setIsAddNewProduct={setIsAddNewProduct}
                isAddExistingProduct={isAddExistingProduct}
                setIsAddExistingProduct={setIsAddExistingProduct}
                refreshProducts={productCalculationForDoa}
                stage={'product'}
                isPriceBuilder={true}
                Editable={false}
              />
            ) : (
              <Loader style={{ minHeight: 300 }} text="Loading..." />
            )}
          </Grid>
        </Grid>
      </Box>
      {
        showAIDialog && (
          <Dialog
            open={showAIDialog}
            aria-labelledby="customized-dialog-title"
            maxWidth="sm"
            onClose={() => {
              setShowAIDialog(false);
            }}
            fullWidth
            fullScreen={fullScreen || (isMobile || isTablet)}
            TransitionComponent={CustomDialogTransition}
          >
            <CustomDialogHeader
              title="AI Suggestion"
              onClose={() => {
                setShowAIDialog(false);
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen(prevState => !prevState)
              }}
              showManimizeMaximize={true}
            />
            <CustomDialogContent>
              <div className="text-align-center">
                <Typography variant="h4">Under Construction </Typography>
                <img
                  src={`${PerformanceTuningImg}`}
                  style={{ height: "300px" }}
                />
              </div>
            </CustomDialogContent>
          </Dialog>
        )
      }
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
