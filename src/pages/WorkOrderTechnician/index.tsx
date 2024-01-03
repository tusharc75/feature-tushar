import { Box, Checkbox, Chip, IconButton, TextField } from '@material-ui/core';
import { Info } from '@material-ui/icons';
import CloseIcon from '@material-ui/icons/Close';
import RefreshIcon from '@material-ui/icons/Refresh';
import { Autocomplete } from '@material-ui/lab';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CardColTimeline, { useCardReducer } from 'src/components/CardColTimeline';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import routes from 'src/components/Helpers/Routes';
import { WORKORDER_SERVICE_STATUS, WORKORDER_TECHNICIAN_SERVICE_STATUS, sidebarResource } from 'src/constants/helpers';
import TechnicianDialog from './TechnicianDialog';

const LIMIT = 25;

const RESOURCE = [
  {
    resource: sidebarResource.workOrder,
    title: routes.workOrder.title,
    fieldName: 'rentalJobName'
  },
  {
    resource: sidebarResource.repairOrder,
    title: routes.repairOrder.title,
    fieldName: 'repairOrder'
  },
  {
    resource: sidebarResource.productionOrder,
    title: routes.productionOrder.title,
    fieldName: 'repairOrder'
  }
];

const WorkOrderTechnician = () => {
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { workOrder, uniqueId } = parsed;

  const { state, dispatch } = useCardReducer();
  const { limit } = state;

  const [serviceOpen, setServiceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [workOrderOptions, setWorkOrderOptions] = useState([]);
  const [repairOrderOptions, setRepairOrderOptions] = useState([]);
  const [productionOrderOptions, setProductionOrderOptions] = useState([]);

  const [selectedServiceStatus, setSelectedServiceStatus] = useState([
    WORKORDER_SERVICE_STATUS.pending,
    WORKORDER_SERVICE_STATUS.inProgress,
    WORKORDER_SERVICE_STATUS.completed
  ]);

  const [resourceFilter, setResourceFilter] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedResourceFilter, setSelectedResourceFilter] = useState(null);

  useEffect(() => {
    if (workOrder && uniqueId) {
      setSelectedService({ workOrderId: workOrder, uniqueId: uniqueId, canPerform: true });
      setServiceOpen(true);
    }
  }, [workOrder, uniqueId]);

  const {
    state: { permissions, user }
  }: any = useData();

  useEffect(() => {
    const options: any = [];
    RESOURCE?.forEach((item) => {
      if (permissions[camelCase(item.resource)]) {
        options.push(item);
      }
    });
    setResourceFilter(options);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axiosInstance()
      .get(`/work-order-technician/filter-option`)
      .then(({ data: { data } }) => {
        setWorkOrderOptions(data?.workOrder || []);
        setRepairOrderOptions(data?.repairOrder || []);
        setProductionOrderOptions(data?.productionOrder || []);
      });
  };

  const cardDataRows: any[] = useMemo(() => {
    return [
      { accessor: 'serviceName', type: 'title' },
      { accessor: 'workOrderNumber', title: 'Work Order', type: 'text' },
      { accessor: 'productionOrderNumber', title: routes.productionOrder.title, type: 'text' },
      { accessor: 'repairOrderNumber', title: routes.repairOrder.title, type: 'text' },
      { accessor: 'serializedAsset', title: 'Asset', type: 'text' },
      { accessor: 'assignedWorkStations', title: 'Work Stations', type: 'text' },
      {
        type: 'tooltip',
        renderer: (data) =>
          data?.canPerformInfo ? (
            <HtmlTooltip title={data.canPerformInfo} arrow placement="top" enterTouchDelay={0}>
              <Info className="[font-size:20px_!important] text-red-500" />
            </HtmlTooltip>
          ) : null
      },
      ...(user?.user?.brandPolicy?.workOrderTimer ? [{ accessor: 'stepData', title: 'Time', type: 'timer' }] : []),
      { accessor: 'estimateCompleteDate', title: 'Due Date', type: 'date' },
    ];
  }, [user?.user?.brandPolicy?.workOrderTimer]);

  useEffect(() => {
    dispatch({
      type: 'initialize',
      columnOrder: WORKORDER_TECHNICIAN_SERVICE_STATUS,
      rowDef: cardDataRows,
      visibleColumns: selectedServiceStatus,
      limit: LIMIT
    });
    return () =>
      dispatch({
        type: 'reset'
      });
  }, [dispatch, cardDataRows]);

  useEffect(() => {
    dispatch({ type: 'visibleColumns', visibleColumns: selectedServiceStatus });
  }, [selectedServiceStatus]);

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
      .catch((err) => { })
      .finally(() => {
        dispatch({ type: 'loading', loading: (prev) => ({ ...prev, [column]: false }) });
      });
  }, []);

  useEffect(() => {
    if (selectedResource && selectedResourceFilter) {
      const query = `&${camelCase(selectedResource?.resource)}=${selectedResourceFilter?.optionValue}`;
      dispatch({ type: 'setFilterQuery', filterQuery: query });
    } else {
      dispatch({ type: 'setFilterQuery', filterQuery: '' });
    }
  }, [selectedResource, selectedResourceFilter, dispatch]);

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: routes.workOrderTechnician.title }]} />
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[4fr_4fr_6fr_auto] xl:grid-cols-[1fr_1fr_1fr_auto] items-start gap-4">
          <Box className={`shadow-[0px_4.74053px_23.7026px_rgba(0,_0,_0,_0.06)]`}>
            <Autocomplete
              options={resourceFilter}
              fullWidth
              getOptionLabel={(option: any) => option.title}
              getOptionSelected={(option: any, value: any) => option.resource === value.resource}
              value={selectedResource}
              onChange={(event, newValue) => {
                setSelectedResourceFilter(null);
                setSelectedResource(newValue);
              }}
              size="small"
              renderInput={(params) => <TextField {...params} label={`Select Resource`} variant="outlined" />}
            />
          </Box>
          {selectedResource && (
            <Box className={`shadow-[0px_4.74053px_23.7026px_rgba(0,_0,_0,_0.06)]`}>
              <Autocomplete
                options={
                  selectedResource.resource === sidebarResource.workOrder
                    ? workOrderOptions
                    : selectedResource.resource === sidebarResource.repairOrder
                      ? repairOrderOptions
                      : productionOrderOptions
                }
                fullWidth
                getOptionLabel={(option: any) => option.optionLabel}
                getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                value={selectedResourceFilter}
                onChange={(event, newValue) => {
                  setSelectedResourceFilter(newValue);
                }}
                size="small"
                renderInput={(params) => <TextField {...params} label={`Select ${selectedResource.title}`} variant="outlined" />}
              />
            </Box>
          )}
          <Box className={`shadow-[0px_4.74053px_23.7026px_rgba(0,_0,_0,_0.06)]`}>
            <Autocomplete
              fullWidth
              multiple
              options={WORKORDER_TECHNICIAN_SERVICE_STATUS || []}
              disableCloseOnSelect
              getOptionLabel={(option) => option}
              renderOption={(option: any) => (
                <React.Fragment>
                  <Checkbox checked={selectedServiceStatus?.includes(option)} />
                  {option}
                </React.Fragment>
              )}
              size="small"
              limitTags={2}
              renderInput={(params) => <TextField {...params} label="Status" variant="outlined" />}
              value={selectedServiceStatus}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  return (
                    <Chip
                      style={{ fontWeight: 600 } as React.CSSProperties}
                      label={option}
                      deleteIcon={<CloseIcon style={{ color: '#000000', width: '14px' }} />}
                      {...getTagProps({ index })}
                    />
                  );
                })
              }
              onChange={(event: any, newValue: any) => {
                setSelectedServiceStatus(newValue);
              }}
            />
          </Box>
          <IconButton
            className={`${selectedResource ? 'sm:col-span-[unset]' : 'sm:col-span-2'} md:col-span-[unset]`}
            size="small"
            onClick={() => {
              dispatch({ type: 'refreshData' });
              fetchData();
            }}
            style={{ display: 'flex', marginTop: '4px', marginLeft: 'auto' }}
          >
            <RefreshIcon />
          </IconButton>
          <Box></Box>
        </Box>
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
      </Box>
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
    </Box>
  );
};
export default WorkOrderTechnician;
