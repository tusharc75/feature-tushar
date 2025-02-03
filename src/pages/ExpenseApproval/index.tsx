import { Box, Button, Card, CardActions, CardContent, IconButton, MenuItem, Typography } from '@mui/material';
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
import { gridLoadingTimeout, prepareDataForGrid, expenseApproval, sidebarResource, EXPENSE_STATUS } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import DeleteIcon from '@mui/icons-material/Delete';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { ThemeButton } from 'src/components/Helpers/Buttons';

let expenseApprovalTimeout;

const ExpenseApproval = () => {
  const renderedFrom = camelCase(sidebarResource?.expenseApproval);

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);

  const { generateColumns, checkStaticField } = useColumns();

  // useEffect(() => {
  //   fetchGridColumns();
  // }, []);

  // const fetchGridColumns = async () => {
  //   let data;
  //   const response = await axiosInstance().get(`/field?resource=${sidebarResource.expenses}`);
  //   data = response?.data?.data;
  //   const newColumns = generateColumns(renderedFrom, data, routes?.expensesDetail?.path, true);
  //   let staticFields = getStaticFields();
  //   staticFields.forEach((field) => {
  //     newColumns.push(checkStaticField(renderedFrom, field));
  //   });
  //   const extracolumns: any = [
  //     ...newColumns,
  //     {
  //       accessor: 'totalAmount',
  //       Header: 'Total Amount',
  //       minWidth: 100,
  //       width: 150,
  //       disableFilters: true,
  //       disableSortBy: false,
  //       canDrag: true,
  //       Cell: ({ row }) => {
  //         return row?.original?.totalAmount ? (
  //           <div>
  //             <p className="text-truncate">{row?.original?.totalAmount}</p>
  //           </div>
  //         ) : (
  //           <NoDataCell />
  //         );
  //       }
  //     }
  //   ];
  //   setColumns([...extracolumns, ActionsRenderer]);
  // };

  // useEffect(() => {
  //   let millisec = Object.keys(search).length > 0 ? 600 : 5;
  //   if (expenseApprovalTimeout) {
  //     clearTimeout(expenseApprovalTimeout);
  //   }
  //   expenseApprovalTimeout = setTimeout(() => {
  //     fetchData();
  //   }, millisec);
  // }, [search]);

  // useEffect(() => {
  //   const cancelTokenSource = axios.CancelToken.source();
  //   fetchData(cancelTokenSource);
  //   return () => cancelTokenSource.cancel();
  // }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  // const ActionsRenderer = {
  //   accessor: 'action',
  //   Header: 'Actions',
  //   minWidth: 100,
  //   width: 110,
  //   sticky: 'right',
  //   disableFilters: true,
  //   disableSortBy: true,
  //   canDrag: false,
  //   Cell: ({ row }) => (
  //     <>
  //       <HtmlTooltip title={permissions?.expenseApprovsl?.isCreate ? 'Clone' : cloneDisable}>
  //         <span>
  //           <IconButton
  //             size="small"
  //             aria-label="Clone"
  //             disabled={permissions?.expenses?.isCreate ? false : true}
  //             onClick={() => {
  //               setShowManageExpensesDialog({ open: true, isClone: true, idToClone: row.original._id });
  //             }}
  //           >
  //             <FileCopyIcon fontSize="small" color={permissions?.expenses?.isCreate ? 'primary' : 'disabled'} />
  //           </IconButton>
  //         </span>
  //       </HtmlTooltip>
  //       <HtmlTooltip title={row?.original?.canDelete && row?.original?.status !== EXPENSE_STATUS.unSubmitted ? 'Delete' : 'You can not delete because it is Reported'}>
  //         <span>
  //           <IconButton
  //             size="small"
  //             aria-label="Delete"
  //             disabled={row?.original?.canDelete && row?.original?.status !== EXPENSE_STATUS.unSubmitted  ? false : true}
  //             onClick={() => {
  //               setDeleteRecord(row.original);
  //               setShowDeleteConfirmBox(true);
  //             }}
  //           >
  //             <DeleteIcon fontSize="small" color={row?.original?.canDelete && row?.original?.status !== EXPENSE_STATUS.unSubmitted ? 'error' : 'disabled'} />
  //           </IconButton>
  //         </span>
  //       </HtmlTooltip>
  //     </>
  //   )
  // };

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
      const response: any = await axiosInstance().get(`${expenseApproval.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
      data = response?.data?.data;
      count = response?.data?.count;
      let rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        finalObject['canDelete'] = permissions?.expenseApproval?.isDelete;
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

  // const handleDeleteExpenses = async () => {
  //   let recordsToDelete = [];
  //   if (deleteRecord?._id) {
  //     recordsToDelete.push(deleteRecord?._id);
  //   } else {
  //     recordsToDelete = selectedRecords.map((o) => o._id);
  //   }
  //   if (recordsToDelete.length > 0) {
  //     setDeleteLoading(true);
  //     axiosInstance()
  //       .put(`${expenseApproval.api}/remove`, {
  //         ids: recordsToDelete
  //       })
  //       .then(({ data }) => {
  //         toastConfig.setToastConfig({
  //           open: true,
  //           type: 'success',
  //           message: data.message
  //         });
  //         dispatch({ type: 'selection', selectedRecords: [] });
  //         setShowDeleteConfirmBox(false);
  //         setDeleteLoading(false);
  //         if (deleteRecord) setDeleteRecord({});
  //         fetchData();
  //       })
  //       .catch((error) => {
  //         toastConfig.setToastConfig(error);
  //         setShowDeleteConfirmBox(false);
  //         setDeleteLoading(false);
  //       });
  //   }
  // };

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
        <CustomBreadCrumbs routes={[{ ...routes.expenseApproval, title: resources?.expenseApproval?.titlePlural }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          isAddButtonVisible={false}
        />
        <Card sx={{ maxWidth: 345 }}>
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Lizard
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Expense
            </Typography>
          </CardContent>
          <CardActions>
            <ThemeButton buttonType='yellow'>Approve</ThemeButton>
            <ThemeButton buttonType='red'>Reject</ThemeButton>
          </CardActions>
        </Card>
      </CustomContainer>
    </div>
  );
};

export default ExpenseApproval;
