import { useState, useEffect, useContext } from 'react';
import { Box, IconButton } from '@mui/material';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { camelCase } from 'lodash';
import { displayDate, displayDateTime, employeeMaster, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ManageUnavailability from 'src/pages/EmployeeMaster/Unavailability/ManageUnavailability';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';

const renderedFrom = `${camelCase(sidebarResource.employeeMaster)}_Unavaiability`;

const Unavailability = ({ id }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [showUnavailbiltyDialog, setShowUnavailibilityDialog] = useState({ open: false, dataId: null });
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const columns = [
    {
      accessor: 'title',
      Header: 'Title',
      minWidth: 150,
      width: 150,
      primaryField: true,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.title ? (
            <div className="flex items-center gap-2">
              <div>{row?.original?.title}</div>
            </div>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'startDate',
      Header: 'Start Date',
      minWidth: 150,
      width: 150,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.startDate ? (
            <h5 className="text-truncate" title={displayDateTime(row?.original?.startDate)}>
              {displayDate(row?.original?.startDate)}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'endDate',
      Header: 'End Date',
      minWidth: 150,
      width: 150,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.endDate ? (
            <h5 className="text-truncate" title={displayDateTime(row?.original?.endDate)}>
              {displayDate(row?.original?.endDate)}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'reason',
      Header: 'Reason',
      minWidth: 150,
      width: 150,
      primaryField: true,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.reasons ? (
            <div className="flex items-center gap-2">
              <div>{row?.original?.reasons}</div>
            </div>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
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
          {permissions?.employeeMaster?.isUpdate && (
            <HtmlTooltip title="Edit">
              <IconButton
                size="small"
                aria-label="Details"
                disabled={false}
                onClick={() => {
                  setShowUnavailibilityDialog({ open: true, dataId: row.original._id });
                }}
              >
                <EditIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          )}
          {permissions?.employeeMaster?.isDelete && (
            <HtmlTooltip title="Delete">
              <span>
                <IconButton
                  size="small"
                  aria-label="Delete"
                  disabled={false}
                  onClick={() => {
                    setDeleteRecord(row.original);
                    setShowDeleteConfirmBox(true);
                  }}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </span>
            </HtmlTooltip>
          )}
        </>
      )
    }
  ];

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${employeeMaster.api}/unavailability/${id}`)
      .then(({ data: { data, count } }) => {
        dispatch({ type: 'initialize', data: data, count: count });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const handleDeleteExpenses = async () => {
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
      <Box pt={2}>
        <ThemeButton startIcon={<AddIcon fontSize="small" />} onClick={() => setShowUnavailibilityDialog({ open: true, dataId: null })}>
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
          onClose={() => setShowUnavailibilityDialog({ open: false, dataId: null })}
          onSuccess={() => {
            fetchData(), setShowUnavailibilityDialog({ open: false, dataId: null });
          }}
          id={id}
          dataId={showUnavailbiltyDialog.dataId}
        />
      )}
      {showDeleteConfirmBox ? (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDeleteExpenses}
          okBtnLoading={deleteLoading}
        />
      ) : null}
    </Box>
  );
};

export default Unavailability;
