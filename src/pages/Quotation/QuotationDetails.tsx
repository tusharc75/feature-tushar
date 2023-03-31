import { useState, useEffect, useContext, useMemo } from 'react';
import { Grid, Box, Button, Tabs, Tab, Menu, MenuItem, Typography } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import {
  quotation,
  ACTIVITY_RESOURCE,
  quotationProcessSteps,
  QUOTATION_STATUS,
  QUOTATION_TYPE
} from '../../constants/helpers';
import ManageQuotationDialog from './ManageQuotationDialog';
import TabPanel from '../../components/TabPanel';
import queryString from 'query-string';
import { FaWpforms } from 'react-icons/fa';
import { BiFoodMenu, BiLayerPlus } from 'react-icons/bi';
import Productpackage from './Productpackage';
import { isMobile, isTablet } from 'react-device-detect';
import ExpandMore from '@material-ui/icons/ExpandMore';
import {
  FcClock,
  FcOk,
  FcCancel,
  GiReceiveMoney,
  HiPencil,
  IoArrowDownCircleSharp,
  MdDelete,
  MdDeleteSweep,
  RiFlowChart,
  VscVersions
} from 'react-icons/all';
import { camelCase } from 'lodash';
import Service from './Service';
import QuoteBuilder from './QuoteBuilder';
import RoadmapViews from './RoadMapViews';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Steps from 'src/pages/RentalManagement/Steps';
import contactClass from '../Contact/contact.module.scss';
import { CircularProgress } from '@material-ui/core';
import ManualReponseDialog from './ManualRespondDialog';
import Versions from './Versions';
import QuotationSummeryDialog from './QuotationSummeryDialog';
import ActivityButton from 'src/components/Activity/ActivityButton';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CachedIcon from '@material-ui/icons/Cached';

const QuotationDetails = () => {

  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.quotation.title);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const { state: { user, permissions } }: any = useData();

  const [loading, setLoading] = useState(false);
  const [quotationData, setQuotationData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [quotationFields, setQuotationFields] = useState([]);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [nextStep, setNextStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [anchorElAction, setAnchorElAction] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [showQuotationSummaryDialog, setShowQuotationSummaryDialog] = useState(false);
  const [customerAcceptable, setCustomerAcceptable] = useState(false);

  const [currentVersion, setCurrentVersion] = useState(0);
  const [isCloning, setCloning] = useState(false);
  const [showAllVersionStatus, setShowAllVersionStatus] = useState(false);
  const [currVersionId, setCurrVersionId] = useState(null);
  const [sentToCustomer, setSentToCustomer] = useState(false);
  const [versionStatus, setVersionStatus] = useState(QUOTATION_STATUS.acceptByCustomer);


  const [convertConfirmBox, setConvertConfirmBox] = useState(false);

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

  useEffect(() => {
    if (id) {
      getRessourceFields();
      fetchQuotationData();
    }
  }, [id]);

  const getQuotationFields = useMemo(() => {
    let tempQuotationFields = quotationFields;
    if (quotationData && quotationFields.length !== 0) {
      if (quotationData["type"] === "Rental Job") {
        tempQuotationFields = tempQuotationFields.filter(d => d?.fieldData?.fieldName !== "expectedCustomerDeliveryDate" && d?.fieldData?.fieldName !== "supplierSuggestedDeliveryDate" && d?.fieldData?.fieldName !== "repairOrder" && d?.fieldData?.fieldName !== "salesOrder");
      }
      if (quotationData["type"] === "Repair Order") {
        tempQuotationFields = tempQuotationFields.filter(d => d?.fieldData?.fieldName !== "expectedCustomerDeliveryDate" && d?.fieldData?.fieldName !== "supplierSuggestedDeliveryDate" && d?.fieldData?.fieldName !== "rentalJob" && d?.fieldData?.fieldName !== "salesOrder");
      }
      if (quotationData["type"] === "Sales Order") {
        tempQuotationFields = tempQuotationFields.filter(d => d?.fieldData?.fieldName !== "estimateStartDate" && d?.fieldData?.fieldName !== "estimateEndDate" && d?.fieldData?.fieldName !== "repairOrder" && d?.fieldData?.fieldName !== "rentalJob");
      }
    }
    return tempQuotationFields;
  }, [quotationData, quotationFields]);

  const getRessourceFields = async () => {
    try {
      const response: any = await axiosInstance().get('/field?resource=Quotation');
      setQuotationFields(response?.data?.data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchQuotationData = async (version: any = 0, loading = true) => {
    setLoading(loading);
    try {
      let data;
      const response: any = await axiosInstance().get(`${quotation.api}/${id}`);
      data = response?.data?.data;

      setQuotationData(data);
      let keys = Object.keys(data.versions);
      if (version == 0) {
        setCurrentVersion(parseInt(keys[keys.length - 1]));
        setCurrVersionId(data.versions[keys[keys.length - 1]]?._id);
        setCurrentStep(
          quotationProcessSteps.includes(data.versions[keys[keys.length - 1]]?.processStatus)
            ? quotationProcessSteps.indexOf(data.versions[keys[keys.length - 1]]?.processStatus)
            : 0
        );
        setSentToCustomer(data.versions[keys[keys.length - 1]]?.status === QUOTATION_STATUS.sentToCustomer);
        setVersionStatus(data.versions[keys[keys.length - 1]]?.status);
      } else {
        setCurrentVersion(version);
        setCurrVersionId(data.versions[version]?._id);
        setCurrentStep(
          quotationProcessSteps.includes(data.versions[version]?.processStatus)
            ? quotationProcessSteps.indexOf(data.versions[version]?.processStatus)
            : 0
        );
        setVersionStatus(data.versions[version]?.status);
        setSentToCustomer(data.versions[version]?.status === QUOTATION_STATUS.sentToCustomer);
      }

      var isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      if ([QUOTATION_STATUS.converted].includes(data.status)) {
        isAllowedToEdit = false
      }
      setAllowedToEdit(isAllowedToEdit && permissions?.quotation?.isUpdate);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const updateProcessStatus = (currStep) => {
    axiosInstance()
      .put(`${quotation.api}/${id}/process-status/${currVersionId}`, { processStatus: quotationProcessSteps[currStep] })
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
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleConvert = () => {
    axiosInstance().post(`${quotation.api}/${quotationData._id}/convert`)
      .then(({ data: { data } }) => {
        console.log(data)
        fetchQuotationData();
        setConvertConfirmBox(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Converted Successfully`
        });
        if (quotationData?.type === QUOTATION_TYPE.rentalJob) {
          history.push(`${routes.rentalManagementDetail.path}/${data?._id}`)
        }
        if (quotationData?.type === QUOTATION_TYPE.salesOrder) {
          history.push(`${routes.salesOrderDetail.path}/${data?._id}`)
        }
        if (quotationData?.type === QUOTATION_TYPE.repairOrder) {
          history.push(`${routes.repairOrderDetail.path}/${data?._id}`)
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.quotation, { title: `${quotationData?.quotationNumber}` }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {quotationData ? (
              <>
                <HtmlTooltip title="Quote Summary">
                  <Button
                    onClick={() => {
                      setShowQuotationSummaryDialog(true);
                    }}
                    variant="outlined"
                    size="small"
                    className="mx-1"
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
                    className={isMobile && !isTablet ? contactClass.mobile_button_layout : 'mx-1'}
                    onClick={() => {
                      setShowAllVersionStatus(true);
                    }}
                    style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                    startIcon={isMobile && !isTablet ? null : <VscVersions />}
                  >
                    {isMobile && !isTablet ? <VscVersions size={20} /> : `Version : ${currentVersion}`}
                  </Button>
                </HtmlTooltip>

                {allowedToEdit &&
                  <Button
                    variant="outlined"
                    color="default"
                    size="small"
                    onClick={openActionsAction}
                    aria-controls="action"
                    endIcon={isMobile && !isTablet ? null : <ExpandMore />}
                  >
                    {isMobile && !isTablet ? <IoArrowDownCircleSharp size={20} /> : 'Action'}
                  </Button>
                }
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
                    <MenuItem>
                      <Button
                        variant="text"
                        color="primary"
                        size="small"
                        startIcon={<HiPencil className={isMobile ? 'mr-1' : ''} />}
                        onClick={() => {
                          handleOpenUpdateDialog();
                          closeActionsAction();
                        }}
                      >
                        Edit Quote
                      </Button>
                    </MenuItem>
                  )}
                  <MenuItem>
                    <Button
                      disabled={!allowedToEdit || isCloning || loading}
                      variant="text"
                      type="button"
                      size="small"
                      startIcon={isCloning ? <CircularProgress color="inherit" size={16} /> : <BiLayerPlus className={isMobile ? 'mr-1' : ''} />}
                      onClick={() => {
                        cloneVersion();
                        closeActionsAction();
                      }}
                    >
                      {isCloning ? <>Cloning Version-{currentVersion}</> : `Clone Version-${currentVersion}`}
                    </Button>
                  </MenuItem>
                  {allowedToEdit && quotationData?.type && quotationData?.status === QUOTATION_STATUS.acceptByCustomer &&
                    !quotationData?.rentalJob && !quotationData?.repairOrder && !quotationData?.salesOrder &&
                    <MenuItem>
                      <Button
                        onClick={() => {
                          setConvertConfirmBox(true);
                          closeActionsAction();
                        }}
                        variant="text"
                        type="button"
                        size="small"
                        startIcon={<CachedIcon />}
                      >
                        Convert to Order
                      </Button>
                    </MenuItem>}
                  {permissions?.quotation?.isDelete && (
                    <MenuItem>
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<MdDelete className={isMobile ? 'mr-1' : ''} />}
                        onClick={() => {
                          setShowConfirmBox(true);
                          closeActionsAction();
                        }}
                      >
                        Delete Quote
                      </Button>
                    </MenuItem>
                  )}
                  {currentVersion !== 1 && permissions?.quotation?.isDelete && (
                    <MenuItem>
                      <Button
                        variant="text"
                        size="small"
                        disabled={!allowedToEdit || loading}
                        startIcon={<MdDeleteSweep className={isMobile ? 'mr-1' : ''} />}
                        onClick={() => {
                          deleteVersion();
                          closeActionsAction();
                        }}
                      >
                        Delete Version-{currentVersion}
                      </Button>
                    </MenuItem>
                  )}
                </Menu>
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton referenceId={quotationData?._id} resource={ACTIVITY_RESOURCE.quotation} />
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
        <TabPanel value={tabValue} index={1}>
          {sentToCustomer ? (
            <div className="d-flex align-items-center justify-content-center flex-column m-1">
              <FcClock size={25} />
              <Typography style={{ color: '#00acc1', fontWeight: 'bold' }}>Quote has been sent to customer</Typography>
            </div>
          ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? (
            <div className="d-flex align-items-center justify-content-center flex-column m-1">
              <FcOk size={25} />
              <Typography style={{ color: '#28a745', fontWeight: 'bold' }}>Quote has been accepted by customer</Typography>
            </div>
          ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
            <div className="d-flex align-items-center justify-content-center flex-column m-1">
              <FcCancel size={25} />
              <Typography style={{ color: '#dc3545', fontWeight: 'bold' }}>Quote has been rejected by customer</Typography>
            </div>
          ) : null}
          <div>
            <Steps
              isNextStep={false}
              nextStep={nextStep}
              steps={quotationProcessSteps}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isStepEnded={quotationProcessSteps[currentStep] === 'End'}
              setStepFullScreen={() => setStepFullScreen(true)}
              isPrevStep={!sentToCustomer}
              updateStatus={updateProcessStatus}
              handleNext={
                currentStep > 2
                  ? () => {
                    setCustomerAcceptable(true);
                  }
                  : null
              }
            />
            <ContentFullScreen title={quotationProcessSteps[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
              {currentStep === 0 && quotationData && (
                <Productpackage
                  quotationData={quotationData}
                  setNextStep={setNextStep}
                  renderedFrom={`${renderedFrom}_grid-1`}
                  stepFullScreen={stepFullScreen}
                  version={currentVersion}
                  allowedToEdit={allowedToEdit}
                />
              )}
              {currentStep === 1 && quotationData && (
                <Service
                  quotationData={quotationData}
                  renderedFrom={`${renderedFrom}_grid-2`}
                  setNextStep={setNextStep}
                  stepFullScreen={stepFullScreen}
                  version={currentVersion}
                />
              )}
              {currentStep === 2 && quotationData && (
                <QuoteBuilder
                  quotationData={quotationData}
                  setNextStep={setNextStep}
                  stepFullScreen={stepFullScreen}
                  fetchQuotationData={fetchQuotationData}
                  version={currentVersion}
                  currentStep={currentStep}
                  versionData={quotationData?.versions[currentVersion]}
                  allowedToEdit={allowedToEdit}
                  renderedFrom={`${renderedFrom}_grid-3`}
                />
              )}
              {currentStep === 3 && quotationData && (
                <QuoteBuilder
                  quotationData={quotationData}
                  setNextStep={setNextStep}
                  sentToCustomer={sentToCustomer}
                  stepFullScreen={stepFullScreen}
                  fetchQuotationData={fetchQuotationData}
                  version={currentVersion}
                  currentStep={currentStep}
                  versionData={quotationData?.versions[currentVersion]}
                  allowedToEdit={allowedToEdit}
                  renderedFrom={`${renderedFrom}_grid-3`}
                />
              )}
              {currentStep === 4 && quotationData && (
                <QuoteBuilder
                  quotationData={quotationData}
                  setNextStep={setNextStep}
                  stepFullScreen={stepFullScreen}
                  fetchQuotationData={fetchQuotationData}
                  version={currentVersion}
                  currentStep={currentStep}
                  versionData={quotationData?.versions[currentVersion]}
                  allowedToEdit={allowedToEdit}
                  renderedFrom={`${renderedFrom}_grid-3`}
                />
              )}
            </ContentFullScreen>
          </div>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Box>
            <RoadmapViews quoteName={quotationData?.quotationNumber} quoteId={id} versionId={currVersionId} status={'New'} />
          </Box>
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this : ${quotationData?.quotationNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
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
        <Versions
          onClose={() => setShowAllVersionStatus(false)}
          quotationId={id}
          handleChangeVersion={handleChangeVersion} />
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
      {convertConfirmBox && (
        <ConfirmationDialog
          open={convertConfirmBox}
          message={`Are you sure you want to convert quotation : ${quotationData?.quotationNumber} ?`}
          onClose={() => {
            setConvertConfirmBox(false);
          }}
          onOk={handleConvert}
        />
      )}
    </Box>
  );
};

export default QuotationDetails;
