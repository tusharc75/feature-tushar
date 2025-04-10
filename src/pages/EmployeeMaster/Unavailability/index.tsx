import { useState, useEffect, useContext } from 'react';
import { Box, IconButton } from '@mui/material';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { camelCase } from 'lodash';
import { displayDate, displayDateTime, employeeMaster, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ManageUnavailability from 'src/pages/EmployeeMaster/Unavailability/ManageUnavailability';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import axios, { CancelTokenSource } from 'axios';
import { deleteDisable, editDisable } from 'src/constants/messageHelpers';

let employeeUnavailabilityTimeout;
const renderedFrom = `${camelCase(sidebarResource.employeeMaster)}_Unavaiability`;

const Unavailability = ({ id }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, showFilteredRecordsOnly } = state;
  const [showUnavailbiltyDialog, setShowUnavailibilityDialog] = useState({ open: false, id: null });
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [columns, setColumns] = useState(null);

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.technicianUnavailability}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data);
    setColumns([...newColumns, ActionsRenderer]);
  };

  // const ActionsRenderer = {
  //     accessor: 'action',
  //     Header: 'Actions',
  //     minWidth: 100,
  //     width: 100,
  //     sticky: 'right',
  //     disableFilters: true,
  //     disableSortBy: true,
  //     canDrag: false,
  //     Cell: ({ row }) => (
  //       <>
  //         {permissions?.employeeMaster?.isUpdate && (
  //           <HtmlTooltip title="Edit">
  //             <IconButton
  //               size="small"
  //               aria-label="Details"
  //               disabled={permissions?.employeeMaster?.isCreate ? false : true}
  //               onClick={() => {
  //                 setShowUnavailibilityDialog({ open: true, id: row.original._id });
  //               }}
  //             >
  //               <EditIcon fontSize="small" color={permissions?.employeeMaster?.isCreate ? 'primary' : 'disabled'} />
  //             </IconButton>
  //           </HtmlTooltip>
  //         )}
  //         {permissions?.employeeMaster?.isDelete && (
  //           <HtmlTooltip title="Delete">
  //             <span>
  //               <IconButton
  //                 size="small"
  //                 aria-label="Delete"
  //                 disabled={permissions?.employeeMaster?.isDelete ? false : true}
  //                 onClick={() => {
  //                   setDeleteRecord(row.original);
  //                   setShowDeleteConfirmBox(true);
  //                 }}
  //               >
  //                 <DeleteIcon fontSize="small" color={permissions?.employeeMaster?.isDelete ? 'primary' : 'disabled'} />
  //               </IconButton>
  //             </span>
  //           </HtmlTooltip>
  //         )}
  //       </>
  //     )
  //   };

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
        <HtmlTooltip title={permissions?.employeeMaster?.isUpdate ? 'Edit' : editDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.expenses?.isCreate ? false : true}
              onClick={() => {
                setShowUnavailibilityDialog({ open: true, id: row.original._id });
              }}
            >
              <EditIcon fontSize="small" color={permissions?.employeeMaster?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={permissions?.employeeMaster?.isDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={permissions?.employeeMaster?.isDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon fontSize="small" color={permissions?.employeeMaster?.isDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (employeeUnavailabilityTimeout) {
      clearTimeout(employeeUnavailabilityTimeout);
    }
    employeeUnavailabilityTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

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

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    return deepFilter;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    try {
      let data: any = [];
      const response: any = await axiosInstance().get(`${employeeMaster.api}/unavailability/${id}${queryString}`, {
        cancelToken: cancelTokenSource?.token
      });
      data = response?.data?.data;
      let rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
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

  const handleDelete = async () => {
    let recordsToDelete = [];
    recordsToDelete.push(deleteRecord?._id);

    if (recordsToDelete.length > 0) {
      setDeleteLoading(true);
      axiosInstance()
        .put(`${employeeMaster.api}/unavailability/remove`, {
          ids: recordsToDelete
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
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
      <Box pt={2}>
        <ThemeButton startIcon={<AddIcon fontSize="small" />} onClick={() => setShowUnavailibilityDialog({ open: true, id: null })}>
          Add
        </ThemeButton>
      </Box>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          hideSelection={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showUnavailbiltyDialog.open && (
        <ManageUnavailability
          onClose={() => setShowUnavailibilityDialog({ open: false, id: null })}
          onSuccess={() => {
            fetchData();
            setShowUnavailibilityDialog({ open: false, id: null });
          }}
          masterId={id}
          id={showUnavailbiltyDialog.id}
        />
      )}
      {showDeleteConfirmBox ? (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the record ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
          okBtnLoading={deleteLoading}
        />
      ) : null}
    </Box>
  );
};

export default Unavailability;
