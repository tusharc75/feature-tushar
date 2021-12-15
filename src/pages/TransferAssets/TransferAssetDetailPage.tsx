import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
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
import { transferAsset } from '../../constants/helpers';
import ManageTransferAsset from './ManageTransferAsset';
import DeleteButton from '../../components/Helpers/DeleteButton';
import queryString from 'query-string';
import TransferStepper from './TransferAssetSteps';
import AssetsGrid from './AssetsGrid';
import LoadingTicketGrid from './LoadingTicketGrid';
import ReceivingTicketGrid from './ReceivingTicketGrid';
import HideWhenOffline from '../../components/HideWhenOffline';
import { MdEdit, MdDelete } from 'react-icons/md';
import TabPanel from '../../components/TabPanel';
import { BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';

const transferSteps = ['Add Assets', 'Loading Ticket'];
const transferSteps1 = ['Add Assets', 'Loading Ticket', 'Receiving Ticket'];
const status = ['New', 'In Progress', 'Completed'];

const TransferAssetDetailPage = () => {
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
  const [transferType, setType] = useState(null);
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
  const [mainPoints, setMainPoints] = useState(null);
  const [plantId, setPlantId] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransferEnded, setTransferIsEnded] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTransferAssetData();
      fetchAssets(true);
    }
    // eslint-disable-next-line
  }, [id]);

  const updateStatus = (step) => {
    const processStatus = transferType === 'Internal' ? transferSteps[step] : transferSteps1[step];
    axiosInstance()
      .put(`${routes.transferAsset.path}/${id}/process-status`, { processStatus })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleMainPoints = (data) => {
    let mainPoint = {};
    mainPoint['Transfer Asset Number'] = data.transferAssetNumber;
    mainPoint['Transfer Type'] = data.transferType;
    setMainPoints(mainPoint);
  };

  const getRessourceFields = (transferType) => {
    axiosInstance()
      .get('/field?resource=Transfer Asset')
      .then(({ data: { data } }) => {
        let fields = [];
        data.forEach((field: any) => {
          if (transferType === 'Internal') {
            if (
              field.fieldData.fieldName !== 'transferToSupplier' &&
              field.fieldData.fieldName !== 'transferToCustomer' &&
              field.fieldData.fieldName !== 'supplierShipTo' &&
              field.fieldData.fieldName !== 'customerShipTo'
            ) {
              fields.push(field);
            }
          } else if (transferType === 'External Supplier') {
            if (
              field.fieldData.fieldName !== 'transferToPlant' &&
              field.fieldData.fieldName !== 'transferToCustomer' &&
              field.fieldData.fieldName !== 'plantShipTo' &&
              field.fieldData.fieldName !== 'customerShipTo'
            ) {
              fields.push(field);
            }
          } else if (transferType === 'External Customer') {
            if (
              field.fieldData.fieldName !== 'transferToSupplier' &&
              field.fieldData.fieldName !== 'transferToPlant' &&
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
        setType(data?.transferType);
        setTransferAssetData(data);
        handleMainPoints(data);
        setPlantId(data?.transferFromPlant.optionValue);
        setHeadingLabel(data.transferAssetNumber);
        const steps = data?.transferType === 'Internal' ? transferSteps : transferSteps1;
        setCurrentStep(steps.indexOf(data?.processStatus) !== -1 ? steps.indexOf(data?.processStatus) : 0);
        setCustomizedRoutes([routes.transferAsset, { title: data.transferAssetNumber }]);

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

  /**
   * FETCH ASSETS FOR TRANSFER
   */

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
              ...data?.map((d: any) => ({
                ...d,
                productDescription: d.product.optionLabel,
                productId: d.product.optionValue
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

  /**
   * Tab Change
   */
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
    axiosInstance()
      .put(`quote-pdf-template/pdf-column`, { id, resourceName: 'transferAsset', acceptedColumn: ['Asset Number', 'Product Description', 'Status'] })
      .then(({ data }) => {
        axiosInstance()
          .get(`user/download?fileName=${data.data.fileName}`, {
            responseType: 'blob'
          })
          .then(({ data }) => {
            if (download) {
              const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `TransferAsset-${transferAssetData.purchaseOrderNumber}.pdf`);
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
    <>
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <div className="detail-container">
          <Paper>
            {!transferAssetData ? (
              <div>
                <Skeleton variant="text" width="150px" height="40px" />
                <Box display="flex">
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  <Box marginX={1} />
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                </Box>
              </div>
            ) : (
              <DetailsPageHeader heading={headingLabel} mainPoints={mainPoints} showHeading={true}>
                {permissions?.transferAsset?.isUpdate && (
                  <Button className="buttonStyleBigScreen" variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                    Edit
                  </Button>
                )}
                {permissions?.transferAsset?.isUpdate && (
                  <Button className="buttonStyleSmallScreen" variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                    <MdEdit size={24} />
                  </Button>
                )}
                <HideWhenOffline>
                  {permissions?.transferAsset?.isDelete && transferAssetData?.user === user?.user._id ? (
                    <DeleteButton
                      disabled={transferAssetData?.status !== 'New'}
                      text="Delete"
                      className="buttonDeleteBigScreen"
                      onClick={() => setShowConfirmBox(true)}
                    />
                  ) : null}
                </HideWhenOffline>
                <HideWhenOffline>
                  {permissions?.transferAsset?.isDelete && transferAssetData?.user === user?.user._id ? (
                    <Button
                      disabled={transferAssetData?.status !== 'New'}
                      className="buttonDeleteSmallScreen"
                      onClick={() => setShowConfirmBox(true)}
                    >
                      <MdDelete size={24} />
                    </Button>
                  ) : null}
                </HideWhenOffline>
              </DetailsPageHeader>
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
              <Tab
                className={'tabLayout'}
                style={{
                  background: tabValue === 2 ? 'white' : '',
                  color: tabValue === 2 ? 'blue' : '#163340'
                }}
                label={
                  <div className="d-flex align-items-center tab-font">
                    <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                  </div>
                }
                {...a11yProps(1)}
              />
              <div className={'uio'}> </div>
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
                <TransferStepper
                  isInternal={transferAssetData?.transferType === 'Internal'}
                  hasAssets={existingAssets.length > 0}
                  isTransferEnded={isTransferEnded}
                  isNextStep={isNextStep}
                  isPrevStep={isPrevStep}
                  steps={transferAssetData?.transferType === 'Internal' ? transferSteps : transferSteps1}
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  updateStatus={updateStatus}
                />

                <Box my={1}>
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
                    />
                  )}
                  {currentStep === 1 && (
                    <LoadingTicketGrid
                      setTickets={setLoadingTickets}
                      currentStep={currentStep}
                      setPrevStep={setPrevStep}
                      transferAssetId={id}
                      transferAssetData={transferAssetData}
                      fetchAssets={fetchAssets}
                      permissions={permissions}
                      setNextStep={setNextStep}
                      setExistingAssets={setExistingAssets}
                      setTransferIsEnded={setTransferIsEnded}
                      updateTransferStatus={updateTransferStatus}
                      handleViewPdf={handleViewPdf}
                      fileDownloading={fileDownloading}
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
                    />
                  )}
                </Box>
              </Box>
            </TabPanel>
          </Paper>
        </div>
      </Fragment>
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
    </>
  );
};

export default TransferAssetDetailPage;
