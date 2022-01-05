import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Tabs, Tab, useMediaQuery } from '@material-ui/core';
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
import { salesOrder, defaultActivityShow, salesOrderProcessSteps, getUniqueCurrencies } from '../../constants/helpers';
import ManageSalesOrder from './ManageSalesOrder';
import DeleteButton from '../../components/Helpers/DeleteButton';
import TabPanel from '../../components/TabPanel';
import queryString from 'query-string';
import { FaWpforms } from 'react-icons/fa';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import Steps from './Steps';
import Productpackage from './Productpackage';
import AdditionalCost from './AdditionalCost';
import SerializedAsset from './SerializedAsset';
import LoadingTicket from './LoadingTicket';
import Invoice from './Invoice';
import { findOne, objectStore } from '../../constants/indexdbhelper';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';

const SalesOrderDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const { isOffline, updateOfflineGridData } = useContext(CustomOfflineContext);

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
  const [salesOrderData, setSalesOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [salesOrderFields, setSalesOrderFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [nextStep, setNextStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [statusOptions, setStatusOptions] = useState([])
  const [allowedToEdit, setAllowedToEdit] = useState(false);

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

  useEffect(() => {
    if (id) {
      getRessourceFields();
      fetchSalesOrderData();
    }
  }, [id]);

  useEffect(() => {
    if (!isOffline && currentStep !== null && currentStep >= 0 && currentStep <= 5) {
      updateProcessStatus(salesOrderProcessSteps[currentStep])
    }
  }, [currentStep]);

  const updateProcessStatus = (processStatus) => {
    axiosInstance().put(`${salesOrder.salesOrderApi}/${id}/process-status`, { processStatus: processStatus }).then(({ data }) => { })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

  // const handleMainPoints = (data) => {
  //   let mainPoint = {};
  //   mainPoint['Sales Order No.'] = data?.salesOrderNo || '';
  //   setMainPoints(mainPoint);
  // };

  const getRessourceFields = async () => {
    try {
      if (!isOffline) {
        const response: any = await axiosInstance().get('/field?resource=Sales Order');
        response?.data?.data.some(o => {
          if (o?.fieldData?.fieldName === "status") {
            setStatusOptions([...o.fieldData.option])
            return true
          }
        })
        setSalesOrderFields(response?.data?.data);
      } else {
        const response: any = await findOne(objectStore.resource, objectStore.rentalManagement)
        setSalesOrderFields(response);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchSalesOrderData = async () => {
    setLoading(true);

    try {
      let data;
      if (!isOffline) {
        const response: any = await axiosInstance().get(`${salesOrder.salesOrderApi}/${id}`);
        data = response?.data?.data;
      } else {
        data = await findOne(objectStore.salesOrder, id)
      }

      setCurrentStep(salesOrderProcessSteps.indexOf(data?.processStatus) !== -1 ? salesOrderProcessSteps.indexOf(data?.processStatus) : 0);
      setHeadingLabel(data.salesOrderNo);
      setCustomizedRoutes([routes.salesOrder, { title: `${data.salesOrderNo}` }]);
      setSalesOrderData(data);

      setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === data['currency'])?.symbolNative);
      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);

      setAllowedToEdit(isAllowedToEdit);

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
      .put(`${salesOrder.salesOrderApi}/remove`, { ids: [id] })
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
    //  need to change the api
    // axiosInstance().patch(`${rentalManagement.rentalManagementApi}/status/${rentalManagementData._id}`, { status: status }).then(({ data: { data } }) => {
    //   fetchRentalManagementData();
    //   if (status === "Invoiced") {
    //     setCurrentStep(4)
    //   }
    //   toastConfig.setToastConfig({
    //     open: true,
    //     type: 'success',
    //     message: `Status changed to ${status}`
    //   });
    // }).catch((error) => {
    //   toastConfig.setToastConfig(error);
    // });
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
                {!salesOrderData ? (
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

                    {(permissions?.salesOrder?.isUpdate && allowedToEdit && !isOffline) && (
                      <Button className="buttonStyleBigScreen" variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                        Edit
                      </Button>
                    )}

                    {permissions?.salesOrder?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
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

                <TabPanel value={tabValue} index={1}>
                  <Paper>
                    <Steps
                      isNextStep={false}
                      nextStep={nextStep}
                      steps={salesOrderProcessSteps}
                      currentStep={currentStep}
                      setCurrentStep={setCurrentStep}
                    />
                    {currentStep === 0 && salesOrderData && (
                      <Productpackage
                        salesOrderData={salesOrderData}
                        setNextStep={setNextStep}
                        currencySymbol={currencySymbol} />
                    )}
                    {currentStep === 1 && salesOrderData &&
                      <AdditionalCost
                        salesOrderData={salesOrderData}
                        setNextStep={setNextStep} />}
                    {currentStep === 2 && salesOrderData && (
                      <SerializedAsset
                        rentalManagementData={salesOrderData}
                        setNextStep={setNextStep}
                        isSmallScreen={isSmallScreen}
                        isTabletScreen={isTabletScreen}
                        showActivity={showActivity}
                        currencySymbol={currencySymbol}
                      />
                    )}
                    {currentStep === 3 && salesOrderData && (
                      <LoadingTicket
                        fetchRentalData={fetchSalesOrderData}
                        rentalManagementData={salesOrderData}
                        currentStep={currentStep}
                        setNextStep={setNextStep}
                      />
                    )}

                    {(currentStep === 4) && salesOrderData && (
                      <Invoice
                        rentalManagementData={salesOrderData}
                        setNextStep={setNextStep}
                        fetchRentalData={fetchSalesOrderData}
                        updateJobStatus={updateJobStatus}
                        statusOptions={statusOptions}
                      />
                    )}
                  </Paper>
                </TabPanel>

              </Paper>
            </div>
            <Box my={1} />
          </div>

          <div className="position-relative">

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
        <ManageSalesOrder
          open={openUpdateDialog}
          isClone={false}
          salesOrderId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchSalesOrderData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </>
  );
};

export default SalesOrderDetails;
