import { useContext, useEffect, useState } from 'react';
import { Box, IconButton, MenuItem } from '@material-ui/core';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomContainer from 'src/components/CustomContainer';
import { GenerateResourceLineNumber, cloneResourceData, fieldServiceOrder, getObjKeys, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
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

let serchtimeTimeout;

const FieldServiceTechnician = () => {

  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.fieldServiceTechnician.title);
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

  useEffect(() => {
    fetchColumns();
  }, []);

  const fetchColumns = async () => {
    let data;
    if (isOffline) {
      data = await findOne(objectStore.resource, objectStore.fieldServiceOrder);
    } else {
      const response = await axiosInstance().get(`/field?resource=${sidebarResource?.fieldServiceOrder}`);
      data = response?.data?.data;
    }
    try {
      insertUpdate(objectStore.resource, objectStore.fieldServiceOrder, data);
    } catch (e) { }
    const newColumns = [...generateColumns(renderedFrom, data, routes.fieldServiceOrderDetail.path), ...getStaticFields()];
    newColumns.push({
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
          <HtmlTooltip title={permissions?.fieldTicket?.isCreate ? `Create ${routes.fieldTicket.title}` : cloneDisable}>
            <span>
              <IconButton
                size="small"
                aria-label="Add"
                disabled={permissions?.fieldTicket?.isCreate && !isSubmitting ? false : true}
                onClick={() => {
                  handleCreateFieldTicket(row?.original?.orignalData, data?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData))
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
    })
    setColumns(newColumns);
  };

  const handleCreateFieldTicket = async (data, fieldServiceOrderFields) => {
    setIsSubmitting(true)
    var fieldTicketField: any = []
    if (isOffline) {
      fieldTicketField = await findOne(objectStore.resource, objectStore.fieldTicket);
    } else {
      const response = await axiosInstance().get('/field?resource=Field Ticket');
      fieldTicketField = response?.data?.data;
    }
    fieldTicketField = fieldTicketField?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData)

    const tempInitialData = getObjKeys('', fieldTicketField);
    tempInitialData['fieldTicketNumber'] = GenerateResourceLineNumber(fieldTicketField);
    const referenceData: any = cloneResourceData(fieldServiceOrderFields, fieldTicketField, data)
    for (const key in referenceData) {
      tempInitialData[key] = referenceData[key];
    }
    if (fieldTicketField?.some((e) => e.fieldName === 'currency')) {
      tempInitialData['currency'] = user.user?.brandCurrency;
    }
    tempInitialData['fieldServiceOrder'] = data?._id;

    axiosInstance().post(`${routes.fieldTicket?.path}`, tempInitialData).then(({ data }) => {
      window.open(`${routes.fieldTicket.path}/detail/${data?.data?._id}`)
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data.message
      });
      setIsSubmitting(false)

    })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false)
      });
  }

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (serchtimeTimeout) {
      clearTimeout(serchtimeTimeout);
    }
    serchtimeTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, showFilteredRecordsOnly]);

  const fetchData = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      let data, count;
      if (isOffline) {
        data = await findAll(objectStore.fieldServiceOrder);
        count = data?.length || 0;
      } else {
        const queryString = getQueryString();
        const response = await axiosInstance().get(`${fieldServiceOrder.api}${queryString}`);
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
    axiosInstance().get(`/field?resource=${sidebarResource.fieldTicket}`).then(({ data: { data } }) => {
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
          actionMenuItems={<ActionMenuItems />}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            resource={sidebarResource.fieldServiceOrder}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
          />
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
