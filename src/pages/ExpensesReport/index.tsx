import { Box, IconButton, MenuItem } from '@mui/material';
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
import { gridLoadingTimeout, prepareDataForGrid, expenseReport, sidebarResource, expenses, EXPENSE_STATUS } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import DeleteIcon from '@mui/icons-material/Delete';
import ManageExpenseReports from 'src/pages/ExpensesReport/ManageExpenseReports';

let expenseReportTimeout;

const ExpenseReport = () => {
  const renderedFrom = camelCase(sidebarResource?.expenseReport);

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showManageExpenseReportDialog, setShowManageExpenseReportDialog] = useState({ open: false, isClone: false, idToClone: null });
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);

  const { generateColumns, checkStaticField } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.expenseReport}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes?.expenseReportDetail?.path, true);
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      newColumns.push(checkStaticField(renderedFrom, field));
    });
    setColumns([...newColumns, ActionsRenderer]);
  };

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (expenseReportTimeout) {
      clearTimeout(expenseReportTimeout);
    }
    expenseReportTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

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
        <HtmlTooltip title={permissions?.expenseReport?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.expenseReport?.isCreate ? false : true}
              onClick={() => {
                setShowManageExpenseReportDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.expenseReport?.isCreate ? 'primary' : 'disabled'} />
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
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    try {
      let data: any = [],
        count;
      const response: any = await axiosInstance().get(`${expenseReport.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
      data = response?.data?.data;
      count = response?.data?.count;
      let rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        finalObject['canDelete'] = permissions?.expenseReport?.isDelete;
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: count });
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

  const handleDeleteExpenseReport = async () => {
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }

    if (recordsToDelete.length > 0) {
      setDeleteLoading(true);

      try {
        const { data } = await axiosInstance().put(`${expenseReport.api}/remove`, {
          ids: recordsToDelete
        });

        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });

        if (deleteRecord?.selectedExpenses?.length > 0) {
          await handleStatusChange(deleteRecord.selectedExpenses);
        } else {
          const allSelectedExpenses = selectedRecords.flatMap((record) => record.selectedExpenses || []);
          if (allSelectedExpenses.length > 0) {
            await handleStatusChange(allSelectedExpenses);
          }
        }

        dispatch({ type: 'selection', selectedRecords: [] });
        setShowDeleteConfirmBox(false);
        setDeleteLoading(false);

        if (deleteRecord) setDeleteRecord({});
        fetchData();
      } catch (error) {
        toastConfig.setToastConfig(error);
        setShowDeleteConfirmBox(false);
        setDeleteLoading(false);
      }
    }
  };

  const handleStatusChange = async (expenseInfo) => {
    for (let expense of expenseInfo) {
      try {
        await axiosInstance().patch(`${expenses.api}/status/${expense._id}`, {
          status: EXPENSE_STATUS.unreported
        });
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
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
    );
  };

  return (
    <div className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.expenseReport, title: resources?.expenseReport?.titlePlural }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => {
            setShowManageExpenseReportDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={permissions?.expenseReport?.isCreate}
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
            resource={sidebarResource.expenseReport}
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
            message={`Are you sure you want to delete ${
              deleteRecord
                ? `${resources?.expenseReport?.titleSingular?.toLowerCase()} :
              ${deleteRecord?.reportTitle}`
                : `selected ${resources?.expenseReport?.titlePlural?.toLowerCase()}`
            } ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDeleteExpenseReport}
            okBtnLoading={deleteLoading}
          />
        ) : null}
      </CustomContainer>
      {showManageExpenseReportDialog.open && (
        <ManageExpenseReports
          isClone={showManageExpenseReportDialog.isClone}
          expenseReportId={showManageExpenseReportDialog.idToClone}
          fetchReportData={fetchData}
          onClose={() => setShowManageExpenseReportDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            history.push(`${routes?.expenseReportDetail?.path}/${data._id}`);
            setShowManageExpenseReportDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </div>
  );
};

export default ExpenseReport;
