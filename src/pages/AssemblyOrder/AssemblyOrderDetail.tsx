import { Box, Button, Grid } from '@material-ui/core';
import { camelCase } from 'lodash';
import { useContext, useEffect, useMemo, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useParams, useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { useData } from 'src/StateProvider/Provider';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import axiosInstance from 'src/axios/axiosInstance';
import { ACTIVITY_RESOURCE, assemblyOrderSteps, checkIsAllowedToDelete, checkIsAllowedToEdit, sidebarResource } from 'src/constants/helpers';
import Steps, { getIndex } from 'src/components/Steps';
import { isMobile, isTablet } from 'react-device-detect';
import { Edit } from '@material-ui/icons';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { Skeleton } from '@material-ui/lab';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import DetailsPage from 'src/components/Shared/DetailsPage';
import Step from 'src/pages/DynamicForm/Step';
import ManageAssemblyOrder from 'src/pages/AssemblyOrder/ManageAssemblyOrder';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import ContentFullScreen from 'src/components/ContentFullScreen';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import Material from 'src/pages/AssemblyOrder/Material';
import WorkOrder from 'src/pages/AssemblyOrder/WorkOrder';
import PackageNumberDialog from 'src/pages/AssemblyOrder/WorkOrder/PackageNumberDialog';

const AssemblyOrderDetail = () => {
  const renderedFrom = camelCase(routes?.assemblyOrder.title);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();

  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const {
    state: { user, permissions }
  }: any = useData();

  const [assemblyOrderData, setAssemblyOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [allFields, setAllFields] = useState([]);
  const [nextStep, setNextStep] = useState(true);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [locationKeys, setLocationKeys] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [resourceData, setResourceData] = useState(null);
  const [openManagedPackageDialog, setOpenManagedPackageDialog] = useState(false);

  const { isOffline } = useContext(CustomOfflineContext);

  const assemblyOrderProcessStepsNames = useMemo(() => {
    return assemblyOrderSteps.map((item) => item.name);
  }, [assemblyOrderSteps]);

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

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.assemblyOrder}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
      fetchPolicy();
    }
  }, [id]);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.assemblyOrder}`)
      .then(({ data: { data } }) => {
        setAllFields(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = () => {
    axiosInstance()
      .get(`${routes.assemblyOrder.path}/${id}`)
      .then(({ data: { data } }) => {
        setCurrentStep(getIndex(data?.processStatus, assemblyOrderSteps));

        setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.assemblyOrder, data));
        setAllowedToDelete(
          permissions?.assemblyOrder?.isDelete &&
          checkIsAllowedToDelete(user, sidebarResource.assemblyOrder, data.owner.optionValue) &&
          data?.canDelete
        );
        setAssemblyOrderData({ ...data });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${routes.assemblyOrder.path}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(routes.assemblyOrder.path);
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
      fetchData();
    }
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.assemblyOrder, { title: assemblyOrderData?.assemblyOrderNumber }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {assemblyOrderData ? (
              <>
                {permissions?.assemblyOrder?.isUpdate && allowedToEdit && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    className={'btn-outline-v1'}
                    size="small"
                    onClick={() => setOpenUpdateDialog(true)}
                  >
                    {isMobile && !isTablet ? <Edit /> : 'Edit'}
                  </Button>
                )}
                {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton
              referenceId={assemblyOrderData?._id}
              resource={ACTIVITY_RESOURCE.assemblyOrder}
              resourceLabel={assemblyOrderData?.assemblyOrderNumber}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 2}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {assemblyOrderData && allFields.length ? (
              <DetailsPage data={assemblyOrderData} fields={allFields} />
            ) : (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Steps
            isNextStep={false}
            nextStep={nextStep}
            steps={assemblyOrderSteps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={false}
            setStepFullScreen={() => setStepFullScreen(true)}
            handleNext={
              assemblyOrderProcessStepsNames[currentStep] === 'Work Order'
                ? () => {
                  setOpenManagedPackageDialog(true);
                }
                : null
            }
            updateStatus={(step: number) => {
              dynamicFormUpdateProcessStatus(sidebarResource.assemblyOrder, assemblyOrderProcessStepsNames[step], id);
            }}
          />
          <ContentFullScreen title={assemblyOrderProcessStepsNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            {assemblyOrderProcessStepsNames[currentStep] === 'Add' && assemblyOrderData && (
              <Material
                assemblyOrderData={assemblyOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-1`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
              />
            )}
            {assemblyOrderProcessStepsNames[currentStep] === 'Work Order' && assemblyOrderData && (
              <WorkOrder
                renderedFrom={`${renderedFrom}_grid-2`}
                assemblyOrderData={assemblyOrderData}
                setNextStep={setNextStep}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
                setCurrentStep={setCurrentStep}
              />
            )}
            {assemblyOrderProcessStepsNames[currentStep] === 'Final Slip' && assemblyOrderData && <></>}
          </ContentFullScreen>
        </TabPanel>
        {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => {
          return (
            <TabPanel value={tabValue} index={i + 2}>
              <Step
                tab={tab}
                resourcePolicyId={resourceData?._id}
                resourceId={id}
                resource={sidebarResource.assemblyOrder}
                data={assemblyOrderData}
                allowedToEdit={permissions?.assemblyOrder?.isUpdate}
              />
            </TabPanel>
          );
        })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this assembly order: ${assemblyOrderData?.assemblyOrderNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}

      {openUpdateDialog && (
        <ManageAssemblyOrder
          isClone={false}
          assemblyOrderId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
      {openManagedPackageDialog && (
        <PackageNumberDialog
          onClose={() => {
            setOpenManagedPackageDialog(false);
          }}
          assemblyOrderId={id}
          onSuccess={() => {
            setOpenManagedPackageDialog(false);
            setCurrentStep((prevStep) => {
              const newStep = prevStep + 1;
              return newStep;
            });
          }}
        />
      )}
    </Box>
  );
};

export default AssemblyOrderDetail;
