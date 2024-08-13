import { useState, useEffect, Fragment, useContext } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Button, CircularProgress, useMediaQuery } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { isTablet } from 'react-device-detect';
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
import { RiCloseCircleFill, RiSaveFill } from 'react-icons/ri';

const CreateWorkFlow = () => {
  const {
    state: { permissions, user }
  }: any = useData();

  const history = useHistory();
  const { id } = useParams();
  const isMobile = useMediaQuery('(max-width: 960px)');
  const toastConfig = useContext(CustomToastContext);
  const [workFlowData, setWorkFlowData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [workFlowName, setWorkFlowName] = useState('');
  const [isEdit, setIsEdit] = useState(false);

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
          setWorkFlowName(data?.workFlowName)
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        }); 
  };

  const handleSave = async () => {
    setIsUpdating(true);
    const values = {
      _id: workFlowData?._id,
      workFlowName: workFlowName
    }
      axiosInstance()
        .put(`${routes?.workFlow?.path}`, values)
        .then(({ data: { data } }) => {
          setIsUpdating(false);
          setIsEdit(false);
          fetchWorkFlowData();
        })
        .catch((error) => {
          setIsUpdating(false);
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
                    <Grid item xs={6} md={4}>
                      <TextField
                        variant="outlined"
                        type="text"
                        label="Work Flow Name"
                        disabled={!isEdit || isUpdating}
                        name="workFlowName"
                        fullWidth
                        margin="dense"
                        value={workFlowName || ''}
                        onChange={(e) => {
                          setWorkFlowName(e.target.value.trimStart());
                        }}
                      />
                    </Grid>
                    <Grid item xs={6} md={4}>
                    <TextField
                        variant="outlined"
                        type="text"
                        label="Work Flow Resource"
                        disabled={true}
                        name="workFlowResource"
                        fullWidth
                        margin="dense"
                        value={workFlowData.workFlowResource || ''}
                      />
                    </Grid>
                  </Grid>
                  <Grid item xs={3} container justifyContent="flex-end">
                    <Box>
                      {permissions?.workFlow?.isUpdate && (
                        <Button
                          disabled={isUpdating}
                          color="primary"
                          size="small"
                          onClick={isEdit ? handleSave : () => setIsEdit(true)}
                          variant={isMobile && !isTablet ? 'text' : 'contained'}
                          style={isMobile && !isTablet ? { color: 'var(--success)' } : {}}
                        >
                          {isMobile && !isTablet ? <RiSaveFill size={24} /> : (isEdit ? 'Save' : 'Edit')}
                          {isUpdating && <CircularProgress size={24} />}
                        </Button>
                      )}
                    </Box>
                    <Box ml={1}>
                      <Button
                        color="primary"
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        size="small"
                        style={isMobile && !isTablet ? { color: 'var(--error)' } : {}}
                        onClick={() => {
                          history.push({ pathname: routes.workFlow.path });
                        }}
                      >
                        {' '}
                        {isMobile && !isTablet ? <RiCloseCircleFill size={24} /> : 'Close'}
                      </Button>
                    </Box>
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
