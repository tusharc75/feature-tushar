import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import CardColTimeline, { useCardReducer } from 'src/components/CardColTimeline';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Info } from '@material-ui/icons';
import { WORKORDER_SERVICE_STATUS, WORKORDER_TECHNICIAN_SERVICE_STATUS } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import { camelCase } from 'lodash';
import TechnicianDialog from '../TechnicianDialog';
import { IconButton } from '@material-ui/core';
import DescriptionIcon from '@material-ui/icons/Description';
import DiagramDialog from 'src/pages/WorkOrder/Diagram/DiagramDialog';

const LIMIT = 25;

const CardView = (props, ref) => {
  const { serviceStatus, filterQuery } = props;
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { workOrder, uniqueId } = parsed;

  const {
    state: { user, resources }
  }: any = useData();

  const { state, dispatch } = useCardReducer();
  const { limit } = state;

  const [serviceOpen, setServiceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showDrawingDialog, setShowDrawingDialog] = useState({ open: false, workOrder: null });

  const childFunction = () => {
    dispatch({ type: 'refreshData' });
  };

  useImperativeHandle(ref, () => ({
    childFunction
  }));

  useEffect(() => {
    if (workOrder && uniqueId) {
      setSelectedService({ workOrderId: workOrder, uniqueId: uniqueId, canPerform: true });
      setServiceOpen(true);
    }
  }, [workOrder, uniqueId]);

  const cardDataRows: any[] = useMemo(() => {
    return [
      { accessor: 'serviceName', type: 'title' },
      { accessor: 'workOrderNumber', title: 'Work Order', type: 'text' },
      { accessor: 'productionOrderNumber', title: resources?.productionOrder?.titleSingular, type: 'text' },
      { accessor: 'spoolNumber', title: 'Spool Number', type: 'text' },
      { accessor: 'repairOrderNumber', title: resources?.repairOrder?.titleSingular, type: 'text' },
      { accessor: 'serializedAsset', title: 'Asset', type: 'text' },
      { accessor: 'assignedWorkStations', title: 'Work Stations', type: 'text' },
      {
        type: 'tooltip',
        renderer: (data) => (
          <>
            {data?.productionOrderNumber && (
              <HtmlTooltip title="Drawings">
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDrawingDialog({ open: true, workOrder: data.workOrderDetail?._id });
                  }}
                >
                  <DescriptionIcon fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
            )}
            {data?.canPerformInfo ? (
              <HtmlTooltip title={data.canPerformInfo} arrow placement="top" enterTouchDelay={0}>
                <Info className="[font-size:20px_!important] text-red-500" />
              </HtmlTooltip>
            ) : null}
          </>
        )
      },
      ...(user?.user?.brandPolicy?.workOrderTimer ? [{ accessor: 'stepData', title: 'Time', type: 'timer' }] : []),
      { accessor: 'estimateCompleteDate', title: 'Due Date', type: 'date' }
    ];
  }, [user?.user?.brandPolicy?.workOrderTimer]);

  useEffect(() => {
    dispatch({
      type: 'initialize',
      columnOrder: WORKORDER_TECHNICIAN_SERVICE_STATUS,
      rowDef: cardDataRows,
      visibleColumns: serviceStatus,
      limit: LIMIT
    });
    return () =>
      dispatch({
        type: 'reset'
      });
  }, [dispatch, cardDataRows]);

  useEffect(() => {
    dispatch({ type: 'visibleColumns', visibleColumns: serviceStatus });
  }, [serviceStatus]);

  const fetchSingleColumn = useCallback((column: string, page = 0, appendData = true, filterQuery) => {
    let api = `/work-order-technician?page=${page}&status=${column}&limit=${limit}${filterQuery}`;
    dispatch({ type: 'loading', loading: (prev) => ({ ...prev, [column]: true }) });
    axiosInstance()
      .get(api)
      .then(({ data: { data, count } }) => {
        const setData = (prev: { [key: string]: any[] }, appendData: boolean) => {
          const rows = data.map((item) => {
            const newObj = { ...item };
            newObj['serviceName'] = item.service?.serviceName;
            newObj['workOrderNumber'] = item.workOrderDetail?.workOrderNumber;
            newObj['repairOrderNumber'] = item.workOrderDetail?.repairOrder?.optionLabel;
            newObj['productionOrderNumber'] = item.workOrderDetail?.productionOrder?.optionLabel;
            newObj['spoolNumber'] = item.workOrderDetail?.spoolNumber;
            newObj['serializedAsset'] = item.workOrderDetail?.serializedAsset?.optionLabel;
            newObj['assignedWorkStations'] = item?.assignedWorkStations?.map((e) => e?.optionLabel)?.toString();
            if (column !== WORKORDER_SERVICE_STATUS.completed) {
              newObj['estimateCompleteDate'] = item.workOrderDetail?.estimateCompleteDate;
            }
            return newObj;
          });
          const newData = prev;
          if (!appendData) {
            newData[column] = rows;
          } else {
            if (prev[column] && prev[column]?.length) {
              newData[column] = [...prev[column], ...rows];
            } else {
              newData[column] = rows;
            }
          }
          return newData;
        };
        dispatch({ type: 'setData', setData: (prev) => setData(prev, appendData), setCount: (prevCount) => ({ ...prevCount, [column]: count }) });
        dispatch({ type: 'page', setPage: (prev) => ({ ...prev, [column]: page }) });
      })
      .catch((err) => {})
      .finally(() => {
        dispatch({ type: 'loading', loading: (prev) => ({ ...prev, [column]: false }) });
      });
  }, []);

  useEffect(() => {
    if (filterQuery?.filterById?.length > 0 || filterQuery?.deepFilter?.length > 0) {
      let query = `&filterType=and`;

      if (filterQuery?.filterById?.length > 0) {
        query = `${query}&filterById=${JSON.stringify(filterQuery?.filterById)}`;
      }
      if (filterQuery?.deepFilter?.length > 0) {
        query = `${query}&deepFilter=${JSON.stringify(filterQuery?.deepFilter)}`;
      }
      dispatch({ type: 'setFilterQuery', filterQuery: query });
    } else {
      dispatch({ type: 'setFilterQuery', filterQuery: '' });
    }
  }, [filterQuery, dispatch]);

  return (
    <>
      <CardColTimeline
        fetchSingleColumn={fetchSingleColumn}
        state={state}
        dispatch={dispatch}
        passFailStatus={true}
        passFailAccessor="serviceStatus"
        cardOnClick={(e, data) => {
          let tempServiceData = {};
          tempServiceData['uniqueId'] = data?._id;
          tempServiceData['workOrderId'] = data?.workOrderDetail?._id;
          tempServiceData['canPerform'] = data?.canPerform;
          setSelectedService(tempServiceData);
          setServiceOpen(true);
        }}
      />
      {serviceOpen && (
        <TechnicianDialog
          handleClose={() => {
            setServiceOpen(false);
            setSelectedService(null);
            dispatch({ type: 'refreshData' });
            if (workOrder) {
              history.push(`${routes.workOrderTechnician.path}`);
            }
          }}
          workOrderId={selectedService?.workOrderId}
          uniqueId={selectedService?.uniqueId}
          canPerform={selectedService?.canPerform}
        />
      )}
      {showDrawingDialog.open && (
        <DiagramDialog
          referenceId={showDrawingDialog.workOrder}
          handleClose={() => {
            setShowDrawingDialog({ open: false, workOrder: null });
          }}
        />
      )}
    </>
  );
};

export default forwardRef(CardView);
