import { useState, useEffect, Fragment, useContext } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Button, useMediaQuery } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { isTablet } from 'react-device-detect';
import routes from './../../components/Helpers/Routes';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { useData } from '../../StateProvider/Provider';
import TextField from '@material-ui/core/TextField';
import Steps from './Steps';
import ActivationCondition from './ActivationCondition';
import Notifications from 'src/pages/WorkFlow/Notifications';
import { RiCloseCircleFill } from 'react-icons/ri';
import ManageWorkFlow from 'src/pages/WorkFlow/ManageWorkFlow';
import { WORK_FLOW_STATUS } from 'src/constants/helpers';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ButtonWithPulse from 'src/components/ButtonWithPulse';

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
  const [showManageWorkFlowDialog, setShowManageWorkFlowDialog] = useState({ open: false, data: null });
  const [showClosedConfirmBox, setShowClosedConfirmBox] = useState(false);

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

  const handleChangeStatus = (status) => {
    axiosInstance()
      .put(`${routes.workFlow.path}/${id}/update-status`, { status: status })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
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
              {permissions?.workFlow?.isUpdate && [WORK_FLOW_STATUS.open, WORK_FLOW_STATUS.inProgress ].includes(workFlowData?.status) &&
              (<ButtonWithPulse
                variant={'outlined'}
                color="default"
                size="small"
                onClick={() => {
                  setShowClosedConfirmBox(true);
                }}
                className={'btn-outline-v1'}
              >
                Close
              </ButtonWithPulse>)
              }
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
                    {permissions?.workFlow?.isUpdate && (
                      <Box className="gap-1">
                        <Button
                          disabled={false}
                          color="primary"
                          size="small"
                          onClick={() =>
                            setShowManageWorkFlowDialog({
                              open: true,
                              data: {
                                _id: workFlowData?._id,
                                workFlowName: workFlowData.workFlowName,
                                workFlowResource: workFlowData.workFlowResource
                              }
                            })
                          }
                          variant={'contained'}
                        >
                          {'Edit'}
                        </Button>
                      </Box>
                    )}
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
                <ActivationCondition
                  resource={workFlowData?.workFlowResource}
                  fetchWorkFlowData={fetchWorkFlowData}
                  activationCondition={workFlowData?.activationCondition}
                  loading={loading}
                  id={id}
                />
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
      {showClosedConfirmBox && (
        <ConfirmationDialog
          open={showClosedConfirmBox}
          message={`Are you sure you want to close workflow?`}
          onClose={() => {
            setShowClosedConfirmBox(false);
          }}
          onOk={() => {
            handleChangeStatus(WORK_FLOW_STATUS.completed);
            setShowClosedConfirmBox(false);
          }}
        />
      )}
    </Fragment>
  );
};

export default CreateWorkFlow;
