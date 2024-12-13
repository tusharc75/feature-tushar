import { Box, Checkbox, FormControlLabel, FormGroup, IconButton, Popover } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import AppsIcon from '@material-ui/icons/Apps';
import DonutLargeIcon from '@material-ui/icons/DonutLarge';
import RefreshIcon from '@material-ui/icons/Refresh';
import ViewListIcon from '@material-ui/icons/ViewList';
import React, { useEffect, useRef, useState } from 'react';
import { useData } from 'src/StateProvider/Provider';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CustomFilter from 'src/components/Helpers/CustomFilter';
import routes from 'src/components/Helpers/Routes';
import { WORKORDER_SERVICE_STATUS, WORKORDER_TECHNICIAN_SERVICE_STATUS, sidebarResource } from 'src/constants/helpers';
import CardView from './CardView';
import GridView from './GridView';

const FIELD_TO_FILTER = [
  {
    key: 'serviceMaster',
    fieldName: 'service',
    fieldLabel: sidebarResource.serviceMaster,
    resource: sidebarResource.serviceMaster,
    type: 'dropDown'
  },
  {
    key: 'workOrder',
    fieldName: '_id',
    fieldLabel: sidebarResource?.workOrder,
    resource: sidebarResource.workOrder,
    type: 'dropDown'
  },
  {
    key: 'repairOrder',
    fieldName: 'repairOrder',
    fieldLabel: sidebarResource?.repairOrder,
    resource: sidebarResource?.repairOrder,
    type: 'dropDown'
  },
  {
    key: 'productionOrder',
    fieldName: 'productionOrder',
    fieldLabel: sidebarResource?.productionOrder,
    resource: sidebarResource?.productionOrder,
    type: 'dropDown'
  }
];

const WorkOrderTechnician = () => {
  const {
    state: { permissions,resources }
  }: any = useData();

  const ref: any = useRef();

  const [viewType, setViewType] = useState(2);
  const [fieldToFilterList, setFieldToFilterList] = useState([]);
  const [selectedServiceStatus, setSelectedServiceStatus] = useState([
    WORKORDER_SERVICE_STATUS.pending,
    WORKORDER_SERVICE_STATUS.inProgress,
    WORKORDER_SERVICE_STATUS.completed
  ]);
  const [filterQuery, setFilterQuery] = useState({
    filterById: [],
    deepFilter: []
  });

  useEffect(() => {
    const options: any = [];
    FIELD_TO_FILTER?.forEach((item) => {
      if (permissions[item.key] && permissions[item.key]?.isRead === true) {
        options.push(item);
      }
    });
    setFieldToFilterList(options);
  }, []);

  const onClickRefreshIcon = () => {
    if (ref?.current) {
      ref?.current?.childFunction();
    }
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{...routes.workOrderTechnician,title:resources?.workOrderTechnician?.titlePlural}]} />
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Box className="flex items-center flex-wrap gap-2 justify-end mb-4">
          <Box className="flex-grow w-full min-[600px]:w-[unset] " mt={1}>
            <CustomFilter field={fieldToFilterList} setFilterQuery={setFilterQuery} />
          </Box>
          <StatusSelector selectedServiceStatus={selectedServiceStatus} setSelectedServiceStatus={setSelectedServiceStatus} />
          <HtmlTooltip title={`Card View`} arrow placement="top" enterTouchDelay={0}>
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setViewType(1);
              }}
            >
              <AppsIcon color={viewType === 1 ? 'primary' : 'disabled'} />
            </IconButton>
          </HtmlTooltip>
          <HtmlTooltip title={`Table View`} arrow placement="top" enterTouchDelay={0}>
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setViewType(2);
              }}
            >
              <ViewListIcon color={viewType === 2 ? 'primary' : 'disabled'} />
            </IconButton>
          </HtmlTooltip>
          <HtmlTooltip title={`Refresh`} arrow placement="top" enterTouchDelay={0}>
            <IconButton size="small" aria-label="Clone" onClick={onClickRefreshIcon}>
              <RefreshIcon color="primary" />
            </IconButton>
          </HtmlTooltip>
        </Box>
        {viewType === 1 && <CardView serviceStatus={selectedServiceStatus} filterQuery={filterQuery} ref={ref} />}
        {viewType === 2 && (
          <GridView serviceStatus={selectedServiceStatus} filterQuery={filterQuery} permissions={permissions?.workOrderTechnician} />
        )}
      </Box>
    </Box>
  );
};

export default WorkOrderTechnician;

type StatusSelectorProps = {
  selectedServiceStatus: string[];
  setSelectedServiceStatus: React.Dispatch<React.SetStateAction<string[]>>;
};

const StatusSelector: React.FC<StatusSelectorProps> = ({ selectedServiceStatus, setSelectedServiceStatus }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const isStatusSelectorOpen = Boolean(anchorEl);
  const handleStatusSelectorClose = () => {
    setAnchorEl(null);
  };
  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>, status) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedServiceStatus([...selectedServiceStatus, status]);
      return;
    }
    setSelectedServiceStatus(selectedServiceStatus.filter((s) => s !== status));
  };
  return (
    <>
      <HtmlTooltip title={`Select Status`} arrow placement="top" enterTouchDelay={0}>
        <IconButton size="small" aria-label="Status" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <DonutLargeIcon color="primary" />
        </IconButton>
      </HtmlTooltip>
      <Popover
        PaperProps={{
          className: 'w-[min(400px,100%)_!important]',
          style: {
            borderRadius: 0,
            boxShadow: '-4px 0px 40px 0px rgba(0, 0, 0, 0.06)'
          }
        }}
        open={isStatusSelectorOpen}
        anchorEl={anchorEl}
        onClose={handleStatusSelectorClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <div className="">
          <div className="[border-bottom:1px_solid_var(--common-border-color)] flex justify-between items-center px-[20px] py-[10px]">
            <h6 className="text-[16px] font-semibold">Status</h6>
            <HtmlTooltip title="Close" arrow placement="top" enterTouchDelay={0}>
              <IconButton size="small" onClick={handleStatusSelectorClose}>
                <Close />
              </IconButton>
            </HtmlTooltip>
          </div>
          <div className="p-[0_20px_20px]">
            {Object.values(WORKORDER_TECHNICIAN_SERVICE_STATUS).map((s) => {
              return (
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedServiceStatus?.includes(s)}
                        onChange={(e) => handleCheck(e, s)}
                        inputProps={{ 'aria-label': 'primary checkbox' }}
                      />
                    }
                    label={s}
                  />
                </FormGroup>
              );
            })}
          </div>
        </div>
      </Popover>
    </>
  );
};
