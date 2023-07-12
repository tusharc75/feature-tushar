import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs, useMediaQuery, Menu, MenuItem, Typography, IconButton } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import {
  repairOrder,
  sidebarResource,
  ACTIVITY_RESOURCE,
  REPAIR_ORDER_STATUS,
  repairOrderSteps,
  REPAIR_ORDER_TYPE,
  QUOTATION_STATUS,
  WORKORDER_SERVICE_STATUS
} from 'src/constants/helpers';
import ManageRepairOrder from './ManageRepairOrder';
import queryString from 'query-string';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import { RiFlowChart } from 'react-icons/ri';
import TabPanel from 'src/components/TabPanel';
import Steps from 'src/components/Steps';
import { camelCase } from 'lodash';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { isMobile, isTablet } from 'react-device-detect';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import View from './View';
import Productpackage from './Productpackage';
import Quotation from './Quotation';
import WorkOrder from './WorkOrder';
import LoadingTicket from './LoadingTicket';
import ActivityButton from 'src/components/Activity/ActivityButton';

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`
  };
}

const RepairOrderDetails = () => {
  const renderedFrom = camelCase(routes?.repairOrder.title);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();

  const parsed = queryString.parse(history.location.search);
  const { openEdit, tab }: any = parsed;
  const {
    state: { user, permissions }
  }: any = useData();

  const [hasAssetsAdded, setHasAssetsAdded] = useState(false);
  const [repairOrderData, setRepairOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [repairOrderFields, setRepairOrderFields] = useState([]);
  const [nextStep, setNextStep] = useState(true);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [locationKeys, setLocationKeys] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [quotationVersionData, setQuotationVersionData] = useState(null);
  const [showQuotationConfirmBox, setShowQuotationConfirmBox] = useState(false);
  const [quoteClonning, setQuoteClonning] = useState(false);
  const [isAnyMaterial, setisAnyMaterial] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);
  const [enableStatusChange, setEnableStatusChange] = useState(false);

  const [stepList, setStepList] = useState(repairOrderSteps);
  const [stepNames, setStepNames] = useState(repairOrderSteps.map((item) => item.name));

  useEffect(() => {
    return history.listen((location) => {
      const { tab }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key]);
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys);
          // Handle forward event
          setTabValue(tab ? parseInt(tab) : 1);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setTabValue(tab ? parseInt(tab) : 1);
        }
      }
    });
  }, [locationKeys]);

  useEffect(() => {
    if (id) {
      fetchRepairOrderData();
    }
  }, [id]);

  useEffect(() => {
    getResourceFields();
  }, []);

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= stepNames.length) {
      fetchQuotationData();
      updateProcessStatus(stepNames[currentStep]);
    }
    if (['Add Assets', 'Work Order'].includes(stepNames[currentStep])) fetchQuotationData();
  }, [currentStep]);

  const getResourceFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.repairOrder}`)
      .then(({ data: { data } }) => {
        setRepairOrderFields(data);
        data.some((o) => {
          if (o?.fieldData?.fieldName === 'status') {
            setStatusOptions([...o.fieldData.option?.filter((e) => e.optionValue !== 'Deleted')]);
            return true;
          }
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchRepairOrderData = () => {
    setRepairOrderData(null);
    axiosInstance()
      .get(`${routes.repairOrder.path}/${id}`)
      .then(({ data: { data } }) => {
        setisAnyMaterial(data?.canDelete ? false : true);
        var isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
        if (user?.role?.selectedEntity?.superAdminAccess) {
          isAllowedToEdit = true;
        }
        setAllowedToEdit(isAllowedToEdit);
        var steps: any = JSON.parse(JSON.stringify(repairOrderSteps));
        if (data?.type === REPAIR_ORDER_TYPE.internal) {
          steps = steps?.filter((e) => !['Loading Ticket']?.includes(e.name));
        }
        if (!user?.user?.brandPolicy?.repairOrderPrice && !data?.addQuotationStep) {
          steps = steps?.filter((e) => !['Quotation', 'Post Work Service', 'Invoice']?.includes(e.name));
        }
        if (!data?.addQuotationStep) {
          steps = steps?.map((e) => {
            if (e.name === 'Quotation') {
              e.title = 'Price';
            }
            return e;
          });
        }
        setStepList(steps);
        setStepNames(steps.map((item) => item.name));

        setCurrentStep(
          steps?.map((item) => item.name)?.indexOf(data?.processStatus) !== -1 ? steps?.map((item) => item.name)?.indexOf(data?.processStatus) : 0
        );

        setAllowedToDelete(data?.owner?.optionValue === user?.user?._id);
        setRepairOrderData({ ...data });
        if (permissions?.repairOrder?.isUpdate && openEdit === 'true') {
          setOpenUpdateDialog(true);
          const params = new URLSearchParams();
          params.delete('openEdit');
          history.push({ search: params.toString() });
        }
        if ((data?.type === REPAIR_ORDER_TYPE.internal || !data?.addQuotationStep) && data?.status !== REPAIR_ORDER_STATUS.completed) {
          checkStatusChange();
        } else {
          setEnableStatusChange(false);
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const checkStatusChange = () => {
    axiosInstance()
      .get(`${repairOrder.api}/${id}/work-order/service`)
      .then(({ data: { data } }) => {
        if (data?.material?.length) {
          const material = data?.material?.filter((e) => !e.parentId);
          if (material?.filter((e) => e?.workOrder?.status === WORKORDER_SERVICE_STATUS.completed)?.length === material?.length) {
            setEnableStatusChange(true);
          }
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${repairOrder.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(routes.repairOrder.path);
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
      fetchRepairOrderData();
    }
  };

  const updateProcessStatus = (processStatus) => {
    axiosInstance()
      .put(`${repairOrder.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => {})
      .catch((error) => {});
  };

  const fetchQuotationData = (versionNumber = null) => {
    axiosInstance()
      .get(`${repairOrder.api}/${id}/check/quotation`)
      .then(({ data: { data } }) => {
        if (data) {
          let keys = Object.keys(data?.versions);
          let tempCurrentVersion = versionNumber ? versionNumber : parseInt(keys[keys.length - 1]);
          setQuotationVersionData({ quotationId: data?._id, ...data?.versions[tempCurrentVersion] });
        }
      });
  };

  const createNewVersionQuote = (updateProcessStatus = false) => {
    setQuoteClonning(true);
    axiosInstance()
      .post(`/quotation/clone-version/${quotationVersionData.quotationId}/${quotationVersionData?._id}`, { updateProcessStatus })
      .then(() => {
        setShowQuotationConfirmBox(false);
        fetchQuotationData();
        fetchRepairOrderData();
        setQuoteClonning(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowQuotationConfirmBox(false);
        setQuoteClonning(false);
      });
  };

  const handleStatusChange = (o) => {
    if (o.optionValue && repairOrderData?.status !== o.optionValue) {
      updateOrderStatus(o.optionValue);
    }
  };

  const updateOrderStatus = (status) => {
    axiosInstance()
      .patch(`${repairOrder.api}/status/${repairOrderData._id}`, { status: status })
      .then(({ data: { data } }) => {
        fetchRepairOrderData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status changed to ${status}`
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.repairOrder, { title: repairOrderData?.repairOrderNumber }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {repairOrderData ? (
              <>
                {permissions?.repairOrder?.isUpdate &&
                  allowedToEdit &&
                  (enableStatusChange || [REPAIR_ORDER_STATUS.readyToInvoice, REPAIR_ORDER_STATUS.invoiced].includes(repairOrderData?.status)) && (
                    <Fragment>
                      <Button
                        variant={'contained'}
                        size="small"
                        onClick={() => updateOrderStatus(REPAIR_ORDER_STATUS.completed)}
                        className={'btn-outline-v1'}
                      >
                        Complete
                      </Button>
                      {/* <Button
                        variant="outlined"
                        color="default"
                        size="small"
                        onClick={openActions}
                        aria-controls="action-menu"
                        endIcon={isMobile && !isTablet ? <ExpandMore style={{ width: '12px', height: '12px' }} /> : <ExpandMore />}
                      >
                        {isMobile && !isTablet ? <GrStatusInfo size={20} /> : 'Change Status'}
                      </Button>
                      <Menu
                        anchorEl={anchorEl}
                        keepMounted
                        getContentAnchorEl={null}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'left'
                        }}
                        id="action-menu"
                        open={Boolean(anchorEl)}
                        onClose={closeActions}
                      >
                        {statusOptions?.map((o, index) => {
                          return (
                            <MenuItem
                              disabled={
                                [REPAIR_ORDER_STATUS.readyToInvoice, REPAIR_ORDER_STATUS.invoiced, REPAIR_ORDER_STATUS.completed]?.includes(
                                  o?.optionLabel
                                )
                                  ? index <= statusOptions.findIndex((d) => d.optionLabel === repairOrderData?.status)
                                  : true
                              }
                              onClick={() => {
                                closeActions();
                                handleStatusChange(o);
                              }}
                              value={o}
                            >
                              {o?.optionLabel}
                            </MenuItem>
                          );
                        })}
                      </Menu> */}
                    </Fragment>
                  )}
                {permissions?.repairOrder?.isUpdate &&
                  allowedToEdit &&
                  ['Add Assets', 'Work Order'].includes(stepNames[currentStep]) &&
                  [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                    quotationVersionData?.status
                  ) && (
                    <Button
                      className="buttonStyleBigScreen"
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => {
                        createNewVersionQuote();
                      }}
                    >
                      Create New Version
                    </Button>
                  )}
                {permissions?.repairOrder?.isUpdate &&
                  allowedToEdit &&
                  ![REPAIR_ORDER_STATUS.completed].includes(repairOrderData?.status) &&
                  !(
                    [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                      quotationVersionData?.status
                    ) && ['Add Assets', 'Work Order'].includes(stepNames[currentStep])
                  ) && (
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      onClick={() => setOpenUpdateDialog(true)}
                      className={'btn-outline-v1'}
                    >
                      {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                    </Button>
                  )}
                {permissions?.repairOrder?.isDelete && allowedToDelete && repairOrderData?.canDelete && (
                  <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                )}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton referenceId={repairOrderData?._id} resource={ACTIVITY_RESOURCE.repairOrder} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Tabs
          className="new-tab-container-v1"
          value={tabValue}
          onChange={handleMainTabChange}
          textColor="primary"
          TabIndicatorProps={{
            style: {
              display: 'none'
            }
          }}
        >
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <FaWpforms className="mr-1" fontSize="inherit" /> Header
              </div>
            }
            {...a11yProps(0)}
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
              </div>
            }
            {...a11yProps(1)}
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <RiFlowChart className="mr-1" fontSize="inherit" /> Views
              </div>
            }
            {...a11yProps(1)}
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box>
            {repairOrderData && repairOrderFields.length ? (
              <DetailsPage data={repairOrderData} fields={repairOrderFields} />
            ) : (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Steps
            isNextStep={false}
            nextStep={nextStep}
            steps={stepList}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={[REPAIR_ORDER_STATUS.completed].includes(repairOrderData?.status)}
            setStepFullScreen={() => setStepFullScreen(true)}
            handlePrev={() => {
              if (
                [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                  quotationVersionData?.status
                ) &&
                stepNames[currentStep] === 'Quotation' &&
                allowedToEdit
              ) {
                setShowQuotationConfirmBox(true);
              } else {
                setCurrentStep((prevStep) => {
                  const newStep = prevStep - 1;
                  return newStep;
                });
              }
            }}
          />

          <ContentFullScreen title={stepNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            {stepNames[currentStep] === 'Add Assets' && repairOrderData && (
              <Productpackage
                fetchRepairOrderData={fetchRepairOrderData}
                repairOrderData={repairOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-1`}
                stepFullScreen={stepFullScreen}
                setHasAssetsAdded={setHasAssetsAdded}
                allowedToEdit={
                  [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                    quotationVersionData?.status
                  )
                    ? false
                    : allowedToEdit
                }
                allowedToDelete={allowedToDelete}
              />
            )}
            {(stepNames[currentStep] === 'Work Order' || stepNames[currentStep] === 'Post Work Service') && repairOrderData && (
              <WorkOrder
                repairOrderData={repairOrderData}
                setNextStep={setNextStep}
                stepFullScreen={stepFullScreen}
                allowedToEdit={
                  currentStep === 3
                    ? allowedToEdit
                    : [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                        quotationVersionData?.status
                      )
                    ? false
                    : allowedToEdit
                }
                allowedToDelete={allowedToDelete}
                isPostWorkService={Boolean(currentStep === 3)}
                setCurrentStep={setCurrentStep}
                createNewVersionQuote={createNewVersionQuote}
              />
            )}
            {stepNames[currentStep] === 'Quotation' && repairOrderData && (
              <Quotation
                repairOrderData={repairOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-4`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
                allowedToDelete={allowedToDelete}
                setQuotationVersionData={setQuotationVersionData}
                invoiceStep={false}
                updateOrderStatus={updateOrderStatus}
              />
            )}
            {stepNames[currentStep] === 'Loading Ticket' && repairOrderData && (
              <LoadingTicket
                repairOrderData={repairOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-5`}
                allowedToEdit={allowedToEdit}
              />
            )}
            {stepNames[currentStep] === 'Invoice' && repairOrderData && (
              <Quotation
                repairOrderData={repairOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-4`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={false}
                allowedToDelete={false}
                invoiceStep={true}
                setQuotationVersionData={setQuotationVersionData}
                updateOrderStatus={updateOrderStatus}
              />
            )}
          </ContentFullScreen>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Box>
            <View repairOrderNumber={repairOrderData?.repairOrderNumber || ''} repairOrderId={id} repairOrderStatus={repairOrderData?.status} />
          </Box>
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this repair order: ${repairOrderData?.repairOrderNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {showQuotationConfirmBox && (
        <ConfirmationDialog
          open={showQuotationConfirmBox}
          message={`Are you sure you want to create new version of this quote ?`}
          onClose={() => {
            setShowQuotationConfirmBox(false);
            setCurrentStep((prevStep) => {
              const newStep = prevStep - 1;
              return newStep;
            });
          }}
          onOk={() => {
            createNewVersionQuote();
            setCurrentStep((prevStep) => {
              const newStep = prevStep - 1;
              return newStep;
            });
          }}
          // forwardText={'Yes'}
          cancelText={'No'}
        />
      )}
      {openUpdateDialog && (
        <ManageRepairOrder
          isAnyMaterial={isAnyMaterial}
          isEditable={!hasAssetsAdded}
          isClone={false}
          repairOrderId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchRepairOrderData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </Box>
  );
};

export default RepairOrderDetails;
