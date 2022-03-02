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
import { repairJob, sidebarResource, repairJobProcessSteps, REPAIR_JOB_STATUS } from 'src/constants/helpers';
import Activity from 'src/components/Activity';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import ManageRepairJob from './ManageRepairJob';
import queryString from "query-string";
import { BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import TabPanel from 'src/components/TabPanel';
import HideWhenOffline from 'src/components/HideWhenOffline';
import { defaultActivityShow } from 'src/constants/helpers';
import AddSerializedAsset from './AddSerializedAsset';
import SerializedAsset from './SerializedAsset';
import Tickets from './Tickets';
import DeleteButton from "src/components/Helpers/DeleteButton";
import Steps from "../RentalManagement/Steps";
import { GiAbstract055 } from 'react-icons/gi';
import { camelCase } from 'lodash';

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`
  };
}

const RepairJobDetails = () => {
  const renderedFrom = camelCase(routes?.repairJob.title)
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();

  const parsed = queryString.parse(history.location.search);
  const { openEdit, tab }: any = parsed;
  const { state: { user, permissions } }: any = useData();

  const [repairJobData, setRepairJobData] = useState(null);

  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [repairJobFields, setRepairJobFields] = useState([]);

  const [showRepairJobCompleteConfirmationDialog, setShowRepairJobCompleteConfirmationDialog] = useState(false);

  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);

  const [nextStep, setNextStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);

  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');
  const [showActivity, setActivityShow] = useState(defaultActivityShow);

  const [locationKeys, setLocationKeys] = useState([])

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity);
  };

  useEffect(() => {
    return history.listen(location => {
      const { tab }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key])
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys)
          // Handle forward event
          setTabValue(tab ? parseInt(tab) : 1)

        } else {
          setLocationKeys((keys) => [location.key, ...keys])
          // Handle back event
          setTabValue(tab ? parseInt(tab) : 1)

        }
      }
    })
  }, [locationKeys])

  useEffect(() => {
    if (id) {
      fetchRepairJobData();
    }
  }, [id]);

  useEffect(() => {
    getResourceFields()
  }, []);

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= 2) {
      updateProcessStatus(repairJobProcessSteps[currentStep]);
    }
  }, [currentStep]);

  const getResourceFields = () => {
    axiosInstance().get(`/field?resource=${sidebarResource.repairJob}`)
      .then(({ data: { data } }) => {
        setRepairJobFields(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchRepairJobData = () => {
    axiosInstance().get(`${routes.repairJob.path}/${id}`).then(({ data: { data } }) => {
      setRepairJobData({ ...data })
      setCurrentStep(repairJobProcessSteps.indexOf(data?.processStatus) !== -1 ? repairJobProcessSteps.indexOf(data?.processStatus) : 0);
      if (permissions?.repairJob?.isUpdate && openEdit === "true") {
        setOpenUpdateDialog(true)
        const params = new URLSearchParams()
        params.delete("openEdit")
        history.push({ search: params.toString() })
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
    axiosInstance().put(`${repairJob.api}/${id}/process-status`, { processStatus: processStatus }).then(({ data }) => { })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const updateJobStatus = (status) => {
    axiosInstance()
      .patch(`${repairJob.api}/${id}/status`, { status: status })
      .then(({ data: { data } }) => {
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const repairedAssetStatus = (assets) => {
    axiosInstance().put(`${repairJob.api}/${id}/assets/repaired`, { assets: assets, repaired: true }).then(({ data }) => {
      fetchRepairJobData()
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    })
  };

  return (
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={[routes.repairJob, { title: repairJobData?.repairJobName }]} />
      </Grid>
      <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`}>
        <div>
          <div>
            <Paper style={{ height: "650px" }}>
              {repairJobData ? (
                <DetailsPageHeader heading={repairJobData?.repairJobName} mainPoints={null} showHeading={true}>
                  {permissions?.repairJob?.isUpdate && repairJobData?.status !== REPAIR_JOB_STATUS.completed && (
                    <Button variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                      Edit
                    </Button>
                  )}
                  {/* {permissions?.repairJob?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />} */}
                </DetailsPageHeader>
              ) : (
                <Skeleton variant="text" width="150px" height="40px" />
              )}
              <Tabs
                className="quote-tab"
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
                  style={{
                    background: tabValue === 1 ? 'white' : '',
                    color: tabValue === 1 ? '#163340' : '#163340'
                  }}
                  label={
                    <div className="d-flex align-items-center tab-font">
                      <FaWpforms className="mr-1" fontSize="inherit" /> Header
                    </div>
                  }
                  {...a11yProps(0)}
                />
                <Tab
                  className={'tabLayout'}
                  style={{
                    background: tabValue === 2 ? 'white' : '',
                    color: tabValue === 2 ? '#163340' : '#163340'
                  }}
                  label={
                    <div className="d-flex align-items-center tab-font">
                      <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                    </div>
                  }
                  {...a11yProps(1)}
                />
                <Tab
                  className={'tabLayout'}
                  style={{
                    background: tabValue === 3 ? 'white' : '',
                    color: tabValue === 3 ? '#163340' : '#163340'
                  }}
                  label={
                    <div className="d-flex align-items-center tab-font">
                      <GiAbstract055 className="mr-1" fontSize="inherit" /> Delivery Tickets
                    </div>
                  }
                  {...a11yProps(1)}
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
                    />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={12} md={12} lg={12}>
                        {(currentStep === 0) && (
                          <AddSerializedAsset
                            repairJobData={repairJobData}
                            setNextStep={setNextStep}
                            updateJobStatus={updateJobStatus}
                            repairedAssetStatus={repairedAssetStatus}
                            renderedFrom={`${renderedFrom}_grid-1`}
                          />
                        )}
                        {(currentStep === 1) && (
                          <SerializedAsset
                            repairJobData={repairJobData}
                            fetchRepairJobData={fetchRepairJobData}
                            repairedAssetStatus={repairedAssetStatus}
                            renderedFrom={`${renderedFrom}_grid-2`}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </TabPanel>
              <TabPanel value={tabValue} index={2}>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                  {repairJobData &&
                    <Tickets
                      repairJobData={repairJobData}
                      renderedFrom={`${renderedFrom}_grid-3`}
                    />
                  }
                </Grid>
              </TabPanel>
            </Paper>
          </div>
          <Box my={1} />
        </div>
        <div className="position-relative">
          <HideWhenOffline>
            <Paper>
              {!isSmallScreen && (
                <span className={`${showActivity ? 'activityHide' : 'activityShow'} cursor-pointer`} onClick={handleActivityHideShow}>
                  {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
                </span>
              )}
              <div style={{ display: showActivity ? 'block' : 'none' }}>
                <Grid container>
                  <Grid item xs={12}>
                    {repairJobData && (
                      <div>
                        <Activity
                          resourceId={repairJobData._id}
                          resource={repairJobData.repairJobResource}
                          restrictedAddActivities={
                            permissions && permissions['repairJob'] && permissions['repairJob'].isUpdate
                              ? []
                              : ['Attachment', 'Case']
                          }
                          relatedTo={[
                            {
                              type: 'repairJob',
                              referenceId: repairJobData._id,
                              access: true
                            }
                          ]}
                          handleActivityRefresh={() => { }}
                          emails={[]}
                        />
                      </div>
                    )}
                  </Grid>
                </Grid>
              </div>
            </Paper>
          </HideWhenOffline>
        </div>
      </div>
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
    </>
  );
};

export default RepairJobDetails;
