import { Box, IconButton, MenuItem } from '@mui/material';
import { Add } from '@mui/icons-material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import {
  gridLoadingTimeout,
  prepareDataForGrid,
  assetServiceTickets,
  sidebarResource,
  SYSTEM_ASSET_STATUS,
  repairOrder,
  MATERIAL_TYPE
} from '../../constants/helpers';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import routes from '../../components/Helpers/Routes';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import DeleteIcon from '@mui/icons-material/Delete';
import ManageAssetServiceTicket from 'src/pages/AssetServiceTicket/ManageAssetServiceTicket';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ManageRepairOrder from 'src/pages/RepairOrder/ManageRepairOrder';

let assetServiceTicketsTimeout;

const AssetServiceTickets = ({ assetId, refresh, isTabMode = false }) => {
  const renderedFrom = camelCase(sidebarResource?.assetServiceTickets);

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showManageTicketsDialog, setShowManageTicketsDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showRepairOrderDialog, setShowRepairOrderDialog] = useState({ open: false, tickets: [] });
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchColumns();
  }, [isTabMode]);

  useEffect(() => {
    if (refresh !== undefined && isTabMode) {
      fetchData();
    }
  }, [refresh]);

  const fetchColumns = async () => {
    const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource.assetServiceTickets, permissions?.assetServiceTickets?.isUpdate);
    let columns = generateColumns(renderedFrom, fieldsDataForRead, routes.assetServiceTicketsDetail.path, !isTabMode);
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
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly, assetId]);

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

    if (isTabMode && assetId) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: 'asset', term: assetId }])}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (filterByIds?.length) {
      if (isTabMode && assetId) {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([...filterByIds, { field: 'asset', term: assetId }])}`;
      } else {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
      }
    }

    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }

    if (filterByIds?.length || deepFilters?.length || (isTabMode && assetId)) {
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
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

  const canCreateRepairOrder = () => {
    const hasInvalidAssetStatus = selectedRecords.some((ticket) => SYSTEM_ASSET_STATUS.includes(ticket.asset?.status));
    if (hasInvalidAssetStatus) return false;

    const warehouses = selectedRecords.map((ticket) => ticket.warehouse);
    const uniqueWarehouses = [...new Set(warehouses.filter(Boolean))];
    if (uniqueWarehouses.length > 1) return false;

    const hasExistingRepairOrder = selectedRecords.some((ticket) => ticket.repairOrder);
    if (hasExistingRepairOrder) return false;

    return true;
  };

  const handleAddTicketsToRepairOrder = async (repairOrderData: any) => {
    let rows = showRepairOrderDialog.tickets?.map((ticket: any) => ({
      materialId: ticket.assetId,
      type: MATERIAL_TYPE.serializedAsset,
      qty: 1,
      parentId: null
    }));

    try {
      await axiosInstance().post(`${repairOrder.api}/${repairOrderData._id}/product-package`, { material: rows });

      const updatePromises = showRepairOrderDialog.tickets?.map((ticket: any) =>
        axiosInstance().put(`${assetServiceTickets.api}`, {
          _id: ticket._id,
          repairOrder: repairOrderData._id
        })
      );

      await Promise.all(updatePromises);

      const statusUpdatePromises = showRepairOrderDialog.tickets?.map((ticket: any) =>
        axiosInstance().put(`${assetServiceTickets.api}/status/${ticket._id}`, {
          status: 'In-Progress'
        })
      );

      await Promise.all(statusUpdatePromises);

      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Tickets added to repair order successfully'
      });

      dispatch({ type: 'selection', selectedRecords: [] });
      setShowRepairOrderDialog({ open: false, tickets: [] });
      fetchData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const ActionMenuItems = () => {
    return (
      <>
        {permissions?.repairOrder?.isCreate && (
          <MenuItem disabled={!canCreateRepairOrder()} onClick={() => setShowRepairOrderDialog({ open: true, tickets: selectedRecords })}>
            {'Create Repair Order'}
          </MenuItem>
        )}
        <MenuItem
          disabled={selectedRecords.every((e) => e?.canDelete) ? false : true}
          onClick={() => {
            if (selectedRecords?.length === 1) {
              setDeleteRecord(selectedRecords[0]);
            } else {
              setDeleteRecord(null);
            }
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords?.length})`}
        </MenuItem>
      </>
    );
  };

  const content = (
    <>
      {!isTabMode && (
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{ ...routes.assetServiceTickets, title: resources?.assetServiceTickets?.titlePlural }]} />
          <ImportExportLinks
            permissions={permissions.assetServiceTickets}
            module={resources?.assetServiceTickets?.titlePlural}
            api={assetServiceTickets.api}
            afterImportCompleted={() => {
              fetchData();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords?.length}
            ids={selectedRecords?.map((obj) => obj._id)}
            onExportToExcelSuccess={() => {
              fetchData();
            }}
            additionalParams={getQueryString(true)}
          />
        </div>
      )}
      {!isTabMode ? (
        <CustomContainer>
          <ListingPageHeader
            searchValue={search}
            onSearch={handleSearch}
            isActionButtonVisible={true}
            actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
            actionMenuItems={<ActionMenuItems />}
            addButtonOnclick={() => {
              setShowManageTicketsDialog({ open: true, isClone: false, idToClone: null });
            }}
            isAddButtonVisible={permissions?.assetServiceTickets?.isCreate}
          />
          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              showOnlyShowFilteredRecordSwitch={true}
              resource={sidebarResource.assetServiceTickets}
              showFilters={true}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </CustomContainer>
      ) : (
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
          assetTicketId={showManageTicketsDialog.idToClone}
          isRedirectToDetailPage={!isTabMode}
          onClose={() => setShowManageTicketsDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            if (isTabMode) {
              fetchData();
            } else {
              history.push(`${routes.assetServiceTicketsDetail.path}/${data._id}`);
            }
            setShowManageTicketsDialog({ open: false, isClone: false, idToClone: null });
          }}
          initialAssetId={assetId}
        />
      )}
      {showRepairOrderDialog.open && (
        <ManageRepairOrder
          referenceType="assetServiceTickets"
          referenceData={{
            warehouse: showRepairOrderDialog.tickets[0]?.warehouseId
          }}
          onClose={() => setShowRepairOrderDialog({ open: false, tickets: [] })}
          onSuccess={(data) => {
            handleAddTicketsToRepairOrder(data);
          }}
          isClone={false}
        />
      )}
    </>
  );

  return isTabMode ? content : <div className="main-container-v1">{content}</div>;
};

export default AssetServiceTickets;
