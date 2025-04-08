import { Close, Description, Info } from '@mui/icons-material';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Checkbox, FormControlLabel, FormGroup, IconButton, Popover } from '@mui/material';
import axios, { CancelToken } from 'axios';
import { camelCase } from 'lodash';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BiFilterAlt } from 'react-icons/bi';
import { FiExternalLink } from 'react-icons/fi';
import { MdViewWeek } from 'react-icons/md';
import { TfiLayoutListThumbAlt } from 'react-icons/tfi';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { FetchSingleColumnProps, useCardColTimeline } from 'src/components/CardColTimeline1';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import Filter from 'src/components/Filter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import IconButtonTabs from 'src/components/IconButtonTabs';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { NewActionButtonProps } from 'src/components/PageHeaders/DetailsPageHeader/NewActionButton';
import {
  ACTIVITY_RESOURCE,
  ATTACHMENT_TYPE,
  WORKORDER_SERVICE_STATUS,
  WORKORDER_TECHNICIAN_SERVICE_STATUS,
  prepareDataForGrid,
  sidebarResource,
  workOrder
} from 'src/constants/helpers';
import DisplayFilterChip from 'src/pages/Reports/tables/DisplayFilterChip';
import DiagramDialog from 'src/pages/WorkOrder/Diagram/DiagramDialog';
import TechnicianDialog from 'src/pages/WorkOrderTechnician/TechnicianDialog';
import CardView from './CardView';
import GridView, { GridViewRef } from './GridView';
import { handlePdfPreview } from 'src/pages/WorkOrderSupervisor/helper';

type Columns = typeof WORKORDER_TECHNICIAN_SERVICE_STATUS;

type ViewType = 'card-view' | 'table-view';

const renderedFrom = camelCase(sidebarResource?.workOrderTechnician);

const defaultVisibleRows = [
  'workOrderNumber',
  'createDate',
  'estimateCompleteDate',
  'serializedAsset',
  'product',
  'package',
  'repairOrder',
  'assemblyOrder',
  'productionOrder'
];

const keyGetter = (d: any) => d?.['_id'] as string;

const WorkOrderTechnician = () => {
  const {
    state: {
      permissions,
      resources,
      user: { user }
    }
  }: any = useData();
  const { generateColumns } = useColumns();
  const toastConfig = useContext(CustomToastContext);
  const { state: tableState, dispatch: tableDispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords: tableSelectedRecords } = tableState;
  const gridViewRef = useRef<GridViewRef>();
  const [serviceOpen, setServiceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [columnsDef, setColumnsDef] = useState(null);
  const history = useHistory();
  const [showDrawingDialog, setShowDrawingDialog] = useState({ open: false, workOrder: null });
  const [selectedServiceStatus, setSelectedServiceStatus] = useState<any[]>([
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

  const resetSelectedRecords = () => {
    cardState.resetSelection();
    tableDispatch({ type: 'selection', selectedRecords: [] });
  };

  const fetchSingleColumnData = useCallback(
    async ({ column, filterQuery, limit, page, cancelToken }: FetchSingleColumnProps<any, Columns>) => {
      const api = `/work-order-technician?page=${page}&status=${column}&limit=${limit}${filterQuery}`;
      try {
        const response = await axiosInstance().get(api, { cancelToken });
        const {
          data: { data, count }
        } = response;
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          let workOrderDetailData: any = prepareDataForGrid(u?.workOrderDetail, user);
          finalObject['serviceName'] = u?.service?.serviceName;
          finalObject['serviceId'] = u?.service?._id;
          finalObject['customServiceStatus'] = u?.status;
          finalObject['workOrderId'] = u?.workOrderDetail?._id;
          finalObject['uniqueId'] = u?._id;
          delete workOrderDetailData?._id;
          delete workOrderDetailData?.id;
          return { ...finalObject, ...workOrderDetailData };
        });
        return { data: rows, count } as { data: any; count: number };
      } catch (error) {
        throw error;
      }
    },
    [user]
  );

  const cardState = useCardColTimeline({
    fetchSingleColumn: fetchSingleColumnData,
    columns: WORKORDER_TECHNICIAN_SERVICE_STATUS,
    initialVisibleColumns: selectedServiceStatus,
    columnDef: columnsDef,
    keyGetter
  });

  useEffect(() => {
    cardState.setColumnDef(columnsDef);
  }, [columnsDef]);

  useEffect(() => {
    cardState.setOrderAndVisibility({ order: tableState.columnOrder, visible: tableState.visibleColumns });
  }, [tableState.columnOrder, tableState.visibleColumns]);

  useEffect(() => {
    cardState.setVisibleColumns(selectedServiceStatus);
  }, [selectedServiceStatus]);

  const selectedRecords = useMemo(() => [...tableSelectedRecords, ...cardState.selectedRecords], [tableSelectedRecords, cardState.selectedRecords]);

  const fetchGridColumns = async (cancelToken: CancelToken) => {
    try {
      let data;
      const response = await axiosInstance().get(`/field?resource=${sidebarResource['workOrder']}&view=true`, { cancelToken });
      data = response?.data?.data;

      const newColumns = generateColumns(renderedFrom, data, routes?.workOrderDetail?.path);
      const columns = newColumns.filter((ele) => ele.accessor !== 'workOrderNumber');

      const extraColumns = [
        {
          accessor: 'service',
          Header: 'Service',
          disabled: true,
          Cell: ({ row }) => (
            <>
              {row?.original?.serviceName ? (
                <div>
                  <h5
                    className="link text-truncate"
                    onClick={() => {
                      setSelectedService({
                        uniqueId: row?.original?._id,
                        workOrderId: row?.original?.workOrderId,
                        canPerform: row?.original?.canPerform
                      });
                      setServiceOpen(true);
                    }}
                  >
                    {row.original.serviceName}
                  </h5>
                  <HtmlTooltip title="Preview PDF">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePdfPreview(row?.original?.workOrderId, user, toastConfig);
                      }}
                    >
                      <Info fontSize="small" color={'primary'} />
                    </IconButton>
                  </HtmlTooltip>
                  <Box ml={1}>
                    {row?.original?.canPerformInfo ? (
                      <HtmlTooltip title={row?.original?.canPerformInfo} arrow placement="top" enterTouchDelay={0}>
                        <Info className="text-red-500 [font-size:20px_!important]" />
                      </HtmlTooltip>
                    ) : null}
                  </Box>
                </div>
              ) : (
                <NoDataCell />
              )}
            </>
          )
        },
        {
          accessor: 'workOrderNumber',
          Header: 'Work Order Number',
          defaultVisible: true,
          Cell: ({ row }) => (
            <div className="flex items-center gap-1">
              <p title={row?.original?.workOrderNumber}>{row?.original?.workOrderNumber}</p>
              {row.original['workOrderNumber'] ? (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`${routes.workOrderDetail.path}/${row?.original?.workOrderId}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              ) : (
                <NoDataCell />
              )}
            </div>
          )
        },
        {
          accessor: 'assignedWorkStations',
          Header: 'Work Stations',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) =>
            row.original['assignedWorkStations'] ? (
              <DropdownCell
                permissions={permissions}
                permissionForLinks={{}}
                field={{
                  fieldName: 'assignedWorkStations',
                  lookupResource: sidebarResource.workStations
                }}
                original={row?.original}
              />
            ) : (
              <NoDataCell />
            )
        }
      ];
      const finalColumns = [...extraColumns.slice(0, 2), ...columns, ...extraColumns.slice(2), ActionsRenderer].map((c) => {
        const id = c.id || c.accessor;
        if (defaultVisibleRows.includes(id)) {
          return { ...c, defaultVisible: true };
        }
        return c;
      });
      setColumnsDef(finalColumns);
    } catch (error) {
      console.error(error);
    }
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        {row?.original?.productionOrderId && (
          <HtmlTooltip title="Drawings">
            <IconButton
              size="small"
              aria-label="Details"
              color="primary"
              onClick={(e) => {
                setShowDrawingDialog({ open: true, workOrder: row?.original?.workOrderId });
              }}
            >
              <Description fontSize="small" color={'primary'} />
            </IconButton>
          </HtmlTooltip>
        )}
      </>
    )
  };

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
    },
    {
      fieldData: {
        _id: '630dc2429ea41869032395b5',
        fieldName: 'assemblyOrder',
        fieldLabel: resources?.assemblyOrder?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.assemblyOrder,
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
      isRead: permissions && permissions?.assemblyOrder ? permissions?.assemblyOrder?.isRead : false,
      isCreate: permissions && permissions?.assemblyOrder ? permissions?.assemblyOrder?.isCreate : false,
      isUpdate: permissions && permissions?.assemblyOrder ? permissions?.assemblyOrder?.isUpdate : false
    }
  ];

  const [viewType, setViewType] = useState<ViewType>(() => {
    return (localStorage.getItem(`${renderedFrom}_view`) as ViewType) || 'card-view';
  });

  const onClickRefreshIcon = () => {
    if (viewType === 'card-view') {
      cardState.refreshAllColumns();
    }
    if (viewType === 'table-view') {
      gridViewRef?.current?.refreshGrid();
    }
  };

  const handleCompleteService = () => {
    setIsSubmitting(true);
    const data = selectedRecords
      ?.filter((s) => s?.customServiceStatus === WORKORDER_SERVICE_STATUS.pending && s?.canPerform)
      ?.map((_s) => ({
        workOrder: _s?.workOrderId,
        service: _s?.materialId,
        uniqueId: _s?.uniqueId,
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

  const newActionButtonProps: NewActionButtonProps<string, any> = useMemo(() => {
    const items = {
      disabled: selectedRecords?.length === 0,
      items: [
        {
          disabled:
            selectedRecords?.length &&
              selectedRecords?.filter((s) => s?.customServiceStatus === WORKORDER_SERVICE_STATUS.pending && s?.canPerform)?.length ===
              selectedRecords?.length
              ? false
              : true,
          label: `Complete Service(s)`,
          onClick: () => setShowServiceCompleteConfirmBox(true)
        }
      ]
    };
    return items;
  }, [selectedRecords, viewType]);

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

  useEffect(() => {
    localStorage.setItem(`${renderedFrom}_view`, viewType);
  }, [viewType]);

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    fetchGridColumns(cancelToken.token);
    return () => cancelToken.cancel();
  }, []);

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ ...routes.workOrderTechnician, title: resources?.workOrderTechnician?.titlePlural }]} />
        </Box>
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
      </Box>
      <Box className={`detail-container-v1`}>
        {viewType === 'card-view' && (
          <>
            <CardView
              renderedFrom={renderedFrom}
              headerSlot={
                <DetailsPageHeader
                  isAddButtonVisible={false}
                  isActionButtonVisible={false}
                  isNewActionButtonVisible={selectedRecords.length > 0}
                  newActionButtonProps={newActionButtonProps}
                  actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
                  leftSideContents={
                    <div className="flex items-center gap-2">
                      <ThemeButton
                        mobileTooltip="Apply Filters"
                        startIcon={<BiFilterAlt className="-ml-1 mr-1 mt-[1px]" />}
                        iconForMobile={<BiFilterAlt />}
                        onClick={() => {
                          setShowFilter(true);
                        }}
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
              state={cardState}
              setSelectedService={setSelectedService}
              setServiceOpen={setServiceOpen}
              filterQuery={filterQuery}
            />
          </>
        )}
        {viewType === 'table-view' && (
          <div className="">
            <GridView
              columns={columnsDef}
              renderedFrom={renderedFrom}
              state={tableState}
              tableHead={
                <DetailsPageHeader
                  isAddButtonVisible={false}
                  className="flex-grow"
                  isActionButtonVisible={false}
                  isNewActionButtonVisible={selectedRecords.length > 0}
                  newActionButtonProps={newActionButtonProps}
                  actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
                  leftSideContents={
                    <>
                      <ThemeButton
                        mobileTooltip="Apply Filters"
                        startIcon={<BiFilterAlt className="-ml-1 mr-1 mt-[1px]" />}
                        iconForMobile={<BiFilterAlt />}
                        onClick={() => {
                          setShowFilter(true);
                        }}
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
                    </>
                  }
                  hasXpadding={false}
                  hasYpadding={false}
                />
              }
              ref={gridViewRef}
              dispatch={tableDispatch}
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
            cardState.setFilterQuery('');
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
      {showDrawingDialog.open && (
        <DiagramDialog
          referenceId={showDrawingDialog.workOrder}
          handleClose={() => {
            setShowDrawingDialog({ open: false, workOrder: null });
          }}
          resource={ACTIVITY_RESOURCE.workOrder}
          attachmentType={ATTACHMENT_TYPE.drawing}
        />
      )}

      {serviceOpen && (
        <TechnicianDialog
          handleClose={() => {
            setServiceOpen(false);
            setSelectedService(null);
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
