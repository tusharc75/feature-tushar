import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { Fragment, useContext, useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, useTableReducer } from 'src/components/CustomReactTable';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { editDisable } from 'src/constants/messageHelpers';
import ManageServiceConditional from 'src/pages/Product/ServiceMaster/ServiceCondition/ManageServiceConditional';

export default function ServiceCondition({ renderedFrom, id }) {
  const renderedfrom = `${renderedFrom}_condition`;
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions }
  }: any = useData();
  const { selectedRecords, showFilteredRecordsOnly, dataRows } = state;
  const [columns, setColumns] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [open, setOpen] = useState({ open: false, id: null });

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchGridColumns = () => {
    const column = [
      {
        accessor: 'description',
        Header: 'Description',
        Cell: ({ row }) => (row.original?.description ? <div className="text-truncate">{row.original?.description}</div> : <NoDataCell />)
      },
      {
        accessor: 'services',
        Header: 'Services',
        Cell: ({ row }) => (
          <DropdownCell
            permissions={permissions}
            permissionForLinks={{}}
            field={{
              fieldName: 'services',
              lookupResource: sidebarResource.serviceMaster
            }}
            original={row?.original}
          />
        )
      },
      ...getStaticFields()
    ];
    setColumns([...column, ActionsRenderer]);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 150,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={row.original?.allowedToEdit ? 'Edit' : editDisable}>
          <span>
            <IconButton
              disabled={!row.original?.allowedToEdit}
              size="small"
              aria-label="Edit"
              onClick={() => {
                setOpen({ open: true, id: row.original?._id });
              }}
            >
              <EditIcon fontSize="small" color={row.original?.allowedToEdit ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>

        <HtmlTooltip title={'Delete'}>
          <IconButton
            disabled={false}
            size="small"
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(row.original);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .get(`${routes.product.path}/${id}/service-conditional`)
      .then(({ data }) => {
        let count = data?.count;
        let rows = data?.data?.map((u: any) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['canDelete'] = true;
          finalObject['allowedToEdit'] = true;
          finalObject['isChecked'] = selectedRecords?.some((s) => s?._id === u?._id);
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`${routes.product.path}/${id}/service-conditional/remove`, { ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setOpen({ open: true, id: null });
          }}
        >
          Add
        </MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            selectedRecords.length === 1 && setDeleteRecord(selectedRecords[0]);
            setShowDeleteConfirmBox(true);
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={true}
        addButtonMenuItems={addButtonMenuItems()}
        isActionButtonVisible={true}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: selectedRecords.length === 0 }}
        hasXpadding={false}
      />

      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedfrom}
          refreshGrid={fetchData}
          showFilters={false}
          isClientSideGrid={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

      {open.open && (
        <ManageServiceConditional
          id={open?.id}
          productId={id}
          onClose={() => setOpen({ open: false, id: null })}
          onSuccess={() => {
            setOpen({ open: false, id: null });
            fetchData();
          }}
        />
      )}

      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the service condition ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </Fragment>
  );
}
