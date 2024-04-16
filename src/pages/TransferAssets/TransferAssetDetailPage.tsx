import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs, useMediaQuery, IconButton } from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { ACTIVITY_RESOURCE, TRANSFER_ASSET_STATUS, checkSuperAdminAccess, sidebarResource, transferAsset, transferAssetSteps } from 'src/constants/helpers';
import ManageTransferAsset from './ManageTransferAsset';
import queryString from 'query-string';
import AssetsGrid from './AssetGrid';
import LoadingTicketGrid from './LoadingTicket';
import ReceivingTicketGrid from './ReceivingTicket';
import TabPanel from 'src/components/TabPanel';
import { BiFoodMenu } from 'react-icons/bi';
import EditIcon from '@material-ui/icons/Edit';
import { FaWpforms } from 'react-icons/fa';
import { camelCase } from 'lodash';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Steps from 'src/components/Steps';
import { RiFlowChart } from 'react-icons/ri';
import TransferAssetViews from './RoadMapViews';
import { isMobile, isTablet } from 'react-device-detect';
import ActivityButton from 'src/components/Activity/ActivityButton';

const TransferAssetDetailPage = () => {
  const renderedFrom = camelCase(routes?.transferAsset.title);
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const {
    state: { user, permissions }
  }: any = useData();

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
  const [isProcessor, setProcessor] = useState(false);
  const [canReceive, setCanReceive] = useState(false);
  const [locationKeys, setLocationKeys] = useState([]);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const [stepNames, setStepNames] = useState([]);
  const [stepList, setStepList] = useState([]);
  const [showReopenConfirmation, setShowReopenConfirmation] = useState(false);

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
    }
  }, [id]);

  const updateProcessStatus = (step: number) => {
    axiosInstance()
      .put(`${routes.transferAsset.path}/${id}/process-status`, { processStatus: stepNames[step] })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
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

        var isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
        if (checkSuperAdminAccess(user, sidebarResource.transferAsset)) {
          isAllowedToEdit = true;
        }
        setAllowedToEdit(isAllowedToEdit);

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
        history.push(`${routes.transferAsset.path}`)
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

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  const updateTransferStatus = (status) => {
    axiosInstance()
      .put(`${routes.transferAsset.path}/${id}/status`, { status })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchTransferAssetData()
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.transferAsset, { title: transferAssetData?.transferAssetNumber }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.transferAsset?.isUpdate && allowedToEdit && !isTransferEnded && (
              <Button
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                onClick={handleOpenUpdateDialog}
                className={'btn-outline-v1'}>
                {isMobile && !isTablet ? <EditIcon /> : 'Edit'}
              </Button>
            )}
            {/* {permissions?.transferAsset?.isUpdate && allowedToEdit && transferAssetData?.status === TRANSFER_ASSET_STATUS.completed && (
              <Button
                variant={'contained'}
                onClick={() => {
                  setShowReopenConfirmation(true)
                }}
                className={'btn-outline-v1'}>
                {'Re-Open'}
              </Button>
            )} */}
            <ActivityButton
              referenceId={transferAssetData?._id}
              resource={ACTIVITY_RESOURCE.transferAsset}
              resourceLabel={transferAssetData?.transferAssetNumber}
            />
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
          {!(isMobile && !isTablet) && (
            <Tab
              className={'tabLayout'}
              label={
                <div className="d-flex align-items-center tab-font">
                  <RiFlowChart className="mr-1" fontSize="inherit" /> Views
                </div>
              }
              {...a11yProps(2)}
            />
          )}
        </Tabs>
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
        <TabPanel value={tabValue} index={1}>
          <Box my={2}>
            <Steps
              isNextStep={false}
              nextStep={isNextStep}
              steps={stepList}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isStepEnded={isTransferEnded}
              setStepFullScreen={() => setStepFullScreen(true)}
              updateStatus={updateProcessStatus}
            />
            <ContentFullScreen title={stepNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
              {currentStep === 0 && transferAssetData && (
                <AssetsGrid
                  permissions={permissions}
                  setNextStep={setNextStep}
                  updateTransferStatus={updateTransferStatus}
                  transferAssetData={transferAssetData}
                  renderedFrom={`${renderedFrom}_grid-1`}
                  allowedToEdit={allowedToEdit}
                  stepFullScreen={stepFullScreen}
                />
              )}
              {currentStep === 1 && transferAssetData && (
                <LoadingTicketGrid
                  currentStep={currentStep}
                  transferAssetId={id}
                  transferAssetData={transferAssetData}
                  permissions={permissions}
                  setNextStep={setNextStep}
                  setTransferIsEnded={setTransferIsEnded}
                  updateTransferStatus={updateTransferStatus}
                  isTransferEnded={isTransferEnded}
                  renderedFrom={`${renderedFrom}_grid-2`}
                  allowedToEdit={allowedToEdit || isProcessor}
                  canReceive={canReceive}
                  stepFullScreen={stepFullScreen}
                />
              )}
              {currentStep === 2 && transferAssetData && (
                <ReceivingTicketGrid
                  currentStep={currentStep}
                  transferAssetId={id}
                  transferAssetData={transferAssetData}
                  permissions={permissions}
                  setNextStep={setNextStep}
                  setTransferIsEnded={setTransferIsEnded}
                  updateTransferStatus={updateTransferStatus}
                  isTransferEnded={isTransferEnded}
                  renderedFrom={`${renderedFrom}_grid-3`}
                  allowedToEdit={allowedToEdit || isProcessor}
                  stepFullScreen={stepFullScreen}
                />
              )}
            </ContentFullScreen>
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Box>
            <TransferAssetViews tANumber={transferAssetData?.transferAssetNumber} tAId={id} />
          </Box>
        </TabPanel>
      </Box>
      {/* Confirm Delete Dialog */}
      {showConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isDeleting}
          open={showConfirmBox}
          message={`Are you sure you want to delete this transfer asset: ${transferAssetData?.transferAssetNumber} ?`}
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
      {showReopenConfirmation && (
        <ConfirmationDialog
          open={showReopenConfirmation}
          message={`Are you sure you want to re-open ?`}
          onClose={() => {
            setShowReopenConfirmation(false);
          }}
          onOk={() => {
            updateTransferStatus(TRANSFER_ASSET_STATUS.inProgress)
            setShowReopenConfirmation(false);
          }}
          okBtnLoading={false}
        />
      )}
    </Box>
  );
};
export default TransferAssetDetailPage;
