import React, { useRef, useState } from 'react';
import { Box, Checkbox, Chip, IconButton, TextField } from '@material-ui/core';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import AppsIcon from '@material-ui/icons/Apps';
import CloseIcon from '@material-ui/icons/Close';
import ViewListIcon from '@material-ui/icons/ViewList';
import RefreshIcon from '@material-ui/icons/Refresh';
import { WORKORDER_SERVICE_STATUS, WORKORDER_TECHNICIAN_SERVICE_STATUS, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import CardView from './CardView';
import GridView from './GridView';
import CustomFilter from 'src/components/Helpers/CustomFilter';
import { Autocomplete } from '@material-ui/lab';

const FIELD_TO_FILTER = [
  {
    fieldName: 'serviceMaster',
    fieldLabel: routes.serviceMaster.title,
    resource: sidebarResource.serviceMaster,
    type: 'dropDown'
  },
  {
    fieldName: 'workOrder',
    fieldLabel: routes.workOrder.title,
    resource: sidebarResource.workOrder,
    type: 'dropDown'
  },
  {
    fieldName: 'repairOrder',
    fieldLabel: routes.repairOrder.title,
    resource: sidebarResource.repairOrder,
    type: 'dropDown'
  },
  {
    fieldName: 'productionOrder',
    fieldLabel: routes.productionOrder.title,
    resource: sidebarResource.productionOrder,
    type: 'dropDown'
  }
];

const WorkOrderTechnician = () => {
  const {
    state: { permissions }
  }: any = useData();

  const ref: any = useRef();

  const [viewType, setViewType] = useState(1);
  const [selectedServiceStatus, setSelectedServiceStatus] = useState([
    WORKORDER_SERVICE_STATUS.pending,
    WORKORDER_SERVICE_STATUS.inProgress,
    WORKORDER_SERVICE_STATUS.completed
  ]);
  const [filterQuery, setFilterQuery] = useState({
    filterById: [],
    deepFilter: []
  });

  const onClickRefreshIcon = () => {
    if (ref?.current) {
      ref?.current?.childFunction();
    }
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.workOrderTechnician]} />
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Box display={'flex'} justifyContent={'end'} alignItems={'center'} mb={2}>
          <Box width={'100%'} mt={1}>
            <CustomFilter field={FIELD_TO_FILTER} setFilterQuery={setFilterQuery} />
          </Box>
          <Box ml={1}>
            <Autocomplete
              fullWidth
              multiple
              style={{ minWidth: '390px' }}
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
          <Box>
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setViewType(1);
              }}
            >
              <AppsIcon color={viewType === 1 ? 'primary' : 'disabled'} />
            </IconButton>
          </Box>
          <Box>
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setViewType(2);
              }}
            >
              <ViewListIcon color={viewType === 2 ? 'primary' : 'disabled'} />
            </IconButton>
          </Box>
          <Box>
            <IconButton size="small" aria-label="Clone" onClick={onClickRefreshIcon}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        {viewType === 1 && <CardView serviceStatus={selectedServiceStatus} filterQuery={filterQuery} ref={ref} />}
        {viewType === 2 && <GridView serviceStatus={selectedServiceStatus} filterQuery={filterQuery} />}
      </Box>
    </Box>
  );
};

export default WorkOrderTechnician;
