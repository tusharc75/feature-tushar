import { Box, IconButton } from '@mui/material';
import { Info } from '@mui/icons-material';
import axios, { CancelTokenSource } from 'axios';
import { uniqBy } from 'lodash';
import React, { Dispatch, useContext, useEffect, useImperativeHandle, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { gridFilterParser, TActios, TInitialState, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import {
  displayDate,
  gridLoadingTimeout,
  MATERIAL_SUB_TYPE,
  prepareDataForGrid,
  REPAIR_ORDER_TYPE,
  sidebarResource,
  workOrder,
  WORKORDER_SERVICE_STATUS,
  workOrderSupervisor
} from 'src/constants/helpers';
import AssignUserDialog from 'src/pages/WorkOrder/Service/AssignUserDialog';
import AssignWorkStationDialog from 'src/pages/WorkOrder/Service/AssignWorkStationDialog';
import WorkOrderDetailDialog from 'src/pages/WorkOrderSupervisor/WorkOrderDetailDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { queryStringPlanned } from 'src/pages/WorkOrderSupervisor/helper';

type Props = {
  filterQuery: any;
  status: string;
  renderedFrom: string;
  state: TInitialState;
  dispatch: Dispatch<TActios>;
  consumablesDialog: boolean;
  setConsumablesDialog: (value: boolean) => void;
  repairOrderDialog: boolean;
  setRepairOrderDialog: (value: boolean) => void;
  tableHead?: React.ReactNode;
};

export type WorkOrderListRef = {
  refreshGrid: () => void;
  handleAddConsumables: (rows: any, records: any[]) => void;
  handleAddAssets: (row: any, records: any[]) => void;
  submitting: boolean;
  setAssignTechnicianDialog: (value: boolean) => void;
  setWorkStationAssignDialog: (value: boolean) => void;
};

const WorkOrderList = React.forwardRef<WorkOrderListRef, Props>(
  ({ filterQuery, status, renderedFrom, state, dispatch, consumablesDialog, setConsumablesDialog, setRepairOrderDialog, tableHead = null }, ref) => {
    const toastConfig = useContext(CustomToastContext);
    const {
      state: { user, permissions, resources }
    }: any = useData();

    const { page, limit, sorting, selectedRecords, filters } = state;

    const { generateColumns } = useColumns();

    const [allColumns, setAllColumns] = useState(null);
    const [columns, setColumns] = useState(null);
    const [serviceOpen, setServiceOpen] = useState({ open: false, id: null });
    const [assignTechnicianDialog, setAssignTechnicianDialog] = useState(false);
    const [workStationAssignDialog, setWorkStationAssignDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => {
      const cancelToken = axios.CancelToken.source();
      fetchGridColumns(cancelToken);
      return () => cancelToken.cancel();
    }, []);

    useEffect(() => {
      const cancelToken = axios.CancelToken.source();
      if (status) {
        fetchData(cancelToken);
      }
      return () => cancelToken.cancel();
    }, [page, limit, sorting, status, filterQuery, filters]);

    const createColumns = (newColumns) => {
      if (newColumns && newColumns?.length) {
        setColumns(null);
        const serializedAssetColumn = {
          accessor: 'serializedAsset',
          Header: resources?.serializedAsset?.titleSingular,
          Cell: ({ row }) =>
            row?.original['serializedAsset'] ? (
              <div className="flex items-center gap-1">
                <h5 className=" text-truncate">{row.original.serializedAsset}</h5>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes?.serializedAssetDetail?.path}/${row.original.serializedAssetId}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </div>
            ) : (
              <NoDataCell />
            )
        };

        const extraColumns = [
          ...(status === WORKORDER_SERVICE_STATUS.planned
            ? [serializedAssetColumn]
            : [
              {
                accessor: 'workOrderNumber',
                Header: 'Work Order Number',
                Cell: ({ row }) =>
                  row?.original?.workOrderNumber && row.original.workOrder ? (
                    <div>
                      <h5
                        className="link text-truncate"
                        onClick={() => {
                          setServiceOpen({ open: true, id: row?.original?.workOrder });
                        }}
                      >
                        {row.original.workOrderNumber}
                      </h5>
                      <IconButton
                        size="small"
                        onClick={() => {
                          window.open(`${routes?.workOrderDetail?.path}/${row.original.workOrder}`);
                        }}
                      >
                        <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                      </IconButton>
                      <Box ml={1}>
                        {row?.original?.canPerformInfo ? (
                          <HtmlTooltip title={row?.original?.canPerformInfo} arrow placement="top" enterTouchDelay={0}>
                            <Info className="text-red-500 [font-size:20px_!important]" />
                          </HtmlTooltip>
                        ) : null}
                      </Box>
                    </div>
                  ) : (
                    <NoDataCell />
                  )
              }
            ]),
          {
            accessor: 'service',
            Header: 'Service',
            disableFilters: true,
            disableSortBy: true,
            Cell: ({ row }) =>
              row.original['service'] && row.original.serviceId ? (
                <div className="flex items-center gap-1">
                  <h5 className="text-truncate">{row.original.service}</h5>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes?.serviceMasterDetail?.path}/${row.original.serviceId}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              ) : (
                <NoDataCell />
              )
          },
          ...(status === WORKORDER_SERVICE_STATUS.planned
            ? [
              {
                accessor: 'product',
                Header: resources?.product?.titleSingular,
                disableFilters: true,
                disableSortBy: true,
                Cell: ({ row }) =>
                  row.original['product'] && row.original.productId ? (
                    <div className="flex items-center gap-1">
                      <h5 className="text-truncate">{row.original.product}</h5>
                      <IconButton
                        size="small"
                        onClick={() => {
                          window.open(`${routes?.productDetail?.path}/${row.original.productId}`);
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
                accessor: 'dueDate',
                Header: 'Due Date',
                disableFilters: true,
                disableSortBy: true,
                Cell: ({ row }) =>
                  row.original['dueDate'] ? <h5 className="text-truncate">{displayDate(row.original.dueDate)}</h5> : <NoDataCell />
              }
            ]
            : []),

          {
            accessor: 'assignedWorkStations',
            Header: 'Work Stations',
            disableFilters: true,
            disableSortBy: true,
            Cell: ({ row }) =>
              row.original['assignedWorkStations'] ? (
                <DropdownCell
                  permissions={permissions}
                  permissionForLinks={{}}
                  field={{
                    fieldName: 'assignedWorkStations',
                    lookupResource: sidebarResource.workStations
                  }}
                  original={row?.original}
                />
              ) : (
                <NoDataCell />
              )
          },
          {
            accessor: 'assignedUsers',
            Header: 'Technician',
            disableFilters: true,
            disableSortBy: true,
            Cell: ({ row }) =>
              row?.original['assignedUsers'] ? (
                <DropdownCell
                  permissions={permissions}
                  permissionForLinks={{}}
                  field={{
                    fieldName: 'assignedUsers',
                    lookupResource: sidebarResource.user
                  }}
                  original={row?.original}
                />
              ) : (
                <NoDataCell />
              )
          },
          ...(status === WORKORDER_SERVICE_STATUS.planned
            ? []
            : [
              {
                accessor: 'rentalJob',
                Header: resources?.rentalManagement?.titleSingular,
                Cell: ({ row }) =>
                  row?.original['rentalJob'] ? (
                    <div className="flex items-center gap-1">
                      <h5 className=" text-truncate">{row.original.rentalJob}</h5>
                      <IconButton
                        size="small"
                        onClick={() => {
                          window.open(`${routes?.rentalManagementDetail?.path}/${row.original.rentalJobId}`);
                        }}
                      >
                        <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                      </IconButton>
                    </div>
                  ) : (
                    <NoDataCell />
                  )
              },
              serializedAssetColumn
            ])
        ];
        const finalColumns = [
          ...extraColumns.slice(0, 2),
          ...(status === WORKORDER_SERVICE_STATUS.planned
            ? newColumns?.filter((c) => ['status', 'repairOrder', 'warehouse']?.includes(c?.accessor))
            : newColumns),
          ...extraColumns.slice(2)
        ];
        setColumns(finalColumns);
      }
    };

    const fetchGridColumns = async (cancelToken?: CancelTokenSource) => {
      let data;
      const response = await axiosInstance().get(`/field?resource=${sidebarResource['workOrder']}&view=true`, { cancelToken: cancelToken?.token });
      data = response?.data?.data?.filter((f) =>
        ['spoolNumber', 'status', 'competencies', 'productionOrder', 'repairOrder', 'expectedCompletionDate', 'warehouse', 'type']?.includes(
          f?.fieldData?.fieldName
        )
      );
      const newColumns = generateColumns(renderedFrom, data, routes?.workOrderDetail.path);

      newColumns?.forEach((c) => {
        if (c?.accessor === 'status') {
          c.disableFilters = true;
          c.disableSortBy = true;
        }
      });
      setColumns([]);
      setAllColumns(newColumns);
      createColumns(newColumns);
    };

    useEffect(() => {
      createColumns(allColumns);
    }, [status]);

    const fetchData = (cancelToken?: CancelTokenSource) => {
      dispatch({ type: 'selection', selectedRecords: [] });
      dispatch({ type: 'loading', loading: true });
      const queryString = getQueryString();
      let api = `${workOrderSupervisor.api}/work-order-service${queryString}`;
      if (status === WORKORDER_SERVICE_STATUS.planned) {
        api = `${workOrder.api}/work-order-planning${queryString}`;
      }
      axiosInstance()
        .get(api, { cancelToken: cancelToken?.token })
        .then(({ data: { data, count } }) => {
          let rows: any = [];
          let countC = count;
          if (status === WORKORDER_SERVICE_STATUS.planned) {
            const { data: dataD, count } = data;
            countC = count;
            rows = dataD?.map((u) => {
              let finalObject: any = prepareDataForGrid(u, user);
              finalObject['serializedAsset'] = u?.asset?.assetNumber || '';
              finalObject['serializedAssetId'] = u?.asset?._id || '';
              finalObject['warehouse'] = u?.asset?.warehouse || '';
              finalObject['warehouseId'] = u?.asset?.warehouseId || '';
              finalObject['assetStatus'] = u?.asset?.status;
              finalObject['currentOwnerType'] = u?.asset?.currentOwnerType;
              finalObject['ownerType'] = u?.asset?.ownerType;
              return finalObject;
            });
          } else {
            rows = data.map((u) => {
              let finalObject: any = prepareDataForGrid(u, user);
              const type = u?.repairOrder
                ? sidebarResource.repairOrder
                : u?.productionOrder
                  ? sidebarResource.productionOrder
                  : u?.assemblyOrder
                    ? sidebarResource.assemblyOrder
                    : '';

              finalObject.type = type;
              return finalObject;
            });
          }
          dispatch({ type: 'initialize', data: rows, count: countC });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        })
        .finally(() => {
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
        });
    };

    const getQueryString = () => {
      let deepFilter = `?page=${page}&limit=${limit}`;

      if (status === WORKORDER_SERVICE_STATUS.planned) {
        const filterByIds = queryStringPlanned(filterQuery);
        if (filterByIds?.length) {
          deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
        }
      } else {
        deepFilter = `${deepFilter}&status=${status}${filterQuery}`;
      }
      const { deepFilters } = gridFilterParser(filters);

      if (status === WORKORDER_SERVICE_STATUS.planned) {
        deepFilters.push({
          field: 'status',
          term: WORKORDER_SERVICE_STATUS.pending
        });
      }

      if (deepFilters?.length) {
        deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
      }
      if (deepFilters?.length || filterQuery) {
        deepFilter = `${deepFilter}&filterType=and`;
      }

      return `${deepFilter}`;
    };

    const handleAddConsumables = (rows, records = []) => {
      setSubmitting(true);
      const data: any = [];
      const workOrderId: any = uniqBy(records, 'workOrder').map((record) => record.workOrder);

      records?.forEach((s) => {
        rows?.forEach((e) => {
          data.push({
            product: e._id,
            qty: parseInt(e.qty) || 1,
            service: s?.serviceId,
            subType: MATERIAL_SUB_TYPE.consumable,
            uniqueId: s?.uniqueId,
            stepId: null,
            parentId: s?.uniqueId,
          });
        });
      });

      setSubmitting(false);
      axiosInstance()
        .post(`${workOrder.api}/id/consumable/add-multiple`, { products: data, workOrder: workOrderId })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          fetchData();
          setSubmitting(false);
          setConsumablesDialog(false);
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    };

    const handleAddAssets = async (row, records) => {
      axiosInstance()
        .post(`${workOrder.api}/work-order-planning/material`, {
          repairOrderId: row?._id,
          _ids: records?.map((e) => e?._id)
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          fetchData();
          setRepairOrderDialog(false);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    };

    useImperativeHandle(ref, () => ({
      refreshGrid() {
        fetchData();
      },
      handleAddConsumables(rows, records = []) {
        handleAddConsumables(rows, records);
      },
      handleAddAssets(row, records = []) {
        handleAddAssets(row, records);
      },
      submitting,
      setAssignTechnicianDialog,
      setWorkStationAssignDialog
    }));

    return (
      <>
        <div className="[&_.table-container-v1>div]:mt-0">
          {columns ? (
            <CustomReactTable
              topLeftSlot={tableHead}
              height={'calc(100vh - 300px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </div>
        {serviceOpen.open && (
          <WorkOrderDetailDialog
            workOrderId={serviceOpen?.id}
            handleClose={() => {
              setServiceOpen({ open: false, id: null });
            }}
          />
        )}
        {assignTechnicianDialog && (
          <AssignUserDialog
            warehouse={selectedRecords[0]?.warehouseId}
            workOrderData={selectedRecords?.map((r) => ({ uniqueId: r?.uniqueId, workOrderId: r?.workOrder }))}
            assignedUsers={
              selectedRecords?.length === 1 && selectedRecords[0]?.assignedUsers && selectedRecords[0]?.assignedUsersId
                ? [{ optionLabel: selectedRecords[0]?.assignedUsers, optionValue: selectedRecords[0]?.assignedUsersId }]
                : []
            }
            reference={'service'}
            handleClose={() => {
              setAssignTechnicianDialog(false);
            }}
            handleSucess={() => {
              setAssignTechnicianDialog(false);
              fetchData();
            }}
            competencies={selectedRecords[0]?.competencies}
          />
        )}
        {workStationAssignDialog && (
          <AssignWorkStationDialog
            warehouse={selectedRecords[0]?.warehouseId}
            workOrderData={selectedRecords?.map((r) => ({ uniqueId: r?.uniqueId, workOrderId: r?.workOrder }))}
            workStations={
              selectedRecords?.length === 1 && selectedRecords[0]?.assignedWorkStations && selectedRecords[0]?.assignedWorkStationsId
                ? [{ optionLabel: selectedRecords[0]?.assignedWorkStations, optionValue: selectedRecords[0]?.assignedWorkStationsId }]
                : []
            }
            handleClose={() => {
              setWorkStationAssignDialog(false);
            }}
            handleSucess={() => {
              setWorkStationAssignDialog(false);
              fetchData();
            }}
          />
        )}
      </>
    );
  }
);

export default WorkOrderList;
