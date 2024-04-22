import { Box, Button, CircularProgress, Tab, Tabs } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import EditIcon from '@material-ui/icons/Edit';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { IoMdDownload } from 'react-icons/io';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import Steps, { getIndex } from 'src/components/Steps';
import { ownerAndColaborator } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import ContentFullScreen from '../../components/ContentFullScreen';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import TabPanel from '../../components/TabPanel';
import {
  ACTIVITY_RESOURCE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_TYPE,
  QUOTATION_STATUS,
  RENTAL_STATUS,
  RENTAL_STEPS,
  checkSuperAdminAccess,
  deliveryTicket,
  rentalManagement,
  rentalManagementSteps,
  serializedAsset,
  sidebarResource
} from '../../constants/helpers';
import { findOne, objectStore } from '../../constants/indexdbhelper';
import Invoice from './Invoice';
import LoadingTicket from './LoadingTicket';
import ManageRentalManagementDialog from './ManageRental';
import Productpackage from './Productpackage';
import ProgressiveBilling from './ProgressiveBilling';
import Quotation from './Quotation';
import ReceivingTicket from './ReceivingTicket';
import RentalManagementViews from './RoadMapViews';
import SerializedAsset from './SerializedAsset';
import Services from './Services';
import { updateRentalProcessStatus } from './rentalOfflineHelper';
import Step from '../DynamicForm/Step';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';

const RentalManagementDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { isOffline } = useContext(CustomOfflineContext);
  const renderedFrom = camelCase(routes?.rentalManagement.title);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { user, permissions }
  }: any = useData();

  const [loadingDetails, setLoadingDetails] = useState(true);
  const [rentalManagementData, setRentalManagementData] = useState(null);

  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [rentalManagementFields, setRentalManagementFields] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [isProcessor, setIsProcessor] = useState(false);

  const [statusOptions, setStatusOptions] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const [nextStep, setNextStep] = useState(false);
  const [nextStepToolTip, setNextStepToolTip] = useState(null);

  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [locationKeys, setLocationKeys] = useState([]);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [showCancelConfirmBox, setShowCancelConfirmBox] = useState({ open: false, isQuote: false });
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const [quotationData, setQuotationData] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [isDisableCustomerAccount, setIsDisableCustomerAccount] = useState(false);

  const [allowUpdateStatus, setAllowUpdateStatus] = useState(false);
  const [displayProgressiveBillingTab, setDisplayProgressiveBillingTab] = useState(false);

  const [rentalSteps, setRentalSteps] = useState([]);

  const [versionNotClonned, setVersionNotClonned] = useState(false);
  const [reOpening, setReOpening] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [resourceData, setResourceData] = useState(null);

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
          setTabValue(tab ? parseInt(tab) : 0);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setTabValue(tab ? parseInt(tab) : 0);
        }
      }
    });
  }, [locationKeys]);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 0) {
      fetchRentalManagementData();
    }
    history.push(`?tab=${newValue}`);
  };

  useEffect(() => {
    if (id) {
      getRentalManagementFields();
      fetchRentalManagementData();
      fetchQuotationData();
      fetchPolicy();
    }
    if (!isOffline) {
      fetchAssetStatusRights();
    }
    checkProgressiveBilling();
  }, [id]);

  const checkProgressiveBilling = () => {
    if (user?.user?.brandPolicy?.rentalProgressiveBilling) {
      axiosInstance()
        .get(
          `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}&referenceId=${id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
        )
        .then(({ data: { data } }) => {
          if (data.length > 0) {
            setDisplayProgressiveBillingTab(true);
          }
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  };

  const fetchQuotationData = (versionNumber = null, createIfNotExits = false) => {
    axiosInstance()
      .get(
        createIfNotExits
          ? `${rentalManagement.api}/${rentalManagementData._id}/quotation?createIfNotExits=1`
          : `${rentalManagement.api}/${id}/quotation`
      )
      .then(({ data: { data } }) => {
        if (data?.versions) {
          setQuotationData(data);
          let keys = Object.keys(data.versions);
          setCurrentVersion(versionNumber ? versionNumber : parseInt(keys[keys.length - 1]));
          const lastQuoteVersion = data?.versions[versionNumber ? versionNumber : parseInt(keys[keys.length - 1])];
          if ([QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer].includes(lastQuoteVersion?.status)) {
            setVersionNotClonned(true);
          } else {
            setVersionNotClonned(false);
          }

          for (let i = 0; i < keys.length; i++) {
            if (
              [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                data?.versions[keys[i]]?.status
              )
            ) {
              setIsDisableCustomerAccount(true);
              break;
            }
          }
        }
      });
  };

  const fetchAssetStatusRights = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}&view=true`)
      .then(({ data }) => {
        if (data.data && data.data.length) {
          data.data.some((o) => {
            if (o?.fieldData?.fieldName === 'status') {
              setAllowUpdateStatus(o?.isUpdate);
              return true;
            }
          });
        }
      })
      .catch((err) => { });
  };

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= 7) {
      fetchQuotationData();
      updateProcessStatus(rentalSteps[currentStep]?.name);
    }
  }, [currentStep]);

  const fetchRentalManagementData = async () => {
    try {
      let data;
      if (!isOffline) {
        const response: any = await axiosInstance().get(`${rentalManagement.api}/${id}`);
        data = response?.data?.data;
      } else {
        data = await findOne(objectStore.rentalManagement, id);
      }
      var steps =
        user?.user?.brandPolicy?.rentalQuotation || data?.addQuotationStep
          ? rentalManagementSteps
          : rentalManagementSteps?.filter((e) => !['Quotation'].includes(e.name));
      if (!user?.user?.brandPolicy?.rentalService) {
        steps = steps?.filter((e) => !['Add Services'].includes(e.name));
      }
      if (!user?.user?.brandPolicy?.rentalOnFieldStep) {
        steps = steps?.filter((e) => !['On Field'].includes(e.name));
      }
      setRentalSteps(steps);
      if (data?.status === RENTAL_STATUS.closed) {
        setCurrentStep(steps?.length - 1);
      } else {
        setCurrentStep(getIndex(data?.processStatus, steps));
      }
      setLoadingDetails(false);
      let isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      if (checkSuperAdminAccess(user, sidebarResource.rentalManagement)) {
        isAllowedToEdit = true;
      }
      setAllowedToEdit(isAllowedToEdit);
      setAllowedToDelete(data.owner.optionValue === user?.user?._id);
      const isProcessor = [data.processor].some((d) => d?.optionValue === user?.user?._id);
      setIsProcessor(isProcessor);
      setRentalManagementData(data);
    } catch (error) {
      setLoadingDetails(false);
      toastConfig.setToastConfig(error);
    }
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.rentalManagement}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getRentalManagementFields = async () => {
    try {
      if (!isOffline) {
        const response: any = await axiosInstance().get('/field?resource=Rental Management');
        response?.data?.data.some((o) => {
          if (o?.fieldData?.fieldName === 'status') {
            setStatusOptions([...o.fieldData.option?.filter((e) => ![RENTAL_STATUS.cancelled].includes(e.optionLabel))]);
            return true;
          }
        });
        setRentalManagementFields(response?.data?.data);
      } else {
        const response: any = await findOne(objectStore.resource, objectStore.rentalManagement);
        setRentalManagementFields(response);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleCancelRentalJob = () => {
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData._id}/cancel`)
      .then(() => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `${routes.rentalManagement.title} cancelled successfully`
        });
        fetchRentalManagementData();
        setShowCancelConfirmBox({ open: false, isQuote: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${rentalManagement.api}/remove`, { ids: [rentalManagementData._id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes.rentalManagement.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (o) => {
    if (o.optionValue && rentalManagementData?.status !== o.optionValue) {
      updateJobStatus(o.optionValue);
    }
  };

  const updateProcessStatus = async (processStatus) => {
    if (isOffline) {
      await updateRentalProcessStatus(id, processStatus);
    } else {
      axiosInstance()
        .put(`${rentalManagement.api}/${id}/process-status`, { processStatus: processStatus })
        .then(({ data }) => { })
        .catch((error) => { });
    }
  };

  const updateJobStatus = (status) => {
    axiosInstance()
      .patch(`${rentalManagement.api}/status/${rentalManagementData._id}`, { status: status })
      .then(({ data: { data } }) => {
        if (status === RENTAL_STATUS.invoiced || status === RENTAL_STATUS.closed) {
          updateProcessStatus(rentalSteps[rentalSteps?.length - 1]?.name);
          setCurrentStep(rentalSteps?.length - 1);
        }
        fetchRentalManagementData();
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

  const cloneVersion = () => {
    const versionId = quotationData?.versions[currentVersion]?._id;
    axiosInstance()
      .post(`/quotation/clone-version/${quotationData._id}/${versionId}`)
      .then(() => {
        fetchQuotationData();
        setShowCancelConfirmBox({ open: false, isQuote: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleRentalReOpen = () => {
    setReOpening(true);
    axiosInstance()
      .patch(`${rentalManagement.api}/status/${rentalManagementData._id}`, { status: RENTAL_STATUS.inProgress })
      .then(({ data }) => {
        setReOpening(false);
        fetchRentalManagementData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status changed to In-Progress`
        });
      })
      .catch((error) => {
        setReOpening(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDownload = () => {
    setIsDownloading(true);
    axiosInstance()
      .get(`/download-attachment?referenceType=rentalManagement&referenceId=${rentalManagementData?._id}`, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', rentalManagementData?.rentalJobName + '.zip');
        document.body.appendChild(link);
        link.click();
        setIsDownloading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setIsDownloading(false);
      });
  };

  return (
    <>
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs routes={[routes.rentalManagement, { title: `${rentalManagementData ? rentalManagementData?.rentalJobName : ''}` }]} />
          </Box>
          <Box className="controls-v1">
            <Box className="control-buttons-v1">
              <>
                <Fragment>
                  {permissions?.iotChart?.isRead && (
                    <Button
                      className="btn-outline-v1"
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={() => {
                        history.push(`${routes.iotChart.path}?referenceData=${rentalManagementData?.shippingAddress?.optionValue}`);
                      }}
                    >
                      {`View ${routes.iotChart.title}`}
                    </Button>
                  )}
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'outlined'}
                    className="btn-outline-v1"
                    type="button"
                    size="small"
                    disabled={isDownloading ? true : false}
                    startIcon={isMobile ? '' : <IoMdDownload />}
                    onClick={(e) => {
                      handleDownload();
                    }}
                  >
                    {isMobile && !isTablet ? <IoMdDownload size={20} /> : isDownloading ? 'Please wait...' : 'Download'}
                  </Button>
                  {['Add Products', 'Add Services', 'Add-on'].includes(rentalSteps[currentStep]?.name) &&
                    versionNotClonned &&
                    rentalManagementData?.addQuotationStep && (
                      <Button
                        disabled={!versionNotClonned}
                        className="buttonStyleBigScreen"
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => {
                          setVersionNotClonned(false);
                          cloneVersion();
                        }}
                      >
                        Create New Version
                      </Button>
                    )}
                  {permissions?.rentalManagement?.isUpdate &&
                    !isOffline &&
                    [RENTAL_STATUS.readyToInvoice, RENTAL_STATUS.invoiced].includes(rentalManagementData?.status) &&
                    allowedToEdit && (
                      <Fragment>
                        <Button
                          variant={isMobile && !isTablet ? 'text' : 'outlined'}
                          className={'btn-outline-v1'}
                          onClick={() => updateJobStatus(RENTAL_STATUS.closed)}
                        >
                          {isMobile && !isTablet ? <CloseIcon /> : 'Close'}
                        </Button>
                      </Fragment>
                    )}
                  {user?.role?.selectedEntity?.policy?.isRentalReopen && rentalManagementData?.status === RENTAL_STATUS.closed && (
                    <Button
                      className="buttonStyleBigScreen"
                      variant="contained"
                      color="primary"
                      size="small"
                      endIcon={reOpening ? <CircularProgress size={20} /> : null}
                      disabled={reOpening}
                      onClick={() => {
                        handleRentalReOpen();
                      }}
                    >
                      Re-Open
                    </Button>
                  )}
                  {permissions?.rentalManagement?.isUpdate &&
                    !isOffline &&
                    ![RENTAL_STATUS.cancelled, RENTAL_STATUS.closed].includes(rentalManagementData?.status) &&
                    !(
                      [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                        quotationData?.versions[currentVersion]?.status
                      ) && ['Add Products', 'Add Services', 'Add-on'].includes(rentalSteps[currentStep]?.name)
                    ) && (
                      <Fragment>
                        <HtmlTooltip title={!allowedToEdit ? ownerAndColaborator : 'Edit'}>
                          <span>
                            <Button
                              disabled={allowedToEdit ? false : true}
                              variant={isMobile && !isTablet ? 'text' : 'contained'}
                              className={'btn-outline-v1'}
                              onClick={handleOpenUpdateDialog}
                            >
                              {isMobile && !isTablet ? <EditIcon /> : 'Edit'}
                            </Button>
                          </span>
                        </HtmlTooltip>
                      </Fragment>
                    )}
                </Fragment>
                {/* {permissions?.rentalManagement?.isUpdate &&
                    [RENTAL_STATUS.new, RENTAL_STATUS.inProgress].includes(rentalManagementData?.status) && (
                      <Button variant="outlined" color="primary" size="small" onClick={() => setShowCancelConfirmBox(true)}>
                        {'Cancel ' + routes.rentalManagement.title}
                      </Button>
                    )} */}
                <ActivityButton
                  referenceId={rentalManagementData?._id}
                  resource={ACTIVITY_RESOURCE.rentalManagement}
                  resourceLabel={rentalManagementData?.rentalJobName}
                />
              </>
            </Box>
          </Box>
        </Box>
        <Box className={`detail-container-v1`}>
          <CustomTabs value={tabValue} onChange={handleMainTabChange}>
            <CustomTab index={0} value={0}>
              Header
            </CustomTab>
            <CustomTab index={1} value={1}>
              Details
            </CustomTab>
            {resourceData && resourceData?.steps?.length > 0 && (
              <CustomTab index={2} value={2}>
                Associations
              </CustomTab>
            )}
            {displayProgressiveBillingTab && (
              <CustomTab index={3} value={3}>
                Progressive Billing
              </CustomTab>
            )}
            {!isOffline && !(isMobile && !isTablet) && (
              <CustomTab index={4} value={4}>
                Views
              </CustomTab>
            )}
          </CustomTabs>
          <TabPanel value={tabValue} index={0}>
            <Box>
              {!loadingDetails && rentalManagementData && rentalManagementFields.length > 0 ? (
                <DetailsPage data={rentalManagementData} fields={rentalManagementFields} />
              ) : null}
            </Box>
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <Steps
              isNextStep={false}
              nextStep={nextStep}
              nextStepToolTip={nextStepToolTip}
              steps={rentalSteps}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              handlePrev={() => {
                if (
                  (quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ||
                    quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer) &&
                  rentalSteps[currentStep]?.name === 'Quotation'
                ) {
                  setShowCancelConfirmBox({ open: true, isQuote: true });
                } else {
                  setCurrentStep((prevStep) => {
                    const newStep = prevStep - 1;
                    return newStep;
                  });
                }
              }}
              isStepEnded={[RENTAL_STATUS.invoiced, RENTAL_STATUS.closed, RENTAL_STATUS.cancelled].includes(rentalManagementData?.status)}
              setStepFullScreen={() => setStepFullScreen(true)}
            />
            <ContentFullScreen title={rentalSteps[currentStep]?.name} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
              {rentalSteps[currentStep]?.name === 'Add Products' && rentalManagementData && (
                <Productpackage
                  rentalManagementData={rentalManagementData}
                  setNextStep={setNextStep}
                  setNextStepToolTip={setNextStepToolTip}
                  renderedFrom={`${renderedFrom}_grid-1`}
                  stepFullScreen={stepFullScreen}
                  allowedToEdit={allowedToEdit}
                  quotationApproved={
                    quotationData &&
                      [
                        QUOTATION_STATUS.acceptByCustomer,
                        QUOTATION_STATUS.rejectByCustomer,
                        QUOTATION_STATUS.sentToCustomer,
                        QUOTATION_STATUS.waitingForSupplierPrice
                      ].includes(quotationData?.versions[currentVersion]?.status)
                      ? true
                      : false
                  }
                />
              )}
              {rentalSteps[currentStep]?.name === 'Add Services' && rentalManagementData && (
                <Services
                  rentalManagementData={rentalManagementData}
                  setNextStep={setNextStep}
                  setNextStepToolTip={setNextStepToolTip}
                  renderedFrom={`${renderedFrom}_grid-1`}
                  stepFullScreen={stepFullScreen}
                  allowedToEdit={allowedToEdit}
                  quotationApproved={
                    quotationData &&
                      [
                        QUOTATION_STATUS.acceptByCustomer,
                        QUOTATION_STATUS.rejectByCustomer,
                        QUOTATION_STATUS.sentToCustomer,
                        QUOTATION_STATUS.waitingForSupplierPrice
                      ].includes(quotationData?.versions[currentVersion]?.status)
                      ? true
                      : false
                  }
                />
              )}

              {rentalSteps[currentStep]?.name === 'Quotation' && rentalManagementData && (
                <Quotation
                  rentalManagementData={rentalManagementData}
                  setNextStep={setNextStep}
                  stepFullScreen={stepFullScreen}
                  allowedToEdit={allowedToEdit}
                  allowedToDelete={allowedToDelete}
                  fetchQuotationData={fetchQuotationData}
                  quotationData={quotationData}
                  currentVersion={currentVersion}
                  setCurrentVersion={setCurrentVersion}
                />
              )}
              {rentalSteps[currentStep]?.name === 'Serialized Asset' && rentalManagementData && (
                <SerializedAsset
                  rentalManagementData={rentalManagementData}
                  setNextStep={setNextStep}
                  setNextStepToolTip={setNextStepToolTip}
                  stepFullScreen={stepFullScreen}
                  allowedToEdit={allowedToEdit}
                />
              )}
              {rentalSteps[currentStep]?.name === 'Loading Ticket' && rentalManagementData && (
                <LoadingTicket
                  fetchRentalData={fetchRentalManagementData}
                  rentalManagementData={rentalManagementData}
                  currentStep={currentStep}
                  setNextStep={setNextStep}
                  setNextStepToolTip={setNextStepToolTip}
                  renderedFrom={`${renderedFrom}_grid-3`}
                  allowedToEdit={allowedToEdit}
                  isProcessor={isProcessor}
                  allowUpdateStatus={allowUpdateStatus}
                  stepFullScreen={stepFullScreen}
                  checkProgressiveBilling={checkProgressiveBilling}
                />
              )}
              {['On Field', 'Receiving Ticket']?.includes(rentalSteps[currentStep]?.name) && rentalManagementData && (
                <ReceivingTicket
                  fetchRentalData={fetchRentalManagementData}
                  rentalManagementData={rentalManagementData}
                  currentStep={rentalSteps[currentStep]?.name === 'On Field' ? RENTAL_STEPS.onField : RENTAL_STEPS.receiving}
                  setNextStep={setNextStep}
                  setNextStepToolTip={setNextStepToolTip}
                  renderedFrom={`${renderedFrom}_grid-4`}
                  allowedToEdit={allowedToEdit}
                  isProcessor={isProcessor}
                  stepFullScreen={stepFullScreen}
                  allowUpdateStatus={allowUpdateStatus}
                  checkProgressiveBilling={checkProgressiveBilling}
                />
              )}
              {rentalSteps[currentStep]?.name === 'Final Slip' && rentalManagementData && (
                <Invoice
                  rentalManagementData={rentalManagementData}
                  updateJobStatus={updateJobStatus}
                  statusOptions={statusOptions}
                  stepFullScreen={stepFullScreen}
                  allowedToEdit={allowedToEdit}
                  renderedFrom={`${renderedFrom}_grid-5`}
                />
              )}
            </ContentFullScreen>
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <Step
              resourceData={resourceData}
              resourceId={id}
              resource={sidebarResource.rentalManagement}
              data={rentalManagementData}
              allowedToEdit={allowedToEdit}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <Box>
              {displayProgressiveBillingTab ? (
                <ProgressiveBilling rentalId={id} rentalManagementData={rentalManagementData} allowCreateInvoice={true} />
              ) : (
                <RentalManagementViews rentalName={rentalManagementData?.rentalJobName} rentalId={id} status={rentalManagementData?.status} />
              )}
            </Box>
          </TabPanel>
          <TabPanel value={tabValue} index={4}>
            <Box>
              <RentalManagementViews rentalName={rentalManagementData?.rentalJobName} rentalId={id} status={rentalManagementData?.status} />
            </Box>
          </TabPanel>
        </Box>

        {showConfirmBox && (
          <ConfirmationDialog
            open={showConfirmBox}
            message={`Are you sure you want to delete this ${routes.rentalManagement.title.toLowerCase()} ?`}
            onClose={() => {
              setShowConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
        {showCancelConfirmBox.open && (
          <ConfirmationDialog
            open={showCancelConfirmBox.open}
            message={
              showCancelConfirmBox.isQuote
                ? `Do you want to create a new version of the ${routes?.quotation?.title?.toLowerCase()}?`
                : `Are you sure you want to cancel this ${routes.rentalManagement.title.toLowerCase()} ?`
            }
            onClose={() => {
              setShowCancelConfirmBox({ open: false, isQuote: false });
              if (showCancelConfirmBox.isQuote) {
                setCurrentStep((prevStep) => {
                  const newStep = prevStep - 1;
                  return newStep;
                });
              }
            }}
            onOk={() => (showCancelConfirmBox.isQuote ? cloneVersion() : handleCancelRentalJob())}
            forwardText={showCancelConfirmBox.isQuote ? 'Yes' : null}
            cancelText={showCancelConfirmBox.isQuote ? 'No' : null}
          />
        )}
        {openUpdateDialog && (
          <ManageRentalManagementDialog
            isClone={false}
            open={openUpdateDialog}
            rentalManagementId={id}
            rentalManagementData={rentalManagementData}
            onClose={() => setOpenUpdateDialog(false)}
            onSuccess={() => {
              setOpenUpdateDialog(false);
              fetchRentalManagementData();
            }}
            isDisableCustomerAccount={isDisableCustomerAccount}
          />
        )}
      </Box>
    </>
  );
};

export default RentalManagementDetailsPage;
