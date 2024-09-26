import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import { RiFlowChart } from 'react-icons/ri';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import Steps, { getIndex } from 'src/components/Steps';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import ContentFullScreen from '../../components/ContentFullScreen';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import {
  ACTIVITY_RESOURCE,
  PURCHASE_ORDER_STATUS,
  checkIsAllowedToEdit,
  purchaseOrder,
  purchaseOrderSteps,
  sidebarResource
} from '../../constants/helpers';
import Step from '../DynamicForm/Step';
import Invoice from './Invoice';
import ManagePurchaseOrder from './ManagePurchaseOrder';
import Product from './Product';
import ReceivingAsset from './ReceivingAsset';
import PurchaseOrderViews from './RoadMapViews';
import ButtonWithPulse from 'src/components/ButtonWithPulse';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';
import { generateAddManualEntry } from 'src/pages/PurchaseOrder/walkmeSteps';

const PurchaseOrderDetailsPage = () => {
  const walkmeInstance = useGetWalkmeInstance();
  const renderedFrom = camelCase(routes?.purchaseOrder.title);
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const {
    state: { user, permissions }
  }: any = useData();

  const [loadingPurchaseOrder, setLoadingPurchaseOrder] = useState(false);
  const [purchaseOrderData, setPurchaseOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [purchaseOrderFields, setPurchaseOrderFields] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);

  const [tabValue, setTabValue] = useState(Number(parsed?.tab || 0));
  const [nextStep, setNextStep] = useState(true);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [resourceData, setResourceData] = useState(null);

  const purchaseOrderStepNames = React.useMemo(() => {
    return purchaseOrderSteps.map((item) => item.name);
  }, []);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.replace(`?tab=${newValue}`);
  };

  useEffect(() => {
    if (parsed) {
      history.replace(`?tab=${tabValue}`);
    }
  }, []);

  useEffect(() => {
    if (id) {
      getPurchaseOrderFields();
      fetchPurchaseOrderData();
      fetchPolicy();
    }
    if (walkmeInstance && walkmeInstance.type === 'flow') {
      walkmeInstance.instance.push(generateAddManualEntry(true).steps);
      // immediately start next step
      walkmeInstance.handleNext();
    }
  }, [id]);

  const fetchPurchaseOrderData = async () => {
    setLoadingPurchaseOrder(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${purchaseOrder.api}/${id}`);

      setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.purchaseOrder, data));
      setPurchaseOrderData(data);
      if (data?.status === PURCHASE_ORDER_STATUS.closed) {
        setCurrentStep(purchaseOrderSteps?.length - 1);
      } else {
        setCurrentStep(getIndex(data?.processStatus, purchaseOrderSteps));
      }
      setLoadingPurchaseOrder(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getPurchaseOrderFields = () => {
    axiosInstance()
      .get('/field?resource=Purchase Order')
      .then(({ data }) => {
        setPurchaseOrderFields(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.purchaseOrder}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${purchaseOrder.api}/remove`, { ids: [] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes.purchaseOrder.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const updateStatus = (status) => {
    axiosInstance().patch(`${purchaseOrder.api}/status/${id}`, { status: status }).then(({ data: { data } }) => {
      fetchPurchaseOrderData();
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: `Status changed to ${status}`
      });
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };

  const checkReceivedProduct = (data) => {
    if (data?.length && purchaseOrderData?.status !== PURCHASE_ORDER_STATUS.closed) {
      var isCompleteReceived = false;
      var isPartialReceived = data?.some((e) => e?.actualReceived);
      if (data?.filter((e) => e?.qty - ((e?.actualReceived || 0) + (e?.rejectQuantity || 0)) > 0).length > 0) {
        isCompleteReceived = false;
      } else {
        isCompleteReceived = true;
      }
      if (isPartialReceived && !isCompleteReceived && purchaseOrderData?.status !== PURCHASE_ORDER_STATUS.partialReceived) {
        updateStatus(PURCHASE_ORDER_STATUS.partialReceived);
      }
      if (isCompleteReceived && purchaseOrderData?.status !== PURCHASE_ORDER_STATUS.received) {
        updateStatus(PURCHASE_ORDER_STATUS.received);
      }
      if (isCompleteReceived === false && isPartialReceived === false && purchaseOrderData?.status !== PURCHASE_ORDER_STATUS.open) {
        updateStatus(PURCHASE_ORDER_STATUS.open);
      }
    }
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.purchaseOrder, { title: `${purchaseOrderData?.purchaseOrderNumber}` }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.purchaseOrder?.isUpdate &&
              allowedToEdit &&
              !purchaseOrderData?.deleted &&
              [PURCHASE_ORDER_STATUS.received].includes(purchaseOrderData?.status) && (
                <Fragment>
                  <ButtonWithPulse
                    color="default"
                    variant={'outlined'}
                    className={'btn-outline-v1'}
                    onClick={() => updateStatus(PURCHASE_ORDER_STATUS.closed)}
                  >
                    Close
                  </ButtonWithPulse>
                </Fragment>
              )}
            {purchaseOrderData?.deleted ? null : ![PURCHASE_ORDER_STATUS.closed].includes(purchaseOrderData?.status) ? (
              <HtmlTooltip
                title={permissions?.purchaseOrder?.isUpdate && allowedToEdit ? '' : `Owner or Collaborator can edit ${routes.purchaseOrder.title}`}
              >
                <span>
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    className={'btn-outline-v1'}
                    onClick={handleOpenUpdateDialog}
                    disabled={permissions?.purchaseOrder?.isUpdate && allowedToEdit ? false : true}
                  >
                    {isMobile && !isTablet ? <Edit /> : 'Edit'}
                  </Button>
                </span>
              </HtmlTooltip>
            ) : (
              <HtmlTooltip
                title={permissions?.purchaseOrder?.isUpdate && allowedToEdit ? '' : `Owner or Collaborator can reopen ${routes.purchaseOrder.title}`}
              >
                <span>
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    className={'btn-outline-v1'}
                    onClick={() => updateStatus(PURCHASE_ORDER_STATUS.received)}
                    disabled={permissions?.purchaseOrder?.isUpdate && allowedToEdit ? false : true}
                  >
                    {isMobile && !isTablet ? <Edit /> : 'Re-Open'}
                  </Button>
                </span>
              </HtmlTooltip>
            )}
            <ActivityButton
              referenceId={purchaseOrderData?._id}
              resource={ACTIVITY_RESOURCE.purchaseOrder}
              resourceLabel={purchaseOrderData?.purchaseOrderNumber}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>
            <FaWpforms className="mr-1" fontSize="inherit" /> Header
          </CustomTab>
          {purchaseOrderData?.deleted ? null : (
            <CustomTab value={1}>
              <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
            </CustomTab>
          )}
          {purchaseOrderData?.deleted ? null : (
            <CustomTab value={2}>
              <BiFoodMenu className="mr-1" fontSize="inherit" /> Invoice
            </CustomTab>
          )}
          {purchaseOrderData?.deleted || (isMobile && !isTablet) ? null : (
            <CustomTab value={3}>
              <RiFlowChart className="mr-1" fontSize="inherit" /> Views
            </CustomTab>
          )}
          {resourceData &&
            resourceData?.tabs?.length &&
            resourceData?.tabs?.map((tab, i) => (
              <CustomTab value={i + 4}>
                <BiFoodMenu className="mr-1" fontSize="inherit" />
                {tab?.tabName}
              </CustomTab>
            ))}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loadingPurchaseOrder || !purchaseOrderFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={purchaseOrderData} fields={purchaseOrderFields} />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            {!purchaseOrderData || !purchaseOrderFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <Steps
                  isNextStep={false}
                  nextStep={nextStep}
                  steps={purchaseOrderSteps}
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  isStepEnded={[PURCHASE_ORDER_STATUS.closed].includes(purchaseOrderData?.status)}
                  setStepFullScreen={() => setStepFullScreen(true)}
                  updateStatus={(step: number) => {
                    dynamicFormUpdateProcessStatus(sidebarResource.purchaseOrder, purchaseOrderStepNames[step], id);
                  }}
                />
                <ContentFullScreen title={purchaseOrderStepNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                  {currentStep === 0 && (
                    <Product
                      purchaseOrderData={purchaseOrderData}
                      setNextStep={setNextStep}
                      renderedFrom={`${renderedFrom}_grid-1`}
                      allowedToEdit={allowedToEdit}
                      checkReceivedProduct={checkReceivedProduct}
                    />
                  )}
                  {currentStep === 1 && (
                    <ReceivingAsset
                      purchaseOrderData={purchaseOrderData}
                      renderedFrom={`${renderedFrom}_grid-4`}
                      stepFullScreen={stepFullScreen}
                      allowedToEdit={allowedToEdit}
                      checkReceivedProduct={checkReceivedProduct}
                    />
                  )}
                </ContentFullScreen>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Box>{purchaseOrderData && <Invoice allowedToEdit={allowedToEdit} purchaseOrderData={purchaseOrderData} />}</Box>
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Box>{purchaseOrderData && <PurchaseOrderViews purchaseOrderData={purchaseOrderData} />}</Box>
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 4}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.purchaseOrder}
                  data={purchaseOrderData}
                  allowedToEdit={permissions?.purchaseOrder?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.purchaseOrder?.title} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManagePurchaseOrder
          isClone={false}
          purchaseOrderId={id}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchPurchaseOrderData();
          }}
          currency={user.user?.brandCurrency || null}
        />
      )}
    </Box>
  );
};

export default PurchaseOrderDetailsPage;
