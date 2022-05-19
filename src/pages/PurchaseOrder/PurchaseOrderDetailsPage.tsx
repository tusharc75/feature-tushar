import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import {
  Grid,
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  useMediaQuery,
  Tab,
  Tabs,
  ButtonGroup,
  Container,
  InputAdornment,
  TextField
} from '@material-ui/core';
import { Autocomplete, Skeleton } from '@material-ui/lab';
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
import { purchaseOrder, getObjKeysWithValues, supplierAccount, customerAccount, purchaseOrderSteps, PURCHASE_ORDER_STATUS, ACTIVITY_RESOURCE } from '../../constants/helpers';
import ManagePurchaseOrder from './ManagePurchaseOrder';
import ExpandMore from '@material-ui/icons/ExpandMore';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import { FaCartArrowDown, FaCartPlus, FaSuitcase, FaWpforms } from 'react-icons/fa';
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
import { GrStatusGood, GrStatusInfo } from 'react-icons/all';
import accountClass from '../Account/account.module.scss';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import Steps from '../RentalManagement/Steps';
import { camelCase } from 'lodash';

const PurchaseOrderDetailsPage = () => {
  const renderedFrom = camelCase(routes?.purchaseOrder.title)
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit } = parsed;
  const { state: { user, permissions } }: any = useData();

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
      const { data: { data } } = await axiosInstance().get(`${purchaseOrder.api}/${id}`);
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
      setActivityShow(true)
    }
    else {
      setActivityShow(false)
    }
  }, [isSmallScreen, tabValue])

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
    updateStatus(o.optionValue)
  };

  const updateProcessStatus = async (processStatus) => {
    axiosInstance()
      .put(`${purchaseOrder.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => { })
      .catch((error) => {
      });
  };

  const updateStatus = (status) => {
    axiosInstance()
      .patch(`${purchaseOrder.api}/status/${id}`, { status: status })
      .then(({ data: { data } }) => {
        if (status === 'Invoiced' || status === 'Closed') {
          updateProcessStatus(purchaseOrderSteps[3]);
          setCurrentStep(3);
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

  const handleViewPdf = (download) => {
    axiosInstance()
      .get(`${purchaseOrder.api}/${id}/pdf`)
      .then(({ data }) => {
        axiosInstance()
          .get(`user/download?fileName=${data.data.fileName}`, {
            responseType: 'blob'
          })
          .then(({ data }) => {
            if (download) {
              const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `PurchaseOrder-${purchaseOrderData.purchaseOrderNumber}.pdf`);
              document.body.appendChild(link);
              link.click();
            } else {
              const file = new Blob([data], { type: 'application/pdf' });
              const fileURL = URL.createObjectURL(file);
              const pdfWindow = window.open();
              pdfWindow.location.href = fileURL;
              toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
            }
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity);
  };

  const handleAttachments = () => {
    let request;
    request = {
      name: 'Purchase Order',
      fileUrl: '',
      relatedTo: [
        {
          type: purchaseOrder.resource,
          referenceId: purchaseOrderData?._id,
          access: true
        },
        {
          type: purchaseOrderData?.customerAccountName ? customerAccount?.accountResource : supplierAccount?.accountResource,
          referenceId: purchaseOrderData?.customerAccountName
            ? purchaseOrderData?.customerAccountName?.optionValue
            : purchaseOrderData?.supplierAccountName?.optionValue,
          access: false
        }
      ]
    };
  };

  return (
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={[routes.purchaseOrder, { title: `${purchaseOrderData?.purchaseOrderNumber}` }]}
        />
      </Grid>
      <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`}>
        <div>
          <div>
            <Paper>
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
                <DetailsPageHeader heading={purchaseOrderData?.purchaseOrderNumber} mainPoints={null} showHeading={true}>
                  {permissions?.purchaseOrder?.isUpdate &&
                    ![PURCHASE_ORDER_STATUS.readyToInvoice, PURCHASE_ORDER_STATUS.invoiced, PURCHASE_ORDER_STATUS.closed].includes(purchaseOrderData?.status)
                    && (
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        color="primary"
                        size="small"
                        onClick={handleOpenUpdateDialog}
                        className={isMobile && !isTablet ? accountClass.mobile_button_layout : ''}
                        style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                      >
                        {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                      </Button>
                    )}
                  {permissions?.purchaseOrder?.isUpdate && [PURCHASE_ORDER_STATUS.readyToInvoice, PURCHASE_ORDER_STATUS.invoiced].includes(purchaseOrderData?.status)
                    && (
                      <>
                        <Button
                          variant={isMobile && !isTablet ? 'text' : 'contained'}
                          color="default"
                          size="small"
                          onClick={openActions}
                          aria-controls="action-menu"
                          endIcon={isMobile && !isTablet ? <ExpandMore style={{ width: '12px', height: '12px' }} /> : <ExpandMore />}
                        >
                          {isMobile && !isTablet ? <GrStatusGood size={18} style={{ color: 'var(--warning-darken)' }} /> : 'Change Status'}
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
                      </>
                    )}
                </DetailsPageHeader>
              )}
              <Fragment>
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
                            isStepEnded={[PURCHASE_ORDER_STATUS.invoiced, PURCHASE_ORDER_STATUS.closed].includes(purchaseOrderData?.status)}
                          />
                          {currentStep === 0 && (
                            <Product
                              purchaseOrderData={purchaseOrderData}
                              setNextStep={setNextStep}
                              setPurchaseOrderProduct={setPurchaseOrderProduct}
                              renderedFrom={`${renderedFrom}_grid-1`}
                              allowedToEdit={allowedToEdit}
                            />
                          )}
                          {currentStep === 1 &&
                            <Service
                              purchaseOrderData={purchaseOrderData}
                              renderedFrom={`${renderedFrom}_grid-2`}
                            />}
                          {currentStep === 2 && (
                            <IssuePo
                              purchaseOrderData={purchaseOrderData}
                              handleViewPdf={handleViewPdf}
                              updateStatus={updateStatus}
                              setCurrentStep={setCurrentStep}
                              currentStep={currentStep}
                              handleAttachments={handleAttachments}
                              statusOptions={statusOptions}
                              renderedFrom={`${renderedFrom}_grid-3`}
                            />
                          )}
                          {(currentStep === 3) && (
                            <ReceivingAsset
                              purchaseOrderData={purchaseOrderData}
                              setCurrentStep={setCurrentStep}
                              updateStatus={updateStatus}
                              statusOptions={statusOptions}
                              handleViewPdf={handleViewPdf}
                              handleAttachments={handleAttachments}
                              renderedFrom={`${renderedFrom}_grid-4`}
                            />
                          )}
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </TabPanel>
              </Fragment>
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
                    {purchaseOrderData && (
                      <div>
                        <Activity
                          resourceId={purchaseOrderData._id}
                          resource={ACTIVITY_RESOURCE.purchaseOrder}
                          restrictedAddActivities={
                            permissions && permissions[`${ACTIVITY_RESOURCE.purchaseOrder}`] && permissions[`${ACTIVITY_RESOURCE.purchaseOrder}`].isUpdate
                              ? []
                              : ['Attachment', 'Case']
                          }
                          relatedTo={[
                            {
                              type: ACTIVITY_RESOURCE.purchaseOrder,
                              referenceId: purchaseOrderData._id,
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
          currencyDisable={Boolean(purchaseOrderProduct.length > 0) || Boolean(currentStep > 0)}
        />
      )}
    </>
  );
};

export default PurchaseOrderDetailsPage;
