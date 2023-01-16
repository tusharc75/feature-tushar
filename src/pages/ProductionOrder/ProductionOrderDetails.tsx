import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs, useMediaQuery, Menu, MenuItem } from '@material-ui/core';
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
  productionOrder,
  sidebarResource,
  ACTIVITY_RESOURCE,
  PRODUCTION_ORDER_STATUS
} from 'src/constants/helpers';
import Activity from 'src/components/Activity';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
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
import { ExpandMore } from '@material-ui/icons';
import { GrStatusInfo } from 'react-icons/gr';
import ManageProductionOrder from './ManageProductionOrder';
import Productpackage from './Productpackage';

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`
  };
}

const ProductionOrderDetails = () => {
  const renderedFrom = camelCase(routes?.productionOrder.title);
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

  const [productionOrderData, setProductionOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [productionOrderFields, setProductionOrderFields] = useState([]);
  const [nextStep, setNextStep] = useState(true);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [locationKeys, setLocationKeys] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [productionOrderProcessSteps, setProductionOrderProcessSteps] = useState(['Add']);
  const [anchorEl, setAnchorEl] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);
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
      fetchProductionOrderData();
    }
  }, [id]);

  useEffect(() => {
    getResourceFields();
  }, []);

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= productionOrderProcessSteps.length) {
      updateProcessStatus(productionOrderProcessSteps[currentStep]);
    }
  }, [currentStep]);

  const getResourceFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.productionOrder}`)
      .then(({ data: { data } }) => {
        setProductionOrderFields(data);
        data.some((o) => {
          if (o?.fieldData?.fieldName === 'status') {
            setStatusOptions([...o.fieldData.option?.filter((e) => e.optionValue !== "Deleted")]);
            return true;
          }
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchProductionOrderData = () => {
    axiosInstance()
      .get(`${routes.productionOrder.path}/${id}`)
      .then(({ data: { data } }) => {
        setCurrentStep(productionOrderProcessSteps.indexOf(data?.processStatus) !== -1 ? productionOrderProcessSteps.indexOf(data?.processStatus) : 0);
        const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
        setAllowedToEdit(isAllowedToEdit);
        setAllowedToDelete(data?.owner?.optionValue === user?.user?._id);
        setProductionOrderData({ ...data });
        if (permissions?.productionOrder?.isUpdate && openEdit === 'true') {
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
      .put(`${productionOrder.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(routes.productionOrder.path);
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
      fetchProductionOrderData();
    }
  };

  const updateProcessStatus = (processStatus) => {
    axiosInstance()
      .put(`${productionOrder.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => { })
      .catch((error) => { });
  };

  const handleStatusChange = (o) => {
    if (o.optionValue && productionOrderData?.status !== o.optionValue) {
      updateOrderStatus(o.optionValue);
    }
  };

  const updateOrderStatus = (status) => {
    axiosInstance()
      .patch(`${productionOrder.api}/status/${productionOrderData._id}`, { status: status })
      .then(({ data: { data } }) => {
        fetchProductionOrderData();
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

  useEffect(() => {
    if (isSmallScreen && tabValue === 0) {
      setActivityShow(true);
    } else {
      setActivityShow(false);
    }
  }, [isSmallScreen, tabValue]);

  return (
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={[routes.productionOrder, { title: productionOrderData?.productionOrderNumber }]} />
      </Grid>
      <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`}>
        <div>
          <div>
            <Paper>
              {productionOrderData ? (
                <DetailsPageHeader heading={productionOrderData?.productionOrderNumber} mainPoints={null} showHeading={true}>
                  {permissions?.productionOrder?.isUpdate && allowedToEdit && (
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
                              disabled={index <= statusOptions.findIndex((d) => d.optionLabel === productionOrderData?.status)}
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
                    </Fragment>)}
                  {permissions?.productionOrder?.isUpdate && allowedToEdit && (
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
                  {permissions?.productionOrder?.isDelete && allowedToDelete && productionOrderData?.canDelete
                    && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
                </DetailsPageHeader>
              ) : (
                <Skeleton variant="text" width="150px" height="40px" />
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
              </Tabs>
              <TabPanel value={tabValue} index={0}>
                <Box>
                  {productionOrderData && productionOrderFields.length ? (
                    <DetailsPage data={productionOrderData} fields={productionOrderFields} />
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
                    steps={productionOrderProcessSteps}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                    isStepEnded={[PRODUCTION_ORDER_STATUS.completed].includes(productionOrderData?.status)}
                    setStepFullScreen={() => setStepFullScreen(true)}
                  />
                  <ContentFullScreen title={productionOrderProcessSteps[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                    {productionOrderProcessSteps[currentStep] === 'Add' && productionOrderData && (
                      <Productpackage
                        fetchProductionOrderData={fetchProductionOrderData}
                        productionOrderData={productionOrderData}
                        setNextStep={setNextStep}
                        isSmallScreen={isSmallScreen}
                        isTabletScreen={isTabletScreen}
                        showActivity={showActivity}
                        renderedFrom={`${renderedFrom}_grid-1`}
                        stepFullScreen={stepFullScreen}
                        allowedToEdit={true}
                        allowedToDelete={allowedToDelete}
                      />
                    )}
                  </ContentFullScreen>
                </Paper>
              </TabPanel>
            </Paper>
          </div>
          <Box my={1} />
        </div>
        <div className="position-relative">
          <HideWhenOffline>
            <Paper>
              {!isSmallScreen && (
                <span className={`${showActivity ? 'activityHide' : 'activityShow'} cursor-pointer`} onClick={() => setActivityShow(!showActivity)}>
                  {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
                </span>
              )}
              <div style={{ display: showActivity ? 'block' : 'none' }}>
                <Grid container>
                  <Grid item xs={12}>
                    {productionOrderData && (
                      <div>
                        <Activity
                          resourceId={productionOrderData._id}
                          resource={ACTIVITY_RESOURCE.productionOrder}
                          restrictedAddActivities={
                            permissions && permissions[`${ACTIVITY_RESOURCE.productionOrder}`] && permissions[`${ACTIVITY_RESOURCE.productionOrder}`].isUpdate
                              ? []
                              : ['Attachment', 'Case']
                          }
                          relatedTo={[
                            {
                              type: ACTIVITY_RESOURCE.productionOrder,
                              referenceId: productionOrderData._id,
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
          message={`Are you sure you want to delete this production order: ${productionOrderData?.productionOrderNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageProductionOrder
          isClone={false}
          productionOrderId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchProductionOrderData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </>
  );
};

export default ProductionOrderDetails;
