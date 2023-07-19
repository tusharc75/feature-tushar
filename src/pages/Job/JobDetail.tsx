import { Box, Button, Grid, Tab, Tabs } from '@material-ui/core';
import React, { useContext, useEffect, useState } from 'react';
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
import TabPanel from '../../components/TabPanel';
import { camelCase } from 'lodash';
import { FaWpforms } from 'react-icons/fa';
import { TbFileInvoice } from 'react-icons/tb';
import ManageJobDialog from './ManageJobDialog';
import Material from './Material';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { ACTIVITY_RESOURCE, jobProcessSteps } from 'src/constants/helpers';
import Dispatch from './Dispatch';
import Invoice from './Invoice';
import ActivityButton from 'src/components/Activity/ActivityButton';
import Steps, { getIndex } from 'src/components/Steps';

const JobDetail = () => {
  const renderedFrom = camelCase(routes?.job.title);
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

  const jobProcessStepsNames = React.useMemo(() => {
    return jobProcessSteps.map((item) => item.name);
  }, [jobProcessSteps]);

  const {
    state: { permissions, user }
  }: any = useData();

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
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
      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      setAllowedToEdit(isAllowedToEdit);
      setAllowedToDelete(data?.owner?.optionValue === user?.user?._id);
      setJobData(data);
      setCustomizedRoutes([routes.job, { title: data?.jobNumber }]);
      setLoading(false);
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

  const updateProcessStatus = (processStatus) => {
    axiosInstance()
      .put(`${routes.job.path}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => {})
      .catch((error) => {});
  };

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= jobProcessStepsNames.length) {
      updateProcessStatus(jobProcessStepsNames[currentStep]);
    }
  }, [currentStep]);

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.job?.isUpdate && allowedToEdit && (
              <Button
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                className="btn-outline-v1"
                onClick={handleOpenUpdateDialog}
              >
                {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
              </Button>
            )}
            {permissions?.job?.isDelete && allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            <ActivityButton referenceId={jobData?._id} resource={ACTIVITY_RESOURCE.job} />
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
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <TbFileInvoice className="mr-1" fontSize="inherit" /> Invoice
              </div>
            }
            value={2}
            aria-controls="a11y-tabpanel-1"
            id="a11y-tab-1"
          />
        </Tabs>
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
        <TabPanel value={tabValue} index={1}>
          <Steps
            isNextStep={false}
            nextStep={nextStep}
            steps={jobProcessSteps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={false}
            setStepFullScreen={() => setStepFullScreen(true)}
          />
          <ContentFullScreen title={jobProcessStepsNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            {currentStep === 0 && jobData && (
              <Material
                renderedFrom={`${renderedFrom}_grid-1`}
                allowedToEdit={allowedToEdit && permissions?.job?.isUpdate ? true : false}
                jobData={jobData}
                setNextStep={setNextStep}
              />
            )}

            {currentStep === 1 && jobData && <Dispatch renderedFrom={`${renderedFrom}_grid-1`} jobData={jobData} setNextStep={setNextStep} />}
          </ContentFullScreen>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Invoice />
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes?.job?.title?.toLowerCase()} ?`}
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
