import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Tabs, Tab, useMediaQuery, Menu, MenuItem } from '@material-ui/core';
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
import { defaultActivityShow, salesOrderProcessSteps, getUniqueCurrencies, demandOrder, demandOrderSteps } from '../../constants/helpers';
import ManageSalesOrderDialog from './ManageDemandOrderDialog';
import DeleteButton from '../../components/Helpers/DeleteButton';
import TabPanel from '../../components/TabPanel';
import queryString from 'query-string';
import { FaWpforms } from 'react-icons/fa';
import { BiFoodMenu } from 'react-icons/bi';
import Steps from '../RentalManagement/Steps';
import Productpackage from './Productpackage';
import { isMobile } from 'react-device-detect';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { GrStatusInfo } from 'react-icons/all';
import { camelCase } from 'lodash';
import ContentFullScreen from 'src/components/ContentFullScreen';

const SalesOrderDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.salesOrder.title);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit, tab }: any = parsed;

  const {
    state: { user, permissions }
  }: any = useData();

  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');

  const [headingLabel, setHeadingLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [salesOrderData, setSalesOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [salesOrderFields, setSalesOrderFields] = useState([]);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [nextStep, setNextStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [statusOptions, setStatusOptions] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);

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

  const handleStatusChange = (o) => {
    if (o.optionValue && salesOrderData?.status !== o.optionValue) {
      updateJobStatus(o.optionValue);
    }
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (id) {
      getRessourceFields();
      fetchSalesOrderData();
    }
  }, [id]);

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= 5) {
      updateProcessStatus(salesOrderProcessSteps[currentStep]);
    }
  }, [currentStep]);

  const updateProcessStatus = (processStatus) => {
    axiosInstance()
      .put(`${demandOrder.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => {})
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getRessourceFields = async () => {
    try {
      const response: any = await axiosInstance().get('/field?resource=Demand Order');
      response?.data?.data.some((o) => {
        if (o?.fieldData?.fieldName === 'status') {
          setStatusOptions([...o.fieldData.option]);
          return true;
        }
      });
      setSalesOrderFields(response?.data?.data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchSalesOrderData = async () => {
    setLoading(true);

    try {
      let data;
      const response: any = await axiosInstance().get(`${demandOrder.api}/${id}`);
      data = response?.data?.data;

      setCurrentStep(salesOrderProcessSteps.indexOf(data?.processStatus) !== -1 ? salesOrderProcessSteps.indexOf(data?.processStatus) : 0);
      setHeadingLabel(data.demandOrderNumber);
      setCustomizedRoutes([routes.demandOrder, { title: `${data.demandOrderNumber}` }]);
      setSalesOrderData(data);

      setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === data['currency'])?.symbolNative);
      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);

      setAllowedToEdit(isAllowedToEdit && ['Invoiced', 'Closed'].indexOf(data.status) === -1);

      if (isAllowedToEdit && openEdit === 'true') {
        setOpenUpdateDialog(true);
        const params = new URLSearchParams();
        params.delete('openEdit');
        history.push({ search: params.toString() });
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${demandOrder.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const updateJobStatus = (status) => {
    // need to change the api
    axiosInstance()
      .patch(`${demandOrder.api}/status/${salesOrderData._id}`, { status: status })
      .then(({ data: { data } }) => {
        fetchSalesOrderData();
        if (status === 'Invoiced') {
          setCurrentStep(1);
        }
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
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>

        <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`}>
          <div>
            <div>
              <Paper>
                {!salesOrderData ? (
                  <div>
                    <Skeleton variant="text" width="150px" height="40px" />
                    <Box display="flex">
                      <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                      <Box marginX={1} />
                      <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                    </Box>
                  </div>
                ) : (
                  <DetailsPageHeader heading={headingLabel} mainPoints={[]} showHeading={true}>
                    {permissions?.demandOrder?.isUpdate && allowedToEdit && (
                      <Button className="buttonStyleBigScreen" variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                        Edit
                      </Button>
                    )}

                    {permissions?.demandOrder?.isDelete && ['Invoiced', 'Closed'].indexOf(salesOrderData?.status) === -1 && (
                      <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                    )}

                    {permissions?.demandOrder?.isUpdate && ['Ready to Invoice', 'Invoiced'].includes(salesOrderData?.status) && (
                      <>
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
                                disabled={index <= statusOptions.findIndex((d) => d.optionLabel === salesOrderData?.status)}
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
                    {loading || !salesOrderFields.length ? (
                      <Grid container spacing={2} style={{ padding: '8px' }}>
                        <CommonSkeleton lenArray={[...Array(7).keys()]} />
                      </Grid>
                    ) : (
                      <>
                        <DetailsPage data={salesOrderData} fields={salesOrderFields} />
                      </>
                    )}
                  </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Paper>
                    <Steps
                      isNextStep={false}
                      nextStep={nextStep}
                      steps={demandOrderSteps}
                      currentStep={currentStep}
                      setCurrentStep={setCurrentStep}
                      isStepEnded={['Closed'].includes(salesOrderData?.status)}
                    />
                    <ContentFullScreen title={demandOrderSteps[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                      {currentStep === 0 && salesOrderData && (
                        <Productpackage
                          salesOrderData={salesOrderData}
                          setNextStep={setNextStep}
                          currencySymbol={currencySymbol}
                          renderedFrom={`${renderedFrom}_grid-1`}
                          showActivity={showActivity}
                          stepFullScreen={stepFullScreen}
                        />
                      )}
                    </ContentFullScreen>
                  </Paper>
                </TabPanel>
              </Paper>
            </div>
            <Box my={1} />
          </div>
        </div>
      </Fragment>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this demand order: ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageSalesOrderDialog
          isClone={false}
          open={openUpdateDialog}
          salesOrderId={id}
          salesOrderData={salesOrderData}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchSalesOrderData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </>
  );
};

export default SalesOrderDetails;
