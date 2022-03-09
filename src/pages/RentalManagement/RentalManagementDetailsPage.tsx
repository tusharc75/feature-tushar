import React, { useState, useEffect, useContext, Fragment, useReducer, useMemo } from 'react';
import { Grid, Box, Button, Paper, CircularProgress, useMediaQuery, Typography, Tab, Tabs } from '@material-ui/core';
import { Skeleton, Alert } from '@material-ui/lab';
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
  getUniqueCurrencies,
  gridLoadingTimeout,
  rentalManagement,
  defaultActivityShow,
  RENTAL_STATUS,
  rentalManagementSteps,
  ACTIVITY_RESOURCE
} from '../../constants/helpers';
import Steps from './Steps';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import { MdEdit, MdDelete } from 'react-icons/md';
import ManageRentalManagementDialog from './ManageRental/ManageRentalManagementDialog';
import Activity from '../../components/Activity';
import styles from './Retal.module.scss';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import HideWhenOffline from '../../components/HideWhenOffline';
import ContentFullScreen from '../../components/ContentFullScreen';
import DeleteButton from '../../components/Helpers/DeleteButton';
import queryString from 'query-string';
import { FaWpforms } from 'react-icons/fa';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import { RiFlowChart } from 'react-icons/ri';
import TabPanel from '../../components/TabPanel';
import Menu from '@material-ui/core/Menu';
import { isMobile } from 'react-device-detect';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { GrStatusInfo } from 'react-icons/all';
import MenuItem from '@material-ui/core/MenuItem';
import { objectStore, insertUpdate, findAll, findOne } from '../../constants/indexdbhelper';
import Productpackage from './Productpackage';
import AdditionalCost from './AdditionalCost';
import SerializedAsset from './SerializedAsset';
import LoadingTicket from './LoadingTicket';
import ReceivingTicket from './ReceivingTicket';
import Invoice from './Invoice';
import RentalManagementViews from './RoadMapViews/RentalManagementViews';
import { camelCase } from 'lodash';

const RentalManagementDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { isOffline, updateOfflineGridData } = useContext(CustomOfflineContext);
  const renderedFrom = camelCase(routes?.rentalManagement.title)

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit, tab }: any = parsed;

  const {
    state: { user, permissions }
  }: any = useData();
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [rentalManagementData, setRentalManagementData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [rentalManagementFields, setRentalManagementFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const [nextStep, setNextStep] = useState(true);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [locationKeys, setLocationKeys] = useState([]);

  const [showCancelConfirmBox, setShowCancelConfirmBox] = useState(false);
  const [stepFullScreen, setStepFullScreen] = useState(false);

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
          setTabValue(tab ? parseInt(tab) : 0);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setTabValue(tab ? parseInt(tab) : 0);
        }
      }
    });
  }, [locationKeys]);

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity);
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  useEffect(() => {
    if (isSmallScreen) {
      setActivityShow(true)
    }
  }, [isSmallScreen])

  useEffect(() => {
    if (id) {
      getRentalManagementFields();
      fetchRentalManagementData();
    }
  }, [id]);

  useEffect(() => {
    if (!isOffline && currentStep !== null && currentStep >= 0 && currentStep <= 5) {
      updateProcessStatus(rentalManagementSteps[currentStep]);
    }
  }, [currentStep]);

  const handleMainPoints = (data) => {
    let mainPoint = {};
    setMainPoints(mainPoint);
  };

  const fetchRentalManagementData = async () => {
    try {
      let data;
      if (!isOffline) {
        const response: any = await axiosInstance().get(`${rentalManagement.api}/${id}`);
        data = response?.data?.data;
      } else {
        data = await findOne(objectStore.rentalManagement, id);
      }

      setRentalManagementData(data);
      setCurrentStep(rentalManagementSteps.indexOf(data?.processStatus) !== -1 ? rentalManagementSteps.indexOf(data?.processStatus) : 0);
      handleMainPoints(data);
      setLoadingDetails(false);
      setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === data['currency'])?.symbolNative);
      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      setAllowedToEdit(isAllowedToEdit);
      if (isAllowedToEdit && openEdit === 'true') {
        setOpenUpdateDialog(true);
        const params = new URLSearchParams();
        params.delete('openEdit');
        history.push({ search: params.toString() });
      }
    } catch (error) {
      setLoadingDetails(false);
      toastConfig.setToastConfig(error);
    }
  };

  const getRentalManagementFields = async () => {
    try {
      if (!isOffline) {
        const response: any = await axiosInstance().get('/field?resource=Rental Management');
        response?.data?.data.some((o) => {
          if (o?.fieldData?.fieldName === 'status') {
            setStatusOptions([...o.fieldData.option?.filter((e) => ![RENTAL_STATUS.cancelled].includes(e.optionLabel))]);
            return true;
          }
        });
        setRentalManagementFields(response?.data?.data);
      } else {
        const response: any = await findOne(objectStore.resource, objectStore.rentalManagement);
        setRentalManagementFields(response);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleCancelRentalJob = () => {
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData._id}/cancel`)
      .then(() => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `${routes.rentalManagement.title} cancelled successfully`
        });
        fetchRentalManagementData();
        setShowCancelConfirmBox(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${rentalManagement.api}/remove`, { ids: [rentalManagementData._id] })
      .then(() => {
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (o) => {
    if (o.optionValue && rentalManagementData?.status !== o.optionValue) {
      updateJobStatus(o.optionValue);
    }
  };

  const updateProcessStatus = (processStatus) => {
    axiosInstance()
      .put(`${rentalManagement.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => { })
      .catch((error) => {
      });
  };

  const updateJobStatus = (status) => {
    axiosInstance()
      .patch(`${rentalManagement.api}/status/${rentalManagementData._id}`, { status: status })
      .then(({ data: { data } }) => {
        if (status === 'Invoiced' || status === 'Closed') {
          updateProcessStatus(rentalManagementSteps[5]);
          setCurrentStep(5);
        }
        fetchRentalManagementData();
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

  return (
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={[routes.rentalManagement, { title: `${rentalManagementData ? rentalManagementData?.rentalJobName : ""}` }]} />
      </Grid>
      <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`}>
        <div>
          <div>
            <Paper>
              {!rentalManagementData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                    <Box marginX={1} />
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  </Box>
                </div>
              ) : (
                <DetailsPageHeader heading={rentalManagementData?.rentalJobName} mainPoints={mainPoints} showHeading={true}>
                  {permissions?.rentalManagement?.isUpdate &&
                    allowedToEdit &&
                    !isOffline &&
                    ![RENTAL_STATUS.cancelled, RENTAL_STATUS.closed].includes(rentalManagementData?.status) && (
                      <Fragment>
                        <Button className="buttonStyleBigScreen" variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                          Edit
                        </Button>
                        <Button
                          className="buttonStyleSmallScreen"
                          variant="text"
                          color="primary"
                          size="small"
                          onClick={handleOpenUpdateDialog}
                          style={isMobile ? { color: '#43aeaa' } : {}}
                        >
                          <BiEdit size={20} />
                        </Button>
                      </Fragment>
                    )}
                  {permissions?.rentalManagement?.isUpdate &&
                    ![RENTAL_STATUS.cancelled, RENTAL_STATUS.invoiced, RENTAL_STATUS.closed].includes(rentalManagementData?.status) && (
                      <Button variant="outlined" color="primary" size="small" onClick={() => setShowCancelConfirmBox(true)}>
                        {'Cancel ' + routes.rentalManagement.title}
                      </Button>
                    )}
                  {permissions?.rentalManagement?.isUpdate &&
                    [RENTAL_STATUS.readyToInvoice, RENTAL_STATUS.invoiced].includes(rentalManagementData?.status) && (
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
                                disabled={index <= statusOptions.findIndex((d) => d.optionLabel === rentalManagementData?.status)}
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
                <Tab
                  className={'tabLayout'}
                  style={{
                    background: tabValue === 3 ? 'white' : '',
                    color: tabValue === 3 ? 'blue' : '#163340'
                  }}
                  label={
                    <div className="d-flex align-items-center tab-font">
                      <RiFlowChart className="mr-1" fontSize="inherit" /> Views
                    </div>
                  }
                  {...a11yProps(2)}
                />
                <div className={'uio'}> </div>
              </Tabs>
              <TabPanel value={tabValue} index={0}>
                <Box>

                  {(!loadingDetails && rentalManagementFields.length > 0 ?
                    <DetailsPage data={rentalManagementData} fields={rentalManagementFields}
                    /> : null
                  )}
                </Box>
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <Paper>
                  <Steps
                    isNextStep={false}
                    nextStep={nextStep}
                    steps={rentalManagementSteps}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                    isStepEnded={[RENTAL_STATUS.invoiced, RENTAL_STATUS.closed, RENTAL_STATUS.cancelled].includes(rentalManagementData?.status)}
                    setStepFullScreen={setStepFullScreen}
                  />
                  <ContentFullScreen title={rentalManagementSteps[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen} >
                    {currentStep === 0 && rentalManagementData && (
                      <Productpackage
                        rentalManagementData={rentalManagementData}
                        setNextStep={setNextStep}
                        currencySymbol={currencySymbol}
                        isSmallScreen={isSmallScreen}
                        isTabletScreen={isTabletScreen}
                        showActivity={showActivity}
                        renderedFrom={`${renderedFrom}_grid-1`}
                      />
                    )}
                    {currentStep === 1 && rentalManagementData && (
                      <AdditionalCost rentalManagementData={rentalManagementData} setNextStep={setNextStep} renderedFrom={`${renderedFrom}_grid-2`} />
                    )}
                    {currentStep === 2 && rentalManagementData && (
                      <SerializedAsset
                        rentalManagementData={rentalManagementData}
                        setNextStep={setNextStep}
                        isSmallScreen={isSmallScreen}
                        isTabletScreen={isTabletScreen}
                        showActivity={showActivity}
                        currencySymbol={currencySymbol}
                      />
                    )}
                    {currentStep === 3 && rentalManagementData && (
                      <LoadingTicket
                        fetchRentalData={fetchRentalManagementData}
                        rentalManagementData={rentalManagementData}
                        currentStep={currentStep}
                        setNextStep={setNextStep}
                        renderedFrom={`${renderedFrom}_grid-3`}
                      />
                    )}
                    {currentStep === 4 && rentalManagementData && (
                      <ReceivingTicket
                        fetchRentalData={fetchRentalManagementData}
                        rentalManagementData={rentalManagementData}
                        currentStep={currentStep}
                        setNextStep={setNextStep}
                        renderedFrom={`${renderedFrom}_grid-4`}
                      />
                    )}
                    {currentStep === 5 && rentalManagementData && (
                      <Invoice
                        rentalManagementData={rentalManagementData}
                        setNextStep={setNextStep}
                        fetchRentalData={fetchRentalManagementData}
                        updateJobStatus={updateJobStatus}
                        statusOptions={statusOptions}
                        renderedFrom={`${renderedFrom}_grid-5`}
                      />
                    )}
                  </ContentFullScreen>
                </Paper>
              </TabPanel>
              <TabPanel value={tabValue} index={2}>
                <Box>
                  <RentalManagementViews rentalName={rentalManagementData?.rentalJobName} rentalId={id} status={rentalManagementData?.status} />
                </Box>
              </TabPanel>
            </Paper>
          </div>
          <Box my={1} />
        </div>
        <div className="position-relative">
          <HideWhenOffline>
            <Paper>
              {!isSmallScreen && (
                <span className={`${showActivity ? 'activityHide' : 'activityShow'} cursor-pointer`} onClick={handleActivityHideShow}>
                  {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
                </span>
              )}
              <div style={{ display: showActivity || (isSmallScreen && tabValue === 0) ? 'block' : 'none' }}>
                <Grid container>
                  <Grid item xs={12}>
                    {rentalManagementData && (
                      <div>
                        <Activity
                          resourceId={rentalManagementData._id}
                          resource={ACTIVITY_RESOURCE.rentalManagement}
                          restrictedAddActivities={
                            permissions && permissions[`${ACTIVITY_RESOURCE.rentalManagement}`] && permissions[`${ACTIVITY_RESOURCE.rentalManagement}`].isUpdate ? [] : ['Attachment', 'Case']
                          }
                          relatedTo={[
                            {
                              type: `${ACTIVITY_RESOURCE.rentalManagement}`,
                              referenceId: rentalManagementData._id,
                              access: true
                            }
                          ]}
                          handleActivityRefresh={() => { }}
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
      </div>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.rentalManagement.title.toLowerCase()} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {showCancelConfirmBox && (
        <ConfirmationDialog
          open={showCancelConfirmBox}
          message={`Are you sure you want to cancel this ${routes.rentalManagement.title.toLowerCase()} ?`}
          onClose={() => {
            setShowCancelConfirmBox(false);
          }}
          onOk={handleCancelRentalJob}
        />
      )}
      {openUpdateDialog && (
        <ManageRentalManagementDialog
          isClone={false}
          open={openUpdateDialog}
          rentalManagementId={id}
          rentalManagementData={rentalManagementData}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchRentalManagementData();
          }}
        />
      )}
    </>
  );
};

export default RentalManagementDetailsPage;
