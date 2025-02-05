import { Box, IconButton, MenuItem, Typography } from '@mui/material';
import { CheckCircle, Delete } from '@mui/icons-material';
import { flatMap, map, orderBy, startCase, uniq } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CHILD_RESOURCE, MATERIAL_SUB_TYPE, MATERIAL_TYPE, WORK_ORDER_STATUS, workOrder, WORKORDER_SERVICE_STATUS } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import SyncIcon from '@mui/icons-material/Sync';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { AutoCompleteIcon } from 'src/assets/svg/svgIcons';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import ManageServiceMaster from 'src/pages/ServiceMaster/ManageServiceMaster';
import { flattenArray } from 'src/constants/columns';
import AssignUserDialog from 'src/pages/WorkOrder/Service/AssignUserDialog';
import AssignWorkStationDialog from 'src/pages/WorkOrder/Service/AssignWorkStationDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import AttachmentDialog from 'src/pages/WorkOrder/Service/AttachmentDialog';
import PackageNumberDialog from 'src/pages/AssemblyOrder/WorkOrder/PackageNumberDialog';

const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const WorkOrder = ({ renderedFrom, assemblyOrderData, setNextStep, stepFullScreen, allowedToEdit, setCurrentStep }) => {
  const {
    state: { user, permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [material, setMaterial] = useState([]);
  const [autoCompleteData, setAutoCompleteData] = useState(null);
  const [completeConfirmBox, setCompleteConfirmBox] = useState(false);
  const [isCompleting, setCompleting] = useState(false);
  const [addServicesDialog, setAddServicesDialog] = useState({ open: false, new: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userAssignDialog, setUserAssignDialog] = useState({ open: false, assignedUsers: [] });
  const [workStationAssignDialog, setWorkStationAssignDialog] = useState({ open: false, assignedWorkStations: [] });
  const [consumablesDialog, setConsumablesDialog] = useState({ open: false, ids: [], data: null });
  const [arrangeView, setArrangeView] = useState(false);
  const [attachmentsDialog, setAttachmentsDialog] = useState({ open: false, workOrderId: null, uniqueServiceId: null, serviceName: null });
  const [openManagedPackageDialog, setOpenManagedPackageDialog] = useState({ open: false, ids: [] });

  const { generateColumns } = useColumns();

  useEffect(() => {
    setNextStep(false);
    checkAllWorkOrderComplete();
    fetchData();
  }, []);

  const autoCreateWorkOrder = async () => {
    try {
      setIsAutoCreating(true);
      await axiosInstance().post(`${routes.assemblyOrder.path}/work-order/${assemblyOrderData._id}`);
      setIsAutoCreating(false);
      fetchData();
    } catch (error) {
      setIsAutoCreating(false);
      toastConfig.setToastConfig(error);
    }
  };

  const checkAllWorkOrderComplete = async () => {
    const response = await axiosInstance().get(`${routes.assemblyOrder.path}/work-order/${assemblyOrderData._id}/check-all-work-order-complete`);
    if (!!response?.data?.data?.isCompletedAll) {
      setNextStep(true);
    }
    if (response?.data?.data?.materialCount) {
      autoCreateWorkOrder();
    }
  };

  useEffect(() => {
    fetchFields();
  }, [assemblyOrderData]);

  const fetchFields = async () => {
    const response = await fetch_child_resource_fields(CHILD_RESOURCE.assemblyOrderMaterial, assemblyOrderData?.currency || 'USD', false);
    var data = response?.filter((e) => !['detail', 'description']?.includes(e?.fieldName));
    const newColumns = generateColumns(renderedFrom, data, null, false, assemblyOrderData?.currency || 'USD');
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <h5 className="text-truncate">{row.original.index}</h5>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 100,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row.original['type'] ? <h5>{`${startCase(row.original?.type)} `}</h5> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: ' Details',
        minWidth: 200,
        width: 200,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row.original?.detail}</h5>
            <Box ml={1}>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.package) {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.service) {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </Box>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        show: false,
        Cell: ({ row }) => {
          return row.original['description'] ? <h5 className="text-truncate">{row.original.description}</h5> : <NoDataCell />;
        }
      },
      {
        accessor: 'workOrder',
        Header: 'Work Order',
        width: 200,
        Cell: ({ row }) =>
          row.original.workOrder ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row.original?.workOrderNumber}</h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes?.workOrderDetail?.path}/${row.original?.workOrderId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 200,
        show: false,
        Cell: ({ row }) => {
          return row.original['status'] ? <h5 className="text-truncate">{row.original.status}</h5> : <NoDataCell />;
        }
      }
    ];
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'assignedUsers',
      Header: 'Assigned Technician',
      width: 200,
      Cell: ({ row }) => (
        <div>
          {row?.original['assignedUsers'] && row?.original['assignedUsers']?.length ? (
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
          )}
        </div>
      )
    });
    if (permissions?.workStations) {
      coloum.push({
        accessor: 'assignedWorkStations',
        Header: 'Assigned Work Station',
        width: 200,
        Cell: ({ row }) => (
          <div>
            {row?.original['assignedWorkStations'] && row?.original['assignedWorkStations']?.length ? (
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
            )}
          </div>
        )
      });
    }
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      Cell: ({ row, table }) => {
        return (
          <>
            {checkParentProduct([row?.original], row?.original?.parentId, table.getRowModel().rows) && (
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
                  {row.original['workOrderStatus'] === WORK_ORDER_STATUS.completed ? (
                    <CheckCircle className="text-[var(--chip-color-completed)] [font-size:19px_!important] dark:text-green-400" />
                  ) : (
                    <AutoCompleteIcon size={18} />
                  )}
                </IconButton>
              </HtmlTooltip>
            )}

            {row?.original?.parentId && (
              <HtmlTooltip title="Delete">
                <span>
                  <IconButton
                    disabled={row?.original?.canDelete ? false : true}
                    size="small"
                    aria-label="Delete"
                    onClick={() => {
                      setDeleteData([row.original]);
                      setShowDeleteConfirmBox(true);
                    }}
                  >
                    <Delete fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
                  </IconButton>
                </span>
              </HtmlTooltip>
            )}
          </>
        );
      }
    });
    setColumns(coloum);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    setNextStep(false);

    const {
      data: { data }
    } = await axiosInstance().get(`${routes.assemblyOrder.path}/work-order/${assemblyOrderData._id}`);

    setMaterial(JSON.parse(JSON.stringify(data)));
    let rows = data?.filter((e) => e.parentId === null);

    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent.packageDetail?.packageName || '';
      parent.description = parent?.packageDetail?.packageDescription || '';
      parent.qtyDisplay = parent.qty;
      parent.canDelete = false;
      parent.subRows = generatedNestedProduct(data, parent);
    });

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generatedNestedProduct = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow.packageDetail?.packageName
            : '';
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow.packageDetail?.packageDescription
            : '';
      _subRow.qty = _subRow.qty;
      _subRow.workOrderId = _subRow?.workOrder?._id;
      _subRow.workOrderNumber = _subRow?.workOrder?.workOrderNumber;
      _subRow.status = _subRow?.workOrder?.status || '';
      if (_subRow?.workOrder?.status === WORK_ORDER_STATUS.new) {
        _subRow.canAutoCompleteWorkOrder = true;
      }
      if (_subRow?.workOrder?.status === WORK_ORDER_STATUS.completed) {
        _subRow.hideSelection = true;
        _subRow.workOrderStatus = WORK_ORDER_STATUS.completed;
      }
      _subRow.subRows = generateNestedData(material, _subRow);

      _subRow.canDelete = false;
      if (_subRow?.workOrder?.status !== WORK_ORDER_STATUS.completed) {
        _subRow.canDelete = _subRow.subRows.length === 0 ? true : false;
        if (_subRow.subRows?.length && _subRow.subRows?.find((e) => !e?.canDelete)) {
          _subRow.canDelete = false;
        }
      }
    });

    return subRows;
  };

  const generateNestedData = (material, parent) => {
    var subRows: any = material.filter((e) => e?.parentId === parent?._id);
    subRows = orderBy(subRows, ['type'], ['desc']);
    let productIndex = 0;
    let serviceIndex = 0;
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${_subRow.type === MATERIAL_TYPE.service ? alphabet[serviceIndex] : productIndex + 1}`;
      _subRow.detail = _subRow.detail
        ? _subRow.detail
        : _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceName
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow.productDetail?.productName
            : _subRow.packageDetail?.packageName;
      _subRow.description = _subRow.description
        ? _subRow.description
        : _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription
            : _subRow?.packageDetail?.packageDescription;
      _subRow.qty = _subRow.qty;
      _subRow.workOrder = parent?.workOrder;
      _subRow.workOrderId = parent?.workOrderId;
      _subRow.workOrderNumber = parent?.workOrderNumber;
      _subRow.hideSelection = false;
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.type === MATERIAL_TYPE.service ? serviceIndex++ : productIndex++;
      if (_subRow?.workOrder?.status === WORK_ORDER_STATUS.completed) {
        _subRow.hideSelection = true;
      }
      _subRow.canDelete = false;
      if (_subRow?.workOrder?.status !== WORK_ORDER_STATUS.completed) {
        if (_subRow.type === MATERIAL_TYPE.product) {
          _subRow.canDelete = _subRow?.consumedQty || _subRow?.requestedQty ? false : true;
        }
        if (_subRow.type === MATERIAL_TYPE.service) {
          _subRow.canDelete = _subRow?.status === WORKORDER_SERVICE_STATUS.pending ? true : false;
        }
        if (_subRow.type === MATERIAL_TYPE.package) {
          _subRow.canDelete = _subRow.subRows.length === 0 ? true : false;
        }
        if (_subRow.subRows?.length && _subRow.subRows?.find((e) => !e?.canDelete)) {
          _subRow.canDelete = false;
        }
      }
    });
    return subRows;
  };

  const handleDelete = async () => {
    setDeleting(true);
    if (
      deleteData?.some(
        (e) =>
          [MATERIAL_TYPE.service, MATERIAL_TYPE.package]?.includes(e.type) ||
          (MATERIAL_TYPE.product === e.type && e.parentId && material?.find((r) => r?._id === e?.parentId)?.parentId)
      )
    ) {
      const records: any = [];
      deleteData?.forEach((data) => {
        const index = records?.findIndex((d) => d?.workOrder === data?.workOrderId);
        if (index >= 0) {
          records[index].ids = [...records[index].ids, data?._id];
        } else {
          records.push({
            workOrder: data?.workOrderId,
            ids: [data?._id]
          });
        }
      });
      await axiosInstance().put(`${workOrder.api}/${assemblyOrderData?._id}/material/remove`, records);
      setDeleting(false);
      setShowDeleteConfirmBox(false);
      fetchData();
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Deleted Successfully'
      });
    } else {
      if (deleteData?.filter((e: any) => !e?.subRows?.length && e?.status !== WORK_ORDER_STATUS.completed)?.length) {
        handleDeleteWorkOrder(
          deleteData?.filter((e: any) => !e?.subRows?.length && e?.status !== WORK_ORDER_STATUS.completed)?.map((e) => e.workOrderId)
        );
      }
    }
  };

  const handleDeleteWorkOrder = (ids) => {
    axiosInstance()
      .put(`${workOrder.api}/remove`, { ids: ids })
      .then(({ data }) => {
        setDeleting(false);
        setShowDeleteConfirmBox(false);
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
        setShowDeleteConfirmBox(false);
        setDeleting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleAutoComplete = (ids) => {
    setCompleting(true);
    if (ids.length) {
      axiosInstance()
        .put(`${routes.assemblyOrder.path}/work-order/${assemblyOrderData._id}/auto-complete`, {
          workOrders: ids
        })
        .then(({ data }) => {
          setCompleting(false);
          setCompleteConfirmBox(false);
          fetchData();
          checkAllWorkOrderComplete();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
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

  const checkParentProduct = (selectedRecords, parentId = null, rows = []) => {
    if (parentId && rows?.length > 0) {
      return (
        [MATERIAL_TYPE.product, MATERIAL_TYPE.package].includes(selectedRecords[0]?.type) &&
        selectedRecords[0]?.parentId &&
        !rows?.find((r) => r?.original?._id === parentId)?.original?.parentId
      );
    } else if (parentId && rows?.length === 0) {
      return selectedRecords[0]?.type === MATERIAL_TYPE.product && !material?.find((m) => m?._id === parentId)?.parentId;
    }
    return selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.product && !material?.find((m) => m?._id === e?.parentId)?.parentId)?.length
      ? true
      : false;
  };

  const checkUniqWorkOrder = () => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (
      uniq(
        map(
          selectedRecords?.filter((r) => r?.workOrderId),
          'workOrderId'
        )
      ).length === 1
    ) {
      return true;
    } else {
      return false;
    }
  };

  const handleAddService = (ids) => {
    setIsSubmitting(true);
    const allWorkOrders = selectedRecords?.filter((r) => r?.workOrderId)?.map((e) => e.workOrderId);
    const data: any = {};
    data.serviceIds = ids;
    data.workOrderIds = [...new Set(allWorkOrders)];
    axiosInstance()
      .post(`${workOrder.api}/service`, data)
      .then(() => {
        setAddServicesDialog({ open: false, new: false });
        fetchData();
        setIsSubmitting(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setIsSubmitting(false);
      });
  };

  const handleAddConsumables = (rows, records = []) => {
    setIsSubmitting(true);
    const data: any = [];
    let workOrderId = '';
    const product = records?.find((s) => s.type === MATERIAL_TYPE.product);
    if (product) {
      workOrderId = product?.workOrderId;
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
      workOrderId = services[0]?.workOrderId;
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
        setIsSubmitting(false);
        setConsumablesDialog({ open: false, ids: [], data: null });
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
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
          type: 'success'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <>
      {isAutoCreating && (
        <Box p={1} display="flex" alignItems="center">
          <SyncIcon className="rotate" /> <Typography variant="subtitle2">Work order Auto Creation in Progress </Typography>
        </Box>
      )}
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={true}
        actionButtonMenuItems={
          <ActionButtonMenuItems
            {...{
              selectedRecords,
              allowedToEdit,
              permissions,
              user,
              checkUniqWorkOrder,
              setDeleteData,
              setShowDeleteConfirmBox,
              setAutoCompleteData,
              setCompleteConfirmBox,
              checkParentProduct,
              setAddServicesDialog,
              setUserAssignDialog,
              setWorkStationAssignDialog,
              dataRows,
              setConsumablesDialog,
              setArrangeView,
              setAttachmentsDialog
            }}
          />
        }
        actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
        hasXpadding
      />
      {columns ? (
        <>
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              setWholeRowsCellColor={(rowData) => (rowData.type === 'service' ? 'isService' : '')}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
              expander={true}
              isClientSideGrid={true}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

      {showDeleteConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isDeleting}
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete this item(s)`}
          onClose={() => {
            setShowDeleteConfirmBox(false);
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
          onOk={() => {
            let ids = [];
            let isPackage = false;
            if (autoCompleteData && autoCompleteData.length > 0) {
              autoCompleteData.forEach((d) => {
                if (d?.canAutoCompleteWorkOrder && d?.workOrderId) {
                  if (d?.type === MATERIAL_TYPE.package) isPackage = true;
                  if (!ids?.includes(d?.workOrderId)) ids.push(d?.workOrderId);
                }
              });
            }

            isPackage ? setOpenManagedPackageDialog({ open: true, ids: ids }) : handleAutoComplete(ids);
          }}
        />
      )}

      {openManagedPackageDialog.open && (
        <PackageNumberDialog
          onClose={() => {
            setOpenManagedPackageDialog({ open: false, ids: [] });
            setCompleteConfirmBox(false);
          }}
          assemblyOrderId={assemblyOrderData._id}
          workOrderIds={openManagedPackageDialog.ids}
          onSuccess={() => {
            setCompleteConfirmBox(false);
            handleAutoComplete(openManagedPackageDialog.ids);
            setOpenManagedPackageDialog({ open: false, ids: [] });
          }}
        />
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
          hideQty={true}
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
          open={userAssignDialog.open}
          warehouse={assemblyOrderData?.warehouse?.optionValue}
          workOrderData={selectedRecords
            .filter((e) => e.type === MATERIAL_TYPE.service)
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
          competencies={uniq(
            flatMap(selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.service)?.map((e) => e?.serviceDetail?.competencies || []))
          )}
        />
      )}

      {workStationAssignDialog.open && (
        <AssignWorkStationDialog
          warehouse={assemblyOrderData?.warehouse?.optionValue}
          workOrderData={selectedRecords
            .filter((e) => e.type === MATERIAL_TYPE.service)
            .map((d) => {
              return {
                uniqueId: d?.uniqueId,
                workOrderId: d?.workOrderId
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

      {consumablesDialog.open && (
        <AssignProductDialog
          handleCloseDialog={() => setConsumablesDialog({ open: false, ids: [], data: null })}
          ids={consumablesDialog.ids}
          onSuccess={(rows) => {
            handleAddConsumables(rows, consumablesDialog?.data ? consumablesDialog?.data : selectedRecords);
          }}
          serialized={false}
          isSubmitting={isSubmitting}
        />
      )}

      {arrangeView && (
        <ArrangeView
          data={
            flattenArray(dataRows)
              ?.filter((e) => e.type === MATERIAL_TYPE.service && e?.workOrderId === selectedRecords[0]?.workOrderId)
              ?.map((d) => {
                return { _id: d?.uniqueId, name: d?.serviceDetail?.serviceName, order: d?.order, preWork: d?.preWork };
              }) || []
          }
          title={'Arrange Services'}
          handleClose={() => setArrangeView(false)}
          handleSubmit={(data) => handleArrangeUpdate(data, selectedRecords[0]?.workOrderId)}
          loading={false}
        />
      )}

      {attachmentsDialog.open && (
        <AttachmentDialog
          workOrderId={attachmentsDialog.workOrderId}
          uniqueServiceId={attachmentsDialog.uniqueServiceId}
          stepId={null}
          stepName={attachmentsDialog.serviceName}
          serviceName={attachmentsDialog.serviceName}
          handleClose={() => {
            setAttachmentsDialog({
              open: false,
              workOrderId: null,
              uniqueServiceId: null,
              serviceName: null
            });
          }}
          handleSuccess={() => {
            fetchData();
            setAttachmentsDialog({
              open: false,
              workOrderId: null,
              uniqueServiceId: null,
              serviceName: null
            });
          }}
        />
      )}
    </>
  );
};

export default WorkOrder;

const ActionButtonMenuItems = ({
  selectedRecords,
  allowedToEdit,
  permissions,
  user,
  checkUniqWorkOrder,
  setDeleteData,
  setShowDeleteConfirmBox,
  setAutoCompleteData,
  setCompleteConfirmBox,
  checkParentProduct,
  setAddServicesDialog,
  setUserAssignDialog,
  setWorkStationAssignDialog,
  dataRows,
  setConsumablesDialog,
  setArrangeView,
  setAttachmentsDialog
}) => {
  return (
    <>
      <MenuItem
        disabled={!checkParentProduct(selectedRecords)}
        onClick={() => {
          setAddServicesDialog({ open: true, new: false });
        }}
      >
        Add Existing Services
      </MenuItem>
      <MenuItem
        disabled={!checkParentProduct(selectedRecords)}
        onClick={() => {
          setAddServicesDialog({ open: true, new: true });
        }}
      >
        Add New Service
      </MenuItem>
      <MenuItem
        disabled={selectedRecords?.filter((d) => d.type === MATERIAL_TYPE.service)?.length ? false : true}
        onClick={() => {
          const uniqueAssignedUsers: any = flatMap(
            selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.service)?.map((e) => e?.assignedUsers || [])
          );
          const assignedUsers = [];
          uniqueAssignedUsers?.forEach((e: any) => {
            if (!assignedUsers?.find((ele) => ele.optionValue === e.optionValue)) {
              assignedUsers.push(e);
            }
          });
          setUserAssignDialog({ open: true, assignedUsers: assignedUsers });
        }}
      >
        Assign Technician
      </MenuItem>
      {allowedToEdit && permissions?.workStations?.isRead && (
        <MenuItem
          disabled={selectedRecords?.filter((d) => d.type === MATERIAL_TYPE.service)?.length > 0 ? false : true}
          onClick={() => {
            const uniqueAssignedWorkStations: any = flatMap(
              selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.service)?.map((e) => e?.assignedWorkStations || [])
            );
            const assignedWorkStations = [];
            uniqueAssignedWorkStations?.forEach((e: any) => {
              if (!assignedWorkStations?.find((ele) => ele.optionValue === e.optionValue)) {
                assignedWorkStations.push(e);
              }
            });
            setWorkStationAssignDialog({ open: true, assignedWorkStations: assignedWorkStations });
          }}
        >
          Assign Work Station
        </MenuItem>
      )}
      {!user?.user?.brandPolicy?.workOrderConsumableHide && (
        <MenuItem
          disabled={
            selectedRecords?.filter((d) => [MATERIAL_TYPE.product, MATERIAL_TYPE.service]?.includes(d.type))?.length > 0 && checkUniqWorkOrder()
              ? false
              : true
          }
          onClick={() => {
            var ids = [];
            if (selectedRecords?.find((e) => e.type === MATERIAL_TYPE.product)) {
              const product = selectedRecords?.find((e) => e.type === MATERIAL_TYPE.product);
              ids = flattenArray(dataRows)
                ?.filter((e) => e?.workOrderId === product?.workOrderId)
                ?.map((e) => e.materialId);
            } else {
              const serviceIds = selectedRecords?.filter((d) => d?.type === MATERIAL_TYPE.service)?.map((e) => e._id);
              ids = flattenArray(dataRows)
                ?.filter((e) => serviceIds?.includes(e?.parentId))
                ?.map((e) => e.materialId);
            }
            setConsumablesDialog({ open: true, ids: ids, data: null });
          }}
        >
          Add Products/Consumables
        </MenuItem>
      )}
      <MenuItem
        onClick={() => {
          setArrangeView(true);
        }}
        disabled={
          selectedRecords?.length &&
          selectedRecords?.find((d) => d.type === MATERIAL_TYPE.service || checkParentProduct([d], d?.parentId)) &&
          selectedRecords?.every((d) => d.workOrderId === selectedRecords[0]?.workOrderId)
            ? false
            : true
        }
      >
        Arrange Services
      </MenuItem>
      <MenuItem
        onClick={() => {
          setAutoCompleteData(selectedRecords);
          setCompleteConfirmBox(true);
        }}
        disabled={selectedRecords.some((e) => e?.canAutoCompleteWorkOrder) ? false : true}
      >
        Auto Complete Work Order(s)
      </MenuItem>
      <MenuItem
        disabled={
          checkUniqWorkOrder() &&
          (selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.service)?.length === 1 ||
            selectedRecords?.filter((e) => checkParentProduct([e], e?.parentId))?.length === 1)
            ? false
            : true
        }
        onClick={() => {
          const parentProduct = selectedRecords?.find((e) => checkParentProduct([e], e?.parentId));
          if (parentProduct) {
            setAttachmentsDialog({
              open: true,
              workOrderId: parentProduct?.workOrderId,
              uniqueServiceId: null,
              serviceName: parentProduct?.workOrderNumber
            });
          } else {
            const service = selectedRecords?.find((e) => e.type === MATERIAL_TYPE.service);
            setAttachmentsDialog({
              open: true,
              workOrderId: service?.workOrderId,
              uniqueServiceId: service?.uniqueId,
              serviceName: service?.serviceDetail?.serviceName
            });
          }
        }}
      >
        Upload Documents
      </MenuItem>
      <MenuItem
        onClick={() => {
          setDeleteData(selectedRecords?.filter((e) => e?.canDelete));
          setShowDeleteConfirmBox(true);
        }}
        disabled={selectedRecords?.some((e) => e?.canDelete) ? false : true}
      >
        Delete
      </MenuItem>
    </>
  );
};
