import { Box, Checkbox, FormControlLabel, FormGroup, IconButton, Popover } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import DonutLargeIcon from '@material-ui/icons/DonutLarge';
import RefreshIcon from '@material-ui/icons/Refresh';
import { camelCase } from 'lodash';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MdViewWeek } from 'react-icons/md';
import { TfiLayoutListThumbAlt } from 'react-icons/tfi';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ButtonMenu from 'src/components/ButtonMenu';
import { useCardReducer } from 'src/components/CardColTimeline';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import routes from 'src/components/Helpers/Routes';
import IconButtonTabs from 'src/components/IconButtonTabs';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { NewActionButtonProps } from 'src/components/PageHeaders/DetailsPageHeader/NewActionButton';
import {
  WORKORDER_SERVICE_STATUS,
  WORKORDER_TECHNICIAN_SERVICE_STATUS,
  sidebarResource,
  workOrder,
  workOrderIconMap
} from 'src/constants/helpers';
import CardView from './CardView';
import GridView, { GridViewRef } from './GridView';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { BiFilterAlt } from 'react-icons/bi';
import DisplayFilterChip from 'src/pages/Reports/tables/DisplayFilterChip';
import Filter from 'src/components/Filter';

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
  const gridViewRef = useRef<GridViewRef>();

  const selectedRecords = useMemo(() => [...cardSelectedRecords, ...tableSelectedRecords], [cardSelectedRecords, tableSelectedRecords]);

  const resetSelectedRecords = () => {
    dispatch({ type: 'selection', selectedRecords: [] });
    tableDispatch({ type: 'selection', selectedRecords: [] });
  };

  const {
    state: {
      permissions,
      resources,
      user: { user }
    }
  }: any = useData();

  const ref: any = useRef();

  const FIELD_TO_FILTER = [
    {
      fieldData: {
        _id: '630dc2429ec41869032395b2',
        fieldName: 'service',
        fieldLabel: resources?.serviceMaster?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.serviceMaster,
        resource: sidebarResource.workOrderTechnician,
        type: 'dropDown',
        order: 1,
        required: false,
        sectionName: 'Work Order Technician Filter',
        isTooltip: false,
        editAble: false,
        brand: user?.brand,
        roleType: 0,
        sectionProperties: ''
      },
      isRead: permissions && permissions?.serviceMaster ? permissions?.serviceMaster?.isRead : false,
      isCreate: permissions && permissions?.serviceMaster ? permissions?.serviceMaster?.isCreate : false,
      isUpdate: permissions && permissions?.serviceMaster ? permissions?.serviceMaster?.isUpdate : false
    },
    {
      fieldData: {
        _id: '630dc2429ec41869032395b3',
        fieldName: '_id',
        fieldLabel: resources?.workOrder?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.workOrder,
        resource: sidebarResource.workOrderTechnician,
        type: 'dropDown',
        order: 2,
        required: false,
        sectionName: 'Work Order Technician Filter',
        isTooltip: false,
        editAble: false,
        brand: user?.brand,
        roleType: 0,
        sectionProperties: ''
      },
      isRead: permissions && permissions?.workOrder ? permissions?.workOrder?.isRead : false,
      isCreate: permissions && permissions?.workOrder ? permissions?.workOrder?.isCreate : false,
      isUpdate: permissions && permissions?.workOrder ? permissions?.workOrder?.isUpdate : false
    },
    {
      fieldData: {
        _id: '630dc2429ec41869032395b4',
        fieldName: 'repairOrder',
        fieldLabel: resources?.repairOrder?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.repairOrder,
        resource: sidebarResource.workOrderTechnician,
        type: 'dropDown',
        order: 3,
        required: false,
        sectionName: 'Work Order Technician Filter',
        isTooltip: false,
        editAble: false,
        brand: user?.brand,
        roleType: 0,
        sectionProperties: ''
      },
      isRead: permissions && permissions?.repairOrder ? permissions?.repairOrder?.isRead : false,
      isCreate: permissions && permissions?.repairOrder ? permissions?.repairOrder?.isCreate : false,
      isUpdate: permissions && permissions?.repairOrder ? permissions?.repairOrder?.isUpdate : false
    },
    {
      fieldData: {
        _id: '630dc2429ec41869032395b5',
        fieldName: 'productionOrder',
        fieldLabel: resources?.productionOrder?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.productionOrder,
        resource: sidebarResource.workOrderTechnician,
        type: 'dropDown',
        order: 4,
        required: false,
        sectionName: 'Work Order Technician Filter',
        isTooltip: false,
        editAble: false,
        brand: user?.brand,
        roleType: 0,
        sectionProperties: ''
      },
      isRead: permissions && permissions?.productionOrder ? permissions?.productionOrder?.isRead : false,
      isCreate: permissions && permissions?.productionOrder ? permissions?.productionOrder?.isCreate : false,
      isUpdate: permissions && permissions?.productionOrder ? permissions?.productionOrder?.isUpdate : false
    }
  ];

  const [viewType, setViewType] = useState<ViewType>('table-view');
  const [tableViewStatus, setTableViewStatus] = useState<TableViewStatus>('Pending');
  const [selectedServiceStatus, setSelectedServiceStatus] = useState([
    WORKORDER_SERVICE_STATUS.pending,
    WORKORDER_SERVICE_STATUS.inProgress,
    WORKORDER_SERVICE_STATUS.completed
  ]);
  const [showFilter, setShowFilter] = useState(false);
  const [filterByIds, setFilterByIds] = useState([]);
  const [filterTerm, setFilterTerm] = useState({});
  const [filterQuery, setFilterQuery] = useState([]);
  const [showServiceCompleteConfirmBox, setShowServiceCompleteConfirmBox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onClickRefreshIcon = () => {
    if (viewType === 'card-view') {
      ref?.current?.childFunction();
    }
    if (viewType === 'table-view') {
      gridViewRef?.current?.refreshGrid();
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
        resetSelectedRecords();
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
    };
    return items;
  }, [selectedRecords]);

  const statusMenuItems = useMemo(() => {
    return [
      {
        label: WORKORDER_SERVICE_STATUS.pending,
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.pending,
        value: WORKORDER_SERVICE_STATUS.pending,
        startIcon: workOrderIconMap[WORKORDER_SERVICE_STATUS.pending]
      },
      {
        label: WORKORDER_SERVICE_STATUS.inProgress,
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.inProgress,
        value: WORKORDER_SERVICE_STATUS.inProgress,
        startIcon: workOrderIconMap[WORKORDER_SERVICE_STATUS.inProgress]
      },
      {
        label: WORKORDER_SERVICE_STATUS.completed,
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.completed,
        value: WORKORDER_SERVICE_STATUS.completed,
        startIcon: workOrderIconMap[WORKORDER_SERVICE_STATUS.completed]
      },
      {
        label: WORKORDER_SERVICE_STATUS.inProgressByOther,
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.inProgressByOther,
        value: WORKORDER_SERVICE_STATUS.inProgressByOther,
        startIcon: workOrderIconMap[WORKORDER_SERVICE_STATUS.inProgressByOther]
      }
    ];
  }, [tableViewStatus]);

  const getQueryString = (filterByIdsP = filterByIds) => {
    if (filterByIdsP?.length > 0) {
      const filterById = filterByIdsP
        ?.filter((f) => f?.term?.length > 0)
        ?.map((f) => {
          const term = filterTerm[f?.field] === '$nin' ? '$nin' : '$in';
          return {
            field: f?.field,
            term: {
              [term]: f?.term?.map?.((d: any) => d.optionValue)
            }
          };
        });
      if (filterById?.length > 0) {
        return filterById;
      }
    }
    return [];
  };

  const handleApplyFilter = (filterByIdsP = filterByIds) => {
    setShowFilter(false);
    const queryString = getQueryString(filterByIdsP);
    setFilterQuery(queryString);
  };

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
                  items={statusMenuItems}
                  onItemClick={(e, item) => {
                    setTableViewStatus(item.value);
                  }}
                >
                  <span className="flex items-center gap-2">
                    {workOrderIconMap[tableViewStatus]}
                    Status: {tableViewStatus}
                  </span>
                </ButtonMenu>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
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
                <IconButton size="small" onClick={onClickRefreshIcon} style={{ width: 32, height: 32 }}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            </div>
          </div>
          {viewType === 'card-view' && (
            <DetailsPageHeader
              isAddButtonVisible={false}
              isActionButtonVisible={false}
              isNewActionButtonVisible={selectedRecords.length > 0}
              newActionButtonProps={newActionButtonProps}
              actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
              leftSideContents={
                <div className="flex items-center gap-2">
                  <ThemeButton
                    tooltip="Apply Filters"
                    startIcon={<BiFilterAlt className="-ml-1 mr-1 mt-[1px]" />}
                    iconForMobile={<BiFilterAlt />}
                    onClick={() => {
                      setShowFilter(true);
                    }}
                    variant="outlined"
                  >
                    Show Filters
                  </ThemeButton>
                  <DisplayFilterChip
                    filterTerm={filterTerm}
                    resourceColumns={FIELD_TO_FILTER}
                    deepFilters={[]}
                    filterByIds={filterByIds}
                    fetchResourceData={(deepFilter, filterById) => {
                      handleApplyFilter(filterById);
                    }}
                    setDeepFilters={null}
                    setFilterByIds={setFilterByIds}
                  />
                </div>
              }
              hasXpadding={false}
              hasYpadding={false}
              className="pt-4"
            />
          )}
        </div>

        {viewType === 'card-view' && (
          <div className="pt-2">
            <CardView state={state} dispatch={dispatch} serviceStatus={selectedServiceStatus} filterQuery={filterQuery} ref={ref} />
          </div>
        )}
        {viewType === 'table-view' && (
          <div className="pt-4">
            <GridView
              renderedFrom={renderedFrom}
              state={tableState}
              tableHead={
                <DetailsPageHeader
                  isAddButtonVisible={false}
                  isActionButtonVisible={false}
                  isNewActionButtonVisible={selectedRecords.length > 0}
                  newActionButtonProps={newActionButtonProps}
                  actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
                  leftSideContents={
                    <div className="flex items-center gap-2">
                      <ThemeButton
                        tooltip="Apply Filters"
                        startIcon={<BiFilterAlt className="-ml-1 mr-1 mt-[1px]" />}
                        iconForMobile={<BiFilterAlt />}
                        onClick={() => {
                          setShowFilter(true);
                        }}
                        variant="outlined"
                      >
                        Show Filters
                      </ThemeButton>
                      <DisplayFilterChip
                        filterTerm={filterTerm}
                        resourceColumns={FIELD_TO_FILTER}
                        deepFilters={[]}
                        filterByIds={filterByIds}
                        fetchResourceData={(deepFilter, filterById) => {
                          handleApplyFilter(filterById);
                        }}
                        setDeepFilters={null}
                        setFilterByIds={setFilterByIds}
                      />
                    </div>
                  }
                  hasXpadding={false}
                  hasYpadding={false}
                />
              }
              ref={gridViewRef}
              dispatch={tableDispatch}
              status={tableViewStatus}
              filterQuery={filterQuery}
              permissions={permissions?.workOrderTechnician}
            />
          </div>
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
      {showFilter && (
        <Filter
          onClose={() => {
            setShowFilter(false);
            tableDispatch({ type: 'onlyFilter', filters: {} });
            dispatch({ type: 'setFilterQuery', filterQuery: '' });
          }}
          loading={false}
          filterTitle={resources?.workOrderTechnician?.titleSingular}
          resource={sidebarResource.workOrderTechnician}
          columns={FIELD_TO_FILTER}
          onApplyFilter={handleApplyFilter}
          deepFilters={[]}
          setDeepFilters={null}
          filterByIds={filterByIds}
          setFilterByIds={setFilterByIds}
          filterTerm={filterTerm}
          setFilterTerm={setFilterTerm}
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
