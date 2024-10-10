import { Box, IconButton, MenuItem, Typography } from '@material-ui/core';
import { CheckCircle, Delete } from '@material-ui/icons';
import { startCase } from 'lodash';
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
import { CHILD_RESOURCE, MATERIAL_SUB_TYPE, MATERIAL_TYPE, WORK_ORDER_STATUS, workOrder } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import SyncIcon from '@material-ui/icons/Sync';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { AutoCompleteIcon } from 'src/assets/svg/svgIcons';

const WorkOrder = ({ renderedFrom, assemblyOrderData, setNextStep, stepFullScreen, allowedToEdit, setCurrentStep }) => {
  const {
    state: { user, permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [material, setMaterial] = useState([]);
  const [autoCompleteData, setAutoCompleteData] = useState(null);
  const [completeConfirmBox, setCompleteConfirmBox] = useState(false);
  const [isCompleting, setCompleting] = useState(false);

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
                  window.open(`${routes.workOrderDetail.path}/${row.original?.workOrderId}`);
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
        accessor: 'workOrderStatus',
        Header: 'Status',
        width: 200,
        show: false,
        Cell: ({ row }) => {
          return row.original['workOrderStatus'] ? <h5 className="text-truncate">{row.original.workOrderStatus}</h5> : <NoDataCell />;
        }
      }
    ];
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      Cell: ({ row }) => {
        return (
          <>
            {row?.original?.type === MATERIAL_TYPE.product && !row?.original?.subType && (
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
                  {row.original['workOrderStatus'] === 'Completed' ? (
                    <CheckCircle className="text-[var(--chip-color-completed)] [font-size:19px_!important] dark:text-green-400" />
                  ) : (
                    <AutoCompleteIcon size={18} />
                  )}
                </IconButton>
              </HtmlTooltip>
            )}

            {row?.original?.type != MATERIAL_TYPE.package && (
              <HtmlTooltip title="Delete">
                <span>
                  <IconButton
                    disabled={row?.original?.canDelete ? false : true}
                    size="small"
                    aria-label="Delete"
                    onClick={() => {
                      setDeleteData([row.original]);
                      setShowConfirmBox(true);
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
      parent.subRows = generateNestedData(data, parent);
    });

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail = _subRow.type === MATERIAL_TYPE.product ? _subRow.productDetail?.productName : '';
      _subRow.description = _subRow.type === MATERIAL_TYPE.product ? _subRow?.productDetail?.productDescription : '';
      _subRow.qty = _subRow.qty;
      _subRow.workOrderId = _subRow.subType === MATERIAL_SUB_TYPE.bom ? parent?.workOrderId : _subRow?.workOrder?._id;
      _subRow.workOrderNumber = parent?.type === MATERIAL_SUB_TYPE.bom ? parent?.workOrderNumber : _subRow?.workOrder?.workOrderNumber;
      _subRow.workOrderStatus = _subRow?.workOrder?.status || '';
      if (_subRow?.workOrder?.status === WORK_ORDER_STATUS.new) {
        _subRow.canAutoCompleteWorkOrder = true;
      }
      _subRow.subRows = generateNestedData(material, _subRow);

      _subRow.canDelete = false;
      if (_subRow?.status !== WORK_ORDER_STATUS.completed) {
        if (_subRow.type === MATERIAL_TYPE.product) {
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
        (d) =>
          d?.type === MATERIAL_TYPE.product &&
          d?.subType === MATERIAL_SUB_TYPE.bom &&
          material?.find((r) => r?._id === d?.parentId)?.type === MATERIAL_TYPE.product
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
      setShowConfirmBox(false);
      fetchData();
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Deleted Successfully'
      });
    } else {
      if (deleteData?.filter((e: any) => !e?.subRows?.length && e?.workOrderStatus !== WORK_ORDER_STATUS.completed)?.length) {
        handleDeleteWorkOrder(
          deleteData?.filter((e: any) => !e?.subRows?.length && e?.workOrderStatus !== WORK_ORDER_STATUS.completed)?.map((e) => e.workOrderId)
        );
      }
    }
  };

  const handleDeleteWorkOrder = (ids) => {
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

  const handleAutoComplete = () => {
    let ids = [];
    if (autoCompleteData && autoCompleteData.length > 0) {
      autoCompleteData.forEach((d) => {
        if (d?.canAutoCompleteWorkOrder && d?.workOrderId) {
          if (!ids?.includes(d?.workOrderId)) ids.push(d?.workOrderId);
        }
      });
    }
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
              setDeleteData,
              setShowConfirmBox,
              setAutoCompleteData,
              setCompleteConfirmBox
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
    </>
  );
};

export default WorkOrder;

const ActionButtonMenuItems = ({ selectedRecords, setDeleteData, setShowConfirmBox, setAutoCompleteData, setCompleteConfirmBox }) => {
  return (
    <>
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
        onClick={() => {
          setDeleteData(selectedRecords?.filter((e) => e?.canDelete));
          setShowConfirmBox(true);
        }}
        disabled={selectedRecords?.some((e) => e?.canDelete) ? false : true}
      >
        Delete
      </MenuItem>
    </>
  );
};
