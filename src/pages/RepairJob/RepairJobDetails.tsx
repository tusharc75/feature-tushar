import { Box, Grid } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { camelCase } from 'lodash';
import queryString from 'query-string';
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
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import routes from 'src/components/Helpers/Routes';
import DetailsPage from 'src/components/Shared/DetailsPage';
import Steps, { getIndex } from 'src/components/Steps';
import {
  ACTIVITY_RESOURCE,
  REPAIR_JOB_STATUS,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  repairJob,
  repairJobProcessSteps,
  serializedAsset,
  sidebarResource
} from 'src/constants/helpers';
import AddSerializedAsset from './AddSerializedAsset';
import ManageRepairJob from './ManageRepairJob';
import RepairJobViews from './RoadMapViews/index';
import SerializedAsset from './SerializedAsset';
import Tickets from './Tickets';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import Step from '../DynamicForm/Step';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';

const RepairJobDetails = () => {
  const renderedFrom = camelCase(sidebarResource?.repairJob);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();

  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [resourceData, setResourceData] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);
  const [repairJobData, setRepairJobData] = useState(null);

  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [repairJobFields, setRepairJobFields] = useState([]);

  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [nextStep, setNextStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [nextStepToolTip, setNextStepToolTip] = useState(null);

  const [locationKeys, setLocationKeys] = useState([]);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [allowUpdateStatus, setAllowUpdateStatus] = useState(false);

  const [alloweOperation, setAlloweOperation] = useState(true);

  const repairJobProcessStepsNames = React.useMemo(() => {
    return repairJobProcessSteps.map((item) => item.name);
  }, [repairJobProcessSteps]);

  useEffect(() => {
    return history.listen((location) => {
      const { tab }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key]);
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys);
          // Handle forward event
          setTabValue(tab ? parseInt(tab) : 1);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setTabValue(tab ? parseInt(tab) : 1);
        }
      }
    });
  }, [locationKeys]);

  useEffect(() => {
    if (id) {
      fetchRepairJobData();
      fetchPolicy();
    }
  }, [id]);

  useEffect(() => {
    getResourceFields();
    fetchAssetStatusRights();
  }, []);

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.repairJob}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getResourceFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.repairJob}`)
      .then(({ data: { data } }) => {
        setRepairJobFields(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchAssetStatusRights = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}&view=true`)
      .then(({ data }) => {
        if (data.data && data.data.length) {
          data.data.some((o) => {
            if (o?.fieldData?.fieldName === 'status') {
              setAllowUpdateStatus(o?.isUpdate);
              return true;
            }
          });
        }
      })
      .catch((err) => {});
  };

  const fetchRepairJobData = () => {
    axiosInstance()
      .get(`${routes.repairJob.path}/${id}`)
      .then(({ data: { data } }) => {
        setCurrentStep(getIndex(data?.processStatus, repairJobProcessSteps));
        setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.repairJob, data));
        setAlloweOperation(data?.workOrder ? false : true);
        setAllowedToDelete(
          permissions?.repairJob?.isDelete && checkIsAllowedToDelete(user, sidebarResource.repairJob, data.owner.optionValue) && data?.canDelete
        );
        setRepairJobData({ ...data });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${repairJob.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes.repairJob.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
    if (newValue === 0) {
      fetchRepairJobData();
    }
  };

  const updateJobStatus = (status) => {
    axiosInstance()
      .patch(`${repairJob.api}/${id}/status`, { status: status })
      .then(({ data: { data } }) => {})
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const repairedAssetStatus = (assets) => {
    axiosInstance()
      .put(`${repairJob.api}/${id}/assets/repaired`, { assets: assets, repaired: true })
      .then(({ data }) => {
        fetchRepairJobData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ ...routes?.repairJob, title: resources?.repairJob?.titlePlural }, { title: repairJobData?.repairJobName }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.repairJob?.isUpdate && allowedToEdit && repairJobData?.status !== REPAIR_JOB_STATUS.completed && (
                <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpenUpdateDialog} mobileTooltip={'Edit'}>
                  {'Edit'}
                </ThemeButton>
              )}
              {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              <ActivityButton referenceId={repairJobData?._id} resource={ACTIVITY_RESOURCE.repairJob} resourceLabel={repairJobData?.repairJobName} />
            </>
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          <CustomTab value={2}>{resources?.deliveryTicket?.titlePlural}</CustomTab>
          {!(isMobile && !isTablet) && <CustomTab value={3}>Views</CustomTab>}
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 4}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {repairJobData && repairJobFields.length ? (
              <DetailsPage data={repairJobData} fields={repairJobFields} />
            ) : (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            )}
          </Box>
        </TabPanel>
        <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
          <TabPanel value={tabValue} index={1}>
            <Steps
              isNextStep={false}
              nextStep={nextStep}
              nextStepToolTip={nextStepToolTip}
              steps={repairJobProcessSteps}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isStepEnded={[REPAIR_JOB_STATUS.completed].includes(repairJobData?.status)}
              stepFullScreen={stepFullScreen}
              setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
              updateStatus={(step: number) => {
                dynamicFormUpdateProcessStatus(sidebarResource.repairJob, repairJobProcessStepsNames[step], id);
              }}
            />
            {currentStep === 0 && repairJobData && (
              <AddSerializedAsset
                repairJobData={repairJobData}
                setNextStep={setNextStep}
                setNextStepToolTip={setNextStepToolTip}
                updateJobStatus={updateJobStatus}
                renderedFrom={`${renderedFrom}_grid-1`}
                allowedToEdit={allowedToEdit}
                stepFullScreen={stepFullScreen}
                alloweOperation={alloweOperation}
                fetchRepairJobData={fetchRepairJobData}
              />
            )}
            {currentStep === 1 && repairJobData && (
              <SerializedAsset
                repairJobData={repairJobData}
                fetchRepairJobData={fetchRepairJobData}
                repairedAssetStatus={repairedAssetStatus}
                renderedFrom={`${renderedFrom}_grid-2`}
                allowedToEdit={allowedToEdit}
                allowUpdateStatus={allowUpdateStatus}
                stepFullScreen={stepFullScreen}
                alloweOperation={alloweOperation}
              />
            )}
          </TabPanel>
        </ContentFullScreen>
        <TabPanel value={tabValue} index={2}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            {repairJobData && <Tickets repairJobData={repairJobData} renderedFrom={`${renderedFrom}_grid-3`} />}
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Box>
            <RepairJobViews repairJobName={repairJobData?.repairJobName} repairId={id} repairStatus={repairJobData?.status} />
          </Box>
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 4}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.repairJob}
                  data={repairJobData}
                  allowedToEdit={permissions?.repairJob?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${resources?.repairJob?.titleSingular?.toLowerCase()}: ${repairJobData?.repairJobName} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {/* {
        showRepairJobCompleteConfirmationDialog && <ConfirmationDialog
          open={true}
          message={`Are you sure you want to complete this repair job ?`}
          onClose={() => {
            setShowRepairJobCompleteConfirmationDialog(false)
          }}
          onOk={() => {
            onNextButtonClick(repairJobProcessSteps.length - 2, repairJobProcessSteps.length - 1, false)
          }}
          okBtnLoading={okBtnLoading}
        />
      } */}
      {openUpdateDialog && (
        <ManageRepairJob
          isClone={false}
          repairJobId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchRepairJobData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </Box>
  );
};

export default RepairJobDetails;
