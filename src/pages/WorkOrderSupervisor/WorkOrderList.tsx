import { Box, MenuItem } from '@material-ui/core';
import { Info } from '@material-ui/icons';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource, WORKORDER_SERVICE_STATUS, workOrderSupervisor } from 'src/constants/helpers';
import AssignUserDialog from 'src/pages/WorkOrder/Service/AssignUserDialog';
import AssignWorkStationDialog from 'src/pages/WorkOrder/Service/AssignWorkStationDialog';
import TechnicianDialog from 'src/pages/WorkOrderTechnician/TechnicianDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const renderedFrom = camelCase(routes?.workOrderSupervisor.title);

const WorkOrderList = ({ filterResourceQuery, globalFilters }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, sorting, selectedRecords, filters } = state;

  const { generateColumns } = useColumns();

  const [tabValue, setTabValue] = useState(1);
  const [columns, setColumns] = useState(null);
  const [serviceOpen, setServiceOpen] = useState({ open: false, id: null });
  const [assignTechnicianDialog, setAssignTechnicianDialog] = useState(false);
  const [workStationAssignDialog, setWorkStationAssignDialog] = useState(false);

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
    const newColumns = generateColumns(renderedFrom, data, routes.workOrderDetail.path);
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
                    setServiceOpen({ open: true, id: row?.original?._id });
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
        Cell: ({ row }) => (row.original['workOrderNumber'] ? <h5 className=" text-truncate">{row.original.workOrderNumber}</h5> : <NoDataCell />)
      },
      {
        accessor: 'assignedWorkStations',
        Header: 'Work Stations',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) =>
          row.original['assignedWorkStations'] ? <h5 className="text-truncate">{row.original.assignedWorkStations}</h5> : <NoDataCell />
      },
      {
        accessor: 'assignedUsers',
        Header: 'Technician',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) =>
          row?.original['assignedUsers'] ? (
            <div>
              <h5 className="text-truncate">
                {row.original.assignedUsers}
                {row.original?.restassignedUsers?.length > 0 && row?.original?.restassignedUsers?.map((e) => `,${' '}${e?.optionLabel}`)}
              </h5>
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

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setAssignTechnicianDialog(true);
          }}
        >
          {'Assign Technician'}
        </MenuItem>
        {permissions?.workStations?.isRead && (
          <MenuItem
            onClick={() => {
              setWorkStationAssignDialog(true);
            }}
          >{`Assign ${routes.workStations.title}`}</MenuItem>
        )}
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
        <TechnicianDialog
          handleClose={() => {
            setServiceOpen({ open: false, id: null });
          }}
          workOrderId={serviceOpen?.id}
          uniqueId={null}
          canPerform={false}
        />
      )}
      {assignTechnicianDialog && (
        <AssignUserDialog
          warehouse={selectedRecords[0]?.warehouseId}
          workOrderData={selectedRecords?.map((r) => ({ uniqueId: r?.uniqueId, workOrderId: r?._id }))}
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
          workOrderData={selectedRecords?.map((r) => ({ uniqueId: r?.uniqueId, workOrderId: r?._id }))}
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
    </>
  );
};

export default WorkOrderList;
