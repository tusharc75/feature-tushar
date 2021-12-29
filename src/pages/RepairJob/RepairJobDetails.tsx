import { useState, useEffect, useContext, useReducer } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs, IconButton } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import {
  gridLoadingTimeout, prepareDataForGrid, repairJob, sidebarResource,
  repairJobProcessSteps,
  repairJobStatus
} from '../../constants/helpers';
import ManageRepairJob from './ManageRepairJob';
import queryString from "query-string";
import { BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import TabPanel from '../../components/TabPanel';
import CustomCommonSteps from '../../components/CustomCommonSteps/CustomCommonSteps';
import AddSerializedAsset from '../RentalManagement/SerializedAsset/AddSerializedAsset';
import { CommonRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import { getFrameworkComponents, genrateColoum } from '../../constants/columns';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import RepairJobReceivingTicket from './RepairJobReceivingTicket';
import RepairJobDeliveryTicket from './RepairJobDeliveryTicket';
import ManageAssetDialog from './ManageAssetDialog';
import { isMobile } from "react-device-detect";
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import HtmlTooltip from '../../components/CustomTooltipTitle';
import InfoIcon from "@material-ui/icons/Info";
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

const reservedStatus = "Reserved";
const renderedFrom = "repairJobDetails"
const step1RenderedFrom = `${renderedFrom}_assets`
const completedStatus = repairJobStatus[2];

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`
  };
}

const RepairJobDetails = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit, tab }: any = parsed;
  const {
    state: { user, permissions }
  }: any = useData();
  const [headingLabel, setHeadingLabel] = useState('');
  const [showLoading, setShowLoading] = useState(false);
  const [repairJobData, setRepairJobData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [repairJobFields, setRepairJobFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [showRepairJobCompleteConfirmationDialog, setShowRepairJobCompleteConfirmationDialog] = useState(false);

  const [showAssetRemoveConfirmationDialog, setShowAssetRemoveConfirmationDialog] = useState({ open: false, id: null, ids: [] });

  const [steps, setSteps] = useState([...repairJobProcessSteps.filter(f => f !== "End")])
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [currentStep, setCurrentStep] = useState(0);
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const [okBtnLoading, setOkBtnLoading] = useState(false)

  const [step1FrameworkComponent, setStep1FrameworkComponent] = useState({})
  const [step1GridApi, setStep1GridApi] = useState(null);
  const [step1State, step1Dispatch] = useReducer(reducer, intialState);
  const { dataRows: step1DataRows, rowCount: step1RowCount, loading: step1Loading, page: step1Page,
    limit: step1Limit, pageSizes: step1PageSizes, search: step1Search, filters: step1Filters, sorting: step1Sorting,
    selectedRecords: step1SelectedRecords } = step1State;

  const [step1Columns, setStep1Columns] = useState([])

  const commonStep1Columns = [
    { field: "assetNumber", headerName: "Asset Number", show: true, disabled: true, cellRenderer: "assetNumberRenderer", width: 300, required: false },
    { field: "productCategory", headerName: "Product Category", show: true, disabled: true, cellRenderer: "commonRenderer", required: false },
    { field: "product", headerName: "Product Description", show: true, cellRenderer: "commonRenderer", required: false },
    { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer", required: false },
  ];

  const [showEditAssetDialog, setShowEditAssetDialog] = useState({ open: false, asset: null, selectedRecords: [] })
  const [serializedAssetFields, setSerializedAssetFields] = useState(null)

  const [disableNextStep, setDisableNextStep] = useState(false)
  const [disablePreviousStep, setDisablePreviousStep] = useState(false)

  const [unmodifiedColumns, setUnmodifiedColumns] = useState([]);
  const [repairAssetDialog, setRepairAssetDialog] = useState({ open: false, assetId: null, assetName: null, assetIds: [] })

  const [locationKeys, setLocationKeys] = useState([])

  useEffect(() => {
    return history.listen(location => {
      const { tab }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key])
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys)
          // Handle forward event
          setTabValue(tab ? parseInt(tab) : 1)

        } else {
          setLocationKeys((keys) => [location.key, ...keys])
          console.log(tab)
          // Handle back event
          setTabValue(tab ? parseInt(tab) : 1)

        }
      }
    })
  }, [locationKeys,])

  useEffect(() => {
    if (id) {
      // fetchAssignedSerializedAssetsFields();
      fetchRepairJobData();
      // fetchAssignedSerializedAssets();
    }
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (repairJobData) {
      fetchAssignedSerializedAssetsFields();
    }
  }, [repairJobData]);

  const fetchAssignedSerializedAssetsFields = () => {
    step1Dispatch({ type: "loading", loading: true });

    axiosInstance().get(`/field/child?resource=Repair Job Asset`).then(({ data: { data } }) => {

      const columns = [...commonStep1Columns];

      const formBuilderColumns = [...columns, ...data];
      setUnmodifiedColumns([...formBuilderColumns]);

      setSerializedAssetFields(data)
      let rendererNames = [];
      genrateColoum(data, columns, rendererNames, false);
      let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
      tempFrameworkComponent = {
        assetNumberRenderer: AssetNumberRenderer,
        commonRenderer: CommonRenderer,
        actionsRenderer: ActionsRenderer,
        ...tempFrameworkComponent,
      }
      setStep1FrameworkComponent({ ...tempFrameworkComponent })
      setStep1Columns([...columns])

      fetchAssignedSerializedAssets([...formBuilderColumns])
    })
  }

  const fetchAssignedSerializedAssets = (passedColumns = null, checkSteps = true) => {

    if (passedColumns === null) {
      passedColumns = [...unmodifiedColumns]
    }

    axiosInstance().get(`${repairJob.repairJobApi}/${id}/get-assets`)
      .then(({ data: { data } }) => {

        step1Dispatch({
          type: "initialize", data: [], count: 0
        });

        let rows = data.map((u, index) => {

          // let finalObject = prepareDataForGrid(u);
          // finalObject["canDelete"] = permissions.rentalJob.isDelete;
          // finalObject["isChecked"] = step1SelectedRecords.some(s => s._id === u._id);
          // finalObject["allowedToEdit"] = permissions.rentalJob.isUpdate;

          u["_id"] = u["id"];
          u["index"] = `${index + 1}`;

          u["typeOfRepair"] = repairJobData["typeOfRepair"];
          u["plant"] = u["typeOfRepair"] === "Internal" ? repairJobData["plant"]?.optionValue : "";
          u["repairPlant"] = u["typeOfRepair"] === "Internal" ? repairJobData["repairPlant"]?.optionValue : "";

          return prepareDataForGrid(u, user);
        });

        if (checkSteps && repairJobData.processStatus) {
          if (repairJobData["typeOfRepair"] === "Internal" && repairJobData["plant"].optionValue === repairJobData["repairPlant"].optionValue) {
            setCurrentStep(0)
          } else if (repairJobData["typeOfRepair"] === "Internal" && repairJobData["plant"].optionValue !== repairJobData["repairPlant"].optionValue && rows.some(s => s["repaired"] === true)) {
            setSteps([...repairJobProcessSteps.filter(f => f === "Serialized Assets" || f === "Loading Ticket")])
            setCurrentStep(1)
          }
          else {
            const step = repairJobProcessSteps.findIndex(f => f === repairJobData.processStatus);

            if (step > -1) {
              if (repairJobData.processStatus === "End") {
                setCurrentStep(step - 1);
              } else {
                setCurrentStep(step);
              }
            }
          }
        }

        let foundBlankValue = false;

        if (passedColumns) {

          const requiredFields = passedColumns.filter(u => u.required);
          if (requiredFields.length > 0) {

            rows.forEach(row => {
              if (foundBlankValue === true) {
                return;
              }
              requiredFields.forEach((d) => {
                const fieldName = d.fieldName;
                if (!row.hasOwnProperty(fieldName) || row[fieldName] === "" || row[fieldName] === null || row[fieldName] === undefined) {
                  foundBlankValue = true;
                  return;
                }
              })
            })
          }
        }

        setDisableNextStep(data.length === 0
          ? true
          : (repairJobData["typeOfRepair"] === "Internal" && repairJobData["plant"].optionValue === repairJobData["repairPlant"].optionValue && rows.some(s => !s.hasOwnProperty("repaired") || s["repaired"] === false)
            ? true
            : foundBlankValue)
        );
        step1Dispatch({
          type: "initialize", data: [...rows], count: rows.length
        });

        setTimeout(() => {
          step1Dispatch({ type: "loading", loading: false });
        }, gridLoadingTimeout);

      }).catch((error) => {
        setAddSerializedAssetDialog(false)
        setIsAdding(false)
        toastConfig.setToastConfig(error)
      });
  }

  const AssetNumberRenderer = (params) => (
    <span className="d-flex gap-2 align-items-center">

      <span className="link cursor-pointer" onClick={() => setShowEditAssetDialog({ open: true, asset: params.data, selectedRecords: [] })}>
        {params.data.index} - {params.value}
      </span>

      <HtmlTooltip title="Details">
        <IconButton
          size="small"
          aria-label="Details"
          onClick={() => {
            window.open(`${routes.productInventoryDetail.path}/${params.data._id}`);
          }}
        >
          <InfoIcon fontSize="small" />
        </IconButton>
      </HtmlTooltip>

      {
        params.data.repaired && <HtmlTooltip title="Repaired">
          <CheckCircleIcon color="primary" fontSize="small" />
        </HtmlTooltip>
      }

    </span>
  );

  const ActionsRenderer = (params) => (
    <div className="d-flex gap-1">

      {
        params.data["typeOfRepair"] === "Internal" && params.data["plant"] === params.data["repairPlant"] &&
        !params.data.repaired && <HtmlTooltip title="Repair Asset">
          <IconButton
            size="small"
            aria-label="Repair Asset"
            color="primary"
            onClick={() => {
              setRepairAssetDialog({ open: true, assetId: params.data._id, assetName: `${params.data.index} - ${params.data.assetNumber}`, assetIds: [] })
            }}
          >
            <CheckCircleOutlineIcon fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      }

      {
        params.data?.status === reservedStatus ? <GridDeleteIcon
          hasDeletePermission={permissions?.repairJob?.isUpdate}
          ownerId={user?.user?._id}
          userId={user?.user?._id}
          onDelete={() => {
            setShowAssetRemoveConfirmationDialog({ open: true, id: params.data._id ?? params.data.id, ids: [] });
          }}
          entity={sidebarResource.productInventory}
        /> : ""
      }
    </div>
  );

  const deleteRepairJobAssets = () => {
    setOkBtnLoading(true)

    axiosInstance().put(`${repairJob.repairJobApi}/${id}/remove-assets`, { ids: showAssetRemoveConfirmationDialog.id ? [showAssetRemoveConfirmationDialog.id] : showAssetRemoveConfirmationDialog.ids })
      .then(({ data }) => {
        setOkBtnLoading(false);
        setShowAssetRemoveConfirmationDialog({ open: false, id: null, ids: [] });
        fetchAssignedSerializedAssets();
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });

        localStorage.setItem(`${step1RenderedFrom}_selected`, JSON.stringify([]));

      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowLoading(false);
      })
  }

  const getResourceFields = (repairJobData) => {
    setShowLoading(true);
    axiosInstance()
      .get(`/field?resource=${sidebarResource.repairJob}`)
      .then(({ data: { data } }) => {
        if (repairJobData["typeOfRepair"] === "Internal") {
          setRepairJobFields(data.filter(f => ["supplier", "supplierShipTo"].indexOf(f?.fieldData?.fieldName) === -1));
        }
        else if (repairJobData["typeOfRepair"] === "External") {
          setRepairJobFields(data.filter(f => ["repairPlant", "plantShipTo"].indexOf(f?.fieldData?.fieldName) === -1));
        }
        setShowLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setShowLoading(false);
      });
  };

  const fetchRepairJobData = () => {
    setShowLoading(true);

    axiosInstance()
      .get(`${routes.repairJob.path}/${id}`)
      .then(({ data: { data } }) => {

        if (data.hasOwnProperty("plant")) {
          data["warehouse"] = data["plant"]
        } else if (data.hasOwnProperty("warehouse")) {
          data["plant"] = data["warehouse"]
        }

        setRepairJobData({ ...data })

        if (data["typeOfRepair"] === "Internal" && data["plant"].optionValue === data["repairPlant"].optionValue) {
          setSteps([...repairJobProcessSteps.filter(f => f === "Serialized Assets")])
        }

        // if (data.processStatus) {
        //   if (data["typeOfRepair"] === "Internal" && data["plant"].optionValue === data["repairPlant"].optionValue) {
        //     setCurrentStep(0)
        //   }
        //   else {
        //     const step = repairJobProcessSteps.findIndex(f => f === data.processStatus);

        //     if (step > -1) {
        //       if (data.processStatus === "End") {
        //         setCurrentStep(step - 1);
        //       } else {
        //         setCurrentStep(step);
        //       }
        //     }
        //   }
        // }
        setHeadingLabel(data.repairJobName);
        setCustomizedRoutes([routes.repairJob, { title: data.repairJobName }]);
        getResourceFields(data);

        if (permissions?.repairJob?.isUpdate && openEdit === "true") {
          setOpenUpdateDialog(true)
          const params = new URLSearchParams()
          params.delete("openEdit")
          history.push({ search: params.toString() })
        }

      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setShowLoading(false);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${repairJob.repairJobApi}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
    if (newValue === 0) {
      fetchRepairJobData();
    }
  };

  const onNextButtonClick = (oldStep, nextStep, showConfirmationDialog) => {
    if (showConfirmationDialog) {
      setShowRepairJobCompleteConfirmationDialog(true);
    } else {
      axiosInstance()
        .put(`${repairJob.repairJobApi}/${id}/process-status`, {
          "processStatus": repairJobProcessSteps[nextStep]
        })
        .then(() => {
          //  Update status to Complete when finished steps
          if (repairJobProcessSteps[nextStep] === repairJobProcessSteps[repairJobProcessSteps.length - 1]) {
            axiosInstance().put(`${repairJob.repairJobApi}/${id}/status`, { "status": completedStatus }).then(() => {
              setCurrentStep(nextStep);
              fetchRepairJobData();

              toastConfig.setToastConfig({
                open: true,
                type: "success",
                message: "Repair job completed successfully."
              });

            })
          }
        }).catch((error) => {
          toastConfig.setToastConfig(error);
        }).finally(() => {
          if (showRepairJobCompleteConfirmationDialog === true) {
            setShowRepairJobCompleteConfirmationDialog(false);
            setOkBtnLoading(false)
          }
        });
    }
  }

  const onPreviousButtonClick = (oldStep, previousStep) => {
    axiosInstance()
      .put(`${repairJob.repairJobApi}/${id}/process-status`, {
        "processStatus": repairJobProcessSteps[previousStep]
      })
      .then(() => {
        setDisableNextStep(false)
        if (previousStep === 0) {
          fetchAssignedSerializedAssets(false);
        }

      }).catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

  return (
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </Grid>

      <Grid container spacing={1} className="detail-container">
        <Grid item xs={12} sm={12} spacing={2}>
          <Paper style={{ height: "650px" }}>
            {!repairJobData ? (
              <div>
                <Skeleton variant="text" width="150px" height="40px" />
              </div>
            ) : (
              <DetailsPageHeader heading={headingLabel} mainPoints={mainPoints} showHeading={true}>
                {permissions?.repairJob?.isUpdate && (
                  <Button variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                    Edit
                  </Button>
                )}
                {/* {permissions?.repairJob?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />} */}
              </DetailsPageHeader>
            )}


            <Tabs
              className="quote-tab"
              value={tabValue}
              onChange={handleMainTabChange}
              textColor="primary"
              TabIndicatorProps={{
                style: {
                  display: 'none'
                }
              }}
            >
              {/* <Tab
                        className={"tabLayout"}
                      style={{
                        background: tabValue === 0 ? "white" : "",
                        color: tabValue === 0 ? "blue" : "#163340",
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font ">
                          <InfoIcon className="mr-1" fontSize="inherit" /> All
                          Version Status
                        </div>
                      }
                      {...a11yProps(0)}
                    /> */}
              <Tab
                className={'tabLayout'}
                style={{
                  background: tabValue === 1 ? 'white' : '',
                  color: tabValue === 1 ? '#163340' : '#163340'
                }}
                label={
                  <div className="d-flex align-items-center tab-font">
                    <FaWpforms className="mr-1" fontSize="inherit" /> Header
                  </div>
                }
                {...a11yProps(0)}
              />
              <Tab
                className={'tabLayout'}
                style={{
                  background: tabValue === 2 ? 'white' : '',
                  color: tabValue === 2 ? 'blue' : '#163340'
                }}
                label={
                  <div className="d-flex align-items-center tab-font">
                    <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                  </div>
                }
                {...a11yProps(1)}
              />
              <div className={'uio'}> </div>
            </Tabs>


            <TabPanel value={tabValue} index={0}>
              <Box>
                {showLoading || !repairJobFields.length ? (
                  <Grid container spacing={2} style={{ padding: '8px' }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <>
                    <DetailsPage data={repairJobData} fields={repairJobFields} />
                  </>
                )}
              </Box>

            </TabPanel>

            <TabPanel value={tabValue} index={1}>

              <Grid item xs={12} sm={12} md={12} lg={12}>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                  <>
                    <Paper>
                      <CustomCommonSteps
                        disableNextStep={disableNextStep}
                        disablePreviousStep={false}
                        steps={steps}
                        currentStep={currentStep}
                        setCurrentStep={setCurrentStep}
                        onNextButtonClick={onNextButtonClick}
                        onPreviousButtonClick={onPreviousButtonClick}
                        forViewOnly={repairJobData && repairJobData["status"] === completedStatus}
                      />

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={12} md={12} lg={12}>
                          {(currentStep === 0) && (
                            <>
                              {
                                repairJobData && repairJobData["status"] !== completedStatus && <Box display="flex" mt={2} mb={2} pr={1} justifyContent="flex-end" alignItems="center" className="gap-2">
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    type="button"
                                    size="small"
                                    onClick={() => {
                                      setAddSerializedAssetDialog(true)
                                    }}
                                  >
                                    {`Add ${routes.productInventory.title}`}
                                  </Button>

                                  {
                                    repairJobData && repairJobData["typeOfRepair"] === "Internal" &&
                                    repairJobData["plant"].optionValue === repairJobData["repairPlant"].optionValue && <Button
                                      variant="contained"
                                      color="primary"
                                      type="button"
                                      size="small"
                                      disabled={step1SelectedRecords.length === 0 || step1SelectedRecords.some(s => s.repaired === true)}
                                      onClick={() => {
                                        setRepairAssetDialog({ open: true, assetId: null, assetName: null, assetIds: [...step1SelectedRecords.map(m => m._id)] })
                                      }}
                                    >
                                      Complete Repair
                                    </Button>
                                  }

                                  <Button
                                    variant="contained"
                                    color="primary"
                                    type="button"
                                    size="small"
                                    disabled={step1SelectedRecords.length === 0}
                                    onClick={() => {
                                      setShowEditAssetDialog({ open: true, asset: null, selectedRecords: step1SelectedRecords })
                                    }}
                                  >
                                    Bulk Edit
                                  </Button>

                                  <Button
                                    variant="contained"
                                    color="primary"
                                    type="button"
                                    size="small"
                                    disabled={step1SelectedRecords.length === 0 || step1SelectedRecords.some(s => s.status !== reservedStatus)}
                                    onClick={() => {
                                      setShowAssetRemoveConfirmationDialog({ open: true, id: null, ids: step1SelectedRecords.map(m => m._id ?? m.id) });
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </Box>
                              }

                              <Grid item xs={12} md={12} sm={12} className="mt-3">

                                {step1Columns && step1FrameworkComponent ?
                                  isMobile ?
                                    <CustomSwipableList
                                      allowSelection={true}
                                      allowSwipe={true}
                                      permissions={permissions}
                                      primaryField={step1Columns?.find(d => d.field)}
                                      onClick={(data) => {
                                        history.push(`${routes.productInventoryDetail.path}/${data._id}`)
                                      }}
                                      dataRows={step1DataRows}
                                      selectedRecords={true}
                                      dispatch={step1Dispatch}
                                      onEdit={(data) => {
                                        history.push(`${routes.rentalManagementDetail.path}/${data._id}?openEdit=true`)
                                      }}
                                      extraParamsToCheckDelete={true}
                                      onDelete={(data) => {
                                        setShowAssetRemoveConfirmationDialog({ open: true, id: data._id ?? data.id, ids: [] });

                                      }}
                                      rowCount={step1RowCount}
                                      page={step1Page}
                                      loading={step1Loading}
                                      chips={[
                                        {
                                          label: "Product Desc. : ",
                                          field: "product",
                                        }
                                      ]}
                                      additionalDetails={[
                                        // {
                                        //   icon: <FaSuitcase size={18} />,
                                        //   field: "customerAccount"
                                        // },
                                      ]}
                                      owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
                                      onCreate={false}
                                      showClone={false}
                                      onClone={() => { }}
                                      renderedFrom={step1RenderedFrom}
                                    /> :
                                    <CustomAgGrid
                                      columns={step1Columns}
                                      dataRows={step1DataRows}
                                      frameworkComponents={step1FrameworkComponent}
                                      setGridApi={setStep1GridApi}
                                      dispatch={step1Dispatch}
                                      rowCount={step1RowCount}
                                      limit={step1Limit}
                                      pageSizes={step1PageSizes}
                                      page={step1Page}
                                      allowAction={repairJobData && repairJobData["status"] === completedStatus ? false : true}
                                      actionWidth={150}
                                      loading={step1Loading}
                                      allowSelection={repairJobData && repairJobData["status"] === completedStatus ? false : true}
                                      renderedFrom={step1RenderedFrom}
                                      isClientSideGrid={true}
                                    />
                                  : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
                                }
                              </Grid>
                            </>
                          )}

                          {(currentStep === 1) && (
                            <RepairJobDeliveryTicket
                              repairJobData={repairJobData}
                              setNextButtonDisabled={setDisableNextStep}
                              setPreviousButtonDisabled={setDisablePreviousStep}
                              hideReceivingTicketStep={(hide) => {
                                if (hide) {
                                  setSteps([...repairJobProcessSteps.filter(f => f === "Serialized Assets" || f === "Loading Ticket")])
                                }
                              }}
                            />
                          )}

                          {(currentStep === 2 || currentStep === 3) && (
                            <RepairJobReceivingTicket
                              repairJobData={repairJobData}
                              setNextButtonDisabled={setDisableNextStep}
                              setPreviousButtonDisabled={setDisablePreviousStep}
                            />
                          )}
                        </Grid>
                      </Grid>

                    </Paper>

                  </>
                </Grid>
              </Grid>

            </TabPanel>

          </Paper>
        </Grid>
        <Box my={1} />
      </Grid>


      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this repair job: ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}

      {
        showAssetRemoveConfirmationDialog.open && (
          <ConfirmationDialog
            open={true}
            message={`Are you sure you want to delete ${showAssetRemoveConfirmationDialog.id ? "asset" : "selected assets"} ?`}
            onClose={() => {
              setShowAssetRemoveConfirmationDialog(prevState => ({ ...prevState, open: false }));
            }}
            onOk={deleteRepairJobAssets}
            okBtnLoading={okBtnLoading}
          />
        )
      }

      {
        showRepairJobCompleteConfirmationDialog && <ConfirmationDialog
          open={true}
          message={`Are you sure you want to complete this repair job ?`}
          onClose={() => {
            setShowRepairJobCompleteConfirmationDialog(false)
          }}
          onOk={() => {
            onNextButtonClick(repairJobProcessSteps.length - 2, repairJobProcessSteps.length - 1, false)
          }}
          okBtnLoading={okBtnLoading}
        />
      }

      {
        repairAssetDialog.open && <ConfirmationDialog
          open={true}
          message={`Are you sure you want to complete repair of ${repairAssetDialog.assetId ? repairAssetDialog.assetName : "selected asset(s)"} ?`}
          onClose={() => {
            setRepairAssetDialog({ open: false, assetId: null, assetName: null, assetIds: [] })
          }}
          onOk={() => {
            setOkBtnLoading(true)
            axiosInstance().put(`${repairJob.repairJobApi}/${id}/assets-repaired`, { assets: repairAssetDialog.assetId ? [repairAssetDialog.assetId] : repairAssetDialog.assetIds, repaired: true }).then(({ data }) => {
              toastConfig.setToastConfig({
                open: true,
                type: "success",
                message: data.message,
              });
              setOkBtnLoading(false)
              setRepairAssetDialog({ open: false, assetId: null, assetName: null, assetIds: [] });
              fetchAssignedSerializedAssets();
            }).catch((error) => {
              toastConfig.setToastConfig(error);
              setOkBtnLoading(false)
            })
          }}
          okBtnLoading={okBtnLoading}
        />
      }


      {openUpdateDialog && (
        <ManageRepairJob
          open={openUpdateDialog}
          isClone={false}
          repairJobId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            // getResourceFields();
            fetchRepairJobData();
            setOpenUpdateDialog(false);
          }}
        />
      )}

      {
        addSerializedAssetDialog &&
        <AddSerializedAsset
          addSerializedAsset={(newRecordsToAdd) => {
            setIsAdding(true);

            axiosInstance().post(`${repairJob.repairJobApi}/${id}/add-assets`, { "ids": newRecordsToAdd.map(m => m._id ?? m.id) })
              .then(({ data }) => {
                setAddSerializedAssetDialog(false)
                fetchAssignedSerializedAssets();
                setIsAdding(false)
                toastConfig.setToastConfig({
                  open: true,
                  type: "success",
                  message: data.message,
                });

                //  Update status from new to In Progress when assets are created
                if (repairJobData.status === repairJobStatus[0]) {
                  axiosInstance().put(`${repairJob.repairJobApi}/${id}/status`, { "status": repairJobStatus[1] })
                }

              }).catch((error) => {
                setAddSerializedAssetDialog(false)
                setIsAdding(false)
                toastConfig.setToastConfig(error)
              });

          }}
          handleSerializedAssetClose={() => {
            setAddSerializedAssetDialog(false);
          }}
          isAdding={isAdding}
          selectedProducts={[]}
          queryString={`ignoreIds=${JSON.stringify(step1DataRows.map(m => m._id ?? m.id))}&repairable=true&notScrapLost=1`}
          filterByPlant={repairJobData.plant?.optionValue}
        />
      }

      {
        showEditAssetDialog.open && (
          <ManageAssetDialog
            open={showEditAssetDialog.open}
            repairJobData={repairJobData}
            fields={serializedAssetFields}
            asset={showEditAssetDialog.asset}
            selectedRecords={showEditAssetDialog.selectedRecords}
            onClose={() => {
              setShowEditAssetDialog(prevState => {
                return {
                  ...prevState,
                  open: false
                }
              });
            }}
            onSuccess={() => {
              if (showEditAssetDialog.selectedRecords.length > 0) {
                localStorage.setItem(`${step1RenderedFrom}_selected`, JSON.stringify([]));
                step1Dispatch({
                  type: "selection",
                  selectedRecords: []
                })
              }
              fetchAssignedSerializedAssets();
              setShowEditAssetDialog({
                open: false,
                asset: null,
                selectedRecords: [],
              });
            }}
          />
        )
      }

    </>
  );
};

export default RepairJobDetails;
