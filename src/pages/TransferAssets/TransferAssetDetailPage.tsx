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
import { ACTIVITY_RESOURCE, transferAsset, transferAssetSteps } from 'src/constants/helpers';
import ManageTransferAsset from './ManageTransferAsset';
import queryString from 'query-string';
import AssetsGrid from './AssetGrid';
import LoadingTicketGrid from './LoadingTicket';
import ReceivingTicketGrid from './ReceivingTicket';
import TabPanel from 'src/components/TabPanel';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
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
  const { openEdit, tab }: any = parsed;
  const parsedTab = tab !== undefined ? parseInt(tab) : 1;
  const {
    state: { user, permissions }
  }: any = useData();

  const [headingLabel, setHeadingLabel] = useState('');
  const [tabValue, setTabValue] = useState(parsedTab);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setDeleting] = useState(false);
  const [transferAssetData, setTransferAssetData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [isNextStep, setNextStep] = useState(true);
  const [isPrevStep, setPrevStep] = useState(true);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fileDownloading, setFileDownloading] = useState(false);
  const [transferAssetFields, setTransferAssetFields] = useState([]);
  const [existingAssets, setExistingAssets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState([]);
  const [receivingTickets, setReceivingTickets] = useState([]);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransferEnded, setTransferIsEnded] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [isProcessor, setProcessor] = useState(false);
  const [canReceive, setCanReceive] = useState(false);
  const [locationKeys, setLocationKeys] = useState([]);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const [stepNames, setStepNames] = useState([]);
  const [stepList, setStepList] = useState([]);

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
      fetchAssets(true);
    }
  }, [id]);

  const updateProcessStatus = (step: number) => {
    axiosInstance()
      .put(`${routes.transferAsset.path}/${id}/process-status`, { processStatus: stepNames[step] })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getRessourceFields = (transferType) => {
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
        getRessourceFields(data?.transferType);
        setTransferAssetData(data);
        setHeadingLabel(data.transferAssetNumber);
        var steps: any = transferAssetSteps;
        if (data?.transferType === 'Internal') {
          steps = steps?.filter((e) => e.name !== 'Receiving Ticket');
        }
        setStepNames(steps?.map((item) => item.name));
        setStepList(steps);

        setCurrentStep(
          steps?.map((item) => item.name)?.indexOf(data?.processStatus) !== -1 ? steps?.map((item) => item.name)?.indexOf(data?.processStatus) : 0
        );

        setCustomizedRoutes([routes.transferAsset, { title: data.transferAssetNumber }]);

        const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
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

        if (permissions?.transferAsset?.isUpdate && openEdit === 'true') {
          setOpenUpdateDialog(true);
          const params = new URLSearchParams();
          params.delete('openEdit');
          history.push({ search: params.toString() });
        }
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
        history.goBack();
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const fetchAssets = (forceRefresh) =>
    new Promise((resolve, reject) => {
      if (existingAssets.length > 0 && !forceRefresh) {
        resolve(existingAssets);
      }

      if (existingAssets.length === 0 || forceRefresh) {
        axiosInstance()
          .get(`${routes.transferAsset.path}/get-asset/${id}`)
          .then(({ data: { data } }) => {
            data = [
              ...data?.assets?.map((d: any) => ({
                ...d,
                productDescription: d?.product?.optionLabel ?? '',
                productId: d?.product?.optionValue ?? '',
                isChecked: false
              }))
            ];
            setExistingAssets(data);
            resolve(data);
          })
          .catch((error) => {
            reject(error);
          });
      }
    });

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
      .put(`${routes.transferAsset.path}/${id}/status`, {
        status
      })
      .then(() => fetchTransferAssetData())
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleViewPdf = (download) => {
    setFileDownloading(true);
    axiosInstance()
      .get(`${transferAsset.api}/${id}/pdf`)
      .then(({ data: { data } }) => {
        axiosInstance()
          .get(`user/download?fileName=${data.fileName}`, {
            responseType: 'blob'
          })
          .then(({ data }) => {
            if (download) {
              const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `TransferAsset-${transferAssetData.transferAssetNumber}.pdf`);
              document.body.appendChild(link);
              link.click();
            } else {
              const file = new Blob([data], { type: 'application/pdf' });
              const fileURL = URL.createObjectURL(file);
              const pdfWindow = window.open();
              pdfWindow.location.href = fileURL;
              toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
            }
            setFileDownloading(false);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
            setFileDownloading(false);
          });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setFileDownloading(false);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.transferAsset?.isUpdate && !isTransferEnded && (
              <Button variant={isMobile && !isTablet ? 'text' : 'contained'} onClick={handleOpenUpdateDialog} className={'btn-outline-v1'}>
                {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
              </Button>
            )}
            <ActivityButton referenceId={transferAssetData?._id} resource={ACTIVITY_RESOURCE.transferAsset} />
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
                <RiFlowChart className="mr-1" fontSize="inherit" /> Views
              </div>
            }
            {...a11yProps(2)}
          />
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
              {currentStep === 0 && (
                <AssetsGrid
                  fetchAssets={fetchAssets}
                  currentStep={currentStep}
                  permissions={permissions}
                  user={user}
                  setNextStep={setNextStep}
                  updateTransferStatus={updateTransferStatus}
                  transferAssetData={transferAssetData}
                  handleViewPdf={handleViewPdf}
                  fileDownloading={fileDownloading}
                  renderedFrom={`${renderedFrom}_grid-1`}
                  allowedToEdit={allowedToEdit}
                />
              )}
              {currentStep === 1 && (
                <LoadingTicketGrid
                  setTickets={setLoadingTickets}
                  currentStep={currentStep}
                  setPrevStep={setPrevStep}
                  transferAssetId={id}
                  transferAssetData={transferAssetData}
                  permissions={permissions}
                  setNextStep={setNextStep}
                  setExistingAssets={setExistingAssets}
                  setTransferIsEnded={setTransferIsEnded}
                  updateTransferStatus={updateTransferStatus}
                  handleViewPdf={handleViewPdf}
                  fileDownloading={fileDownloading}
                  isTransferEnded={isTransferEnded}
                  renderedFrom={`${renderedFrom}_grid-2`}
                  allowedToEdit={allowedToEdit || isProcessor}
                  canReceive={canReceive}
                />
              )}
              {currentStep === 2 && (
                <ReceivingTicketGrid
                  setTickets={setReceivingTickets}
                  currentStep={currentStep}
                  setPrevStep={setPrevStep}
                  transferAssetId={id}
                  transferAssetData={transferAssetData}
                  fetchAssets={fetchAssets}
                  permissions={permissions}
                  setNextStep={setNextStep}
                  setTransferIsEnded={setTransferIsEnded}
                  updateTransferStatus={updateTransferStatus}
                  handleViewPdf={handleViewPdf}
                  fileDownloading={fileDownloading}
                  isTransferEnded={isTransferEnded}
                  renderedFrom={`${renderedFrom}_grid-3`}
                  allowedToEdit={allowedToEdit || isProcessor}
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
          message={`Are you sure you want to delete this transfer asset: ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {/* Manage Transfer Asset Data */}
      {openUpdateDialog && (
        <ManageTransferAsset
          isEditable={existingAssets.length > 0}
          isMainInfoEditable={currentStep >= 1 && (loadingTickets.length > 0 || receivingTickets.length > 0)}
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
    </Box>
  );
};
export default TransferAssetDetailPage;
