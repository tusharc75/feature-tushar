import { Box, Button, Checkbox, Chip, Grid, IconButton, makeStyles, TextField } from '@material-ui/core';
import { useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import { Autocomplete } from '@material-ui/lab';
import RefreshIcon from '@material-ui/icons/Refresh';
import React from 'react';
import { useData } from 'src/StateProvider/Provider';
import CloseIcon from '@material-ui/icons/Close';
import { sidebarResource, WORKORDER_SERVICE_STATUS, WORKORDER_TECHNICIAN_SERVICE_STATUS } from 'src/constants/helpers';
import CardColTimeline, { groupBy } from 'src/components/CardColTimeline';
import TechnicianDialog from './TechnicianDialog';
import { camelCase } from 'lodash';

const useStyles = makeStyles(() => ({
  '.MuiGrid-spacing-xs-1': {
    width: 'calc(100vw + 14px)'
  },
  inputs: {
    boxShadow: '0px 4.74053px 23.7026px rgba(0, 0, 0, 0.06)'
  }
}));

const RESOURCE = [
  {
    resource: sidebarResource.workOrder,
    title: routes.workOrder.title,
    fieldName: 'rentalJobName',
  },
  {
    resource: sidebarResource.repairOrder,
    title: routes.repairOrder.title,
    fieldName: 'repairOrder',
  },
  {
    resource: sidebarResource.productionOrder,
    title: routes.productionOrder.title,
    fieldName: 'repairOrder',
  }
]

const WorkOrderTechnician = () => {
  const classes = useStyles();

  const [serviceOpen, setServiceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceData, setServiceData] = useState([]);

  const [workOrderOptions, setWorkOrderOptions] = useState([]);
  const [repairOrderOptions, setRepairOrderOptions] = useState([]);
  const [productionOrderOptions, setProductionOrderOptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [selectedServiceStatus, setSelectedServiceStatus] = useState([
    WORKORDER_SERVICE_STATUS.pending,
    WORKORDER_SERVICE_STATUS.inProgress,
    WORKORDER_SERVICE_STATUS.completed
  ]);

  const [cardData, setCardData] = useState(null);

  const [resourceFilter, setResourceFilter] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null)
  const [selectedResourceFilter, setSelectedResourceFilter] = useState(null)

  const {
    state: { permissions, user }
  }: any = useData();

  useEffect(() => {
    const options: any = [];
    RESOURCE?.forEach((item) => {
      if (permissions[camelCase(item.resource)]) {
        options.push(item)
      }
    })
    setResourceFilter(options)
  }, [])

  useEffect(() => {
    let data = serviceData
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

    data = groupBy({ objectArray: data, property: 'status', sortBy: WORKORDER_TECHNICIAN_SERVICE_STATUS, columnsToKeep: selectedServiceStatus });
    setCardData(data);
  }, [serviceData, selectedServiceStatus]);

  useEffect(() => {
    fetchData();
  }, [selectedResourceFilter]);

  const fetchData = () => {
    setLoading(true);
    let api = `/work-order-technician`;
    if (selectedResource && selectedResourceFilter) {
      api = api + `?${camelCase(selectedResource?.resource)}=${selectedResourceFilter?.optionValue}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        if (!selectedResourceFilter) {
          const workOrderOption = [];
          const repairOrderOption = [];
          const productionOrderOption = [];
          data?.forEach((item: any) => {
            if (item?.workOrderDetail && !workOrderOption?.find((e) => e.optionValue === item?.workOrderDetail?._id)) {
              workOrderOption.push({ optionValue: item?.workOrderDetail?._id, optionLabel: item?.workOrderDetail?.workOrderNumber });
            }
            if (item?.workOrderDetail?.repairOrder && !repairOrderOption?.find((e) => e.optionValue === item?.workOrderDetail?.repairOrder?.optionValue)) {
              repairOrderOption.push({
                optionValue: item?.workOrderDetail?.repairOrder?.optionValue,
                optionLabel: item?.workOrderDetail?.repairOrder?.optionLabel
              });
            }
            if (item?.workOrderDetail?.productionOrder && !productionOrderOption?.find((e) => e.optionValue === item?.workOrderDetail?.productionOrder?.optionValue)) {
              productionOrderOption.push({
                optionValue: item?.workOrderDetail?.productionOrder?.optionValue,
                optionLabel: item?.workOrderDetail?.productionOrder?.optionLabel
              });
            }
          });
          setWorkOrderOptions(workOrderOption);
          setRepairOrderOptions(repairOrderOption);
          setProductionOrderOptions(productionOrderOption);
        }
        setServiceData(data);
        setLoading(false);
      })
      ?.catch((err) => {
        setLoading(false);
      });
  };

  const cardDataRows: any[] = [
    { accessor: 'serviceName', type: 'title' },
    { accessor: 'workOrderNumber', title: 'Work Order', type: 'text' },
    { accessor: 'serializedAsset', title: 'Asset', type: 'text' },
    { accessor: 'assignedWorkStations', title: 'Work Stations', type: 'text' },
    ...(user?.user?.brandPolicy?.workOrderTimer ? [{ accessor: 'stepData', title: 'Time', type: 'timer' }] : [])
  ];

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: routes.workOrderTechnician.title }]} />
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[4fr_4fr_6fr_auto] xl:grid-cols-[1fr_1fr_1fr_auto] items-start gap-4">
          <Box className={classes.inputs}>
            <Autocomplete
              options={resourceFilter}
              fullWidth
              disabled={loading}
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
          {
            selectedResource && (
              <Box className={classes.inputs}>
                <Autocomplete
                  options={selectedResource.resource === sidebarResource.workOrder ? workOrderOptions : selectedResource.resource === sidebarResource.repairOrder ? repairOrderOptions : productionOrderOptions}
                  disabled={loading}
                  fullWidth
                  getOptionLabel={(option: any) => option.optionLabel}
                  getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                  value={selectedResourceFilter}
                  onChange={(event, newValue) => {
                    setSelectedResourceFilter(newValue)
                  }}
                  size="small"
                  renderInput={(params) => <TextField {...params} label={`Select ${selectedResource.title}`} variant="outlined" />}
                />
              </Box>
            )
          }
          <Box className={classes.inputs}>
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
          <IconButton size="small" onClick={() => fetchData()} style={{ display: 'flex', marginTop: '4px', marginLeft: 'auto' }}>
            <RefreshIcon />
          </IconButton>
          <Box></Box>
        </Box>
        {cardData && (
          <CardColTimeline
            mt={3}
            data={cardData}
            loading={loading}
            cardDataRows={cardDataRows}
            passFailStatus={true}
            passFailAccessor="serviceStatus"
            // cardHeight={Boolean(user?.user?.brandPolicy?.workOrderTimer) ? 150 : 130}
            sm={6}
            md={4}
            lg={3}
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
        )}
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
