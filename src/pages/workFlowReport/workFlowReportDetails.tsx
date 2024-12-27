import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import routes from '../../components/Helpers/Routes';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import Step from 'src/pages/DynamicForm/Step';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { camelCase, sortBy } from 'lodash';
import { WORK_FLOW_STATUS } from 'src/constants/helpers';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const WorkFlowReportDetail = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [workFlowReportData, setWorkFlowReportData] = useState(null);
  const [workFlowData, setWorkFlowData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resourceData, setResourceData] = useState(null);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (workFlowReportData) {
      fetchPolicy();
      fetchWorkFlowData();
    }
  }, [workFlowReportData]);

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${workFlowReportData.resource}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    axiosInstance()
      .get(`${routes.workflowReport.path}/${id}`)
      .then(({ data: { data } }) => {
        setLoading(false);
        setWorkFlowReportData(data);
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const fetchWorkFlowData = async () => {
    axiosInstance()
      .get(`${routes.workflow.path}/${workFlowReportData?.workflow}`)
      .then(({ data: { data } }) => {
        let tabs = sortBy(data?.tabs, 'order');
        data.tabs = tabs;
        setWorkFlowData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const updateTransferStatus = (status) => {
    axiosInstance()
      .put(`${routes.workflowReport.path}/update-status`, { status, _id: id })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ ...routes.workflowReport, title: resources?.workFlowReport?.titlePlural }, { title: workFlowData?.workflowName }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {workFlowReportData?.status !== WORK_FLOW_STATUS.completed && (
              <ThemeButton
                onClick={() => {
                  setShowCloseConfirmation(true);
                }}
                mobileTooltip='Close'
                iconForMobile={false}
              >
                Close
              </ThemeButton>
            )}
            {resourceData?.collaborateTools && workFlowReportData && (
              <ActivityButton
                referenceId={workFlowReportData?.reference?.optionValue}
                resource={camelCase(workFlowReportData?.resource)}
                resourceLabel={workFlowReportData?.reference?.optionLabel[0]}
              />
            )}
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          {workFlowData && workFlowData?.tabs?.length > 0 && workFlowData?.tabs?.map((tab, i) => <CustomTab value={i}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        {loading || !workFlowReportData || !workFlowData ? (
          <Grid container spacing={2} style={{ padding: '8px' }}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Grid>
        ) : (
          workFlowData &&
          workFlowData?.tabs?.length > 0 &&
          workFlowData?.tabs?.map((tab, i) => (
            <TabPanel key={i} value={tabValue} index={i}>
              <Step
                tab={tab}
                workflowId={workFlowData?._id}
                resourceId={id}
                resource={'Workflow Report'}
                data={workFlowReportData}
                allowedToEdit={permissions?.workflowReport?.isUpdate}
              />
            </TabPanel>
          ))
        )}
      </Box>
      {showCloseConfirmation && (
        <ConfirmationDialog
          open={showCloseConfirmation}
          message={`Are you sure you want to close ?`}
          onClose={() => {
            setShowCloseConfirmation(false);
          }}
          onOk={() => {
            updateTransferStatus(WORK_FLOW_STATUS.completed);
            setShowCloseConfirmation(false);
          }}
          okBtnLoading={false}
        />
      )}
    </Box>
  );
};

export default WorkFlowReportDetail;
