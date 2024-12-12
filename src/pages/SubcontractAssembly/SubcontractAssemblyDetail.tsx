import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityButton from 'src/components/Activity/ActivityButton';
import ButtonWithPulse from 'src/components/ButtonWithPulse';
import ContentFullScreen from 'src/components/ContentFullScreen';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import Steps, { getIndex } from 'src/components/Steps';
import {
  ACTIVITY_RESOURCE,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  sidebarResource,
  SUBCONTRACT_ASSEMBLY_STATUS,
  subcontractAssemblySteps
} from 'src/constants/helpers';
import LoadingTicket from 'src/pages/SubcontractAssembly/LoadingTicket';
import ManageSubcontractAssembly from 'src/pages/SubcontractAssembly/ManageSubcontractAssembly';
import Material from 'src/pages/SubcontractAssembly/Material';
import Receiving from 'src/pages/SubcontractAssembly/Receiving';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import SubcontractAssemblyView from './View';
import queryString from 'query-string';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import { addStepAddExistingProduct } from 'src/pages/SubcontractAssembly/walkmeSteps';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import Step from '../DynamicForm/Step'

const SubcontractAssemblyDetail = () => {
  const { setWalkmeData } = useSetWalkmeData();
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { itemTab }: any = parsed;
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user,resources }
  }: any = useData();
  const [resourceData, setResourceData] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);

  const [subcontractAssemblyData, setSubcontractAssemblyData] = useState(null);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [tabValue, setTabValue] = useState(itemTab ? parseInt(itemTab) : 0);
  const [currentStep, setCurrentStep] = useState(0);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [nextStep, setNextStep] = useState(false);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [showClosedConfirmBox, setShowClosedConfirmBox] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
      fetchPolicy();
    }
  }, [id]);

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.subcontractAssembly}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchFields = async () => {
    try {
      let data;
      const response = await axiosInstance().get(`/field?resource=${sidebarResource?.subcontractAssembly}`);
      data = response?.data?.data;
      setFields(data?.filter((field) => field.isRead));
    } catch (err) {
      toastConfig.setToastConfig(err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.subcontractAssembly.path}/${id}`);

      setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.subcontractAssembly, data));
      setAllowedToDelete(
        permissions?.subcontractAssembly?.isDelete &&
        checkIsAllowedToDelete(user, sidebarResource.subcontractAssembly, data.owner.optionValue) &&
        data?.canDelete
      );
      setSubcontractAssemblyData(data);
      if (data?.status === SUBCONTRACT_ASSEMBLY_STATUS.closed) {
        setCurrentStep(subcontractAssemblySteps?.length - 1);
      } else {
        setCurrentStep(getIndex(data?.processStatus, subcontractAssemblySteps));
      }

      setLoading(false);
      if (data.processStatus === 'Add' && checkIsAllowedToEdit(user, sidebarResource.subcontractAssembly, data)) {
        setWalkmeData([addStepAddExistingProduct]);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    history.push(`?itemTab=${newValue}`);
    if (newValue === 0) {
      setWalkmeData([addStepAddExistingProduct]);
    }
    setTabValue(newValue);
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.subcontractAssembly?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.subcontractAssembly.path}`);
        })
        .catch((err) => {
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  const handleChangeStatus = async (status) => {
    await axiosInstance()
      .patch(`${routes.subcontractAssembly.path}/status/${subcontractAssemblyData._id}`, { status })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{...routes.subcontractAssembly, title:resources?.subcontractAssembly?.titleSingular}, { title: subcontractAssemblyData?.subcontractAssemblyNumber }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {subcontractAssemblyData ? (
              <>
                {permissions?.subcontractAssembly?.isUpdate &&
                  allowedToEdit &&
                  [SUBCONTRACT_ASSEMBLY_STATUS.inProgress].includes(subcontractAssemblyData?.status) &&
                  subcontractAssemblyData?.material?.length > 0 && subcontractAssemblyData?.material?.filter((m) => !m?.parentId)?.every((d) => d?.receivedQty > 0) && (
                    <ButtonWithPulse
                      variant={'outlined'}
                      color="default"
                      size="small"
                      onClick={() => {
                        setShowClosedConfirmBox(true);
                      }}
                      className={'btn-outline-v1'}
                    >
                      Close
                    </ButtonWithPulse>
                  )}
                {permissions?.subcontractAssembly?.isUpdate &&
                  allowedToEdit &&
                  ![SUBCONTRACT_ASSEMBLY_STATUS.closed].includes(subcontractAssemblyData?.status) && (
                    <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                      {isMobile && !isTablet ? <Edit /> : 'Edit'}
                    </Button>
                  )}
                {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton
              referenceId={subcontractAssemblyData?._id}
              resource={ACTIVITY_RESOURCE.subcontractAssembly}
              resourceLabel={subcontractAssemblyData?.subcontractAssemblyNumber}
            />
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          {!(isMobile && !isTablet) && (
            <CustomTab value={2}>
              Views
            </CustomTab>
          )}
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 3}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          {loading || !fields?.length ? (
            <Grid container spacing={2} style={{ padding: '8px' }}>
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            </Grid>
          ) : (
            <DetailsPage data={subcontractAssemblyData} fields={fields} />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Steps
            isNextStep={false}
            nextStep={nextStep}
            steps={subcontractAssemblySteps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={[SUBCONTRACT_ASSEMBLY_STATUS.closed].includes(subcontractAssemblyData?.status)}
            setStepFullScreen={() => setStepFullScreen(true)}
            updateStatus={(step: number) => {
              dynamicFormUpdateProcessStatus(sidebarResource.subcontractAssembly, subcontractAssemblySteps[step]?.name, id);
            }}
          />
          <ContentFullScreen title={subcontractAssemblySteps[currentStep]?.title} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            {currentStep === 0 && subcontractAssemblyData && (
              <Material
                subcontractAssemblyData={subcontractAssemblyData}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
                setNextStep={setNextStep}
                handleChangeStatus={handleChangeStatus}
                fetchParentData={fetchData}
              />
            )}
            {currentStep === 1 && subcontractAssemblyData && (
              <LoadingTicket
                subcontractAssemblyData={subcontractAssemblyData}
                setNextStep={setNextStep}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
              />
            )}
            {currentStep === 2 && subcontractAssemblyData && (
              <Receiving
                subcontractAssemblyData={subcontractAssemblyData}
                stepFullScreen={stepFullScreen}
                fetchParentData={fetchData}
                allowedToEdit={allowedToEdit}
              />
            )}
          </ContentFullScreen>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {subcontractAssemblyData && <SubcontractAssemblyView subcontractAssemblyData={subcontractAssemblyData} />}
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 3}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.subcontractAssembly}
                  data={subcontractAssemblyData}
                  allowedToEdit={permissions?.subcontractAssembly?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${subcontractAssemblyData['subcontractAssemblyNumber']}  ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageSubcontractAssembly
          id={id}
          isClone={false}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
        />
      )}

      {showClosedConfirmBox && (
        <ConfirmationDialog
          open={showClosedConfirmBox}
          message={`Are you sure you want to close ?`}
          onClose={() => {
            setShowClosedConfirmBox(false);
          }}
          onOk={() => {
            handleChangeStatus(SUBCONTRACT_ASSEMBLY_STATUS.closed);
            setShowClosedConfirmBox(false);
          }}
        />
      )}
    </Box>
  );
};

export default SubcontractAssemblyDetail;
