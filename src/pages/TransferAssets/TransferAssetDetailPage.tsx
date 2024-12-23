import { Box, Button, Grid } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { camelCase, startCase } from 'lodash';
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
import Steps from 'src/components/Steps';
import {
  ACTIVITY_RESOURCE,
  TRANSFER_ASSET_STATUS,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  sidebarResource,
  transferAsset,
  transferAssetSteps
} from 'src/constants/helpers';
import AssetsGrid from './AssetGrid';
import LoadingTicketGrid from './LoadingTicket';
import ManageTransferAsset from './ManageTransferAsset';
import ReceivingTicketGrid from './ReceivingTicket';
import TransferAssetViews from './RoadMapViews';
import ButtonWithPulse from 'src/components/ButtonWithPulse';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import Step from '../DynamicForm/Step';
import { DeleteButton } from 'src/components/Helpers/Buttons';

const TransferAssetDetailPage = () => {
  const renderedFrom = camelCase(sidebarResource.transferAsset);
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

  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setDeleting] = useState(false);
  const [transferAssetData, setTransferAssetData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [isNextStep, setNextStep] = useState(true);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [transferAssetFields, setTransferAssetFields] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransferEnded, setTransferIsEnded] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [isProcessor, setProcessor] = useState(false);
  const [canReceive, setCanReceive] = useState(false);
  const [locationKeys, setLocationKeys] = useState([]);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [stepNames, setStepNames] = useState([]);
  const [stepList, setStepList] = useState([]);
  const [showReopenCloseConfirmation, setShowReopenCloseConfirmation] = useState({ open: false, type: null });
  const [isAllAssetsDelivered, setAllAssetsDelivered] = useState(false);
  const [isAllAssetsReceived, setAllAssetsReceived] = useState(false);
  const [nextStepToolTip, setNextStepToolTip] = useState(null);

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
      fetchTransferAssetData();
      fetchPolicy();
    }
  }, [id]);

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.transferAsset}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchFields = (transferType) => {
    axiosInstance()
      .get('/field?resource=Transfer Asset')
      .then(({ data: { data } }) => {
        let fields = [];
        data.forEach((field: any) => {
          if (transferType === 'Internal') {
            if (
              field.fieldData.fieldName !== 'transfertoSupplier' &&
              field.fieldData.fieldName !== 'transfertoCustomer' &&
              field.fieldData.fieldName !== 'supplierShipTo' &&
              field.fieldData.fieldName !== 'customerShipTo'
            ) {
              fields.push(field);
            }
          } else if (transferType === 'External Supplier') {
            if (
              field.fieldData.fieldName !== 'transfertoPlant' &&
              field.fieldData.fieldName !== 'transfertoCustomer' &&
              field.fieldData.fieldName !== 'plantShipTo' &&
              field.fieldData.fieldName !== 'customerShipTo'
            ) {
              fields.push(field);
            }
          } else if (transferType === 'External Customer') {
            if (
              field.fieldData.fieldName !== 'transfertoSupplier' &&
              field.fieldData.fieldName !== 'transfertoPlant' &&
              field.fieldData.fieldName !== 'plantShipTo' &&
              field.fieldData.fieldName !== 'supplierShipTo'
            ) {
              fields.push(field);
            }
          }
        });

        setTransferAssetFields(fields);
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };

  const fetchTransferAssetData = () => {
    axiosInstance()
      .get(`${routes.transferAsset.path}/${id}`)
      .then(({ data: { data } }) => {
        fetchFields(data?.transferType);
        var steps: any = transferAssetSteps;
        if (data?.transferType === 'Internal') {
          steps = steps?.filter((e) => e.name !== 'Receiving Ticket');
        }
        setStepNames(steps?.map((item) => item.name));
        setStepList(steps);

        setCurrentStep(
          steps?.map((item) => item.name)?.indexOf(data?.processStatus) !== -1 ? steps?.map((item) => item.name)?.indexOf(data?.processStatus) : 0
        );

        setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.transferAsset, data));

        if (data.processor) {
          const processor = [data.processor].some((d) => d?.optionValue === user?.user?._id);
          setProcessor(processor);
        }

        const userEntity = user?.entity?.map((e) => e._id) ?? [];
        const warehouseEntity =
          data?.transferType === 'Internal'
            ? data?.transfertoPlant?.entity
            : data?.transferType === 'External Customer'
              ? data?.transfertoCustomer?.entity
              : data?.transfertoSupplier?.entity;

        if (warehouseEntity?.length) {
          const isReceiveable = warehouseEntity.filter((w: any) => userEntity.indexOf(w) > -1)?.length > 0;
          setCanReceive(isReceiveable);
        } else {
          setCanReceive(true);
        }
        if (data?.status === TRANSFER_ASSET_STATUS.completed) {
          setTransferIsEnded(true);
        } else {
          setTransferIsEnded(false);
        }
        setAllowedToDelete(
          permissions?.transferAsset?.isDelete && checkIsAllowedToDelete(user, sidebarResource.transferAsset, data.owner.optionValue) && data?.canEdit
        );
        setTransferAssetData(data);
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
      .put(`${transferAsset.api}/remove`, { ids: [id] })
      .then(() => {
        setDeleting(false);
        setShowConfirmBox(false);
        history.push(`${routes.transferAsset.path}`);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  const updateTransferStatus = (status) => {
    const body: any = { status };
    axiosInstance()
      .put(`${routes.transferAsset.path}/${id}/status`, body)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchTransferAssetData();
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
            routes={[{ ...routes.transferAsset, title: resources?.transferAsset?.titlePlural }, { title: transferAssetData?.transferAssetNumber }]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.transferAsset?.isUpdate && allowedToEdit && isTransferEnded && (
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                className={'btn-outline-v1'}
                onClick={(e) => {
                  setShowReopenCloseConfirmation({ open: true, type: 'reopen' });
                }}
              >
                Re-Open
              </Button>
            )}
            {permissions?.transferAsset?.isUpdate && allowedToEdit && !isTransferEnded && (transferAssetData?.transferType.includes('External') ? isAllAssetsReceived : isAllAssetsDelivered) && (
              <ButtonWithPulse
                variant={'outlined'}
                color="default"
                size="small"
                onClick={() => {
                  setShowReopenCloseConfirmation({ open: true, type: 'close' });
                }}
                className={'btn-outline-v1'}
              >
                Close
              </ButtonWithPulse>
            )}
            {permissions?.transferAsset?.isUpdate && allowedToEdit && !isTransferEnded && (
              <Button variant={isMobile && !isTablet ? 'text' : 'contained'} onClick={handleOpenUpdateDialog} className={'btn-outline-v1'}>
                {isMobile && !isTablet ? <EditIcon /> : 'Edit'}
              </Button>
            )}
            {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            <ActivityButton
              referenceId={transferAssetData?._id}
              resource={ACTIVITY_RESOURCE.transferAsset}
              resourceLabel={transferAssetData?.transferAssetNumber}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          {!(isMobile && !isTablet) && <CustomTab value={2}>Views</CustomTab>}
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 3}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !transferAssetData ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={transferAssetData} fields={transferAssetFields} />
            )}
          </Box>
        </TabPanel>
        <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
          <TabPanel value={tabValue} index={1}>
            <Steps
              isNextStep={false}
              nextStep={isNextStep}
              steps={stepList}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              nextStepToolTip={nextStepToolTip}
              isStepEnded={isTransferEnded}
              stepFullScreen={stepFullScreen}
              setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
              updateStatus={(step: number) => {
                dynamicFormUpdateProcessStatus(sidebarResource.transferAsset, stepNames[step], id);
              }}
            />
            {currentStep === 0 && transferAssetData && (
              <AssetsGrid
                permissions={permissions}
                setNextStep={setNextStep}
                updateTransferStatus={updateTransferStatus}
                transferAssetData={transferAssetData}
                renderedFrom={`${renderedFrom}_grid-1`}
                allowedToEdit={allowedToEdit}
                stepFullScreen={stepFullScreen}
                setNextStepToolTip={setNextStepToolTip}
              />
            )}
            {currentStep === 1 && transferAssetData && (
              <LoadingTicketGrid
                currentStep={currentStep}
                transferAssetId={id}
                transferAssetData={transferAssetData}
                permissions={permissions}
                resources={resources}
                setNextStep={setNextStep}
                updateTransferStatus={updateTransferStatus}
                isTransferEnded={isTransferEnded}
                renderedFrom={`${renderedFrom}_grid-2`}
                allowedToEdit={allowedToEdit || isProcessor}
                canReceive={canReceive}
                stepFullScreen={stepFullScreen}
                setAllAssetsDelivered={setAllAssetsDelivered}
                setNextStepToolTip={setNextStepToolTip}
              />
            )}
            {currentStep === 2 && transferAssetData && (
              <ReceivingTicketGrid
                currentStep={currentStep}
                transferAssetId={id}
                transferAssetData={transferAssetData}
                setNextStep={setNextStep}
                updateTransferStatus={updateTransferStatus}
                isTransferEnded={isTransferEnded}
                renderedFrom={`${renderedFrom}_grid-3`}
                allowedToEdit={allowedToEdit || isProcessor}
                stepFullScreen={stepFullScreen}
                resources={resources}
                setAllAssetsReceived={setAllAssetsReceived}
              />
            )}
          </TabPanel>
        </ContentFullScreen>
        <TabPanel value={tabValue} index={2}>
          <Box>
            <TransferAssetViews tANumber={transferAssetData?.transferAssetNumber} tAId={id} />
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
                  resource={sidebarResource.transferAsset}
                  data={transferAssetData}
                  allowedToEdit={permissions?.transferAsset?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {/* Confirm Delete Dialog */}
      {showConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isDeleting}
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${resources?.transferAsset?.titleSingular?.toLowerCase()}: ${transferAssetData?.transferAssetNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {/* Manage Transfer Asset Data */}
      {openUpdateDialog && (
        <ManageTransferAsset
          number={transferAssetData?.transferAssetNumber}
          isClone={false}
          transferAssetId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchTransferAssetData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
      {showReopenCloseConfirmation.open && (
        <ConfirmationDialog
          open={showReopenCloseConfirmation.open}
          message={`Are you sure you want to ${startCase(showReopenCloseConfirmation.type)} ?`}
          onClose={() => {
            setShowReopenCloseConfirmation({ open: false, type: null });
          }}
          onOk={() => {
            if (showReopenCloseConfirmation.type === 'reopen') {
              updateTransferStatus(TRANSFER_ASSET_STATUS.inProgress);
            } else {
              updateTransferStatus(TRANSFER_ASSET_STATUS.completed);
            }
            setShowReopenCloseConfirmation({ open: false, type: null });
          }}
          okBtnLoading={false}
        />
      )}
    </Box>
  );
};
export default TransferAssetDetailPage;
