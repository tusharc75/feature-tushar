import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, useMediaQuery, Tab, Tabs } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { serviceOrder, ACTIVITY_RESOURCE, getUniqueCurrencies, serviceOrderSteps } from '../../constants/helpers';
import queryString from 'query-string';
import { FaWpforms } from 'react-icons/fa';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import { RiFlowChart } from 'react-icons/ri';
import TabPanel from '../../components/TabPanel';
import { isMobile, isTablet } from 'react-device-detect';
import { camelCase } from 'lodash';
import ManageServiceOrderDialog from './ManageServiceOrder';
import Steps from '../RentalManagement/Steps';
import Steps2 from 'src/components/Steps';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Services from './Services';
import Products from './Products';
import Technician from './Technician';
import TechnicianDispatch from './TechnicianDispatch';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ServiceOrderViews from './RoadMapViews';

const ServiceOrderDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.serviceOrder.title);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit, tab }: any = parsed;

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
      updateProcessStatus(serviceOrderSteps[currentStep]);
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
      const response: any = await axiosInstance().get(`${serviceOrder.api}/${id}`);
      data = response?.data?.data;
      setLoadingDetails(false);
      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      setAllowedToEdit(isAllowedToEdit);
      setAllowedToDelete(data.owner.optionValue === user?.user?._id);
      setServiceOrderData(data);
      setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === data['currency'])?.symbolNative);
      setCurrentStep(serviceOrderSteps.indexOf(data?.processStatus) !== -1 ? serviceOrderSteps.indexOf(data?.processStatus) : 0);
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

  const updateProcessStatus = async (processStatus) => {
    axiosInstance()
      .put(`${serviceOrder.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => {
        fetchServiceOrderData();
      })
      .catch((error) => {});
  };

  const getServiceOrderFields = async () => {
    try {
      const response: any = await axiosInstance().get('/field?resource=Service Order');
      setServiceOrderFields(response?.data?.data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${serviceOrder.api}/remove`, { ids: [serviceOrderData._id] })
      .then(() => {
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.serviceOrder, { title: `${serviceOrderData ? serviceOrderData?.serviceOrderNumber : ''}` }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {serviceOrderData ? (
              <Fragment>
                {permissions?.serviceOrder?.isUpdate && allowedToEdit && (
                  <Fragment>
                    <Button className={'btn-outline-v1'} variant="contained" size="small" onClick={handleOpenUpdateDialog}>
                      {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                    </Button>
                  </Fragment>
                )}
              </Fragment>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton referenceId={serviceOrderData?._id} resource={ACTIVITY_RESOURCE.serviceOrder} />
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
          {/* <Steps
            isNextStep={false}
            nextStep={nextStep}
            steps={serviceOrderSteps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={false}
            setStepFullScreen={() => setStepFullScreen(true)}
          /> */}
          <Steps2
            isNextStep={false}
            nextStep={nextStep}
            steps={serviceOrderSteps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={false}
            setStepFullScreen={() => setStepFullScreen(true)}
          />
          <ContentFullScreen title={serviceOrderSteps[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            {currentStep === 0 && serviceOrderData && (
              <Services
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-1`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={true}
              />
            )}
            {currentStep === 1 && serviceOrderData && (
              <Products
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-2`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={true}
              />
            )}
            {currentStep === 2 && serviceOrderData && (
              <Technician
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                currencySymbol={currencySymbol}
                renderedFrom={`${renderedFrom}_grid-3`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={true}
              />
            )}
            {currentStep === 3 && serviceOrderData && (
              <TechnicianDispatch
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-4`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={true}
              />
            )}
            {currentStep === 4 && serviceOrderData && (
              <Technician
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                currencySymbol={currencySymbol}
                renderedFrom={`${renderedFrom}_grid-5`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={false}
                fromInvoice={true}
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
          message={`Are you sure you want to delete this ${routes.serviceOrder.title.toLowerCase()} ?`}
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
