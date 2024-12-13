import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import moment from 'moment';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { dateFormat, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { deleteDisable, editDisable } from 'src/constants/messageHelpers';
import ManageRules from './ManageRules';

export default function Rules({ deviceTemplate }) {
  const renderedFrom = `${camelCase(sidebarResource.deviceTemplateAlert)}_rules`;
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { selectedEntity }
  }: any = useData();
  const { page, limit, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false, id: null });

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    const column = [
      {
        accessor: 'ruleName',
        Header: 'Rule Name',
        show: true,
        disabled: true,
        Cell: ({ row }) =>
          row.original?.ruleName ? (
            <p
              onClick={() => {
                setOpen({ open: true, isClone: false, id: row.original?._id });
              }}
              className="link text-truncate"
            >
              {row.original?.ruleName}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'createdBy',
        Header: 'Created By',
        show: true,
        filter: false,
        Cell: ({ row }) =>
          row.original?.createdBy ? (
            <h5 className="createBy" title={`${row.original?.createdBy} • ${moment(row.original?.createdByDate).format(dateFormat)}`}>
              {row.original?.createdBy}
              <span className="hidden">&nbsp;-&nbsp;</span>
              <span className="createdAtTime badge-date">{moment(row.original?.createdByDate)?.format(dateFormat)}</span>
            </h5>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'updatedBy',
        Header: 'Updated By',
        show: true,
        filter: false,
        Cell: ({ row }) =>
          row.original?.updatedBy ? (
            <h5
              className="updateBy"
              style={{ minWidth: 'min-content' }}
              title={`${row.original?.updatedBy} • ${moment(row.original?.updatedByDate).format(dateFormat)}`}
            >
              <span>{row.original?.updatedBy}</span>
              <span className="updatedAtTime badge-date">{moment(row.original?.updatedByDate)?.format(dateFormat)}</span>
            </h5>
          ) : (
            <NoDataCell />
          )
      }
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
                setOpen({ open: true, isClone: false, id: row.original?._id });
              }}
            >
              <EditIcon fontSize="small" color={row.original?.allowedToEdit ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>

        <HtmlTooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setOpen({ open: true, isClone: true, id: row.original?.id });
            }}
          >
            <FileCopyIcon fontSize="small" color="primary" />
          </IconButton>
        </HtmlTooltip>

        <HtmlTooltip title={row.original?.canDelete ? 'Delete' : deleteDisable}>
          <IconButton
            disabled={!row.original?.canDelete}
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
      .get(`${routes?.deviceTemplates?.path}/rule?deviceTemplate=${deviceTemplate}`)
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
      .put(`${routes?.deviceTemplates?.path}/rule/remove`, { ids })
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
            setOpen({ open: true, isClone: false, id: null });
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
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          showOnlyShowFilteredRecordSwitch={true}
          showFilters={false}
          isClientSideGrid={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

      {open.open && (
        <ManageRules
          deviceTemplate={deviceTemplate}
          open={open?.open}
          isClone={open?.isClone}
          id={open?.id}
          onClose={() => setOpen({ open: false, isClone: false, id: null })}
          onSuccess={() => {
            setOpen({ open: false, isClone: false, id: null });
            fetchData();
          }}
        />
      )}

      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${'Rule'.toLowerCase()} ?`}
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
