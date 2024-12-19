import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import React, { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import ButtonWithPulse from 'src/components/ButtonWithPulse';
import ContentFullScreen from 'src/components/ContentFullScreen';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import Steps, { getIndex } from 'src/components/Steps';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import {
  ACTIVITY_RESOURCE,
  INVOICE_STATUS,
  SALES_ORDER_STATUS,
  checkIsAllowedToEdit,
  salesOrder,
  salesOrderProcessSteps,
  sidebarResource,
  tabIndexValue
} from '../../constants/helpers';
import Invoice from './Invoice';
import ManageSalesOrderDialog from './ManageSalesOrderDialog';
import Material from './Material';
import Process from './Process';
import SalesOrderView from './View';
import LoadingTicket from './LoadingTicket';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import Step from 'src/pages/DynamicForm/Step';

const SalesOrderDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [loading, setLoading] = useState(false);
  const [salesOrderData, setSalesOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [salesOrderFields, setSalesOrderFields] = useState([]);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [nextStep, setNextStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [showClosedConfirmBox, setShowClosedConfirmBox] = useState(false);
  const [steps, setSteps] = useState([]);
  const [resourceData, setResourceData] = useState(null);

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=Product&view=true`)
      .then(({ data: { data } }) => {
        if (data?.some((d) => d?.fieldData?.fieldName === 'procurementMethod')) {
          setSteps(salesOrderProcessSteps);
        } else {
          setSteps(salesOrderProcessSteps?.filter((s) => s.name !== 'Process' && s.name !== 'Loading'));
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  const salesOrderProcessStepsNames = React.useMemo(() => {
    return steps.map((item) => item.name);
  }, [steps]);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  useEffect(() => {
    if (id && steps?.length) {
      getFields();
      fetchSalesOrderData();
      fetchPolicy();
    }
  }, [id, steps]);

  const getFields = async () => {
    try {
      const response: any = await axiosInstance().get('/field?resource=Sales Order');
      setSalesOrderFields(response?.data?.data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.salesOrder}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchSalesOrderData = async () => {
    setLoading(true);
    try {
      let data;
      const response: any = await axiosInstance().get(`${salesOrder.api}/${id}`);
      data = response?.data?.data;
      if ([INVOICE_STATUS.invoiced, INVOICE_STATUS.closed]?.includes(data?.status)) {
        setCurrentStep(steps?.length - 1);
      } else {
        setCurrentStep(getIndex(data?.processStatus, steps));
      }

      setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.salesOrder, data));
      setSalesOrderData(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${salesOrder.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes.salesOrder.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const updateJobStatus = (status) => {
    axiosInstance()
      .patch(`${salesOrder.api}/status/${salesOrderData._id}`, { status: status })
      .then(({ data: { data } }) => {
        fetchSalesOrderData();
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
          <CustomBreadCrumbs
            routes={[{ ...routes.salesOrder, title: resources?.salesOrder?.titlePlural }, { title: `${salesOrderData?.salesOrderNo}` }]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {salesOrderData ? (
              <>
                {permissions?.salesOrder?.isUpdate &&
                  [SALES_ORDER_STATUS.readyToInvoice, SALES_ORDER_STATUS.invoiced].includes(salesOrderData?.status) && (
                    <ButtonWithPulse
                      variant={'outlined'}
                      color="default"
                      size="small"
                      onClick={() => {
                        setShowClosedConfirmBox(true);
                      }}
                      className={'btn-outline-v1'}
                    >
                      Close
                    </ButtonWithPulse>
                  )}
                {permissions?.salesOrder?.isUpdate && [SALES_ORDER_STATUS.closed].includes(salesOrderData?.status) && (
                  <ThemeButton
                    variant="contained"
                    iconForMobile={false}
                    size="small"
                    onClick={() => {
                      if (salesOrderData?.invoice) {
                        updateJobStatus(SALES_ORDER_STATUS.invoiced);
                      } else {
                        updateJobStatus(SALES_ORDER_STATUS.readyToInvoice);
                      }
                    }}
                  >
                    Re-Open
                  </ThemeButton>
                )}
                {permissions?.salesOrder?.isUpdate && allowedToEdit && ![SALES_ORDER_STATUS.closed].includes(salesOrderData?.status) && (
                  <Button
                    className={'btn-outline-v1'}
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    size="small"
                    onClick={handleOpenUpdateDialog}
                  >
                    {isMobile && !isTablet ? <Edit /> : 'Edit'}
                  </Button>
                )}

                {permissions?.salesOrder?.isDelete && salesOrderData?.canDelete && (
                  <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                )}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton referenceId={salesOrderData?._id} resource={ACTIVITY_RESOURCE.salesOrder} resourceLabel={salesOrderData?.salesOrderNo} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 2}>{tab?.tabName}</CustomTab>)}
          {!(isMobile && !isTablet) && <CustomTab value={tabIndexValue(resourceData, 2)}>Views</CustomTab>}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !salesOrderFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <>
                <DetailsPage data={salesOrderData} fields={salesOrderFields} />
              </>
            )}
          </Box>
        </TabPanel>
        <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
          <TabPanel value={tabValue} index={1}>
            <Steps
              isNextStep={false}
              nextStep={nextStep}
              steps={steps}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isStepEnded={[SALES_ORDER_STATUS.invoiced, SALES_ORDER_STATUS.closed].includes(salesOrderData?.status)}
              stepFullScreen={stepFullScreen}
              setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
              updateStatus={(step: number) => {
                dynamicFormUpdateProcessStatus(sidebarResource.salesOrder, salesOrderProcessStepsNames[step], id);
              }}
            />
            {salesOrderProcessStepsNames[currentStep] === salesOrderProcessSteps[0].name && salesOrderData && (
              <Material
                salesOrderData={salesOrderData}
                setNextStep={setNextStep}
                stepFullScreen={stepFullScreen}
                fetchSalesOrderData={fetchSalesOrderData}
                updateJobStatus={updateJobStatus}
                allowedToEdit={allowedToEdit && !salesOrderData?.quotation}
              />
            )}
            {salesOrderProcessStepsNames[currentStep] === salesOrderProcessSteps[1].name && salesOrderData && (
              <Process salesOrderData={salesOrderData} setNextStep={setNextStep} stepFullScreen={stepFullScreen} />
            )}
            {salesOrderProcessStepsNames[currentStep] === salesOrderProcessSteps[2].name && salesOrderData && (
              <LoadingTicket salesOrderData={salesOrderData} setNextStep={setNextStep} stepFullScreen={stepFullScreen} />
            )}
            {salesOrderProcessStepsNames[currentStep] === salesOrderProcessSteps[3].name && salesOrderData && (
              <Invoice salesOrderData={salesOrderData} setNextStep={setNextStep} updateJobStatus={updateJobStatus} stepFullScreen={stepFullScreen} />
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
                  resource={sidebarResource.salesOrder}
                  data={salesOrderData}
                  allowedToEdit={permissions?.salesOrder?.isUpdate}
                />
              </TabPanel>
            );
          })}
        <TabPanel value={tabValue} index={tabIndexValue(resourceData, 2)}>
          {salesOrderData && <SalesOrderView salesOrderData={salesOrderData} />}
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.salesOrder?.titleSingular?.toLowerCase()} : ${salesOrderData?.salesOrderNo} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {showClosedConfirmBox && (
        <ConfirmationDialog
          open={showClosedConfirmBox}
          message={`Are you sure you want to close ?`}
          onClose={() => {
            setShowClosedConfirmBox(false);
          }}
          onOk={() => {
            updateJobStatus(SALES_ORDER_STATUS.closed);
            setShowClosedConfirmBox(false);
          }}
        />
      )}
      {openUpdateDialog && (
        <ManageSalesOrderDialog
          isClone={false}
          open={openUpdateDialog}
          salesOrderId={id}
          salesOrderData={salesOrderData}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchSalesOrderData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </Box>
  );
};

export default SalesOrderDetails;
