import { Box, Button, Grid, Menu, MenuItem, useMediaQuery } from '@material-ui/core';
import { Delete, ExpandMore } from '@material-ui/icons';
import EditIcon from '@material-ui/icons/Edit';
import { Skeleton } from '@material-ui/lab';
import queryString from 'query-string';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { BiFoodMenu } from 'react-icons/bi';
import { FaDoorClosed, FaWpforms } from 'react-icons/fa';
import { IoHandRightSharp } from 'react-icons/io5';
import { LuPackageCheck } from 'react-icons/lu';
import { RiFileShredFill, RiFlowChart } from 'react-icons/ri';
import { VscVersions } from 'react-icons/vsc';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { DeleteButton, ThemeButton, ButtonType } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import routes from 'src/components/Helpers/Routes';
import PreviewDownload from 'src/components/PreviewDownload';
import DetailsPage from 'src/components/Shared/DetailsPage';
import {
  ACTIVITY_RESOURCE,
  ASSET_STATUS,
  MATERIAL_SUB_TYPE,
  WORK_ORDER_STATUS,
  WORK_ORDER_TYPE,
  sidebarResource,
  workOrder
} from 'src/constants/helpers';
import Consumables from './Consumables';
import Diagram from './Diagram';
import ManageWorkOrder from './ManageWorkOrder';
import Service from './Service';
import Versions from './Versions';
import View from './View';
import { TbProgressCheck } from 'react-icons/tb';
import { FaCircleChevronDown } from 'react-icons/fa6';
import ManageRepairJob from '../RepairJob/ManageRepairJob';

type ToolbarElement = {
  type: 'element';
  id: string;
  visibilityInMobile: 'inActionMenu' | 'hidden' | 'visible';
  component: React.ReactNode;
};

type ToolbarButton = {
  id: string;
  visibilityInMobile: 'inActionMenu' | 'hidden' | 'visible';
  name: string;
  ripple?: boolean;
  onClick: (e: any) => void;
  type: 'button';
} & ButtonType;

type ToolbarComponents = ToolbarElement | ToolbarButton;

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
  const [completed, setCompleted] = useState(false);

  const [showConfirmBoxScrap, setShowConfirmBoxScrap] = useState(false);
  const [addAnchorEl, setAddAnchorEl] = useState(null);

  const [showConfirmVersion, setShowConfirmVersion] = useState({ open: false, withData: 0 });
  const [versionDialog, setVersionDialog] = useState(false);
  const [showManageRepairJobDialog, setShowManageRepairJobDialog] = useState({ open: false, isClone: false, idToClone: null });

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
        setCompleted(data?.status === WORK_ORDER_STATUS.completed || data?.status === WORK_ORDER_STATUS.onHold || data?.deleted ? true : false);
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
        history.push(`${routes.workOrder.path}`);
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

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  const openAddActions = (event) => {
    setAddAnchorEl(event.currentTarget);
  };

  const closeAddActions = () => {
    setAddAnchorEl(null);
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

  const createVersionMenuItems = [
    {
      text: 'Without Existing Data',
      onClick: () => {
        closeAddActions();
        setShowConfirmVersion({ open: true, withData: 0 });
      },
      disabled: false
    },
    {
      text: ' With Existing Data',
      onClick: () => {
        closeAddActions();
        setShowConfirmVersion({ open: true, withData: 1 });
      },
      disabled: false
    }
  ];

  const toolbarButtons: ToolbarComponents[] = [
     {
      id: `Repair Job`,
      type: 'button',
      visibilityInMobile: 'visible',
      isVisible: Boolean(
        permissions?.workOrder?.isUpdate && allowedToEdit && workOrderData?.repairOrder && workOrderData?.status !== WORK_ORDER_STATUS.completed
      ),
      name: `Create ${routes?.repairJob.title}`,
      tooltip: `Create ${routes?.repairJob.title}`,
      onClick: () => setShowManageRepairJobDialog({ open: true, isClone: false, idToClone: null }),
      iconForMobile: <RiFileShredFill />
    },
    {
      id: 'Scrap Asset',
      type: 'button',
      visibilityInMobile: 'visible',
      isVisible: Boolean(
        permissions?.workOrder?.isUpdate && workOrderData?.serializedAsset && allowedToEdit && workOrderData?.status !== WORK_ORDER_STATUS.completed
      ),
      name: `${ASSET_STATUS.scrap} Asset`,
      tooltip: `${ASSET_STATUS.scrap} Asset`,
      onClick: () => setShowConfirmBoxScrap(true),
      iconForMobile: <RiFileShredFill />
    },
    {
      id: 'In-Progress',
      type: 'button',
      visibilityInMobile: 'inActionMenu',
      isVisible: Boolean(permissions?.workOrder?.isUpdate && allowedToEdit && workOrderData?.status === WORK_ORDER_STATUS.onHold),
      onClick: () => updateJobStatus(WORK_ORDER_STATUS.inProgress),
      tooltip: `Change Status ${WORK_ORDER_STATUS.inProgress}`,
      name: WORK_ORDER_STATUS.inProgress,
      iconForMobile: <TbProgressCheck />
    },
    {
      id: 'On-hold',
      type: 'button',
      visibilityInMobile: 'inActionMenu',
      isVisible: Boolean(
        permissions?.workOrder?.isUpdate && allowedToEdit && [WORK_ORDER_STATUS.new, WORK_ORDER_STATUS.inProgress]?.includes(workOrderData?.status)
      ),
      onClick: () => updateJobStatus(WORK_ORDER_STATUS.onHold),
      tooltip: `Change Status ${WORK_ORDER_STATUS.onHold}`,
      name: WORK_ORDER_STATUS.onHold,
      iconForMobile: <IoHandRightSharp />
    },
    {
      id: 'Close',
      type: 'button',
      visibilityInMobile: 'visible',
      ripple: true,
      isVisible: Boolean(
        permissions?.workOrder?.isUpdate && allowedToEdit && workOrderData?.canComplete && workOrderData?.status !== WORK_ORDER_STATUS.completed
      ),
      onClick: () => updateJobStatus(WORK_ORDER_STATUS.completed),
      iconForMobile: <FaDoorClosed />,
      tooltip: 'Complete Work Order',
      name: 'Close'
    },
    {
      id: 'Create Version',
      type: 'button',
      visibilityInMobile: 'hidden',
      isVisible: Boolean(
        permissions?.workOrder?.isUpdate && allowedToEdit && workOrderData?.status !== WORK_ORDER_STATUS.completed && !workOrderData?.deleted
        && workOrderData?.canCreateWorkOrderVersion
      ),
      onClick: (e) => openAddActions(e),
      iconForMobile: false,
      endIcon: <ExpandMore fontSize="small" />,
      tooltip: 'Create Version',
      name: 'Create Version'
    },
    {
      id: 'Version-info',
      type: 'button',
      visibilityInMobile: 'visible',
      isVisible: Boolean(workOrderData?.versions?.length),
      iconForMobile: <VscVersions />,
      name: `Versions : ${workOrderData?.versions?.length + 1}`,
      onClick: () => setVersionDialog(true)
    },
    {
      id: 'preview-download',
      type: 'element',
      visibilityInMobile: 'visible',
      component: (
        <PreviewDownload
          fileName={`${routes.workOrder.title}-${workOrderData?.workOrderNumber}`}
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
      type: 'button',
      visibilityInMobile: 'inActionMenu',
      tooltip: 'Edit Work Order',
      isVisible: Boolean(permissions?.workOrder?.isUpdate && allowedToEdit && !workOrderData?.deleted && !completed),
      iconForMobile: <EditIcon />,
      name: 'Edit',
      onClick: () => setOpenUpdateDialog(true)
    },
    {
      id: 'delete',
      type: 'button',
      visibilityInMobile: 'inActionMenu',
      onClick: () => setShowConfirmBox(true),
      iconForMobile: <Delete style={{ fontSize: 18 }} />,
      borderColor: 'red',
      hasMobileBorder: false,
      isVisible: permissions?.workOrder?.isDelete && allowedToEdit && workOrderData?.canDelete && !workOrderData?.deleted,
      name: 'Delete'
    }
  ] as const;

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
                <RenderHeaderButtons
                  buttonOptions={toolbarButtons}
                  extraMenuItems={createVersionMenuItems.map((c) => ({ ...c, text: `Create Version ${c.text}` }))}
                  isExtraMenuItemsVisible={Boolean(
                    permissions?.workOrder?.isUpdate &&
                    allowedToEdit &&
                    workOrderData?.status !== WORK_ORDER_STATUS.completed &&
                    !workOrderData?.deleted
                  )}
                />
                <Menu
                  anchorEl={addAnchorEl}
                  keepMounted
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  id="add-menu"
                  open={Boolean(addAnchorEl)}
                  onClose={closeAddActions}
                >
                  {createVersionMenuItems.map((menuItem) => {
                    return (
                      <MenuItem key={menuItem.text} onClick={menuItem.onClick}>
                        {menuItem.text}
                      </MenuItem>
                    );
                  })}
                </Menu>
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
          <CustomTab index={0} value={0} {...a11yProps(0)}>
            <FaWpforms className="mr-1" fontSize="inherit" /> Header
          </CustomTab>
          <CustomTab index={1} value={1} {...a11yProps(1)}>
            <BiFoodMenu className="mr-1" fontSize="inherit" /> Services
          </CustomTab>
          {!user?.user?.brandPolicy?.workOrderConsumableHide && (
            <CustomTab index={2} value={2} className={'tabLayout'} {...a11yProps(2)}>
              <BiFoodMenu className="mr-1" fontSize="inherit" /> Products/Consumables
            </CustomTab>
          )}
          {user?.user?.brandPolicy?.workOrderBom && (
            <CustomTab index={3} value={3} className={'tabLayout'} {...a11yProps(3)}>
              <BiFoodMenu className="mr-1" fontSize="inherit" /> BOM
            </CustomTab>
          )}
          {workOrderData?.type === WORK_ORDER_TYPE.productionOrder && (
            <CustomTab index={4} value={4} className={'tabLayout'} {...a11yProps(4)}>
              <BiFoodMenu className="mr-1" fontSize="inherit" /> Drawings
            </CustomTab>
          )}
          {!(isMobile && !isTablet) && (
            <CustomTab index={5} value={5} className={'tabLayout'} {...a11yProps(5)}>
              <RiFlowChart className="mr-1" fontSize="inherit" /> Views
            </CustomTab>
          )}
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
              resource={sidebarResource.workOrder}
              defaultSelectedService={null}
              setDefaultSelectedService={null}
            />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {workOrderData && (
            <Consumables
              allowedToEdit={allowedToEdit && !completed}
              isCreate={true}
              service={null}
              uniqueId={null}
              stepId={null}
              serviceName={null}
              materialSubType={MATERIAL_SUB_TYPE.consumable}
              workOrderData={workOrderData}
            />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          {workOrderData && (
            <Consumables
              allowedToEdit={allowedToEdit && !completed}
              isCreate={true}
              service={null}
              uniqueId={null}
              stepId={null}
              serviceName={null}
              materialSubType={MATERIAL_SUB_TYPE.bom}
              workOrderData={workOrderData}
            />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          {workOrderData && <Diagram
            resource={ACTIVITY_RESOURCE.workOrder}
            referenceId={id}
            currentVersion={workOrderData?.versions?.length + 1 || 1}
          />}
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
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
          isClone={showManageRepairJobDialog.isClone}
          repairJobId={showManageRepairJobDialog.idToClone}
          onClose={() => setShowManageRepairJobDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            setShowManageRepairJobDialog({ open: false, isClone: false, idToClone: null });
            updateJobStatus(WORK_ORDER_STATUS.onHold)
            history.push(`${routes.repairJobDetail.path}/${data._id}`);
          }}
          referenceType={sidebarResource.workOrder}
          referenceData={{
            warehouse: workOrderData?.warehouse?.optionValue || '',
          }}
        />
      )}
      
    </Box>
  );
};

export default WorkOrderDetails;

const RenderHeaderButtons = ({
  buttonOptions,
  extraMenuItems,
  isExtraMenuItemsVisible
}: {
  buttonOptions: ToolbarComponents[];
  extraMenuItems: { text: string; onClick: () => void; disabled: boolean }[];
  isExtraMenuItemsVisible: boolean;
}) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [actionAnchor, setActionAnchor] = useState<null | HTMLElement>(null);

  const closeActions = () => {
    setActionAnchor(null);
  };

  const openActions = (event) => {
    setActionAnchor(event.currentTarget);
  };

  const renderComponent = (componentOptions: ToolbarComponents) => {
    const isInAction = componentOptions.visibilityInMobile === 'inActionMenu' && isMobile;
    const isHidden = componentOptions.visibilityInMobile === 'hidden' && isMobile;
    if (isHidden) return null;
    if (isInAction) {
      if (componentOptions.type === 'button') {
        return componentOptions.isVisible ? (
          <MenuItem onClick={componentOptions.onClick} disabled={componentOptions.disabled}>
            {componentOptions.name}
          </MenuItem>
        ) : null;
      }
    }

    if (componentOptions.type === 'button' && componentOptions.ripple) {
      return (
        <div className="relative isolate ">
          <span className="animate-ripple bg-white dark-bg-[var(--dark-primary)] rounded-[3px]">
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
    if (componentOptions.type === 'element') {
      return componentOptions.component;
    }
  };

  return (
    <>
      {!isMobile ? (
        buttonOptions.map((b) => {
          return renderComponent(b);
        })
      ) : (
        <>
          {buttonOptions
            .filter((b) => b.visibilityInMobile !== 'inActionMenu')
            .map((menuItem) => {
              return renderComponent(menuItem);
            })}
          <Button
            variant={'outlined'}
            color="default"
            size="small"
            className={`new-dropdown-v1 [height:32px_!important] max-[600px]:[border:0px_!important] max-[600px]:[max-width:36px_!important]`}
            onClick={openActions}
            aria-controls="action-menu"
            endIcon={isMobile ? null : <ExpandMore />}
          >
            {isMobile ? <FaCircleChevronDown size={20} /> : <>Actions </>}
          </Button>
          <Menu
            anchorEl={actionAnchor}
            keepMounted
            getContentAnchorEl={null}
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
              {buttonOptions
                .filter((b) => b.visibilityInMobile === 'inActionMenu')
                .map((menuItem) => {
                  return <Fragment key={menuItem.id}>{renderComponent(menuItem)}</Fragment>;
                })}
              {isExtraMenuItemsVisible &&
                extraMenuItems.map((m) => (
                  <MenuItem key={m.text} onClick={m.onClick} disabled={m.disabled}>
                    {m.text}
                  </MenuItem>
                ))}
            </span>
          </Menu>
        </>
      )}
    </>
  );
};
