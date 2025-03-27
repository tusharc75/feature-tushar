import { Info } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import { isEqual, uniqBy } from 'lodash';
import React, { Dispatch, useContext, useEffect, useImperativeHandle, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { gridFilterParser, TActios, TInitialState, useColumns } from 'src/components/CustomReactTable';
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
  sidebarResource,
  workOrder,
  WORKORDER_SERVICE_STATUS,
  workOrderSupervisor
} from 'src/constants/helpers';
import AssignTechniciansDialog from 'src/pages/WorkOrder/Service/AssignTechniciansDialog';
import AssignWorkStationDialog from 'src/pages/WorkOrder/Service/AssignWorkStationDialog';
import { queryStringPlanned } from 'src/pages/WorkOrderSupervisor/helper';
import WorkOrderDetailDialog from 'src/pages/WorkOrderSupervisor/WorkOrderDetailDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

type Props = {
  filterQuery: any;
  status: string;
  renderedFrom: string;
  state: TInitialState;
  selectedResource: string;
  dispatch: Dispatch<TActios>;
  consumablesDialog: boolean;
  setConsumablesDialog: (value: any) => void;
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
  (
    {
      filterQuery,
      status,
      selectedResource,
      renderedFrom,
      state,
      dispatch,
      consumablesDialog,
      setConsumablesDialog,
      setRepairOrderDialog,
      tableHead = null
    },
    ref
  ) => {
    const toastConfig = useContext(CustomToastContext);
    const {
      state: { user, permissions, resources }
    }: any = useData();

    const { page, limit, sorting, selectedRecords, filters } = state;

    const { generateColumns } = useColumns();

    const [workOrderColumns, setWorkOrderColumns] = useState(null);
    const [columns, setColumns] = useState(null);
    const [serviceOpen, setServiceOpen] = useState({ open: false, id: null });
    const [assignTechnicianDialog, setAssignTechnicianDialog] = useState(false);
    const [workStationAssignDialog, setWorkStationAssignDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      const cancelToken = axios.CancelToken.source();
      fetchWorkOrderColumns(cancelToken);
      return () => cancelToken.cancel();
    }, []);

    useEffect(() => {
      const cancelToken = axios.CancelToken.source();
      if (status) {
        fetchData(cancelToken);
      }
      return () => cancelToken.cancel();
    }, [page, limit, sorting, status, filterQuery, filters]);

    const fetchWorkOrderColumns = async (cancelToken?: CancelTokenSource) => {
      let data;
      const response = await axiosInstance().get(`/field?resource=${sidebarResource['workOrder']}&view=true`, { cancelToken: cancelToken?.token });
      data = response?.data?.data?.filter(
        (f) =>
          !['workOrderNumber', 'type', 'status', 'serviceProcessStatus', 'pdfTemplate', 'owner', 'collaborator']?.includes(f?.fieldData?.fieldName)
      );
      const newColumns = generateColumns(renderedFrom, data, routes?.workOrderDetail.path);

      const fixedInitialColumns = [
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
        },
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
        {
          accessor: 'status',
          Header: 'Status',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) =>
            row.original['status'] ? (
              <div className="flex items-center gap-1">
                <h5 className="text-truncate">{row.original.status}</h5>
              </div>
            ) : (
              <NoDataCell />
            )
        }
      ];

      setWorkOrderColumns([...fixedInitialColumns, ...newColumns]);
    };

    const fetchResourceColumns = async () => {
      let data;
      const response = await axiosInstance().get(`/field?resource=${selectedResource}&view=true`);
      data = response?.data?.data?.filter((f) => ['customerAccount', 'rentalJob']?.includes(f?.fieldData?.fieldName));
      const newColumns = generateColumns(renderedFrom, data);
      const extraColumns = [
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
        }
      ];
      setColumns([...workOrderColumns, ...newColumns, ...extraColumns]);
    };

    useEffect(() => {
      if (selectedResource && workOrderColumns?.length) {
        fetchResourceColumns();
      }
    }, [selectedResource, workOrderColumns]);

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
              const resource =
                selectedResource === sidebarResource?.repairOrder
                  ? 'repairOrder'
                  : selectedResource === sidebarResource?.productionOrder
                    ? 'productionOrder'
                    : selectedResource === sidebarResource?.assemblyOrder
                      ? 'assemblyOrder'
                      : '';

              const workOrderData = {
                ...u?.workOrderDetail,
                workOrder: u?.workOrderDetail?._id
              };
              delete workOrderData?.status;
              delete workOrderData?.type;
              delete workOrderData?.serviceProcessStatus;
              delete workOrderData?.pdfTemplate;
              delete workOrderData?.owner;
              delete workOrderData?.collaborator;
              delete workOrderData?._id;

              const resourceData = { customerAccount: u?.[resource]?.customerAccount, rentalJob: u?.[resource]?.rentalJob || {} };

              delete u?.workOrderDetail;
              delete u?.[resource];
              const finalObject: any = prepareDataForGrid({ ...u, ...workOrderData, ...resourceData }, user);

              finalObject.assignedUsers = u?.assignedUsers;
              finalObject.assignedWorkStations = u?.assignedWorkStations;

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
      let deepFilter = `?page=${page}&limit=${limit}&resource=${selectedResource}`;

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
            parentId: s?.uniqueId
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
          setConsumablesDialog({ open: false, multiple: false });
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

    const getColumns = (columns) => {
      if (status === WORKORDER_SERVICE_STATUS.planned) {
        const newColumn = columns?.filter((c) =>
          ['service', 'warehouse', 'repairOrder', 'status', 'product', 'assignedWorkStations', 'assignedUsers']?.includes(c?.accessor)
        );
        newColumn?.unshift({
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
        });
        newColumn.splice(6, 0, {
          accessor: 'dueDate',
          Header: 'Due Date',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) => (row.original['dueDate'] ? <h5 className="text-truncate">{displayDate(row.original.dueDate)}</h5> : <NoDataCell />)
        });

        return newColumn;
      }
      if (selectedResource === sidebarResource.repairOrder) {
        return columns?.filter((c) => !['productionOrder', 'assemblyOrder']?.includes(c?.accessor));
      }
      if (selectedResource === sidebarResource.productionOrder) {
        return columns?.filter((c) => !['repairOrder', 'assemblyOrder', 'serializedAsset', 'rentalJob']?.includes(c?.accessor));
      }
      if (selectedResource === sidebarResource.assemblyOrder) {
        return columns?.filter((c) => !['productionOrder', 'repairOrder', 'serializedAsset', 'rentalJob']?.includes(c?.accessor));
      }
      return columns;
    };

    return (
      <>
        <div className="[&_.table-container-v1>div]:mt-0">
          {columns ? (
            <CustomReactTable
              topLeftSlot={tableHead}
              height={'calc(100vh - 280px)'}
              columns={getColumns(columns)}
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
          <AssignTechniciansDialog
            warehouse={selectedRecords[0]?.warehouseId}
            workOrderData={selectedRecords?.map((r) => ({ uniqueId: r?.uniqueId, workOrderId: r?.workOrder }))}
            assignedUsers={
              selectedRecords?.length === 1 || selectedRecords?.every((val) => isEqual(val?.assignedUsers, selectedRecords[0]?.assignedUsers))
                ? selectedRecords[0]?.assignedUsers
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
              selectedRecords?.length === 1 ||
              selectedRecords?.every((val) => isEqual(val?.assignedWorkStations, selectedRecords[0]?.assignedWorkStations))
                ? selectedRecords[0]?.assignedWorkStations
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
