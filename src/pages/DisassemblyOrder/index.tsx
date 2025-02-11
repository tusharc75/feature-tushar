import { camelCase } from "lodash"
import CustomBreadCrumbs from "src/components/CustomBreadCrumbs";
import { DIASSEMBLY_ORDER_STATUS, disassemblyOrder, EXPENSE_STATUS, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from "src/constants/helpers"
import routes from "src/components/Helpers/Routes";
import { useData } from "src/StateProvider/Provider";
import ImportExportLinks from "src/components/Helpers/ImportExportLinks";
import { useContext, useEffect, useState } from "react";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from "src/components/CustomReactTable";
import axiosInstance from "src/axios/axiosInstance";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import { cloneDisable } from "src/constants/messageHelpers";
import { Box, IconButton, MenuItem } from "@mui/material";
import { FileCopyIcon } from "src/assets/svg/svgIcons";
import { GridDeleteIcon } from "@mui/x-data-grid";
import axios, { CancelTokenSource } from "axios";
import CustomContainer from "src/components/CustomContainer";
import { ListingPageHeader } from "src/components/PageHeaders";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { ManageDiassemblyOrder } from "src/pages/DisassemblyOrder/ManageDiassemblyOrder";
import { useHistory } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
export const DisassemblyOrder = () => {
  const renderedFrom = camelCase(sidebarResource?.disassemblyOrder);
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();


  const toastConfig = useContext(CustomToastContext);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showManageDiassemblyOrder, setShowManageDiassemblyOrder] = useState({ open: false, isClone: false, idToClone: null });
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);
  const { generateColumns, checkStaticField } = useColumns();
  const history = useHistory();
  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.disassemblyOrder}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes?.disassemblyOrder?.path, true);
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      newColumns.push(checkStaticField(renderedFrom, field));
    });
    setColumns([...newColumns, ActionsRenderer]);

  }


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
        <HtmlTooltip title={permissions?.disassemblyOrder?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.disassemblyOrder?.isCreate ? false : true}
              onClick={() => {
                setShowManageDiassemblyOrder({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.expenses?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={row?.original?.canDelete && row?.original?.status === DIASSEMBLY_ORDER_STATUS.new ? 'Delete' : 'You can not delete it is reported'}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete && row?.original?.status !== DIASSEMBLY_ORDER_STATUS.new ? true : false}
              onClick={() => {
                setDeleteRecord(row.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete && row?.original?.status !== DIASSEMBLY_ORDER_STATUS.new ? 'disabled' : 'error'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }
    return deepFilter;

  }
  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    try {
      let data: any = [], count;
      const response: any = await axiosInstance().get(`${disassemblyOrder.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
      data = response?.data?.data;
      count = response?.data?.count;
      let rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        finalObject['canDelete'] = permissions?.disassemblyOrder?.isDelete;
        return finalObject
      });
      dispatch({ type: 'initialize', data: rows, count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);


    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);

    }
  }


  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  }


  const handleDeleteDisassemblyOrder = async () => {
    let recordsToDelete = deleteRecord?._id ? [deleteRecord._id] : selectedRecords.map((u) => u._id);
    setDeleteLoading(true);
    try {
      const response = await axiosInstance().put(`${disassemblyOrder.api}/remove`, {
        ids: recordsToDelete
      });

      toastConfig.setToastConfig({
        open: true,
        type: "success",
        message: response.data.message,
      });
      dispatch({ type: "selection", selectedRecords: [] });
      setShowDeleteConfirmBox(false);
      setDeleteLoading(false);
      fetchData();
    } catch (error) {
      console.error("Delete failed:", error.response?.data || error);
      toastConfig.setToastConfig(error);
      setShowDeleteConfirmBox(false);
      setDeleteLoading(false);
    }
  };

  const ActionMenuItems = () => {
    return (
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
    )
  }

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);
  return (
    <div className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.disassemblyOrder, title: resources?.disassemblyOrder?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions.disassemblyOrder}
          module={resources?.disassemblyOrder?.titlePlural}
          api={disassemblyOrder.api}
          afterImportCompleted={
            () => fetchData()
          }
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchData()
          }}
          additionalParams={getQueryString(true)}
        />

      </div>

      <CustomContainer>

        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => {
            setShowManageDiassemblyOrder({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={permissions?.disassemblyOrder?.isCreate}
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
            resource={sidebarResource.disassemblyOrder}
            showFilters={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}

        {showDeleteConfirmBox ? (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${deleteRecord
              ? `${resources?.disassemblyOrder.titleSingular?.toLowerCase()} :
                      ${deleteRecord?.disassemblyOrderNumber}`
              : `selected ${resources?.disassemblyOrder?.titlePlural?.toLowerCase()}`
              } ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDeleteDisassemblyOrder}
            okBtnLoading={deleteLoading}
          />
        ) : null}
      </CustomContainer>

      {
        showManageDiassemblyOrder.open && (
          <ManageDiassemblyOrder
            isClone={showManageDiassemblyOrder.isClone}
            disassemblyOrderId={showManageDiassemblyOrder.idToClone}
            onClose={() => setShowManageDiassemblyOrder({ open: false, isClone: false, idToClone: null })}
            onSuccess={(data) => {
              history.push(`${routes.disassemblyOrder.path}/${data._id}`);
              setShowManageDiassemblyOrder({ open: false, isClone: false, idToClone: null });
              fetchData();
            }}
          />
        )}
    </div>
  )
}