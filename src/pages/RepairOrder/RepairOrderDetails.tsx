import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs, useMediaQuery, Menu, MenuItem, Typography, IconButton } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import DetailsPageHeader from 'src/components/DetailsPageHeader';
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
  QUOTATION_STATUS
} from 'src/constants/helpers';
import Activity from 'src/components/Activity';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import ManageRepairOrder from './ManageRepairOrder';
import queryString from 'query-string';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import TabPanel from 'src/components/TabPanel';
import HideWhenOffline from 'src/components/HideWhenOffline';
import { defaultActivityShow } from 'src/constants/helpers';
import Steps from '../RentalManagement/Steps';
import { camelCase } from 'lodash';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { isMobile, isTablet } from 'react-device-detect';
import accountClass from '../Account/account.module.scss';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import Productpackage from './Productpackage';
import Quotation from './Quotation';
import WorkOrder from './WorkOrder';
import { ExpandMore } from '@material-ui/icons';
import { GrStatusInfo } from 'react-icons/gr';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import CloseIcon from '@material-ui/icons/Close';

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`
  };
}

const RepairOrderDetails = () => {
  const renderedFrom = camelCase(routes?.repairOrder.title);
  const toastConfig = useContext(CustomToastContext);
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');
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
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [locationKeys, setLocationKeys] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [repairOrderProcessSteps, setRepairOrderProcessSteps] = useState(repairOrderSteps);
  const [quotationVersionData, setQuotationVersionData] = useState(null);
  const [showQuotationConfirmBox, setShowQuotationConfirmBox] = useState(false);
  const [quoteClonning, setQuoteClonning] = useState(false);
  const [isAnyMaterial, setisAnyMaterial] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);

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
    if (currentStep !== null && currentStep >= 0 && currentStep <= repairOrderProcessSteps.length) {
      fetchQuotationData();
      updateProcessStatus(repairOrderProcessSteps[currentStep]);
    }
    if (['Add Assets', 'Work Order'].includes(repairOrderProcessSteps[currentStep])) fetchQuotationData();
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
    axiosInstance()
      .get(`${routes.repairOrder.path}/${id}`)
      .then(({ data: { data } }) => {
        setisAnyMaterial(data?.canDelete ? false : true);
        setCurrentStep(repairOrderProcessSteps.indexOf(data?.processStatus) !== -1 ? repairOrderProcessSteps.indexOf(data?.processStatus) : 0);
        const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
        setAllowedToEdit(isAllowedToEdit);
        if (data?.type === REPAIR_ORDER_TYPE.internal) {
          setRepairOrderProcessSteps(repairOrderSteps.filter((d) => !['Quotation', `Post Work Service`, `Invoice`]?.includes(d)));
        }
        setAllowedToDelete(data?.owner?.optionValue === user?.user?._id);
        setRepairOrderData({ ...data });
        if (permissions?.repairOrder?.isUpdate && openEdit === 'true') {
          setOpenUpdateDialog(true);
          const params = new URLSearchParams();
          params.delete('openEdit');
          history.push({ search: params.toString() });
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

  const createNewVersionQuote = () => {
    setQuoteClonning(true);
    axiosInstance()
      .post(`/quotation/clone-version/${quotationVersionData.quotationId}/${quotationVersionData?._id}`)
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

  // useEffect(() => {
  //   if (isSmallScreen && tabValue === 0) {
  //     setActivityShow(true);
  //   } else {
  //     setActivityShow(false);
  //   }
  // }, [isSmallScreen, tabValue]);
  useEffect(() => {
    const body = document.querySelector('body');
    if (showActivity) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = null;
    }
  }, [showActivity]);

  return (
    <Box className="main-container-new-v1">
      <Box className="headerbox-new-v1" mb={2}>
        <Box className="nav-new-v1">
          <Typography variant="h5" style={{ color: '#2A3042', fontWeight: '700', fontSize: '1.875rem', marginBottom: '.4rem' }}>
            Repair Order
          </Typography>
          <CustomBreadCrumbs routes={[routes.repairOrder, { title: repairOrderData?.repairOrderNumber }]} />
        </Box>
        <Box className="controls-new-v1">
          <Box className="control-buttons-new-v1">
            {repairOrderData ? (
              <>
                {permissions?.repairOrder?.isUpdate &&
                  allowedToEdit &&
                  [REPAIR_ORDER_STATUS.readyToInvoice, REPAIR_ORDER_STATUS.invoiced].includes(repairOrderData?.status) && (
                    <Fragment>
                      <Button
                        variant="outlined"
                        color="default"
                        size="small"
                        onClick={openActions}
                        aria-controls="action-menu"
                        endIcon={isMobile ? <ExpandMore style={{ width: '12px', height: '12px' }} /> : <ExpandMore />}
                      >
                        {isMobile ? <GrStatusInfo size={20} /> : 'Change Status'}
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
                              disabled={index <= statusOptions.findIndex((d) => d.optionLabel === repairOrderData?.status)}
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
                      </Menu>
                    </Fragment>
                  )}
                {permissions?.repairOrder?.isUpdate &&
                  allowedToEdit &&
                  ['Add Assets', 'Work Order'].includes(repairOrderProcessSteps[currentStep]) &&
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
                  !(
                    [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                      quotationVersionData?.status
                    ) && ['Add Assets', 'Work Order'].includes(repairOrderProcessSteps[currentStep])
                  ) && (
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      // color="primary"
                      onClick={() => setOpenUpdateDialog(true)}
                      className={isMobile && !isTablet ? accountClass.mobile_button_layout : ''}
                      style={isMobile && !isTablet ? { color: '#43aeaa' } : { color: 'rgb(62, 62, 62) ', background: 'white' }}
                    >
                      {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                    </Button>
                  )}
                {permissions?.repairOrder?.isDelete && allowedToDelete && repairOrderData?.canDelete && (
                  <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                )}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="40px" />
            )}
            <Button
              endIcon={<ArrowForwardIcon />}
              variant="contained"
              onClick={() => setActivityShow(!showActivity)}
              style={{ background: 'var(--new_theme_color)', color: 'white' }}
            >
              Activities
            </Button>
          </Box>
        </Box>
      </Box>
      <div className={`detail-container-new-v1 `}>
        <Box>
          {/* {repairOrderData ? (
            <DetailsPageHeader heading={repairOrderData?.repairOrderNumber} mainPoints={null} showHeading={false}>
              {permissions?.repairOrder?.isUpdate &&
                allowedToEdit &&
                [REPAIR_ORDER_STATUS.readyToInvoice, REPAIR_ORDER_STATUS.invoiced].includes(repairOrderData?.status) && (
                  <Fragment>
                    <Button
                      variant="outlined"
                      color="default"
                      size="small"
                      onClick={openActions}
                      aria-controls="action-menu"
                      endIcon={isMobile ? <ExpandMore style={{ width: '12px', height: '12px' }} /> : <ExpandMore />}
                    >
                      {isMobile ? <GrStatusInfo size={20} /> : 'Change Status'}
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
                            disabled={index <= statusOptions.findIndex((d) => d.optionLabel === repairOrderData?.status)}
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
                    </Menu>
                  </Fragment>
                )}
              {permissions?.repairOrder?.isUpdate &&
                allowedToEdit &&
                ['Add Assets', 'Work Order'].includes(repairOrderProcessSteps[currentStep]) &&
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
                !(
                  [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                    quotationVersionData?.status
                  ) && ['Add Assets', 'Work Order'].includes(repairOrderProcessSteps[currentStep])
                ) && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    color="primary"
                    size="small"
                    onClick={() => setOpenUpdateDialog(true)}
                    className={isMobile && !isTablet ? accountClass.mobile_button_layout : ''}
                    style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                  >
                    {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                  </Button>
                )}
              {permissions?.repairOrder?.isDelete && allowedToDelete && repairOrderData?.canDelete && (
                <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
              )}
            </DetailsPageHeader>
          ) : (
            <Skeleton variant="text" width="150px" height="40px" />
          )} */}
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
                color: '#163340'
              }}
              label={
                <div className="d-flex align-items-center tab-font">
                  <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
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
            <Paper>
              <Steps
                isNextStep={false}
                nextStep={nextStep}
                steps={repairOrderProcessSteps}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                isStepEnded={[REPAIR_ORDER_STATUS.completed].includes(repairOrderData?.status)}
                setStepFullScreen={() => setStepFullScreen(true)}
                handlePrev={() => {
                  if (
                    [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                      quotationVersionData?.status
                    ) &&
                    repairOrderProcessSteps[currentStep] === 'Quotation'
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
              <ContentFullScreen title={repairOrderProcessSteps[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                {repairOrderProcessSteps[currentStep] === 'Add Assets' && repairOrderData && (
                  <Productpackage
                    repairOrderData={repairOrderData}
                    setNextStep={setNextStep}
                    currencySymbol={currencySymbol}
                    isSmallScreen={isSmallScreen}
                    isTabletScreen={isTabletScreen}
                    showActivity={showActivity}
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
                    // updateOrderStatus={updateOrderStatus}
                  />
                )}
                {(repairOrderProcessSteps[currentStep] === 'Work Order' || repairOrderProcessSteps[currentStep] === 'Post Work Service') &&
                  repairOrderData && (
                    <WorkOrder
                      repairOrderData={repairOrderData}
                      setNextStep={setNextStep}
                      isSmallScreen={isSmallScreen}
                      isTabletScreen={isTabletScreen}
                      showActivity={showActivity}
                      stepFullScreen={stepFullScreen}
                      allowedToEdit={
                        [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                          quotationVersionData?.status
                        )
                          ? false
                          : allowedToEdit
                      }
                      allowedToDelete={allowedToDelete}
                      isPostWorkService={Boolean(currentStep === 3)}
                      // updateOrderStatus={updateOrderStatus}
                      setCurrentStep={setCurrentStep}
                    />
                  )}
                {repairOrderProcessSteps[currentStep] === 'Quotation' && repairOrderData && (
                  <Quotation
                    repairOrderData={repairOrderData}
                    setNextStep={setNextStep}
                    currencySymbol={currencySymbol}
                    showActivity={showActivity}
                    renderedFrom={`${renderedFrom}_grid-4`}
                    stepFullScreen={stepFullScreen}
                    allowedToEdit={allowedToEdit}
                    allowedToDelete={allowedToDelete}
                    setQuotationVersionData={setQuotationVersionData}
                    invoiceStep={false}
                    updateOrderStatus={updateOrderStatus}
                  />
                )}
                {repairOrderProcessSteps[currentStep] === 'Invoice' && repairOrderData && (
                  <Quotation
                    repairOrderData={repairOrderData}
                    setNextStep={setNextStep}
                    currencySymbol={currencySymbol}
                    showActivity={showActivity}
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
            </Paper>
          </TabPanel>
        </Box>

        <Box my={1} />

        <HideWhenOffline>
          <Paper>
            {/* {!isSmallScreen && (
                <span className={`${showActivity ? 'activityHide' : 'activityShow'} cursor-pointer`} onClick={() => setActivityShow(!showActivity)}>
                  {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
                </span>
              )} */}
            {showActivity && <div className="backdrop-new-v1" onClick={() => setActivityShow(false)}></div>}
            <div className={`activity-new-v1 ${showActivity ? 'show-activity-v1' : 'hide-activity-v1'}`}>
              <IconButton onClick={() => setActivityShow(false)} className="close-icon-v1">
                <CloseIcon />
              </IconButton>
              <Grid container>
                <Grid item xs={12}>
                  {repairOrderData && (
                    <div>
                      <Activity
                        resourceId={repairOrderData._id}
                        resource={ACTIVITY_RESOURCE.repairOrder}
                        restrictedAddActivities={
                          permissions && permissions[`${ACTIVITY_RESOURCE.repairOrder}`] && permissions[`${ACTIVITY_RESOURCE.repairOrder}`].isUpdate
                            ? []
                            : ['Attachment', 'Case']
                        }
                        relatedTo={[
                          {
                            type: ACTIVITY_RESOURCE.repairOrder,
                            referenceId: repairOrderData._id,
                            access: true
                          }
                        ]}
                        handleActivityRefresh={() => {}}
                        emails={[]}
                      />
                    </div>
                  )}
                </Grid>
              </Grid>
            </div>
          </Paper>
        </HideWhenOffline>
      </div>
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
          forwardText={'Yes'}
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
