import React, { useContext, useEffect, useMemo, useState, useReducer, Fragment } from 'react'
import { useHistory, useParams, useLocation } from "react-router-dom";
import ReactDOM from "react-dom";
import { Paper, Box, Tabs, Tab, Grid, Button, DialogTitle, Dialog, DialogActions, DialogContent, makeStyles, TextField } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { BiFoodMenu } from "react-icons/bi";
import { FaWpforms } from "react-icons/fa";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../../components/DetailsPageHeader";
import DeleteButton from "../../../components/Helpers/DeleteButton";
import {
  reducer,
  intialState,
} from "../../../components/AgGridComponents/CustomAgGrid";
import { quote, customerAccount, supplierAccount, opportunity, quoteBuilder, yyyyMMDD, formatAmountWithCurrency, gridLoadingTimeout, termsAndCondition, defaultActivityShow } from "../../../constants/helpers";
import Activity from "../../../components/Activity";
import { useData } from "../../../StateProvider/Provider";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import routes from "../../../components/Helpers/Routes";
import axiosInstance from "../../../axios/axiosInstance";
import InfoIcon from "@material-ui/icons/Info";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import ManageQuoteDialog from "../ManageQuote/ManageQuoteDialog";
import { HiPencil } from 'react-icons/hi';
import { isMobile, isTablet } from "react-device-detect";
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import ProjectInAccordion from "../../../components/ProjectInAccordion/ProjectInAccordion"
import QuoteProcess from './QuoteProcess';
import QuoteDetailPage from './QuoteDetailPage';
import AllVersionStatus from './AllVersionStatus';

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

const useStyles = makeStyles((theme) => ({
  reasonDialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
  paper: {
    width: '80%',
    maxHeight: 435,
  },
}));

export default function QuoteDetail() {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
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
  const [cloneQuoteWithVersionNumber, setCloneQuoteWithVersionNumber] = useState(0);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [isQuoteClone, setIsQuoteClone] = useState(false);
  const [columnView, setColumnView] = useState([]);
  const [steps, setSteps] = useState([]);
  const [productBuilderId, setProductBuilderId] = useState("");
  const [versionStatus, setVersionStatus] = useState("Building Quote");
  const [processStatus, setProcessStatus] = useState("New");
  const [updatingVersion, setUpdatingVersion] = useState(false);
  const [reopenReasonDialog, setReopenReasonDialog] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [quoteReOpening, setQuoteReOpening] = useState(false);
  const [editCurrency, setEditCurrency] = useState(false);
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [tabValue, setTabValue] = useState(0);
  const [relatedTo, setRelatedTo] = useState({});
  const [typeCreateProjectSalesDialog, setTypeCreateProjectSalesDialog] = useState([
    { id: id, type: qbResource }
  ]);

  const handleMainTabChange = (
    event: React.ChangeEvent<{}>,
    newValue: number
  ) => {
    setTabValue(newValue);
  };

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
      fetchRelatedTo()
    }
  }, [id]);

  useEffect(() => {
    if (quoteData && quoteData.versions[currentVersion]?.acceptedColumns) {
      setColumnView(quoteData.versions[currentVersion].acceptedColumns)
    }
  }, [currentVersion])

  const fetchRelatedTo = () => {
    axiosInstance()
      .get(`/quote-builder/related/${id}`)
      .then(({ data: { data } }) => {
        setRelatedTo(data)
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

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

  const handleCloneQuoteWithVersionFromAllVersion = (versionNumber) => {
    setCloneQuoteWithVersionNumber(versionNumber)
    setOpenUpdateDialog(true);
    setIsQuoteClone(true)
  }


  const handleChangeVersion = (event) => {
    setCurrentVersion(parseInt(event.target.value));
    setProductBuilderId(quoteData["versions"][event.target.value]["productBuilderId"]);
    setVersionStatus(quoteData["versions"][event.target.value]["status"]);
    setProcessStatus(quoteData["versions"][event.target.value]["processStatus"]);
  };

  const handleOpenUpdateDialog = () => {
    axiosInstance()
      .get(`/quote-builder/can-update-currency/${id}`)
      .then(({ data: { data } }) => {
        setEditCurrency(data)
        setOpenUpdateDialog(true);
      })
  };

  const handleOpenCloneDialog = () => {
    setOpenUpdateDialog(true);
    setIsQuoteClone(true);
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
            setTypeCreateProjectSalesDialog((prevState) => ([...prevState,
            { id: data?.customerAccountName?.optionValue, type: customerAccount.accountResource },
            { id: data?.opportunity?.optionValue, type: opportunity.opportunityResource }
            ]));

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
    const previousVersionTNC = quoteData.versions[ifQuoteApproved.versionApproved]?.TNC
    setQuoteReOpening(true);
    setReopenReasonDialog(false)
    setReopenReason("")
    let notEndVersions = []
    Object.keys(quoteData.versions).forEach((v) => {
      if (quoteData.versions[v]?.processStatus !== "End") {
        notEndVersions.push(v)
      }
    });

    if (notEndVersions.length !== 0) {

      axiosInstance()
        .put(
          `/quote-builder/updateVersions/${quoteData._id}`,
          { versions: notEndVersions, status: "Not Booked", processStatus: "End" }
        )
        .then(() => {

          axiosInstance()
            .post(
              `/quote-builder/createVersion/${quoteData._id}?version=${ifQuoteApproved.versionApproved}`,
              { TNC: previousVersionTNC, comment: [`Auto-Cloned from Re-opened Version ${ifQuoteApproved.versionApproved}`] }
            )
            .then(() => {
              let comment = quoteData.versions[currentVersion]?.comment
              if (typeof comment === 'string') {
                comment = [comment, reopenReason];
              }
              else {
                comment.push(reopenReason)
              }
              axiosInstance()
                .post(`quote-builder/updateVersion/${quoteData._id}?version=${ifQuoteApproved.versionApproved}`, { TNC: previousVersionTNC, status: "Re-Open", comment: comment })
                .then(() => {
                  fetchQuoteData(0);
                  setQuoteReOpening(false);
                })
                .catch((err) => {
                  toastConfig.setToastConfig(err);
                  setQuoteReOpening(false);
                });
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
              setQuoteReOpening(false);
            });

        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setQuoteReOpening(false);
        });
    }
    else {
      axiosInstance()
        .post(
          `/quote-builder/createVersion/${quoteData._id}?version=${ifQuoteApproved.versionApproved}`,
          { TNC: previousVersionTNC, comment: [`Auto-Cloned from Re-opened Version ${ifQuoteApproved.versionApproved}`] }
        )
        .then(() => {
          axiosInstance()
            .post(`quote-builder/updateVersion/${quoteData._id}?version=${ifQuoteApproved.versionApproved}`, { TNC: previousVersionTNC, status: "Re-Open" })
            .then(() => {
              fetchQuoteData(0);
              setQuoteReOpening(false);
            })
            .catch((err) => {
              toastConfig.setToastConfig(err);
              setQuoteReOpening(false);
            });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setQuoteReOpening(false);
        });
    }

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

  const handleReopenReasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReopenReason(event.target.value);
  };

  return (
    <>
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`} >
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
                      onClick={() => setReopenReasonDialog(true)}
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
                    {(quoteData && <AllVersionStatus
                      quoteId={id}
                      quoteData={quoteData}
                      quotePermissions={permissions[qbResource]}
                      fetchQuoteData={fetchQuoteData}
                      handleChangeVersionFromAllVersion={handleChangeVersionFromAllVersion}
                      handleCloneQuoteWithVersionFromAllVersion={handleCloneQuoteWithVersionFromAllVersion}
                    />)}
                  </TabPanel>

                  <TabPanel value={tabValue} index={1}>
                    <>
                      {(quoteData && <QuoteDetailPage
                        quoteData={quoteData}
                        quotePermissions={permissions[qbResource]}
                        selectedEntity={selectedEntity}
                        ifQuoteApprovedAapproved={ifQuoteApproved.approved}
                        allowedToEdit={allowedToEdit}
                        handleOpenUpdateDialog={handleOpenUpdateDialog}
                        handleOpenCloneDialog={handleOpenCloneDialog}
                        handleSetSteps={handleSetSteps}
                      />)}
                      {permissions?.projectStrategy?.isRead && (
                        <ProjectInAccordion
                          recordsPerLine={3}
                          projectSales={relatedTo && relatedTo["Project Sales"]?.Quotes || []}
                          type={typeCreateProjectSalesDialog}
                          fetchData={() => fetchRelatedTo()}
                          permissions={permissions}
                          isAddProjectSale={true}
                          isAllowedToEdit={allowedToEdit}
                        />
                      )}
                    </>
                  </TabPanel>

                  <TabPanel value={tabValue} index={2}>
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
                      globalLoading={loading}
                    />)}
                  </TabPanel>
                </>
              )}
            </Paper>
          </div>
          <div className="position-relative">
            {showActivity ?
              <Paper>
                {!isMobile && !isTablet && <span className="activityHide cursor-pointer" onClick={handleActivityHideShow}>
                  <IoIosArrowDropright className="icon" />
                </span>}
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
                      resourceId={quoteData?._id}
                      resource={quote.quoteResource}
                      restrictedAddActivities={
                        allowedToEdit ? [] : ["Attachment", "Case"]
                      }
                      relatedTo={[
                        {
                          type: quote.quoteResource,
                          referenceId: quoteData?._id,
                          access: true,
                        },
                      ]}
                      handleActivityRefresh={() => { }}
                      //   emails={contactsEmailsData}
                      emails={null}
                    />
                  </div>
                )}
              </Paper> :
              !isMobile && !isTablet && <span className="activityShow cursor-pointer" onClick={handleActivityHideShow}>
                <IoIosArrowDropleft className="icon" />
              </span>}
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
              setIsQuoteClone(false)
              setOpenUpdateDialog(false);
              fetchQuoteData(currentVersion);
              fetchRelatedTo()
            }}
            onClose={() => {
              setOpenUpdateDialog(false);
              setIsQuoteClone(false)
            }}
            isNew={false}
            isClone={isQuoteClone}
            dataToUpdate={quoteData}
            resource={null}
            isRedirectTodetailPage={false}
            contactId={null}
            opportunityId={null}
            disableOwnerDropDown={true}
            editCurrency={editCurrency}
            quoteApproved={isQuoteClone ? false : ifQuoteApproved.approved}
            cloneQuoteWithVersionNumber={cloneQuoteWithVersionNumber}
            doaCollaboratorResources={user.user?.doa?.map(obj => obj.user)}
          />
        )}
        {reopenReasonDialog && (
          <div className={classes.reasonDialog}>
            <Dialog
              maxWidth="xs"
              open={reopenReasonDialog}
              aria-labelledby="confirmation-dialog-title"
              classes={{
                paper: classes.paper,
              }}
              id="confirmation-dialog"
              keepMounted
            >
              <DialogTitle id="confirmation-dialog-title" className="text-white">Reason for Re-Open</DialogTitle>
              <DialogContent dividers>
                <TextField
                  fullWidth
                  id="outlined-multiline-static"
                  label="Reason"
                  multiline
                  value={reopenReason}
                  onChange={handleReopenReasonChange}
                  rows={4}
                  variant="outlined"
                />
              </DialogContent>
              <DialogActions>
                <Button size="small" onClick={() => setReopenReasonDialog(false)} color="primary">Close</Button>
                <Button size="small" disabled={reopenReason === ""} onClick={handleReOpenQuote} color="primary">Save</Button>
              </DialogActions>
            </Dialog>
          </div>

        )

        }
      </Fragment>
    </>
  );
}
