import { Box, Button, Grid, Menu, MenuItem, MenuItemProps, Typography, useMediaQuery } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { Skeleton } from '@mui/material';
import queryString from 'query-string';
import { Fragment, useContext, useEffect, useMemo, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDoorClosed, FaDoorOpen } from 'react-icons/fa';
import { VscVersions } from 'react-icons/vsc';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { ThemeButton, ButtonType } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import routes from 'src/components/Helpers/Routes';
import PreviewDownload from 'src/components/PreviewDownload';
import DetailsPage from 'src/components/Shared/DetailsPage';
import {
  ACTIVITY_RESOURCE,
  ASSET_STATUS,
  CHILD_RESOURCE,
  MATERIAL_SUB_TYPE,
  WORK_ORDER_STATUS,
  WORK_ORDER_TYPE,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  repairJob,
  sidebarResource,
  workOrder
} from 'src/constants/helpers';
import Consumables from './Consumables';
import Diagram from './Diagram';
import ManageWorkOrder from './ManageWorkOrder';
import Service from './Service';
import Versions from './Versions';
import View from './View';
import { FaCircleChevronDown } from 'react-icons/fa6';
import ManageRepairJob from '../RepairJob/ManageRepairJob';
import Step from '../DynamicForm/Step';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import WorkOrderCostDialog from './WorkOrderCostDialog';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import AssetDetailsChangeDialog from 'src/pages/RentalManagement/ReceivingTicket/AssetDetailsChangeDialog';
import PackageNumberDialog from 'src/pages/AssemblyOrder/WorkOrder/PackageNumberDialog';

type ToolbarMenuItem = {
  type: 'menuItem';
  id: string;
  children: React.ReactNode;
  isVisible?: Boolean;
  tooltip?: string;
} & MenuItemProps;

type ToolbarElement<T> = {
  type: 'element';
  id: string;
  isVisible?: boolean;
  component: React.ReactNode;
} & T;

type ToolbarButton = {
  type: 'button';
  id: string;
  name: string;
  tooltip?: string;
  isVisible?: boolean;
  onClick: (e: any) => void;
  ripple?: boolean;
} & ButtonType;

type ToolbarComponents<T> = ToolbarElement<T> | ToolbarButton | ToolbarMenuItem;

const WorkOrderDetailContent = ({ id, tab, resource }) => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [workOrderData, setWorkOrderData] = useState(null);
  const [totalConsumablesCost, setTotalConsumablesCost] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [workOrderFields, setWorkOrderFields] = useState([]);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [locationKeys, setLocationKeys] = useState([]);
  const [completed, setCompleted] = useState(false);

  const [showConfirmBoxScrap, setShowConfirmBoxScrap] = useState(false);

  const [showConfirmVersion, setShowConfirmVersion] = useState({ open: false, withData: 0 });
  const [versionDialog, setVersionDialog] = useState(false);
  const [showManageRepairJobDialog, setShowManageRepairJobDialog] = useState({ open: false });

  const [repairJobReceiveConfirmation, setRepairJobReceiveConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showReopenConfirmation, setShowReopenConfirmation] = useState(false);
  const [resourceData, setResourceData] = useState(null);
  const [openTotalCostDialog, setOpenTotalCostDialog] = useState(false);

  const [workOrderCostFields, setWorkOrderCostFields] = useState(null);
  const [assetPolicyData, setAssetPolicyData] = useState(null);
  const [openAssetDataDialog, setOpenAssetDataDialog] = useState({ open: false, statusPolicy: null, _ids: null });
  const [openManagedPackageDialog, setOpenManagedPackageDialog] = useState(false);

  const columns = [
    { accessor: 'index', Header: 'Index' },
    { accessor: 'serviceName', Header: 'Service' },
    { accessor: 'serviceType', Header: 'Service Type' },
    { accessor: 'assignedTechnician', Header: 'Assigned Technician' },
    { accessor: 'assignedWorkStation', Header: 'Assigned WorkStation' },
    { accessor: 'startDate', Header: 'Start Date' },
    { accessor: 'endDate', Header: 'End Date' },
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
      fetchTotalConsumablesCost();
      fetchPolicy();
      fetchSerializedAssetPolicy();
    }
  }, [id]);

  useEffect(() => {
    if (tabValue === 0) {
      fetchTotalConsumablesCost();
    }
  }, [tabValue]);

  useEffect(() => {
    getResourceFields();
    getWorkOrderCostFields();
  }, []);

  const getWorkOrderCostFields = async () => {
    let workOrderCost = await fetch_child_resource_fields(CHILD_RESOURCE.workOrderCost, workOrderData?.currency || user.user?.brandCurrency, true);
    setWorkOrderCostFields(workOrderCost);
  };

  const getResourceFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.workOrder}`)
      .then(({ data: { data } }) => {
        const adjustedData = [...data];
        setWorkOrderFields(adjustedData);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchWorkOrderData = () => {
    axiosInstance()
      .get(`${routes?.workOrder?.path}/${id}`)
      .then(({ data: { data } }) => {
        setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.workOrder, data) && permissions?.workOrder?.isUpdate ? true : false);
        setCompleted(data?.status === WORK_ORDER_STATUS.completed || data?.status === WORK_ORDER_STATUS.onHold || data?.deleted ? true : false);
        setWorkOrderData({ ...data });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.workOrder}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchSerializedAssetPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.serializedAsset}`);
      if (data) {
        setAssetPolicyData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchTotalConsumablesCost = () => {
    axiosInstance()
      .get(`${routes?.workOrder?.path}/total-consumables-cost/${id}`)
      .then(({ data: { data } }) => {
        setTotalConsumablesCost(data?.totalConsumablesCost);
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
        history.push(`${routes?.workOrder?.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    if (resource === sidebarResource.workOrder) {
      history.push(`?tab=${newValue}`);
    }
    if (newValue === 0) {
      fetchWorkOrderData();
    }
  };

  const updateStatus = (status, assetStatus = null, workOrderCost = null, assetsData = null) => {
    setIsSubmitting(true);
    const data: any = { status: status };
    if (assetStatus) {
      data.assetStatus = assetStatus;
    }
    if (workOrderCost) {
      data.workOrderCost = workOrderCost;
    }
    if (assetsData) {
      const matchedAsset = assetsData?.find((asset) => asset._id === workOrderData?.serializedAsset?.optionValue);
      if (matchedAsset) {
        const { _id, ...assetData } = matchedAsset;
        data.assetData = assetData;
      }
    }
    axiosInstance()
      .patch(`${workOrder.api}/status/${id}`, data)
      .then(({ data: { data } }) => {
        setOpenTotalCostDialog(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data
        });
        setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null });
        fetchWorkOrderData();
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const reOpenWorkOrder = () => {
    setIsSubmitting(true);
    axiosInstance()
      .put(`${workOrder.api}/re-open`, { ids: [id] })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchWorkOrderData();
        setIsSubmitting(false);
        setShowReopenConfirmation(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const createVersion = (withData) => {
    axiosInstance()
      .put(`${workOrder.api}/${id}/version`, { withData })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchWorkOrderData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddAssetInRepairJob = (data) => {
    axiosInstance()
      .put(`${repairJob.api}/add-assets-create-ticket`, { repairJob: data?._id, assets: [workOrderData?.serializedAsset?.optionValue] })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowManageRepairJobDialog({ open: false });
        fetchWorkOrderData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleReceiveAssetInRepairJob = () => {
    setIsSubmitting(true);
    axiosInstance()
      .put(`${repairJob.api}/receive-assets-complete`, { repairJob: workOrderData?.currentRepairJob?.optionValue || workOrderData?.currentRepairJob })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setRepairJobReceiveConfirmation(false);
        setIsSubmitting(false);
        fetchWorkOrderData();
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const checkAssetPolicy = (status) => {
    let result: any = null;
    const statusPolicy = assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === status);
    if (statusPolicy) {
      if (statusPolicy?.products && statusPolicy?.products?.length > 0) {
        const assetIds = statusPolicy?.products?.includes(workOrderData?.product?.optionValue) ? [workOrderData?.serializedAsset?.optionValue] : [];
        if (assetIds && assetIds?.length > 0) {
          result = { statusPolicy: statusPolicy, assetIds: assetIds };
        }
      } else {
        result = { statusPolicy: statusPolicy, assetIds: [workOrderData?.serializedAsset?.optionValue] };
      }
    }
    return result;
  };

  const toolbarButtons: ToolbarComponents<ButtonType | MenuItemProps>[] = [
    {
      id: `Repair Job`,
      type: 'menuItem',
      isVisible:
        permissions?.repairJob?.isCreate &&
        allowedToEdit &&
        workOrderData?.type === WORK_ORDER_TYPE.repairOrder &&
        ![WORK_ORDER_STATUS.completed, WORK_ORDER_STATUS.onHold]?.includes(workOrderData?.status) &&
        !workOrderData?.currentRepairJob
          ? true
          : false,
      children: `Create ${resources?.repairJob?.titleSingular}`,
      tooltip: `Create ${resources?.repairJob?.titleSingular}`,
      onClick: () => setShowManageRepairJobDialog({ open: true })
    },
    {
      type: 'menuItem',
      id: `Repair Job Receive`,
      isVisible:
        permissions?.repairJob?.isUpdate && allowedToEdit && workOrderData?.type === WORK_ORDER_TYPE.repairOrder && workOrderData?.currentRepairJob
          ? true
          : false,
      children: `Receive Asset From Supplier`,
      tooltip: `Receive Asset From Supplier`,
      onClick: () => setRepairJobReceiveConfirmation(true)
    },
    {
      id: 'Scrap Asset',
      type: 'menuItem',
      isVisible: Boolean(
        workOrderData?.serializedAsset && allowedToEdit && !workOrderData?.currentRepairJob && workOrderData?.status !== WORK_ORDER_STATUS.completed
      ),
      children: `${ASSET_STATUS.scrap} Asset`,
      tooltip: `${ASSET_STATUS.scrap} Asset`,
      onClick: () => setShowConfirmBoxScrap(true)
    },
    {
      id: 'In-Progress',
      type: 'menuItem',
      isVisible: Boolean(allowedToEdit && !workOrderData?.currentRepairJob && workOrderData?.status === WORK_ORDER_STATUS.onHold),
      onClick: () => updateStatus(WORK_ORDER_STATUS.inProgress),
      tooltip: `Change Status ${WORK_ORDER_STATUS.inProgress}`,
      children: WORK_ORDER_STATUS.inProgress
    },
    {
      id: 'On-hold',
      type: 'menuItem',
      isVisible: Boolean(
        allowedToEdit && !workOrderData?.currentRepairJob && [WORK_ORDER_STATUS.new, WORK_ORDER_STATUS.inProgress]?.includes(workOrderData?.status)
      ),
      onClick: () => updateStatus(WORK_ORDER_STATUS.onHold),
      tooltip: `Change Status ${WORK_ORDER_STATUS.onHold}`,
      children: WORK_ORDER_STATUS.onHold
    },
    {
      id: 'Close',
      type: 'button',
      ripple: true,
      isVisible: Boolean(allowedToEdit && workOrderData?.canComplete),
      onClick: () => {
        if (workOrderData?.type === WORK_ORDER_TYPE.productionOrder && workOrderCostFields?.length) {
          setOpenTotalCostDialog(true);
        } else if (workOrderData?.type === WORK_ORDER_TYPE.repairOrder) {
          const statusPolicy = checkAssetPolicy(ASSET_STATUS.available);
          if (statusPolicy) {
            setOpenAssetDataDialog({ open: true, statusPolicy: statusPolicy?.statusPolicy, _ids: statusPolicy?.assetIds });
          } else {
            updateStatus(WORK_ORDER_STATUS.completed);
          }
        } else if (workOrderData?.type === WORK_ORDER_TYPE.assemblyOrder && workOrderData?.package) {
          setOpenManagedPackageDialog(true);
        } else {
          updateStatus(WORK_ORDER_STATUS.completed);
        }
      },
      iconForMobile: <FaDoorClosed />,
      tooltip: 'Complete Work Order',
      name: 'Close'
    },
    {
      id: 'Re-Open',
      type: 'button',
      isVisible: Boolean(allowedToEdit && workOrderData?.canReopen && workOrderData?.status === WORK_ORDER_STATUS.completed),
      onClick: () => {
        setShowReopenConfirmation(true);
      },
      iconForMobile: <FaDoorOpen />,
      tooltip: 'Re-Open Work Order',
      name: 'Re-Open'
    },
    {
      type: 'menuItem',
      id: 'Create Version Without Existing Data',
      tooltip: 'Create Version',
      onClick: () => {
        setShowConfirmVersion({ open: true, withData: 0 });
      },
      children: 'Create Version Without Existing Data',
      isVisible: Boolean(
        allowedToEdit &&
          ![WORK_ORDER_STATUS.completed, WORK_ORDER_STATUS.onHold]?.includes(workOrderData?.status) &&
          !workOrderData?.currentRepairJob &&
          !workOrderData?.deleted &&
          workOrderData?.canCreateWorkOrderVersion
      )
    },
    {
      type: 'menuItem',
      id: 'Create Version With Existing Data',
      children: 'Create Version With Existing Data',
      tooltip: 'Create Version',
      onClick: () => {
        setShowConfirmVersion({ open: true, withData: 1 });
      },
      isVisible: Boolean(
        allowedToEdit &&
          ![WORK_ORDER_STATUS.completed, WORK_ORDER_STATUS.onHold]?.includes(workOrderData?.status) &&
          !workOrderData?.currentRepairJob &&
          !workOrderData?.deleted &&
          workOrderData?.canCreateWorkOrderVersion
      ),
      disabled: false
    },
    {
      id: 'Version-info',
      type: 'button',
      tooltip: 'View Versions',
      isVisible: Boolean(workOrderData?.versions?.length),
      iconForMobile: <VscVersions />,
      name: `Versions : ${workOrderData?.versions?.length + 1}`,
      onClick: () => setVersionDialog(true)
    },
    {
      id: 'preview-download',
      type: 'element',
      component: (
        <PreviewDownload
          fileName={`${resources?.workOrder?.titleSingular}-${workOrderData?.workOrderNumber}`}
          resource={sidebarResource.workOrder}
          referenceId={id}
          columns={user?.user?.brandPolicy?.servicePrePost ? columns : columns?.filter((e) => e.accessor !== 'serviceType')}
          hideDetailButton={true}
          hideDialog={workOrderData?.type === WORK_ORDER_TYPE.productionOrder ? true : false}
        />
      )
    },
    {
      id: 'Edit',
      type: 'menuItem',
      tooltip: 'Edit Work Order',
      isVisible: Boolean(allowedToEdit && !workOrderData?.deleted && !completed),
      children: 'Edit',
      onClick: () => setOpenUpdateDialog(true)
    },
    {
      id: 'delete',
      type: 'menuItem',
      onClick: () => setShowConfirmBox(true),
      isVisible:
        permissions?.workOrder?.isDelete &&
        allowedToEdit &&
        workOrderData?.canDelete &&
        checkIsAllowedToDelete(user, sidebarResource.workOrder, workOrderData.owner.optionValue) &&
        !workOrderData?.deleted,
      children: 'Delete'
    }
  ] as const;

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        {resource === sidebarResource.workOrder && (
          <Box className="nav-v1">
            <CustomBreadCrumbs
              routes={[{ ...routes?.workOrder, title: resources?.workOrder?.titlePlural }, { title: workOrderData?.workOrderNumber }]}
            />
          </Box>
        )}
        <Box className="controls-v1 ml-auto">
          <Box className="control-buttons-v1 items-center">
            {workOrderData ? (
              <>
                <RenderHeaderButtons buttonOptions={toolbarButtons} />
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="40px" />
            )}
            <ActivityButton
              referenceId={workOrderData?._id}
              resource={ACTIVITY_RESOURCE.workOrder}
              resourceLabel={workOrderData?.workOrderNumber}
              extraRelatedTo={{
                referenceId: workOrderData?.repairOrder?.optionValue,
                resource: ACTIVITY_RESOURCE.repairOrder
              }}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Services</CustomTab>
          {!user?.user?.brandPolicy?.workOrderConsumableHide && <CustomTab value={2}>Products/Consumables</CustomTab>}
          {[WORK_ORDER_TYPE.productionOrder, WORK_ORDER_TYPE.assemblyOrder]?.includes(workOrderData?.type) && resourceData?.policy?.showBom && (
            <CustomTab value={3}>BOM</CustomTab>
          )}
          <CustomTab value={4}>Drawings</CustomTab>
          {!(isMobile && !isTablet) && <CustomTab value={5}>Views</CustomTab>}
          {resourceData && resourceData?.tabs?.length && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 6}>{tab?.tabName}</CustomTab>)}
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
            {workOrderCostFields?.length && workOrderData?.workOrderCost ? (
              <Box pt={2}>
                <DetailsPage
                  data={workOrderData?.workOrderCost}
                  fields={workOrderCostFields?.map((e) => {
                    return { fieldData: e };
                  })}
                />
              </Box>
            ) : (
              <Box pt={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={6} xl={6}>
                    <div style={{ overflow: 'hidden' }} className="single-form-v1">
                      <Box display={'flex'} justifyContent="space-between" className={'form-head-v1'}>
                        <Box display="flex" alignItems="center">
                          <Typography style={{ fontWeight: '600' }} className="form-label-style-v1" variant="subtitle2">
                            {`Consumable Information`}
                          </Typography>
                        </Box>
                      </Box>
                      {totalConsumablesCost !== null ? (
                        <Box className="formdata-v1" display="flex">
                          <Box style={{ width: '100%' }}>
                            <Box display="flex" justifyContent="space-between">
                              <Typography className="table-head-v1">Total Consumables Cost</Typography>
                              <Typography className="table-data-v1" style={{ borderTopWidth: '1px' }}>
                                {`${totalConsumablesCost}`}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ) : (
                        <CommonSkeleton lenArray={[...Array(2).keys()]} />
                      )}
                    </div>
                  </Grid>
                </Grid>
              </Box>
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
              resource={sidebarResource.workOrder}
              defaultSelectedService={null}
              setDefaultSelectedService={null}
            />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {workOrderData && (
            <Consumables
              allowedToEdit={allowedToEdit && workOrderData?.status !== WORK_ORDER_STATUS.onHold && !workOrderData?.deleted ? true : false}
              isCreate={true}
              service={null}
              uniqueId={null}
              stepId={null}
              serviceName={null}
              materialSubType={MATERIAL_SUB_TYPE.consumable}
              workOrderData={workOrderData}
              serialNumberRequired={resourceData?.policy?.consumablesSerialNumberRequired}
            />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          {workOrderData && (
            <Consumables
              allowedToEdit={allowedToEdit && workOrderData?.status !== WORK_ORDER_STATUS.onHold && !workOrderData?.deleted ? true : false}
              isCreate={true}
              service={null}
              uniqueId={null}
              stepId={null}
              serviceName={null}
              materialSubType={MATERIAL_SUB_TYPE.bom}
              workOrderData={workOrderData}
              serialNumberRequired={resourceData?.policy?.consumablesSerialNumberRequired}
            />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          {workOrderData && (
            <Diagram
              resource={ACTIVITY_RESOURCE.workOrder}
              referenceId={id}
              currentVersion={workOrderData?.versions?.length + 1 || 1}
              workOrderData={workOrderData}
            />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <Box>
            <View workOrderName={workOrderData?.workOrderNumber || ''} workOrderId={id} workOrderStatus={workOrderData?.status} />
          </Box>
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 6}>
                <Box>
                  <Step
                    tab={tab}
                    resourcePolicyId={resourceData?._id}
                    resourceId={id}
                    resource={sidebarResource.workOrder}
                    data={workOrderData}
                    allowedToEdit={permissions?.workOrder?.isUpdate}
                  />
                </Box>
              </TabPanel>
            );
          })}
        <Box my={1} />
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.workOrder?.titleSingular?.toLowerCase()} : ${workOrderData?.workOrderNumber} ?`}
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
            updateStatus(WORK_ORDER_STATUS.completed, ASSET_STATUS.scrap);
          }}
        />
      )}
      {showConfirmVersion.open && (
        <ConfirmationDialog
          open={showConfirmVersion.open}
          message={`Are you sure you want to new version ?`}
          onClose={() => {
            setShowConfirmVersion({ open: false, withData: 0 });
          }}
          onOk={() => {
            createVersion(showConfirmVersion.withData);
            setShowConfirmVersion({ open: false, withData: 0 });
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
      {versionDialog && (
        <Versions
          workOrderId={id}
          workOrderData={workOrderData}
          handleClose={() => {
            setVersionDialog(false);
          }}
        />
      )}
      {showManageRepairJobDialog.open && (
        <ManageRepairJob
          onClose={() => setShowManageRepairJobDialog({ open: false })}
          onSuccess={(data) => {
            handleAddAssetInRepairJob(data);
          }}
          referenceType={sidebarResource.workOrder}
          referenceData={{
            warehouse: workOrderData?.warehouse?.optionValue,
            workOrder: workOrderData?._id
          }}
        />
      )}
      {openTotalCostDialog && (
        <WorkOrderCostDialog
          id={id}
          workOrderCostFields={workOrderCostFields}
          currency={workOrderData?.currency || user.user?.brandCurrency}
          onClose={() => setOpenTotalCostDialog(false)}
          onSuccess={(data) => {
            updateStatus(WORK_ORDER_STATUS.completed, null, data);
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {repairJobReceiveConfirmation && (
        <ConfirmationDialog
          open={repairJobReceiveConfirmation}
          message={`Are you sure you want to receive asset?`}
          onClose={() => {
            setRepairJobReceiveConfirmation(false);
          }}
          onOk={handleReceiveAssetInRepairJob}
          okBtnLoading={isSubmitting}
        />
      )}
      {showReopenConfirmation && (
        <ConfirmationDialog
          open={showReopenConfirmation}
          message={`Are you sure you want to re-open work order ?`}
          onClose={() => {
            setShowReopenConfirmation(false);
          }}
          onOk={reOpenWorkOrder}
          okBtnLoading={isSubmitting}
        />
      )}
      {openAssetDataDialog.open && (
        <AssetDetailsChangeDialog
          ids={openAssetDataDialog._ids}
          statusPolicy={openAssetDataDialog.statusPolicy}
          setAssetsData={null}
          onClose={() => setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null })}
          onSuccess={(data) => {
            updateStatus(WORK_ORDER_STATUS.completed, null, null, data);
          }}
        />
      )}

      {openManagedPackageDialog && (
        <PackageNumberDialog
          onClose={() => {
            setOpenManagedPackageDialog(false);
          }}
          assemblyOrderId={workOrderData?.assemblyOrder?.optionValue}
          workOrderIds={[id]}
          onSuccess={() => {
            setOpenManagedPackageDialog(false);
            updateStatus(WORK_ORDER_STATUS.completed);
          }}
        />
      )}
    </Box>
  );
};

export default WorkOrderDetailContent;

const RenderHeaderButtons = ({ buttonOptions }: { buttonOptions: ToolbarComponents<ButtonType | MenuItemProps>[] }) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [actionAnchor, setActionAnchor] = useState<null | HTMLElement>(null);

  const closeActions = () => {
    setActionAnchor(null);
  };

  const openActions = (event) => {
    setActionAnchor(event.currentTarget);
  };

  const renderComponent = (componentOptions: ToolbarComponents<ButtonType | MenuItemProps>) => {
    if (componentOptions.isVisible === false) return null;
    if (componentOptions.type === 'menuItem') {
      const { children, type, id, button, ...rest } = componentOptions;
      return componentOptions.isVisible ? (
        <HtmlTooltip title={componentOptions.tooltip || ''} placement="top" arrow enterTouchDelay={0}>
          <span>
            <MenuItem disabled={componentOptions.disabled} {...rest}>
              {children}
            </MenuItem>
          </span>
        </HtmlTooltip>
      ) : null;
    }

    if (componentOptions.type === 'button' && componentOptions.ripple) {
      return (
        <div className="relative isolate ">
          <span className="animate-ripple dark-bg-[var(--dark-primary)] rounded-[3px] bg-white">
            <span></span>
            <span></span>
          </span>
          <ThemeButton key={componentOptions.id} {...componentOptions}>
            {componentOptions.name}
          </ThemeButton>
        </div>
      );
    }
    if (componentOptions.type === 'button') {
      return (
        <ThemeButton key={componentOptions.id} {...componentOptions}>
          {componentOptions.name}
        </ThemeButton>
      );
    }
    if (!componentOptions.type || componentOptions.type === 'element') {
      return componentOptions.component;
    }
  };

  const menuItems = useMemo(() => {
    return buttonOptions.filter((b) => b.type === 'menuItem' && b.isVisible);
  }, [buttonOptions]);

  const buttonItems = useMemo(() => {
    return buttonOptions.filter((b) => b.type === 'button');
  }, [buttonOptions]);

  const otherItems = useMemo(() => {
    return buttonOptions.filter((b) => !b.type || b.type === 'element');
  }, [buttonOptions]);

  return (
    <>
      {buttonItems.map((item) => (
        <Fragment key={item.id}>{renderComponent(item)}</Fragment>
      ))}
      {otherItems.map((item) => (
        <Fragment key={item.id}>{renderComponent(item)}</Fragment>
      ))}
      {menuItems.length > 0 && (
        <ThemeButton onClick={openActions} endIcon={<ExpandMore />} mobileTooltip="Actions" borderColor="red" iconForMobile={<ExpandMore />}>
          Actions
        </ThemeButton>
      )}
      <Menu
        anchorEl={actionAnchor}
        keepMounted
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        id="add-menu"
        open={Boolean(actionAnchor)}
        onClose={closeActions}
      >
        <span onClick={closeActions}>
          {menuItems.map((item) => (
            <Fragment key={item.id}>{renderComponent(item)}</Fragment>
          ))}
        </span>
      </Menu>
    </>
  );
};
