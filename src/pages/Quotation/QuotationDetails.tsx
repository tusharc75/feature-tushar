import { useState, useEffect, useContext, Fragment, useMemo } from 'react';
import { Grid, Box, Button, Paper, Tabs, Tab, useMediaQuery, Menu, MenuItem, Dialog, Tooltip, Typography } from '@material-ui/core';
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
import {
  quotation,
  defaultActivityShow,
  getUniqueCurrencies,
  ACTIVITY_RESOURCE,
  quotationProcessSteps,
  CustomDialogTransition,
  currencyCodeToSymbol,
  QUOTATION_STATUS
} from '../../constants/helpers';
import ManageQuotationDialog from './ManageQuotationDialog';
import DeleteButton from '../../components/Helpers/DeleteButton';
import TabPanel from '../../components/TabPanel';
import queryString from 'query-string';
import { FaWpforms } from 'react-icons/fa';
import { BiEdit, BiFoodMenu, BiLayerPlus } from 'react-icons/bi';
import Steps from './Steps';
import Productpackage from './Productpackage';
import AdditionalCost from './AdditionalCost';
import { isMobile, isTablet } from 'react-device-detect';
import ExpandMore from '@material-ui/icons/ExpandMore';
import {
  FcClock,
  FcOk,
  FcCancel,
  GiReceiveMoney,
  GrStatusInfo,
  HiPencil,
  IoArrowDownCircleSharp,
  MdDelete,
  MdDeleteSweep,
  RiFlowChart,
  VscVersions
} from 'react-icons/all';
import HideWhenOffline from '../../components/HideWhenOffline';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import Activity from '../../components/Activity';
import { camelCase } from 'lodash';
import Service from './Service';
import QuoteBuilder from './QuoteBuilder';
import RoadmapViews from './RoadMapViews';
import ContentFullScreen from 'src/components/ContentFullScreen';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import contactClass from '../Contact/contact.module.scss';
import { CircularProgress } from '@material-ui/core';
import Versions from './Versions';

const QuotationDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.quotation.title);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit, tab }: any = parsed;

  const {
    state: { user, permissions }
  }: any = useData();

  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');

  const [headingLabel, setHeadingLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [quotationData, setQuotationData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [quotationFields, setQuotationFields] = useState([]);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [nextStep, setNextStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [statusOptions, setStatusOptions] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorElAction, setAnchorElAction] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showQuotationSummaryDialog, setShowQuotationSummaryDialog] = useState(false);
  const [redCard, setRedCard] = useState(false);
  const [quotationSummary, setQuotationSummary] = useState({
    totalProfit: null,
    totalcost: null,
    totalsale: null
  });
  const [currentVersion, setCurrentVersion] = useState(0);
  const [isCloning, setCloning] = useState(false);
  const [showAllVersionStatus, setShowAllVersionStatus] = useState(false);
  const [currVersionId, setCurrVersionId] = useState(null);
  const [sentToCustomer, setSentToCustomer] = useState(false);
  const [versionStatus, setVersionStatus] = useState(QUOTATION_STATUS.acceptByCustomer);

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

  const defaultTotalValue = useMemo(() => {
    let result = '0';
    if (quotationData && quotationData?.currency) {
      result = `${currencyCodeToSymbol(quotationData.currency)} 0`;
    }
    return result;
  }, [quotationData]);

  const handleChangeVersion = (versionNumber) => {
    fetchQuotationData(versionNumber);
    setCurrentVersion(versionNumber);
    setShowAllVersionStatus(false);
  };

  const handleCloneQuotationWithVersionFromAllVersion = (versionNumber) => {
    setOpenUpdateDialog(true);
    setShowAllVersionStatus(false);
  };

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity);
  };

  useEffect(() => {
    if (isSmallScreen && tabValue === 0) {
      setActivityShow(true);
    } else {
      setActivityShow(false);
    }
  }, [isSmallScreen, tabValue]);

  const handleStatusChange = (o) => {
    if (o.optionValue && quotationData?.status !== o.optionValue) {
      updateJobStatus(o.optionValue);
    }
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
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

  const getRessourceFields = async () => {
    try {
      const response: any = await axiosInstance().get('/field?resource=Quotation');
      response?.data?.data.some((o) => {
        if (o?.fieldData?.fieldName === 'status') {
          setStatusOptions([...o.fieldData.option]);
          return true;
        }
      });
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

      setHeadingLabel(data.quotationNumber);
      setCustomizedRoutes([routes.quotation, { title: `${data.quotationNumber}` }]);
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
      setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === data['currency'])?.symbolNative);
      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);

      setAllowedToEdit(isAllowedToEdit && ['Invoiced', 'Closed'].indexOf(data.status) === -1);

      if (isAllowedToEdit && openEdit === 'true') {
        setOpenUpdateDialog(true);
        const params = new URLSearchParams();
        params.delete('openEdit');
        history.push({ search: params.toString() });
      }
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
      .delete(`/quotation/${quotationData._id}/${currVersionId}`)
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

  const updateJobStatus = (status) => {
    axiosInstance()
      .patch(`${quotation.api}/status/${quotationData._id}`, { status: status })
      .then(({ data: { data } }) => {
        fetchQuotationData();
        if (status === 'Invoiced') {
          setCurrentStep(1);
        }
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

  const findProfitPercentage = (CP, Profit) => {
    let parsedCP = parseInt(CP?.amountWithouCurrencyCode?.replace(/[^0-9]/g, '') ?? 0);
    let profit = parseInt(Profit?.amountWithouCurrencyCode?.replace(/[^0-9]/g, '') ?? 0);
    return ((profit * 100) / parsedCP).toFixed(2);
  };

  return (
    <>
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`}>
          <div>
            <div>
              <Paper>
                {!quotationData ? (
                  <div>
                    <Skeleton variant="text" width="150px" height="40px" />
                    <Box display="flex">
                      <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                      <Box marginX={1} />
                      <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                    </Box>
                  </div>
                ) : (
                  <DetailsPageHeader heading={headingLabel} mainPoints={[]} showHeading={true}>
                    <Tooltip title="Quote Summary">
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
                    </Tooltip>

                    <Tooltip title={`Version : ${currentVersion}`}>
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
                    </Tooltip>
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
                      {permissions?.quotation?.isUpdate && allowedToEdit && (
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
                    </Menu>
                  </DetailsPageHeader>
                )}
                {loading ? (
                  <Box padding={2}>
                    <Grid container spacing={2}>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                        <Grid item sm={6} md={6} key={i}>
                          <Skeleton variant="text" width="100px" height="16px" />
                          <Box marginY={1} />
                          <Skeleton width="100%" height="50px" />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ) : (
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
                        color: '#163340'
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                        </div>
                      }
                      {...a11yProps(1)}
                    />
                    <Tab
                      className={'tabLayout'}
                      style={{
                        background: tabValue === 2 ? 'white' : '',
                        color: tabValue === 2 ? 'blue' : '#163340'
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          <RiFlowChart className="mr-1" fontSize="inherit" /> Views
                        </div>
                      }
                      {...a11yProps(2)}
                    />
                    <div className={'uio'}> </div>
                  </Tabs>
                )}
                <TabPanel value={tabValue} index={0}>
                  <Box>
                    {loading || !quotationFields.length ? (
                      <Grid container spacing={2} style={{ padding: '8px' }}>
                        <CommonSkeleton lenArray={[...Array(7).keys()]} />
                      </Grid>
                    ) : (
                      <>
                        <DetailsPage data={quotationData} fields={quotationFields} />
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
                    <Paper>
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
                        quotationId={id}
                        versionId={currVersionId}
                        status={versionStatus}
                      />
                      <ContentFullScreen title={quotationProcessSteps[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                        {currentStep === 0 && quotationData && (
                          <Productpackage
                            quotationData={quotationData}
                            setNextStep={setNextStep}
                            currencySymbol={currencySymbol}
                            renderedFrom={`${renderedFrom}_grid-1`}
                            showActivity={showActivity}
                            stepFullScreen={stepFullScreen}
                            setQuotationSummary={setQuotationSummary}
                            version={currentVersion}
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
                            currencySymbol={currencySymbol}
                            showActivity={showActivity}
                            stepFullScreen={stepFullScreen}
                            fetchQuotationData={fetchQuotationData}
                            setQuotationSummary={setQuotationSummary}
                            version={currentVersion}
                            currentStep={currentStep}
                            versionData={quotationData.versions[currentVersion]}
                          />
                        )}
                        {currentStep === 3 && quotationData && (
                          <QuoteBuilder
                            quotationData={quotationData}
                            setNextStep={setNextStep}
                            currencySymbol={currencySymbol}
                            sentToCustomer={sentToCustomer}
                            showActivity={showActivity}
                            stepFullScreen={stepFullScreen}
                            fetchQuotationData={fetchQuotationData}
                            setQuotationSummary={setQuotationSummary}
                            version={currentVersion}
                            currentStep={currentStep}
                            versionData={quotationData.versions[currentVersion]}
                          />
                        )}
                        {currentStep === 4 && quotationData && (
                          <QuoteBuilder
                            quotationData={quotationData}
                            setNextStep={setNextStep}
                            currencySymbol={currencySymbol}
                            showActivity={showActivity}
                            stepFullScreen={stepFullScreen}
                            fetchQuotationData={fetchQuotationData}
                            setQuotationSummary={setQuotationSummary}
                            version={currentVersion}
                            currentStep={currentStep}
                            versionData={quotationData.versions[currentVersion]}
                          />
                        )}
                      </ContentFullScreen>
                    </Paper>
                  </div>
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                  <Box>
                    <RoadmapViews quoteName={headingLabel} quoteId={id} versionId={currVersionId} status={'New'} />
                  </Box>
                </TabPanel>
              </Paper>
            </div>
            <Box my={1} />
          </div>
          <div className="position-relative">
            <HideWhenOffline>
              <Paper>
                {!isSmallScreen && (
                  <span className={`${showActivity ? 'activityHide' : 'activityShow'} cursor-pointer`} onClick={handleActivityHideShow}>
                    {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
                  </span>
                )}
                <div style={{ display: showActivity ? 'block' : 'none' }}>
                  <Grid container>
                    <Grid item xs={12}>
                      {quotationData && (
                        <div>
                          <Activity
                            resourceId={quotationData._id}
                            resource={ACTIVITY_RESOURCE.quotation}
                            restrictedAddActivities={
                              permissions && permissions[`${ACTIVITY_RESOURCE.quotation}`] && permissions[`${ACTIVITY_RESOURCE.quotation}`].isUpdate
                                ? []
                                : ['Attachment', 'Case']
                            }
                            relatedTo={[
                              {
                                type: ACTIVITY_RESOURCE.quotation,
                                referenceId: quotationData._id,
                                access: true
                              }
                            ]}
                            handleActivityRefresh={() => { }}
                            emails={[]}
                          />
                        </div>
                      )}
                    </Grid>
                  </Grid>
                </div>
              </Paper>
            </HideWhenOffline>
          </div>
        </div>
      </Fragment>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this sales order: ${headingLabel} ?`}
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
        <Dialog
          open={showQuotationSummaryDialog}
          aria-labelledby="customized-dialog-title"
          maxWidth="md"
          onClose={() => {
            setShowQuotationSummaryDialog(false);
          }}
          fullWidth
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
        >
          <CustomDialogHeader
            title="Quotation Summary"
            onClose={() => {
              setShowQuotationSummaryDialog(false);
            }}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            showRequiredLabel={false}
          />
          <CustomDialogContent>
            <Grid item className="quoteHeader">
              <div className={redCard ? 'quoteBox quoteRed' : 'quoteBox quoteProfit'}>
                <span className="quoteAmount" title={quotationSummary?.totalProfit?.fullFormatAmount}>
                  {quotationSummary?.totalProfit?.fullFormatAmount ? quotationSummary?.totalProfit?.fullFormatAmount : defaultTotalValue}{' '}
                  {quotationSummary?.totalcost?.fullFormatAmount
                    ? `(${findProfitPercentage(quotationSummary?.totalcost, quotationSummary?.totalProfit)} %)`
                    : ''}
                </span>
                <div className={'quoteBoxContent'}>
                  <span className={'quoteDetailHeading'}>Total Profit </span>
                </div>
              </div>
              <div className="quoteBox quoteCost">
                <span className="quoteAmount" title={quotationSummary?.totalcost?.fullFormatAmount}>
                  {quotationSummary?.totalcost?.fullFormatAmount ? quotationSummary?.totalcost?.fullFormatAmount : defaultTotalValue}
                </span>
                <div className={'quoteBoxContent'}>
                  <span className={'quoteDetailHeading'}>Total Cost Price </span>
                </div>
              </div>
              {redCard ? (
                <div className="quoteBox quoteRed">
                  <div className={'quoteBoxContent'}>
                    {' '}
                    <span>Total Selling Price </span>
                  </div>
                  <span className="quoteAmount" title={quotationSummary?.totalsale?.fullFormatAmount}>
                    {quotationSummary?.totalsale?.fullFormatAmount ? quotationSummary?.totalsale?.fullFormatAmount : defaultTotalValue}
                  </span>
                </div>
              ) : (
                <div className="quoteBox quoteSale">
                  <span className="quoteAmount" title={quotationSummary?.totalsale?.fullFormatAmount}>
                    {quotationSummary?.totalsale?.fullFormatAmount ? quotationSummary?.totalsale?.fullFormatAmount : defaultTotalValue}
                  </span>
                  <div className={'quoteBoxContent'}>
                    <span className={'quoteDetailHeading'}>Total Selling Price </span>
                  </div>
                </div>
              )}
            </Grid>
          </CustomDialogContent>
        </Dialog>
      )}
      {quotationData && showAllVersionStatus && (
        <Versions
          onClose={() => setShowAllVersionStatus(false)}
          quotationId={id}
          handleChangeVersion={handleChangeVersion}
        />
      )}
    </>
  );
};

export default QuotationDetails;
