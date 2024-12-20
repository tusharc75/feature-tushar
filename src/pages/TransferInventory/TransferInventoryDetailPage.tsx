import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityButton from 'src/components/Activity/ActivityButton';
import ButtonWithPulse from 'src/components/ButtonWithPulse';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import routes from 'src/components/Helpers/Routes';
import DetailsPage from 'src/components/Shared/DetailsPage';
import Steps, { getIndex } from 'src/components/Steps';
import {
  ACTIVITY_RESOURCE,
  TRANSFER_INVENTORY_STATUS,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  sidebarResource,
  transferInventory,
  transferInventorySteps
} from 'src/constants/helpers';
import ContentFullScreen from '../../components/ContentFullScreen';
import LoadingTicket from './LoadingTicket';
import ManageTransferInventory from './ManageTransferInventory';
import Products from './Products';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import Step from '../DynamicForm/Step';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';
import {
  generateAddExistingProduct,
  generateCompleteButtonStep,
  generateLoadingStepCreateLoadingTicket,
  generateLoadingStepReceive,
  nextButtonStep
} from 'src/pages/TransferInventory/walkmeSteps';
import { DeleteButton } from 'src/components/Helpers/Buttons';

const TransferInventoryDetailPage = () => {
  const walkmeInstance = useGetWalkmeInstance();
  const renderedFrom = camelCase(sidebarResource.transferInventory);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const parsedTab = tab !== undefined ? parseInt(tab) : 1;
  const {
    state: { permissions, user, resources }
  }: any = useData();
  const [resourceData, setResourceData] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);
  const [tabValue, setTabValue] = useState(parsedTab);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setDeleting] = useState(false);
  const [transferInventoryData, setTransferInventoryData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [transferInventoryFields, setTransferInventoryFields] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [locationKeys, setLocationKeys] = useState([]);
  const [nextStep, setNextStep] = useState(false);
  const [nextStepToolTip, setNextStepToolTip] = useState(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const [stepNames, setStepNames] = useState(transferInventorySteps?.map((item) => item.name));

  const [canReceive, setCanReceive] = useState(false);
  const [canLoad, setCanLoad] = useState(false);

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
      fetchTransferInventoryData();
      fetchPolicy();
    }
  }, [id]);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (walkmeInstance && walkmeInstance.type === 'flow') {
      walkmeInstance.instance.insertAtCurrentIndex([
        ...generateAddExistingProduct(false, resources?.transferInventory?.titleSingular).steps,
        nextButtonStep(false),
        ...generateLoadingStepCreateLoadingTicket(0, resources?.transferInventory?.titleSingular).steps,
        ...generateLoadingStepReceive(0, resources?.transferInventory?.titleSingular).steps,
        ...generateCompleteButtonStep().steps
      ]);
      walkmeInstance.handleNext();
    }
  }, [walkmeInstance]);

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.transferInventory}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchFields = () => {
    axiosInstance()
      .get('/field?resource=Transfer Inventory')
      .then(({ data: { data } }) => {
        setTransferInventoryFields(data);
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };

  const fetchTransferInventoryData = () => {
    axiosInstance()
      .get(`${routes.transferInventory.path}/${id}`)
      .then(({ data: { data } }) => {
        const userEntity = user?.entity?.map((e) => e._id) ?? [];
        if (data?.transferFromPlant?.entity?.length) {
          setCanLoad(data?.transferFromPlant?.entity?.filter((w: any) => userEntity.indexOf(w) > -1)?.length > 0);
        } else {
          setCanLoad(true);
        }

        if (data?.transfertoPlant?.entity?.length) {
          setCanReceive(data?.transfertoPlant?.entity?.filter((w: any) => userEntity.indexOf(w) > -1)?.length > 0);
        } else {
          setCanReceive(true);
        }
        if (data?.status === TRANSFER_INVENTORY_STATUS.delivered) {
          setCurrentStep(transferInventorySteps?.length - 1);
        } else {
          setCurrentStep(getIndex(data?.processStatus, transferInventorySteps));
        }

        setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.transferInventory, data) && permissions?.transferInventory?.isUpdate);
        setAllowedToDelete(
          permissions?.transferInventory?.isDelete &&
            checkIsAllowedToDelete(user, sidebarResource.transferInventory, data.owner.optionValue) &&
            data?.canEdit
        );
        setTransferInventoryData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    setDeleting(true);
    axiosInstance()
      .put(`${transferInventory.api}/remove`, { ids: [id] })
      .then(() => {
        setDeleting(false);
        setShowConfirmBox(false);
        history.push(`${routes.transferInventory.path}`);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleMainTabChange = (_, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  const updateStatus = (status: string) => {
    axiosInstance()
      .put(`${routes.transferInventory.path}/${id}/status`, { status })
      .then(() => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status updated ${status} Successfully`
        });
        fetchTransferInventoryData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs
            routes={[
              { ...routes.transferInventory, title: resources?.transferInventory?.titlePlural },
              { title: transferInventoryData?.transferNumber }
            ]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {allowedToEdit &&
              ![TRANSFER_INVENTORY_STATUS.delivered].includes(transferInventoryData?.status) &&
              transferInventoryData?.canComplete && (
                <Fragment>
                  <ButtonWithPulse
                    variant={'outlined'}
                    color="default"
                    size="small"
                    id={`transfer-inventory-complete-button`}
                    onClick={() => updateStatus(TRANSFER_INVENTORY_STATUS.delivered)}
                    className={'btn-outline-v1'}
                  >
                    Complete
                  </ButtonWithPulse>
                </Fragment>
              )}
            {allowedToEdit && transferInventoryData?.status !== TRANSFER_INVENTORY_STATUS.delivered && (
              <Button
                className={'btn-outline-v1'}
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                size="small"
                onClick={handleOpenUpdateDialog}
              >
                {isMobile && !isTablet ? <Edit /> : 'Edit'}
              </Button>
            )}
            {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            <ActivityButton
              referenceId={transferInventoryData?._id}
              resource={ACTIVITY_RESOURCE.transferInventory}
              resourceLabel={transferInventoryData?.transferNumber}
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
            {loading || !transferInventoryData ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={transferInventoryData} fields={transferInventoryFields} />
            )}
          </Box>
        </TabPanel>
        <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
          <TabPanel value={tabValue} index={1}>
            {transferInventoryData && (
              <Box>
                <Steps
                  steps={transferInventorySteps}
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  isNextStep={false}
                  nextStep={nextStep}
                  nextStepToolTip={nextStepToolTip}
                  updateStatus={(step: number) => {
                    dynamicFormUpdateProcessStatus(sidebarResource.transferInventory, stepNames[step], id);
                  }}
                  isStepEnded={transferInventoryData?.status === TRANSFER_INVENTORY_STATUS.delivered}
                  stepFullScreen={stepFullScreen}
                  setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
                />
                {stepNames[currentStep] === 'Add Products' && (
                  <Products
                    transferInventoryData={transferInventoryData}
                    setNextStep={setNextStep}
                    setNextStepToolTip={setNextStepToolTip}
                    renderedFrom={`${renderedFrom}_grid-1`}
                    allowedToEdit={allowedToEdit}
                    updateStatus={updateStatus}
                    fetchTransferInventoryData={fetchTransferInventoryData}
                    stepFullScreen={stepFullScreen}
                  />
                )}
                {stepNames[currentStep] === 'Loading Ticket' && (
                  <LoadingTicket
                    transferInventoryData={transferInventoryData}
                    fetchTransferInventoryData={fetchTransferInventoryData}
                    renderedFrom={`${renderedFrom}_grid-3`}
                    allowedToEdit={allowedToEdit}
                    canLoad={canLoad}
                    canReceive={canReceive}
                    stepFullScreen={stepFullScreen}
                  />
                )}
              </Box>
            )}
          </TabPanel>
        </ContentFullScreen>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 2}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.transferInventory}
                  data={transferInventoryData}
                  allowedToEdit={permissions?.transferInventory?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isDeleting}
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${resources?.transferInventory?.titleSingular?.toLowerCase()}: ${transferInventoryData?.transferNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageTransferInventory
          isClone={false}
          transferInventoryId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchTransferInventoryData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </Box>
  );
};

export default TransferInventoryDetailPage;
