import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Tabs, Tab, useMediaQuery, Menu, MenuItem } from '@material-ui/core';
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
import { quotation, defaultActivityShow, getUniqueCurrencies, ACTIVITY_RESOURCE, quotationProcessSteps } from '../../constants/helpers';
import ManageQuotationDialog from './ManageQuotationDialog';
import DeleteButton from '../../components/Helpers/DeleteButton';
import TabPanel from '../../components/TabPanel';
import queryString from 'query-string';
import { FaWpforms } from 'react-icons/fa';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import Steps from '../RentalManagement/Steps';
import Productpackage from './Productpackage';
import AdditionalCost from './AdditionalCost';
import { isMobile } from "react-device-detect";
import ExpandMore from '@material-ui/icons/ExpandMore';
import { GrStatusInfo } from "react-icons/all";
import HideWhenOffline from '../../components/HideWhenOffline';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import Activity from '../../components/Activity';
import { camelCase } from 'lodash';
import Service from './Service';
import QuoteBuilder from './QuoteBuilder';

const QuotationDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.quotation.title)
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
  const [statusOptions, setStatusOptions] = useState([])
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

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

  // useEffect(() => {
  //   if (id) {
  //   }
  //   // eslint-disable-next-line
  // }, [id]);

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


  const handleStatusChange = o => {
    if (o.optionValue && quotationData?.status !== o.optionValue) {
      updateJobStatus(o.optionValue)
    }
  }

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (id) {
      getRessourceFields();
      fetchQuotationData();
    }
  }, [id]);

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= 5) {
      updateProcessStatus(quotationProcessSteps[currentStep])
    }
  }, [currentStep]);

  const updateProcessStatus = (processStatus) => {
    axiosInstance().put(`${quotation.api}/${id}/process-status`, { processStatus: processStatus }).then(({ data }) => { })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

  const getRessourceFields = async () => {
    try {
      const response: any = await axiosInstance().get('/field?resource=Quotation');
      response?.data?.data.some(o => {
        if (o?.fieldData?.fieldName === "status") {
          setStatusOptions([...o.fieldData.option])
          return true
        }
      })
      setQuotationFields(response?.data?.data);

    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchQuotationData = async () => {
    setLoading(true);

    try {
      let data;
      const response: any = await axiosInstance().get(`${quotation.api}/${id}`);
      data = response?.data?.data;


      setCurrentStep(quotationProcessSteps.indexOf(data?.processStatus) !== -1 ? quotationProcessSteps.indexOf(data?.processStatus) : 0);
      setHeadingLabel(data.quotationNumber);
      setCustomizedRoutes([routes.quotation, { title: `${data.quotationNumber}` }]);
      setQuotationData(data);

      setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === data['currency'])?.symbolNative);
      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);

      setAllowedToEdit(isAllowedToEdit && ["Invoiced", "Closed"].indexOf(data.status) === -1);

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
    // need to change the api
    axiosInstance().patch(`${quotation.api}/status/${quotationData._id}`, { status: status }).then(({ data: { data } }) => {
      fetchQuotationData();
      if (status === "Invoiced") {
        setCurrentStep(1)
      }
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: `Status changed to ${status}`
      });
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  }

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
                    {(permissions?.quotation?.isUpdate && allowedToEdit) && (
                      <Button className="buttonStyleBigScreen" variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                        Edit
                      </Button>
                    )}
                    {permissions?.quotation?.isDelete && ["Invoiced", "Closed"].indexOf(quotationData?.status) === -1 && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
                    {permissions?.quotation?.isUpdate && (["Ready to Invoice", "Invoiced"].includes(quotationData?.status)) && (
                      <>
                        <Button
                          variant="outlined"
                          color="default"
                          size="small"
                          onClick={openActions}
                          aria-controls="action-menu"
                          endIcon={isMobile ? <ExpandMore style={{ width: "12px", height: "12px" }} /> : <ExpandMore />}
                        >
                          {isMobile ? <GrStatusInfo size={20} /> : "Change Status"}
                        </Button>
                        <Menu
                          anchorEl={anchorEl}
                          keepMounted
                          getContentAnchorEl={null}
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left'
                          }}
                          id="action-menu"
                          open={Boolean(anchorEl)}
                          onClose={closeActions}>
                          {statusOptions?.map((o, index) => {
                            return <MenuItem
                              disabled={index <= statusOptions.findIndex(d => d.optionLabel === quotationData?.status)}
                              onClick={() => {
                                closeActions()
                                handleStatusChange(o)
                              }}
                              value={o}>{o?.optionLabel}</MenuItem>
                          })}
                        </Menu>
                      </>
                    )}
                  </DetailsPageHeader>
                )}
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
                      color: tabValue === 2 ? 'blue' : '#163340'
                    }}
                    label={
                      <div className="d-flex align-items-center tab-font">
                        <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                      </div>
                    }
                    {...a11yProps(1)}
                  />
                  <div className={'uio'}> </div>

                </Tabs>
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
                  <Paper>
                    <Steps
                      isNextStep={false}
                      nextStep={nextStep}
                      steps={quotationProcessSteps}
                      currentStep={currentStep}
                      setCurrentStep={setCurrentStep}
                      isStepEnded={["Invoiced", "Closed"].includes(quotationData?.status)}
                    />
                    {currentStep === 0 && quotationData && (
                      <Productpackage
                        quotationData={quotationData}
                        setNextStep={setNextStep}
                        currencySymbol={currencySymbol}
                        renderedFrom={`${renderedFrom}_grid-1`}
                        showActivity={showActivity}
                      />
                    )}
                    {currentStep === 1 && quotationData &&
                      <Service
                        quotationData={quotationData}
                        renderedFrom={`${renderedFrom}_grid-2`}
                        setNextStep={setNextStep}
                      />
                    }
                    {currentStep === 2 && quotationData && (
                      <QuoteBuilder
                        quotationData={quotationData}
                        setNextStep={setNextStep}
                        currencySymbol={currencySymbol}
                        showActivity={showActivity} />
                    )}
                    {currentStep === 3 && quotationData && (
                      <QuoteBuilder
                        quotationData={quotationData}
                        setNextStep={setNextStep}
                        currencySymbol={currencySymbol}
                        sendToCustomer={true}
                        showActivity={showActivity} />
                    )}
                    {currentStep === 4 && quotationData && (
                      <QuoteBuilder
                        quotationData={quotationData}
                        setNextStep={setNextStep}
                        currencySymbol={currencySymbol}
                        showActivity={showActivity} />
                    )}
                  </Paper>
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
    </>
  );
};

export default QuotationDetails;