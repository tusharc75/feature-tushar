import { useContext, useEffect, useMemo, useState } from 'react';
import { Box, IconButton, MenuItem } from '@material-ui/core';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomContainer from 'src/components/CustomContainer';
import {
  GenerateResourceLineNumber,
  SERVICE_ORDER_STATUS,
  cloneResourceData,
  fieldServiceOrder,
  getObjKeys,
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource
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
import { clearAll, findAll, findOne, insertUpdate, objectStore } from 'src/constants/indexdbhelper';
import { fieldServiceOfflineUpdate } from '../FieldServiceOrder/Services/OfflineHelper';
import axios, { CancelTokenSource } from 'axios';
import { Apps, FormatListNumbered } from '@material-ui/icons';
import FieldTicket from '../FieldServiceOrder/FieldTicket';

let serchtimeTimeout;

type Views = 'card' | 'table';

const FieldServiceTechnician = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.fieldServiceTechnician.title);
  const [view, setView] = useState<Views>('card');
  const [selectedData, setSelectedData] = useState(null);
  const {
    state: { user, permissions }
  }: any = useData();
  const { state, dispatch } = useTableReducer();
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [columns, setColumns] = useState(null);
  const [viewFieldTicket, setViewFieldTicket] = useState({ open: false, data: null });

  const { generateColumns } = useColumns();
  const { isOffline } = useContext(CustomOfflineContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [allowedToEdit, setAllowedToEdit] = useState(false);

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    fetchColumns(cancelToken);
    return () => cancelToken.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchColumns = async (cancelToken?: CancelTokenSource) => {
    let data;
    if (isOffline) {
      data = await findOne(objectStore.resource, objectStore.fieldServiceOrder);
    } else {
      const response = await axiosInstance().get(`/field?resource=${sidebarResource?.fieldServiceOrder}`, { cancelToken: cancelToken.token });
      data = response?.data?.data;
    }
    try {
      insertUpdate(objectStore.resource, objectStore.fieldServiceOrder, data);
    } catch (e) {}
    const newColumns = [...generateColumns(renderedFrom, data, routes.fieldServiceOrderDetail.path), ...getStaticFields()];
    newColumns.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      isVisible: false,
      canDrag: false,
      Cell: ({ row }) => (
        <>
          <HtmlTooltip title={permissions?.fieldTicket?.isCreate ? `Create ${routes.fieldTicket.title}` : cloneDisable}>
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
          <Box pl={1}>
            <HtmlTooltip title={`View ${routes.fieldTicket.title}`}>
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
        </>
      )
    });
    setColumns(newColumns);
  };

  const handleCreateFieldTicket = async (data, fieldServiceOrderFields) => {
    setIsSubmitting(true);
    var fieldTicketField: any = [];
    if (isOffline) {
      fieldTicketField = await findOne(objectStore.resource, objectStore.fieldTicket);
    } else {
      const response = await axiosInstance().get('/field?resource=Field Ticket');
      fieldTicketField = response?.data?.data;
    }
    fieldTicketField = fieldTicketField?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);

    const tempInitialData = getObjKeys('', fieldTicketField);
    tempInitialData['fieldTicketNumber'] = GenerateResourceLineNumber(fieldTicketField);
    const referenceData: any = cloneResourceData(fieldServiceOrderFields, fieldTicketField, data);
    for (const key in referenceData) {
      tempInitialData[key] = referenceData[key];
    }
    if (fieldTicketField?.some((e) => e.fieldName === 'currency')) {
      tempInitialData['currency'] = user.user?.brandCurrency;
    }
    tempInitialData['fieldServiceOrder'] = data?._id;

    axiosInstance()
      .post(`${routes.fieldTicket?.path}`, tempInitialData)
      .then(({ data }) => {
        window.open(`${routes.fieldTicket.path}/detail/${data?.data?._id}`);
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
  };

  useEffect(() => {}, [search]);

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    fetchData(cancelToken);
    return () => cancelToken.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, filters, sorting, showFilteredRecordsOnly, search]);

  const fetchData = async (cancelToken?: CancelTokenSource) => {
    try {
      dispatch({ type: 'loading', loading: true });
      let data, count;
      if (isOffline) {
        data = await findAll(objectStore.fieldServiceOrder);
        count = data?.length || 0;
      } else {
        const queryString = getQueryString();
        const response = await axiosInstance().get(`${fieldServiceOrder.api}${queryString}`, { cancelToken: cancelToken.token });
        data = response?.data?.data;
        count = response?.data?.count;
      }
      let rows = data?.map((u) => {
        let finalObject: any = prepareDataForGrid(u);
        finalObject.orignalData = u;
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (e) {
      toastConfig.setToastConfig(e);
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
    await fieldServiceOfflineUpdate(data);
    axiosInstance()
      .get(`/field?resource=${sidebarResource.fieldTicket}`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, objectStore.fieldTicket, data);
      });
    dispatch({ type: 'selection', selectedRecords: [] });
  };

  const handleRemoveoffline = async () => {
    await clearAll(objectStore.fieldServiceOrder);
    await clearAll(objectStore.fieldTicket);
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem disabled={!selectedRecords.length} onClick={() => handleAddOffline()}>
          Add Offline
        </MenuItem>
        <MenuItem onClick={() => handleRemoveoffline()}>Clear All Offline Data</MenuItem>
      </>
    );
  };

  const onRowClick = (row) => {
    if (!selectedData || row._id !== selectedData._id) {
      setSelectedData(row);
      var isAllowedToEdit = [...(row?.orignalData?.collaborator ?? []), row?.orignalData?.owner].some((d) => d?.optionValue === user?.user?._id);
      if (user?.role?.selectedEntity?.superAdminAccess) {
        isAllowedToEdit = true;
      }
      setAllowedToEdit(permissions?.fieldTicket?.isUpdate && isAllowedToEdit && ![SERVICE_ORDER_STATUS.closed]?.includes(row?.orignalData?.status));
    } else {
      setSelectedData(null);
      setAllowedToEdit(false);
    }
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.fieldServiceTechnician.title }]} />
      </div>

      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          isAddButtonVisible={false}
          rightSideContents={<ViewButtons setView={setView} view={view} />}
          actionMenuItems={<ActionMenuItems />}
        />
        {columns ? (
          view === 'card' ? (
            <div className="grid md:grid-cols-[400px_1fr] grid-cols-1 gap-4">
              <div className="container-with-border p-[20px]">
                <CustomReactTable
                  height={'calc(100vh - 200px)'}
                  showOnlyMobileView={true}
                  columns={columns}
                  state={state}
                  dispatch={dispatch}
                  renderedFrom={renderedFrom}
                  refreshGrid={fetchData}
                  resource={sidebarResource.fieldServiceOrder}
                  showOnlyShowFilteredRecordSwitch={false}
                  showFilters={true}
                  hideSelection={true}
                  setWholeRowsCellColor={(row) =>
                    row._id === selectedData?._id
                      ? '!bg-[var(--new-theme-color)] [&_h6>span:first-child]:[color:white_!important] transition-bg duration-300'
                      : ' transition-bg duration-300'
                  }
                  onRowClick={onRowClick}
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
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
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
                showFilters={true}
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

const ViewButtons = ({ setView, view }) => {
  return (
    <>
      <HtmlTooltip title={'Card View'} placement="top" arrow enterTouchDelay={0}>
        <span>
          <IconButton size="small" onClick={() => setView('card')} disabled={view === 'card'}>
            <Apps color="primary" className={`${view === 'card' ? ' opacity-45' : ''}`} />
          </IconButton>
        </span>
      </HtmlTooltip>
      <HtmlTooltip title={'List View'} placement="top" arrow enterTouchDelay={0}>
        <span>
          <IconButton size="small" onClick={() => setView('table')} disabled={view === 'table'}>
            <FormatListNumbered color="primary" className={`${view === 'table' ? ' opacity-45' : ''}`} />
          </IconButton>
        </span>
      </HtmlTooltip>
    </>
  );
};
