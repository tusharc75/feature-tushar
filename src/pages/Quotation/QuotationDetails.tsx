import { Box, Button, CircularProgress, Grid, Menu, MenuItem } from '@material-ui/core';
import CachedIcon from '@material-ui/icons/Cached';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { Skeleton } from '@material-ui/lab';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { BiLayerPlus } from 'react-icons/bi';
import { GiReceiveMoney } from 'react-icons/gi';
import { HiPencil } from 'react-icons/hi';
import { MdAutorenew, MdDelete } from 'react-icons/md';
import { SiSemanticrelease } from 'react-icons/si';
import { VscVersions } from 'react-icons/vsc';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import ContentFullScreen from 'src/components/ContentFullScreen';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ShowDoaData from 'src/components/ShowDoaData';
import ShowQuoteStatus from 'src/components/ShowQuoteStatus';
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
  QUOTATION_STATUS,
  QUOTATION_TYPE,
  RENTAL_STATUS,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  quotation,
  quotationProcessSteps,
  sidebarResource
} from '../../constants/helpers';
import Step from '../DynamicForm/Step';
import ManageQuotationDialog from './ManageQuotationDialog';
import ManualReponseDialog from './ManualRespondDialog';
import Productpackage from './Productpackage';
import QuotationSummeryDialog from './QuotationSummeryDialog';
import QuoteBuilder from './QuoteBuilder';
import RoadmapViews from './RoadMapViews';
import Versions from './Versions';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';

const QuotationDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(sidebarResource?.quotation);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const [loading, setLoading] = useState(false);
  const [quotationData, setQuotationData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [quotationFields, setQuotationFields] = useState([]);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [nextStep, setNextStep] = useState(true);
  const [prevStep, setPrevStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [anchorElAction, setAnchorElAction] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [showQuotationSummaryDialog, setShowQuotationSummaryDialog] = useState(false);
  const [customerAcceptable, setCustomerAcceptable] = useState(false);
  const [DOAData, setDOAData] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [isCloning, setCloning] = useState(false);
  const [showAllVersionStatus, setShowAllVersionStatus] = useState(false);
  const [currVersionId, setCurrVersionId] = useState(null);
  const [sentToCustomer, setSentToCustomer] = useState(false);

  const [convertConfirmBox, setConvertConfirmBox] = useState({ open: false, warning: null });
  const [renewal, setRenewal] = useState(false);
  const [releaseConfirm, setReleaseConfirm] = useState(false);

  const [stepList, setStepList] = useState(quotationProcessSteps);
  const [stepNames, setStepNames] = useState(quotationProcessSteps.map((item) => item.name));
  const [canConvert, setCanConvert] = useState(false);
  const [reserveAssetWarning, setReserveAssetWarning] = useState(false);
  const [resourceData, setResourceData] = useState(null);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  const handleChangeVersion = (versionNumber) => {
    fetchQuotationData(versionNumber);
    setCurrentVersion(versionNumber);
    setShowAllVersionStatus(false);
  };

  const openActionsAction = (event) => {
    setAnchorElAction(event.currentTarget);
  };

  const closeActionsAction = () => {
    setAnchorElAction(null);
  };

  const updateDOASetup = (doasetup) => {
    if (doasetup) {
      setStepList(quotationProcessSteps);
      setStepNames(quotationProcessSteps?.map((item) => item.name));
    } else {
      setStepList(quotationProcessSteps?.filter((e) => e.name !== 'DOA'));
      setStepNames(quotationProcessSteps?.filter((e) => e.name !== 'DOA').map((item) => item.name));
    }
  };

  const getQuotationFields = useMemo(() => {
    let tempQuotationFields = quotationFields;
    if (quotationData && quotationFields.length !== 0) {
      if (quotationData['type'] === QUOTATION_TYPE.rentalJob) {
        tempQuotationFields = tempQuotationFields.filter(
          (d) => !['repairOrder', 'salesOrder', 'fieldJob', 'assemblyOrder']?.includes(d?.fieldData?.fieldName)
        );
      }
      if (quotationData['type'] === QUOTATION_TYPE.fieldJob) {
        tempQuotationFields = tempQuotationFields.filter(
          (d) => !['repairOrder', 'salesOrder', 'rentalJob', 'assemblyOrder']?.includes(d?.fieldData?.fieldName)
        );
      }
      if (quotationData['type'] === QUOTATION_TYPE.repairOrder) {
        tempQuotationFields = tempQuotationFields.filter(
          (d) => !['salesOrder', 'fieldJob', 'rentalJob', 'assemblyOrder']?.includes(d?.fieldData?.fieldName)
        );
      }
      if (quotationData['type'] === QUOTATION_TYPE.salesOrder) {
        tempQuotationFields = tempQuotationFields.filter(
          (d) => !['fieldJob', 'repairOrder', 'rentalJob', 'assemblyOrder']?.includes(d?.fieldData?.fieldName)
        );
      }
      if (quotationData['type'] === QUOTATION_TYPE.assemblyOrder) {
        tempQuotationFields = tempQuotationFields.filter(
          (d) => !['fieldJob', 'repairOrder', 'rentalJob', 'salesOrder']?.includes(d?.fieldData?.fieldName)
        );
      }
    }
    return tempQuotationFields;
  }, [quotationData, quotationFields]);

  const fetchFields = async () => {
    try {
      const response: any = await axiosInstance().get('/field?resource=Quotation');
      setQuotationFields(response?.data?.data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchQuotationData();
      fetchPolicy();
    }
  }, [id]);

  useEffect(() => {
    if (quotationData && quotationFields) {
      if (quotationData?.type) {
        if (quotationData?.type === QUOTATION_TYPE.rentalJob) {
          var canAllowMultipleTimeConvert = false;
          const rentalJobField = quotationFields?.find((e) => e?.fieldData?.fieldName === 'rentalJob')?.fieldData;
          if (rentalJobField) {
            if (rentalJobField?.type === 'multiSelect') {
              canAllowMultipleTimeConvert = true;
            }
          }
          if (
            canAllowMultipleTimeConvert &&
            [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.converted]?.includes(quotationData?.status) &&
            quotationData.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer
          ) {
            setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.quotation, quotationData));
            setCanConvert(true);
          } else if (!quotationData?.rentalJob && quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer) {
            setCanConvert(true);
          } else {
            setCanConvert(false);
          }
        } else if (quotationData?.type === QUOTATION_TYPE.salesOrder) {
          if (!quotationData?.salesOrder && quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer) {
            setCanConvert(true);
          } else {
            setCanConvert(false);
          }
        } else if (quotationData?.type === QUOTATION_TYPE.repairOrder) {
          if (!quotationData?.repairOrder && quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer) {
            setCanConvert(true);
          } else {
            setCanConvert(false);
          }
        } else if (quotationData?.type === QUOTATION_TYPE.fieldJob) {
          if (!quotationData?.fieldJob && quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer) {
            setCanConvert(true);
          } else {
            setCanConvert(false);
          }
        } else if (quotationData?.type === QUOTATION_TYPE.assemblyOrder) {
          if (!quotationData?.assemblyOrder && quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer) {
            setCanConvert(true);
          } else {
            setCanConvert(false);
          }
        }
      }
    }
  }, [quotationData, quotationFields, currentVersion]);

  const fetchQuotationData = async (version: any = 0, loading = true) => {
    setLoading(loading);
    try {
      let data;
      const response: any = await axiosInstance().get(`${quotation.api}/${id}`);
      data = response?.data?.data;

      var isAllowedToEdit = checkIsAllowedToEdit(user, sidebarResource.quotation, data);
      if ([QUOTATION_STATUS.converted].includes(data.status)) {
        isAllowedToEdit = false;
      }
      setAllowedToEdit(isAllowedToEdit && permissions?.quotation?.isUpdate);
      setQuotationData(data);
      var tempStepList = quotationProcessSteps;
      if (!data?.doasetup) {
        tempStepList = quotationProcessSteps?.filter((e) => e.name !== 'DOA');
      }
      setStepList(tempStepList);
      setStepNames(tempStepList?.map((item) => item.name));

      let versionIndex = 0;
      if (version === 0) {
        let keys = Object.keys(data.versions);
        versionIndex = parseInt(keys[keys.length - 1]);
      } else {
        versionIndex = version;
      }
      setCurrentVersion(versionIndex);
      setCurrVersionId(data.versions[versionIndex]?._id);
      setSentToCustomer(data.versions[versionIndex]?.status === QUOTATION_STATUS.sentToCustomer);

      if (data.versions[versionIndex]?.status === QUOTATION_STATUS.sentToCustomer) {
        setCurrentStep(tempStepList?.length - 2);
      } else if (data.versions[versionIndex]?.status === QUOTATION_STATUS.acceptByCustomer) {
        setCurrentStep(tempStepList?.length - 1);
      } else {
        setCurrentStep(getIndex(data.versions[versionIndex]?.processStatus, tempStepList));
      }

      if (data?.doasetup) {
        const doaResponse: any = await axiosInstance().get(`doa-request/doaFlow/${data._id}/${data.versions[versionIndex]?._id}`);
        if (doaResponse?.data?.data) {
          setDOAData(doaResponse?.data?.data?.reverse());
        }
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.quotation}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const updateProcessStatus = (currStep) => {
    axiosInstance()
      .put(`${quotation.api}/${id}/process-status/${currVersionId}`, { processStatus: stepNames[currStep] })
      .then(() => {
        fetchQuotationData(currentVersion, false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const cloneVersion = () => {
    setCloning(true);
    const versionId = quotationData?.versions[currentVersion]?._id;
    axiosInstance()
      .post(`/quotation/clone-version/${quotationData._id}/${versionId}`)
      .then(() => {
        fetchQuotationData();
        setCloning(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setCloning(false);
      });
  };

  const deleteVersion = () => {
    axiosInstance()
      .delete(`/quotation/${quotationData._id}/${currentVersion}`)
      .then(() => {
        fetchQuotationData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${quotation.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes.quotation.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleConvert = () => {
    axiosInstance()
      .post(`${quotation.api}/convert`, { quotationId: quotationData._id, versionId: currVersionId })
      .then(({ data: { data } }) => {
        fetchQuotationData();
        setConvertConfirmBox({ open: false, warning: null });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Converted Successfully`
        });
        if (quotationData?.type === QUOTATION_TYPE.rentalJob) {
          window.open(`${routes.rentalManagementDetail.path}/${data?._id}`);
        }
        if (quotationData?.type === QUOTATION_TYPE.salesOrder) {
          window.open(`${routes.salesOrderDetail.path}/${data?._id}`);
        }
        if (quotationData?.type === QUOTATION_TYPE.repairOrder) {
          window.open(`${routes?.repairOrderDetail?.path}/${data?._id}`);
        }
        if (quotationData?.type === QUOTATION_TYPE.fieldJob) {
          window.open(`${routes?.fieldServiceOrderDetail?.path}/${data?._id}`);
        }
        if (quotationData?.type === QUOTATION_TYPE.assemblyOrder) {
          window.open(`${routes.assemblyOrderDetail.path}/${data?._id}`);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleRelease = () => {
    axiosInstance()
      .put(`${quotation.api}/quotation-release/${id}`)
      .then((data) => {
        fetchQuotationData();
        setReleaseConfirm(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setReleaseConfirm(false);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs
            routes={[{ ...routes?.quotation, title: resources?.quotation?.titlePlural }, { title: `${quotationData?.quotationNumber}` }]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {quotationData ? (
              <>
                {quotationData.rentalJob && quotationData.rentalJob.status === RENTAL_STATUS.jobStarted && (
                  <>
                    <HtmlTooltip title="Renewal">
                      <Button
                        onClick={() => {
                          setRenewal(true);
                        }}
                        variant="outlined"
                        size="small"
                        className="btn-outline-v1 mx-1"
                        startIcon={<MdAutorenew />}
                        color="primary"
                      >
                        Renewal
                      </Button>
                    </HtmlTooltip>
                    <HtmlTooltip title="Release">
                      <Button
                        onClick={() => {
                          setReleaseConfirm(true);
                        }}
                        variant="outlined"
                        size="small"
                        className="btn-outline-v1 mx-1"
                        startIcon={<SiSemanticrelease />}
                        color="primary"
                      >
                        Release
                      </Button>
                    </HtmlTooltip>
                  </>
                )}
                <HtmlTooltip title={`${resources?.quotation?.titleSingular} Summary`}>
                  <Button
                    onClick={() => {
                      setShowQuotationSummaryDialog(true);
                    }}
                    variant="outlined"
                    size="small"
                    className="btn-outline-v1 mx-1"
                    startIcon={<GiReceiveMoney />}
                    color="primary"
                  >
                    Summary
                  </Button>
                </HtmlTooltip>
                <HtmlTooltip title={`Version : ${currentVersion}`}>
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'outlined'}
                    color="primary"
                    size="small"
                    className={` btn-outline-v1`}
                    onClick={() => {
                      setShowAllVersionStatus(true);
                    }}
                    style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                    startIcon={isMobile && !isTablet ? null : <VscVersions />}
                  >
                    {isMobile && !isTablet ? <VscVersions size={20} /> : `Version : ${currentVersion}`}
                  </Button>
                </HtmlTooltip>

                {allowedToEdit && (
                  <Button
                    className="btn-outline-v1"
                    variant="outlined"
                    color="default"
                    size="small"
                    onClick={openActionsAction}
                    aria-controls="action"
                    endIcon={<ExpandMore />}
                  >
                    Action
                  </Button>
                )}
                <Menu
                  anchorEl={anchorElAction}
                  keepMounted
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  id="action"
                  open={Boolean(anchorElAction)}
                  onClose={closeActionsAction}
                >
                  {allowedToEdit && (
                    <MenuItem
                      onClick={() => {
                        handleOpenUpdateDialog();
                        closeActionsAction();
                      }}
                    >
                      <HiPencil className={'mr-2'} />
                      Edit
                    </MenuItem>
                  )}
                  <MenuItem
                    disabled={
                      !allowedToEdit ||
                      isCloning ||
                      loading ||
                      quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ||
                      [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.converted]?.includes(quotationData?.status)
                    }
                    onClick={() => {
                      cloneVersion();
                      closeActionsAction();
                    }}
                  >
                    {isCloning ? <CircularProgress color="inherit" size={16} className="mr-2" /> : <BiLayerPlus className={'mr-2'} />}
                    {isCloning ? <>Cloning Version-{currentVersion}</> : `Clone Version-${currentVersion}`}
                  </MenuItem>
                  {allowedToEdit && canConvert && (
                    <MenuItem
                      onClick={() => {
                        setConvertConfirmBox({
                          open: true,
                          warning: reserveAssetWarning ? 'Asset(s) are not available, should we allow to convert without asset(s) ?' : null
                        });
                        closeActionsAction();
                      }}
                    >
                      <CachedIcon fontSize="small" className="mr-2" />
                      Convert to {quotationData?.type || ''}
                    </MenuItem>
                  )}
                  {currentVersion !== 1 &&
                    permissions?.quotation?.isDelete &&
                    quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.buildingQuote && (
                      <MenuItem
                        disabled={!allowedToEdit || loading}
                        onClick={() => {
                          deleteVersion();
                          closeActionsAction();
                        }}
                      >
                        <MdDelete className={'mr-2'} />
                        Delete Version-{currentVersion}
                      </MenuItem>
                    )}
                  {permissions?.quotation?.isDelete &&
                    checkIsAllowedToDelete(user, sidebarResource.quotation, quotationData.owner.optionValue) &&
                    quotationData?.canDelete && (
                      <MenuItem
                        onClick={() => {
                          setShowConfirmBox(true);
                          closeActionsAction();
                        }}
                      >
                        <MdDelete className={'mr-2'} />
                        Delete
                      </MenuItem>
                    )}
                </Menu>
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton referenceId={quotationData?._id} resource={ACTIVITY_RESOURCE.quotation} resourceLabel={quotationData?.quotationNumber} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          {!(isMobile && !isTablet) && <CustomTab value={2}>Views</CustomTab>}
          {resourceData && resourceData?.tabs?.length && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 3}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !quotationFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <>
                <DetailsPage data={quotationData} fields={getQuotationFields} />
              </>
            )}
          </Box>
        </TabPanel>
        <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
          <TabPanel value={tabValue} index={1} style={{ position: 'relative' }}>
            {stepNames[currentStep] === 'DOA' && quotationData && (
              <Box
                style={{
                  marginLeft: 'auto',
                  maxWidth: 'max-content',
                  marginTop: '-30px'
                }}
              >
                <ShowDoaData status={quotationData.versions[currentVersion].status} doaData={DOAData} />
              </Box>
            )}
            {[QUOTATION_STATUS.sentToCustomer, QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer]?.includes(
              quotationData?.versions[currentVersion]?.status
            ) && (
              <Box className={`ml-auto max-w-max md:static md:-mt-[31px] `}>
                <ShowQuoteStatus status={quotationData?.versions[currentVersion]?.status} />
              </Box>
            )}
            <div>
              <Steps
                isNextStep={false}
                nextStep={nextStep}
                steps={stepList}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                isStepEnded={[QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer]?.includes(
                  quotationData?.versions[currentVersion]?.status
                )}
                stepFullScreen={stepFullScreen}
                setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
                isPrevStep={prevStep}
                updateStatus={updateProcessStatus}
                handleNext={
                  stepNames[currentStep] === 'Quote Approval'
                    ? () => {
                        if (allowedToEdit) {
                          setCustomerAcceptable(true);
                        }
                      }
                    : null
                }
              />
              {stepNames[currentStep] === 'Add Products' && quotationData && (
                <Productpackage
                  quotationData={quotationData}
                  fetchQuotationData={fetchQuotationData}
                  setNextStep={setNextStep}
                  renderedFrom={`${renderedFrom}_grid-1`}
                  stepFullScreen={stepFullScreen}
                  version={currentVersion}
                  allowedToEdit={allowedToEdit}
                  updateDOASetup={updateDOASetup}
                />
              )}
              {stepNames[currentStep] === 'Quote Builder' && quotationData && (
                <QuoteBuilder
                  quotationData={quotationData}
                  setNextStep={setNextStep}
                  setPrevStep={setPrevStep}
                  stepFullScreen={stepFullScreen}
                  fetchQuotationData={fetchQuotationData}
                  version={currentVersion}
                  currentStep={stepNames[currentStep]}
                  versionData={quotationData?.versions[currentVersion]}
                  allowedToEdit={allowedToEdit}
                  renderedFrom={`${renderedFrom}_grid-3`}
                  setReserveAssetWarning={setReserveAssetWarning}
                />
              )}
              {stepNames[currentStep] === 'DOA' && quotationData && (
                <QuoteBuilder
                  quotationData={quotationData}
                  setNextStep={setNextStep}
                  setPrevStep={setPrevStep}
                  stepFullScreen={stepFullScreen}
                  fetchQuotationData={fetchQuotationData}
                  version={currentVersion}
                  currentStep={stepNames[currentStep]}
                  versionData={quotationData?.versions[currentVersion]}
                  allowedToEdit={allowedToEdit}
                  renderedFrom={`${renderedFrom}_grid-3`}
                  sentToCustomer={sentToCustomer}
                  DOAData={DOAData}
                  setReserveAssetWarning={setReserveAssetWarning}
                />
              )}
              {stepNames[currentStep] === 'Quote Approval' && quotationData && (
                <QuoteBuilder
                  quotationData={quotationData}
                  setNextStep={setNextStep}
                  setPrevStep={setPrevStep}
                  sentToCustomer={sentToCustomer}
                  stepFullScreen={stepFullScreen}
                  fetchQuotationData={fetchQuotationData}
                  version={currentVersion}
                  currentStep={stepNames[currentStep]}
                  versionData={quotationData?.versions[currentVersion]}
                  allowedToEdit={allowedToEdit}
                  renderedFrom={`${renderedFrom}_grid-3`}
                  setReserveAssetWarning={setReserveAssetWarning}
                />
              )}
              {stepNames[currentStep] === 'End' && quotationData && (
                <QuoteBuilder
                  quotationData={quotationData}
                  setNextStep={setNextStep}
                  setPrevStep={setPrevStep}
                  stepFullScreen={stepFullScreen}
                  fetchQuotationData={fetchQuotationData}
                  version={currentVersion}
                  currentStep={stepNames[currentStep]}
                  versionData={quotationData?.versions[currentVersion]}
                  allowedToEdit={allowedToEdit}
                  renderedFrom={`${renderedFrom}_grid-3`}
                  setReserveAssetWarning={setReserveAssetWarning}
                />
              )}
            </div>
          </TabPanel>
        </ContentFullScreen>
        <TabPanel value={tabValue} index={2}>
          <Box>
            {quotationData && (
              <RoadmapViews quoteName={quotationData?.quotationNumber} quoteId={id} versionId={currVersionId} status={quotationData?.status || ''} />
            )}
          </Box>
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 3}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.quotation}
                  data={quotationData}
                  allowedToEdit={permissions?.quotation?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.quotation?.titleSingular?.toLowerCase()} : ${quotationData?.quotationNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {renewal && (
        <ManageQuotationDialog
          isClone={true}
          open={renewal}
          quotationId={id}
          quotationData={quotationData}
          onClose={() => {
            setRenewal(false);
          }}
          onSuccess={(data) => {
            const prevVersion = quotationData?.versions[currentVersion];
            axiosInstance()
              .put(`${quotation.api}/version-to-clone/${prevVersion._id}/${data._id}`)
              .then((data: any) => {
                history.push(`${routes.quotationDetail.path}/${data._id}`);
              });
            // fetchQuotationData();
            setRenewal(false);
          }}
        />
      )}
      {openUpdateDialog && (
        <ManageQuotationDialog
          isClone={false}
          open={openUpdateDialog}
          quotationId={id}
          quotationData={quotationData}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchQuotationData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
      {showQuotationSummaryDialog && (
        <QuotationSummeryDialog
          quotationData={quotationData}
          versionId={currVersionId}
          onClose={() => {
            setShowQuotationSummaryDialog(false);
          }}
        />
      )}
      {quotationData && showAllVersionStatus && (
        <Versions onClose={() => setShowAllVersionStatus(false)} quotationId={id} handleChangeVersion={handleChangeVersion} />
      )}
      {customerAcceptable && (
        <ManualReponseDialog
          versionId={currVersionId}
          quotationId={quotationData?._id}
          setCurrentStep={setCurrentStep}
          updateStatus={updateProcessStatus}
          setCustomerAcceptable={setCustomerAcceptable}
        />
      )}
      {releaseConfirm && (
        <ConfirmationDialog
          open={releaseConfirm}
          message={`Are you sure you want to release quotation : ${quotationData?.quotationNumber} ?`}
          onClose={() => {
            setReleaseConfirm(false);
          }}
          onOk={handleRelease}
        />
      )}
      {convertConfirmBox.open && (
        <ConfirmationDialog
          open={convertConfirmBox.open}
          message={
            convertConfirmBox?.warning
              ? convertConfirmBox?.warning
              : `Are you sure you want to convert quotation : ${quotationData?.quotationNumber} ?`
          }
          onClose={() => {
            setConvertConfirmBox({ open: false, warning: null });
          }}
          onOk={handleConvert}
        />
      )}
    </Box>
  );
};

export default QuotationDetails;
