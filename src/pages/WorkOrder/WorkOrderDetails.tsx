import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs, useMediaQuery, Divider, CircularProgress, Menu, MenuItem } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { workOrder, sidebarResource, ACTIVITY_RESOURCE, WORK_ORDER_STATUS, ASSET_STATUS } from 'src/constants/helpers';
import queryString from 'query-string';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import { isMobile, isTablet } from 'react-device-detect';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import ManageWorkOrder from './ManageWorkOrder';
import Service from './Service';
import View from './View';
import Consumables from './Consumables';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { FaWpforms } from 'react-icons/fa';
import { RiFlowChart } from 'react-icons/ri';
import PreviewDownload from 'src/components/PreviewDownload';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const WorkOrderDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();

  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
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
  const [statusOptions, setStatusOptions] = useState([]);
  const [completed, setCompleted] = useState(false);

  const [showConfirmBoxScrap, setShowConfirmBoxScrap] = useState(false);

  const columns = [
    { accessor: 'serviceName', Header: 'Service' },
    { accessor: 'serviceType', Header: 'Service Type' },
    { accessor: 'assignedTechnician', Header: 'Assigned Technician' },
    { accessor: 'status', Header: 'Status' },
    { accessor: 'serviceStatus', Header: 'Result' }
  ];

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
        const adjustedData = [
          ...data,
          {
            fieldData: {
              _id: '63106511ba8a0bc11ff780ad',
              fieldLabel: 'Total Consumables Cost',
              type: 'singleLine',
              fieldName: 'totalConsumablesCost',
              sectionName: 'Consumable Information',
              resource: 'Work Order'
            },
            isCreate: true,
            isRead: true,
            isUpdate: true
          }
        ];
        setWorkOrderFields(adjustedData);
        adjustedData?.some((o) => {
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
          isAllowedToEdit = true;
        }
        setAllowedToEdit(isAllowedToEdit && permissions?.workOrder?.isUpdate ? true : false);
        setCompleted(data?.status === WORK_ORDER_STATUS.completed || data?.deleted ? true : false);
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

  const updateJobStatus = (status, assetStatus = null) => {
    const data: any = { status: status };
    if (assetStatus) {
      data.assetStatus = assetStatus;
    }
    axiosInstance()
      .patch(`${workOrder.api}/status/${id}`, data)
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
          <Box className="control-buttons-v1 items-center">
            {workOrderData ? (
              <>
                {permissions?.workOrder?.isUpdate && allowedToEdit && workOrderData?.status !== WORK_ORDER_STATUS.completed && (
                  <Button variant={'contained'} size="small" onClick={() => setShowConfirmBoxScrap(true)} className={'btn-outline-v1'}>
                    {`${ASSET_STATUS.scrap} Asset`}
                  </Button>
                )}
                {permissions?.workOrder?.isUpdate &&
                  allowedToEdit &&
                  workOrderData?.canComplete &&
                  workOrderData?.status !== WORK_ORDER_STATUS.completed && (
                    <div className="relative isolate ">
                      <span className="animate-ripple bg-white dark-bg-[var(--dark-primary)] rounded-[3px]">
                        <span></span>
                        <span></span>
                      </span>
                      <HtmlTooltip title="Complete Work Order" placement="top" arrow>
                        <Button
                          variant={'contained'}
                          size="small"
                          onClick={() => updateJobStatus(WORK_ORDER_STATUS.completed)}
                          className={'btn-outline-v1 '}
                        >
                          Close
                        </Button>
                      </HtmlTooltip>
                    </div>
                  )}
                <PreviewDownload
                  resource={sidebarResource.workOrder}
                  referenceId={id}
                  columns={user?.user?.brandPolicy?.servicePrePost ? columns : columns?.filter((e) => e.accessor !== 'serviceType')}
                  hideDetailButton={true}
                />
                {permissions?.workOrder?.isUpdate && allowedToEdit && !workOrderData?.deleted && !completed && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    size="small"
                    onClick={() => setOpenUpdateDialog(true)}
                    className={'btn-outline-v1'}
                  >
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
            <ActivityButton 
              referenceId={workOrderData?._id} 
              resource={ACTIVITY_RESOURCE.workOrder} 
              resourceLabel={workOrderData?.workOrderNumber}
              />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab index={0} {...a11yProps(0)}>
            <FaWpforms className="mr-1" fontSize="inherit" /> Header
          </CustomTab>
          <CustomTab index={1} {...a11yProps(1)}>
            <BiFoodMenu className="mr-1" fontSize="inherit" /> Services
          </CustomTab>
          <CustomTab index={2} className={'tabLayout'} {...a11yProps(2)}>
            <BiFoodMenu className="mr-1" fontSize="inherit" /> Products/Consumables
          </CustomTab>
          <CustomTab index={3} className={'tabLayout'} {...a11yProps(3)}>
            <RiFlowChart className="mr-1" fontSize="inherit" /> Views
          </CustomTab>
        </CustomTabs>
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
          {workOrderData && (
            <Consumables
              allowedToEdit={allowedToEdit && !completed}
              isCreate={true}
              workOrderId={id}
              warehouse={workOrderData?.warehouse}
              service={null}
              uniqueId={null}
              stepId={null}
              serviceName={null}
            />
          )}
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
      {showConfirmBoxScrap && (
        <ConfirmationDialog
          open={showConfirmBoxScrap}
          message={`Are you sure you want to scrap asset: ${workOrderData?.serializedAsset?.optionLabel} ?`}
          onClose={() => {
            setShowConfirmBoxScrap(false);
          }}
          onOk={() => {
            setShowConfirmBoxScrap(false);
            updateJobStatus(WORK_ORDER_STATUS.completed, ASSET_STATUS.scrap);
          }}
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
