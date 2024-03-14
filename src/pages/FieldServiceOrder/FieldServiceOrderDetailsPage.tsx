import { Box, Button, Grid, Tab, Tabs } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import { RiFlowChart } from 'react-icons/ri';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import ButtonWithPulse from 'src/components/ButtonWithPulse';
import ContentFullScreen from 'src/components/ContentFullScreen';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import Steps from 'src/components/Steps';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import TabPanel from '../../components/TabPanel';
import { ACTIVITY_RESOURCE, SERVICE_ORDER_STATUS, fieldServiceOrder, serviceOrderSteps, sidebarResource } from '../../constants/helpers';
import Invoices from '../GenerateInvoice/InvoiceDialog/Invoices';
import FieldTicket from './FieldTicket';
import ManageServiceOrderDialog from './ManageServiceOrder';
import Products from './Products';
import ServiceOrderViews from './RoadMapViews';
import Services from './Services';
import Technician from './Technician';
import TechnicianDispatch from './TechnicianDispatch';

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
  const [currentStep, setCurrentStep] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);

  const [steps, setSteps] = useState(serviceOrderSteps);
  const [showClosedConfirmBox, setShowClosedConfirmBox] = useState(false);

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
      var isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      if (user?.role?.selectedEntity?.superAdminAccess) {
        isAllowedToEdit = true;
      }
      setAllowedToEdit(permissions?.fieldServiceOrder?.isUpdate && isAllowedToEdit && ![SERVICE_ORDER_STATUS.closed]?.includes(data?.status));
      setAllowedToDelete(
        permissions?.fieldServiceOrder?.isDelete &&
        data.owner.optionValue === user?.user?._id &&
        data.canDelete &&
        ![SERVICE_ORDER_STATUS.closed]?.includes(data?.status)
      );
      setServiceOrderData(data);
      if ([SERVICE_ORDER_STATUS.closed]?.includes(data?.status)) {
        setCurrentStep(steps?.length - 1);
      } else {
        setCurrentStep(steps.map((s) => s.name).indexOf(data?.processStatus) !== -1 ? steps.map((s) => s.name).indexOf(data?.processStatus) : 0);
      }
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
        history.push(`${routes.fieldServiceOrder.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleChangeStatus = (status) => {
    axiosInstance()
      .patch(`${routes.fieldServiceOrder.path}/status/${serviceOrderData._id}`, { status: status })
      .then(({ data: { data } }) => {
        fetchServiceOrderData();
        setShowClosedConfirmBox(false);
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
            {allowedToEdit && serviceOrderData?.canComplete && SERVICE_ORDER_STATUS.closed !== serviceOrderData.status && (
              <ButtonWithPulse
                variant={'outlined'}
                color="default"
                size="small"
                onClick={() => {
                  setShowClosedConfirmBox(true);
                }}
                className={'btn-outline-v1'}
              >
                Close
              </ButtonWithPulse>
            )}
            <Fragment>
              <ThemeButton iconForMobile={<Edit />} disabled={!allowedToEdit} onClick={handleOpenUpdateDialog}>
                Edit
              </ThemeButton>
            </Fragment>
            <DeleteButton text="Delete" disabled={!allowedToDelete} onClick={() => setShowConfirmBox(true)} />
            <ActivityButton
              referenceId={serviceOrderData?._id}
              resource={ACTIVITY_RESOURCE.fieldServiceOrder}
              resourceLabel={serviceOrderData?.fieldServiceOrderNumber}
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
          {!(isMobile && !isTablet) && (
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
          )}
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
            isStepEnded={[SERVICE_ORDER_STATUS.completed, SERVICE_ORDER_STATUS.closed].includes(serviceOrderData?.status)}
            setStepFullScreen={() => setStepFullScreen(true)}
          />
          <ContentFullScreen title={steps[currentStep]?.name} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            {steps[currentStep]?.name === steps[0]?.name && serviceOrderData && (
              <FieldTicket
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-0`}
                allowedToEdit={allowedToEdit}
                handleChangeStatus={handleChangeStatus}
              />
            )}
            {/* {steps[currentStep]?.name === steps[1]?.name && serviceOrderData && (
              <Services
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-1`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
              />
            )}
            {steps[currentStep]?.name === steps[2]?.name && serviceOrderData && (
              <Products
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-2`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
              />
            )}
            {steps[currentStep]?.name === steps[3]?.name && serviceOrderData && (
              <Technician
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-3`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
              />
            )}
            {steps[currentStep]?.name === steps[4]?.name && serviceOrderData && (
              <TechnicianDispatch
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-4`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
              />
            )}
            {steps[currentStep]?.name === steps[5]?.name && serviceOrderData && (
              <Technician
                serviceOrderData={serviceOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-5`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
                fromInvoice={true}
                updateStatus={handleChangeStatus}
                statusOptions={statusOptions}
              />
            )} */}
            {steps[currentStep]?.name === steps[1]?.name && serviceOrderData && (
              <Invoices resourceId={serviceOrderData?._id} resource={sidebarResource.fieldTicket} invoiceFieldName="fieldServiceOrder" />
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
      {showClosedConfirmBox && (
        <ConfirmationDialog
          open={showClosedConfirmBox}
          message={`Are you sure you want to close ${serviceOrderData?.fieldServiceOrderNumber} ?`}
          onClose={() => {
            setShowClosedConfirmBox(false);
          }}
          onOk={() => {
            handleChangeStatus(SERVICE_ORDER_STATUS.closed);
          }}
        />
      )}
      {openUpdateDialog && (
        <ManageServiceOrderDialog
          isClone={false}
          open={openUpdateDialog}
          serviceOrderId={id}
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
