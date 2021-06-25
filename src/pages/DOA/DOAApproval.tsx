import { useEffect, useState, useContext, useReducer } from "react";
import { useParams, useHistory } from "react-router-dom";
import ThumbUpIcon from "@material-ui/icons/ThumbUp";
import ThumbDownIcon from "@material-ui/icons/ThumbDown";
import Layout from "../../components/Layout";

import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { Button, Dialog, Grid, IconButton, Paper, Tooltip, Typography } from "@material-ui/core";
import { GiAbstract055, GiVintageRobot } from "react-icons/gi";
import { AiOutlineEye } from "react-icons/ai";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import Activity from "../../components/Activity";
import CustomAgGrid from "../../components/AgGridComponents/CustomAgGrid";
import PerformanceTuningImg from "../../assets/PerformanceTuning.png";
import {
  CustomDialogTransition,
  formatAmountWithCurrency,
  gridPageSizes,
} from "../../constants/helpers";
import { camelCase } from "lodash";
import { useData } from "../../StateProvider/Provider";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import { isMobile, isTablet } from "react-device-detect";
import DOAReasonDialog from "./DOAReasonDialog"

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return {
        ...state,
        loading: action.loading,
      };

    case "initialize":
      return {
        ...state,
        dataRows: action.data,
        rowCount: action.count
      };

    case "selection":
      return {
        ...state,
        selectedRecords: action.selectedRecords,
      };

    case "update":
      return {
        ...state,
        dataRows: action.data,
        loading: false,
      };

    case "filter":
      return {
        ...state,
        loading: true,
        filters: action.filters,
        page: 0,
      };

    case "sort":
      return {
        ...state,
        sorting: action.sorting,
        loading: true,
      };

    case "search":
      return {
        ...state,
        search: action.search,
        loading: true,
      };

    case "pageChange":
      return {
        ...state,
        page: action.page,
      };

    case "pageSizeChange":
      return {
        ...state,
        limit: action.limit,
        page: 0,
        loading: true,
      };

    case "complete":
      return {
        ...state,
        loading: false,
      };

    default:
      break;
  }

  return state;
}

const intialState = {
  dataRows: [],
  rowCount: 0,
  loading: false,
  page: 0,
  limit: 25,
  pageSizes: gridPageSizes,
  search: "",
  filters: {},
  sorting: [],
  selectedRecords: [],
};

const DOAApproval = () => {
  const {
    state: {
      user: { user: currentUser },
    },
  } = useData();
  const { setToastConfig } = useContext(CustomToastContext);
  const history = useHistory();
  const { id } = useParams();
  const [columns, setColumns] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const {
    dataRows,
    rowCount,
    loading,
    page,
    limit,
    pageSizes,
  } = state;
  const [sellingPrice, setSellingPrice] = useState(0);
  const [QData, setQData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [needDOA, setneedDOA] = useState(false);
  const [PDFName, setPDFName] = useState("");
  const [buttontext, setButton] = useState("Accept");
  const [QStatus, setQStatus] = useState(true);
  const [doaName, setDoaName] = useState("");
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showQuoteStatusChangeDialog, setShowQuoteStatusChangeDialog] = useState(false);
  const [quoteStatusChangeData, setQuoteStatusChangeData] = useState("");
  var DOALimit = 0;
  var DOAsetup = false;

  useEffect(() => {
    if (id) {
      fetchQuote();
    }
  }, [id]);

  const fetchDOA = (user) => {
    axiosInstance()
      .post("doa-request/limit", { user: user })
      .then(({ data }) => {
        DOAsetup = data.data.doasetup;
        DOALimit = data.data.limit;
        if (DOALimit < data.TotalSellingPrice && DOAsetup) {
          setneedDOA(true);
          setButton("Send for DOA");
        }
        setDoaName(data.data.doaName);
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  const fetchQuote = () => {
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    setLoadingData(true);

    axiosInstance()
      .get("/quote-builder/getQuotefromDOAId/" + id)
      .then(({ data }) => {
        const rows = data.Rows.map((row) => {
          let newKeys = {};
          Object.keys(row).forEach((r) => {
            newKeys[camelCase(r)] = row[r];
          });

          return newKeys;
        });

        setColumns(
          data.Columns.map((col) => ({
            ...col,
            field: camelCase(col.field),
            show: true,
            disbaled: true,
          }))
        );
        dispatch({
          type: "initialize",
          data: rows,
          count: data.Rows.length,
        });
        setSellingPrice(data.TotalSellingPrice);
        fetchDOA(data.Quotedby);
        setPDFName(data.PDF);

        setQData(data);
        if (data.Quote_Status !== "Sent for DOA") {
          setQStatus(false);
        }
        setLoadingData(false);
      })
      .catch((err) => {
        dispatch({ type: "loading", loading: false });
        setToastConfig(err);
        setLoadingData(false);
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
          .post("/doa-request/DOAResponse/" + id, { response: "Accepted" })
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
        .post("/doa-request/DOAResponse/" + id, { response: "Rejected", comment: comment })
        .then(({ data }) => {
          history.push("/doa-request");
        })
        .catch((err) => {
          setToastConfig(err);
          setShowQuoteStatusChangeDialog(false)
        });
    }
  };

  return (
    <Layout>
      <div className="headerbox">
        <CustomBreadCrumbs
          routes={[
            { title: "DOA Requests", path: "/doa-request" },
            { title: doaName ?? id },
          ]}
        />
      </div>
      <Grid container spacing={1} className="detail-container">
        <Grid item xs={12} sm={12} md={8} lg={8}>
          <Paper className="subContainer">
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
                {QData &&
                  QStatus &&
                  QData?.DOA.approveBy.filter((u) => u.user === currentUser._id)
                    .length === 0 ? (
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
                              QData["TotalProfitcurr"],
                              QData["TotalProfitamount"]
                            ).fullFormatAmount
                          }
                        >
                          {
                            formatAmountWithCurrency(
                              QData["TotalProfitcurr"],
                              QData["TotalProfitamount"]
                            ).shortFormatAmount
                          }
                        </span>
                      </div>
                      <div className="quoteBox">
                        <span>Total Cost Price</span>
                        <span
                          title={
                            formatAmountWithCurrency(
                              QData["TotalCostcurr"],
                              QData["TotalCostamount"]
                            ).fullFormatAmount
                          }
                        >
                          {
                            formatAmountWithCurrency(
                              QData["TotalCostcurr"],
                              QData["TotalCostamount"]
                            ).shortFormatAmount
                          }
                        </span>
                      </div>
                      <div className="quoteBox">
                        <span>Total Selling Price</span>
                        <span
                          title={
                            formatAmountWithCurrency(
                              QData["TotalSellingPricecurr"],
                              QData["TotalSellingPriceamount"]
                            ).fullFormatAmount
                          }
                        >
                          {
                            formatAmountWithCurrency(
                              QData["TotalSellingPricecurr"],
                              QData["TotalSellingPriceamount"]
                            ).shortFormatAmount
                          }
                        </span>
                      </div>
                      {/* <div className="quoteBox">
                        <span>Total Margin</span>
                        <span
                          title={
                            formatAmountWithCurrency(
                              QData["TotalMargincurr"],
                              QData["TotalMarginamount"]
                            ).fullFormatAmount
                          }
                        >
                          {
                            formatAmountWithCurrency(
                              QData["TotalMargincurr"],
                              QData["TotalMarginamount"]
                            ).shortFormatAmount
                          }
                        </span>
                      </div> */}
                    </>
                  )}
                  <div></div>
                </Grid>
                <div style={{ height: 500 }}>
                  <CustomAgGrid
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={{}}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    actionWidth={150}
                    allowAction={false}
                    allowSelection={false}
                    loading={loading}
                  />
                </div>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={12} md={4} lg={4}>
          <Activity
            relatedTo={[
              {
                type: "DOA",
                referenceId: QData?.quoteBuilderId,
                access: true,
              },
            ]}
            handleActivityRefresh={() => { }}
          />
        </Grid>
      </Grid>
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
            fullScreen={isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
          >
            <CustomDialogHeader
              title="AI Suggestion"
              onClose={() => {
                setShowAIDialog(false);
              }}
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
    </Layout>
  );
};

export default DOAApproval;
