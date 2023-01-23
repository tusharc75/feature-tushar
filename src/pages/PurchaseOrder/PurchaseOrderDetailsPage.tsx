import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Grid, Box, Button, Paper, useMediaQuery, Tab, Tabs } from '@material-ui/core';
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
import { purchaseOrder, purchaseOrderSteps, PURCHASE_ORDER_STATUS, ACTIVITY_RESOURCE } from '../../constants/helpers';
import ManagePurchaseOrder from './ManagePurchaseOrder';
import ExpandMore from '@material-ui/icons/ExpandMore';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import { FaWpforms } from 'react-icons/fa';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import TabPanel from '../../components/TabPanel';
import queryString from 'query-string';
import { isMobile, isTablet } from 'react-device-detect';
import Product from './Product';
import HideWhenOffline from '../../components/HideWhenOffline';
import Service from './Service';
import IssuePo from './IssuePo';
import Activity from '../../components/Activity';
import { defaultActivityShow } from '../../constants/helpers';
import ReceivingAsset from './ReceivingAsset';
import { GrStatusGood, GrStatusInfo, RiFlowChart } from 'react-icons/all';
import accountClass from '../Account/account.module.scss';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import Steps from '../RentalManagement/Steps';
import { camelCase } from 'lodash';
import ContentFullScreen from '../../components/ContentFullScreen';
import PurchaseOrderViews from './RoadMapViews';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import Invoice from './Invoice';
import ActivityButton from 'src/components/Activity/ActivityButton';

const PurchaseOrderDetailsPage = () => {
  const renderedFrom = camelCase(routes?.purchaseOrder.title);
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit } = parsed;
  const {
    state: { user, permissions }
  }: any = useData();

  const [loadingPurchaseOrder, setLoadingPurchaseOrder] = useState(false);
  const [purchaseOrderData, setPurchaseOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [purchaseOrderFields, setPurchaseOrderFields] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [purchaseOrderProduct, setPurchaseOrderProduct] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');

  const [tabValue, setTabValue] = useState(Number(parsed?.tab || 0));
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [nextStep, setNextStep] = useState(true);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.replace(`?tab=${newValue}`);
  };

  useEffect(() => {
    if (parsed) {
      history.replace(`?tab=${tabValue}`);
    }
  }, []);

  useEffect(() => {
    if (id) {
      getPurchaseOrderFields();
      fetchPurchaseOrderData();
    }
  }, [id]);

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= 3) {
      updateProcessStatus(purchaseOrderSteps[currentStep]);
    }
  }, [currentStep]);

  const fetchPurchaseOrderData = async () => {
    setLoadingPurchaseOrder(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${purchaseOrder.api}/${id}`);
      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      setAllowedToEdit(isAllowedToEdit);
      setPurchaseOrderData(data);
      setCurrentStep(purchaseOrderSteps.indexOf(data?.processStatus) !== -1 ? purchaseOrderSteps.indexOf(data?.processStatus) : 0);
      if (isAllowedToEdit && openEdit === 'true') {
        setOpenUpdateDialog(true);
        const params = new URLSearchParams();
        params.delete('openEdit');
        history.push({ search: params.toString() });
      }
      setLoadingPurchaseOrder(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    if (isSmallScreen && tabValue === 0) {
      setActivityShow(true);
    } else {
      setActivityShow(false);
    }
  }, [isSmallScreen, tabValue]);

  const getPurchaseOrderFields = () => {
    axiosInstance()
      .get('/field?resource=Purchase Order')
      .then(({ data }) => {
        setPurchaseOrderFields(data.data);
        if (data.data && data.data.length) {
          data.data.some((o) => {
            if (o?.fieldData?.fieldName === 'status') {
              setStatusOptions([...o.fieldData.option]);
              return true;
            }
          });
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${purchaseOrder.api}/remove`, { ids: [] })
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
    updateStatus(o.optionValue);
  };

  const updateProcessStatus = async (processStatus) => {
    axiosInstance()
      .put(`${purchaseOrder.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => { })
      .catch((error) => { });
  };

  const updateStatus = (status) => {
    axiosInstance()
      .patch(`${purchaseOrder.api}/status/${id}`, { status: status })
      .then(({ data: { data } }) => {
        if ([PURCHASE_ORDER_STATUS.closed].includes(status)) {
          updateProcessStatus(purchaseOrderSteps[1]);
          setCurrentStep(1);
        }
        fetchPurchaseOrderData();
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

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity);
  };

  const checkReceivedProduct = (products) => {
    if (products?.length && purchaseOrderData?.status !== PURCHASE_ORDER_STATUS.closed) {
      var isCompleteReceived = false;
      var isPartialReceived = products?.some((e) => e?.actualReceived);
      if (products?.filter((e) => e?.qty - ((e?.actualReceived || 0) + (e?.rejectQuantity || 0)) > 0).length > 0) {
        isCompleteReceived = false;
      } else {
        isCompleteReceived = true;
      }
      if (isPartialReceived && !isCompleteReceived && purchaseOrderData?.status !== PURCHASE_ORDER_STATUS.partialReceived) {
        updateStatus(PURCHASE_ORDER_STATUS.partialReceived);
      }
      if (isCompleteReceived && purchaseOrderData?.status !== PURCHASE_ORDER_STATUS.received) {
        updateStatus(PURCHASE_ORDER_STATUS.received);
      }
      if (isCompleteReceived === false && isPartialReceived === false && purchaseOrderData?.status !== PURCHASE_ORDER_STATUS.open) {
        updateStatus(PURCHASE_ORDER_STATUS.open);
      }
    }
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.purchaseOrder, { title: `${purchaseOrderData?.purchaseOrderNumber}` }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {!purchaseOrderData ? (
              <div>
                <Skeleton variant="text" width="150px" height="40px" />
                <Box display="flex">
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  <Box marginX={1} />
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                </Box>
              </div>
            ) : (
              <>
                {purchaseOrderData?.deleted ? null : ![PURCHASE_ORDER_STATUS.closed].includes(purchaseOrderData?.status) ? (
                  <HtmlTooltip
                    title={
                      permissions?.purchaseOrder?.isUpdate && allowedToEdit ? '' : `Owner or Collaborator can edit ${routes.purchaseOrder.title}`
                    }
                  >
                    <span>
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        className={'btn-outline-v1'}
                        onClick={handleOpenUpdateDialog}
                        disabled={permissions?.purchaseOrder?.isUpdate && allowedToEdit ? false : true}
                      >
                        {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                      </Button>
                    </span>
                  </HtmlTooltip>
                ) : (
                  <HtmlTooltip
                    title={
                      permissions?.purchaseOrder?.isUpdate && allowedToEdit ? '' : `Owner or Collaborator can reopen ${routes.purchaseOrder.title}`
                    }
                  >
                    <span>
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        color="primary"
                        size="small"
                        onClick={() => updateStatus(PURCHASE_ORDER_STATUS.received)}
                        className={isMobile && !isTablet ? accountClass.mobile_button_layout : ''}
                        style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                        disabled={permissions?.purchaseOrder?.isUpdate && allowedToEdit ? false : true}
                      >
                        {isMobile && !isTablet ? <BiEdit size={20} /> : 'Reopen'}
                      </Button>
                    </span>
                  </HtmlTooltip>
                )}
                {permissions?.purchaseOrder?.isUpdate &&
                  allowedToEdit &&
                  !purchaseOrderData?.deleted &&
                  [PURCHASE_ORDER_STATUS.received].includes(purchaseOrderData?.status) && (
                    <Fragment>
                      <Button
                        variant={'outlined'}
                        color="primary"
                        size="small"
                        onClick={openActions}
                        aria-controls="action-menu"
                        endIcon={<ExpandMore />}
                      >
                        {'Change Status'}
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
                        {statusOptions.map((o, index) => {
                          return (
                            <MenuItem
                              disabled={index <= statusOptions.findIndex((d) => d.optionLabel === purchaseOrderData?.status)}
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
                <ActivityButton referenceId={purchaseOrderData?._id} resource={ACTIVITY_RESOURCE.purchaseOrder} />
              </>)}
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
          {purchaseOrderData?.deleted ? null : (
            <Tab
              className={'tabLayout'}
              label={
                <div className="d-flex align-items-center tab-font">
                  <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                </div>
              }
              {...a11yProps(1)}
            />
          )}
          {purchaseOrderData?.deleted ? null : (
            <Tab
              className={'tabLayout'}
              label={
                <div className="d-flex align-items-center tab-font">
                  <BiFoodMenu className="mr-1" fontSize="inherit" /> Invoice
                </div>
              }
              {...a11yProps(3)}
            />
          )}
          {purchaseOrderData?.deleted ? null : (
            <Tab
              className={'tabLayout'}
              label={
                <div className="d-flex align-items-center tab-font">
                  <RiFlowChart className="mr-1" fontSize="inherit" /> Views
                </div>
              }
              {...a11yProps(2)}
            />
          )}
          <div className={'uio'}> </div>
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loadingPurchaseOrder || !purchaseOrderFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={purchaseOrderData} fields={purchaseOrderFields} />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            {!purchaseOrderData || !purchaseOrderFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <Paper>
                  <Steps
                    isNextStep={false}
                    nextStep={nextStep}
                    steps={purchaseOrderSteps}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                    isStepEnded={[PURCHASE_ORDER_STATUS.closed].includes(purchaseOrderData?.status)}
                    setStepFullScreen={() => setStepFullScreen(true)}
                  />
                  <ContentFullScreen title={purchaseOrderSteps[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                    {currentStep === 0 && (
                      <Product
                        purchaseOrderData={purchaseOrderData}
                        setNextStep={setNextStep}
                        setPurchaseOrderProduct={setPurchaseOrderProduct}
                        renderedFrom={`${renderedFrom}_grid-1`}
                        allowedToEdit={allowedToEdit}
                        updateStatus={updateStatus}
                        checkReceivedProduct={checkReceivedProduct}
                      />
                    )}
                    {/* {currentStep === 1 &&
                              <Service
                                purchaseOrderData={purchaseOrderData}
                                renderedFrom={`${renderedFrom}_grid-2`}
                                setNextStep={setNextStep}
                              />} */}
                    {/* {currentStep === 2 && (
                            <IssuePo
                              purchaseOrderData={purchaseOrderData}
                              handleViewPdf={handleViewPdf}
                              updateStatus={updateStatus}
                              setCurrentStep={setCurrentStep}
                              currentStep={currentStep}
                              statusOptions={statusOptions}
                              renderedFrom={`${renderedFrom}_grid-3`}
                            />
                          )} */}
                    {currentStep === 1 && (
                      <ReceivingAsset
                        purchaseOrderData={purchaseOrderData}
                        updateStatus={updateStatus}
                        renderedFrom={`${renderedFrom}_grid-4`}
                        isSmallScreen={isSmallScreen}
                        isTabletScreen={isTabletScreen}
                        stepFullScreen={stepFullScreen}
                        showActivity={showActivity}
                        allowedToEdit={allowedToEdit}
                        checkReceivedProduct={checkReceivedProduct}
                      />
                    )}
                  </ContentFullScreen>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Box>{purchaseOrderData && <Invoice allowedToEdit={allowedToEdit} purchaseOrderData={purchaseOrderData} />}</Box>
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Box>
            <PurchaseOrderViews pName={purchaseOrderData?.purchaseOrderNumber} pId={id} pStatus={purchaseOrderData?.status} />
          </Box>
        </TabPanel>
      </Box>

      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.purchaseOrder?.title} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {
        openUpdateDialog && (
          <ManagePurchaseOrder
            isClone={false}
            purchaseOrderId={id}
            onClose={() => setOpenUpdateDialog(false)}
            onSuccess={() => {
              setOpenUpdateDialog(false);
              fetchPurchaseOrderData();
            }}
            currencyDisable={Boolean(purchaseOrderProduct.length > 0) || Boolean(currentStep > 0)}
          />
        )
      }
    </Box>

  );
};

export default PurchaseOrderDetailsPage;
