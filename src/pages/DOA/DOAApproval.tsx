import { useEffect, useState, useContext, useReducer } from "react";
import { useParams, useHistory } from "react-router-dom";
import ThumbUpIcon from "@material-ui/icons/ThumbUp";
import ThumbDownIcon from "@material-ui/icons/ThumbDown";
import Layout from "../../components/Layout";

import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { Button, Grid, Paper } from "@material-ui/core";
import { GiAbstract055 } from "react-icons/gi";
import { AiOutlineEye } from "react-icons/ai";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import Activity from "../../components/Activity";
import CustomAgGrid from "../../components/AgGridComponents/CustomAgGrid";
import { formatAmountWithCurrency, gridPageSizes } from "../../constants/helpers";
import { camelCase } from "lodash";

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
        rowCount: action.count,
        loading: false,
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
  const toastConfig = useContext(CustomToastContext);
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
    search,
    filters,
    sorting,
    selectedRecords,
  } = state;
  const [sellingPrice, setSellingPrice] = useState(0);
  const [chatid, setChatid] = useState("");
  const [QData, setQData] = useState({});
  const [needDOA, setneedDOA] = useState(false);
  const [PDFName, setPDFName] = useState("");
  const [buttontext, setButton] = useState("Accept");
  const [QStatus, setQStatus] = useState(true);
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
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchQuote = () => {
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
      gridApi.showLoadingOverlay();
    }

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
        setChatid(data.chatter);

        setQData(data);
        if (data.Quote_Status !== "Sent for DOA") {
          setQStatus(false);
        }
      })
      .catch((err) => {
        dispatch({ type: "loading", loading: false });
        console.log(err);
      });
  };

  const QuoteStatusChange = (accepted) => {
    if (accepted) {
      if (needDOA) {
        axiosInstance()
          .post("/doa-request/createParent/" + id)
          .then(({ data }) => {
            history.push("/doa-request");
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        axiosInstance()
          .post("/doa-request/DOAResponse/" + id, { response: "Accepted " })
          .then(({ data }) => {
            history.push("/doa-request");
          })
          .catch((err) => {
            console.log(err);
          });
      }
    } else {
      axiosInstance()
        .post("/doa-request/DOAResponse/" + id, { response: "Rejected" })
        .then(({ data }) => {
          history.push("/doa-request");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const ViewQuote = () => {
    axiosInstance()
      .get("/user/download?fileName=" + PDFName, {
        responseType: "blob",
      })
      .then(({ data }) => {
        console.log(data);
        const file = new Blob([data], { type: "application/pdf" });
        const fileURL = URL.createObjectURL(file);
        const pdfWindow = window.open();
        pdfWindow.location.href = fileURL;
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <Layout>
      <div className="headerbox">
        <CustomBreadCrumbs
          routes={[
            { title: "DOA Requests", path: "/doa-request" },
            { title: id },
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
                {QStatus ? (
                  <>
                    <Button
                      onClick={() => QuoteStatusChange(true)}
                      variant="outlined"
                      size="small"
                      startIcon={<ThumbUpIcon />}
                      color="primary"
                    >
                      {buttontext}
                    </Button>
                    <Button
                      onClick={() => QuoteStatusChange(false)}
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
                  <div className="quoteBox">
                    <span>Total Profit</span>
                    <span title={formatAmountWithCurrency(QData["TotalProfitcurr"], QData["TotalProfitamount"]).fullFormatAmount}>
                      {formatAmountWithCurrency(QData["TotalProfitcurr"], QData["TotalProfitamount"]).shortFormatAmount}
                    </span>
                  </div>
                  <div className="quoteBox">
                    <span>Total Cost Price</span>
                    <span title={formatAmountWithCurrency(QData["TotalCostcurr"], QData["TotalCostamount"]).fullFormatAmount}>
                      {formatAmountWithCurrency(QData["TotalCostcurr"], QData["TotalCostamount"]).shortFormatAmount}
                    </span>
                  </div>
                  <div className="quoteBox">
                    <span>Total Selling Price</span>
                    <span title={formatAmountWithCurrency(QData["TotalSellingPricecurr"], QData["TotalSellingPriceamount"]).fullFormatAmount}>
                      {formatAmountWithCurrency(QData["TotalSellingPricecurr"], QData["TotalSellingPriceamount"]).shortFormatAmount}
                    </span>
                  </div>
                  <div className="quoteBox">
                    <span>Total Margin</span>
                    <span title={formatAmountWithCurrency(QData["TotalMargincurr"], QData["TotalMarginamount"]).fullFormatAmount}>
                      {formatAmountWithCurrency(QData["TotalMargincurr"], QData["TotalMarginamount"]).shortFormatAmount}
                    </span>
                  </div>
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
                referenceId: QData["quoteBuilderId"],
                access: true,
              },
            ]}
            handleActivityRefresh={() => {}}
          />
        </Grid>
      </Grid>
    </Layout>
  );
};

export default DOAApproval;
