import { Box, Checkbox, FormControlLabel, FormGroup, IconButton, Popover } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import DonutLargeIcon from '@material-ui/icons/DonutLarge';
import RefreshIcon from '@material-ui/icons/Refresh';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useData } from 'src/StateProvider/Provider';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CustomFilter from 'src/components/Helpers/CustomFilter';
import routes from 'src/components/Helpers/Routes';
import { WORKORDER_SERVICE_STATUS, WORKORDER_TECHNICIAN_SERVICE_STATUS, sidebarResource, workOrder } from 'src/constants/helpers';
import CardView from './CardView';
import GridView from './GridView';
import IconButtonTabs from 'src/components/IconButtonTabs';
import { MdViewWeek } from 'react-icons/md';
import { TfiLayoutListThumbAlt } from 'react-icons/tfi';
import ButtonMenu from 'src/components/ButtonMenu';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { camelCase } from 'lodash';
import { useCardReducer } from 'src/components/CardColTimeline';
import { useTableReducer } from 'src/components/CustomReactTable';
import { NewActionButtonProps } from 'src/components/PageHeaders/DetailsPageHeader/NewActionButton';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

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

type ViewType = 'card-view' | 'table-view';
type TableViewStatus =
  | typeof WORKORDER_SERVICE_STATUS.pending
  | typeof WORKORDER_SERVICE_STATUS.inProgress
  | typeof WORKORDER_SERVICE_STATUS.completed
  | typeof WORKORDER_SERVICE_STATUS.inProgressByOther;

const renderedFrom = camelCase(sidebarResource?.workOrderTechnician);

const WorkOrderTechnician = () => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useCardReducer();
  const { selectedRecords: cardSelectedRecords } = state;
  const { state: tableState, dispatch: tableDispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords: tableSelectedRecords } = tableState;

  const selectedRecords = useMemo(() => [...cardSelectedRecords, ...tableSelectedRecords], [cardSelectedRecords, tableSelectedRecords]);

  const resetSelectedRecords = () => {
    dispatch({ type: 'selection', selectedRecords: [] });
    tableDispatch({ type: 'selection', selectedRecords: [] });
  };

  const {
    state: { permissions, resources }
  }: any = useData();

  const ref: any = useRef();

  const [viewType, setViewType] = useState<ViewType>('table-view');
  const [tableViewStatus, setTableViewStatus] = useState<TableViewStatus>('Pending');
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
  const [showServiceCompleteConfirmBox, setShowServiceCompleteConfirmBox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCompleteService = () => {
    setIsSubmitting(true);
    const data = selectedRecords
      ?.filter((s) => s?.status === WORKORDER_SERVICE_STATUS.pending && s?.canPerform)
      ?.map((_s) => ({
        workOrder: _s?.workOrderDetail?._id,
        service: _s?.materialId,
        uniqueId: _s?._id,
        status: WORKORDER_SERVICE_STATUS.completed
      }));
    axiosInstance()
      .put(`${workOrder.api}/service/work-orders-services-status`, data)
      .then(({ data }) => {
        setIsSubmitting(false);
        setShowServiceCompleteConfirmBox(false);
        dispatch({ type: 'selection', selectedRecords: [] });
        onClickRefreshIcon();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const newActionButtonProps: NewActionButtonProps<string> = useMemo(() => {
    const items = {
      disabled: selectedRecords?.length === 0,
      items: [
        ...(['card-view']?.includes(viewType)
          ? [
              {
                disabled:
                  selectedRecords?.length &&
                  selectedRecords?.filter((s) => s?.status === WORKORDER_SERVICE_STATUS.pending && s?.canPerform)?.length === selectedRecords?.length
                    ? false
                    : true,
                label: `Complete Service(s)`,
                onClick: () => setShowServiceCompleteConfirmBox(true)
              }
            ]
          : [])
      ]
    };
    return items;
  }, [selectedRecords, viewType]);

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ ...routes.workOrderTechnician, title: resources?.workOrderTechnician?.titlePlural }]} />
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <div className="header-panel pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-2">
              {viewType === 'table-view' && (
                <ButtonMenu
                  showChevron={true}
                  items={[
                    { label: WORKORDER_SERVICE_STATUS.pending, selected: tableViewStatus === WORKORDER_SERVICE_STATUS.pending },
                    { label: WORKORDER_SERVICE_STATUS.inProgress, selected: tableViewStatus === WORKORDER_SERVICE_STATUS.inProgress },
                    { label: WORKORDER_SERVICE_STATUS.completed, selected: tableViewStatus === WORKORDER_SERVICE_STATUS.completed },
                    { label: WORKORDER_SERVICE_STATUS.inProgressByOther, selected: tableViewStatus === WORKORDER_SERVICE_STATUS.inProgressByOther }
                  ]}
                  onItemClick={(e, item) => {
                    setTableViewStatus(item.label);
                  }}
                >
                  Status: {tableViewStatus}
                </ButtonMenu>
              )}
            </div>
            <div className="flex flex-grow items-center gap-2 max-[600px]:flex-wrap">
              <div className="flex-grow">
                <CustomFilter field={fieldToFilterList} setFilterQuery={setFilterQuery} />
              </div>
              {viewType === 'card-view' && (
                <StatusSelector selectedServiceStatus={selectedServiceStatus} setSelectedServiceStatus={setSelectedServiceStatus} />
              )}
              <IconButtonTabs
                onItemClick={resetSelectedRecords}
                items={
                  [
                    {
                      value: 'card-view',
                      icon: <MdViewWeek />,
                      tooltip: 'Card View'
                    },
                    {
                      value: 'table-view',
                      icon: <TfiLayoutListThumbAlt />,
                      tooltip: 'Table View'
                    }
                  ] as const
                }
                setValue={setViewType}
                value={viewType}
              />
              <HtmlTooltip title={'Refresh'}>
                <IconButton size="small" onClick={onClickRefreshIcon} style={{ display: 'flex', marginLeft: 'auto' }}>
                  <RefreshIcon />
                </IconButton>
              </HtmlTooltip>
            </div>
          </div>
          <div className="min-h-[48px]">
            <DetailsPageHeader
              isAddButtonVisible={false}
              isActionButtonVisible={false}
              isNewActionButtonVisible={selectedRecords.length > 0}
              newActionButtonProps={newActionButtonProps}
              actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
              hasXpadding={false}
            />
          </div>
        </div>

        {viewType === 'card-view' && (
          <CardView state={state} dispatch={dispatch} serviceStatus={selectedServiceStatus} filterQuery={filterQuery} ref={ref} />
        )}
        {viewType === 'table-view' && (
          <GridView
            renderedFrom={renderedFrom}
            state={tableState}
            dispatch={tableDispatch}
            status={tableViewStatus}
            filterQuery={filterQuery}
            permissions={permissions?.workOrderTechnician}
          />
        )}
      </Box>
      {showServiceCompleteConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isSubmitting}
          open={showServiceCompleteConfirmBox}
          message={`Are you sure you want to Complete this Service(s)`}
          onClose={() => {
            setShowServiceCompleteConfirmBox(false);
          }}
          onOk={handleCompleteService}
        />
      )}
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
          <div className="flex items-center justify-between px-[20px] py-[10px] [border-bottom:1px_solid_var(--common-border-color)]">
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
