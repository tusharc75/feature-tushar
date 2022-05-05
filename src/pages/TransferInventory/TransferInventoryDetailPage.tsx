import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs, useMediaQuery } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import DetailsPageHeader from 'src/components/DetailsPageHeader';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { transferInventory } from 'src/constants/helpers';
import ManageTransferInventory from './ManageTransferInventory';
import queryString from 'query-string';
import Steps from 'src/pages/RentalManagement/Steps';
import { MdEdit } from 'react-icons/md';
import { defaultActivityShow, transferInventorySteps, TRANSFER_INVENTORY_STATUS } from 'src/constants/helpers';
import Activity from 'src/components/Activity';
import TabPanel from 'src/components/TabPanel';
import { BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import HideWhenOffline from 'src/components/HideWhenOffline';
import Products from './Products';
import Processing from './SerializesAssets';
import LoadingTicket from './LoadingTicket';
import { camelCase } from 'lodash';

const TransferInventoryDetailPage = () => {
  const renderedFrom = camelCase(routes?.transferInventory.title);
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit, tab }: any = parsed;
  const parsedTab = tab !== undefined ? parseInt(tab) : 1;
  const {
    state: { permissions, user }
  }: any = useData();
  const [headingLabel, setHeadingLabel] = useState('');
  const [tabValue, setTabValue] = useState(parsedTab);
  const [loading, setLoading] = useState(true);
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const [isDeleting, setDeleting] = useState(false);
  const [transferInventoryData, setTransferInventoryData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [transferInventoryFields, setTransferInventoryFields] = useState([]);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [currentStep, setCurrentStep] = useState(0);
  const [locationKeys, setLocationKeys] = useState([]);
  const [nextStep, setNextStep] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);

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
          setTabValue(tab ? parseInt(tab) : 1);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setTabValue(tab ? parseInt(tab) : 1);
        }
      }
    });
  }, [locationKeys]);

  useEffect(() => {
    if (id) {
      fetchTransferInventoryData();
    }
  }, [id]);

  const getRessourceFields = () => {
    axiosInstance()
      .get('/field?resource=Transfer Inventory')
      .then(({ data: { data } }) => {
        data?.some((o) => {
          if (o?.fieldData?.fieldName === 'status') {
            setStatusOptions(
              o.fieldData.option?.filter((e) => ![TRANSFER_INVENTORY_STATUS.new, TRANSFER_INVENTORY_STATUS.inProgress].includes(e.optionValue))
            );
            return true;
          }
        });
        setTransferInventoryFields(data);
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };

  const fetchTransferInventoryData = () => {
    axiosInstance()
      .get(`${routes.transferInventory.path}/${id}`)
      .then(({ data: { data } }) => {
        getRessourceFields();
        setTransferInventoryData(data);
        setHeadingLabel(data.transferNumber);
        setCustomizedRoutes([routes.transferInventory, { title: data.transferNumber }]);
        setCurrentStep(transferInventorySteps.indexOf(data?.processStatus) !== -1 ? transferInventorySteps.indexOf(data?.processStatus) : 0);
        const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
        setAllowedToEdit(isAllowedToEdit && permissions?.transferInventory?.isUpdate);
        if (permissions?.transferInventory?.isUpdate && openEdit === 'true') {
          setOpenUpdateDialog(true);
          const params = new URLSearchParams();
          params.delete('openEdit');
          history.push({ search: params.toString() });
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    setDeleting(true);
    axiosInstance()
      .put(`${transferInventory.api}/remove`, { ids: [id] })
      .then(() => {
        setDeleting(false);
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleMainTabChange = (_, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  const updateTransferInventoryStatus = (status: string) => {
    axiosInstance()
      .put(`${routes.transferInventory.path}/${id}/status`, { status })
      .then(() => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status updated ${status} Successfully`
        });
        if (status === TRANSFER_INVENTORY_STATUS.delivered) {
          deliveredTransfer();
          updateProcessStatus(2);
        } else {
          fetchTransferInventoryData();
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const deliveredTransfer = () => {
    axiosInstance()
      .patch(`${routes.transferInventory.path}/${id}/complete`)
      .then(() => {
        fetchTransferInventoryData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const updateProcessStatus = (step: number) => {
    axiosInstance()
      .put(`${routes.transferInventory.path}/${id}/process-status`, {
        processStatus: transferInventorySteps[step]
      })
      .then(() => {})
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity);
  };

  return (
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </Grid>
      <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`}>
        <div>
          <div>
            <Paper>
              {!transferInventoryData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                    <Box marginX={1} />
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  </Box>
                </div>
              ) : (
                <DetailsPageHeader heading={headingLabel} mainPoints={{}} showHeading={true}>
                  {allowedToEdit && transferInventoryData?.status !== TRANSFER_INVENTORY_STATUS.delivered && (
                    <Button color="primary" className="buttonStyleBigScreen" variant="contained" size="small" onClick={handleOpenUpdateDialog}>
                      Edit
                    </Button>
                  )}
                  {allowedToEdit && transferInventoryData?.status !== TRANSFER_INVENTORY_STATUS.delivered && (
                    <Button className="buttonStyleSmallScreen" variant="contained" size="small" onClick={handleOpenUpdateDialog}>
                      <MdEdit size={24} />
                    </Button>
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
                  {loading || !transferInventoryData ? (
                    <Grid container spacing={2} style={{ padding: '8px' }}>
                      <CommonSkeleton lenArray={[...Array(7).keys()]} />
                    </Grid>
                  ) : (
                    <DetailsPage data={transferInventoryData} fields={transferInventoryFields} />
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Box my={2}>
                  <Steps
                    steps={transferInventorySteps}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                    isNextStep={false}
                    nextStep={nextStep}
                    updateStatus={updateProcessStatus}
                    isStepEnded={transferInventoryData?.status === TRANSFER_INVENTORY_STATUS.delivered}
                  />
                  <Box my={1}>
                    {currentStep === 0 && (
                      <Products
                        transferInventoryData={transferInventoryData}
                        setNextStep={setNextStep}
                        renderedFrom={`${renderedFrom}_grid-1`}
                        allowedToEdit={allowedToEdit}
                      />
                    )}
                    {currentStep === 1 && (
                      <Processing
                        transferInventoryData={transferInventoryData}
                        updateTransferInventoryStatus={updateTransferInventoryStatus}
                        currentStep={currentStep}
                        setNextStep={setNextStep}
                        renderedFrom={`${renderedFrom}_grid-2`}
                        statusOptions={statusOptions}
                        allowedToEdit={allowedToEdit}
                      />
                    )}
                    {currentStep === 2 && (
                      <LoadingTicket
                        transferInventoryData={transferInventoryData}
                        updateTransferInventoryStatus={updateTransferInventoryStatus}
                        currentStep={currentStep}
                        setNextStep={setNextStep}
                        renderedFrom={`${renderedFrom}_grid-3`}
                        statusOptions={statusOptions}
                        allowedToEdit={allowedToEdit}
                      />
                    )}
                  </Box>
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
                    {transferInventoryData && (
                      <div>
                        <Activity
                          resourceId={transferInventoryData?._id}
                          resource={transferInventory.resource}
                          // restrictedAddActivities={
                          //   permissions && permissions['transferInventory'] && permissions['rentalManagement'].isUpdate
                          //   ? []
                          //   : ['Attachment', 'Case']
                          // }
                          relatedTo={[
                            {
                              access: true,
                              referenceId: transferInventoryData?._id,
                              type: 'transferInventory'
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
      {showConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isDeleting}
          open={showConfirmBox}
          message={`Are you sure you want to delete this transfer inventory: ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageTransferInventory
          transferFromDisable={currentStep > 0 || transferInventoryData?.status === TRANSFER_INVENTORY_STATUS.inProgress}
          transferToDisable={currentStep >= 1}
          number={transferInventoryData?.transferNumber}
          isClone={false}
          transferInventoryId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchTransferInventoryData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </>
  );
};

export default TransferInventoryDetailPage;
