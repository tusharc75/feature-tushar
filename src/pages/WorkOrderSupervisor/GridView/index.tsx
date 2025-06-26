import { Info } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import { camelCase, isEqual, uniqBy } from 'lodash';
import React, { Dispatch, useCallback, useContext, useEffect, useImperativeHandle, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { TActios, TInitialState } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import {
  displayDate,
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
  columns: any[];
};

export type GridViewRef = {
  refreshGrid: () => void;
  handleAddConsumables: (rows: any, records: any[]) => void;
  handleAddAssets: (row: any, records: any[]) => void;
  submitting: boolean;
  setAssignTechnicianDialog: (value: boolean) => void;
  setWorkStationAssignDialog: (value: boolean) => void;
};

const GridView = React.forwardRef<GridViewRef, Props>(
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
      tableHead = null,
      columns = [],
    },
    ref
  ) => {
    const toastConfig = useContext(CustomToastContext);
    const {
      state: { user, resources }
    }: any = useData();

    const { page, limit, sorting, selectedRecords, filters } = state;

    const [serviceOpen, setServiceOpen] = useState({ open: false, id: null });
    const [assignTechnicianDialog, setAssignTechnicianDialog] = useState(false);
    const [workStationAssignDialog, setWorkStationAssignDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      const cancelToken = axios.CancelToken.source();
      if (status) {
        fetchData({ status, page, filterQuery, limit, cancelToken });
      }
      return () => cancelToken.cancel();
    }, [page, limit, sorting, status, filterQuery, filters, selectedResource]);

    const fetchData = useCallback(async ({
      status,
      page = 0,
      filterQuery = '',
      limit,
      cancelToken
    }: {
      status: string;
      page?: number;
      filterQuery?: string;
      limit: number;
      cancelToken?: CancelTokenSource
    }) => {
      dispatch({ type: 'selection', selectedRecords: [] });
      dispatch({ type: 'loading', loading: true });
      let api = `${workOrderSupervisor.api}/work-order-service?page=${page}&status=${status}&limit=${limit}&resource=${selectedResource}${filterQuery}`;

      if (status === WORKORDER_SERVICE_STATUS.planned) {
        const filterByIds = queryStringPlanned(filterQuery);
        api = `${workOrder.api}/work-order-planning?page=${page}&limit=${limit}&deepFilter=${encodeURIComponent(
          JSON.stringify([{ field: 'status', term: WORKORDER_SERVICE_STATUS.pending }])
        )}`;
        if (filterByIds?.length) {
          api += `&filterById=${JSON.stringify(filterByIds)}&filterType=and`;
        }
      }
      try {

        const response = await axiosInstance().get(api, { cancelToken: cancelToken?.token });
        if (response.status !== 200) {
          throw new Error('Failed to fetch data');
        }
        let { data, count } = response.data;
        let rows = []
        if (status === WORKORDER_SERVICE_STATUS.planned) {
          const { data: dataD, count: plannedCount } = data;
          count = plannedCount;
          rows = dataD.map((item) => ({
            ...item,
            serializedAsset: item?.asset?.assetNumber,
            serializedAssetId: item?.asset?._id,
            repairOrderNumber: item?.repairOrder?.optionLabel,
            warehouse: item?.asset?.warehouse || '',
            warehouseId: item?.asset?.warehouseId || '',
            assetStatus: item?.asset?.status,
            currentOwnerType: item?.asset?.currentOwnerType,
            ownerType: item?.asset?.ownerType,
            serviceName: item?.service?.optionLabel,
            assignedUser: item?.assignedUsers?.map((e) => e?.optionLabel)?.toString(),
            workStation: item?.assignedWorkStations?.map((e) => e?.optionLabel)?.toString(),
            status: WORKORDER_SERVICE_STATUS.planned
          }));
        } else {
          rows = data.map((u) => {
            let finalObject: any = prepareDataForGrid(u, user);
            let workOrderDetailData: any = prepareDataForGrid(u?.workOrderDetail, user);
            finalObject['serviceName'] = u?.service?.optionLabel;
            finalObject['serviceId'] = u?.service?.optionValue;
            finalObject['customServiceStatus'] = u?.status;
            finalObject['workOrderId'] = u?.workOrderDetail?._id;
            finalObject['customerAccountName'] = u?.[camelCase(u?.workOrderDetail?.type)]?.customerAccount?.optionLabel;
            finalObject['customerAccountId'] = u?.[camelCase(u?.workOrderDetail?.type)]?.customerAccount?.optionValue;
            finalObject['oriAssignedUsers'] = u?.assignedUsers;
            finalObject['oriAssignedWorkStations'] = u?.assignedWorkStations;
            finalObject['uniqueId'] = u?._id;
            delete workOrderDetailData?._id;
            delete workOrderDetailData?.id;
            return { ...finalObject, ...workOrderDetailData };
          });
        }
        dispatch({ type: 'initialize', data: rows, count: count });
        dispatch({ type: 'loading', loading: false });
      } catch (err) {
        if (axios.isCancel(err)) {
          console.warn('Request cancelled:', status, page);
        } else {
          toastConfig.setToastConfig(err);
        }
        dispatch({ type: 'loading', loading: false });

      }
    }, [user, selectedResource]);

    const handleAddConsumables = (rows, records = []) => {
      setSubmitting(true);
      const data: any = [];
      const workOrderId: any = uniqBy(records, 'workOrderId').map((record) => record.workOrderId);

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
          fetchData({ status, page: 0, filterQuery, limit });
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
          fetchData({ status, limit, page, filterQuery });
          setRepairOrderDialog(false);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    };

    useImperativeHandle(ref, () => ({
      refreshGrid() {
        fetchData({ status, limit, page, filterQuery });
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
          Cell: ({ row }) =>
            row.original['dueDate'] ? <h5 className="text-truncate">{displayDate(row.original.dueDate)}</h5> : <NoDataCell />
        });

        return newColumn;
      }

      let filteredCols = [...columns];

      filteredCols = filteredCols.map((col) => {
        if (col.accessor === 'service') {
          return {
            ...col,
            Cell: ({ row }) =>
              row?.original?.serviceName ? (
                <div className="flex items-center gap-1">
                  <h5
                    className="link text-truncate"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`${routes?.serviceMasterDetail?.path}/${row?.original?.serviceId}`);
                    }}
                  >
                    {row?.original?.serviceName}
                  </h5>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`${routes?.serviceMasterDetail?.path}/${row?.original?.serviceId}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              ) : (
                <NoDataCell />
              )
          };
        }
        return col;
      });

      if (selectedResource === sidebarResource.repairOrder) {
        filteredCols = filteredCols?.filter((c) => !['productionOrder', 'assemblyOrder'].includes(c?.accessor));
      } else if (selectedResource === sidebarResource.productionOrder) {
        filteredCols = filteredCols?.filter((c) =>
          !['repairOrder', 'assemblyOrder', 'serializedAsset', 'rentalJob'].includes(c?.accessor)
        );
      } else if (selectedResource === sidebarResource.assemblyOrder) {
        filteredCols = filteredCols?.filter((c) =>
          !['productionOrder', 'repairOrder', 'serializedAsset', 'rentalJob'].includes(c?.accessor)
        );
      }

      return [...filteredCols];
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
            workOrderData={selectedRecords?.map((r) => ({ uniqueId: r?.uniqueId, workOrderId: r?.workOrderId }))}
            assignedUsers={
              selectedRecords?.length === 1 || selectedRecords?.every((val) => isEqual(val?.oriAssignedUsers, selectedRecords[0]?.oriAssignedUsers))
                ? selectedRecords[0]?.oriAssignedUsers
                : []
            }
            reference={'service'}
            handleClose={() => {
              setAssignTechnicianDialog(false);
            }}
            handleSucess={() => {
              setAssignTechnicianDialog(false);
              fetchData({ status, limit, page, filterQuery });
            }}
            competencies={selectedRecords[0]?.competencies}
          />
        )}
        {workStationAssignDialog && (
          <AssignWorkStationDialog
            warehouse={selectedRecords[0]?.warehouseId}
            workOrderData={selectedRecords?.map((r) => ({ uniqueId: r?.uniqueId, workOrderId: r?.workOrderId }))}
            workStations={
              selectedRecords?.length === 1 ||
                selectedRecords?.every((val) => isEqual(val?.oriAssignedWorkStations, selectedRecords[0]?.oriAssignedWorkStations))
                ? selectedRecords[0]?.oriAssignedWorkStations
                : []
            }
            handleClose={() => {
              setWorkStationAssignDialog(false);
            }}
            handleSucess={() => {
              setWorkStationAssignDialog(false);
              fetchData({ status, limit, page, filterQuery });
            }}
          />
        )}
      </>
    );
  }
);

export default GridView;
