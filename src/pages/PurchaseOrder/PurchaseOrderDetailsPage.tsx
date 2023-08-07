import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Grid, Box, Button, Paper, useMediaQuery, Tab, Tabs } from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { purchaseOrder, purchaseOrderSteps, PURCHASE_ORDER_STATUS, ACTIVITY_RESOURCE, displayDateTime } from '../../constants/helpers';
import ManagePurchaseOrder from './ManagePurchaseOrder';
import ExpandMore from '@material-ui/icons/ExpandMore';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import { FaWpforms } from 'react-icons/fa';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import queryString from 'query-string';
import { isMobile, isTablet } from 'react-device-detect';
import Product from './Product';
import HideWhenOffline from '../../components/HideWhenOffline';
import IssuePo from './IssuePo';
import ReceivingAsset from './ReceivingAsset';
import { GrStatusGood, GrStatusInfo, RiFlowChart } from 'react-icons/all';
import Steps, { getIndex } from 'src/components/Steps';
import { camelCase } from 'lodash';
import ContentFullScreen from '../../components/ContentFullScreen';
import PurchaseOrderViews from './RoadMapViews';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import Invoice from './Invoice';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';

const PurchaseOrderDetailsPage = () => {
  const renderedFrom = camelCase(routes?.purchaseOrder.title);
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const {
    state: { user, permissions }
  }: any = useData();

  const [loadingPurchaseOrder, setLoadingPurchaseOrder] = useState(false);
  const [purchaseOrderData, setPurchaseOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [purchaseOrderFields, setPurchaseOrderFields] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);

  const [tabValue, setTabValue] = useState(Number(parsed?.tab || 0));
  const [nextStep, setNextStep] = useState(true);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  const purchaseOrderStepNames = React.useMemo(() => {
    return purchaseOrderSteps.map((item) => item.name);
  }, []);

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
      updateProcessStatus(purchaseOrderStepNames[currentStep]);
    }
  }, [currentStep]);

  const fetchPurchaseOrderData = async () => {
    setLoadingPurchaseOrder(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${purchaseOrder.api}/${id}`);
      var isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      if (user?.role?.selectedEntity?.superAdminAccess) {
        isAllowedToEdit = true;
      }
      setAllowedToEdit(isAllowedToEdit);
      setPurchaseOrderData(data);
      if (data?.status === PURCHASE_ORDER_STATUS.closed) {
        setCurrentStep(purchaseOrderSteps?.length - 1);
      }
      else {
        setCurrentStep(getIndex(data?.processStatus, purchaseOrderSteps));
      }
      setLoadingPurchaseOrder(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

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
          updateProcessStatus(purchaseOrderStepNames[1]);
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

  const checkReceivedProduct = (data) => {
    const products = data?.filter((e) => e.type === 'Product');
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
            {permissions?.purchaseOrder?.isUpdate &&
              allowedToEdit &&
              !purchaseOrderData?.deleted &&
              [PURCHASE_ORDER_STATUS.received].includes(purchaseOrderData?.status) && (
                <Fragment>
                  <Button variant={'contained'} className={'btn-outline-v1'} onClick={() => updateStatus(PURCHASE_ORDER_STATUS.closed)}>
                    Close
                  </Button>
                  {/* <Button
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
                    {statusOptions?.map((o, index) => {
                      return (
                        <MenuItem
                          disabled={index <= statusOptions?.findIndex((d) => d.optionLabel === purchaseOrderData?.status)}
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
            {purchaseOrderData?.deleted ? null : ![PURCHASE_ORDER_STATUS.closed].includes(purchaseOrderData?.status) ? (
              <HtmlTooltip
                title={permissions?.purchaseOrder?.isUpdate && allowedToEdit ? '' : `Owner or Collaborator can edit ${routes.purchaseOrder.title}`}
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
                title={permissions?.purchaseOrder?.isUpdate && allowedToEdit ? '' : `Owner or Collaborator can reopen ${routes.purchaseOrder.title}`}
              >
                <span>
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    className={'btn-outline-v1'}
                    onClick={() => updateStatus(PURCHASE_ORDER_STATUS.received)}
                    disabled={permissions?.purchaseOrder?.isUpdate && allowedToEdit ? false : true}
                  >
                    {isMobile && !isTablet ? <BiEdit size={20} /> : 'Reopen'}
                  </Button>
                </span>
              </HtmlTooltip>
            )}
            <ActivityButton
              referenceId={purchaseOrderData?._id}
              resource={ACTIVITY_RESOURCE.purchaseOrder}
              resourceLabel={purchaseOrderData?.purchaseOrderNumber}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab index={0} {...a11yProps(0)}>
            <FaWpforms className="mr-1" fontSize="inherit" /> Header
          </CustomTab>
          {purchaseOrderData?.deleted ? null : (
            <CustomTab index={1} {...a11yProps(1)}>
              <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
            </CustomTab>
          )}
          {purchaseOrderData?.deleted ? null : (
            <CustomTab index={3} {...a11yProps(3)}>
              <BiFoodMenu className="mr-1" fontSize="inherit" /> Invoice
            </CustomTab>
          )}
          {purchaseOrderData?.deleted ? null : (
            <CustomTab className={'tabLayout'} index={2} {...a11yProps(2)}>
              <RiFlowChart className="mr-1" fontSize="inherit" /> Views
            </CustomTab>
          )}
        </CustomTabs>
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
                <Steps
                  isNextStep={false}
                  nextStep={nextStep}
                  steps={purchaseOrderSteps}
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  isStepEnded={[PURCHASE_ORDER_STATUS.closed].includes(purchaseOrderData?.status)}
                  setStepFullScreen={() => setStepFullScreen(true)}
                />
                <ContentFullScreen title={purchaseOrderStepNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                  {currentStep === 0 && (
                    <Product
                      purchaseOrderData={purchaseOrderData}
                      setNextStep={setNextStep}
                      renderedFrom={`${renderedFrom}_grid-1`}
                      allowedToEdit={allowedToEdit}
                      checkReceivedProduct={checkReceivedProduct}
                    />
                  )}
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
                      stepFullScreen={stepFullScreen}
                      allowedToEdit={allowedToEdit}
                      checkReceivedProduct={checkReceivedProduct}
                    />
                  )}
                </ContentFullScreen>
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
      {openUpdateDialog && (
        <ManagePurchaseOrder
          isClone={false}
          purchaseOrderId={id}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchPurchaseOrderData();
          }}
          disableEdit={purchaseOrderData?.canDelete ? false : true}
          currency={user.user?.brandCurrency || null}
        />
      )}
    </Box>
  );
};

export default PurchaseOrderDetailsPage;
