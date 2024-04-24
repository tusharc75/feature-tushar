import { Box, Button, Grid, Tab, Tabs } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import { ACTIVITY_RESOURCE, checkSuperAdminAccess, purchaseRequisitionSteps, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import TabPanel from '../../components/TabPanel';
import ManagePurchaseOrder from '../PurchaseOrder/ManagePurchaseOrder';
import ManagePurchaseRequisition from './ManagePurchaseRequisition';
import Material from './Material';
import Steps, { getIndex } from 'src/components/Steps';
import ContentFullScreen from 'src/components/ContentFullScreen';
import ShowDoa from '../DoaSetupNew/ShowDoa';

const PurchaseRequisitionDetail = () => {
  const renderedFrom = camelCase(routes?.purchaseRequisition.title);
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.purchaseRequisition]);
  const [purchaseRequisitionData, setPurchaseRequisitionData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [showOrderDialog, setOrderDialog] = useState({ open: false, products: [], services: [] });
  const [nextStep, setNextStep] = useState(true);
  const [prevStep, setPrevStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [stepList, setStepList] = useState(purchaseRequisitionSteps);
  const [stepNames, setStepNames] = useState(purchaseRequisitionSteps.map((item) => item.name));
  const [DOAData, setDOAData] = useState(null);
  const {
    state: { permissions, user }
  }: any = useData();

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get('/field?resource=Purchase Requisition')
      .then(({ data }) => {
        setFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const updateDOASetup = (doaSetup) => {
    if (doaSetup) {
      setStepList(purchaseRequisitionSteps);
      setStepNames(purchaseRequisitionSteps?.map((item) => item.name));
    } else {
      setStepList(purchaseRequisitionSteps?.filter((e) => e.name !== 'DOA'));
      setStepNames(purchaseRequisitionSteps?.filter((e) => e.name !== 'DOA').map((item) => item.name));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.purchaseRequisition.path}/${id}`);
      var isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      if (checkSuperAdminAccess(user, sidebarResource.purchaseRequisition)) {
        isAllowedToEdit = true;
      }
      var tempStepList = purchaseRequisitionSteps;
      if (!data?.doaSetup) {
        tempStepList = purchaseRequisitionSteps?.filter((e) => e.name !== 'DOA');
      }
      setStepList(tempStepList);
      setStepNames(tempStepList?.map((item) => item.name));

      setCurrentStep(getIndex(data?.processStatus, purchaseRequisitionSteps));
      setAllowedToEdit(isAllowedToEdit);
      setAllowedToDelete(data?.owner?.optionValue === user?.user?._id);
      setPurchaseRequisitionData(data);
      setCustomizedRoutes([routes.purchaseRequisition, { title: data?.purchaseRequisitionNumber }]);

      if (data?.doaSetup) {
        const doaResponse: any = await axiosInstance().get(`${routes.resourceDoaRequest.path}/${data?._id}?entity=${data?.entity}`);
        if (doaResponse?.data?.data) {
          setDOAData(doaResponse?.data?.data);
        }
      }

      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.purchaseRequisition?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);

          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.purchaseRequisition.path}`);
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

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  const handleManagePuchhaseOrderDialog = () => {
    const products = purchaseRequisitionData?.material?.filter((item: any) => item?.type == 'product');
    const services = purchaseRequisitionData?.material?.filter((item: any) => item?.type == 'service');
    setOrderDialog({ open: true, products: products, services: services });
  };

  const handleConvertSuccess = (data: any) => {
    setOrderDialog({ open: false, products: [], services: [] });
    axiosInstance()
      .put(`${routes?.purchaseRequisition?.path}/update-converted-purchase-requisition`, {
        _id: id,
        purchaseOrder: data?._id,
        status: 'Converted'
      })
      .then(({ data }) => {
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `${sidebarResource.purchaseOrder} has been created successfully`
        });
      })
      .catch((err) => {
        fetchData();
        // setShowConfirmBox(false);
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
            <>
              <Button
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                disabled={purchaseRequisitionData?.status === 'Converted' ? true : false}
                className="btn-outline-v1"
                onClick={handleManagePuchhaseOrderDialog}
                style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
              >
                {purchaseRequisitionData?.status === 'Converted' ? 'Converted' : 'Convert'}
              </Button>
              {permissions?.purchaseRequisition?.isUpdate && allowedToEdit && (
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                  {isMobile && !isTablet ? <Edit /> : 'Edit'}
                </Button>
              )}
              {permissions?.purchaseRequisition?.isDelete && allowedToDelete && (
                <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
              )}
              <ActivityButton
                referenceId={purchaseRequisitionData?._id}
                resource={ACTIVITY_RESOURCE.purchaseRequisition}
                resourceLabel={purchaseRequisitionData?.purchaseRequisitionNumber}
              />
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
              height: 0
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
            value={0}
            aria-controls="a11y-tabpanel-0"
            id="a11y-tab-0"
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
              </div>
            }
            value={1}
            aria-controls="a11y-tabpanel-1"
            id="a11y-tab-1"
          />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !fields?.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={purchaseRequisitionData} fields={fields} />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            {!purchaseRequisitionData ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <>
                {stepNames[currentStep] === 'DOA' && (
                  <Box
                    style={{
                      marginLeft: 'auto',
                      maxWidth: 'max-content',
                      marginTop: '-30px'
                    }}
                  >
                    <ShowDoa status={purchaseRequisitionData?.doa_status} data={DOAData} />
                  </Box>
                )}
                <Grid item xs={12} sm={12} md={12} lg={12}>
                  <Steps
                    isNextStep={false}
                    nextStep={nextStep}
                    steps={stepList}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                    isStepEnded={false}
                    isPrevStep={prevStep}
                    setStepFullScreen={() => setStepFullScreen(true)}
                  />
                  <ContentFullScreen title={purchaseRequisitionSteps[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                    {stepNames[currentStep] === 'Add' && purchaseRequisitionData && (
                      <Material
                        allowedToEdit={allowedToEdit}
                        allowedToAddMaterial={true}
                        purchaseRequisitionData={purchaseRequisitionData}
                        updateDOASetup={updateDOASetup}
                        currentStep={stepNames[currentStep]}
                        setNextStep={setNextStep}
                        setPrevStep={setPrevStep}
                      />
                    )}
                    {stepNames[currentStep] === 'DOA' && purchaseRequisitionData && (
                      <Material
                        allowedToEdit={allowedToEdit}
                        allowedToAddMaterial={false}
                        purchaseRequisitionData={purchaseRequisitionData}
                        currentStep={stepNames[currentStep]}
                        DOAData={DOAData}
                        fetchParentData={fetchData}
                        setNextStep={setNextStep}
                        setPrevStep={setPrevStep}
                      />
                    )}
                    {stepNames[currentStep] === 'END' && purchaseRequisitionData && (
                      <Material
                        allowedToEdit={allowedToEdit}
                        allowedToAddMaterial={false}
                        purchaseRequisitionData={purchaseRequisitionData}
                        currentStep={stepNames[currentStep]}
                        setNextStep={setNextStep}
                        setPrevStep={setPrevStep}
                      />
                    )}
                  </ContentFullScreen>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>
      </Box>
      {showOrderDialog.open && (
        <ManagePurchaseOrder
          isClone={false}
          purchaseOrderId={null}
          onClose={() => setOrderDialog((prevState) => ({ ...prevState, open: false }))}
          onSuccess={(data: any) => {
            handleConvertSuccess(data);
          }}
          products={showOrderDialog?.products?.map((e) => {
            return { product: e._id, unit: e.unit, qty: e.qty };
          })}
          services={showOrderDialog?.services?.map((e) => {
            return { service: e._id, unit: e.unit, qty: e.qty };
          })}
          currency={purchaseRequisitionData.currency}
          warehouseId={purchaseRequisitionData?.warehouse?.optionValue}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes?.purchaseRequisition?.title?.toLowerCase()} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManagePurchaseRequisition
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

export default PurchaseRequisitionDetail;
