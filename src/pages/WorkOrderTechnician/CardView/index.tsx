import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CardColTimeline, { FetchSingleColumnProps, useCardColTimeline } from 'src/components/CardColTimeline1';
import { WORKORDER_SERVICE_STATUS, WORKORDER_TECHNICIAN_SERVICE_STATUS, workOrderColormap } from 'src/constants/helpers';

type Columns = typeof WORKORDER_TECHNICIAN_SERVICE_STATUS;

// dispatch({
//   type: 'initialize',
//   columnOrder: WORKORDER_TECHNICIAN_SERVICE_STATUS,
//   rowDef: cardDataRows,
//   visibleColumns: serviceStatus,
//   limit: LIMIT
// });

const CardView = ({ columnsDef, serviceStatus, filterQuery }, ref) => {
  // const history = useHistory();
  // const parsed = queryString.parse(history.location.search);
  // const { workOrder, uniqueId } = parsed;
  const fetchSingleColumn = useCallback(async ({ column, filterQuery, limit, page }: FetchSingleColumnProps<any, Columns>) => {
    const api = `/work-order-technician?page=${page}&status=${column}&limit=${limit}${filterQuery}`;
    try {
      const response = await axiosInstance().get(api);
      const {
        data: { data, count }
      } = response;
      const rows = data.map((item) => {
        const newObj = { ...item };
        newObj['serviceName'] = item.service?.serviceName;
        newObj['customServiceStatus'] = item.status;
        newObj['workOrderNumber'] = item.workOrderDetail?.workOrderNumber;
        newObj['repairOrderNumber'] = item.workOrderDetail?.repairOrder?.optionLabel;
        newObj['productionOrderNumber'] = item.workOrderDetail?.productionOrder?.optionLabel;
        newObj['assemblyOrderNumber'] = item.workOrderDetail?.assemblyOrder?.optionLabel;
        newObj['serializedAsset'] = item.workOrderDetail?.serializedAsset?.optionLabel;
        newObj['package'] = item.workOrderDetail?.package?.optionLabel;
        newObj['assignedWorkStations'] = item?.assignedWorkStations?.map((e) => e?.optionLabel)?.toString();
        if (column !== WORKORDER_SERVICE_STATUS.completed) {
          newObj['estimateCompleteDate'] = item.workOrderDetail?.estimateCompleteDate;
        }
        return newObj;
      });
      return { data: rows, count } as { data: any; count: number };
    } catch (error) {
      throw error;
    }
  }, []);

  const state = useCardColTimeline({
    columns: WORKORDER_TECHNICIAN_SERVICE_STATUS,
    initialVisibleColumns: serviceStatus,
    columnDef: columnsDef,
    fetchSingleColumn
  });
  const { setVisibleColumns, refreshAllColumns, setFilterQuery } = state;

  const refreshData = () => {
    refreshAllColumns();
  };

  useImperativeHandle(ref, () => ({
    refreshData
  }));

  useEffect(() => {
    setVisibleColumns(serviceStatus);
  }, [serviceStatus]);

  console.log(state);

  // const fetchSingleColumns = useCallback(async ({column: string, page = 0, appendData = true, filterQuery}) => {
  //   let api = `/work-order-technician?page=${page}&status=${column}&limit=${limit}${filterQuery}`;
  //   axiosInstance()
  //     .get(api)
  //     .then(({ data: { data, count } }) => {
  //       const setData = (prev: { [key: string]: any[] }, appendData: boolean) => {
  //         const rows = data.map((item) => {
  //           const newObj = { ...item };
  //           newObj['serviceName'] = item.service?.serviceName;
  //           newObj['customServiceStatus'] = item.status;
  //           newObj['workOrderNumber'] = item.workOrderDetail?.workOrderNumber;
  //           newObj['repairOrderNumber'] = item.workOrderDetail?.repairOrder?.optionLabel;
  //           newObj['productionOrderNumber'] = item.workOrderDetail?.productionOrder?.optionLabel;
  //           newObj['assemblyOrderNumber'] = item.workOrderDetail?.assemblyOrder?.optionLabel;
  //           newObj['serializedAsset'] = item.workOrderDetail?.serializedAsset?.optionLabel;
  //           newObj['package'] = item.workOrderDetail?.package?.optionLabel;
  //           newObj['assignedWorkStations'] = item?.assignedWorkStations?.map((e) => e?.optionLabel)?.toString();
  //           if (column !== WORKORDER_SERVICE_STATUS.completed) {
  //             newObj['estimateCompleteDate'] = item.workOrderDetail?.estimateCompleteDate;
  //           }
  //           return newObj;
  //         });
  //         const newData = prev;
  //         if (!appendData) {
  //           newData[column] = rows;
  //         } else {
  //           if (prev[column] && prev[column]?.length) {
  //             newData[column] = [...prev[column], ...rows];
  //           } else {
  //             newData[column] = rows;
  //           }
  //         }
  //         return newData;
  //       };
  //       dispatch({ type: 'setData', setData: (prev) => setData(prev, appendData), setCount: (prevCount) => ({ ...prevCount, [column]: count }) });
  //       dispatch({ type: 'page', setPage: (prev) => ({ ...prev, [column]: page }) });
  //     })
  //     .catch((err) => {})
  //     .finally(() => {
  //       dispatch({ type: 'loading', loading: (prev) => ({ ...prev, [column]: false }) });
  //     });
  // }, []);

  useEffect(() => {
    if (filterQuery?.length > 0) {
      let query = `&filterType=and`;

      if (filterQuery?.length > 0) {
        query = `${query}&filterById=${JSON.stringify(filterQuery)}`;
      }
      setFilterQuery(query);
    } else {
      setFilterQuery('');
    }
  }, [filterQuery]);

  return (
    <>
      <CardColTimeline
        fetchSingleColumn={fetchSingleColumn}
        getColColors={(colName) => workOrderColormap[colName]}
        state={state}
        passFailStatus={true}
        passFailAccessor="serviceStatus"
        cardOnClick={(data: any) => {
          let tempServiceData = {};
          tempServiceData['uniqueId'] = data?._id;
          tempServiceData['workOrderId'] = data?.workOrderDetail?._id;
          tempServiceData['canPerform'] = data?.canPerform;
          // setSelectedService(tempServiceData);
          // setServiceOpen(true);
        }}
      />
    </>
  );
};

export default forwardRef(CardView);
