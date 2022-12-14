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
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import {
  serializedAsset,
  getUniqueCurrencies,
  gridLoadingTimeout,
  rentalManagement,
  defaultActivityShow,
  RENTAL_STATUS,
  rentalManagementSteps,
  ACTIVITY_RESOURCE,
  QUOTATION_STATUS,
  deliveryTicket,
  DELIVERY_TICKET_REFRENCE_TYPE,
  DELIVERY_TICKET_TYPE
} from '../../constants/helpers';
import Steps from './Steps';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import ManageRentalManagementDialog from './ManageRental';
import Activity from '../../components/Activity';
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
import RentalManagementViews from './RoadMapViews';
import { camelCase } from 'lodash';
import { updateRentalProcessStatus } from './rentalOfflineHelper';
import Quotation from './Quotation';
import ProgressiveBilling from './ProgressiveBilling';
import Services from './Services';
import Consumables from './Consumables';

const RentalManagementDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { isOffline, updateOfflineGridData } = useContext(CustomOfflineContext);
  const renderedFrom = camelCase(routes?.rentalManagement.title);

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
  const [isProcessor, setIsProcessor] = useState(false);

  const [statusOptions, setStatusOptions] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const [nextStep, setNextStep] = useState(false);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [locationKeys, setLocationKeys] = useState([]);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [showCancelConfirmBox, setShowCancelConfirmBox] = useState({ open: false, isQuote: false });
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const [quotationData, setQuotationData] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);

  const [allowUpdateStatus, setAllowUpdateStatus] = useState(false);
  const [displayProgressiveBillingTab, setDisplayProgressiveBillingTab] = useState(false);

  const [rentalSteps, setRentalSteps] = useState(
    user?.role?.selectedEntity?.policy?.isQuotationRentalManagement
      ? rentalManagementSteps
      : rentalManagementSteps?.filter((e) => !['Quotation', 'Add Services'].includes(e))
  );

  const [versionNotClonned, setVersionNotClonned] = useState(false);
  const [reOpening, setReOpening] = useState(false);

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
    if (isSmallScreen && tabValue === 0) {
      setActivityShow(true);
    } else {
      setActivityShow(false);
    }
  }, [isSmallScreen, tabValue]);

  useEffect(() => {
    if (id) {
      getRentalManagementFields();
      fetchRentalManagementData();
      fetchQuotationData();
    }
    if (!isOffline) {
      fetchAssetStatusRights();
    }
    checkProgressiveBilling();
  }, [id]);

  const checkProgressiveBilling = () => {
    if (user?.role?.selectedEntity?.policy?.isProgressiveBillingRentalManagement) {
      axiosInstance()
        .get(
          `${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}&refrenceId=${id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
        )
        .then(({ data: { data } }) => {
          if (data.length > 0) {
            setDisplayProgressiveBillingTab(true);
          }
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  };

  const fetchQuotationData = (versionNumber = null, createIfNotExits = false) => {
    axiosInstance()
      .get(
        createIfNotExits
          ? `${rentalManagement.api}/${rentalManagementData._id}/quotation?createIfNotExits=1`
          : `${rentalManagement.api}/${id}/quotation`
      )
      .then(({ data: { data } }) => {
        if (data?.versions) {
          setQuotationData(data);
          let keys = Object.keys(data.versions);
          setCurrentVersion(versionNumber ? versionNumber : parseInt(keys[keys.length - 1]));
          const lastQuoteVersion = data?.versions[versionNumber ? versionNumber : parseInt(keys[keys.length - 1])];
          if ([QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer].includes(lastQuoteVersion?.status)) {
            setVersionNotClonned(true);
          } else {
            setVersionNotClonned(false);
          }
        }
      });
  };

  const fetchAssetStatusRights = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}&view=true`)
      .then(({ data }) => {
        if (data.data && data.data.length) {
          data.data.some((o) => {
            if (o?.fieldData?.fieldName === 'status') {
              setAllowUpdateStatus(o?.isUpdate);
              return true;
            }
          });
        }
      })
      .catch((err) => {});
  };

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= 7) {
      fetchQuotationData();
      updateProcessStatus(rentalSteps[currentStep]);
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
      setCurrentStep(rentalSteps.indexOf(data?.processStatus) !== -1 ? rentalSteps.indexOf(data?.processStatus) : 0);
      handleMainPoints(data);
      setLoadingDetails(false);
      setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === data['currency'])?.symbolNative);
      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      setAllowedToEdit(isAllowedToEdit);
      setAllowedToDelete(data.owner.optionValue === user?.user?._id);
      const isProcessor = [data.processor].some((d) => d?.optionValue === user?.user?._id);
      setIsProcessor(isProcessor);
      setRentalManagementData(data);
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
        setShowCancelConfirmBox({ open: false, isQuote: false });
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

  const updateProcessStatus = async (processStatus) => {
    if (isOffline) {
      await updateRentalProcessStatus(id, processStatus);
    } else {
      axiosInstance()
        .put(`${rentalManagement.api}/${id}/process-status`, { processStatus: processStatus })
        .then(({ data }) => {})
        .catch((error) => {});
    }
  };

  const updateJobStatus = (status) => {
    axiosInstance()
      .patch(`${rentalManagement.api}/status/${rentalManagementData._id}`, { status: status })
      .then(({ data: { data } }) => {
        if (status === 'Invoiced' || status === 'Closed') {
          updateProcessStatus(rentalSteps[rentalSteps?.length - 1]);
          setCurrentStep(rentalSteps?.length - 1);
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

  const cloneVersion = () => {
    const versionId = quotationData?.versions[currentVersion]?._id;
    axiosInstance()
      .post(`/quotation/clone-version/${quotationData._id}/${versionId}`)
      .then(() => {
        fetchQuotationData();
        setShowCancelConfirmBox({ open: false, isQuote: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleRentalReOpen = () => {
    setReOpening(true);
    axiosInstance()
      .patch(`${rentalManagement.api}/status/${rentalManagementData._id}`, { status: RENTAL_STATUS.inProgress })
      .then(({ data }) => {
        setReOpening(false);
        fetchRentalManagementData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status changed to In-Progress`
        });
      })
      .catch((error) => {
        setReOpening(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={[routes.rentalManagement, { title: `${rentalManagementData ? rentalManagementData?.rentalJobName : ''}` }]} />
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
                  <Fragment>
                    {['Add Products', 'Add Services', 'Add-on'].includes(rentalSteps[currentStep]) && versionNotClonned && (
                      <Button
                        disabled={!versionNotClonned}
                        className="buttonStyleBigScreen"
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => {
                          setVersionNotClonned(false);
                          cloneVersion();
                        }}
                      >
                        Create New Version
                      </Button>
                    )}
                    {user?.role?.selectedEntity?.policy?.isRentalReopen && rentalManagementData?.status === RENTAL_STATUS.closed && (
                      <Button
                        className="buttonStyleBigScreen"
                        variant="contained"
                        color="primary"
                        size="small"
                        endIcon={reOpening ? <CircularProgress size={20} /> : null}
                        disabled={reOpening}
                        onClick={() => {
                          handleRentalReOpen();
                        }}
                      >
                        Re-Open
                      </Button>
                    )}
                    {permissions?.rentalManagement?.isUpdate &&
                      allowedToEdit &&
                      !isOffline &&
                      ![RENTAL_STATUS.cancelled, RENTAL_STATUS.closed].includes(rentalManagementData?.status) &&
                      !(
                        [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                          quotationData?.versions[currentVersion]?.status
                        ) && ['Add Products', 'Add Services', 'Add-on'].includes(rentalSteps[currentStep])
                      ) && (
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
                  </Fragment>
                  {/* {permissions?.rentalManagement?.isUpdate &&
                    [RENTAL_STATUS.new, RENTAL_STATUS.inProgress].includes(rentalManagementData?.status) && (
                      <Button variant="outlined" color="primary" size="small" onClick={() => setShowCancelConfirmBox(true)}>
                        {'Cancel ' + routes.rentalManagement.title}
                      </Button>
                    )} */}
                  {permissions?.rentalManagement?.isUpdate &&
                    !isOffline &&
                    [RENTAL_STATUS.readyToInvoice, RENTAL_STATUS.invoiced].includes(rentalManagementData?.status) &&
                    allowedToEdit && (
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
                {displayProgressiveBillingTab && (
                  <Tab
                    className={'tabLayout'}
                    style={{
                      background: tabValue === 3 ? 'white' : '',
                      color: '#163340'
                    }}
                    label={
                      <div className="d-flex align-items-center tab-font">
                        <RiFlowChart className="mr-1" fontSize="inherit" /> Progressive Billing
                      </div>
                    }
                    {...a11yProps(2)}
                  />
                )}
                {!isOffline && (
                  <Tab
                    className={'tabLayout'}
                    style={{
                      background: tabValue === 4 ? 'white' : '',
                      color: '#163340'
                    }}
                    label={
                      <div className="d-flex align-items-center tab-font">
                        <RiFlowChart className="mr-1" fontSize="inherit" />
                        Views
                      </div>
                    }
                    {...a11yProps(3)}
                  />
                )}
                <div className={'uio'}></div>
              </Tabs>
              <TabPanel value={tabValue} index={0}>
                <Box>
                  {!loadingDetails && rentalManagementData && rentalManagementFields.length > 0 ? (
                    <DetailsPage data={rentalManagementData} fields={rentalManagementFields} />
                  ) : null}
                </Box>
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <Paper>
                  <Steps
                    isNextStep={false}
                    nextStep={nextStep}
                    steps={rentalSteps}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                    handlePrev={() => {
                      if (
                        (quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ||
                          quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer) &&
                        rentalSteps[currentStep] === 'Quotation'
                      ) {
                        setShowCancelConfirmBox({ open: true, isQuote: true });
                      } else {
                        setCurrentStep((prevStep) => {
                          const newStep = prevStep - 1;
                          return newStep;
                        });
                      }
                    }}
                    isStepEnded={[RENTAL_STATUS.invoiced, RENTAL_STATUS.closed, RENTAL_STATUS.cancelled].includes(rentalManagementData?.status)}
                    setStepFullScreen={() => setStepFullScreen(true)}
                  />
                  <ContentFullScreen title={rentalSteps[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                    {rentalSteps[currentStep] === 'Add Products' && rentalManagementData && (
                      <Productpackage
                        rentalManagementData={rentalManagementData}
                        setNextStep={setNextStep}
                        currencySymbol={currencySymbol}
                        isSmallScreen={isSmallScreen}
                        isTabletScreen={isTabletScreen}
                        showActivity={showActivity}
                        renderedFrom={`${renderedFrom}_grid-1`}
                        stepFullScreen={stepFullScreen}
                        allowedToEdit={
                          [
                            QUOTATION_STATUS.acceptByCustomer,
                            QUOTATION_STATUS.rejectByCustomer,
                            QUOTATION_STATUS.sentToCustomer,
                            QUOTATION_STATUS.waitingForSupplierPrice
                          ].includes(quotationData?.versions[currentVersion]?.status)
                            ? false
                            : allowedToEdit
                        }
                      />
                    )}
                    {rentalSteps[currentStep] === 'Add Services' && rentalManagementData && (
                      <Services
                        rentalManagementData={rentalManagementData}
                        setNextStep={setNextStep}
                        currencySymbol={currencySymbol}
                        isSmallScreen={isSmallScreen}
                        isTabletScreen={isTabletScreen}
                        showActivity={showActivity}
                        renderedFrom={`${renderedFrom}_grid-1`}
                        stepFullScreen={stepFullScreen}
                        allowedToEdit={
                          [
                            QUOTATION_STATUS.acceptByCustomer,
                            QUOTATION_STATUS.rejectByCustomer,
                            QUOTATION_STATUS.sentToCustomer,
                            QUOTATION_STATUS.waitingForSupplierPrice
                          ].includes(quotationData?.versions[currentVersion]?.status)
                            ? false
                            : allowedToEdit
                        }
                      />
                    )}
                    {/* {rentalSteps[currentStep] === 'Add Consumables' && rentalManagementData && (
                      <Consumables
                        rentalManagementData={rentalManagementData}
                        setNextStep={setNextStep}
                        currencySymbol={currencySymbol}
                        isSmallScreen={isSmallScreen}
                        isTabletScreen={isTabletScreen}
                        showActivity={showActivity}
                        renderedFrom={`${renderedFrom}_grid-2`}
                        stepFullScreen={stepFullScreen}
                        allowedToEdit={allowedToEdit}
                      />
                    )} */}
                    {rentalSteps[currentStep] === 'Add-on' && rentalManagementData && (
                      <AdditionalCost
                        rentalManagementData={rentalManagementData}
                        setNextStep={setNextStep}
                        renderedFrom={`${renderedFrom}_grid-2`}
                        allowedToEdit={
                          [
                            QUOTATION_STATUS.acceptByCustomer,
                            QUOTATION_STATUS.rejectByCustomer,
                            QUOTATION_STATUS.sentToCustomer,
                            QUOTATION_STATUS.waitingForSupplierPrice
                          ].includes(quotationData?.versions[currentVersion]?.status)
                            ? false
                            : allowedToEdit
                        }
                      />
                    )}
                    {rentalSteps[currentStep] === 'Quotation' && rentalManagementData && (
                      <Quotation
                        rentalManagementData={rentalManagementData}
                        setNextStep={setNextStep}
                        currencySymbol={currencySymbol}
                        isSmallScreen={isSmallScreen}
                        isTabletScreen={isTabletScreen}
                        showActivity={showActivity}
                        stepFullScreen={stepFullScreen}
                        allowedToEdit={allowedToEdit}
                        allowedToDelete={allowedToDelete}
                        fetchQuotationData={fetchQuotationData}
                        quotationData={quotationData}
                        currentVersion={currentVersion}
                        setCurrentVersion={setCurrentVersion}
                      />
                    )}
                    {rentalSteps[currentStep] === 'Serialized Asset' && rentalManagementData && (
                      <SerializedAsset
                        rentalManagementData={rentalManagementData}
                        setNextStep={setNextStep}
                        isSmallScreen={isSmallScreen}
                        isTabletScreen={isTabletScreen}
                        showActivity={showActivity}
                        currencySymbol={currencySymbol}
                        stepFullScreen={stepFullScreen}
                        allowedToEdit={allowedToEdit}
                      />
                    )}
                    {rentalSteps[currentStep] === 'Loading Ticket' && rentalManagementData && (
                      <LoadingTicket
                        fetchRentalData={fetchRentalManagementData}
                        rentalManagementData={rentalManagementData}
                        currentStep={currentStep}
                        setNextStep={setNextStep}
                        renderedFrom={`${renderedFrom}_grid-3`}
                        allowedToEdit={allowedToEdit}
                        isProcessor={isProcessor}
                        allowUpdateStatus={allowUpdateStatus}
                        checkProgressiveBilling={checkProgressiveBilling}
                      />
                    )}
                    {rentalSteps[currentStep] === 'Receiving Ticket' && rentalManagementData && (
                      <ReceivingTicket
                        fetchRentalData={fetchRentalManagementData}
                        rentalManagementData={rentalManagementData}
                        currentStep={currentStep}
                        setNextStep={setNextStep}
                        renderedFrom={`${renderedFrom}_grid-4`}
                        allowedToEdit={allowedToEdit}
                        isProcessor={isProcessor}
                        allowUpdateStatus={allowUpdateStatus}
                      />
                    )}
                    {rentalSteps[currentStep] === 'Final Slip' && rentalManagementData && (
                      <Invoice
                        rentalManagementData={rentalManagementData}
                        setNextStep={setNextStep}
                        fetchRentalData={fetchRentalManagementData}
                        updateJobStatus={updateJobStatus}
                        isSmallScreen={isSmallScreen}
                        isTabletScreen={isTabletScreen}
                        statusOptions={statusOptions}
                        renderedFrom={`${renderedFrom}_grid-5`}
                        showActivity={showActivity}
                        currencySymbol={currencySymbol}
                        stepFullScreen={stepFullScreen}
                        allowedToEdit={allowedToEdit}
                      />
                    )}
                  </ContentFullScreen>
                </Paper>
              </TabPanel>
              <TabPanel value={tabValue} index={2}>
                <Box>
                  {displayProgressiveBillingTab ? (
                    <ProgressiveBilling rentalId={id} rentalManagementData={rentalManagementData} currencySymbol={currencySymbol} />
                  ) : (
                    <RentalManagementViews rentalName={rentalManagementData?.rentalJobName} rentalId={id} status={rentalManagementData?.status} />
                  )}
                </Box>
              </TabPanel>
              <TabPanel value={tabValue} index={3}>
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
              <div style={{ display: showActivity ? 'block' : 'none' }}>
                <Grid container>
                  <Grid item xs={12}>
                    {rentalManagementData && (
                      <div>
                        <Activity
                          resourceId={rentalManagementData._id}
                          resource={ACTIVITY_RESOURCE.rentalManagement}
                          restrictedAddActivities={
                            permissions &&
                            permissions[`${ACTIVITY_RESOURCE.rentalManagement}`] &&
                            permissions[`${ACTIVITY_RESOURCE.rentalManagement}`].isUpdate
                              ? []
                              : ['Attachment', 'Case']
                          }
                          relatedTo={[
                            {
                              type: `${ACTIVITY_RESOURCE.rentalManagement}`,
                              referenceId: rentalManagementData._id,
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
      {showCancelConfirmBox.open && (
        <ConfirmationDialog
          open={showCancelConfirmBox.open}
          message={
            showCancelConfirmBox.isQuote
              ? 'Do you want to create a new version of the quote?'
              : `Are you sure you want to cancel this ${routes.rentalManagement.title.toLowerCase()} ?`
          }
          onClose={() => {
            setShowCancelConfirmBox({ open: false, isQuote: false });
            if (showCancelConfirmBox.isQuote) {
              setCurrentStep((prevStep) => {
                const newStep = prevStep - 1;
                return newStep;
              });
            }
          }}
          onOk={() => (showCancelConfirmBox.isQuote ? cloneVersion() : handleCancelRentalJob())}
          forwardText={showCancelConfirmBox.isQuote ? 'Yes' : null}
          cancelText={showCancelConfirmBox.isQuote ? 'No' : null}
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
