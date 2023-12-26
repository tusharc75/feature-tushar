import { Box, Checkbox, Chip, IconButton, TextField } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import RefreshIcon from '@material-ui/icons/Refresh';
import { Autocomplete } from '@material-ui/lab';
import { camelCase } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CardColTimeline, { useCardReducer } from 'src/components/CardColTimeline1';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { WORKORDER_SERVICE_STATUS, WORKORDER_TECHNICIAN_SERVICE_STATUS, sidebarResource } from 'src/constants/helpers';
import TechnicianDialog from './TechnicianDialog';

const API = `/work-order-technician`;
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
  const { state, dispatch } = useCardReducer();
  const { limit, loading: stateLoading } = state;

  const [serviceOpen, setServiceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);

  const [workOrderOptions, setWorkOrderOptions] = useState([]);
  const [repairOrderOptions, setRepairOrderOptions] = useState([]);
  const [productionOrderOptions, setProductionOrderOptions] = useState([]);

  const [selectedServiceStatus, setSelectedServiceStatus] = useState([
    WORKORDER_SERVICE_STATUS.pending,
    WORKORDER_SERVICE_STATUS.inProgress,
    WORKORDER_SERVICE_STATUS.completed
  ]);

  const [cardData, setCardData] = useState(null);

  const [resourceFilter, setResourceFilter] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedResourceFilter, setSelectedResourceFilter] = useState(null);

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

  const fetchAutoCompleteData = useCallback(() => {
    setLoading(true);
    axiosInstance()
      .get(API)
      .then(({ data: { data } }) => {
        if (!selectedResourceFilter) {
          const workOrderOption = [];
          const repairOrderOption = [];
          const productionOrderOption = [];
          for (const item of data) {
            if (item?.workOrderDetail && !workOrderOption?.find((e) => e.optionValue === item?.workOrderDetail?._id)) {
              workOrderOption.push({ optionValue: item?.workOrderDetail?._id, optionLabel: item?.workOrderDetail?.workOrderNumber });
            }
            if (
              item?.workOrderDetail?.repairOrder &&
              !repairOrderOption?.find((e) => e.optionValue === item?.workOrderDetail?.repairOrder?.optionValue)
            ) {
              repairOrderOption.push({
                optionValue: item?.workOrderDetail?.repairOrder?.optionValue,
                optionLabel: item?.workOrderDetail?.repairOrder?.optionLabel
              });
            }
            if (
              item?.workOrderDetail?.productionOrder &&
              !productionOrderOption?.find((e) => e.optionValue === item?.workOrderDetail?.productionOrder?.optionValue)
            ) {
              productionOrderOption.push({
                optionValue: item?.workOrderDetail?.productionOrder?.optionValue,
                optionLabel: item?.workOrderDetail?.productionOrder?.optionLabel
              });
            }
          }

          setWorkOrderOptions(workOrderOption);
          setRepairOrderOptions(repairOrderOption);
          setProductionOrderOptions(productionOrderOption);
        }
        setLoading(false);
      })
      ?.catch((err) => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchAutoCompleteData();
  }, [fetchAutoCompleteData]);

  const cardDataRows: any[] = [
    { accessor: 'serviceName', type: 'title' },
    { accessor: 'workOrderNumber', title: 'Work Order', type: 'text' },
    { accessor: 'serializedAsset', title: 'Asset', type: 'text' },
    { accessor: 'assignedWorkStations', title: 'Work Stations', type: 'text' },
    ...(user?.user?.brandPolicy?.workOrderTimer ? [{ accessor: 'stepData', title: 'Time', type: 'timer' }] : [])
  ];

  useEffect(() => {
    dispatch({
      type: 'initialize',
      columnOrder: WORKORDER_TECHNICIAN_SERVICE_STATUS,
      rowDef: cardDataRows,
      visibleColumns: selectedServiceStatus,
      limit: LIMIT
    });
  }, []);

  useEffect(() => {
    dispatch({ type: 'visibleColumns', visibleColumns: selectedServiceStatus });
  }, [selectedServiceStatus]);

  const fetchSingleColumn = useCallback((column: string, page = 0, appendData = true, filterQuery) => {
    let api = `${API}?page=${page}&status=${column}&limit=${limit}${filterQuery}`;
    dispatch({ type: 'loading', loading: (prev) => ({ ...prev, [column]: true }) });
    axiosInstance()
      .get(api)
      .then(({ data: { data, count } }) => {
        const setData = (prev: { [key: string]: any[] }, appendData: boolean) => {
          const updatedData = data
            .filter((item) => selectedServiceStatus.includes(item.status))
            .map((item) => {
              const newObj = { ...item };
              newObj['serviceName'] = item.service?.serviceName;
              newObj['workOrderNumber'] = item.workOrderDetail?.workOrderNumber;
              newObj['serializedAsset'] = item.workOrderDetail?.serializedAsset?.optionLabel;
              newObj['serializedAsset'] = item.workOrderDetail?.serializedAsset?.optionLabel;
              newObj['assignedWorkStations'] = item?.assignedWorkStations?.map((e) => e.optionLabel)?.toString();
              return newObj;
            });

          const newData = prev;

          if (!appendData) {
            newData[column] = updatedData;
            return newData;
          }
          if (prev[column] && prev[column].length > 0) {
            newData[column] = [...prev[column], ...updatedData];
          } else {
            newData[column] = updatedData;
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
    if (selectedResource && selectedResourceFilter) {
      const query = `&${camelCase(selectedResource?.resource)}=${selectedResourceFilter?.optionValue}`;
      dispatch({ type: 'setFilterQuery', filterQuery: query });
    } else {
      dispatch({ type: 'setFilterQuery', filterQuery: '' });
    }
  }, [selectedResource, selectedResourceFilter, dispatch]);

  const isAnyColumnLoading = useMemo(() => {
    return Object.values(state.loading).some((item) => item);
  }, [stateLoading]);

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
              disabled={loading || isAnyColumnLoading}
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
                disabled={loading || isAnyColumnLoading}
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
            }}
            style={{ display: 'flex', marginTop: '4px', marginLeft: 'auto' }}
          >
            <RefreshIcon />
          </IconButton>
          <Box></Box>
        </Box>
        {/* {cardData && ( */}
        <CardColTimeline
          fetchSingleColumn={fetchSingleColumn}
          state={state}
          dispatch={dispatch}
          passFailStatus={true}
          passFailAccessor="serviceStatus"
          cardOnClick={(e, data) => {
            let tempServiceData = data?.service;
            tempServiceData['uniqueId'] = data?._id;
            tempServiceData['status'] = data?.status;
            tempServiceData['assetNumber'] = data?.workOrderDetail?.serializedAsset?.optionLabel;
            tempServiceData['assetId'] = data?.workOrderDetail?.serializedAsset?.optionValue;
            tempServiceData['workOrderId'] = data?.workOrderDetail?._id;
            tempServiceData['workOrderNumber'] = data?.workOrderDetail?.workOrderNumber;
            setSelectedService(tempServiceData);
            setServiceOpen(true);
          }}
        />
        {/* )} */}
      </Box>
      {serviceOpen && (
        <TechnicianDialog
          handleClose={() => {
            setServiceOpen(false);
            setSelectedService(null);
            fetchData();
          }}
          selectedService={selectedService}
        />
      )}
    </Box>
  );
};
export default WorkOrderTechnician;
