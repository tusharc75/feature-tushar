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
import { WORKORDER_TECHNICIAN_SERVICE_STATUS } from 'src/constants/helpers';
import CardColTimeline, { groupBy } from 'src/components/CardColTimeline';
import TechnicianDialog from './TechnicianDialog';

const useStyles = makeStyles(() => ({
  '.MuiGrid-spacing-xs-1': {
    width: 'calc(100vw + 14px)'
  },
  inputs: {
    boxShadow: '0px 4.74053px 23.7026px rgba(0, 0, 0, 0.06)'
  }
}));

const WorkOrderTechnician = () => {
  const classes = useStyles();

  const [serviceOpen, setServiceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceData, setServiceData] = useState([]);

  const [workOrderOptions, setWorkOrderOptions] = useState([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [repairOrderOptions, setRepairOrderOptions] = useState([]);
  const [selectedRepairOrder, setSelectedRepairOrder] = useState(null);

  const [loading, setLoading] = useState(false);
  const [selectedServiceStatus, setSelectedServiceStatus] = useState(['Pending', 'In-Progress', 'Completed']);

  const [cardData, setCardData] = useState(null);

  const {
    state: { permissions, user }
  }: any = useData();

  useEffect(() => {
    let data = serviceData
      .filter((item) => selectedServiceStatus.includes(item.status))
      .map((item) => {
        const newObj = { ...item };
        newObj['serviceName'] = item.service?.serviceName;
        newObj['workOrderNumber'] = item.workOrderDetail?.workOrderNumber;
        newObj['serializedAsset'] = item.workOrderDetail?.serializedAsset?.optionLabel;
        newObj['status'] = item.status;
        return newObj;
      });

    data = groupBy({ objectArray: data, property: 'status', sortBy: WORKORDER_TECHNICIAN_SERVICE_STATUS, columnsToKeep: selectedServiceStatus });
    setCardData(data);
  }, [serviceData, selectedServiceStatus]);

  useEffect(() => {
    fetchData();
  }, [selectedWorkOrder, selectedRepairOrder]);

  const fetchData = () => {
    setLoading(true);
    let api = `/work-order-technician`;
    if (selectedWorkOrder && selectedRepairOrder) {
      api = api + `?workOrder=${selectedWorkOrder.optionValue}&repairOrder=${selectedRepairOrder.optionValue}`;
    } else if (selectedWorkOrder) {
      api = api + `?workOrder=${selectedWorkOrder.optionValue}`;
    } else if (selectedRepairOrder) {
      api = api + `?repairOrder=${selectedRepairOrder.optionValue}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        if (!selectedRepairOrder && !selectedWorkOrder) {
          const workOrderOption = [];
          const repairOrderOption = [];
          data?.forEach((item: any) => {
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
          });
          setWorkOrderOptions(workOrderOption);
          setRepairOrderOptions(repairOrderOption);
        }
        setServiceData(data);
        if (selectedService) {
          const tempSelected = data?.find((e) => e._id === selectedService?.uniqueId && e?.service?._id === selectedService?._id);
          if (tempSelected) {
            let tempServiceData = tempSelected?.service;
            tempServiceData['uniqueId'] = tempSelected?._id;
            tempServiceData['status'] = tempSelected?.status;
            tempServiceData['assetNumber'] = tempSelected?.workOrderDetail?.serializedAsset?.optionLabel;
            tempServiceData['assetId'] = tempSelected?.workOrderDetail?.serializedAsset?.optionValue;
            tempServiceData['workOrderId'] = tempSelected?.workOrderDetail?._id;
            tempServiceData['warehouse'] = tempSelected?.workOrderDetail?.warehouse;
            setSelectedService(tempServiceData);
          }
        }
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
          {workOrderOptions && (
            <Box className={classes.inputs}>
              <Autocomplete
                options={workOrderOptions}
                fullWidth
                getOptionLabel={(option: any) => option.optionLabel}
                getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                value={selectedWorkOrder}
                onChange={(event, newValue) => {
                  setSelectedWorkOrder(newValue);
                }}
                size="small"
                renderInput={(params) => <TextField {...params} label={`Select Work Order`} variant="outlined" />}
              />
            </Box>
          )}

          {repairOrderOptions && (
            <Box className={classes.inputs}>
              <Autocomplete
                options={repairOrderOptions}
                fullWidth
                getOptionLabel={(option: any) => option.optionLabel}
                getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                value={selectedRepairOrder}
                onChange={(event, newValue) => {
                  setSelectedRepairOrder(newValue);
                }}
                size="small"
                renderInput={(params) => <TextField {...params} label={`Select Repair Order`} variant="outlined" />}
              />
            </Box>
          )}

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
            sm={6}
            md={4}
            lg={3}
            px={2}
            cardOnClick={(e, data) => {
              let tempServiceData = data?.service;
              tempServiceData['uniqueId'] = data?._id;
              tempServiceData['status'] = data?.status;
              tempServiceData['assetNumber'] = data?.workOrderDetail?.serializedAsset?.optionLabel;
              tempServiceData['assetId'] = data?.workOrderDetail?.serializedAsset?.optionValue;
              tempServiceData['workOrderId'] = data?.workOrderDetail?._id;
              tempServiceData['warehouse'] = data?.workOrderDetail?.warehouse;
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
