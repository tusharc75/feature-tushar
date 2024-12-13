import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Box, IconButton, MenuItem, useMediaQuery } from '@material-ui/core';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomContainer from 'src/components/CustomContainer';
import {
  GenerateResourceLineNumber,
  SERVICE_ORDER_STATUS,
  checkIsAllowedToEdit,
  cloneResourceData,
  fieldServiceOrder,
  getObjKeys,
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource,
  restoreObjKeysWithValues
} from 'src/constants/helpers';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { camelCase } from 'lodash';
import { ListingPageHeader } from 'src/components/PageHeaders';
import VisibilityIcon from '@material-ui/icons/Visibility';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useData } from 'src/StateProvider/Provider';
import { cloneDisable } from 'src/constants/messageHelpers';
import ViewFieldTicketDialog from './ViewFieldTicketDialog';
import NoteAddIcon from '@material-ui/icons/NoteAdd';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { findAll, findOne, insertUpdate, objectStore, setUpindexDB } from 'src/constants/indexdbhelper';
import { fieldServiceOrderAddOffline, fieldServiceOrderClearOffline } from '../FieldServiceOrder/Services/OfflineHelper';
import axios, { CancelTokenSource } from 'axios';
import { Apps, FormatListNumbered } from '@material-ui/icons';
import FieldTicket from '../FieldServiceOrder/FieldTicket';
import { useHistory } from 'react-router-dom';

type Views = 'card' | 'table';

const getActionColumn = ({ view, permissions, isSubmitting, handleCreateFieldTicket, setViewFieldTicket, data, resources }) => {
  return {
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
        {![SERVICE_ORDER_STATUS.closed]?.includes(row?.original?.status) && !row?.original?.quotation && (
          <HtmlTooltip title={permissions?.fieldTicket?.isCreate ? `Create ${resources?.fieldTicket?.titleSingular}` : cloneDisable}>
            <span>
              <IconButton
                size="small"
                aria-label="Add"
                disabled={permissions?.fieldTicket?.isCreate && !isSubmitting ? false : true}
                onClick={() => {
                  handleCreateFieldTicket(
                    row?.original?.orignalData,
                    data?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData)
                  );
                }}
              >
                <NoteAddIcon fontSize="small" color={permissions?.fieldTicket?.isCreate && !isSubmitting ? 'primary' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        )}
        {view === 'table' && (
          <Box>
            <HtmlTooltip title={`View ${resources?.fieldTicket?.titleSingular}`}>
              <span>
                <IconButton
                  size="small"
                  aria-label="View"
                  onClick={() => {
                    setViewFieldTicket({ open: true, data: row?.original?.orignalData });
                  }}
                >
                  <VisibilityIcon fontSize="small" color="primary" />
                </IconButton>
              </span>
            </HtmlTooltip>
          </Box>
        )}
      </>
    )
  };
};

const FieldServiceTechnician = () => {
  const isMobileView = useMediaQuery('(max-width:768px)');
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(sidebarResource.fieldServiceTechnician);
  const [view, setView] = useState<Views>('table');
  const [selectedData, setSelectedData] = useState(null);
  const [colData, setColData] = useState(null);
  const {
    state: { user, permissions,resources }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [columns, setColumns] = useState(null);
  const [viewFieldTicket, setViewFieldTicket] = useState({ open: false, data: null });

  const { generateColumns } = useColumns();
  const { isOffline } = useContext(CustomOfflineContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const history = useHistory();

  const isOfflineRef = useRef(isOffline);

  useEffect(() => {
    setUpindexDB();
    fetchColumns();
    isOfflineRef.current = isOffline;
  }, [isOffline]);

  const fetchColumns = async () => {
    let data;
    if (isOffline) {
      data = await findOne(objectStore.resource, sidebarResource.fieldServiceOrder);
    } else {
      const response = await axiosInstance().get(`/field?resource=${sidebarResource?.fieldServiceOrder}`);
      data = response?.data?.data;
      try {
        insertUpdate(objectStore.resource, sidebarResource.fieldServiceOrder, data);
      } catch (e) {
        console.error(`Field Service Order : ${e.message}`);
      }
    }
    setColData(data);
    const newColumns = [...generateColumns(renderedFrom, data, routes.fieldServiceOrderDetail.path), ...getStaticFields()];
    newColumns.push(getActionColumn({ view, permissions, isSubmitting, handleCreateFieldTicket, setViewFieldTicket, data,resources }));
    setColumns(newColumns);
  };

  const handleChangeFieldServiceOrderStatus = useCallback(
    (fieldServiceOrderId, status) => {
      if (isOfflineRef.current) return;
      axiosInstance()
        .patch(`${routes.fieldServiceOrder.path}/status/${fieldServiceOrderId}`, { status: status })
        .then(() => {})
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    },
    [toastConfig]
  );

  const handleCreateFieldTicket = useCallback(
    async (fieldServiceOrderData, fieldServiceOrderFields) => {
      setIsSubmitting(true);
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Field Ticket Creation In-Progress...'
      });
      var fieldTicketField: any = [];
      if (isOfflineRef.current) {
        fieldTicketField = await findOne(objectStore.resource, sidebarResource.fieldTicket);
      } else {
        const response = await axiosInstance().get(`/field?resource=${sidebarResource.fieldTicket}`);
        fieldTicketField = response?.data?.data;
      }
      fieldTicketField = fieldTicketField?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);

      const tempInitialData = getObjKeys('', fieldTicketField);
      tempInitialData['fieldTicketNumber'] = GenerateResourceLineNumber(fieldTicketField);
      const referenceData: any = cloneResourceData(fieldServiceOrderFields, fieldTicketField, fieldServiceOrderData, user.user?.brandCurrency);
      for (const key in referenceData) {
        tempInitialData[key] = referenceData[key];
      }
      if (fieldTicketField?.some((e) => e.fieldName === 'currency')) {
        tempInitialData['currency'] = user.user?.brandCurrency;
      }
      tempInitialData['fieldServiceOrder'] = fieldServiceOrderData?._id;

      if (isOfflineRef.current) {
        const _id: any = Math.floor(Math.random() * 1000000).toString();
        const data: any = restoreObjKeysWithValues(tempInitialData, fieldTicketField);
        data['_id'] = _id;
        await insertUpdate(objectStore.fieldTicket, _id, data);
        await insertUpdate(objectStore.offlineDataSync, _id, { type: 'fieldTicket', data: { ...tempInitialData, _id, offlineSyncStatus: 'new' } });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Field Ticket Created Successfully'
        });
        history.push(`${routes.fieldTicketDetail.path}/${_id}`);
        setIsSubmitting(false);
      } else {
        axiosInstance()
          .post(`${routes.fieldTicket?.path}`, tempInitialData)
          .then(({ data }) => {
            if (fieldServiceOrderData?.status === SERVICE_ORDER_STATUS.new) {
              handleChangeFieldServiceOrderStatus(fieldServiceOrderData?._id, SERVICE_ORDER_STATUS.inProgress);
            }
            window.open(`${routes.fieldTicketDetail.path}/${data?.data?._id}`);
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
            setIsSubmitting(false);
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
            setIsSubmitting(false);
          });
      }
    },
    [handleChangeFieldServiceOrderStatus, history, toastConfig, user.user?.brandCurrency]
  );

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    fetchData(cancelToken);
    return () => cancelToken.cancel();
  }, [page, limit, filters, sorting, showFilteredRecordsOnly, search, isOffline]);

  const fetchData = async (cancelToken?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    try {
      let data, count;
      if (isOffline) {
        data = await findAll(objectStore.fieldServiceOrder);
        count = data?.length || 0;
      } else {
        const queryString = getQueryString();
        const response = await axiosInstance().get(`${fieldServiceOrder.api}${queryString}`, { cancelToken: cancelToken?.token });
        data = response?.data?.data;
        count = response?.data?.count;
      }
      let rows = data?.map((u) => {
        let finalObject: any = prepareDataForGrid(u);
        finalObject.orignalData = u;
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: count });
    } catch (e) {
      toastConfig.setToastConfig(e);
    } finally {
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);
    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleAddOffline = async () => {
    const data: any = [];
    selectedRecords.forEach((element) => {
      data.push(element._id);
    });
    await fieldServiceOrderAddOffline(data);
    dispatch({ type: 'selection', selectedRecords: [] });
  };

  const handleRemoveoffline = async (ids: any[] = []) => {
    await fieldServiceOrderClearOffline(ids);
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem disabled={!selectedRecords.length} onClick={() => handleAddOffline()}>
          {`Add ${routes.fieldServiceOrder.title} Offline`}
        </MenuItem>
        <MenuItem
          disabled={!selectedRecords.length}
          onClick={() => handleRemoveoffline(selectedRecords?.map((e) => e._id))}
        >{`Clear Offline Data (${selectedRecords.length})`}</MenuItem>
        <MenuItem onClick={() => handleRemoveoffline()}>Clear All Offline Data</MenuItem>
      </>
    );
  };

  const onRowClick = (row) => {
    if (!selectedData || row._id !== selectedData._id) {
      setSelectedData(row);
      setAllowedToEdit(
        permissions?.fieldTicket?.isUpdate &&
          checkIsAllowedToEdit(user, sidebarResource.fieldTicket, row?.originaData) &&
          ![SERVICE_ORDER_STATUS.closed]?.includes(row?.orignalData?.status)
      );
    } else {
      setSelectedData(null);
      setAllowedToEdit(false);
    }
  };

  const handleViewChange = useCallback(
    (view: Views) => {
      setView(view);
      const updatedColumns = columns?.filter((c) => c.accessor !== 'action');
      updatedColumns.push(getActionColumn({ view, permissions, isSubmitting, handleCreateFieldTicket, setViewFieldTicket, data: colData, resources }));
      setColumns(updatedColumns);
    },
    [colData, columns, handleCreateFieldTicket, isSubmitting, permissions]
  );

  useEffect(() => {
    if (isMobileView && view === 'card') {
      handleViewChange('table');
    }
  }, [isMobileView, view, handleViewChange]);

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: resources?.fieldServiceTechnician?.titlePlural }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          isAddButtonVisible={false}
          rightSideContents={isMobileView ? null : <ViewButtons handleViewChange={handleViewChange} view={view} />}
          actionMenuItems={<ActionMenuItems />}
        />
        {columns ? (
          view === 'card' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[400px_1fr]">
              <div className="container-with-border p-[20px] md:min-h-[calc(100vh-200px)]">
                <CustomReactTable
                  showOnlyMobileView={true}
                  height={'calc(100vh - 200px)'}
                  columns={columns}
                  state={state}
                  dispatch={dispatch}
                  renderedFrom={renderedFrom}
                  refreshGrid={fetchData}
                  resource={sidebarResource.fieldServiceOrder}
                  showOnlyShowFilteredRecordSwitch={false}
                  hideSelection={true}
                  setWholeRowsCellColor={(row) =>
                    row._id === selectedData?._id
                      ? ' [box-shadow:inset_0px_0px_0px_3px_var(--new-theme-color)_!important]  transition-bg duration-300'
                      : ' transition-bg duration-300'
                  }
                  onRowClick={onRowClick}
                  showFilters={!isOffline}
                />
              </div>
              <div className="container-with-border p-[20px]">
                {selectedData ? (
                  <FieldTicket
                    serviceOrderData={selectedData?.orignalData}
                    setNextStep={() => {}}
                    allowedToEdit={allowedToEdit}
                    handleChangeStatus={() => {}}
                    resource={sidebarResource.fieldServiceTechnician}
                    enableGlobalSearch={false}
                    fetchServiceOrderData={() => {}}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <h6 className="text-xl text-gray-400">Please select a record</h6>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <CustomReactTable
                height={'calc(100vh - 200px)'}
                showOnlyMobileView={false}
                columns={columns}
                state={state}
                dispatch={dispatch}
                renderedFrom={renderedFrom}
                refreshGrid={fetchData}
                resource={sidebarResource.fieldServiceOrder}
                showOnlyShowFilteredRecordSwitch={true}
                showFilters={!isOffline}
                isClientSideGrid={isOffline ? true : false}
              />
            </>
          )
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {viewFieldTicket.open && (
        <ViewFieldTicketDialog
          onClose={() => {
            setViewFieldTicket({ open: false, data: null });
          }}
          serviceOrderData={viewFieldTicket?.data}
        />
      )}
    </section>
  );
};

export default FieldServiceTechnician;

const ViewButtons = ({ view, handleViewChange }) => {
  return (
    <div className="flex flex-nowrap gap-2">
      <HtmlTooltip title={'Card View'} placement="top" arrow enterTouchDelay={0}>
        <span>
          <IconButton size="small" onClick={() => handleViewChange('card')} disabled={view === 'card'}>
            <Apps color="primary" className={`${view === 'card' ? ' opacity-45' : ''}`} />
          </IconButton>
        </span>
      </HtmlTooltip>
      <HtmlTooltip title={'List View'} placement="top" arrow enterTouchDelay={0}>
        <span>
          <IconButton size="small" onClick={() => handleViewChange('table')} disabled={view === 'table'}>
            <FormatListNumbered color="primary" className={`${view === 'table' ? ' opacity-45' : ''}`} />
          </IconButton>
        </span>
      </HtmlTooltip>
    </div>
  );
};
