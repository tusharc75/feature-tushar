import { Box, IconButton } from '@mui/material';
import { Add } from '@mui/icons-material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { gridLoadingTimeout, prepareDataForGrid, assetServiceTickets, sidebarResource } from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import ManageAssetServiceTicket from 'src/pages/AssetServiceTicket/ManageAssetServiceTicket';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';
import { ThemeButton } from 'src/components/Helpers/Buttons';

let assetServiceTicketsTimeout;

const AssetServiceTicketsTab = ({ assetId, refresh }) => {
  const renderedFrom = camelCase(sidebarResource?.assetServiceTickets);

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showManageTicketsDialog, setShowManageTicketsDialog] = useState({ open: false, isClone: false, idToClone: null });
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchColumns();
  }, []);

  useEffect(() => {
    if (refresh !== undefined) {
      fetchData();
    }
  }, [refresh]);

  const fetchColumns = async () => {
    const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource.assetServiceTickets, permissions?.assetServiceTickets?.isUpdate);
    let columns = generateColumns(renderedFrom, fieldsDataForRead, routes.assetServiceTicketsDetail.path, true);
    columns = [...columns, ...getStaticFields(true), ActionsRenderer];
    setColumns(columns);
  };

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (assetServiceTicketsTimeout) {
      clearTimeout(assetServiceTicketsTimeout);
    }
    assetServiceTicketsTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, showFilteredRecordsOnly]);

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.assetServiceTickets?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.assetServiceTickets?.isCreate ? false : true}
              onClick={() => {
                setShowManageTicketsDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.assetServiceTickets?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

    deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: 'asset', term: assetId }])}`;

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify([...filterByIds, { field: 'asset', term: assetId }])}`;
    } else {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: 'asset', term: assetId }])}`;
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    try {
      let data: any = [];
      const response: any = await axiosInstance().get(`${assetServiceTickets.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
      data = response?.data?.data;
      let rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['canDelete'] = permissions?.assetServiceTickets?.isDelete;
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: response?.data?.count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const handleDeleteTickets = async () => {
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      setDeleteLoading(true);
      axiosInstance()
        .put(`${assetServiceTickets.api}/remove`, {
          ids: recordsToDelete
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          dispatch({ type: 'selection', selectedRecords: [] });
          setShowDeleteConfirmBox(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setShowDeleteConfirmBox(false);
          setDeleteLoading(false);
        });
    }
  };

  return (
    <Box>
      <Box className="mb-4 flex items-center justify-between">
        <Box className="flex items-center gap-4">
          {permissions?.assetServiceTickets?.isCreate && (
            <ThemeButton
              startIcon={<Add />}
              onClick={() => {
                setShowManageTicketsDialog({ open: true, isClone: false, idToClone: null });
              }}
            >
              Add
            </ThemeButton>
          )}
        </Box>
      </Box>

      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 400px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          showOnlyShowFilteredRecordSwitch={false}
          resource={sidebarResource.assetServiceTickets}
          showFilters={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${
            deleteRecord
              ? `${resources?.assetServiceTickets?.titleSingular?.toLowerCase()} : ${deleteRecord?.ticketId}`
              : `selected ${resources?.assetServiceTickets?.titlePlural?.toLowerCase()}`
          } ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDeleteTickets}
          okBtnLoading={deleteLoading}
        />
      )}

      {showManageTicketsDialog.open && (
        <ManageAssetServiceTicket
          isClone={showManageTicketsDialog.isClone}
          isRedirectToDetailPage={false}
          assetTicketId={showManageTicketsDialog.idToClone}
          onClose={() => setShowManageTicketsDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            fetchData();
            setShowManageTicketsDialog({ open: false, isClone: false, idToClone: null });
          }}
          initialAssetId={assetId}
        />
      )}
    </Box>
  );
};

export default AssetServiceTicketsTab;
