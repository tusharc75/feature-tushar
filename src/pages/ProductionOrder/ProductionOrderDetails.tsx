import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
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
import { DeleteButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import routes from 'src/components/Helpers/Routes';
import DetailsPage from 'src/components/Shared/DetailsPage';
import Steps, { getIndex } from 'src/components/Steps';
import {
  ACTIVITY_RESOURCE,
  PRODUCTION_ORDER_STATUS,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  productionOrder,
  productionOrderSteps,
  sidebarResource
} from 'src/constants/helpers';
import Invoice from './Invoice';
import LoadingTicket from './LoadingTicket';
import ManageProductionOrder from './ManageProductionOrder';
import Material from './Material';
import WorkOrder from './WorkOrder';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import Step from '../DynamicForm/Step';
import { useTableReducer } from 'src/components/CustomReactTable';

const ProductionOrderDetails = () => {
  const renderedFrom = camelCase(sidebarResource?.productionOrder);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();

  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const { state } = useTableReducer();
  const { selectedRecords } = state;
  const [productionOrderData, setProductionOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [productionOrderFields, setProductionOrderFields] = useState([]);
  const [nextStep, setNextStep] = useState(true);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [locationKeys, setLocationKeys] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [productionOrderProcessSteps, setProductionOrderProcessSteps] = useState(productionOrderSteps);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [resourceData, setResourceData] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);
  const productionOrderProcessStepsNames = React.useMemo(() => {
    return productionOrderProcessSteps.map((item) => item.name);
  }, [productionOrderProcessSteps]);

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
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.productionOrder}`);
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
      fetchProductionOrderData();
      fetchPolicy();
    }
  }, [id]);

  useEffect(() => {
    getResourceFields();
  }, []);

  const getResourceFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.productionOrder}`)
      .then(({ data: { data } }) => {
        setProductionOrderFields(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchProductionOrderData = () => {
    axiosInstance()
      .get(`${routes?.productionOrder?.path}/${id}`)
      .then(({ data: { data } }) => {
        const tempStepList = productionOrderSteps.filter((o) => o.name !== 'Loading Ticket');
        setProductionOrderProcessSteps(tempStepList);
        if (data?.status === PRODUCTION_ORDER_STATUS.completed) {
          setCurrentStep(tempStepList?.length - 1);
        } else {
          setCurrentStep(getIndex(data?.processStatus, tempStepList));
        }

        // if (!data?.customerAccount) {
        //   setProductionOrderProcessSteps(productionOrderSteps.filter((o) => o.name !== 'Loading Ticket'));
        // }
        setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.productionOrder, data));
        setAllowedToDelete(permissions?.productionOrder?.isDelete && checkIsAllowedToDelete(user, sidebarResource.productionOrder, data.owner.optionValue) && data?.canDelete);
        setProductionOrderData({ ...data });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${productionOrder.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(routes?.productionOrder?.path);
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
      fetchProductionOrderData();
    }
  };

  const updateOrderStatus = (status) => {
    axiosInstance()
      .patch(`${productionOrder.api}/status/${productionOrderData._id}`, { status: status })
      .then(({ data: { data } }) => {
        fetchProductionOrderData();
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

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ ...routes?.productionOrder, title: resources?.productionOrder?.titlePlural }, { title: productionOrderData?.productionOrderNumber }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {productionOrderData ? (
              <>
                {permissions?.productionOrder?.isUpdate &&
                  allowedToEdit &&
                  productionOrderData?.status !== PRODUCTION_ORDER_STATUS.completed &&
                  productionOrderData?.processStatus === productionOrderProcessStepsNames[productionOrderProcessStepsNames?.length - 1] && (
                    <ButtonWithPulse
                      variant="outlined"
                      color="default"
                      size="small"
                      onClick={() => {
                        updateOrderStatus(PRODUCTION_ORDER_STATUS.completed);
                      }}
                      aria-controls="action-menu"
                      className="btn-outline-v1"
                    >
                      Close
                    </ButtonWithPulse>
                  )}
                {permissions?.productionOrder?.isUpdate && allowedToEdit && productionOrderData?.status !== PRODUCTION_ORDER_STATUS.completed && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    className={'btn-outline-v1'}
                    size="small"
                    onClick={() => setOpenUpdateDialog(true)}
                  >
                    {isMobile && !isTablet ? <Edit /> : 'Edit'}
                  </Button>
                )}
                {allowedToDelete && (
                  <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                )}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton
              referenceId={productionOrderData?._id}
              resource={ACTIVITY_RESOURCE.productionOrder}
              resourceLabel={productionOrderData?.productionOrderNumber}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>
            Header
          </CustomTab>
          <CustomTab value={1}>
            Details
          </CustomTab>
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 2}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {productionOrderData && productionOrderFields.length ? (
              <DetailsPage data={productionOrderData} fields={productionOrderFields} />
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
            steps={productionOrderProcessSteps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={[PRODUCTION_ORDER_STATUS.completed].includes(productionOrderData?.status)}
            setStepFullScreen={() => setStepFullScreen(true)}
            handleNext={
              productionOrderProcessStepsNames[currentStep] === 'Add'
                ? () => {
                  setNextStep(false);
                  axiosInstance()
                    .get(`/production-order/${productionOrderData?._id}/work-order/validate-work-order`)
                    .then(({ data: { data } }) => {
                      if (data) {
                        setCurrentStep((prevStep) => {
                          const newStep = prevStep + 1;
                          return newStep;
                        });
                      }
                    })
                    .catch((err) => {
                      toastConfig.setToastConfig(err);
                    });
                }
                : null
            }
            updateStatus={(step: number) => {
              dynamicFormUpdateProcessStatus(sidebarResource.productionOrder, productionOrderProcessStepsNames[step], id);
            }}
          />
          <ContentFullScreen title={productionOrderProcessStepsNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            {productionOrderProcessStepsNames[currentStep] === 'Add' && productionOrderData && (
              <Material
                productionOrderData={productionOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-1`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit && permissions?.productionOrder?.isUpdate ? true : false}
                allowedToDelete={allowedToDelete}
                updateOrderStatus={updateOrderStatus}
              />
            )}
            {productionOrderProcessStepsNames[currentStep] === 'Work Order' && productionOrderData && (
              <WorkOrder
                productionOrderData={productionOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-2`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit && permissions?.productionOrder?.isUpdate ? true : false}
                setCurrentStep={setCurrentStep}
              />
            )}
            {productionOrderProcessStepsNames[currentStep] === 'Loading Ticket' && productionOrderData && (
              <LoadingTicket
                productionOrderData={productionOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-2`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit && permissions?.productionOrder?.isUpdate ? true : false}
              />
            )}
            {productionOrderProcessStepsNames[currentStep] === 'Final Slip' && productionOrderData && (
              <Invoice productionOrderData={productionOrderData} renderedFrom={`${renderedFrom}_grid-2`} stepFullScreen={stepFullScreen} />
            )}
          </ContentFullScreen>
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 2}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.productionOrder}
                  data={productionOrderData}
                  allowedToEdit={permissions?.productionOrder?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${selectedRecords?.length ? `${resources?.productionOrder?.titleSingular?.toLowerCase()} : ${productionOrderData?.productionOrderNumber}` : `selected ${resources?.productionOrder?.titlePlural?.toLowerCase()}`} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageProductionOrder
          isClone={false}
          productionOrderId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchProductionOrderData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </Box>
  );
};

export default ProductionOrderDetails;
