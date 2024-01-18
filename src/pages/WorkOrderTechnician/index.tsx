import React, { useEffect, useRef, useState } from 'react';
import { Box, Checkbox, Chip, IconButton, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import AppsIcon from '@material-ui/icons/Apps';
import ViewListIcon from '@material-ui/icons/ViewList';
import RefreshIcon from '@material-ui/icons/Refresh';
import CloseIcon from '@material-ui/icons/Close';
import { WORKORDER_SERVICE_STATUS, WORKORDER_TECHNICIAN_SERVICE_STATUS, sidebarResource } from 'src/constants/helpers';
import { camelCase } from 'lodash';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CardView from './CardView';
import GridView from './GridView';

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
  const {
    state: { permissions }
  }: any = useData();

  const ref: any = useRef();

  const [viewType, setViewType] = useState(1);
  const [resourceFilter, setResourceFilter] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedResourceFilter, setSelectedResourceFilter] = useState(null);
  const [workOrderOptions, setWorkOrderOptions] = useState([]);
  const [repairOrderOptions, setRepairOrderOptions] = useState([]);
  const [productionOrderOptions, setProductionOrderOptions] = useState([]);
  const [selectedServiceStatus, setSelectedServiceStatus] = useState([
    WORKORDER_SERVICE_STATUS.pending,
    WORKORDER_SERVICE_STATUS.inProgress,
    WORKORDER_SERVICE_STATUS.completed
  ]);

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

  const onClickRefreshIcon = (aaa) => {
    fetchData();
    if (ref?.current) {
      ref?.current?.childFunction();
    }
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.workOrderTechnician]} />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="flex flex-wrap justify-between align-items-center gap-4 w-full">
            <div className="flex gap-4 flex-wrap" style={{ width: '85%' }}>
              <Box>
                <Autocomplete
                  options={resourceFilter}
                  style={{ minWidth: '330px' }}
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
                <Box>
                  <Autocomplete
                    options={
                      selectedResource.resource === sidebarResource.workOrder
                        ? workOrderOptions
                        : selectedResource.resource === sidebarResource.repairOrder
                          ? repairOrderOptions
                          : selectedResource.resource === sidebarResource.productionOrder
                            ? productionOrderOptions
                            : []
                    }
                    style={{ minWidth: '330px' }}
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
              <Box>
                <Autocomplete
                  fullWidth
                  multiple
                  style={{ minWidth: '330px', maxWidth: '380px' }}
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
            </div>
            <div className="flex gap-[8px] justify-end" style={{ width: '10%' }}>
              <IconButton
                size="small"
                aria-label="Clone"
                onClick={() => {
                  setViewType(1);
                }}
              >
                <AppsIcon color={viewType === 1 ? 'primary' : 'disabled'} />
              </IconButton>
              <IconButton
                size="small"
                aria-label="Clone"
                onClick={() => {
                  setViewType(2);
                }}
              >
                <ViewListIcon color={viewType === 2 ? 'primary' : 'disabled'} />
              </IconButton>
              <IconButton size="small" aria-label="Clone" onClick={onClickRefreshIcon}>
                <RefreshIcon />
              </IconButton>
            </div>
          </div>
        </div>
        {viewType === 1 && (
          <CardView
            serviceStatus={selectedServiceStatus}
            resource={selectedResource}
            resourceData={selectedResourceFilter}
            ref={ref}
          />
        )}
        {viewType === 2 && <GridView
          serviceStatus={selectedServiceStatus}
          resource={selectedResource}
          resourceData={selectedResourceFilter}
        />}
      </CustomContainer>
    </section>
  );
};

export default WorkOrderTechnician;
