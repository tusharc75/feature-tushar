import { Box, Grid, IconButton, Menu, MenuItem, useMediaQuery } from '@material-ui/core';
import { Add, ExpandMore, LowPriority } from '@material-ui/icons';
import DragIndicatorIcon from '@material-ui/icons/DragIndicator';
import { isArray, reverse } from 'lodash';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { IoMdArrowDropdown, IoMdArrowDropup } from 'react-icons/io';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { FailIcon, PassIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import {
  MATERIAL_TYPE,
  QUOTATION_STATUS,
  WORKORDER_SERVICE_STATUS,
  WORKORDER_SERVICE_STEP_STATUS,
  sidebarResource,
  workOrder
} from 'src/constants/helpers';
import ManagePurchaseOrder from 'src/pages/PurchaseOrder/ManagePurchaseOrder';
import ConfigureFields from 'src/pages/ServiceMaster/Fields';
import ManageServiceMaster from 'src/pages/ServiceMaster/ManageServiceMaster';
import StepDialog from 'src/pages/ServiceMaster/Steps/StepDialog';
import ConsumablesDialog from '../Consumables/ConsumablesDialog';
import Quotation from '../Quotation';
import AssignUserDialog from './AssignUserDialog';
import AssignWorkStationDialog from './AssignWorkStationDialog';
import AttachmentDialog from './AttachmentDialog';
import Comments from './Comments';
import CompleteDialog from './CompleteDialog';
import Logs from './Logs';
import RenderService, { ServicesButtons } from './RenderServices';
import Steps from './Steps';
import StepsInOtherServices from './StepsInOtherService';
import ViewServiceStepDataDialog from './ViewServiceStepDataDialog';
import { MdKeyboardDoubleArrowUp } from 'react-icons/md';

const Service = ({
  workOrderId,
  allowedToEdit,
  workOrderData,
  completed,
  fetchWorkOrderData,
  resource,
  defaultSelectedService,
  setDefaultSelectedService,
  minHeightClass = null
}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: {
      user: { user },
      permissions
    }
  } = useData();
  const [serviceSteps, setServiceSteps] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [stepSubmitedData, setStepSubmitedData] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userAssignDialog, setUserAssignDialog] = useState(false);
  const [workStationAssignDialog, setWorkStationAssignDialog] = useState(false);
  const [serviceDialog, setServiceDialog] = useState({ open: false, type: '', uniqueId: null, preWork: null });
  const [arrangeView, setArrangeView] = useState(false);
  const [consumablesDialog, setConsumablesDialog] = useState({ open: false, uniqueId: null, service: null, stepId: null, serviceName: null });
  const [logsDialog, setLogsDialog] = useState(false);
  const [commentsDialog, setCommentsDialog] = useState(false);
  const [viewServiceStepDataDialog, setViewServiceStepDataDialog] = useState({ open: false, selectedService: null });
  const [showManagePurchaseOrder, setShowManagePurchaseOrder] = useState(false);
  const [isColapsed, setIsColapsed] = useState(resource === sidebarResource.workOrder ? false : true);
  const mobScreen = useMediaQuery('(max-width:768px)');
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [assignSteps, setAssignSteps] = useState(false);
  const [setpsInOtherServices, setSetpsInOtherServices] = useState(false);
  const [quotationData, setQuotationData] = useState(null);
  const [attchmentsDialog, setAttchmentsDialog] = useState({ open: false, uniqueServiceId: null, stepId: null, serviceName: null, stepName: null });
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [addServiceAnchorEl, setAddServiceAnchorEl] = useState(null);

  const prevOrder = useRef(0);

  const [isSubmitting, setSubmitting] = useState(false);

  const [reviseQuotation, setReviseQuotation] = useState(false);
  const [openProperties, setOpenProperties] = useState(false);

  useEffect(() => {
    fetchServiceData();
  }, [workOrderId, workOrderData]);

  const fetchServiceData = async () => {
    var quotation: any = null;
    var isQuotation: any = false;

    const workOrderDetailResponce: any = await axiosInstance().get(`${workOrder.api}/${workOrderId}/detail`);
    const workOrderDetail = workOrderDetailResponce?.data?.data;

    if (workOrderDetail.type === 'Repair Order' && workOrderDetail?.repairOrder) {
      if (workOrderDetail?.repairOrder?.addQuotationStep) {
        isQuotation = true;
        if (workOrderDetail?.quotation?.version) {
          quotation = {
            _id: workOrderDetail?.quotation?._id,
            versionId: workOrderDetail?.quotation?.version?._id,
            quotationNumber: workOrderDetail?.quotation?.quotationNumber,
            status: workOrderDetail?.quotation?.version?.status
          };
          setQuotationData(quotation);
        }
      }
    }

    setStepSubmitedData(workOrderDetail?.stepData?.filter((e) => e.status) || []);

    if (workOrderDetail?.services?.length) {
      workOrderDetail?.services?.forEach((e) => {
        e.type = 'service';
      });
      const preWorkService = workOrderDetail?.services?.filter((e) => e.preWork)?.sort((a, b) => (a.order > b.order ? 1 : -1));
      const postWorkService = workOrderDetail?.services?.filter((e) => !e.preWork)?.sort((a, b) => (a.order > b.order ? 1 : -1));
      const quote = [{ _id: 'quotation', uniqueId: 'quotation', order: 9999, type: 'quotation', serviceName: 'Quotation to Customer' }];
      const services = isQuotation ? [...preWorkService, ...quote, ...postWorkService] : [...preWorkService, ...postWorkService];

      if (services?.length) {
        let pendingServiceIndex = services?.findIndex((d) => d.status === WORKORDER_SERVICE_STATUS.inProgress);
        if (pendingServiceIndex === -1) {
          let tempServiceSortedArray = reverse([...services]);
          pendingServiceIndex = tempServiceSortedArray.findIndex((d) =>
            [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed, WORKORDER_SERVICE_STATUS.skipped].includes(d.status)
          );
          if (pendingServiceIndex === -1) {
            pendingServiceIndex = services.findIndex((d) => d.status === WORKORDER_SERVICE_STATUS.pending);
          } else {
            pendingServiceIndex = services?.length - pendingServiceIndex;
            if (services[pendingServiceIndex]?.type === 'quotation') {
              pendingServiceIndex = pendingServiceIndex + 1;
            }
          }
        }
        pendingServiceIndex = pendingServiceIndex > -1 ? pendingServiceIndex : 0;
        const order = services[pendingServiceIndex]?.order;
        services?.forEach((element, index) => {
          if (user?.brandPolicy?.workOrderServiceSequence) {
            if (element?.type === MATERIAL_TYPE.service) {
              if (element.order === order || index <= pendingServiceIndex) {
                if (!completed) {
                  if (
                    allowedToEdit ||
                    element?.assignedUsers?.some((u: any) => u?.optionValue === user?._id) ||
                    (!element?.assignedUsers?.length && element?.competencies?.filter((e) => user?.competencies?.includes(e))?.length)
                  ) {
                    element.clickable = true;
                  } else {
                    element.clickable = false;
                  }
                } else {
                  element.clickable = false;
                }
              } else {
                element.clickable = false;
              }
            }
          } else {
            if (!completed) {
              if (
                allowedToEdit ||
                element?.assignedUsers?.some((u: any) => u?.optionValue === user?._id) ||
                (!element?.assignedUsers?.length && element?.competencies?.filter((e) => user?.competencies?.includes(e))?.length)
              ) {
                element.clickable = true;
              } else {
                element.clickable = false;
              }
            } else {
              element.clickable = false;
            }
          }
        });

        if (isQuotation) {
          if (quotation && quotation?.status === QUOTATION_STATUS.acceptByCustomer) {
          } else {
            services?.forEach((element) => {
              if (!element?.preWork) {
                element.clickable = false;
              }
            });
          }
        }

        if (selectedService) {
          setSelectedService(services?.find((e) => e?.uniqueId === selectedService?.uniqueId) || null);
        } else {
          if (defaultSelectedService) {
            setSelectedService(services?.find((e) => e?.uniqueId === defaultSelectedService) || null);
            if (setDefaultSelectedService) {
              setDefaultSelectedService(null);
            }
          } else {
            setSelectedService(services[pendingServiceIndex]);
          }
        }
      }
      setServiceSteps(services);
      if (
        (workOrderData?.canComplete &&
          !services
            .filter((e) => e.type === MATERIAL_TYPE.service)
            ?.every((e) => [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.skipped]?.includes(e.status))) ||
        (!workOrderData?.canComplete &&
          services
            .filter((e) => e.type === MATERIAL_TYPE.service)
            ?.every((e) => [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.skipped]?.includes(e.status)))
      ) {
        fetchWorkOrderData();
      }
    } else {
      setServiceSteps([]);
    }
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
  };

  const handleArrangeUpdate = (rows: any[]) => {
    rows?.forEach((e: any) => {
      delete e.name;
      delete e.preWork;
    });
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/order`, { data: rows || [] })
      .then(({ data }) => {
        fetchServiceData();
        setArrangeView(false);
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const updateServiceStatus = (uniqueId, status) => {
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${uniqueId}/status`, { status, comment })
      .then(({ data: { data } }) => {
        fetchServiceData();
        if (openCompleteDialog) {
          setOpenCompleteDialog(false);
        }
        setComment('');
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        if (openCompleteDialog) {
          setOpenCompleteDialog(false);
        }
      });
  };

  const handleUpdateService = (serviceId, uniqueId, status) => {
    const data = [
      {
        workOrder: workOrderId,
        service: serviceId,
        uniqueId: uniqueId,
        status: status
      }
    ];
    axiosInstance()
      .put(`${workOrder.api}/service/work-orders-services-status`, data)
      .then(({ data }) => {
        fetchServiceData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleAddService = (ids, uniqueId) => {
    setSubmitting(true);
    const data: any = {};
    data.serviceIds = ids;
    if (uniqueId) {
      data.aboveServiceUniqueId = uniqueId;
    }
    axiosInstance()
      .post(`${workOrder.api}/service/${workOrderId}`, data)
      .then(() => {
        setServiceDialog({ open: false, type: '', uniqueId: null, preWork: null });
        if ([QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer]?.includes(quotationData?.status)) {
          setReviseQuotation(true);
        } else {
          fetchServiceData();
        }
        fetchWorkOrderData();
        setSubmitting(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setSubmitting(false);
      });
  };

  const handleRemoveService = (id) => {
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/remove`, {
        uniqueIds: [id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        prevOrder.current = serviceSteps?.findIndex((s) => s?.uniqueId === selectedService?.uniqueId) + 1;
        if ([QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer]?.includes(quotationData?.status)) {
          setReviseQuotation(true);
        } else {
          fetchServiceData();
        }
        if (id === selectedService?.uniqueId) {
          setSelectedService(null);
        }
        fetchWorkOrderData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const createNewVersionQuote = () => {
    axiosInstance()
      .put(`/repair-order/${workOrderData?.repairOrder?.optionValue}/quotation/clone-version`)
      .then(() => {
        fetchServiceData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleColapse = () => {
    setIsColapsed((prev) => !prev);
  };

  useEffect(() => {
    if (mobScreen) {
      setIsColapsed(false);
    }
  }, [mobScreen]);

  const stylesForEveryTab = (selectedService, data, index): React.CSSProperties => {
    const commonStyle: React.CSSProperties = { overflow: 'hidden' };
    if (data?.type === 'quotation' && selectedService?.type !== 'quotation') {
      return {
        borderColor: 'var(--dark-mode-border-color, rgb(224, 224, 224))',
        borderBottomWidth: '1px',
        borderLeftWidth: '1px',
        borderRightWidth: '1px',
        borderStyle: 'solid',
        cursor: 'pointer',
        borderTopWidth: index !== 0 && !mobScreen ? 0 : 1,
        ...commonStyle
      };
    } else if (data?.type === 'quotation' && selectedService?.type === 'quotation') {
      return {
        borderColor: '#329592',
        borderTopWidth: '1px',
        borderBottomWidth: '1px',
        borderLeftWidth: '1px',
        borderRightWidth: '1px',
        borderStyle: 'solid',
        cursor: 'pointer',
        ...commonStyle
      };
    } else if (!data?.clickable) {
      return {
        borderBottomWidth: '1px',
        borderLeftWidth: '1px',
        borderRightWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--dark-mode-border-color, rgba(25, 24, 24, 0.19))',
        cursor: allowedToEdit ? 'pointer' : 'not-allowed',
        // pointerEvents: 'none',
        opacity: '.5',
        filter: 'grayscale(1)',
        borderTopWidth: index !== 0 && !mobScreen ? 0 : 1,
        ...commonStyle
      };
    }
    if (selectedService?.uniqueId == data?.uniqueId) {
      return {
        borderColor: 'var(--dark-active-border-color,#298B88)',
        borderTopWidth: '1px',
        borderBottomWidth: '1px',
        borderLeftWidth: '1px',
        borderRightWidth: '1px',
        borderStyle: 'solid',
        cursor: 'pointer',
        ...commonStyle
      };
    } else {
      return {
        borderBottomWidth: '1px',
        borderLeftWidth: '1px',
        borderRightWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--dark-mode-border-color, rgb(224, 224, 224))',
        cursor: 'pointer',
        borderTopWidth: index !== 0 && !mobScreen ? 0 : 1,
        ...commonStyle
      };
    }
  };

  const handleAddStep = (values: any) => {
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/add-step`, values)
      .then(({ data }) => {
        const temp = selectedService;
        setSelectedService(null);
        setSelectedService(temp);
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        setAssignSteps(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdatePurchaseOrder = (data: any) => {
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/add-purchase-order`, { purchaseOrderId: data?._id })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        setAssignSteps(false);
        setShowManagePurchaseOrder(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const isAllowedToServiceEdit =
    !completed &&
    (allowedToEdit ||
      selectedService?.assignedUsers?.some((u: any) => u?.optionValue === user?._id) ||
      (!selectedService?.assignedUsers?.length && selectedService?.competencies?.filter((e) => user?.competencies?.includes(e))?.length));

  const openAddServiceActions = (event) => {
    setAddServiceAnchorEl(event.currentTarget);
  };

  const closeAddServiceActions = () => {
    setAddServiceAnchorEl(null);
  };

  const handleProperties = (data) => {
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/update-fields`, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        fetchServiceData();
        setOpenProperties(false);
      })
      .catch((error) => {
        setOpenProperties(false);
        toastConfig.setToastConfig(error);
      });
  };

  const servicesButtons: ServicesButtons[] = [
    {
      id: '1',
      onClick: openAddServiceActions,
      iconForMobile: <Add />,
      disabled: allowedToEdit && !completed ? false : true,
      children: (
        <>
          <ExpandMore fontSize="small" className="-ml-2" /> Add
        </>
      ),
      visible: !isColapsed && resource === sidebarResource.workOrder,
      tooltip: 'Add'
    },
    {
      id: '2',
      disabled: allowedToEdit && !completed ? false : true,
      iconForMobile: <LowPriority />,
      color: 'primary',
      size: 'small',
      onClick: () => setArrangeView(true),
      children: (
        <>
          <DragIndicatorIcon fontSize="small" className="-ml-2" /> Arrange
        </>
      ),
      visible: !isColapsed && resource === sidebarResource.workOrder && serviceSteps?.length > 0,
      tooltip: 'Arrange'
    }
  ];

  return (
    <Box>
      {serviceSteps ? (
        <>
          <Grid container spacing={2}>
            {!mobScreen && (
              <Grid
                item
                xs={12}
                sm={5}
                md={5}
                lg={4}
                xl={3}
                style={{
                  maxWidth: isColapsed ? 'calc(76px + 40px)' : mobScreen ? '100%' : '',
                  flexBasis: isColapsed ? 'calc(76px + 40px)' : mobScreen ? '100%' : '',
                  transition: 'width 300ms ease 0s, max-width 300ms ease 0s, flex-basis 300ms ease 0s'
                }}
              >
                <RenderService
                  {...{
                    isColapsed,
                    serviceSteps,
                    stylesForEveryTab,
                    selectedService,
                    handleColapse,
                    stepSubmitedData,
                    setSelectedService,
                    user,
                    handleOpenMenu,
                    resource,
                    quotationData,
                    allowedToEdit,
                    setShowConfirmBox,
                    servicesButtons: servicesButtons,
                    isMobile: false,
                    initialTabIndex: prevOrder.current,
                    completed
                  }}
                />
              </Grid>
            )}

            {/* ------------------ RIGHT SIDE CONTENTS ------------------ */}
            <Grid
              item
              xs={12}
              sm={7}
              md={7}
              lg={8}
              xl={9}
              style={{
                maxWidth: isColapsed ? 'calc(100% - calc(76px + 40px))' : mobScreen ? '100%' : '',
                flexBasis: isColapsed ? 'calc(100% - calc(76px + 40px))' : mobScreen ? '100%' : '',
                transition: 'width 300ms ease 0s, max-width 300ms ease 0s, flex-basis 300ms ease 0s'
              }}
            >
              <Box
                className="container-with-border"
                style={{
                  overflow: 'hidden',
                  minHeight: '100%'
                }}
              >
                {selectedService && (
                  <>
                    {selectedService?.type === 'service' ? (
                      <Steps
                        workOrderData={workOrderData}
                        selectedService={selectedService}
                        allowedToEdit={isAllowedToServiceEdit && selectedService?.clickable}
                        fetchService={fetchServiceData}
                        resource={resource}
                        stepSubmitedData={stepSubmitedData}
                        minHeightClass={minHeightClass}
                        isMobile={mobScreen}
                        fetchWorkOrderData={fetchWorkOrderData}
                      />
                    ) : (
                      <Quotation />
                    )}
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
          {mobScreen && (
            <div
              className={`
              fixed bg-[var(--dark-primary,_#fff)] p-[10px_20px -bottom-2 left-0 right-0 z-[5] [border:1px_solid_var(--common-border-color)] border-b-0 transition-all duration-300`}
            >
              <RenderService
                {...{
                  isColapsed,
                  serviceSteps,
                  stylesForEveryTab,
                  selectedService,
                  handleColapse,
                  stepSubmitedData,
                  setSelectedService,
                  user,
                  handleOpenMenu,
                  resource,
                  quotationData,
                  allowedToEdit,
                  setShowConfirmBox,
                  servicesButtons: servicesButtons,
                  isMobile: true,
                  initialTabIndex: prevOrder.current,
                  completed
                }}
              />
            </div>
          )}
          {/* add Button menu */}
          {!isColapsed && resource === sidebarResource.workOrder && (
            <>
              <Menu
                anchorEl={addServiceAnchorEl}
                keepMounted
                getContentAnchorEl={null}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
                id="add-menu"
                open={Boolean(addServiceAnchorEl)}
                onClose={closeAddServiceActions}
              >
                <MenuItem
                  onClick={() => {
                    setServiceDialog({ open: true, type: 'service', uniqueId: null, preWork: null });
                    closeAddServiceActions();
                  }}
                >
                  Add Existing Services
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setServiceDialog({ open: true, type: 'newService', uniqueId: null, preWork: null });
                    closeAddServiceActions();
                  }}
                >
                  Add New Services
                </MenuItem>
              </Menu>
            </>
          )}
          {anchorEl && (
            <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
              {allowedToEdit && resource === sidebarResource.workOrder && (
                <MenuItem
                  disabled={![WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.skipped]?.includes(selectedService?.status) && !completed ? false : true}
                  onClick={() => {
                    setUserAssignDialog(true);
                    setAnchorEl(null);
                  }}
                >
                  Assign Technicians
                </MenuItem>
              )}
              {allowedToEdit && resource === sidebarResource.workOrder && permissions?.workStations?.isRead && (
                <MenuItem
                  disabled={![WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.skipped]?.includes(selectedService?.status) ? false : true}
                  onClick={() => {
                    setWorkStationAssignDialog(true);
                    setAnchorEl(null);
                  }}
                >
                  Assign Work Stations
                </MenuItem>
              )}
              {resource === sidebarResource.workOrder && (
                <MenuItem
                  disabled={!isAllowedToServiceEdit}
                  onClick={() => {
                    setServiceDialog({ open: true, type: 'service', uniqueId: selectedService.uniqueId, preWork: selectedService.preWork });
                    setAnchorEl(null);
                  }}
                >
                  Add Existing Services
                </MenuItem>
              )}
              {resource === sidebarResource.workOrder && (
                <MenuItem
                  disabled={
                    [WORKORDER_SERVICE_STATUS.pending, WORKORDER_SERVICE_STATUS.inProgress].includes(selectedService?.status) &&
                      isAllowedToServiceEdit &&
                      selectedService?.clickable
                      ? false
                      : true
                  }
                  onClick={() => {
                    setAssignSteps(true);
                    setAnchorEl(null);
                  }}
                >
                  Add Steps
                </MenuItem>
              )}
              {resource === sidebarResource.workOrder && (
                <MenuItem
                  disabled={
                    allowedToEdit && ![WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.skipped]?.includes(selectedService?.status) && !completed
                      ? false
                      : true
                  }
                  onClick={() => {
                    setSetpsInOtherServices(true);
                    setAnchorEl(null);
                  }}
                >
                  Add Steps in Other Services
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  setViewServiceStepDataDialog({ open: true, selectedService: selectedService });
                  setAnchorEl(null);
                }}
              >
                View Service Steps Data
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAttchmentsDialog({
                    open: true,
                    uniqueServiceId: selectedService.uniqueId,
                    stepId: null,
                    serviceName: selectedService.serviceName,
                    stepName: selectedService?.serviceName || ''
                  });
                  setAnchorEl(null);
                }}
                disabled={!isAllowedToServiceEdit}
              >
                Upload Documents
              </MenuItem>
              {!user?.brandPolicy?.workOrderConsumableHide && resource === sidebarResource.workOrder && (
                <MenuItem
                  disabled={!isAllowedToServiceEdit}
                  onClick={() => {
                    setConsumablesDialog({
                      open: true,
                      uniqueId: selectedService.uniqueId,
                      service: selectedService._id,
                      stepId: null,
                      serviceName: selectedService.serviceName
                    });
                    setAnchorEl(null);
                  }}
                >
                  Add/Consume Products
                </MenuItem>
              )}
              <MenuItem
                disabled={
                  isAllowedToServiceEdit &&
                    [WORKORDER_SERVICE_STATUS.pending, WORKORDER_SERVICE_STATUS.inProgress].includes(selectedService?.status) &&
                    selectedService?.clickable
                    ? false
                    : true
                }
                onClick={() => {
                  handleUpdateService(selectedService?._id, selectedService?.uniqueId, WORKORDER_SERVICE_STATUS.completed);
                  setAnchorEl(null);
                }}
              >
                Complete Service
              </MenuItem>
              <MenuItem
                disabled={
                  isAllowedToServiceEdit &&
                    [WORKORDER_SERVICE_STATUS.pending, WORKORDER_SERVICE_STATUS.inProgress].includes(selectedService?.status) &&
                    selectedService?.clickable
                    ? false
                    : true
                }
                onClick={() => {
                  handleUpdateService(selectedService?._id, selectedService?.uniqueId, WORKORDER_SERVICE_STATUS.skipped);
                  setAnchorEl(null);
                }}
              >
                Skip Service
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setCommentsDialog(true);
                  setAnchorEl(null);
                }}
                disabled={!isAllowedToServiceEdit}
              >
                Comments
              </MenuItem>
              {user?.brandPolicy?.subcontractPurchaseOrder && resource === sidebarResource.workOrder && (
                <MenuItem
                  onClick={() => {
                    setShowManagePurchaseOrder(true);
                    setAnchorEl(null);
                  }}
                >
                  Subcontract PO
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  setLogsDialog(true);
                  setAnchorEl(null);
                }}
              >
                Logs
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setOpenProperties(true);
                  setAnchorEl(null);
                }}
                disabled={allowedToEdit && selectedService?.status === WORKORDER_SERVICE_STATUS.pending && !completed ? false : true}
              >
                Properties
              </MenuItem>
              {resource === sidebarResource.workOrder && (
                <MenuItem
                  disabled={allowedToEdit && selectedService?.status === WORKORDER_SERVICE_STATUS.pending && !completed ? false : true}
                  onClick={() => {
                    handleRemoveService(selectedService?.uniqueId);
                    setAnchorEl(null);
                  }}
                >
                  Delete
                </MenuItem>
              )}
            </Menu>
          )}
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {userAssignDialog && (
        <AssignUserDialog
          warehouse={workOrderData?.warehouse?.optionValue}
          workOrderData={[
            {
              uniqueId: selectedService?.uniqueId,
              workOrderId: workOrderId
            }
          ]}
          assignedUsers={selectedService?.assignedUsers}
          reference={'service'}
          handleClose={() => {
            setUserAssignDialog(false);
          }}
          handleSucess={() => {
            setUserAssignDialog(false);
            fetchServiceData();
          }}
          competencies={selectedService?.competencies}
        />
      )}
      {workStationAssignDialog && (
        <AssignWorkStationDialog
          warehouse={workOrderData?.warehouse?.optionValue}
          workOrderData={[
            {
              uniqueId: selectedService?.uniqueId,
              workOrderId: workOrderId
            }
          ]}
          workStations={selectedService?.assignedWorkStations}
          handleClose={() => {
            setWorkStationAssignDialog(false);
          }}
          handleSucess={() => {
            setWorkStationAssignDialog(false);
            fetchServiceData();
          }}
        />
      )}
      {serviceDialog.open && serviceDialog.type === 'service' && (
        <AssignServiceDialog
          handleClose={() => setServiceDialog({ open: false, type: '', uniqueId: null, preWork: null })}
          onSuccess={(data) => {
            handleAddService(
              data?.map((e) => {
                return { _id: e._id, qty: parseInt(e?.qty) || 1 };
              }),
              serviceDialog.uniqueId
            );
          }}
          isSubmitting={isSubmitting}
          extraStaticFilter={serviceDialog.preWork == null ? [] : [{ field: 'preWork', term: serviceDialog.preWork }]}
        />
      )}
      {serviceDialog.open && serviceDialog.type === 'newService' && (
        <ManageServiceMaster
          isClone={false}
          serviceMasterId={null}
          onClose={() => setServiceDialog({ open: false, type: '', uniqueId: null, preWork: null })}
          onSuccess={(data) => {
            handleAddService([{ _id: data?.data?._id, qty: 1 }], serviceDialog.uniqueId);
          }}
          isRedirectToDetailPage={false}
        />
      )}
      {arrangeView && (
        <ArrangeView
          data={
            serviceSteps
              ?.filter((e) => e.type === 'service')
              ?.map((d) => {
                return { _id: d?.uniqueId, name: d?.serviceName, order: d?.order, preWork: d?.preWork };
              }) || []
          }
          title={'Arrange'}
          handleClose={() => setArrangeView(false)}
          handleSubmit={handleArrangeUpdate}
          loading={false}
        />
      )}
      {consumablesDialog.open && (
        <ConsumablesDialog
          onSuccess={() => {
            setConsumablesDialog({ open: false, uniqueId: null, service: null, stepId: null, serviceName: null });
            fetchServiceData();
          }}
          handleClose={() => {
            setConsumablesDialog({ open: false, uniqueId: null, service: null, stepId: null, serviceName: null });
          }}
          workOrderData={workOrderData}
          service={consumablesDialog.service}
          uniqueId={consumablesDialog.uniqueId}
          stepId={consumablesDialog.stepId}
          serviceName={consumablesDialog.serviceName}
        />
      )}
      {logsDialog && (
        <Logs
          workOrderId={workOrderId}
          serviceId={selectedService?._id}
          uniqueId={selectedService?.uniqueId}
          serviceName={selectedService?.serviceName}
          handleClose={() => {
            setLogsDialog(false);
          }}
        />
      )}
      {viewServiceStepDataDialog.open && (
        <ViewServiceStepDataDialog
          servicesData={serviceSteps}
          stepsData={stepSubmitedData}
          selectedService={selectedService}
          handleClose={() => {
            setViewServiceStepDataDialog({ open: false, selectedService: null });
          }}
        />
      )}
      {commentsDialog && (
        <Comments
          userId={user._id}
          workOrderId={workOrderId}
          uniqueId={selectedService?.uniqueId}
          serviceName={selectedService?.serviceName}
          stepId={null}
          handleClose={() => {
            setCommentsDialog(false);
          }}
        />
      )}
      {openCompleteDialog && (
        <CompleteDialog
          serviceName={selectedService?.serviceName}
          comment={comment}
          setComment={setComment}
          updateStatus={() => updateServiceStatus(selectedService?.uniqueId, WORKORDER_SERVICE_STATUS.completed)}
          handleClose={() => {
            setComment('');
            setOpenCompleteDialog(false);
          }}
        />
      )}
      {assignSteps && (
        <StepDialog
          handleClose={() => {
            setAssignSteps(false);
          }}
          handleSucess={(data) => {
            handleAddStep(data);
          }}
          stepId={''}
          steps={selectedService?.steps}
          reference={'workOrder'}
          workOrderId={workOrderId}
          serviceId={selectedService?._id}
          uniqueId={selectedService?.uniqueId}
        />
      )}
      {attchmentsDialog.open && (
        <AttachmentDialog
          workOrderId={workOrderId}
          uniqueServiceId={attchmentsDialog.uniqueServiceId}
          stepId={attchmentsDialog.stepId}
          serviceName={attchmentsDialog.serviceName}
          stepName={attchmentsDialog.stepName}
          handleClose={() => {
            setAttchmentsDialog({ open: false, uniqueServiceId: null, stepId: null, serviceName: null, stepName: null });
          }}
          handleSuccess={() => {
            setAttchmentsDialog({ open: false, uniqueServiceId: null, stepId: null, serviceName: null, stepName: null });
          }}
        />
      )}
      {showManagePurchaseOrder && (
        <ManagePurchaseOrder
          isClone={false}
          purchaseOrderId={null}
          onClose={() => setShowManagePurchaseOrder(false)}
          onSuccess={(data: any) => {
            handleUpdatePurchaseOrder(data);
          }}
          products={[]}
          services={[
            {
              service: selectedService?.materialId,
              unit: isArray(selectedService?.unit) && selectedService?.unit?.length ? selectedService?.unit[0] : '',
              qty: 1
            }
          ]}
          warehouseId={workOrderData?.warehouse?.optionValue}
          isRedirectTodetailPage={false}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${selectedService?.serviceName}?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={() => {
            handleRemoveService(selectedService?.uniqueId);
            setShowConfirmBox(false);
          }}
        />
      )}

      {reviseQuotation && (
        <ConfirmationDialog
          open={reviseQuotation}
          message={`Do you want to revise the Quotation ?`}
          onClose={() => {
            setReviseQuotation(false);
            fetchServiceData();
          }}
          onOk={() => {
            createNewVersionQuote();
            setReviseQuotation(false);
          }}
        />
      )}

      {setpsInOtherServices && (
        <StepsInOtherServices
          workOrderId={workOrderId}
          resource={resource}
          service={selectedService}
          allowedToEdit={allowedToEdit}
          onClose={() => {
            setSetpsInOtherServices(false);
          }}
        />
      )}

      {openProperties && (
        <ConfigureFields
          serviceId={selectedService?._id}
          handleClose={() => {
            setOpenProperties(false);
          }}
          handleSucess={(data) => {
            handleProperties(data);
          }}
          reference={'workOrder'}
          fields={selectedService?.fields || []}
        />
      )}
    </Box>
  );
};

export default Service;

type RenderStatusIconProps = {
  stepStatus: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const RenderStatusIcon = ({ stepStatus, style = {}, ...others }: RenderStatusIconProps) => {
  return (
    <>
      {stepStatus === WORKORDER_SERVICE_STEP_STATUS.passed && (
        <HtmlTooltip enterTouchDelay={0} title={stepStatus} arrow>
          <div style={{ ...style, color: '#059825' }} {...others}>
            <PassIcon style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </HtmlTooltip>
      )}
      {stepStatus === WORKORDER_SERVICE_STEP_STATUS.failed && (
        <HtmlTooltip enterTouchDelay={0} title={stepStatus} arrow>
          <div style={{ ...style, color: '#EE0E06' }} {...others}>
            <FailIcon style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </HtmlTooltip>
      )}
    </>
  );
};
