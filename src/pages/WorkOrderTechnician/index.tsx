import { Close, Description, Info } from '@mui/icons-material';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Checkbox, FormControlLabel, FormGroup, IconButton, Popover } from '@mui/material';
import axios, { CancelToken } from 'axios';
import { camelCase, groupBy } from 'lodash';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BiFilterAlt } from 'react-icons/bi';
import { FiExternalLink } from 'react-icons/fi';
import { MdViewWeek } from 'react-icons/md';
import { TfiLayoutListThumbAlt } from 'react-icons/tfi';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { FetchSingleColumnProps, useCardColTimeline } from 'src/components/CardColTimeline';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import Filter from 'src/components/Filter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import IconButtonTabs from 'src/components/IconButtonTabs';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { NewActionButtonProps } from 'src/components/PageHeaders/DetailsPageHeader/NewActionButton';
import {
  ATTACHMENT_TYPE,
  MATERIAL_TYPE,
  WORKORDER_SERVICE_STATUS,
  WORKORDER_TECHNICIAN_SERVICE_STATUS,
  WORK_ORDER_STATUS,
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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';
import ResourceFilter from 'src/pages/WorkOrderTechnician/ResourceFilter';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import WorkOrdersCompleteStepDialog from 'src/pages/WorkOrder/WorkOrdersCompleteStepDialog';
import BulkActionItems from './BulkActionItems';

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
  'productionOrder',
  'rentalJob'
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
  const { selectedCustomSubRows: tableSelectedRecords } = tableState;
  const gridViewRef = useRef<GridViewRef>();
  const [serviceOpen, setServiceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [columnsDef, setColumnsDef] = useState<TColType[]>(null);
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
  const [resourceData, setResourceData] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [workOrdersCompleteServicesDialog, setWorkOrdersCompleteServicesDialog] = useState({ open: false, workOrders: null });

  const resetSelectedRecords = () => {
    cardState.resetSelection();
    tableDispatch({ type: 'selection', selectedRecords: [] });
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.workOrderTechnician}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchSingleColumnData = useCallback(
    async ({ column, filterQuery, limit, page, resource, cancelToken }: FetchSingleColumnProps<any, Columns>) => {
      let api = `/work-order-technician?page=${page}&status=${column}&limit=${limit}`;
      if (resource) {
        api += `&type=${resource}`;
      }
      api += `${filterQuery}`;
      try {
        const response = await axiosInstance().get(api, { cancelToken });
        const {
          data: { data, count }
        } = response;
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['workOrderId'] = u?._id;
          finalObject['services'] =
            u.services?.map((d) => {
              let newData = {
                ...d,
                ...d.service,
                serviceId: d.service._id
              };
              delete newData['service'];
              newData['customServiceStatus'] = d?.status;
              newData['parentProductId'] = d?.parentProduct?._id;
              newData['parentProductName'] = d?.parentProduct?.productName;
              newData['parentProductDescription'] = d?.parentProduct?.productDescription;
              newData['_id'] = d._id;
              newData['uniqueId'] = d._id;
              newData['workOrderId'] = u?._id;
              return newData;
            }) || [];
          return { ...finalObject };
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
    const payload = {
      order: tableState.columnOrder,
      visible: tableState.visibleColumns
    };
    if (payload.order.length === 0) {
      payload.order = columnsDef?.map((d) => d.id || d.accessor) || [];
    }
    if (Object.keys(payload.visible).length === 0) {
      payload.visible =
        columnsDef?.reduce((acc, curr) => {
          acc[curr.id || curr.accessor] = true;
          return acc;
        }, {}) || {};
    }
    cardState.setOrderAndVisibility(payload);
  }, [tableState.columnOrder, tableState.visibleColumns, columnsDef]);

  useEffect(() => {
    cardState.setVisibleColumns(selectedServiceStatus);
  }, [selectedServiceStatus]);

  const selectedRecords = useMemo(() => [...tableSelectedRecords, ...cardState.selectedSubRows], [tableSelectedRecords, cardState.selectedSubRows]);

  const fetchGridColumns = async (cancelToken: CancelToken) => {
    try {
      const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource.workOrder, permissions?.workOrder?.isUpdate);
      const newColumns = generateColumns(renderedFrom, fieldsDataForRead, routes?.workOrderDetail?.path);
      newColumns?.forEach((ele) => {
        if (ele.accessor === 'workOrderNumber') {
          ele.defaultVisible = true;
          ele.Cell = ({ row }) => (
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
          );
        }
      });
      const finalColumns = [...newColumns, ActionsRenderer]?.map((c) => {
        const id = c?.id || c?.accessor;
        if (defaultVisibleRows.includes(id)) {
          c['defaultVisible'] = true;
        }
        if (id === 'workOrderNumber') {
          c['primaryField'] = true;
        }
        return c;
      });
      setColumnsDef(finalColumns);
      cardState.setColumnDef(finalColumns);
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

  const childColumns = useMemo(
    () => [
      {
        accessor: 'service',
        Header: 'Service',
        disabled: true,
        Cell: ({ row }) => (
          <>
            {row?.original?.serviceName ? (
              <div className="flex items-center">
                <h5
                  className="link text-truncate min-w-0 flex-shrink"
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
                {row?.original?.canPerformInfo ? (
                  <Box ml={1} className={'no-inherit flex-shrink-0'}>
                    <HtmlTooltip title={row?.original?.canPerformInfo} arrow placement="top" enterTouchDelay={0}>
                      <Info className="no-inherit !fill-red-500 [font-size:20px_!important]" />
                    </HtmlTooltip>
                  </Box>
                ) : null}

                {resourceData?.policy?.showWorkOrderPdfPreviewInTile && (
                  <Box ml={1}>
                    <HtmlTooltip title="Preview PDF">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePdfPreview(row?.original?.workOrderId, user, toastConfig);
                        }}
                      >
                        <PictureAsPdfIcon fontSize={'small'} color="primary" />
                      </IconButton>
                    </HtmlTooltip>
                  </Box>
                )}
                {row?.original?.priority && (
                  <Box ml={1}>
                    <HtmlTooltip title={`${row?.original?.priority} Priority`}>
                      <span
                        className={`no-inherit inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${
                          row?.original?.priority === 'High' ? 'bg-red-600' : row?.original?.priority === 'Low' ? 'bg-green-600' : 'bg-yellow-500'
                        } `}
                      >
                        {row?.original?.priority}
                      </span>
                    </HtmlTooltip>
                  </Box>
                )}
              </div>
            ) : (
              <NoDataCell />
            )}
          </>
        )
      },
      {
        accessor: 'parentProductName',
        Header: `Parent ${resources?.product?.titleSingular}`,
        defaultVisible: true,
        Cell: ({ row }) =>
          row.original['parentProductName'] ? (
            <div className="flex items-center">
              <p title={row?.original?.parentProductName}>{row?.original?.parentProductName}</p>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'parentProductDescription',
        Header: `Parent ${resources?.product?.titleSingular} Description`,
        defaultVisible: true,
        Cell: ({ row }) =>
          row.original['parentProductDescription'] ? (
            <div className="flex items-center gap-2">
              <p title={row?.original?.parentProductDescription}>{row?.original?.parentProductDescription}</p>
            </div>
          ) : (
            <NoDataCell />
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
    ],
    [permissions, resourceData?.policy?.showWorkOrderPdfPreviewInTile, resources?.product?.titleSingular, user]
  );

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

  const newActionButtonProps: NewActionButtonProps<string, any> = useMemo(() => {
    const items = {
      disabled: !selectedRecords?.length,
      items: [
        {
          disabled:
            selectedRecords?.length &&
            selectedRecords?.filter(
              (s) => s?.customServiceStatus === WORKORDER_SERVICE_STATUS.pending && s?.status !== WORK_ORDER_STATUS.onHold && s?.canPerform
            )?.length === selectedRecords?.length
              ? false
              : true,
          label: `Complete Service(s)`,
          onClick: () => {
            const groupedWorkOrder = groupBy(
              selectedRecords?.filter((e) => !!e?.workOrderId),
              'workOrderId'
            );
            const data: any = [];
            for (const workOrderId in groupedWorkOrder) {
              data.push({
                workOrder: workOrderId,
                services: groupedWorkOrder[workOrderId]
                  ?.filter((e) => e?.type === MATERIAL_TYPE.service)
                  ?.map((e) => ({ service: e?.serviceId, uniqueId: e?.uniqueId }))
              });
            }
            setWorkOrdersCompleteServicesDialog({ open: true, workOrders: data });
          }
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
    setFilterQuery((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(queryString)) {
        return prev;
      }
      return queryString;
    });
  };

  useEffect(() => {
    localStorage.setItem(`${renderedFrom}_view`, viewType);
  }, [viewType]);

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    fetchGridColumns(cancelToken.token);
    return () => cancelToken.cancel();
  }, [resourceData]);

  useEffect(() => {
    if (viewType === 'card-view') {
      cardState.setResource(selectedResource?.resource || '');
    }
  }, [selectedResource, viewType]);

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
              childColumns={childColumns}
              renderedFrom={renderedFrom}
              bulkActionItems={
                <BulkActionItems selectedRecords={selectedRecords} setWorkOrdersCompleteServicesDialog={setWorkOrdersCompleteServicesDialog} />
              }
              headerSlot={
                <>
                  <DetailsPageHeader
                    isAddButtonVisible={false}
                    isActionButtonVisible={false}
                    isNewActionButtonVisible={selectedRecords.length > 0}
                    newActionButtonProps={newActionButtonProps}
                    actionButtonProps={{ disabled: !selectedRecords?.length }}
                    leftSideContents={
                      <div className="flex w-full items-center gap-2">
                        <ResourceFilter
                          selectedResource={selectedResource}
                          setSelectedResource={setSelectedResource}
                          filterByIds={filterByIds}
                          setFilterByIds={setFilterByIds}
                          handleApplyFilter={handleApplyFilter}
                        />
                        <ThemeButton
                          mobileTooltip="Apply Filters"
                          startIcon={<BiFilterAlt className="ml-1 mr-1 mt-[1px]" />}
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
                          filterByIds={filterByIds?.filter((e) => e?.field === 'service')}
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
                </>
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
              childColumns={childColumns}
              columns={columnsDef}
              renderedFrom={renderedFrom}
              state={tableState}
              bulkActionItems={
                <BulkActionItems selectedRecords={selectedRecords} setWorkOrdersCompleteServicesDialog={setWorkOrdersCompleteServicesDialog} />
              }
              tableHead={
                <DetailsPageHeader
                  isAddButtonVisible={false}
                  className="flex-grow"
                  isActionButtonVisible={false}
                  // isNewActionButtonVisible={selectedRecords.length > 0}
                  // newActionButtonProps={newActionButtonProps}
                  // actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
                  leftSideContents={
                    <div className="flex w-full flex-wrap items-center gap-2">
                      <ResourceFilter
                        selectedResource={selectedResource}
                        setSelectedResource={setSelectedResource}
                        filterByIds={filterByIds}
                        setFilterByIds={setFilterByIds}
                        handleApplyFilter={handleApplyFilter}
                      />
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
                        filterByIds={filterByIds?.filter((e) => e?.field === 'service')}
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
              filterQuery={filterQuery}
              permissions={permissions?.workOrderTechnician}
              resource={selectedResource?.resource}
            />
          </div>
        )}
      </Box>
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
          resource={sidebarResource.workOrder}
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

      {workOrdersCompleteServicesDialog.open && (
        <WorkOrdersCompleteStepDialog
          workOrders={workOrdersCompleteServicesDialog.workOrders}
          onClose={() => setWorkOrdersCompleteServicesDialog({ open: false, workOrders: null })}
          onSuccess={() => {
            setWorkOrdersCompleteServicesDialog({ open: false, workOrders: null });
            onClickRefreshIcon();
          }}
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
