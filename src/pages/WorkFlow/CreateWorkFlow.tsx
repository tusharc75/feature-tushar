import { useState, useEffect, Fragment, useContext } from 'react';
import Grid from '@mui/material/Grid2';
import { Box, useMediaQuery } from '@mui/material';
import { useHistory, useParams } from 'react-router-dom';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { useData } from '../../StateProvider/Provider';
import TextField from '@mui/material/TextField';
import ActivationCondition from './ActivationCondition';
import Notifications from 'src/pages/WorkFlow/Notifications';
import ManageWorkFlow from 'src/pages/WorkFlow/ManageWorkFlow';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import DynamicTabs from 'src/components/FormBuilder/Tabs';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const CreateWorkFlow = () => {
  const {
    state: { permissions, resources }
  }: any = useData();

  const history = useHistory();
  const { id } = useParams();
  const isMobile = useMediaQuery('(max-width: 960px)');
  const toastConfig = useContext(CustomToastContext);
  const [workFlowData, setWorkFlowData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showManageWorkFlowDialog, setShowManageWorkFlowDialog] = useState({ open: false, data: null });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchWorkFlowData();
  }, []);

  const fetchWorkFlowData = async () => {
    setLoading(true);
    axiosInstance()
      .get(`${routes?.workflow?.path}/${id}`)
      .then(({ data: { data } }) => {
        setLoading(false);
        setWorkFlowData(data);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleMainTabChange = (event: any, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Fragment>
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs
              routes={[{ ...routes.workflow, title: resources?.workflow?.titlePlural }, { title: workFlowData ? workFlowData.workflowName : '' }]}
              isConfirmBeforeClick={true}
              onBreadCrumbClick={(path) => {
                history.push({ pathname: path });
              }}
            />
          </Box>
        </Box>
        <Box className={`detail-container-v1`}>
          {workFlowData ? (
            <Fragment>
              <Box mb={2} width={'100%'}>
                <Grid container alignItems="center">
                  <Grid size={{ xs: 9 }} container spacing={1}>
                    <Grid size={{ xs: 6, md: 4 }}>
                      <TextField
                        variant="outlined"
                        type="text"
                        label="Workflow Name"
                        disabled={true}
                        name="workflowName"
                        fullWidth
                        margin="dense"
                        size="small"
                        value={workFlowData.workflowName || ''}
                      // onChange={(e) => {
                      //   setWorkFlowName(e.target.value.trimStart());
                      // }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 4 }}>
                      <TextField
                        variant="outlined"
                        type="text"
                        label="Workflow Resource"
                        disabled={true}
                        name="workflowResource"
                        fullWidth
                        margin="dense"
                        size="small"
                        value={workFlowData?.workflowResource?.optionLabel || ''}
                      />
                    </Grid>
                  </Grid>
                  <Grid size={{ xs: 3 }} container justifyContent="flex-end">
                    {permissions?.workflow?.isUpdate && (
                      <Box className="gap-1">
                        <ThemeButton
                          onClick={() =>
                            setShowManageWorkFlowDialog({
                              open: true,
                              data: {
                                _id: workFlowData?._id,
                                workflowName: workFlowData.workflowName,
                                workflowResource: workFlowData.workflowResource?.optionValue
                              }
                            })
                          }
                          buttonType='theme'
                          disabled={false}
                        >
                          {'Edit'}
                        </ThemeButton>
                      </Box>
                    )}
                    <Box ml={1}>
                      <ThemeButton
                        onClick={() => {
                          history.push({ pathname: routes.workflow.path });
                        }}
                      >
                        Close
                      </ThemeButton>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              <Box>
                <CustomTabs value={tabValue} onChange={handleMainTabChange}>
                  <CustomTab value={0} label={'Activation Condition'} />
                  <CustomTab value={1} label={'Steps'} />
                  <CustomTab value={2} label={'Notifications'} />
                </CustomTabs>
                <TabPanel value={tabValue} index={0}>
                  <ActivationCondition
                    resource={workFlowData?.workflowResource?.optionValue}
                    fetchWorkFlowData={fetchWorkFlowData}
                    activationCondition={workFlowData?.activationCondition}
                    loading={loading}
                    id={id}
                  />
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                  <DynamicTabs workflowId={id} resource={workFlowData?.workflowResoure?.optionValue} />
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                  <Notifications resource={workFlowData?.workflowResource?.optionValue} id={id} />
                </TabPanel>
              </Box>
            </Fragment>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Box>
        {showManageWorkFlowDialog.open && (
          <ManageWorkFlow
            onClose={() => setShowManageWorkFlowDialog({ open: false, data: null })}
            onSuccess={() => {
              fetchWorkFlowData();
              setShowManageWorkFlowDialog({ open: false, data: null });
            }}
            data={showManageWorkFlowDialog.data}
          />
        )}
      </Box>
    </Fragment>
  );
};

export default CreateWorkFlow;
