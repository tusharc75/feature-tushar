import React, { Suspense, useContext, useEffect, useMemo, useState, useReducer } from 'react'
import { useHistory, useParams, useLocation } from "react-router-dom";
import ReactDOM from "react-dom";
import { Paper, Box, Tabs, Tab, Grid, Button } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { BiFoodMenu } from "react-icons/bi";
import { FaWpforms } from "react-icons/fa";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../../components/DetailsPageHeader";
import DeleteButton from "../../../components/Helpers/DeleteButton";
import Layout from "../../../components/Layout";
import {
  reducer,
  intialState,
} from "../../../components/AgGridComponents/CustomAgGrid";
import { quote, customerAccount, supplierAccount, opportunity, quoteBuilder, yyyyMMDD, formatAmountWithCurrency, gridLoadingTimeout, termsAndCondition } from "../../../constants/helpers";
import Activity from "../../../components/Activity";
import { useData } from "../../../StateProvider/Provider";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import routes from "../../../components/Helpers/Routes";
import axiosInstance from "../../../axios/axiosInstance";
import InfoIcon from "@material-ui/icons/Info";
import Loader from "../../../components/Loader";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import ManageQuoteDialog from "../ManageQuote/ManageQuoteDialog";
import { HiPencil } from 'react-icons/hi';
import { isMobile, isTablet } from "react-device-detect";
const AllVersionStatus = React.lazy(() => import("./AllVersionStatus"));
const QuoteDetailPage = React.lazy(() => import("./QuoteDetailPage"));
const QuoteProcess = React.lazy(() => import("./QuoteProcess/index"));
interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`main-tabpanel-${index}`}
      aria-labelledby={`main-tab-${index}`}
      {...other}
    >
      {children}
    </div>
  );
}

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    "aria-controls": `main-tabpanel-${index}`,
  };
}



export default function QuoteDetail() {

  const history = useHistory();
  const location = useLocation();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();
  const [state, dispatch] = useReducer(reducer, intialState);
  const [quoteData, setQuoteData] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { qbResource, qbApi } = quoteBuilder;
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [columnView, setColumnView] = useState([]);
  const [steps, setSteps] = useState([]);
  const [productBuilderId, setProductBuilderId] = useState("");
  const [versionStatus, setVersionStatus] = useState("Building Quote");
  const [processStatus, setProcessStatus] = useState("New");
  const [updatingVersion, setUpdatingVersion] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [quoteReOpening, setQuoteReOpening] = useState(false);

  const [showActivity, setActivityShow] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const handleMainTabChange = (
    event: React.ChangeEvent<{}>,
    newValue: number
  ) => {
    setTabValue(newValue);
  };

  const { id } = useParams();
  const handleActivityHideShow = () => {
    setActivityShow(!showActivity)
  }
  useEffect(() => {
    if (id) {
      if (location.state !== undefined) {
        setTabValue(location.state?.tabValue);
        fetchQuoteData(parseInt(location.state?.versionNumber));
      }
      else {
        fetchQuoteData(0);
      }

      fetchTermsAndConditions()
    }
  }, [id]);

  useEffect(() => {
    if (quoteData && quoteData.versions[currentVersion].acceptedColumns) {
      setColumnView(quoteData.versions[currentVersion].acceptedColumns)
    }
  }, [currentVersion])


  const getMainPoints = useMemo(() => {
    let mainPoint = {};
    if (quoteData) {
      mainPoint["Account Name"] = quoteData?.accountName?.optionLabel || "";
      mainPoint["Expiry Date"] = yyyyMMDD(quoteData?.closeDate);
      mainPoint["Estimated Amount"] = quoteData?.estimatedAmount
        ? formatAmountWithCurrency(quoteData?.currency, quoteData?.estimatedAmount)
          .shortFormatAmount
        : "";
      mainPoint["Quote Owner"] = quoteData?.owner?.optionLabel || "";
    }
    return mainPoint;
  }, [quoteData?.accountName, quoteData?.closeDate, quoteData?.estimatedAmount, quoteData?.currency, quoteData?.owner,]);

  const ifQuoteApproved = useMemo(() => {
    let approved = false;
    let disapproved = false;
    let versionApproved = currentVersion;
    let versionDisapproved = currentVersion;
    let manualApproval = false;
    let manualDispproval = false;

    if (quoteData) {
      Object.keys(quoteData.versions).forEach((v) => {
        if (quoteData.versions[v]?.status.includes("Accepted by Customer") || quoteData.versions[v]?.status === "Booked by Customer") {
          approved = true;
          versionApproved = Number(v);
          manualApproval = quoteData.versions[v]?.customerResponse?.manual;
        }
        if (quoteData.versions[v]?.status.includes("Rejected by Customer") || quoteData.versions[v]?.status.includes("Not Booked by Customer") || quoteData.versions[v]?.status.includes("Invalid by Customer")) {
          disapproved = true;
          versionDisapproved = Number(v);
          manualDispproval = quoteData.versions[v]?.customerResponse?.manual;
        }
      });
    }
    return {
      approved,
      versionApproved,
      disapproved,
      versionDisapproved,
      manualApproval,
      manualDispproval
    };
  }, [quoteData?.versions]);

  const handleChangeVersionFromAllVersion = (versionNumber) => {
    setCurrentVersion(versionNumber)
    setTabValue(2)
  }

  const handleChangeVersion = (event) => {
    setCurrentVersion(parseInt(event.target.value));
    setProductBuilderId(quoteData["versions"][event.target.value]["productBuilderId"]);
    setVersionStatus(quoteData["versions"][event.target.value]["status"]);
    setProcessStatus(quoteData["versions"][event.target.value]["processStatus"]);
  };
  const handleClone = () => {
    axiosInstance()
      .post(`${qbApi}/clone/${quoteData._id}`)
      .then(({ data }) => {
        history.push(`${routes.quoteBuilder.path}/detail/${data.data._id}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleSetSteps = (steps) => {
    setSteps(steps);
  };


  const fetchQuoteData = (version: any) => {
    if (selectedEntity) {
      setLoading(true);
      axiosInstance()
        .get(`${qbApi}/${id}?entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          ReactDOM.unstable_batchedUpdates(() => {
            setCustomizedRoutes([
              { title: "Quote", path: routes.quoteBuilder.path },
              { title: `${data?.quoteName}` },
            ]);
            setQuoteData(data);
            setAllowedToEdit(
              [...(data.collaborator ?? []), data.owner].some(
                (d) => d?.optionValue === user?.user?._id
              )
            );
            let keys = Object.keys(data.versions);
            if (version == 0) {
              setCurrentVersion(parseInt(keys[keys.length - 1]));
              setProcessStatus(data.versions[keys[keys.length - 1]].processStatus);
              setProductBuilderId(data.versions[keys[keys.length - 1]].productBuilderId);
              setVersionStatus(data.versions[keys[keys.length - 1]].status);
              setColumnView(data.versions[keys[keys.length - 1]].acceptedColumns || [])
              dispatch({ type: "selection", selectedRecords: data.versions[keys[keys.length - 1]].TNC });

            }
            else {
              setCurrentVersion(version);
              setProcessStatus(data.versions[version].processStatus);
              setProductBuilderId(data.versions[version].productBuilderId);
              setVersionStatus(data.versions[version].status);
              setColumnView(data.versions[version].acceptedColumns || [])
              dispatch({ type: "selection", selectedRecords: data.versions[version].TNC });
            }
            setLoading(false);
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoading(false);
        });
    }
  };

  const handleDeleteQuote = () => {
    if (quoteData?._id) {
      axiosInstance()
        .put(`${qbApi}/remove?entity=${selectedEntity}`, {
          ids: [quoteData._id],
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          history.push({
            pathname: routes.quoteBuilder.path,
          });
          setShowConfirmBox(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };


  const fetchTermsAndConditions = (selectedTermsAndConditions = null, updateVersionStatus = false) => {
    dispatch({ type: "loading", loading: true });
    const { selectedRecords } = state

    // if (gridApi) {
    //   // gridApi.setRowData([]);
    // }
    axiosInstance()
      .get(`${termsAndCondition.api}?limit=0`)
      .then(({ data: { data, count } }) => {
        const selectedRows = selectedRecords && selectedRecords.length
          ? data.filter(d => state.selectedRecords.filter(_d => _d._id === d._id).length > 0)
          : []


        let rows = data.map((tnc) => {
          return {
            ...tnc,
            id: tnc._id,
            name: tnc.TACName,
          };
        });

        dispatch({ type: "selection", selectedRecords: selectedRows });
        dispatch({
          type: "initialize",
          data: rows,
          count: count,
        });


        if (updateVersionStatus) {
          handleVersionUpdate(
            columnView,
            versionStatus,
            selectedRows
          )
        }


        setTimeout(() => {
          dispatch({ type: "loading", loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        dispatch({ type: "loading", loading: false });
      });
  };

  const handleReOpenQuote = () => {
    const previousVersionTNC = quoteData.versions[ifQuoteApproved.versionApproved]?.acceptedColumns
    setQuoteReOpening(true);
    axiosInstance()
        .post(
            `/quote-builder/createVersion/${quoteData._id}?version=${ifQuoteApproved.versionApproved}`,
            { TNC: previousVersionTNC }
        )
        .then(() => {
            fetchQuoteData(0);
            setQuoteReOpening(false);
        })
        .catch((error) => {
            toastConfig.setToastConfig(error);
            setQuoteReOpening(false);
        });
};

  const handleVersionUpdate = (
    Columns,
    versionStatus,
    selectedTermsAndConditions,
  ) => {
    let body = {
      acceptedColumns: Columns,
      status: versionStatus,
      TNC: selectedTermsAndConditions
    };

    setUpdatingVersion(true);
    axiosInstance()
      .post(`quote-builder/updateVersion/${quoteData._id}?version=${currentVersion}`, body)
      .then(() => {
        setUpdatingVersion(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setUpdatingVersion(false);
      });
  };



  return (
    <>
      <Layout>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <div className={`detail-container ${isMobile || isTablet ? "grid-mobile" : (showActivity ? 'grid-with-activity' : 'grid-without-activity')}`} >
          <div>
            <Paper>
              {!quoteData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                    <Box marginX={1} />
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                  </Box>
                </div>
              ) : (
                <DetailsPageHeader
                  heading={quoteData ? quoteData.quoteName : ""}
                  logo={quoteData?.leadLogo ? quoteData.leadLogo : undefined}
                  mainPoints={quoteData ? getMainPoints : ""}
                  showHeading={true}
                >
                  {allowedToEdit && ifQuoteApproved.approved && (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<HiPencil />}
                      disabled={quoteReOpening}
                      onClick={handleReOpenQuote}
                    >
                      Re-Open
                    </Button>
                  )}

                  {permissions[qbResource].isDelete &&
                    quoteData?.owner.optionValue &&
                    user?.user?._id &&
                    quoteData.owner.optionValue === user.user._id ? (
                    <DeleteButton
                      text="Delete"
                      onClick={() => setShowConfirmBox(true)}
                    />
                  ) : null}

                </DetailsPageHeader>
              )}

              {loading ? (
                <Box padding={2}>
                  <Grid container spacing={2}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <Grid item sm={6} md={6} key={i}>
                        <Skeleton variant="text" width="100px" height="16px" />
                        <Box marginY={1} />
                        <Skeleton width="100%" height="50px" />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <>
                  <Tabs
                    className="quote-tab"
                    value={tabValue}
                    onChange={handleMainTabChange}
                    textColor="primary"
                    TabIndicatorProps={{
                      style: {
                        display: "none",
                      },
                    }}
                  >
                    <Tab
                      style={{
                        background: tabValue === 0 ? "#163340" : "",
                        color: tabValue === 0 ? "white" : "#163340",
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          <InfoIcon className="mr-1" fontSize="inherit" /> All
                          Version Status
                        </div>
                      }
                      {...a11yProps(0)}
                    />
                    <Tab
                      style={{
                        background: tabValue === 1 ? "#163340" : "",
                        color: tabValue === 1 ? "white" : "#163340",
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          <FaWpforms className="mr-1" fontSize="inherit" />{" "}
                          Details
                        </div>
                      }
                      {...a11yProps(0)}
                    />
                    <Tab
                      style={{
                        background: tabValue === 2 ? "#163340" : "",
                        color: tabValue === 2 ? "white" : "#163340",
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          <BiFoodMenu className="mr-1" fontSize="inherit" />{" "}
                          Quote Versions
                        </div>
                      }
                      {...a11yProps(1)}
                    />
                  </Tabs>

                  <TabPanel value={tabValue} index={0}>
                    <Suspense fallback={
                      <Loader minHeight="500px" text="Loading..." />
                    }>
                      {(quoteData && <AllVersionStatus
                        quoteId={id}
                        quoteData={quoteData}
                        fetchQuoteData={fetchQuoteData}
                        handleChangeVersionFromAllVersion={handleChangeVersionFromAllVersion}
                      />)}
                    </Suspense>
                  </TabPanel>

                  <TabPanel value={tabValue} index={1}>
                    <Suspense fallback={
                      <Loader minHeight="500px" text="Loading..." />
                    }>
                      {(quoteData && <QuoteDetailPage
                        quoteData={quoteData}
                        quotePermissions={permissions[qbResource]}
                        selectedEntity={selectedEntity}
                        ifQuoteApprovedAapproved={ifQuoteApproved.approved}
                        allowedToEdit={allowedToEdit}
                        handleOpenUpdateDialog={handleOpenUpdateDialog}
                        handleSetSteps={handleSetSteps}
                      />)}
                    </Suspense>
                  </TabPanel>

                  <TabPanel value={tabValue} index={2}>
                    <Suspense fallback={
                      <Loader minHeight="500px" text="Loading..." />
                    }>
                      {(quoteData && <QuoteProcess
                        updatingVersion={updatingVersion}
                        handleVersionUpdate={handleVersionUpdate}
                        state={state}
                        dispatch={dispatch}
                        quoteData={quoteData}
                        ProcessStatus={processStatus}
                        ifQuoteApproved={ifQuoteApproved}
                        allowedToEdit={allowedToEdit}
                        handleOpenUpdateDialog={handleOpenUpdateDialog}
                        handleChangeVersion={handleChangeVersion}
                        currentVersion={currentVersion}
                        productBuilderId={productBuilderId}
                        versionStatus={versionStatus}
                        fetchQuoteData={fetchQuoteData}
                        columnView={columnView}
                        fetchTNC={fetchTermsAndConditions}
                      />)}
                    </Suspense>
                  </TabPanel>
                </>
              )}
            </Paper>
          </div>
          <div>   {showActivity ?
            <Paper>
              {!isMobile && !isTablet && <a color="primary" className="activityHide" onClick={handleActivityHideShow}>
                Hide Activities
              </a>}
              {!quoteData ? (
                <Box>
                  <Skeleton variant="text" width="100px" height="25px" />
                  <Box marginY={1} />
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} width="100%" height="50px" />
                  ))}
                </Box>
              ) : (
                <div>
                  <Activity
                    restrictedAddActivities={
                      allowedToEdit ? [] : ["Attachment", "Case"]
                    }
                    relatedTo={[
                      {
                        type: quote.quoteResource,
                        referenceId: quoteData?._id,
                        access: true,
                      },
                      {
                        type: quoteData?.customerAccountName
                          ? customerAccount?.accountResource
                          : supplierAccount?.accountResource,
                        referenceId: quoteData?.customerAccountName
                          ? quoteData?.customerAccountName?.optionValue
                          : quoteData?.supplierAccountName?.optionValue,
                        access: false,
                      },
                      {
                        type: opportunity.opportunityResource,
                        referenceId: quoteData.opportunity?.optionValue,
                        access: false,
                      },
                    ]}
                    handleActivityRefresh={() => { }}
                    //   emails={contactsEmailsData}
                    emails={null}
                  />
                </div>
              )}
            </Paper> :
            !isMobile && !isTablet && <a className="activityShow" onClick={handleActivityHideShow}>
              Show Activities
            </a>}
          </div>
        </div>
        {showConfirmBox ? (
          <ConfirmationDialog
            open={showConfirmBox}
            message={`Are you sure you want to delete this Quote?`}
            onClose={() => setShowConfirmBox(false)}
            onOk={handleDeleteQuote}
          />
        ) : null}

        {openUpdateDialog && (
          <ManageQuoteDialog
            open={openUpdateDialog}
            onSuccess={() => {
              setOpenUpdateDialog(false);
              fetchQuoteData(currentVersion);
            }}
            onClose={() => {
              setOpenUpdateDialog(false);
            }}
            isNew={false}
            dataToUpdate={quoteData}
            resource={null}
            isRedirectTodetailPage={false}
            contactId={null}
            opportunityId={null}
            disableOwnerDropDown={true}
            disableCurrency={true}
            quoteApproved={ifQuoteApproved.approved}
          />
        )}
      </Layout>
    </>
  );
}
