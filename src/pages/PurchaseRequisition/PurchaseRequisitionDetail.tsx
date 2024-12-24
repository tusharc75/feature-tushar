import { Box, Button, Grid } from '@mui/material';
import { Edit } from '@mui/icons-material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityButton from 'src/components/Activity/ActivityButton';
import ContentFullScreen from 'src/components/ContentFullScreen';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import Steps, { getIndex } from 'src/components/Steps';
import {
  ACTIVITY_RESOURCE,
  MATERIAL_TYPE,
  PURCHASE_REQUISITION_STATUS,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  purchaseRequisitionSteps,
  sidebarResource
} from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import ShowDoa from '../DoaSetupNew/ShowDoa';
import ManagePurchaseOrder from '../PurchaseOrder/ManagePurchaseOrder';
import ManagePurchaseRequisition from './ManagePurchaseRequisition';
import Material from './Material';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import Step from '../DynamicForm/Step';

const PurchaseRequisitionDetail = () => {
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
  const [showOrderDialog, setOrderDialog] = useState({ open: false });
  const [nextStep, setNextStep] = useState(true);
  const [nextStepToolTip, setNextStepToolTip] = useState(null);
  const [prevStep, setPrevStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [stepList, setStepList] = useState(purchaseRequisitionSteps);
  const [DOAData, setDOAData] = useState(null);
  const {
    state: { permissions, user, resources }
  }: any = useData();
  const [resourceData, setResourceData] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);

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
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.purchaseRequisition}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.purchaseRequisition}`)
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
    } else {
      setStepList(purchaseRequisitionSteps?.filter((e) => e.name !== 'DOA'));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.purchaseRequisition.path}/${id}`);

      var tempStepList = purchaseRequisitionSteps;
      if (!data?.doaSetup) {
        tempStepList = purchaseRequisitionSteps?.filter((e) => e.name !== 'DOA');
      }
      setStepList(tempStepList);
      setCurrentStep(getIndex(data?.processStatus, tempStepList));
      setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.purchaseRequisition, data));
      setAllowedToDelete(data?.owner?.optionValue === user?.user?._id);
      setAllowedToDelete(
        permissions?.purchaseRequisition?.isDelete && checkIsAllowedToDelete(user, sidebarResource.purchaseRequisition, data.owner.optionValue)
      );
      setPurchaseRequisitionData(data);
      setCustomizedRoutes([
        { ...routes.purchaseRequisition, title: resources?.purchaseRequisition?.titlePlural },
        { title: data?.purchaseRequisitionNumber }
      ]);

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

  const handleConvertSuccess = (data: any) => {
    setOrderDialog({ open: false });
    axiosInstance()
      .put(`${routes?.purchaseRequisition?.path}/update-converted-purchase-requisition`, {
        _id: id,
        purchaseOrder: data?._id,
        status: PURCHASE_REQUISITION_STATUS.converted
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
              {purchaseRequisitionData?.material?.length > 0 && (
                <Button
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  disabled={purchaseRequisitionData?.status === PURCHASE_REQUISITION_STATUS.converted ? true : false}
                  className="btn-outline-v1"
                  onClick={() => {
                    setOrderDialog({ open: true });
                  }}
                  style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                >
                  {purchaseRequisitionData?.status === PURCHASE_REQUISITION_STATUS.converted ? PURCHASE_REQUISITION_STATUS.converted : 'Convert'}
                </Button>
              )}
              {permissions?.purchaseRequisition?.isUpdate && allowedToEdit && (
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                  {isMobile && !isTablet ? <Edit /> : 'Edit'}
                </Button>
              )}
              {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
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
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 2}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
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
        <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
          <TabPanel value={tabValue} index={1}>
            <Grid item xs={12} sm={12} md={12} lg={12}>
              {!purchaseRequisitionData ? (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                  <CommonSkeleton lenArray={[...Array(7).keys()]} />
                </Grid>
              ) : (
                <>
                  {stepList[currentStep]?.name === 'DOA' && (
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
                      nextStepToolTip={nextStepToolTip}
                      steps={stepList}
                      currentStep={currentStep}
                      setCurrentStep={setCurrentStep}
                      isPrevStep={prevStep}
                      stepFullScreen={stepFullScreen}
                      setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
                      isStepEnded={[PURCHASE_REQUISITION_STATUS.converted].includes(purchaseRequisitionData?.status)}
                      updateStatus={(step: number) => {
                        dynamicFormUpdateProcessStatus(sidebarResource.purchaseRequisition, stepList[step]?.name, id);
                      }}
                    />
                    {stepList[currentStep]?.name === 'Add' && purchaseRequisitionData && (
                      <Material
                        allowedToEdit={allowedToEdit}
                        allowedToAddMaterial={true}
                        purchaseRequisitionData={purchaseRequisitionData}
                        fetchpurchaseRequisitionData={fetchData}
                        updateDOASetup={updateDOASetup}
                        currentStep={stepList[currentStep]?.name}
                        setNextStep={setNextStep}
                        setPrevStep={setPrevStep}
                        setNextStepToolTip={setNextStepToolTip}
                      />
                    )}
                    {stepList[currentStep]?.name === 'DOA' && purchaseRequisitionData && (
                      <Material
                        allowedToEdit={allowedToEdit}
                        allowedToAddMaterial={false}
                        purchaseRequisitionData={purchaseRequisitionData}
                        fetchpurchaseRequisitionData={fetchData}
                        currentStep={stepList[currentStep]?.name}
                        DOAData={DOAData}
                        fetchParentData={fetchData}
                        setNextStep={setNextStep}
                        setPrevStep={setPrevStep}
                        setNextStepToolTip={setNextStepToolTip}
                      />
                    )}
                    {stepList[currentStep]?.name === 'End' && purchaseRequisitionData && (
                      <Material
                        allowedToEdit={allowedToEdit}
                        allowedToAddMaterial={false}
                        purchaseRequisitionData={purchaseRequisitionData}
                        fetchpurchaseRequisitionData={fetchData}
                        currentStep={stepList[currentStep]?.name}
                        setNextStep={setNextStep}
                        setPrevStep={setPrevStep}
                        setNextStepToolTip={setNextStepToolTip}
                      />
                    )}
                  </Grid>
                </>
              )}
            </Grid>
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
                  resource={sidebarResource.purchaseRequisition}
                  data={purchaseRequisitionData}
                  allowedToEdit={permissions?.purchaseRequisition?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showOrderDialog.open && (
        <ManagePurchaseOrder
          isClone={false}
          purchaseOrderId={null}
          onClose={() => setOrderDialog({ open: false })}
          onSuccess={(data: any) => {
            handleConvertSuccess(data);
          }}
          products={purchaseRequisitionData?.material
            ?.filter((item: any) => item?.type == MATERIAL_TYPE.product)
            ?.map((e) => {
              return { ...e, product: e.materialId };
            })}
          services={purchaseRequisitionData?.material
            ?.filter((item: any) => item?.type == MATERIAL_TYPE.service)
            ?.map((e) => {
              return { ...e, service: e.materialId };
            })}
          currency={purchaseRequisitionData.currency}
          warehouseId={purchaseRequisitionData?.warehouse?.optionValue}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.purchaseRequisition?.titleSingular?.toLowerCase()} : ${purchaseRequisitionData?.purchaseRequisitionNumber} ?`}
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
