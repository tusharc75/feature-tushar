import { Box, Button, Grid, Tab, Tabs } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { isMobile, isTablet } from 'react-device-detect';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import { useData } from 'src/StateProvider/Provider';
import { useParams, useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { assetsReceivingSteps, sidebarResource } from 'src/constants/helpers';
import ManageAssetsReceiving from './ManageAssetsReceiving';
import TabPanel from 'src/components/TabPanel';
import { FaWpforms } from 'react-icons/fa';
import Steps, { getIndex } from 'src/components/Steps';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Material from './Material';
import { camelCase } from 'lodash';
import ReceivingTicket from './ReceivingTicket';

const AssetsReceivingDetail = () => {
  const renderedFrom = camelCase(routes?.assetsReceiving.title);
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [tabValue, setTabValue] = useState(0);
  const [nextStep, setNextStep] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.assetsReceiving]);
  const [assetsReceivingData, setAssetsReceivingData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [stepList, setStepList] = useState(assetsReceivingSteps);
  const [stepNames, setStepNames] = useState(assetsReceivingSteps.map((item) => item.name));
  const [currentStep, setCurrentStep] = useState(null);
  const {
    state: { permissions, user }
  }: any = useData();

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
    if (newValue === 0) {
      fetchData();
    }
  };

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.assetsReceiving}`)
      .then(({ data }) => {
        setFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const updateProcessStatus = (processStatus) => {
    axiosInstance()
      .put(`${routes.assetsReceiving.path}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => {})
      .catch((error) => {});
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.assetsReceiving.path}/${id}`);
      var isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      if (user?.role?.selectedEntity?.superAdminAccess) {
        isAllowedToEdit = true;
      }
      setAllowedToEdit(isAllowedToEdit);
      var steps: any = JSON.parse(JSON.stringify(assetsReceivingSteps));
      setStepList(steps);
      setStepNames(steps.map((item) => item.name));
      setCurrentStep(getIndex(data?.processStatus, steps));
      setAllowedToDelete(data?.owner?.optionValue === user?.user?._id);
      setAssetsReceivingData(data);
      setCustomizedRoutes([routes.assetsReceiving, { title: data?.assetsReceivingNumber }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.assetsReceiving?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.goBack();
        })
        .catch((err) => {
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };
  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= 7) {
      updateProcessStatus(assetsReceivingSteps[currentStep]?.name);
    }
  }, [currentStep]);

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.assetsReceiving?.isUpdate && allowedToEdit && (
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                  {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                </Button>
              )}
              {permissions?.assetsReceiving?.isDelete && allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            </>
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
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
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !fields?.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={assetsReceivingData} fields={fields} />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Steps
            isNextStep={false}
            nextStep={nextStep}
            steps={stepList}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={false}
            setStepFullScreen={() => setStepFullScreen(true)}
            handlePrev={() => {
              setCurrentStep((prevStep) => {
                const newStep = prevStep - 1;
                return newStep;
              });
            }}
          />
          <ContentFullScreen title={stepNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            {stepNames[currentStep] === 'Add Assets' && assetsReceivingData && (
              <Material
                fetchAssetsReceivingData={fetchData}
                assetsReceivingData={assetsReceivingData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}grid_1`}
                stepFullScreen={setStepFullScreen}
                allowedToDelete={allowedToDelete}
                allowedToEdit={allowedToEdit}
              />
            )}
            {stepNames[currentStep] === 'Receiving Ticket' && assetsReceivingData && (
              <ReceivingTicket
                fetchAssetsReceivingData={fetchData}
                assetsReceivingData={assetsReceivingData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}grid_2`}
                stepFullScreen={setStepFullScreen}
                allowedToDelete={true}
                allowedToEdit={allowedToEdit}
              />
            )}
          </ContentFullScreen>
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes?.assetsReceiving?.title?.toLowerCase()} ${assetsReceivingData.assetsReceivingNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageAssetsReceiving
          id={id}
          isClone={false}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default AssetsReceivingDetail;
