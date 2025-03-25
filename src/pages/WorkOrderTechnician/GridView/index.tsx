import { Box } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import React, { useContext, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ButtonMenu from 'src/components/ButtonMenu';
import CustomReactTable, { gridFilterParser } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { gridLoadingTimeout, prepareDataForGrid, WORKORDER_SERVICE_STATUS, workOrderIconMap } from 'src/constants/helpers';

export type GridViewRef = {
  refreshGrid: () => void;
};

type TableViewStatus =
  | typeof WORKORDER_SERVICE_STATUS.pending
  | typeof WORKORDER_SERVICE_STATUS.inProgress
  | typeof WORKORDER_SERVICE_STATUS.completed
  | typeof WORKORDER_SERVICE_STATUS.inProgressByOther;

const GridView = React.forwardRef<GridViewRef, any>(({ renderedFrom, state, dispatch, filterQuery, permissions, tableHead = null, columns }, ref) => {
  const toastConfig = useContext(CustomToastContext);
  const [tableViewStatus, setTableViewStatus] = useState<TableViewStatus>('Pending');

  const statusMenuItems = useMemo(() => {
    return [
      {
        label: WORKORDER_SERVICE_STATUS.pending,
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.pending,
        value: WORKORDER_SERVICE_STATUS.pending,
        startIcon: workOrderIconMap[WORKORDER_SERVICE_STATUS.pending]
      },
      {
        label: WORKORDER_SERVICE_STATUS.inProgress,
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.inProgress,
        value: WORKORDER_SERVICE_STATUS.inProgress,
        startIcon: workOrderIconMap[WORKORDER_SERVICE_STATUS.inProgress]
      },
      {
        label: WORKORDER_SERVICE_STATUS.completed,
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.completed,
        value: WORKORDER_SERVICE_STATUS.completed,
        startIcon: workOrderIconMap[WORKORDER_SERVICE_STATUS.completed]
      },
      {
        label: WORKORDER_SERVICE_STATUS.inProgressByOther,
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.inProgressByOther,
        value: WORKORDER_SERVICE_STATUS.inProgressByOther,
        startIcon: workOrderIconMap[WORKORDER_SERVICE_STATUS.inProgressByOther]
      }
    ];
  }, [tableViewStatus]);
  const {
    state: { user }
  }: any = useData();

  const { page, limit, sorting, filters } = state;

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    if (tableViewStatus) {
      fetchData(cancelToken);
    }
    return () => cancelToken.cancel();
  }, [page, limit, sorting, tableViewStatus, filterQuery, filters]);

  useEffect(() => {
    dispatch({ type: 'selection', selectedRecords: [] });
  }, [tableViewStatus]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&status=${tableViewStatus}`;
    const { filterByIds, deepFilters } = gridFilterParser(filters);
    if (filterQuery?.length) {
      filterQuery?.forEach((e) => {
        filterByIds.push(e);
      });
    }
    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    return deepFilter;
  };

  const fetchData = (cancelToken?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`/work-order-technician${queryString}`, { cancelToken: cancelToken?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          let workOrderDetailData: any = prepareDataForGrid(u?.workOrderDetail, user);
          finalObject['serviceName'] = u?.service?.serviceName;
          finalObject['serviceId'] = u?.service?._id;
          finalObject['customServiceStatus'] = u?.status;
          finalObject['workOrderId'] = u?.workOrderDetail?._id;
          const matchedTempMaterial = workOrderDetailData?.tempMaterial?.find((t) => t?.materialId === u?.service?._id);
          finalObject['uniqueId'] = matchedTempMaterial?._id;
          delete workOrderDetailData?._id;
          delete workOrderDetailData?.id;
          return { ...finalObject, ...workOrderDetailData };
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

  console.log(state.dataRows);

  useImperativeHandle(ref, () => ({
    refreshGrid() {
      fetchData();
    }
  }));

  return (
    <>
      <div className="[&_.table-container-v1>div]:mt-0">
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 270px)'}
            columns={columns}
            topLeftSlot={
              <div className="flex items-center gap-2">
                <ButtonMenu
                  showChevron={true}
                  items={statusMenuItems}
                  onItemClick={(e, item) => {
                    setTableViewStatus(item.value);
                  }}
                >
                  <span className="flex items-center gap-2  [&_svg]:text-[18px]">
                    {workOrderIconMap[tableViewStatus]}
                    Status: {tableViewStatus}
                  </span>
                </ButtonMenu>
                {tableHead}
              </div>
            }
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
    </>
  );
});

export default GridView;
