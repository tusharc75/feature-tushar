import { useState, useEffect, Fragment, useContext } from 'react';
import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import {
  CHILD_RESOURCE,
  MATERIAL_SUB_TYPE,
  MATERIAL_TYPE,
  WORKORDER_SERVICE_STATUS,
  WORK_ORDER_STATUS,
  productionOrder,
  workOrder
} from '../../../constants/helpers';
import { map, orderBy, startCase, uniq } from 'lodash';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { flattenArray, generateCustomTableColumns } from 'src/constants/columns';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import { isMobile } from 'react-device-detect';
import { Delete, ExpandMore } from '@material-ui/icons';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import ManageServiceMaster from 'src/pages/ServiceMaster/ManageServiceMaster';
import AssignUserDialog from 'src/pages/WorkOrder/Service/AssignUserDialog';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { AutoCompleteIcon } from 'src/assets/svg/svgIcons';
import AssignWorkStationDialog from 'src/pages/WorkOrder/Service/AssignWorkStationDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const WorkOrder = ({ productionOrderData, setNextStep, renderedFrom, stepFullScreen, allowedToEdit, setCurrentStep }) => {
  const {
    state: { user, permissions }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [addServicesDialog, setAddServicesDialog] = useState({ open: false, new: false });
  const [userAssignDialog, setUserAssignDialog] = useState({ open: false, assignedUsers: [] });
  const [workStationAssignDialog, setWorkStationAssignDialog] = useState({ open: false, assignedWorkStations: [] });
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [arrangeView, setArrangeView] = useState(false);
  const [autoCompleteData, setAutoCompleteData] = useState(null);
  const [completeConfirmBox, setCompleteConfirmBox] = useState(false);
  const [isCompleting, setCompleting] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [consumablesDialog, setConsumablesDialog] = useState({ open: false, ids: [], data: null });

  useEffect(() => {
    fetchFields();
  }, [productionOrderData]);

  const fetchFields = async () => {
    await axiosInstance().post(`${productionOrder.api}/${productionOrderData._id}/work-order`);
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.productionOrderDetail}`);
    var data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, productionOrderData?.currency || 'USD');
    data?.forEach((e) => {
      e.isColumnEditable = false;
    });
    const newColumns = generateCustomTableColumns(data, productionOrderData?.currency || 'USD', renderedFrom);
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        disableFilters: true,
        sticky: isMobile ? 'none' : 'left',
        width: 100,
        Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: ' Details',
        minWidth: 200,
        width: 200,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row, rows }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p className="text-truncate">{row.original?.detail}</p>
            <Box ml={1}>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === 'product') {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            </Box>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'workOrder',
        Header: 'Work Order',
        width: 200,
        Cell: ({ row }) =>
          row.original.workOrder ? (
            <div className="d-flex gap-2 align-items-center">
              <p className="text-truncate">{row.original.workOrderNumber}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.workOrderDetail.path}/${row.original?.workOrder?._id}`);
                }}
              >
                <OpenInNewIcon fontSize="small" color={'primary'} />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'workOrderStatus',
        Header: 'Result',
        width: 200,
        Cell: ({ row }) => (row?.original['workOrderStatus'] ? <p> {row?.original?.workOrderStatus}</p> : <NoDataCell />)
      },
      {
        accessor: 'assignedUsers',
        Header: 'Assigned Technician',
        width: 200,
        disableFilters: true,
        Cell: ({ row }) =>
          row?.original['assignedUsers'] && row?.original['assignedUsers']?.length ? (
            row?.original['assignedUsers']?.map((e, i) => {
              return i === row?.original['assignedUsers'].length - 1 ? (
                <a
                  className="link text-truncate [flex-grow:0_!important]"
                  target="_blank"
                  href={`${routes.userDetail.path}/${e.optionValue}`}
                  rel="noreferrer"
                >
                  {e?.optionLabel}
                </a>
              ) : (
                <>
                  <a
                    className="link text-truncate [flex-grow:0_!important]"
                    target="_blank"
                    href={`${routes.userDetail.path}/${e.optionValue}`}
                    rel="noreferrer"
                  >
                    {e?.optionLabel},
                  </a>
                  &nbsp;
                </>
              );
            })
          ) : (
            <NoDataCell />
          )
      }
    ];
    if (permissions?.workStations?.isRead) {
      coloum.push({
        accessor: 'assignedWorkStations',
        Header: 'Assigned Work Station',
        disableFilters: true,
        width: 200,
        Cell: ({ row }) =>
          row?.original['assignedWorkStations'] && row?.original['assignedWorkStations']?.length ? (
            row?.original['assignedWorkStations']?.map((e, i) => {
              return i === row?.original['assignedWorkStations'].length - 1 ? (
                <a
                  className="link text-truncate [flex-grow:0_!important]"
                  target="_blank"
                  href={`${routes.workStationsDetail.path}/${e.optionValue}`}
                  rel="noreferrer"
                >
                  {e?.optionLabel}
                </a>
              ) : (
                <>
                  <a
                    className="link text-truncate [flex-grow:0_!important]"
                    target="_blank"
                    href={`${routes.workStationsDetail.path}/${e.optionValue}`}
                    rel="noreferrer"
                  >
                    {e?.optionLabel},
                  </a>
                  &nbsp;
                </>
              );
            })
          ) : (
            <NoDataCell />
          )
      });
    }
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 70,
      width: 70,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => {
        return (
          <>
            {[MATERIAL_TYPE.service, MATERIAL_TYPE.package]?.includes(row?.original?.type) ? (
              <>
                <IconButton
                  disabled={
                    row?.original?.type === MATERIAL_TYPE.package && row?.original?.subRows?.length === 0
                      ? false
                      : row?.original?.status === WORKORDER_SERVICE_STATUS.pending
                      ? false
                      : true
                  }
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    setDeleteData([row.original]);
                    setShowConfirmBox(true);
                  }}
                >
                  <Delete
                    fontSize="small"
                    color={
                      row?.original?.type === MATERIAL_TYPE.package && row?.original?.subRows?.length === 0
                        ? 'error'
                        : row?.original?.status === WORKORDER_SERVICE_STATUS.pending
                        ? 'error'
                        : 'disabled'
                    }
                  />
                </IconButton>
              </>
            ) : row?.original?.type === MATERIAL_TYPE.product ? (
              <>
                <IconButton
                  disabled={row.original?.subRows?.length === 0 && row.original?.workOrderStatus !== WORK_ORDER_STATUS.completed ? false : true}
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    setDeleteData([row.original]);
                    setShowConfirmBox(true);
                  }}
                >
                  <Delete
                    fontSize="small"
                    color={
                      row.original?.subRows?.length === 0 && row.original?.workOrderStatus !== WORK_ORDER_STATUS.completed ? 'error' : 'disabled'
                    }
                  />
                </IconButton>
              </>
            ) : null}
            {row?.original?.type === MATERIAL_TYPE.product && !row?.original?.parentId && (
              <HtmlTooltip title="Auto Complete Work Order">
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    setAutoCompleteData([row.original]);
                    setCompleteConfirmBox(true);
                  }}
                  disabled={row?.original?.canAutoCompleteWorkOrder ? false : true}
                >
                  <AutoCompleteIcon size={18} />
                </IconButton>
              </HtmlTooltip>
            )}
          </>
        );
      }
    });
    setColumns(coloum);
    fetchData();
  };

  const fetchData = async () => {
    setNextStep(false);
    var data: any = [];
    const response = await axiosInstance().get(`${productionOrder.api}/${productionOrderData._id}/work-order/service`);
    data = response?.data?.data;
    let rows = data.material.filter((e) => e.type === MATERIAL_TYPE.product && e?.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === MATERIAL_TYPE.service
          ? parent?.serviceDetail?.serviceName
          : parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.packageDetail?.packageName;
      parent.description =
        parent.type === MATERIAL_TYPE.product ? parent?.productDetail?.productDescription : parent?.packageDetail?.packageDescription;
      parent.qty = parent.qty;
      parent.workOrderNumber = parent?.workOrder?.workOrderNumber;
      parent.hideSelection = false;
      if (parent?.workOrder?.status === WORK_ORDER_STATUS.completed) {
        parent.hideSelection = true;
        parent.workOrderStatus = parent?.workOrder?.status;
      }
      parent.subRows = generateNestedData(data.material, parent);
      if (parent?.workOrder?.status === WORK_ORDER_STATUS.new && parent?.subRows?.some((obj) => obj.type === MATERIAL_TYPE.service)) {
        parent.canAutoCompleteWorkOrder = true;
      }
    });
    if (rows.filter((e) => e?.workOrderStatus === WORK_ORDER_STATUS.completed)?.length === rows?.length) {
      setNextStep(true);
    }
    setRowsData(rows);
  };

  const generateNestedData = (material, parent) => {
    var subRows: any = material.filter((e) => e?.parentId === parent?._id);
    subRows = orderBy(subRows, ['type'], ['desc']);
    let productIndex = 0;
    let serviceIndex = 0;
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${_subRow.type === MATERIAL_TYPE.service ? alphabet[serviceIndex] : productIndex + 1}`;
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceName
          : _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow.packageDetail?.packageName;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription
          : _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription
          : _subRow?.packageDetail?.packageDescription;
      _subRow.qty = _subRow.qty;
      _subRow.workOrder = parent?.workOrder;
      _subRow.workOrderNumber = parent?.workOrder?.workOrderNumber;
      _subRow.hideSelection = false;
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.type === MATERIAL_TYPE.service ? serviceIndex++ : productIndex++;
      if (_subRow?.status === WORKORDER_SERVICE_STATUS.completed) {
        _subRow.hideSelection = true;
      }
    });
    return subRows;
  };

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  const handleAddService = (ids) => {
    setSubmitting(true);
    const allWorkOrders = selectedProducts?.map((e) => e.workOrder?._id);
    const data: any = {};
    data.serviceIds = ids;
    data.workOrderIds = [...new Set(allWorkOrders)];
    axiosInstance()
      .post(`${workOrder.api}/service`, data)
      .then(() => {
        setAddServicesDialog({ open: false, new: false });
        fetchData();
        setSubmitting(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setSubmitting(false);
      });
  };

  const handleDelete = () => {
    if (deleteData?.some((e) => e.type === 'service')) {
      let ids = [];
      let workOrderId = '';
      if (deleteData.length > 0) {
        workOrderId = deleteData[0]?.workOrder?._id;
        deleteData.forEach((d) => {
          ids.push(d.uniqueId);
        });
      }
      setDeleting(true);
      axiosInstance()
        .put(`${workOrder.api}/service/${workOrderId}/remove`, {
          uniqueIds: ids
        })
        .then(({ data }) => {
          setDeleting(false);
          setShowConfirmBox(false);
          fetchData();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
        })
        .catch((err) => {
          setShowConfirmBox(false);
          setDeleting(false);
          toastConfig.setToastConfig(err);
        });
    } else if (deleteData?.filter((e: any) => !e?.subRows?.length && e?.workOrder?.status !== WORK_ORDER_STATUS.completed)?.length) {
      handleWorkOrderDelete(
        deleteData?.filter((e: any) => !e?.subRows?.length && e?.workOrder?.status !== WORK_ORDER_STATUS.completed)?.map((e) => e.workOrder?._id)
      );
    }
  };

  const handleWorkOrderDelete = (ids) => {
    axiosInstance()
      .put(`${workOrder.api}/remove`, { ids: ids })
      .then(({ data }) => {
        setDeleting(false);
        setShowConfirmBox(false);
        setCurrentStep((prevStep) => {
          const newStep = prevStep - 1;
          return newStep;
        });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((err) => {
        setShowConfirmBox(false);
        setDeleting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleArrangeUpdate = (rows: any[], workOrderId) => {
    rows?.forEach((e: any) => {
      delete e.name;
      delete e.preWork;
    });
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/order`, { data: rows || [] })
      .then(({ data }) => {
        fetchData();
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

  const handleAutoComplete = () => {
    let ids = [];
    if (autoCompleteData && autoCompleteData.length > 0) {
      autoCompleteData.forEach((d) => {
        if (d?.canAutoCompleteWorkOrder) ids.push(d?.workOrder?._id);
      });
    }
    setCompleting(true);
    if (ids.length) {
      axiosInstance()
        .put(`${productionOrder.api}/${productionOrderData._id}/work-order/auto-complete`, {
          workOrders: ids
        })
        .then(({ data }) => {
          setCompleting(false);
          setCompleteConfirmBox(false);
          fetchData();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          fetchData();
        })
        .catch((err) => {
          setCompleteConfirmBox(false);
          setCompleting(false);
          toastConfig.setToastConfig(err);
        });
    } else {
      setCompleting(false);
      setCompleteConfirmBox(false);
      fetchData();
    }
  };

  const handleAddConsumables = (rows, records = []) => {
    setSubmitting(true);
    const data: any = [];
    let workOrderId = '';
    const product = records?.find((s) => s.type === MATERIAL_TYPE.product);
    if (product) {
      workOrderId = product?.workOrder?._id;
      rows?.forEach((e) => {
        data.push({
          product: e._id,
          qty: parseInt(e.qty) || 1,
          subType: MATERIAL_SUB_TYPE.consumable,
          service: null,
          uniqueId: null,
          stepId: null
        });
      });
    } else {
      const services = records?.filter((s) => s.type === MATERIAL_TYPE.service);
      workOrderId = services[0]?.workOrder?._id;
      services?.forEach((s) => {
        rows?.forEach((e) => {
          data.push({
            product: e._id,
            qty: parseInt(e.qty) || 1,
            subType: MATERIAL_SUB_TYPE.consumable,
            service: s?.serviceDetail?._id,
            uniqueId: s?.uniqueId,
            stepId: null,
            parentId: s?._id
          });
        });
      });
    }
    axiosInstance()
      .post(`${workOrder.api}/${workOrderId}/consumable`, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        setSubmitting(false);
        setConsumablesDialog({ open: false, ids: [], data: null });
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const checkUniqWorkOrder = () => {
    if (selectedProducts.length === 0) {
      return false;
    } else if (uniq(map(selectedProducts, 'workOrder._id')).length === 1) {
      return true;
    } else {
      return false;
    }
  };

  return (
    <Fragment>
      <Box display="flex" alignItems="center" justifyContent={'flex-end'} gridColumnGap={8} flex={1} m={1} my={1}>
        {allowedToEdit && (
          <Box display="flex" gridColumnGap={5}>
            <Button
              variant="outlined"
              color="default"
              size="small"
              onClick={openActions}
              aria-controls="action-menu"
              disabled={selectedProducts?.length === 0}
              endIcon={<ExpandMore />}
              className="new-dropdown-v1"
            >
              Actions
            </Button>
            <Menu
              anchorEl={anchorActionEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="action-menu"
              open={Boolean(anchorActionEl)}
              onClose={closeActions}
            >
              <MenuItem
                onClick={() => {
                  closeActions();
                  setAddServicesDialog({ open: true, new: false });
                }}
              >
                Add Existing Services
              </MenuItem>
              <MenuItem
                onClick={() => {
                  closeActions();
                  setAddServicesDialog({ open: true, new: true });
                }}
              >
                Add New Service
              </MenuItem>
              <MenuItem
                disabled={selectedProducts?.filter((d) => d.type === 'service')?.length > 0 ? false : true}
                onClick={() => {
                  closeActions();
                  const services = selectedProducts?.filter((d) => d.type === 'service');
                  const assignedUsers = services?.map((e) => e?.assignedUsers) || [];
                  const uniqueAssignedUsers = [...new Set(assignedUsers.flat())];
                  setUserAssignDialog({ open: true, assignedUsers: uniqueAssignedUsers });
                }}
              >
                Assign Technician
              </MenuItem>
              {allowedToEdit && permissions?.workStations?.isRead && (
                <MenuItem
                  disabled={selectedProducts?.filter((d) => d.type === 'service')?.length > 0 ? false : true}
                  onClick={() => {
                    closeActions();
                    const services = selectedProducts?.filter((d) => d.type === 'service');
                    const assignedWorkStations = services?.map((e) => e?.assignedWorkStations) || [];
                    const uniqueAssignedWorkStations = [...new Set(assignedWorkStations.flat())];
                    setWorkStationAssignDialog({ open: true, assignedWorkStations: uniqueAssignedWorkStations });
                  }}
                >
                  Assign Work Station
                </MenuItem>
              )}
              {!user?.user?.brandPolicy?.workOrderConsumableHide && (
                <MenuItem
                  disabled={
                    selectedProducts?.filter((d) => [MATERIAL_TYPE.product, MATERIAL_TYPE.service]?.includes(d.type))?.length > 0 &&
                    checkUniqWorkOrder()
                      ? false
                      : true
                  }
                  onClick={() => {
                    var ids = [];
                    if (selectedProducts?.find((e) => e.type === MATERIAL_TYPE.product)) {
                      const product = selectedProducts?.find((e) => e.type === MATERIAL_TYPE.product);
                      ids = flattenArray(rowsData)
                        ?.filter((e) => e?.workOrder?._id === product?.workOrder?._id)
                        ?.map((e) => e.materialId);
                    } else {
                      const serviceIds = selectedProducts?.filter((d) => d?.type === MATERIAL_TYPE.service)?.map((e) => e._id);
                      ids = flattenArray(rowsData)
                        ?.filter((e) => serviceIds?.includes(e?.parentId))
                        ?.map((e) => e.materialId);
                    }
                    closeActions();
                    setConsumablesDialog({ open: true, ids: ids, data: null });
                  }}
                >
                  Add Products/Consumables
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  closeActions();
                  setArrangeView(true);
                }}
                disabled={
                  selectedProducts?.length && selectedProducts?.every((d) => d.workOrder?._id === selectedServices[0]?.workOrder?._id) ? false : true
                }
              >
                Arrange Services
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAutoCompleteData(selectedProducts);
                  setCompleteConfirmBox(true);
                  closeActions();
                }}
                disabled={selectedProducts.some((e) => e?.canAutoCompleteWorkOrder) ? false : true}
              >
                Auto Complete Work Order(s)
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setDeleteData(selectedServices);
                  setShowConfirmBox(true);
                  closeActions();
                }}
                disabled={
                  selectedProducts?.filter((e) => e.type === 'service').length ===
                  selectedServices?.filter(
                    (d) =>
                      d.type === 'service' &&
                      d.workOrder?._id === selectedServices[0]?.workOrder?._id &&
                      d.status === WORKORDER_SERVICE_STATUS.pending
                  )?.length
                    ? false
                    : true
                }
              >
                Delete
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>
      {columns && rowsData ? (
        <>
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              data={rowsData}
              onSelect={(data) => {
                setSelectedProducts(data);
                setSelectedServices(data?.filter((d) => d.type === MATERIAL_TYPE.service && !d.hideSelection) || []);
              }}
              setWholeRowsCellColor={(rowData) => (rowData.type === 'service' ? 'isService' : '')}
              childrenProperty="subRows"
              uniqueKey="_id"
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideSelection={!allowedToEdit}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

      {addServicesDialog.open && !addServicesDialog.new && (
        <AssignServiceDialog
          handleClose={() => setAddServicesDialog({ open: false, new: false })}
          onSuccess={(data) => {
            handleAddService(
              data?.map((e) => {
                return { _id: e._id, qty: parseInt(e?.qty) || 1 };
              })
            );
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {addServicesDialog.open && addServicesDialog.new && (
        <ManageServiceMaster
          isClone={false}
          serviceMasterId={null}
          onClose={() => setAddServicesDialog({ open: false, new: false })}
          onSuccess={({ data }) => {
            handleAddService([{ _id: data._id, qty: 1 }]);
          }}
          isRedirectToDetailPage={false}
        />
      )}
      {userAssignDialog.open && (
        <AssignUserDialog
          workOrderData={selectedProducts
            .filter((e) => e.type === 'service')
            .map((d) => {
              return {
                uniqueId: d?.uniqueId,
                workOrderId: d?.workOrder?._id
              };
            })}
          reference="service"
          assignedUsers={userAssignDialog.assignedUsers}
          handleClose={() => {
            setUserAssignDialog({ open: false, assignedUsers: [] });
          }}
          handleSucess={() => {
            fetchData();
            setUserAssignDialog({ open: false, assignedUsers: [] });
          }}
        />
      )}
      {workStationAssignDialog.open && (
        <AssignWorkStationDialog
          warehouse={productionOrderData?.warehouse}
          workOrderData={selectedProducts
            .filter((e) => e.type === 'service')
            .map((d) => {
              return {
                uniqueId: d?.uniqueId,
                workOrderId: d?.workOrder?._id
              };
            })}
          workStations={workStationAssignDialog.assignedWorkStations}
          handleClose={() => {
            setWorkStationAssignDialog({ open: false, assignedWorkStations: [] });
          }}
          handleSucess={() => {
            fetchData();
            setWorkStationAssignDialog({ open: false, assignedWorkStations: [] });
          }}
        />
      )}
      {arrangeView && (
        <ArrangeView
          data={
            selectedServices
              ?.filter((e) => e.type === 'service')
              ?.map((d) => {
                return { _id: d?.uniqueId, name: d?.serviceDetail?.serviceName, order: d?.order, preWork: d?.preWork };
              }) || []
          }
          title={'Arrange Services'}
          handleClose={() => setArrangeView(false)}
          handleSubmit={(data) => handleArrangeUpdate(data, selectedServices[0]?.workOrder?._id)}
          loading={false}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isDeleting}
          open={showConfirmBox}
          message={`Are you sure you want to delete this item(s)`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {completeConfirmBox && (
        <ConfirmationDialog
          open={completeConfirmBox}
          okBtnLoading={isCompleting}
          message={`Are you sure you want to Auto Complete this Work Order(s)`}
          onClose={() => {
            setCompleteConfirmBox(false);
          }}
          onOk={handleAutoComplete}
        />
      )}
      {consumablesDialog.open && (
        <AssignProductDialog
          handleCloseDialog={() => setConsumablesDialog({ open: false, ids: [], data: null })}
          ids={consumablesDialog.ids}
          onSuccess={(rows) => {
            handleAddConsumables(rows, consumablesDialog?.data ? consumablesDialog?.data : selectedProducts);
          }}
          serialized={false}
          isSubmitting={isSubmitting}
        />
      )}
    </Fragment>
  );
};

export default WorkOrder;
