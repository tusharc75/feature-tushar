import { useState, useEffect, useContext } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs, useMediaQuery } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import DetailsPageHeader from 'src/components/DetailsPageHeader';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { repairJob, sidebarResource, repairJobProcessSteps, REPAIR_JOB_STATUS, ACTIVITY_RESOURCE, serializedAsset } from 'src/constants/helpers';
import Activity from 'src/components/Activity';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import ManageRepairJob from './ManageRepairJob';
import queryString from 'query-string';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import TabPanel from 'src/components/TabPanel';
import HideWhenOffline from 'src/components/HideWhenOffline';
import { defaultActivityShow } from 'src/constants/helpers';
import AddSerializedAsset from './AddSerializedAsset';
import SerializedAsset from './SerializedAsset';
import Tickets from './Tickets';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import Steps from '../RentalManagement/Steps';
import { GiAbstract055 } from 'react-icons/gi';
import { camelCase } from 'lodash';
import { RiFlowChart } from 'react-icons/ri';
import RepairJobViews from './RoadMapViews/index';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { isMobile, isTablet } from 'react-device-detect';
import accountClass from '../Account/account.module.scss';
import ActivityButton from 'src/components/Activity/ActivityButton';

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`
  };
}

const RepairJobDetails = () => {
  const renderedFrom = camelCase(routes?.repairJob.title);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();

  const parsed = queryString.parse(history.location.search);
  const { openEdit, tab }: any = parsed;
  const {
    state: { user, permissions }
  }: any = useData();

  const [repairJobData, setRepairJobData] = useState(null);

  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [repairJobFields, setRepairJobFields] = useState([]);

  const [showRepairJobCompleteConfirmationDialog, setShowRepairJobCompleteConfirmationDialog] = useState(false);

  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [nextStep, setNextStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);

  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');
  const [showActivity, setActivityShow] = useState(defaultActivityShow);

  const [locationKeys, setLocationKeys] = useState([]);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [allowUpdateStatus, setAllowUpdateStatus] = useState(false);

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity);
  };

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
    }
  }, [id]);

  useEffect(() => {
    getResourceFields();
    fetchAssetStatusRights();
  }, []);

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= 2) {
      updateProcessStatus(repairJobProcessSteps[currentStep]);
    }
  }, [currentStep]);

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
    axiosInstance().get(`/field?resource=${serializedAsset.resource}&view=true`)
      .then(({ data }) => {
        if (data.data && data.data.length) {
          data.data.some(o => {
            if (o?.fieldData?.fieldName === "status") {
              setAllowUpdateStatus(o?.isUpdate)
              return true
            }
          })
        }
      })
      .catch((err) => {
      });
  };

  const fetchRepairJobData = () => {
    axiosInstance()
      .get(`${routes.repairJob.path}/${id}`)
      .then(({ data: { data } }) => {
        setRepairJobData({ ...data });
        setCurrentStep(repairJobProcessSteps.indexOf(data?.processStatus) !== -1 ? repairJobProcessSteps.indexOf(data?.processStatus) : 0);

        const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
        setAllowedToEdit(isAllowedToEdit);

        if (permissions?.repairJob?.isUpdate && openEdit === 'true') {
          setOpenUpdateDialog(true);
          const params = new URLSearchParams();
          params.delete('openEdit');
          history.push({ search: params.toString() });
        }
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
        history.goBack();
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

  const updateProcessStatus = (processStatus) => {
    axiosInstance()
      .put(`${repairJob.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => { })
      .catch((error) => {
      });
  };

  const updateJobStatus = (status) => {
    axiosInstance()
      .patch(`${repairJob.api}/${id}/status`, { status: status })
      .then(({ data: { data } }) => { })
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

  useEffect(() => {
    if (isSmallScreen && tabValue === 0) {
      setActivityShow(true)
    }
    else {
      setActivityShow(false)
    }
  }, [isSmallScreen, tabValue])


  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.repairJob, { title: repairJobData?.repairJobName }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.repairJob?.isUpdate && allowedToEdit && repairJobData?.status !== REPAIR_JOB_STATUS.completed && (
                <Button
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  className={'btn-outline-v1'}
                  onClick={handleOpenUpdateDialog}
                >
                  {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                </Button>
              )}
              {/* {permissions?.repairJob?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />} */}
              <ActivityButton referenceId={repairJobData?._id} resource={ACTIVITY_RESOURCE.repairJob} />
            </>
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Tabs
          className="new-tab-container-v1"
          value={tabValue}
          onChange={handleMainTabChange}
          textColor="primary"
          TabIndicatorProps={{
            style: {
              display: 'none'
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
            {...a11yProps(0)}
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
              </div>
            }
            {...a11yProps(1)}
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <GiAbstract055 className="mr-1" fontSize="inherit" /> {routes.deliveryTicket.title}
              </div>
            }
            {...a11yProps(2)}
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <RiFlowChart className="mr-1" fontSize="inherit" /> Views
              </div>
            }
            {...a11yProps(3)}
          />
          <div className={'uio'}> </div>
        </Tabs>
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
        <TabPanel value={tabValue} index={1}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <Paper>
              <Steps
                isNextStep={false}
                nextStep={nextStep}
                steps={repairJobProcessSteps}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                isStepEnded={[REPAIR_JOB_STATUS.completed].includes(repairJobData?.status)}
                setStepFullScreen={() => setStepFullScreen(true)}
              />
              <ContentFullScreen title={repairJobProcessSteps[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen} >
                {currentStep === 0 && (
                  <AddSerializedAsset
                    repairJobData={repairJobData}
                    setNextStep={setNextStep}
                    updateJobStatus={updateJobStatus}
                    repairedAssetStatus={repairedAssetStatus}
                    renderedFrom={`${renderedFrom}_grid-1`}
                    allowedToEdit={allowedToEdit}
                    allowUpdateStatus={allowUpdateStatus}
                  />
                )}
                {currentStep === 1 && (
                  <SerializedAsset
                    repairJobData={repairJobData}
                    fetchRepairJobData={fetchRepairJobData}
                    repairedAssetStatus={repairedAssetStatus}
                    renderedFrom={`${renderedFrom}_grid-2`}
                    allowedToEdit={allowedToEdit}
                    allowUpdateStatus={allowUpdateStatus}
                  />
                )}
              </ContentFullScreen>
            </Paper>
          </Grid>
        </TabPanel>
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
      </Box>

      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this repair job: ${repairJobData?.repairJobName} ?`}
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
      {
        openUpdateDialog && (
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
        )
      }
    </Box>
  );
};

export default RepairJobDetails;
