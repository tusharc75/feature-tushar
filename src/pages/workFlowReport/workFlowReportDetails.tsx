import { Box, Grid } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import routes from '../../components/Helpers/Routes';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import Step from 'src/pages/DynamicForm/Step';

const WorkFlowReportDetail = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();
  const [workFlowReportData, setWorkFlowReportData] = useState(null);
  const [workFlowData, setWorkFlowData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (workFlowReportData) {
      fetchWorkFlowData();
    }
  }, [workFlowReportData]);

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
        setWorkFlowData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.workflowReport, { title: workFlowData?.workflowName }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1"></Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab label={'Associations'} value={0} />
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          {loading || !workFlowReportData || !workFlowData ? (
            <Grid container spacing={2} style={{ padding: '8px' }}>
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            </Grid>
          ) : (
            <Step
              resourceData={workFlowData}
              resourceId={id}
              resource={'Workflow Report'}
              data={workFlowReportData}
              allowedToEdit={permissions?.repairOrder?.isUpdate}
            />
          )}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default WorkFlowReportDetail;
