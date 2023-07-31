import React, { useState, useEffect, useContext, Fragment } from 'react';
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
import { salesOrder, salesOrderProcessSteps, getUniqueCurrencies, ACTIVITY_RESOURCE } from '../../constants/helpers';
import ManageSalesOrderDialog from './ManageSalesOrderDialog';
import DeleteButton from '../../components/Helpers/DeleteButton';
import TabPanel from '../../components/TabPanel';
import queryString from 'query-string';
import { FaWpforms } from 'react-icons/fa';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import Material from './Material';
import AdditionalCost from './AdditionalCost';
import Invoice from './Invoice';
import { isMobile, isTablet } from 'react-device-detect';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { GrStatusInfo, RiFlowChart } from 'react-icons/all';
import { camelCase } from 'lodash';
import ContentFullScreen from 'src/components/ContentFullScreen';
import ActivityButton from 'src/components/Activity/ActivityButton';
import Steps, { getIndex } from 'src/components/Steps';
import Process from './Process';
import SalesOrderView from './View';

const SalesOrderDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.salesOrder.title);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { user, permissions }
  }: any = useData();

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
  const [statusOptions, setStatusOptions] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const salesOrderProcessStepsNames = React.useMemo(() => {
    return salesOrderProcessSteps.map((item) => item.name);
  }, [salesOrderProcessSteps]);

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
      updateProcessStatus(salesOrderProcessStepsNames[currentStep]);
    }
  }, [currentStep]);

  const updateProcessStatus = (processStatus) => {
    axiosInstance()
      .put(`${salesOrder.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => { })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getRessourceFields = async () => {
    try {
      const response: any = await axiosInstance().get('/field?resource=Sales Order');
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
      const response: any = await axiosInstance().get(`${salesOrder.api}/${id}`);
      data = response?.data?.data;

      setCurrentStep(getIndex(data?.processStatus, salesOrderProcessSteps));

      setHeadingLabel(data.salesOrderNo);
      setCustomizedRoutes([routes.salesOrder, { title: `${data.salesOrderNo}` }]);
      setSalesOrderData(data);

      setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === data['currency'])?.symbolNative);
      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);

      setAllowedToEdit(isAllowedToEdit && ['Invoiced', 'Closed'].indexOf(data.status) === -1);


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
      .put(`${salesOrder.api}/remove`, { ids: [id] })
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
      .patch(`${salesOrder.api}/status/${salesOrderData._id}`, { status: status })
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
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {salesOrderData ? (
              <>
                {permissions?.salesOrder?.isUpdate && allowedToEdit && (
                  <Button
                    className={'btn-outline-v1'}
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    size="small"
                    onClick={handleOpenUpdateDialog}
                  >
                    {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                  </Button>
                )}

                {permissions?.salesOrder?.isDelete && ['Invoiced', 'Closed'].indexOf(salesOrderData?.status) === -1 && (
                  <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                )}

                {permissions?.salesOrder?.isUpdate && ['Ready to Invoice', 'Invoiced'].includes(salesOrderData?.status) && (
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
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton 
              referenceId={salesOrderData?._id} 
              resource={ACTIVITY_RESOURCE.salesOrder} 
              resourceLabel={salesOrderData?.salesOrderNo}
              />
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
            {...a11yProps(2)}
          />
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
          <Steps
            isNextStep={false}
            nextStep={nextStep}
            steps={salesOrderProcessSteps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={['Invoiced', 'Closed'].includes(salesOrderData?.status)}
          />
          <ContentFullScreen title={salesOrderProcessStepsNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            {currentStep === 0 && salesOrderData && (
              <Material
                salesOrderData={salesOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-1`}
                stepFullScreen={stepFullScreen}
              />
            )}
            {currentStep === 1 && salesOrderData && (
              <AdditionalCost
                salesOrderData={salesOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-2`}
                allowedToEdit={allowedToEdit}
              />
            )}
            {currentStep === 2 && salesOrderData && (
              <Process salesOrderData={salesOrderData} setNextStep={setNextStep} stepFullScreen={stepFullScreen} />
            )}
            {currentStep === 3 && salesOrderData && (
              <Invoice
                salesOrderData={salesOrderData}
                setNextStep={setNextStep}
                updateJobStatus={updateJobStatus}
                statusOptions={statusOptions}
                renderedFrom={`${renderedFrom}_grid-5`}
                stepFullScreen={stepFullScreen}
              />
            )}
          </ContentFullScreen>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {salesOrderData && <SalesOrderView salesOrderData={salesOrderData} />}
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this sales order: ${headingLabel} ?`}
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
    </Box>
  );
};

export default SalesOrderDetails;
