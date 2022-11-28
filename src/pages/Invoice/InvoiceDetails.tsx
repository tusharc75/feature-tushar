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
import { invoice, defaultActivityShow, invoiceProcessSteps, getUniqueCurrencies, ACTIVITY_RESOURCE } from '../../constants/helpers';
import ManageInvoiceDialog from './ManageInvoiceDialog';
import DeleteButton from '../../components/Helpers/DeleteButton';
import TabPanel from '../../components/TabPanel';
import queryString from 'query-string';
import { FaWpforms } from 'react-icons/fa';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import Steps from '../RentalManagement/Steps';
import Productpackage from './Productpackage';
import Invoice from './Invoice';
import { isMobile } from 'react-device-detect';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { GrStatusInfo } from 'react-icons/all';
import HideWhenOffline from '../../components/HideWhenOffline';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import Activity from '../../components/Activity';
import { camelCase } from 'lodash';
import ContentFullScreen from 'src/components/ContentFullScreen';

const InvoiceDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.invoice.title);
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
  const [invoiceData, setInvoiceData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [invoiceFields, setInvoiceFields] = useState([]);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [nextStep, setNextStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [statusOptions, setStatusOptions] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);

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

  const handleStatusChange = (o) => {
    if (o.optionValue && invoiceData?.status !== o.optionValue) {
      updateJobStatus(o.optionValue);
    }
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (id) {
      getRessourceFields();
      fetchInvoiceData();
    }
  }, [id]);

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= 1) {
      updateProcessStatus(invoiceProcessSteps[currentStep]);
    }
  }, [currentStep]);

  const updateProcessStatus = (processStatus) => {
    axiosInstance()
      .put(`${invoice.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => {})
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getRessourceFields = async () => {
    try {
      const response: any = await axiosInstance().get('/field?resource=Invoice');
      response?.data?.data.some((o) => {
        if (o?.fieldData?.fieldName === 'status') {
          setStatusOptions([...o.fieldData.option]);
          return true;
        }
      });
      setInvoiceFields(response?.data?.data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchInvoiceData = async () => {
    setLoading(true);

    try {
      let data;
      const response: any = await axiosInstance().get(`${invoice.api}/${id}`);
      data = response?.data?.data;

      setCurrentStep(invoiceProcessSteps.indexOf(data?.processStatus) !== -1 ? invoiceProcessSteps.indexOf(data?.processStatus) : 0);
      setHeadingLabel(data.invoiceNumber);
      setCustomizedRoutes([routes.invoice, { title: `${data.invoiceNumber}` }]);
      setInvoiceData(data);

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

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${invoice.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${invoice.api}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const updateJobStatus = (status) => {
    axiosInstance()
      .patch(`${invoice.api}/status/${invoiceData._id}`, { status: status })
      .then(({ data: { data } }) => {
        fetchInvoiceData();
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
    <>
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>

        <div className={`detail-container ${showActivity || isSmallScreen ? 'grid-with-activity' : 'grid-without-activity'}`}>
          <div>
            <div>
              <Paper>
                {!invoiceData ? (
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
                    {permissions?.invoice?.isUpdate && allowedToEdit && (
                      <Button className="buttonStyleBigScreen" variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                        Edit
                      </Button>
                    )}

                    {permissions?.invoice?.isDelete && ['Invoiced', 'Closed'].indexOf(invoiceData?.status) === -1 && (
                      <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                    )}

                    {permissions?.invoice?.isUpdate && ['Ready to Invoice', 'Invoiced'].includes(invoiceData?.status) && (
                      <>
                        <Button
                          variant="outlined"
                          color="default"
                          size="small"
                          onClick={openActions}
                          aria-controls="action-menu"
                          endIcon={isMobile ? <ExpandMore style={{ width: '12px', height: '12px' }} /> : <ExpandMore />}
                        >
                          {isMobile ? <GrStatusInfo size={20} /> : 'Change Status'}
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
                          onClose={closeActions}
                        >
                          {statusOptions?.map((o, index) => {
                            return (
                              <MenuItem
                                disabled={index <= statusOptions.findIndex((d) => d.optionLabel === invoiceData?.status)}
                                onClick={() => {
                                  closeActions();
                                  handleStatusChange(o);
                                }}
                                value={o}
                              >
                                {o?.optionLabel}
                              </MenuItem>
                            );
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
                    {loading || !invoiceFields.length ? (
                      <Grid container spacing={2} style={{ padding: '8px' }}>
                        <CommonSkeleton lenArray={[...Array(7).keys()]} />
                      </Grid>
                    ) : (
                      <>
                        <DetailsPage data={invoiceData} fields={invoiceFields} />
                      </>
                    )}
                  </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Paper>
                    <Steps
                      isNextStep={false}
                      nextStep={nextStep}
                      steps={invoiceProcessSteps}
                      currentStep={currentStep}
                      setCurrentStep={setCurrentStep}
                      isStepEnded={['Invoiced', 'Closed'].includes(invoiceData?.status)}
                    />
                    <ContentFullScreen title={invoiceProcessSteps[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                      {currentStep === 0 && invoiceData && (
                        <Productpackage
                          invoiceData={invoiceData}
                          setNextStep={setNextStep}
                          currencySymbol={currencySymbol}
                          renderedFrom={`${renderedFrom}_grid-1`}
                          showActivity={showActivity}
                          stepFullScreen={stepFullScreen}
                          updateJobStatus={updateJobStatus}
                          currentStep={currentStep}
                        />
                      )}

                      {currentStep === 1 && invoiceData && (
                        <Invoice
                          invoiceData={invoiceData}
                          setNextStep={setNextStep}
                          currencySymbol={currencySymbol}
                          updateJobStatus={updateJobStatus}
                          stepFullScreen={stepFullScreen}
                          statusOptions={statusOptions}
                          showActivity={showActivity}
                          renderedFrom={`${renderedFrom}_grid-5`}
                        />
                      )}
                    </ContentFullScreen>
                  </Paper>
                </TabPanel>
              </Paper>
            </div>
            <Box my={1} />
          </div>

          <div className="position-relative">
            <HideWhenOffline>
              {/* {showActivity ?
                <Paper>
                  {!isMobile && !isTablet && <span className="activityHide cursor-pointer" onClick={handleActivityHideShow}>
                    <IoIosArrowDropright className="icon" />
                  </span>}
                  <Grid container>
                    <Grid item xs={12}>
                      {rentalManagementData && (
                        <div>
                          <Activity
                            resourceId={rentalManagementData._id}
                            resource={rentalManagement.resource}
                            restrictedAddActivities={
                              permissions &&
                                permissions["rentalManagement"] &&
                                permissions["rentalManagement"].isUpdate
                                ? []
                                : ["Attachment", "Case"]
                            }
                            relatedTo={[
                              {
                                type: rentalManagement,
                                referenceId: rentalManagementData._id,
                                access: true,
                              },
                            ]}
                            handleActivityRefresh={() => { }}
                            emails={[]}
                          />
                        </div>
                      )}
                    </Grid>
                  </Grid>
                </Paper> :
                !isMobile && !isTablet && <span className="activityShow cursor-pointer" onClick={handleActivityHideShow}>
                  <IoIosArrowDropleft className="icon" />
                </span>} */}
              <Paper>
                {!isSmallScreen && (
                  <span className={`${showActivity ? 'activityHide' : 'activityShow'} cursor-pointer`} onClick={handleActivityHideShow}>
                    {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
                  </span>
                )}
                <div style={{ display: showActivity ? 'block' : 'none' }}>
                  <Grid container>
                    <Grid item xs={12}>
                      {invoiceData && (
                        <div>
                          <Activity
                            resourceId={invoiceData._id}
                            resource={ACTIVITY_RESOURCE.invoice}
                            restrictedAddActivities={
                              permissions && permissions[`${ACTIVITY_RESOURCE.invoice}`] && permissions[`${ACTIVITY_RESOURCE.invoice}`].isUpdate
                                ? []
                                : ['Attachment', 'Case']
                            }
                            relatedTo={[
                              {
                                type: ACTIVITY_RESOURCE.invoice,
                                referenceId: invoiceData._id,
                                access: true
                              }
                            ]}
                            handleActivityRefresh={() => {}}
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
          message={`Are you sure you want to delete this invoice: ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageInvoiceDialog
          isClone={false}
          open={openUpdateDialog}
          invoiceId={id}
          invoiceData={invoiceData}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            invoiceData();
          }}
        />
      )}
    </>
  );
};

export default InvoiceDetails;
