import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs, useMediaQuery } from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { sublease, SUBLEASE_STATUS, subleaseSteps, ACTIVITY_RESOURCE } from '../../constants/helpers';
import ManageSublease from './ManageSublease';
import Steps from '../RentalManagement/Steps';
import { FaWpforms } from 'react-icons/fa';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import TabPanel from '../../components/TabPanel';
import queryString from 'query-string';
import { isMobile, isTablet } from 'react-device-detect';
import Productpackage from './Productpackage';
import SerializedAsset from './SerializedAsset';
import Tickets from './Tickets';
import { GiAbstract055 } from 'react-icons/gi';
import { camelCase } from 'lodash';
import ContentFullScreen from 'src/components/ContentFullScreen';
import ActivityButton from 'src/components/Activity/ActivityButton';
import Steps2, { getIndex } from 'src/components/Steps';

const SubleaseDetailsPage = () => {
  const renderedFrom = camelCase(routes?.sublease.title);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const {
    state: { user, permissions }
  }: any = useData();

  const [subleaseData, setSubleaseData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [isProcessor, setIsProcessor] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [nextStep, setNextStep] = useState(true);

  const [tabValue, setTabValue] = useState(Number(parsed?.tab || 0));
  const [isIssued, setIsIssued] = useState(false);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const subleaseStepsNames = React.useMemo(() => {
    return subleaseSteps.map((item) => item.name);
  }, [subleaseSteps]);

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.replace(`?tab=${newValue}`);
  };

  useEffect(() => {
    if (currentStep >= 0 && currentStep <= 2) {
      updateProcessStatus(subleaseStepsNames[currentStep]);
    }
  }, [currentStep]);

  const updateProcessStatus = (processStatus) => {
    axiosInstance()
      .put(`${sublease.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => {})
      .catch((error) => {});
  };

  useEffect(() => {
    if (parsed) {
      history.replace(`?tab=${tabValue}`);
    }
  }, []);

  useEffect(() => {
    getFields();
    fetchData();
  }, [id]);

  const getFields = () => {
    axiosInstance()
      .get('/field?resource=Sublease')
      .then(({ data }) => {
        setFields(data.data);
        if (data.data && data.data.length) {
          data.data.some((o) => {
            if (o?.fieldData?.fieldName === 'status') {
              setStatusOptions([...o.fieldData.option]);
              return true;
            }
          });
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${sublease.api}/${id}`);
      setCurrentStep(getIndex(data?.processStatus, subleaseSteps));
      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      const isProcessorToEdit = [data.processor].some((d) => d?.optionValue === user?.user?._id);
      if (data?.productInventory?.length) {
        setIsIssued(true);
      }
      setAllowedToEdit(isAllowedToEdit);
      setIsProcessor(isProcessorToEdit);
      setSubleaseData(data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${sublease.api}/remove`, { ids: [] })
      .then(() => {
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.sublease, { title: subleaseData?.subleaseName }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.sublease?.isUpdate && subleaseData?.status !== SUBLEASE_STATUS.completed && allowedToEdit && (
              <>
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} onClick={() => setOpenUpdateDialog(true)} className={'btn-outline-v1'}>
                  {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                </Button>
              </>
            )}
            <ActivityButton referenceId={subleaseData?._id} resource={ACTIVITY_RESOURCE.sublease} />
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
                <GiAbstract055 className="mr-1" fontSize="inherit" />
                {routes.deliveryTicket.title}
              </div>
            }
            {...a11yProps(1)}
          />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {subleaseData && fields.length ? (
              <DetailsPage data={subleaseData} fields={fields} />
            ) : (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            )}
          </Box>
          <Grid container spacing={2}></Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            {subleaseData ? (
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <Steps2
                  isNextStep={false}
                  nextStep={nextStep}
                  steps={subleaseSteps}
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  isStepEnded={[SUBLEASE_STATUS.completed].includes(subleaseData?.status)}
                  setStepFullScreen={() => setStepFullScreen(true)}
                />
                <ContentFullScreen title={subleaseStepsNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                  {currentStep === 0 && subleaseData && (
                    <Productpackage
                      subleaseData={subleaseData}
                      setNextStep={setNextStep}
                      fetchData={fetchData}
                      isIssued={isIssued}
                      renderedFrom={`${renderedFrom}_grid-1`}
                      allowedToEdit={allowedToEdit}
                      stepFullScreen={stepFullScreen}
                    />
                  )}
                  {(currentStep === 1 || currentStep === 2) && subleaseData && (
                    <SerializedAsset
                      fetchData={fetchData}
                      subleaseData={subleaseData}
                      setNextStep={setNextStep}
                      currentStep={currentStep}
                      renderedFrom={`${renderedFrom}_grid-2`}
                      allowedToEdit={allowedToEdit}
                      isProcessor={isProcessor}
                    />
                  )}
                </ContentFullScreen>
              </Grid>
            ) : (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            )}
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            {subleaseData ? (
              <Tickets subleaseId={id} renderedFrom={`${renderedFrom}_grid-3`} />
            ) : (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.sublease?.title} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageSublease
          isClone={false}
          subleaseId={id}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default SubleaseDetailsPage;
