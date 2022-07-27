import { useState, useEffect, useContext } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs, useMediaQuery, Typography, IconButton } from '@material-ui/core';
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
import {
  repairJob,
  sidebarResource,
  repairJobProcessSteps,
  REPAIR_JOB_STATUS,
  ACTIVITY_RESOURCE,
  serializedAsset,
  leadTimeMaster
} from 'src/constants/helpers';
import Activity from 'src/components/Activity';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import ManageLeadTimeMaster from './ManageLeadTimeMaster';
import queryString from 'query-string';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import TabPanel from 'src/components/TabPanel';
import HideWhenOffline from 'src/components/HideWhenOffline';
import { defaultActivityShow } from 'src/constants/helpers';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import Steps from '../RentalManagement/Steps';
import { GiAbstract055 } from 'react-icons/gi';
import { camelCase } from 'lodash';
import { RiFlowChart } from 'react-icons/ri';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { isMobile, isTablet } from 'react-device-detect';
import accountClass from '../Account/account.module.scss';
import { InfoOutlined } from '@material-ui/icons';

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`
  };
}

const LeadTimeMasterDetails = () => {
  const renderedFrom = camelCase(routes?.leadTimeMasterDetail.title);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();

  const parsed = queryString.parse(history.location.search);
  const { openEdit, tab }: any = parsed;
  const {
    state: { user, permissions }
  }: any = useData();

  const [leadTimeMasterData, setLeadTimeMasterData] = useState(null);

  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [lTMFields, setLTMFields] = useState([]);

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
      fetchLeadTimeMasterData();
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
      .get(`/field?resource=${sidebarResource.leadTimeMaster}`)
      .then(({ data: { data } }) => {
        setLTMFields(data);
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

  const fetchLeadTimeMasterData = () => {
    axiosInstance()
      .get(`${leadTimeMaster.api}/${id}`)
      .then(({ data: { data } }) => {
        setLeadTimeMasterData({ ...data });
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
      .put(`${leadTimeMaster.api}/remove`, { ids: [id] })
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
      fetchLeadTimeMasterData();
    }
  };

  const updateProcessStatus = (processStatus) => {
    axiosInstance()
      .put(`${repairJob.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => {})
      .catch((error) => {});
  };

  useEffect(() => {
    if (isSmallScreen && tabValue === 0) {
      setActivityShow(true);
    } else {
      setActivityShow(false);
    }
  }, [isSmallScreen, tabValue]);

  return (
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={[routes.leadTimeMaster, { title: leadTimeMasterData?.leadTimeName }]} />
      </Grid>
      <Grid container spacing={1} className="detail-container">
        <Grid item xs={12} sm={12} md={8}>
          <div>
            <Paper>
              {leadTimeMasterData ? (
                <DetailsPageHeader heading={leadTimeMasterData?.leadTimeName} mainPoints={null} showHeading={true}>
                  {permissions?.leadTimeMaster?.isUpdate && leadTimeMasterData?.status !== REPAIR_JOB_STATUS.completed && (
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      color="primary"
                      size="small"
                      onClick={handleOpenUpdateDialog}
                      className={isMobile && !isTablet ? accountClass.mobile_button_layout : ''}
                      style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                    >
                      {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                    </Button>
                  )}
                  {permissions?.leadTimeMaster?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
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
                <div className={'uio'}> </div>
              </Tabs>
              <TabPanel value={tabValue} index={0}>
                <Box>
                  {leadTimeMasterData && lTMFields.length ? (
                    <DetailsPage data={leadTimeMasterData} fields={lTMFields} />
                  ) : (
                    <Grid container spacing={2} style={{ padding: '8px' }}>
                      <CommonSkeleton lenArray={[...Array(7).keys()]} />
                    </Grid>
                  )}
                </Box>
              </TabPanel>
            </Paper>
          </div>
          <Box my={1} />
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
          <Paper style={{ overflow: 'hidden' }}>
            <Box padding={1} bgcolor="grey.200" display="flex" justifyContent="space-between" alignItems="center">
              <Box display={'flex'}>
                <Box>
                  <Typography variant="subtitle2">Items Detail</Typography>
                </Box>
              </Box>
            </Box>
            <Box>sdfsf</Box>
          </Paper>
        </Grid>
      </Grid>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this Lead TimeMaster: ${leadTimeMasterData?.leadTimeName} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageLeadTimeMaster
          isClone={false}
          leadTimeMasterId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchLeadTimeMasterData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </>
  );
};

export default LeadTimeMasterDetails;
