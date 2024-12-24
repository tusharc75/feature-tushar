import { Box, Button, Grid } from '@mui/material';
import { Edit } from '@mui/icons-material';
import { camelCase } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityButton from 'src/components/Activity/ActivityButton';
import ContentFullScreen from 'src/components/ContentFullScreen';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import Steps, { getIndex } from 'src/components/Steps';
import { ACTIVITY_RESOURCE, checkIsAllowedToDelete, checkIsAllowedToEdit, jobProcessSteps, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import Dispatch from './Dispatch';
import ManageJobDialog from './ManageJobDialog';
import Material from './Material';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import Step from 'src/pages/DynamicForm/Step';

const JobDetail = () => {
  const renderedFrom = camelCase(sidebarResource.job);
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.job]);
  const [jobData, setJobData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [currentStep, setCurrentStep] = useState(null);
  const [nextStep, setNextStep] = useState(true);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [resourceData, setResourceData] = useState(null);

  const jobProcessStepsNames = React.useMemo(() => {
    return jobProcessSteps.map((item) => item.name);
  }, [jobProcessSteps]);

  const {
    state: { permissions, user, resources }
  }: any = useData();

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
      fetchPolicy();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get('/field?resource=Job')
      .then(({ data }) => {
        setFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.job.path}/${id}`);
      setCurrentStep(getIndex(data?.processStatus, jobProcessSteps));

      setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.job, data));
      setAllowedToDelete(permissions?.job?.isDelete && checkIsAllowedToDelete(user, sidebarResource.job, data.owner.optionValue));
      setJobData(data);
      setCustomizedRoutes([{ ...routes.job, title: resources?.job?.titlePlural }, { title: data?.jobNumber }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.job}`);
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
        .put(`${routes?.job?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.job.path}`);
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

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.job?.isUpdate && allowedToEdit && (
              <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                {isMobile && !isTablet ? <Edit /> : 'Edit'}
              </Button>
            )}
            {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            <ActivityButton referenceId={jobData?._id} resource={ACTIVITY_RESOURCE.job} resourceLabel={jobData?.jobNumber} />
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 2}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !fields?.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={jobData} fields={fields} />
            )}
          </Box>
        </TabPanel>
        <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
          <TabPanel value={tabValue} index={1}>
            <Steps
              isNextStep={false}
              nextStep={nextStep}
              steps={jobProcessSteps}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isStepEnded={false}
              stepFullScreen={stepFullScreen}
              setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
              updateStatus={(step: number) => {
                dynamicFormUpdateProcessStatus(sidebarResource.job, jobProcessStepsNames[step], id);
              }}
            />
            {currentStep === 0 && jobData && (
              <Material
                renderedFrom={`${renderedFrom}_grid-1`}
                allowedToEdit={allowedToEdit && permissions?.job?.isUpdate ? true : false}
                jobData={jobData}
                setNextStep={setNextStep}
              />
            )}

            {currentStep === 1 && jobData && <Dispatch renderedFrom={`${renderedFrom}_grid-1`} jobData={jobData} setNextStep={setNextStep} />}
          </TabPanel>
        </ContentFullScreen>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 2}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.job}
                  data={jobData}
                  allowedToEdit={permissions?.job?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.job?.titleSingular?.toLowerCase()} : ${jobData?.jobNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageJobDialog
          jobId={id}
          open={openUpdateDialog}
          isClone={false}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
          jobData={jobData}
        />
      )}
    </Box>
  );
};

export default JobDetail;
