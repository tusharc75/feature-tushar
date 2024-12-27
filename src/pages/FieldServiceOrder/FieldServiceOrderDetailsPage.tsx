import { Box, Grid } from '@mui/material';
import { Edit } from '@mui/icons-material';
import queryString from 'query-string';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import ActivityButton from 'src/components/Activity/ActivityButton';
import ButtonWithPulse from 'src/components/ButtonWithPulse';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import Steps from 'src/components/Steps';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';

import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import {
  ACTIVITY_RESOURCE,
  SERVICE_ORDER_STATUS,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  fieldServiceOrder,
  serviceOrderSteps,
  sidebarResource
} from '../../constants/helpers';
import { findOne, objectStore } from '../../constants/indexdbhelper';
import Step from '../DynamicForm/Step';
import Invoices from '../GenerateInvoice/InvoiceDialog/Invoices';
import FieldTicket from './FieldTicket';
import ManageServiceOrderDialog from './ManageServiceOrder';
import ServiceOrderViews from './RoadMapViews';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';
import { generateAddFieldTicket } from 'src/pages/FieldServiceOrder/walkmeSteps';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';

const ServiceOrderDetailsPage = () => {
  const walkmeInstance = useGetWalkmeInstance();
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { user, permissions, resources }
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
  const [resourceData, setResourceData] = useState(null);

  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    if (isOffline) {
      let newServiceOrderSteps = serviceOrderSteps.filter((s) => s.name !== 'Field Ticket Invoice');
      setSteps(newServiceOrderSteps);
    } else {
      setSteps(serviceOrderSteps);
    }
  }, [isOffline]);

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

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  useEffect(() => {
    if (id) {
      getServiceOrderFields();
      fetchServiceOrderData();
      fetchPolicy();
    }
    if (walkmeInstance && walkmeInstance.type === 'flow') {
      walkmeInstance.instance.push(generateAddFieldTicket(true).steps);
      // immediately start next step
      walkmeInstance.handleNext();
    }
  }, [id]);

  const fetchServiceOrderData = async () => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.fieldServiceOrder, id);
      } else {
        const response: any = await axiosInstance().get(`${fieldServiceOrder.api}/${id}`);
        data = response?.data?.data;
      }
      setLoadingDetails(false);

      setAllowedToEdit(
        permissions?.fieldServiceOrder?.isUpdate &&
        checkIsAllowedToEdit(user, sidebarResource.fieldServiceOrder, data) &&
        ![SERVICE_ORDER_STATUS.closed]?.includes(data?.status)
      );
      setAllowedToDelete(
        permissions?.fieldServiceOrder?.isDelete &&
        checkIsAllowedToDelete(user, sidebarResource.fieldServiceOrder, data.owner.optionValue) &&
        data.canDelete &&
        ![SERVICE_ORDER_STATUS.closed]?.includes(data?.status)
      );
      let fieldServiceSteps = permissions?.invoice?.isRead ? steps : steps?.filter((e) => e.name !== 'Field Ticket Invoice');
      setSteps(fieldServiceSteps);
      if ([SERVICE_ORDER_STATUS.closed]?.includes(data?.status)) {
        setCurrentStep(steps?.length - 1);
      } else {
        setCurrentStep(steps.map((s) => s.name).indexOf(data?.processStatus) !== -1 ? steps.map((s) => s.name).indexOf(data?.processStatus) : 0);
      }
      setServiceOrderData(data);
    } catch (error) {
      setLoadingDetails(false);
      toastConfig.setToastConfig(error);
    }
  };

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.fieldServiceOrder}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getServiceOrderFields = async () => {
    try {
      let data: any;
      if (isOffline) {
        data = await findOne(objectStore.resource, sidebarResource.fieldServiceOrder);
      } else {
        const response = await axiosInstance().get(`/field/field-policy?resource=${sidebarResource.fieldServiceOrder}`);
        data = response?.data?.data?.field;
      }
      data?.some((o) => {
        if (o?.fieldData?.fieldName === 'status') {
          setStatusOptions([...o.fieldData.option]);
          return true;
        }
      });
      setServiceOrderFields(data);
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
        history.push(`${routes?.fieldServiceOrder?.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleChangeStatus = (status) => {
    if (isOffline) return;
    axiosInstance()
      .patch(`${routes?.fieldServiceOrder?.path}/status/${serviceOrderData._id}`, { status: status })
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
          <CustomBreadCrumbs
            routes={[
              { ...routes?.fieldServiceOrder, title: resources?.fieldServiceOrder?.titlePlural },
              { title: `${serviceOrderData ? serviceOrderData?.fieldServiceOrderNumber : ''}` }
            ]}
          />
        </Box>
        <Box className="controls-v1">
          {!isOffline && (
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
          )}
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          {!(isMobile && !isTablet) && !isOffline && <CustomTab value={2}>Views</CustomTab>}
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 3}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
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

        <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
          <TabPanel value={tabValue} index={1}>
            <Steps
              isNextStep={false}
              nextStep={nextStep}
              steps={steps}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isStepEnded={[SERVICE_ORDER_STATUS.completed, SERVICE_ORDER_STATUS.closed].includes(serviceOrderData?.status)}
              stepFullScreen={stepFullScreen}
              setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
              updateStatus={(step: number) => {
                if (!isOffline) {
                  dynamicFormUpdateProcessStatus(sidebarResource.fieldServiceOrder, steps[step]?.name, id);
                }
              }}
            />
            {steps[currentStep]?.name === steps[0]?.name && serviceOrderData && (
              <FieldTicket
                serviceOrderData={serviceOrderData}
                serviceOrderFields={serviceOrderFields}
                setNextStep={setNextStep}
                allowedToEdit={allowedToEdit}
                handleChangeStatus={handleChangeStatus}
                resource={sidebarResource.fieldServiceOrder}
                fetchServiceOrderData={fetchServiceOrderData}
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
              <Invoices
                resourceId={serviceOrderData?._id}
                resource={sidebarResource.fieldTicket}
                invoiceFieldName="fieldServiceOrder"
                fetchParentData={fetchServiceOrderData}
              />
            )}
          </TabPanel>
        </ContentFullScreen>
        <TabPanel value={tabValue} index={2}>
          <Box>{serviceOrderData && <ServiceOrderViews serviceData={serviceOrderData} />}</Box>
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 3}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.fieldServiceOrder}
                  data={serviceOrderData}
                  allowedToEdit={permissions?.fieldServiceOrder?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.fieldServiceOrder?.titleSingular?.toLowerCase()} : ${serviceOrderData?.fieldServiceOrderNumber} ?`}
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
