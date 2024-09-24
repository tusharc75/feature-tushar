import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { camelCase, isNumber } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import { VscVersions } from 'react-icons/vsc';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityButton from 'src/components/Activity/ActivityButton';
import ButtonWithPulse from 'src/components/ButtonWithPulse';
import ContentFullScreen from 'src/components/ContentFullScreen';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import Steps, { getIndex } from 'src/components/Steps';
import Versions from 'src/components/Versions';
import {
  ACTIVITY_RESOURCE,
  CHILD_RESOURCE,
  FIELD_TICKET_STATUS,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  fieldTicket,
  fieldTicketSteps,
  sidebarResource
} from 'src/constants/helpers';
import { findOne, objectStore } from 'src/constants/indexdbhelper';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import Step from '../DynamicForm/Step';
import ManageFieldTicket from './ManageFieldTicket';
import Submit from './Submit';
import Material from './material';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';
import { generateAddExistingService } from './walkmeSteps';

const FieldTicketDetail = () => {
  const walkmeInstance = useGetWalkmeInstance();
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.fieldTicket?.title);
  const {
    state: { permissions, user }
  }: any = useData();

  const [fieldTicketData, setFieldTicketData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [tabValue, setTabValue] = useState(1);
  const { isOffline } = useContext(CustomOfflineContext);

  const [currentStep, setCurrentStep] = useState(0);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const [nextStep, setNextStep] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [versionDialog, setVersionDialog] = useState(false);

  const [showClosedConfirmBox, setShowClosedConfirmBox] = useState(false);
  const [resourceData, setResourceData] = useState(null);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
      fetchPolicy();
    }
    if (walkmeInstance && walkmeInstance.type === 'flow') {
      walkmeInstance.instance.push(generateAddExistingService(true).steps);
      // immediately start next step
      walkmeInstance.handleNext();
    }
  }, [id, isOffline]);

  useEffect(() => {
    if (!isOffline) {
      if (!isNaN(id)) {
        history.push(`${routes.fieldTicket.path}`);
      }
    }
  }, [isOffline]);

  const fetchFields = async () => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.resource, sidebarResource?.fieldTicket);
      } else {
        const response = await axiosInstance().get(`/field?resource=${sidebarResource?.fieldTicket}`);
        data = response?.data?.data;
      }
      setFields(data?.filter((field) => field.isRead));
    } catch (err) {
      toastConfig.setToastConfig(err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.fieldTicket, id);
      } else if (/^[0-9a-fA-F]{24}$/.test(id)) {
        const response = await axiosInstance().get(`${routes.fieldTicket.path}/${id}`);
        data = response?.data?.data;
      }
      if ([FIELD_TICKET_STATUS.invoiced, FIELD_TICKET_STATUS.readyToInvoice, FIELD_TICKET_STATUS.closed]?.includes(data?.status)) {
        setCurrentStep(fieldTicketSteps?.length - 1);
      } else {
        setCurrentStep(getIndex(data?.processStatus, fieldTicketSteps));
      }

      setAllowedToEdit(permissions?.fieldTicket?.isUpdate && checkIsAllowedToEdit(user, sidebarResource.fieldTicket, data));
      setAllowedToDelete(
        permissions?.fieldTicket?.isDelete && checkIsAllowedToDelete(user, sidebarResource.fieldTicket, data.owner.optionValue) && data?.canDelete
      );
      setFieldTicketData(data);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchPolicy = async () => {
    if (isOffline) return;
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.fieldTicket}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.fieldTicket?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.fieldTicket.path}`);
        })
        .catch((err) => {
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0) {
      updateProcessStatus(fieldTicketSteps[currentStep]?.name);
    }
  }, [currentStep]);

  const updateProcessStatus = async (processStatus) => {
    if (!isOffline) {
      axiosInstance()
        .put(`${fieldTicket.api}/${id}/process-status`, { processStatus: processStatus })
        .then(({ data }) => {})
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleChangeStatus = async (status) => {
    await axiosInstance()
      .patch(`${fieldTicket.api}/status/${fieldTicketData._id}`, { status })
      .then(({ data }) => {
        setShowClosedConfirmBox(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.fieldTicket, { title: fieldTicketData?.fieldTicketNumber }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {allowedToEdit && [FIELD_TICKET_STATUS.invoiced]?.includes(fieldTicketData?.status) && (
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
            {fieldTicketData?.versions?.length && (
              <Button
                variant={isMobile && !isTablet ? 'text' : 'outlined'}
                color="primary"
                size="small"
                className={'btn-outline-v1'}
                onClick={() => {
                  setVersionDialog(true);
                }}
                style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                startIcon={isMobile && !isTablet ? null : <VscVersions />}
              >
                {isMobile && !isTablet ? <VscVersions size={20} /> : 'Versions'}
              </Button>
            )}
            {allowedToEdit && ![FIELD_TICKET_STATUS.invoiced, FIELD_TICKET_STATUS.closed]?.includes(fieldTicketData?.status) && (
              <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                {isMobile && !isTablet ? <Edit /> : 'Edit'}
              </Button>
            )}
            {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            <ActivityButton
              referenceId={fieldTicketData?._id}
              resource={ACTIVITY_RESOURCE.fieldTicket}
              resourceLabel={fieldTicketData?.fieldTicketNumber}
              extraRelatedTo={{
                referenceId: fieldTicketData?.fieldServiceOrder?.optionValue,
                resource: ACTIVITY_RESOURCE.fieldServiceOrder
              }}
            />
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>
            <FaWpforms className="mr-1" fontSize="inherit" /> Header
          </CustomTab>
          <CustomTab value={1}>
            <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
          </CustomTab>
          {resourceData &&
            resourceData?.tabs?.length > 0 &&
            resourceData?.tabs?.map((tab, i) => (
              <CustomTab value={i + 2}>
                <BiFoodMenu className="mr-1" fontSize="inherit" />
                {tab?.tabName}
              </CustomTab>
            ))}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          {loading || !fields?.length ? (
            <Grid container spacing={2} style={{ padding: '8px' }}>
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            </Grid>
          ) : (
            <DetailsPage data={fieldTicketData} fields={fields} />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Steps
            isNextStep={false}
            nextStep={nextStep}
            isPrevStep={fieldTicketData?.status === FIELD_TICKET_STATUS.readyToInvoice ? false : true}
            steps={isOffline ? fieldTicketSteps.filter((s) => s.name === 'Add') : fieldTicketSteps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={[FIELD_TICKET_STATUS.invoiced, FIELD_TICKET_STATUS.closed].includes(fieldTicketData?.status)}
            setStepFullScreen={() => setStepFullScreen(true)}
          />
          <ContentFullScreen title={fieldTicketSteps[currentStep]?.title} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            {currentStep === 0 && fieldTicketData && (
              <Material
                fieldTicketData={fieldTicketData}
                allowedToEdit={allowedToEdit}
                setNextStep={setNextStep}
                handleChangeStatus={handleChangeStatus}
                resourcePolicy={resourceData?.policy}
                stepFullScreen={stepFullScreen}
                fetchData={fetchData}
              />
            )}
            {currentStep === 1 && fieldTicketData && (
              <Submit
                stepFullScreen={stepFullScreen}
                fieldTicketData={fieldTicketData}
                allowedToEdit={allowedToEdit}
                fetchData={fetchData}
                resourcePolicy={resourceData?.policy}
              />
            )}
          </ContentFullScreen>
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 2}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.fieldTicket}
                  data={fieldTicketData}
                  allowedToEdit={permissions?.fieldTicket?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes?.fieldTicket?.title?.toLowerCase()} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {showClosedConfirmBox && (
        <ConfirmationDialog
          open={showClosedConfirmBox}
          message={`Are you sure you want to close ${fieldTicketData?.fieldTicketNumber} ?`}
          onClose={() => {
            setShowClosedConfirmBox(false);
          }}
          onOk={() => {
            handleChangeStatus(FIELD_TICKET_STATUS.closed);
            fetchData();
          }}
        />
      )}
      {openUpdateDialog && (
        <ManageFieldTicket
          id={id}
          isClone={false}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
        />
      )}
      {versionDialog && (
        <Versions
          id={id}
          label={fieldTicketData?.fieldTicketNumber}
          childResource={CHILD_RESOURCE.fieldTicketMateial}
          resource={sidebarResource.fieldTicket}
          referenceData={fieldTicketData}
          versions={fieldTicketData?.versions}
          renderedFrom={`${renderedFrom}_versions`}
          handleClose={() => {
            setVersionDialog(false);
          }}
        />
      )}
    </Box>
  );
};

export default FieldTicketDetail;
