import { useState, useEffect, Fragment, useContext } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { useData } from '../../StateProvider/Provider';
import TextField from '@material-ui/core/TextField';
import DeviceMessage from 'src/components/ScreenMessages/DeviceMessage';
import Steps from './Steps';
import ActivationCondition from './ActivationCondition';
import Notifications from 'src/pages/WorkFlow/Notifications';

const CreateWorkFlow = () => {
  const {
    state: { permissions, user }
  }: any = useData();

  const history = useHistory();
  const { id } = useParams();
  const toastConfig = useContext(CustomToastContext);
  const [workFlowData, setWorkFlowData] = useState(null);
  const [loading, setLoading] = useState(false);

  const onBackButtonEvent = (e) => {
    e.preventDefault();
    window.history.pushState(null, null, window.location.pathname);
    // if (permissions.workFlow?.isUpdate) {
    //   setShowConfirmDialog(true);
    // }
  };

  useEffect(() => {
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', onBackButtonEvent);
    return () => {
      window.removeEventListener('popstate', onBackButtonEvent);
    };
  }, []);

  useEffect(() => {
    fetchWorkFlowData();
  }, []);

  const fetchWorkFlowData = async () => {
    setLoading(true);
      axiosInstance()
        .get(`${routes?.workFlow?.path}/${id}`)
        .then(({ data: { data } }) => {
          setLoading(false);
          setWorkFlowData(data);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        }); 
  };

  return (
    <Fragment>
      <DeviceMessage />
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs
              routes={[routes.workFlow, { title: workFlowData ? workFlowData.workFlowName : '' }]}
              isConfirmBeforeClick={true}
              onBreadCrumbClick={(path) => {
                history.push({ pathname: path });
                // if (!isEqual(orisection, section) && permissions?.isUpdate?.isUpdate) {
                //   setShowConfirmDialog(true);
                // } else 
              }}
            />
          </Box>
          <Box className="controls-v1">
            <Box className="control-buttons-v1">
            </Box>
          </Box>
        </Box>
        <Box className={`detail-container-v1`}>
          {workFlowData ? (
            <Fragment>
              <Box mb={2} width={'100%'}>
                <Grid container alignItems="center">
                  <Grid item container xs={9} spacing={1}>
                    <Grid item xs={4}>
                      <TextField
                        variant="outlined"
                        type="text"
                        label="Work Flow Name"
                        disabled={true}
                        name="workFlowName"
                        fullWidth
                        margin="dense"
                        value={workFlowData.workFlowName || ''}
                        // onChange={(e) => {
                        //   setWorkFlowName(e.target.value.trimStart());
                        // }}
                      />
                    </Grid>
                    <Grid item xs={4} >
                    <TextField
                        variant="outlined"
                        type="text"
                        label="Work Flow Resource"
                        disabled={true}
                        name="workFlowResource"
                        fullWidth
                        margin="dense"
                        value={workFlowData.workFlowResource || ''}
                        // onChange={(e) => {
                        //   setWorkFlowName(e.target.value.trimStart());
                        // }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
              <Box className="mt-2 flex flex-col gap-3">
                <ActivationCondition resource={workFlowData?.workFlowResource} fetchWorkFlowData={fetchWorkFlowData} activationCondition={workFlowData?.activationCondition} loading={loading} id={id} />
                <Steps resource={workFlowData?.workFlowResoure} loading={loading} id={id} />
                <Notifications resource={workFlowData?.workFlowResoure} id={id} />
              </Box>
            </Fragment>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Box>
      </Box>
    </Fragment>
  );
};

export default CreateWorkFlow;
