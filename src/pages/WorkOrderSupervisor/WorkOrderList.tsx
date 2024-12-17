import { Box, IconButton, MenuItem } from '@material-ui/core';
import { Info } from '@material-ui/icons';
import axios, { CancelTokenSource } from 'axios';
import { camelCase, uniqBy } from 'lodash';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import {
  gridLoadingTimeout,
  MATERIAL_SUB_TYPE,
  MATERIAL_TYPE,
  prepareDataForGrid,
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

const renderedFrom = camelCase(sidebarResource?.workOrderSupervisor);

const WorkOrderList = ({ filterResourceQuery, globalFilters }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, sorting, selectedRecords, filters } = state;

  const { generateColumns } = useColumns();

  const [tabValue, setTabValue] = useState(1);
  const [columns, setColumns] = useState(null);
  const [serviceOpen, setServiceOpen] = useState({ open: false, id: null });
  const [assignTechnicianDialog, setAssignTechnicianDialog] = useState(false);
  const [workStationAssignDialog, setWorkStationAssignDialog] = useState(false);
  const [consumablesDialog, setConsumablesDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    fetchGridColumns(cancelToken);
    return () => cancelToken.cancel();
  }, []);

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    if (tabValue) {
      fetchData(cancelToken);
    }
    return () => cancelToken.cancel();
  }, [page, limit, sorting, tabValue, filterResourceQuery, globalFilters, filters]);

  const fetchGridColumns = async (cancelToken?: CancelTokenSource) => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource['workOrder']}&view=true`, { cancelToken: cancelToken?.token });
    data = response?.data?.data?.filter((f) =>
      [
        'workOrderNumber',
        'spoolNumber',
        'status',
        'competencies',
        'productionOrder',
        'repairOrder',
        'expectedCompletionDate',
        'warehouse',
        'type'
      ]?.includes(f?.fieldData?.fieldName)
    );
    const newColumns = generateColumns(renderedFrom, data, routes?.workOrderDetail.path);
    const columns = newColumns.filter((ele) => ele.accessor != 'workOrderNumber');

    columns.forEach((c) => {
      if (c?.accessor === 'status') {
        c.disableFilters = true;
        c.disableSortBy = true;
      }
    });

    const extraColumns = [
      {
        accessor: 'service',
        Header: 'Service',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => (
          <>
            {row?.original?.service ? (
              <div>
                <h5
                  className="link text-truncate"
                  onClick={() => {
                    setServiceOpen({ open: true, id: row?.original?.workOrder });
                  }}
                >
                  {row.original.service}
                </h5>
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
            )}
          </>
        )
      },
      {
        accessor: 'workOrderNumber',
        Header: 'Work Order Number',
        Cell: ({ row }) =>
          row.original['workOrderNumber'] ? (
            <div className="flex items-center gap-1">
              <h5 className=" text-truncate">{row.original.workOrderNumber}</h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes?.workOrderDetail?.path}/${row.original.workOrder}`);
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
      {
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
      }
    ];
    const finalColumns = [...extraColumns.slice(0, 2), ...columns, ...extraColumns.slice(2)];
    setColumns(finalColumns);
  };

  const fetchData = (cancelToken?: CancelTokenSource) => {
    dispatch({ type: 'selection', selectedRecords: [] });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${workOrderSupervisor.api}/work-order-service${queryString}`, { cancelToken: cancelToken?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
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
        dispatch({ type: 'initialize', data: rows, count: count });
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
    let status = WORKORDER_SERVICE_STATUS.pending;
    if (tabValue === 2) {
      status = WORKORDER_SERVICE_STATUS.inProgress;
    }
    if (tabValue === 3) {
      status = WORKORDER_SERVICE_STATUS.completed;
    }

    let deepFilter = `?page=${page}&limit=${limit}&status=${status}`;

    if (filterResourceQuery?.filterById?.length) {
      filterResourceQuery?.filterById?.forEach((f) => {
        deepFilter = `${deepFilter}&${f.field}=${f.term}`;
      });
    }

    if (globalFilters) {
      deepFilter = `${deepFilter}&from=${moment(globalFilters.from).format('YYYY/MM/DD')}&to=${moment(globalFilters.to).format('YYYY/MM/DD')}`;
    }

    const { deepFilters } = gridFilterParser(filters);

    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    return `${deepFilter}&filterType=and&filterByIdType=and`;
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
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
          parentId: null
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

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords?.some((r) => r?.status === WORKORDER_SERVICE_STATUS.completed)}
          onClick={() => {
            setAssignTechnicianDialog(true);
          }}
        >
          {'Assign Technician'}
        </MenuItem>
        {permissions?.workStations?.isRead && (
          <MenuItem
            disabled={selectedRecords?.some((r) => r?.status === WORKORDER_SERVICE_STATUS.completed)}
            onClick={() => {
              setWorkStationAssignDialog(true);
            }}
          >{`Assign ${resources?.workStations?.titlePlural}`}</MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setConsumablesDialog(true);
          }}
          id="add-consumables"
        >
          Add Products/Consumables
        </MenuItem>
      </>
    );
  };

  return (
    <>
      <Box>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab key={WORKORDER_SERVICE_STATUS.pending} label={WORKORDER_SERVICE_STATUS.pending} value={1} />
          <CustomTab key={WORKORDER_SERVICE_STATUS.inProgress} label={WORKORDER_SERVICE_STATUS.inProgress} value={2} />
          <CustomTab key={WORKORDER_SERVICE_STATUS.completed} label={WORKORDER_SERVICE_STATUS.completed} value={3} />
        </CustomTabs>

        <DetailsPageHeader
          isAddButtonVisible={false}
          isActionButtonVisible={true}
          actionButtonMenuItems={actionButtonMenuItems()}
          actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
          hasXpadding
        />

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 300px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
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
            selectedRecords?.length === 1
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
            selectedRecords?.length === 1
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
      {consumablesDialog && (
        <AssignProductDialog
          handleCloseDialog={() => setConsumablesDialog(false)}
          ids={[]}
          onSuccess={(rows) => {
            handleAddConsumables(rows, selectedRecords);
          }}
          serialized={false}
          isSubmitting={submitting}
          extraDeepFilter={[{ field: 'expenseItem', term: 'No' }]}
        />
      )}
    </>
  );
};

export default WorkOrderList;
