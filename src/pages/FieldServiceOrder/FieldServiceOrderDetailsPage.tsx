import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, useMediaQuery, Tab, Tabs, Menu, MenuItem } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import {
  fieldServiceOrder,
  ACTIVITY_RESOURCE,
  getUniqueCurrencies,
  serviceOrderSteps,
  SERVICE_ORDER_STATUS,
  sidebarResource
} from '../../constants/helpers';
import queryString from 'query-string';
import { FaWpforms } from 'react-icons/fa';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import { RiFlowChart } from 'react-icons/ri';
import TabPanel from '../../components/TabPanel';
import { isMobile, isTablet } from 'react-device-detect';
import { camelCase } from 'lodash';
import ManageServiceOrderDialog from './ManageServiceOrder';
import Steps from 'src/components/Steps';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Services from './Services';
import Products from './Products';
import Technician from './Technician';
import TechnicianDispatch from './TechnicianDispatch';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ServiceOrderViews from './RoadMapViews';
import { ExpandMore } from '@material-ui/icons';
import { GrStatusInfo } from 'react-icons/gr';
import FieldTicket from './FieldTicket';
import FieldTicketInvoice from './FieldTicketInvoice';
import DeleteButton from 'src/components/Helpers/DeleteButton';

const ServiceOrderDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.fieldServiceOrder.title);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { user, permissions }
  }: any = useData();

  const [loadingDetails, setLoadingDetails] = useState(true);
  const [serviceOrderData, setServiceOrderData] = useState(null);

  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [serviceOrderFields, setServiceOrderFields] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);

  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [locationKeys, setLocationKeys] = useState([]);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [nextStep, setNextStep] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const [steps, setSteps] = useState([]);

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

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= 7) {
      updateProcessStatus(steps[currentStep]?.name);
    }
  }, [currentStep]);

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
      getServiceOrderFields();
      fetchServiceOrderData();
    }
  }, [id]);

  const fetchServiceOrderData = async () => {
    try {
      let data;
      const response: any = await axiosInstance().get(`${fieldServiceOrder.api}/${id}`);
      data = response?.data?.data;
      setLoadingDetails(false);
      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      setAllowedToEdit(permissions?.fieldServiceOrder?.isUpdate && isAllowedToEdit);
      setAllowedToDelete(permissions?.fieldServiceOrder?.isDelete && data.owner.optionValue === user?.user?._id && data.canDelete);
      setServiceOrderData(data);
      setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === data['currency'])?.symbolNative);
      setCurrentStep(steps.map((s) => s.name).indexOf(data?.processStatus) !== -1 ? steps.map((s) => s.name).indexOf(data?.processStatus) : 0);
    } catch (error) {
      setLoadingDetails(false);
      toastConfig.setToastConfig(error);
    }
  };

  const updateProcessStatus = async (processStatus) => {
    axiosInstance()
      .put(`${fieldServiceOrder.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => {
        fetchServiceOrderData();
      })
      .catch((error) => { });
  };

  const getServiceOrderFields = async () => {
    try {
      const response: any = await axiosInstance().get(`/field/field-policy?resource=${sidebarResource.fieldServiceOrder}`);
      response?.data?.data?.field.some((o) => {
        if (o?.fieldData?.fieldName === 'status') {
          setStatusOptions([...o.fieldData.option]);
          return true;
        }
      });
      setServiceOrderFields(response?.data?.data.field);

      const policy = response?.data?.data?.policy;
      if (policy.stepper?.length) {
        setSteps(serviceOrderSteps?.filter((step) => policy?.stepper?.includes(step?.name)));
      } else {
        setSteps(serviceOrderSteps?.filter((step) => step?.name !== 'Field Ticket Invoice'));
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
      .put(`${fieldServiceOrder.api}/remove`, { ids: [serviceOrderData._id] })
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
    if (o.optionValue && serviceOrderData?.status !== o.optionValue) {
      updateStatus(o.optionValue);
    }
  };

  const updateStatus = (status) => {
    axiosInstance()
      .patch(`${routes.fieldServiceOrder.path}/status/${serviceOrderData._id}`, { status: status })
      .then(({ data: { data } }) => {
        fetchServiceOrderData();
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
          <CustomBreadCrumbs routes={[routes.fieldServiceOrder, { title: `${serviceOrderData ? serviceOrderData?.fieldServiceOrderNumber : ''}` }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <Fragment>
              <Button
                className={'btn-outline-v1'}
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                size="small"
                disabled={!allowedToEdit}
                onClick={handleOpenUpdateDialog}
              >
                {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
              </Button>
            </Fragment>
            <DeleteButton text="Delete" disabled={!allowedToDelete} onClick={() => setShowConfirmBox(true)} />
            {allowedToEdit && (
              <Fragment>
                {[SERVICE_ORDER_STATUS.readyToInvoice, SERVICE_ORDER_STATUS.invoiced]?.includes(serviceOrderData?.status) && (
                  <Button
                    variant="outlined"
                    color="default"
                    size="small"
                    onClick={openActions}
                    aria-controls="action-menu"
                    endIcon={isMobile && !isTablet ? <ExpandMore style={{ width: '12px', height: '12px' }} /> : <ExpandMore />}
                  >
                    {isMobile && !isTablet ? <GrStatusInfo size={20} /> : 'Change Status'}
                  </Button>
                )}
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
                        disabled={index <= statusOptions.findIndex((d) => d.optionLabel === serviceOrderData?.status)}
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
            <ActivityButton referenceId={serviceOrderData?._id} resource={ACTIVITY_RESOURCE.fieldServiceOrder} />
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
                <RiFlowChart className="mr-1" fontSize="inherit" />
                Views
              </div>
            }
            {...a11yProps(2)}
          />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {!loadingDetails && serviceOrderData && serviceOrderFields.length > 0 ? (
              <DetailsPage data={serviceOrderData} fields={serviceOrderFields} />
            ) : (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Steps
            isNextStep={false}
            nextStep={nextStep}
            steps={steps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={[SERVICE_ORDER_STATUS.completed].includes(serviceOrderData?.status)}
            setStepFullScreen={() => setStepFullScreen(true)}
          />
          <ContentFullScreen title={steps[currentStep]?.name} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            {steps[currentStep]?.name === serviceOrderSteps[0]?.name && serviceOrderData && (
              <FieldTicket serviceOrderData={serviceOrderData} setNextStep={setNextStep} renderedFrom={`${renderedFrom}_grid-0`} allowedToEdit={allowedToEdit} refreshFieldServiceOrder={fetchServiceOrderData} />
            )}
            {steps[currentStep]?.name === serviceOrderSteps[1]?.name && serviceOrderData && (
              <Services
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-1`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
              />
            )}
            {steps[currentStep]?.name === serviceOrderSteps[2]?.name && serviceOrderData && (
              <Products
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-2`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
              />
            )}
            {steps[currentStep]?.name === serviceOrderSteps[3]?.name && serviceOrderData && (
              <Technician
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                currencySymbol={currencySymbol}
                renderedFrom={`${renderedFrom}_grid-3`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
              />
            )}
            {steps[currentStep]?.name === serviceOrderSteps[4]?.name && serviceOrderData && (
              <TechnicianDispatch
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-4`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
              />
            )}
            {steps[currentStep]?.name === serviceOrderSteps[5]?.name && serviceOrderData && (
              <Technician
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                currencySymbol={currencySymbol}
                renderedFrom={`${renderedFrom}_grid-5`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
                fromInvoice={true}
                updateStatus={updateStatus}
                statusOptions={statusOptions}
              />
            )}
            {steps[currentStep]?.name === serviceOrderSteps[6]?.name && serviceOrderData && (
              <FieldTicketInvoice
                fieldServiceOrderData={serviceOrderData}
                renderedFrom={`${renderedFrom}_grid-6`}
              />
            )}
          </ContentFullScreen>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Box>{serviceOrderData && <ServiceOrderViews serviceData={serviceOrderData} />}</Box>
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.fieldServiceOrder.title.toLowerCase()} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageServiceOrderDialog
          isClone={false}
          open={openUpdateDialog}
          serviceOrderId={id}
          serviceOrderData={serviceOrderData}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchServiceOrderData();
          }}
        />
      )}
    </Box>
  );
};

export default ServiceOrderDetailsPage;
