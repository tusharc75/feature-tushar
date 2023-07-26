import { Box, Button, Grid, Tab, Tabs } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { isMobile, isTablet } from 'react-device-detect';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import { useData } from 'src/StateProvider/Provider';
import { useParams, useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ManageFieldTicket from './ManageFieldTicket';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { ACTIVITY_RESOURCE, fieldTicket, fieldTicketSteps, sidebarResource } from 'src/constants/helpers';
import TabPanel from '../../components/TabPanel';
import { FaWpforms } from 'react-icons/fa';
import AddCost from './AddCost';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { findOne, objectStore } from 'src/constants/indexdbhelper';
import Steps, { getIndex } from 'src/components/Steps';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Material from './material';
import { camelCase, set } from 'lodash';
import Submit from './Submit';

const FieldTicketDetail = () => {
  
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
  const [tabValue, setTabValue] = useState(0);
  const { isOffline } = useContext(CustomOfflineContext);

  const [currentStep, setCurrentStep] = useState(0);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const [nextStep, setNextStep] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id, isOffline]);

  const fetchFields = async () => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.resource, objectStore.fieldTicket);
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
      } else {
        const response = await axiosInstance().get(`${routes.fieldTicket.path}/${id}`);
        data = response?.data?.data;
      }
      setFieldTicketData(data);
      setCurrentStep(getIndex(data?.processStatus, fieldTicketSteps));
      let isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      if (user?.role?.selectedEntity?.superAdminAccess) {
        isAllowedToEdit = true;
      }
      setAllowedToEdit(isAllowedToEdit);
      setLoading(false);
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
          history.goBack();
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
    axiosInstance()
      .put(`${fieldTicket.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => { })
      .catch((error) => { });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.fieldTicket, { title: fieldTicketData?.fieldTicketNumber }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.fieldTicket?.isUpdate && (
              <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
              </Button>
            )}
            {permissions?.fieldTicket?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            <ActivityButton referenceId={fieldTicketData?._id} resource={ACTIVITY_RESOURCE.fieldTicket} />
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <Tabs
          className="new-tab-container-v1"
          value={tabValue}
          onChange={handleMainTabChange}
          textColor="primary"
          TabIndicatorProps={{
            style: {
              height: 0
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
            value={0}
            aria-controls="a11y-tabpanel-0"
            id="a11y-tab-0"
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
              </div>
            }
            value={1}
            aria-controls="a11y-tabpanel-1"
            id="a11y-tab-1"
          />
        </Tabs>
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
            steps={fieldTicketSteps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={false}
            setStepFullScreen={() => setStepFullScreen(true)}
          />
          <ContentFullScreen title={fieldTicketSteps[currentStep]?.title} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            {currentStep === 0 && (
              <Material
                stepFullScreen={stepFullScreen}
                fieldTicketData={fieldTicketData}
                id={id}
                renderedFrom={`${renderedFrom}_grid-1`}
                allowedToEdit={allowedToEdit}
                setNextStep={setNextStep}
              />
            )}
            {currentStep === 1 && (
              <AddCost
                fieldTicketData={fieldTicketData}
                id={id}
                renderedFrom={`${renderedFrom}_grid-2`}
                setNextStep={setNextStep} />
            )}
            {currentStep === 2 && (
              <Submit
                stepFullScreen={stepFullScreen}
                fieldTicketData={fieldTicketData}
                id={id}
                renderedFrom={`${renderedFrom}_grid-3`}
                allowedToEdit={allowedToEdit}
              />
            )}
          </ContentFullScreen>
        </TabPanel>
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
    </Box>
  );
};

export default FieldTicketDetail;
