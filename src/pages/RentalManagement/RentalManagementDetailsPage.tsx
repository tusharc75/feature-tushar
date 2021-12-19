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
import { getUniqueCurrencies, gridLoadingTimeout, rentalManagement, defaultActivityShow } from '../../constants/helpers';
import Steps from './Steps';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import { MdEdit, MdDelete } from 'react-icons/md';
import ManageRentalManagementDialog from './ManageRental/ManageRentalManagementDialog';
import Activity from '../../components/Activity';
import styles from './Retal.module.scss';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import HideWhenOffline from '../../components/HideWhenOffline';
import DeleteButton from '../../components/Helpers/DeleteButton';
import queryString from 'query-string';
import { FaWpforms } from 'react-icons/fa';
import {BiEdit, BiFoodMenu} from 'react-icons/bi';
import TabPanel from '../../components/TabPanel';
import Menu from "@material-ui/core/Menu"
import { isMobile } from "react-device-detect";
import ExpandMore from '@material-ui/icons/ExpandMore';
import { GrStatusInfo } from "react-icons/all";
import MenuItem from "@material-ui/core/MenuItem"

import Productpackage from './Productpackage';
import AdditionalCost from './AdditionalCost';
import SerializedAsset from './SerializedAsset';
import LoadingTicket from './LoadingTicket';
import ReceivingTicket from './ReceivingTicket';
import Invoice from './Invoice';

const rentalProcessSteps = ['Add Products', 'Add Services', 'Serialized Asset', 'Loading Ticket', 'Receiving Ticket', 'Ready To Invoice'];

const RentalManagementDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { isOffline, offlineFieldsData, offlineGridData, updateOfflineGridData } = useContext(CustomOfflineContext);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit, tab }: any = parsed;

  const { state: { user, permissions } }: any = useData();
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');
  const [headingLbl, setHeadingLbl] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [rentalManagementData, setRentalManagementData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [rentalManagementFields, setRentalManagementFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [statusOptions, setStatusOptions] = useState([])
  const [anchorEl, setAnchorEl] = useState(null);

  const [isInOfflineSaveQueue, setIsInOfflineSaveQueue] = useState(false);
  const [nextStep, setNextStep] = useState(true);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
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
          setTabValue(tab ? parseInt(tab) : 0)

        } else {
          setLocationKeys((keys) => [location.key, ...keys])
          console.log(tab)
          // Handle back event
          setTabValue(tab ? parseInt(tab) : 0)

        }
      }
    })
  }, [locationKeys,])

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
    if (id) {
      getRentalManagementFields();
      fetchRentalManagementData();
    }
  }, [id]);

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= 5) {
      updateProcessStatus(rentalProcessSteps[currentStep])
    }
  }, [currentStep]);

  useEffect(() => {
    if (isSmallScreen) {
      setActivityShow(true);
    }
  }, [isSmallScreen]);

  const handleMainPoints = (data) => {
    let mainPoint = {};
    setMainPoints(mainPoint);
  };

  const fetchRentalManagementData = async () => {
    try {
      let data;
      if (!isOffline) {
        const response: any = await axiosInstance().get(`${rentalManagement.rentalManagementApi}/${id}`);
        data = response?.data?.data;
      } else {
        data = offlineGridData?.rentalManagement?.find((d) => d._id === id);
      }
      if (localStorage.getItem('offlineDataToSave')) {
        const offlineDataToSave = JSON.parse(localStorage.getItem('offlineDataToSave'));
        if (offlineDataToSave['rentalManagement']) {
          setIsInOfflineSaveQueue(offlineDataToSave['rentalManagement'].some((d) => d.values._id === id));
        }
      }
      try {
        updateOfflineGridData('rentalManagement', [data], []);
      } catch (ex) {
        console.error(`Rental Management: Error while adding/updating data for Offline context. Error: ${ex.message}`);
      }
      setCurrentStep(rentalProcessSteps.indexOf(data?.processStatus) !== -1 ? rentalProcessSteps.indexOf(data?.processStatus) : 0);
      handleMainPoints(data);
      setHeadingLbl(data.rentalJobName);
      setCustomizedRoutes([routes.rentalManagement, { title: `${data.rentalJobName}` }]);
      setRentalManagementData(data);
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
        response?.data?.data.some(o => {
          if (o?.fieldData?.fieldName === "status") {
            setStatusOptions([...o.fieldData.option])
            return true
          }
        })
        setRentalManagementFields(response?.data?.data);
      } else {
        setRentalManagementFields(offlineFieldsData?.rentalManagement);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${rentalManagement.rentalManagementApi}/remove`, { ids: [rentalManagementData._id] })
      .then(() => {
        try {
          updateOfflineGridData('rentalManagement', [], [rentalManagementData._id]);
        } catch (ex) {
          console.error(`Rental Management: Error while removing data for Offline context. Error: ${ex.message}`);
        }
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

  const handleStatusChange = o => {
    if (o.optionValue && rentalManagementData?.status !== o.optionValue) {
      updateJobStatus(o.optionValue)
    }
  }

  const updateProcessStatus = (processStatus) => {
    axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/process-status`, { processStatus: processStatus }).then(({ data }) => { })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

  const updateJobStatus = (status) => {
    axiosInstance().patch(`${rentalManagement.rentalManagementApi}/status/${rentalManagementData._id}`, { status: status }).then(({ data: { data } }) => {
      fetchRentalManagementData();
      if (status === "Invoiced") {
        setCurrentStep(5)
      }
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: `Status changed to ${status}`
      });
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  }

  return (
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
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
                <DetailsPageHeader heading={headingLbl} mainPoints={mainPoints} showHeading={true}>
                  {permissions?.rentalManagement?.isUpdate && allowedToEdit && (
                    <Button className="buttonStyleBigScreen" variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                      Edit
                    </Button>
                  )}
                  {permissions?.rentalManagement?.isUpdate && allowedToEdit && (
                    <Button className="buttonStyleSmallScreen" variant="text" color="primary" size="small" onClick={handleOpenUpdateDialog} style={isMobile ? {color:"#43aeaa"} : {}}>
                      <BiEdit size={20}/>
                    </Button>
                  )}
                  {/* <HideWhenOffline>
                    {permissions?.rentalManagement?.isDelete &&
                      rentalManagementData?.owner?.optionValue &&
                      user?.user?._id &&
                      rentalManagementData.owner.optionValue === user.user._id ? (
                      <DeleteButton text="Delete" className="buttonDeleteBigScreen" onClick={() => setShowConfirmBox(true)} />
                    ) : null}
                  </HideWhenOffline>
                  <HideWhenOffline>
                    {permissions?.rentalManagement?.isDelete &&
                      rentalManagementData?.owner?.optionValue &&
                      user?.user?._id &&
                      rentalManagementData.owner.optionValue === user.user._id ? (
                      <Button variant="text" className="buttonDeleteSmallScreen" onClick={() => setShowConfirmBox(true)}>
                        <MdDelete size={20} />
                      </Button>
                    ) : null}
                  </HideWhenOffline> */}
                  {permissions?.rentalManagement?.isUpdate && (["Ready to Invoice", "Invoiced", "Closed"].includes(rentalManagementData?.status)) && (
                    <>
                      <Button
                        variant="outlined"
                        color="default"
                        size="small"
                        onClick={openActions}
                        aria-controls="action-menu"
                        endIcon={isMobile ? <ExpandMore style={{ width: "12px", height: "12px" }} /> : <ExpandMore />}
                      >
                        {isMobile ? <GrStatusInfo size={20} /> : "Change Status"}
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
                        onClose={closeActions}>
                        {statusOptions?.map((o, index) => {
                          return <MenuItem
                            disabled={index <= statusOptions.findIndex(d => d.optionLabel === "Ready to Invoice")}
                            onClick={() => {
                              closeActions()
                              handleStatusChange(o)
                            }}
                            value={o}>{o?.optionLabel}</MenuItem>
                        })}
                      </Menu>
                    </>
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
                  {loadingDetails || !rentalManagementFields.length ? (
                    <Grid container spacing={2} style={{ padding: '8px' }}>
                      <CommonSkeleton lenArray={[...Array(7).keys()]} />
                    </Grid>
                  ) : (
                    <>
                      {isInOfflineSaveQueue && (
                        <div className="px-3">
                          <Alert variant="filled" severity="info">
                            Updates are in offline state, it will be affected once you will be in network
                          </Alert>
                        </div>
                      )}

                      <DetailsPage data={rentalManagementData} fields={rentalManagementFields} />
                    </>
                  )}
                </Box>
                <div className="position-relative">
                  <HideWhenOffline>
                    {/* {showActivity ?
                <Paper>
                  {!isMobile && !isTablet && <span className="activityHide cursor-pointer" onClick={handleActivityHideShow}>
                    <IoIosArrowDropright className="icon" />
                  </span>}
                  <Grid container>
                    <Grid item xs={12}>
                      {rentalManagementData && (
                        <div>
                          <Activity
                            resourceId={rentalManagementData._id}
                            resource={rentalManagement.resource}
                            restrictedAddActivities={
                              permissions &&
                                permissions["rentalManagement"] &&
                                permissions["rentalManagement"].isUpdate
                                ? []
                                : ["Attachment", "Case"]
                            }
                            relatedTo={[
                              {
                                type: rentalManagement,
                                referenceId: rentalManagementData._id,
                                access: true,
                              },
                            ]}
                            handleActivityRefresh={() => { }}
                            emails={[]}
                          />
                        </div>
                      )}
                    </Grid>
                  </Grid>
                </Paper> :
                !isMobile && !isTablet && <span className="activityShow cursor-pointer" onClick={handleActivityHideShow}>
                  <IoIosArrowDropleft className="icon" />
                </span>} */}
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
                                  resource={rentalManagement.resource}
                                  restrictedAddActivities={
                                    permissions && permissions['rentalManagement'] && permissions['rentalManagement'].isUpdate
                                      ? []
                                      : ['Attachment', 'Case']
                                  }
                                  relatedTo={[
                                    {
                                      type: rentalManagement,
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
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <Paper>
                  <Steps
                    isNextStep={false}
                    nextStep={nextStep}
                    steps={rentalProcessSteps}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                  />
                  {currentStep === 0 && rentalManagementData && (
                    <Productpackage
                      rentalManagementData={rentalManagementData}
                      setNextStep={setNextStep}
                      currencySymbol={currencySymbol} />
                  )}
                  {currentStep === 1 && rentalManagementData &&
                    <AdditionalCost
                      rentalManagementData={rentalManagementData}
                      setNextStep={setNextStep} />}
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
                    />
                  )}
                  {(currentStep === 4) && rentalManagementData && (
                    <ReceivingTicket
                      rentalManagementData={rentalManagementData}
                      currentStep={currentStep}
                      setNextStep={setNextStep}
                    />
                  )}
                  {(currentStep === 5) && rentalManagementData && (
                    <Invoice
                      rentalManagementData={rentalManagementData}
                      setNextStep={setNextStep}
                      fetchRentalData={fetchRentalManagementData}
                      updateJobStatus={updateJobStatus}
                      statusOptions={statusOptions}
                    />
                  )}
                </Paper>
              </TabPanel>
            </Paper>
          </div>
          <Box my={1} />
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
