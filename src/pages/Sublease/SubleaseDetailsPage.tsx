import { Box, Button, Grid } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import React, { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import ButtonWithPulse from 'src/components/ButtonWithPulse';
import ContentFullScreen from 'src/components/ContentFullScreen';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
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
  DELIVERY_TICKET_TYPE,
  SUBLEASE_STATUS,
  SUBLEASE_TYPE,
  checkIsAllowedToEdit,
  sidebarResource,
  sublease,
  sublease_InterCompany_Steps,
  sublease_Vendor_Steps
} from '../../constants/helpers';
import Invoices from '../GenerateInvoice/InvoiceDialog/Invoices';
import LoadingTicket from './DeliveryTicket';
import ManageSublease from './ManageSublease';
import Productpackage from './Productpackage';
import SerializedAsset from './SerializedAsset';
import Slip from './Slip';
import SubleaseAsset from './SubleaseAsset';
import Tickets from './Tickets';
import Receiving from 'src/pages/Sublease/Receiving';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import Step from 'src/pages/DynamicForm/Step';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';
import {
  generateAddExistingProduct,
  generateAddStepEditProduct,
  generateReceiveStepReceive,
  generateStepSendToSupplier,
  nextButtonStep
} from 'src/pages/Sublease/walkmeSteps';

const SubleaseDetailsPage = () => {
  const walkmeInstance = useGetWalkmeInstance();
  const renderedFrom = camelCase(routes?.sublease.title);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const {
    state: { user, permissions }
  }: any = useData();

  const [subleaseSteps, setSubleaseSteps] = useState([]);
  const [subleaseStepsNames, setSubleaseStepsNames] = useState([]);

  const [subleaseData, setSubleaseData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [isProcessor, setIsProcessor] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [nextStep, setNextStep] = useState(true);

  const [tabValue, setTabValue] = useState(Number(parsed?.tab || 0));
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [nextStepToolTip, setNextStepToolTip] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);
  const [resourceData, setResourceData] = useState(null);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.replace(`?tab=${newValue}`);
  };

  const updateStatus = (status) => {
    axiosInstance()
      .put(`${sublease.api}/${id}/status`, {
        status: status
      })
      .then(({ data }) => {
        fetchData();
      })
      .catch((error) => {});
  };

  useEffect(() => {
    if (walkmeInstance && walkmeInstance.type === 'flow') {
      walkmeInstance.instance.insertAtCurrentIndex([
        ...generateAddExistingProduct(false).steps,
        ...generateAddStepEditProduct(0, false).steps,
        nextButtonStep(false),
        ...generateReceiveStepReceive(0, false).steps,
        nextButtonStep(false),
        ...generateStepSendToSupplier(0).steps
      ]);
      walkmeInstance.handleNext();
    }
  }, [walkmeInstance]);

  useEffect(() => {
    if (parsed) {
      history.replace(`?tab=${tabValue}`);
    }
  }, []);

  useEffect(() => {
    getFields();
    fetchData();
    fetchPolicy();
  }, [id]);

  const getFields = () => {
    axiosInstance()
      .get('/field?resource=Sublease')
      .then(({ data }) => {
        data?.data?.map((o) => {
          if (o?.fieldData?.fieldName === 'status') {
            setStatusOptions([...o.fieldData.option?.filter((e) => ![SUBLEASE_STATUS.closed].includes(e.optionLabel))]);
            return true;
          }
        });
        setFields(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.sublease}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${sublease.api}/${id}`);
      const subleaseSteps = data?.type === SUBLEASE_TYPE.vendor ? sublease_Vendor_Steps : sublease_InterCompany_Steps;
      setSubleaseSteps(subleaseSteps);
      setSubleaseStepsNames(subleaseSteps.map((item) => item.name));
      if (data?.status === SUBLEASE_STATUS.closed) {
        setCurrentStep(subleaseSteps?.length - 1);
      } else {
        setCurrentStep(getIndex(data?.processStatus, subleaseSteps));
      }
      var isAllowedToEdit = checkIsAllowedToEdit(user, sidebarResource.sublease, data);
      const isProcessorToEdit = [data.processor].some((d) => d?.optionValue === user?.user?._id);
      if (data.status === SUBLEASE_STATUS.closed) {
        isAllowedToEdit = false;
      }
      setAllowedToEdit(isAllowedToEdit);
      setIsProcessor(isProcessorToEdit);
      setSubleaseData(data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${sublease.api}/remove`, { ids: [] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes.sublease.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.sublease, { title: subleaseData?.subleaseName }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.sublease?.isUpdate &&
              allowedToEdit &&
              subleaseData?.canComplete &&
              ![SUBLEASE_STATUS.closed].includes(subleaseData?.status) && (
                <ButtonWithPulse
                  variant={'outlined'}
                  color="default"
                  size="small"
                  onClick={() => updateStatus(SUBLEASE_STATUS.closed)}
                  className={'btn-outline-v1'}
                >
                  Close
                </ButtonWithPulse>
              )}
            {permissions?.sublease?.isUpdate && ![SUBLEASE_STATUS.closed].includes(subleaseData?.status) && allowedToEdit && (
              <>
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} onClick={() => setOpenUpdateDialog(true)} className={'btn-outline-v1'}>
                  {isMobile && !isTablet ? <EditIcon /> : 'Edit'}
                </Button>
              </>
            )}
            <ActivityButton referenceId={subleaseData?._id} resource={ACTIVITY_RESOURCE.sublease} resourceLabel={subleaseData?.subleaseName} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          <CustomTab value={2}>{routes.deliveryTicket.title}</CustomTab>
          <CustomTab value={3}>Invoices</CustomTab>
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 4}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {subleaseData && fields.length ? (
              <DetailsPage
                data={subleaseData}
                fields={
                  subleaseData?.type === SUBLEASE_TYPE.interCompany
                    ? fields?.filter((e) => e?.fieldData?.fieldName !== 'warehouse')
                    : fields?.filter((e) => !['fromWarehouse', 'toWarehouse']?.includes(e?.fieldData?.fieldName))
                }
              />
            ) : (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            )}
          </Box>
          <Grid container spacing={2}></Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            {subleaseData ? (
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <Steps
                  isNextStep={false}
                  nextStep={nextStep}
                  steps={subleaseSteps}
                  nextStepToolTip={nextStepToolTip}
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  isStepEnded={[SUBLEASE_STATUS.closed].includes(subleaseData?.status)}
                  setStepFullScreen={() => setStepFullScreen(true)}
                  updateStatus={(step: number) => {
                    dynamicFormUpdateProcessStatus(sidebarResource.sublease, subleaseStepsNames[step], id);
                  }}
                />
                <ContentFullScreen title={subleaseStepsNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                  {subleaseStepsNames[currentStep] === 'Add Products' && subleaseData && (
                    <Productpackage
                      subleaseData={subleaseData}
                      setNextStep={setNextStep}
                      fetchData={fetchData}
                      setNextStepToolTip={setNextStepToolTip}
                      renderedFrom={`${renderedFrom}_grid-1`}
                      allowedToEdit={allowedToEdit}
                      stepFullScreen={stepFullScreen}
                    />
                  )}
                  {['Receiving'].includes(subleaseStepsNames[currentStep]) && subleaseData && (
                    <Receiving
                      subleaseData={subleaseData}
                      renderedFrom={`${renderedFrom}_Receiving`}
                      allowedToEdit={allowedToEdit}
                      setNextStep={setNextStep}
                      setNextStepToolTip={setNextStepToolTip}
                      stepFullScreen={stepFullScreen}
                    />
                  )}
                  {['End Sublease'].includes(subleaseStepsNames[currentStep]) && subleaseData && (
                    <SubleaseAsset
                      fetchData={fetchData}
                      subleaseData={subleaseData}
                      currentStep={currentStep}
                      renderedFrom={`${renderedFrom}_grid-2`}
                      allowedToEdit={allowedToEdit}
                      isProcessor={isProcessor}
                      stepFullScreen={stepFullScreen}
                    />
                  )}
                  {['Serialized Asset'].includes(subleaseStepsNames[currentStep]) && subleaseData && (
                    <SerializedAsset
                      subleaseData={subleaseData}
                      setNextStep={setNextStep}
                      setNextStepToolTip={setNextStepToolTip}
                      renderedFrom={`${renderedFrom}_grid-3`}
                      allowedToEdit={allowedToEdit}
                      stepFullScreen={stepFullScreen}
                    />
                  )}
                  {['Loading Ticket'].includes(subleaseStepsNames[currentStep]) && subleaseData && (
                    <LoadingTicket
                      subleaseData={subleaseData}
                      setNextStep={setNextStep}
                      fetchData={fetchData}
                      setNextStepToolTip={setNextStepToolTip}
                      ticketType={DELIVERY_TICKET_TYPE.loading}
                      renderedFrom={`${renderedFrom}_grid-4`}
                      allowedToEdit={allowedToEdit}
                      stepFullScreen={stepFullScreen}
                    />
                  )}
                  {['Receiving Ticket'].includes(subleaseStepsNames[currentStep]) && subleaseData && (
                    <LoadingTicket
                      subleaseData={subleaseData}
                      setNextStep={setNextStep}
                      fetchData={fetchData}
                      setNextStepToolTip={setNextStepToolTip}
                      ticketType={DELIVERY_TICKET_TYPE.receiving}
                      renderedFrom={`${renderedFrom}_grid-5`}
                      allowedToEdit={allowedToEdit}
                      stepFullScreen={stepFullScreen}
                    />
                  )}
                  {['Final Slip'].includes(subleaseStepsNames[currentStep]) && subleaseData && (
                    <Slip
                      subleaseData={subleaseData}
                      renderedFrom={`${renderedFrom}_grid-6`}
                      stepFullScreen={stepFullScreen}
                      statusNames={statusOptions}
                      updateStatus={updateStatus}
                    />
                  )}
                </ContentFullScreen>
              </Grid>
            ) : (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            )}
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            {subleaseData ? (
              <Tickets subleaseId={id} renderedFrom={`${renderedFrom}_grid-3`} />
            ) : (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            )}
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            {subleaseData ? (
              <Invoices resourceId={id} resource={sidebarResource.sublease} invoiceFieldName="sublease" />
            ) : (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            )}
          </Grid>
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
                  resource={sidebarResource.sublease}
                  data={subleaseData}
                  allowedToEdit={permissions?.sublease?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.sublease?.title} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageSublease
          isClone={false}
          subleaseId={id}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default SubleaseDetailsPage;
