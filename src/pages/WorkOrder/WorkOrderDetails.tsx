import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs, useMediaQuery, Divider, CircularProgress, Menu, MenuItem } from '@material-ui/core';
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
import { workOrder, sidebarResource, ACTIVITY_RESOURCE, WORKORDER_SERVICE_STATUS, WORK_ORDER_STATUS } from 'src/constants/helpers';
import Activity from 'src/components/Activity';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import queryString from 'query-string';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import TabPanel from 'src/components/TabPanel';
import { camelCase } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import accountClass from '../Account/account.module.scss';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import ManageWorkOrder from './ManageWorkOrder';
import Service from './Service';
import View from './View';
import Consumables from './Consumables';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { ExpandMore } from '@material-ui/icons';
import { GrStatusInfo } from 'react-icons/gr';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { FaWpforms } from 'react-icons/fa';
import { RiFlowChart } from 'react-icons/ri';

const WorkOrderDetails = () => {
  const toastConfig = useContext(CustomToastContext);
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
  const [locationKeys, setLocationKeys] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [previewPdf, setPreviewPdf] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);
  const [completed, setCompleted] = useState(false);

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
        data.some((o) => {
          if (o?.fieldData?.fieldName === 'status') {
            setStatusOptions([...o.fieldData.option?.filter((e) => e.optionValue !== 'Deleted')]);
            return true;
          }
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchWorkOrderData = () => {
    axiosInstance()
      .get(`${routes.workOrder.path}/${id}`)
      .then(({ data: { data } }) => {
        var isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
        if (user?.role?.selectedEntity?.superAdminAccess) {
          isAllowedToEdit = true
        }
        setAllowedToEdit(isAllowedToEdit && permissions?.workOrder?.isUpdate ? true : false);
        setCompleted(data?.status === WORK_ORDER_STATUS.completed || data?.deleted ? true : false);
        if (permissions?.workOrder?.isUpdate && openEdit === 'true') {
          setOpenUpdateDialog(true);
          const params = new URLSearchParams();
          params.delete('openEdit');
          history.push({ search: params.toString() });
        }
        setWorkOrderData({ ...data });
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

  const previewWorkOrderPdf = () => {
    setPreviewPdf(true);

    axiosInstance()
      .get(`${workOrder.api}/${id}/pdf/service`)
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

  const updateJobStatus = (status) => {
    axiosInstance()
      .patch(`${workOrder.api}/status/${id}`, { status: status })
      .then(({ data: { data } }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status changed to ${status}`
        });
        fetchWorkOrderData();
      })

      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (o) => {
    if (o.optionValue && workOrderData?.status !== o.optionValue) {
      updateJobStatus(o.optionValue);
    }
  };

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.workOrder, { title: workOrderData?.workOrderNumber }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {workOrderData ? (
              <>
                {permissions?.workOrder?.isUpdate &&
                  allowedToEdit &&
                  workOrderData?.canComplete &&
                  workOrderData?.status !== WORK_ORDER_STATUS.completed && (
                    <Fragment>
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
                              disabled={![WORK_ORDER_STATUS.completed]?.includes(o?.optionLabel)}
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
                    </Fragment>
                  )}
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
                {permissions?.workOrder?.isUpdate && allowedToEdit && !workOrderData?.deleted && !completed && (
                  <Button variant="contained" size="small" onClick={() => setOpenUpdateDialog(true)} className={'btn-outline-v1'}>
                    {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                  </Button>
                )}
                {permissions?.workOrder?.isDelete && allowedToEdit && workOrderData?.canDelete && !workOrderData?.deleted && (
                  <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                )}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="40px" />
            )}
            <ActivityButton referenceId={workOrderData?._id} resource={ACTIVITY_RESOURCE.workOrder} />
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
                <BiFoodMenu className="mr-1" fontSize="inherit" /> Services
              </div>
            }
            {...a11yProps(1)}
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <BiFoodMenu className="mr-1" fontSize="inherit" /> Products/Consumables
              </div>
            }
            {...a11yProps(2)}
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
          {workOrderData && (
            <Service
              workOrderData={workOrderData}
              workOrderId={id}
              allowedToEdit={allowedToEdit}
              completed={completed}
              fetchWorkOrderData={fetchWorkOrderData}
            />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Consumables
            allowedToEdit={allowedToEdit && !completed}
            isCreate={false}
            workOrderId={id}
            service={null}
            uniqueId={null}
            stepId={null}
            serviceName={``}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Box>
            <View workOrderName={workOrderData?.workOrderNumber || ''} workOrderId={id} workOrderStatus={workOrderData?.status} />
          </Box>
        </TabPanel>

        <Box my={1} />
      </Box>
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
    </Box>
  );
};

export default WorkOrderDetails;
