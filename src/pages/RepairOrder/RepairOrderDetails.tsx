import { Box, Button, Grid } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Skeleton } from '@mui/material';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import React, { useContext, useEffect, useState } from 'react';
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
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import routes from 'src/components/Helpers/Routes';
import DetailsPage from 'src/components/Shared/DetailsPage';
import Steps from 'src/components/Steps';
import {
  ACTIVITY_RESOURCE,
  ASSET_STATUS,
  MATERIAL_TYPE,
  QUOTATION_STATUS,
  REPAIR_ORDER_STATUS,
  REPAIR_ORDER_TYPE,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  repairOrder,
  repairOrderSteps,
  sidebarResource,
  transferAsset
} from 'src/constants/helpers';
import LoadingTicket from './LoadingTicket';
import ManageRepairOrder from './ManageRepairOrder';
import Productpackage from './Productpackage';
import Quotation from './Quotation';
import View from './View';
import WorkOrder from './WorkOrder';
import Step from '../DynamicForm/Step';
import ManageTransferAsset from '../TransferAssets/ManageTransferAsset';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import { generateAddExistingSerializedAsset } from 'src/pages/RepairOrder/walkmeSteps';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';

const dataAdded = {
  addExistingDataAdded: false
};

const RepairOrderDetails = () => {
  const walkmeInstance = useGetWalkmeInstance();
  const renderedFrom = camelCase(sidebarResource?.repairOrder);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();

  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [hasAssetsAdded, setHasAssetsAdded] = useState(false);
  const [repairOrderData, setRepairOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [repairOrderFields, setRepairOrderFields] = useState([]);
  const [nextStep, setNextStep] = useState(true);
  const [prevStep, setPrevStep] = useState(true);

  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [locationKeys, setLocationKeys] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [quotationVersionData, setQuotationVersionData] = useState(null);
  const [showQuotationConfirmBox, setShowQuotationConfirmBox] = useState(false);
  const [quoteClonning, setQuoteClonning] = useState(false);
  const [isAnyMaterial, setisAnyMaterial] = useState(false);

  const [stepList, setStepList] = useState(repairOrderSteps);
  const [stepNames, setStepNames] = useState(repairOrderSteps.map((item) => item.name));
  const [resourceData, setResourceData] = useState(null);
  const [showTransferAssetDialog, setShowTransferAssetDialog] = useState(false);

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
      fetchRepairOrderData();
      fetchPolicy();
    }
  }, [id]);

  useEffect(() => {
    getResourceFields();

    if (walkmeInstance && walkmeInstance.type === 'flow') {
      if (dataAdded.addExistingDataAdded) return;
      const steps = generateAddExistingSerializedAsset(
        true,
        repairOrderData?.type === REPAIR_ORDER_TYPE.external
          ? `Add Existing Customer Assets`
          : `Add Existing ${resources?.serializedAsset?.titlePlural}`
      ).steps;
      walkmeInstance.instance.push(steps);
      // immediately start next step
      walkmeInstance.handleNext();
      dataAdded.addExistingDataAdded = true;
    }
  }, []);

  useEffect(() => {
    if (['Add Assets', 'Work Order'].includes(stepNames[currentStep])) {
      fetchQuotationData();
    }
  }, [currentStep]);

  const getResourceFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.repairOrder}`)
      .then(({ data: { data } }) => {
        setRepairOrderFields(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.repairOrder}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchRepairOrderData = () => {
    setRepairOrderData(null);
    axiosInstance()
      .get(`${routes?.repairOrder?.path}/${id}`)
      .then(({ data: { data } }) => {
        setisAnyMaterial(data?.canDelete ? false : true);

        setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.repairOrder, data));
        var steps: any = JSON.parse(JSON.stringify(repairOrderSteps));
        if (data?.type === REPAIR_ORDER_TYPE.internal) {
          steps = steps?.filter((e) => !['Loading Ticket']?.includes(e.name));
        }
        if (!user?.user?.brandPolicy?.repairOrderPrice && !data?.addQuotationStep) {
          steps = steps?.filter((e) => !['Quotation', 'Execute']?.includes(e.name));
        }
        if (!data?.addQuotationStep) {
          steps = steps?.map((e) => {
            if (e.name === 'Quotation') {
              e.title = 'Price';
            }
            return e;
          });
        }
        setStepList(steps);
        setStepNames(steps.map((item) => item.name));
        if ([REPAIR_ORDER_STATUS.invoiced, REPAIR_ORDER_STATUS.completed]?.includes(data?.status)) {
          setCurrentStep(steps?.length - 1);
        } else {
          const index = steps?.map((item) => item.name)?.indexOf(data?.processStatus);
          setCurrentStep(index !== -1 ? index : 0);
        }

        setAllowedToDelete(
          permissions?.repairOrder?.isDelete && checkIsAllowedToDelete(user, sidebarResource.repairOrder, data.owner.optionValue) && data?.canDelete
        );
        setRepairOrderData({ ...data });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${repairOrder.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(routes?.repairOrder?.path);
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
      fetchRepairOrderData();
    }
  };

  const fetchQuotationData = (versionNumber = null) => {
    axiosInstance()
      .get(`${repairOrder.api}/${id}/check/quotation`)
      .then(({ data: { data } }) => {
        if (data) {
          let keys = Object.keys(data?.versions);
          let tempCurrentVersion = versionNumber ? versionNumber : parseInt(keys[keys.length - 1]);
          setQuotationVersionData({ quotationId: data?._id, ...data?.versions[tempCurrentVersion] });
        }
      });
  };

  const createNewVersionQuote = (updateProcessStatus = false) => {
    setQuoteClonning(true);
    axiosInstance()
      .post(`/quotation/clone-version/${quotationVersionData.quotationId}/${quotationVersionData?._id}`, { updateProcessStatus })
      .then(() => {
        setShowQuotationConfirmBox(false);
        fetchQuotationData();
        fetchRepairOrderData();
        setQuoteClonning(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowQuotationConfirmBox(false);
        setQuoteClonning(false);
      });
  };

  const updateOrderStatus = (status) => {
    axiosInstance()
      .patch(`${repairOrder.api}/status/${repairOrderData._id}`, { status: status })
      .then(({ data: { data } }) => {
        fetchRepairOrderData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status changed to ${status}`
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddAssetToTransferAsset = async (data) => {
    const assets: any = repairOrderData?.material
      ?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)
      ?.map((e) => {
        return { _id: e.materialId, currentStatus: e.status };
      });
    axiosInstance()
      .put(`${transferAsset.api}/add-asset-complete-transfer-asset/${data._id}`, { assets, repairOrderId: id })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowTransferAssetDialog(false);
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
            routes={[{ ...routes?.repairOrder, title: resources?.repairOrder?.titlePlural }, { title: repairOrderData?.repairOrderNumber }]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1 ">
            {repairOrderData ? (
              <>
                {allowedToEdit &&
                  permissions?.repairOrder?.isUpdate &&
                  permissions?.transferAsset?.isCreate &&
                  resourceData?.policy?.showTransferAssets &&
                  repairOrderData?.material
                    ?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)
                    ?.every((e) => e.status === ASSET_STATUS.inRepair) && (
                    <Button
                      size="small"
                      onClick={() => {
                        setShowTransferAssetDialog(true);
                      }}
                      variant={'contained'}
                      className={'btn-outline-v1'}
                    >
                      {`Create ${resources?.transferAsset?.titleSingular}`}
                    </Button>
                  )}
                {permissions?.repairOrder?.isUpdate && [REPAIR_ORDER_STATUS.completed].includes(repairOrderData?.status) && (
                  <HtmlTooltip title={allowedToEdit ? '' : `Owner or Collaborator can reopen ${resources?.repairOrder?.titleSingular}`}>
                    <span>
                      <Button
                        variant={'contained'}
                        className={'btn-outline-v1'}
                        onClick={() =>
                          updateOrderStatus(repairOrderData?.invoice?.optionValue ? REPAIR_ORDER_STATUS.invoiced : REPAIR_ORDER_STATUS.readyToInvoice)
                        }
                        disabled={permissions?.repairOrder?.isUpdate && allowedToEdit ? false : true}
                      >
                        {'Re-Open'}
                      </Button>
                    </span>
                  </HtmlTooltip>
                )}
                {permissions?.repairOrder?.isUpdate && allowedToEdit && repairOrderData?.canComplete && stepNames[currentStep] === 'Slip' && (
                  <ButtonWithPulse
                    onClick={() => updateOrderStatus(REPAIR_ORDER_STATUS.completed)}
                    id={'header-button-complete'}
                  >
                    Complete
                  </ButtonWithPulse>
                )}
                {permissions?.repairOrder?.isUpdate &&
                  allowedToEdit &&
                  ['Add Assets', 'Work Order'].includes(stepNames[currentStep]) &&
                  [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                    quotationVersionData?.status
                  ) && (
                    <Button
                      className="buttonStyleBigScreen"
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => {
                        createNewVersionQuote();
                      }}
                    >
                      Create New Version
                    </Button>
                  )}
                {permissions?.repairOrder?.isUpdate &&
                  allowedToEdit &&
                  ![REPAIR_ORDER_STATUS.completed].includes(repairOrderData?.status) &&
                  !(
                    [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                      quotationVersionData?.status
                    ) && ['Add Assets', 'Work Order'].includes(stepNames[currentStep])
                  ) && (
                    <ThemeButton iconForMobile={<EditIcon />} onClick={() => setOpenUpdateDialog(true)} tooltip={'Edit'}>
                      {'Edit'}
                    </ThemeButton>
                  )}
                {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton
              referenceId={repairOrderData?._id}
              resource={ACTIVITY_RESOURCE.repairOrder}
              resourceLabel={repairOrderData?.repairOrderNumber}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          {!(isMobile && !isTablet) && <CustomTab value={2}>Views</CustomTab>}
          {resourceData && resourceData?.tabs?.length && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 3}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>

        <TabPanel value={tabValue} index={0}>
          <Box>
            {repairOrderData && repairOrderFields.length ? (
              <DetailsPage data={repairOrderData} fields={repairOrderFields} />
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
              isPrevStep={prevStep}
              steps={stepList}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isStepEnded={[REPAIR_ORDER_STATUS.completed].includes(repairOrderData?.status)}
              stepFullScreen={stepFullScreen}
              setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
              handlePrev={
                stepNames[currentStep] === 'Quotation' &&
                  allowedToEdit &&
                  [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                    quotationVersionData?.status
                  )
                  ? () => {
                    setShowQuotationConfirmBox(true);
                  }
                  : null
              }
              updateStatus={(step: number) => {
                dynamicFormUpdateProcessStatus(sidebarResource.repairOrder, stepNames[step], id);
              }}
            />
            {stepNames[currentStep] === 'Add Assets' && repairOrderData && (
              <>
                <Productpackage
                  fetchRepairOrderData={fetchRepairOrderData}
                  repairOrderData={repairOrderData}
                  setNextStep={setNextStep}
                  renderedFrom={`${renderedFrom}_grid-1`}
                  stepFullScreen={stepFullScreen}
                  setHasAssetsAdded={setHasAssetsAdded}
                  allowedToEdit={
                    [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                      quotationVersionData?.status
                    )
                      ? false
                      : allowedToEdit
                  }
                />
              </>
            )}
            {(stepNames[currentStep] === 'Work Order' || stepNames[currentStep] === 'Execute') && repairOrderData && (
              <WorkOrder
                fetchRepairOrderData={fetchRepairOrderData}
                repairOrderData={repairOrderData}
                setNextStep={setNextStep}
                currentStepName={stepNames[currentStep]}
                stepFullScreen={stepFullScreen}
                stepNames={stepNames}
                allowedToEdit={
                  currentStep === 3
                    ? allowedToEdit
                    : [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                      quotationVersionData?.status
                    )
                      ? false
                      : allowedToEdit
                }
                isPostWorkService={Boolean(currentStep === 3)}
                setCurrentStep={setCurrentStep}
                createNewVersionQuote={createNewVersionQuote}
                resourcePolicy={resourceData?.policy}
              />
            )}
            {stepNames[currentStep] === 'Quotation' && repairOrderData && (
              <Quotation
                currentStepName={stepNames[currentStep]}
                repairOrderData={repairOrderData}
                setNextStep={setNextStep}
                setPrevStep={setPrevStep}
                renderedFrom={`${renderedFrom}_grid-4`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
                setQuotationVersionData={setQuotationVersionData}
                invoiceStep={false}
                updateOrderStatus={updateOrderStatus}
              />
            )}
            {stepNames[currentStep] === 'Loading Ticket' && repairOrderData && (
              <>
                <LoadingTicket
                  repairOrderData={repairOrderData}
                  setNextStep={setNextStep}
                  renderedFrom={`${renderedFrom}_grid-5`}
                  allowedToEdit={allowedToEdit}
                />
              </>
            )}
            {stepNames[currentStep] === 'Slip' && repairOrderData && (
              <Quotation
                currentStepName={stepNames[currentStep]}
                repairOrderData={repairOrderData}
                setNextStep={setNextStep}
                setPrevStep={setPrevStep}
                renderedFrom={`${renderedFrom}_grid-4`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={false}
                topAllowedToEdit={allowedToEdit}
                invoiceStep={true}
                setQuotationVersionData={setQuotationVersionData}
                updateOrderStatus={updateOrderStatus}
              />
            )}
          </TabPanel>
        </ContentFullScreen>
        <TabPanel value={tabValue} index={2}>
          <Box>
            <View repairOrderNumber={repairOrderData?.repairOrderNumber || ''} repairOrderId={id} repairOrderStatus={repairOrderData?.status} />
          </Box>
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
                  resource={sidebarResource.repairOrder}
                  data={repairOrderData}
                  allowedToEdit={permissions?.repairOrder?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${resources?.repairOrder?.titleSingular?.toLowerCase()}: ${repairOrderData?.repairOrderNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {showQuotationConfirmBox && (
        <ConfirmationDialog
          open={showQuotationConfirmBox}
          message={`Are you sure you want to create new version of this ${resources?.repairOrder?.titleSingular?.toLowerCase()}?`}
          onClose={() => {
            setShowQuotationConfirmBox(false);
            setCurrentStep((prevStep) => {
              const newStep = prevStep - 1;
              return newStep;
            });
          }}
          onOk={() => {
            createNewVersionQuote();
            setCurrentStep((prevStep) => {
              const newStep = prevStep - 1;
              return newStep;
            });
          }}
          // forwardText={'Yes'}
          cancelText={'No'}
        />
      )}
      {openUpdateDialog && (
        <ManageRepairOrder
          isAnyMaterial={isAnyMaterial}
          isEditable={!hasAssetsAdded}
          isClone={false}
          repairOrderId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchRepairOrderData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
      {showTransferAssetDialog ? (
        <ManageTransferAsset
          isClone={false}
          transferAssetId={null}
          onClose={() => setShowTransferAssetDialog(false)}
          onSuccess={(data) => {
            handleAddAssetToTransferAsset(data);
          }}
          referenceId={repairOrderData?._id}
          referenceType={'Repair Order'}
          referenceData={{
            transferFromPlant: repairOrderData?.warehouse?.optionValue,
            transferType: 'Internal'
          }}
        />
      ) : null}
    </Box>
  );
};

export default RepairOrderDetails;
