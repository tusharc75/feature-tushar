import { useState, useEffect, useContext } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs, useMediaQuery, Divider, CircularProgress } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import DetailsPageHeader from 'src/components/DetailsPageHeader';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { workOrder, sidebarResource, ACTIVITY_RESOURCE } from 'src/constants/helpers';
import Activity from 'src/components/Activity';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import queryString from 'query-string';
import { BiEdit } from 'react-icons/bi';
import TabPanel from 'src/components/TabPanel';
import { defaultActivityShow } from 'src/constants/helpers';
import { camelCase } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import accountClass from '../Account/account.module.scss';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import ManageWorkOrder from './ManageWorkOrder';
import Service from './Service';
import View from './View';
import Consumables from './Consumables';
import VisibilityIcon from '@material-ui/icons/Visibility';

const WorkOrderDetails = () => {

  const toastConfig = useContext(CustomToastContext);
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');
  const { id } = useParams();
  const history = useHistory();

  const parsed = queryString.parse(history.location.search);
  const { openEdit, tab }: any = parsed;
  const {
    state: { user, permissions }
  }: any = useData();

  const [workOrderData, setWorkOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [workOrderFields, setWorkOrderFields] = useState([]);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [locationKeys, setLocationKeys] = useState([]);
  const [previewPdf, setPreviewPdf] = useState(false);

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
      fetchWorkOrderData();
    }
  }, [id]);

  useEffect(() => {
    getResourceFields();
  }, []);

  const getResourceFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.workOrder}`)
      .then(({ data: { data } }) => {
        setWorkOrderFields(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchWorkOrderData = () => {
    axiosInstance()
      .get(`${routes.workOrder.path}/${id}`)
      .then(({ data: { data } }) => {
        setWorkOrderData({ ...data });
        const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
        setAllowedToEdit(isAllowedToEdit && permissions?.workOrder?.isUpdate ? true : false);
        if (permissions?.workOrder?.isUpdate && openEdit === 'true') {
          setOpenUpdateDialog(true);
          const params = new URLSearchParams();
          params.delete('openEdit');
          history.push({ search: params.toString() });
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${workOrder.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
    if (newValue === 0) {
      fetchWorkOrderData();
    }
  };

  useEffect(() => {
    if (isSmallScreen && tabValue === 0) {
      setActivityShow(true);
    } else {
      setActivityShow(false);
    }
  }, [isSmallScreen, tabValue]);

  const previewWorkOrderPdf = () => {
    setPreviewPdf(true);

    axiosInstance()
      .get(`${workOrder.api}/${id}/pdf`)
      .then(({ data }) => {
        axiosInstance()
          .get(`user/download?fileName=${data.data.fileName}`, {
            responseType: 'blob'
          })
          .then(({ data }) => {
            const file = new Blob([data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            const pdfWindow = window.open();
            pdfWindow.location.href = fileURL;
            toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
            setPreviewPdf(false);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
            setPreviewPdf(false);
          });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setPreviewPdf(false);
      });
  };

  return (
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={[routes.workOrder, { title: workOrderData?.workOrderNumber }]} />
      </Grid>
      <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`}>
        <div>
          <Paper>
            {workOrderData ? (
              <DetailsPageHeader heading={workOrderData?.workOrderNumber} mainPoints={null} showHeading={true}>
                <Button
                  variant={isMobile && !isTablet ? 'text' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={previewWorkOrderPdf}
                  className={isMobile && !isTablet ? accountClass.mobile_button_layout : ''}
                  style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                  endIcon={previewPdf ? <CircularProgress size={20} /> : null}
                  disabled={previewPdf}
                >
                  {isMobile && !isTablet ? <VisibilityIcon color="primary" /> : 'Preview'}
                </Button>
                {permissions?.workOrder?.isUpdate && allowedToEdit && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    color="primary"
                    size="small"
                    onClick={() => setOpenUpdateDialog(true)}
                    className={isMobile && !isTablet ? accountClass.mobile_button_layout : ''}
                    style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                  >
                    {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                  </Button>
                )}
                {permissions?.workOrder?.isDelete && allowedToEdit && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </DetailsPageHeader>
            ) : (
              <Skeleton variant="text" width="150px" height="40px" />
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
              <Tab label="Header" value={0} aria-controls="a11y-tabpanel-0" id="a11y-tab-0" />
              <Tab label="Services" value={1} aria-controls="a11y-tabpanel-0" id="a11y-tab-0" />
              <Tab label="Products/Consumables" value={2} aria-controls="a11y-tabpanel-0" id="a11y-tab-0" />
              <Tab label="Views" value={3} aria-controls="a11y-tabpanel-0" id="a11y-tab-0" />
            </Tabs>
            <TabPanel value={tabValue} index={0}>
              <Box>
                {workOrderData && workOrderFields.length ? (
                  <DetailsPage data={workOrderData} fields={workOrderFields} />
                ) : (
                  <Grid container spacing={2} style={{ padding: '8px' }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                )}
              </Box>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <Service workOrderData={workOrderData} workOrderId={id} allowedToEdit={allowedToEdit} />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <Consumables allowedToEdit={allowedToEdit} workOrderId={id} />
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <Box>
                <View workOrderName={workOrderData?.workOrderNumber || ''} workOrderId={id} workOrderStatus={workOrderData?.status} />
              </Box>
            </TabPanel>
          </Paper>
          <Box my={1} />
        </div>
        <div className="position-relative">
          <Paper>
            {!isSmallScreen && (
              <span className={`${showActivity ? 'activityHide' : 'activityShow'} cursor-pointer`} onClick={() => setActivityShow(!showActivity)}>
                {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
              </span>
            )}
            <div style={{ display: showActivity ? 'block' : 'none' }}>
              <Grid container>
                <Grid item xs={12}>
                  {workOrderData && (
                    <div>
                      <Activity
                        resourceId={workOrderData._id}
                        resource={ACTIVITY_RESOURCE.workOrder}
                        restrictedAddActivities={
                          permissions && permissions[`${ACTIVITY_RESOURCE.workOrder}`] && permissions[`${ACTIVITY_RESOURCE.workOrder}`].isUpdate
                            ? []
                            : ['Attachment', 'Case']
                        }
                        relatedTo={[
                          {
                            type: ACTIVITY_RESOURCE.workOrder,
                            referenceId: workOrderData._id,
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
        </div>
      </div>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this work order: ${workOrderData?.workOrderNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageWorkOrder
          workOrderId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchWorkOrderData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </>
  );
};

export default WorkOrderDetails;
