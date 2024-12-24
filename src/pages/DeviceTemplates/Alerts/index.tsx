import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { cloneDisable, deleteDisable, editDisable } from 'src/constants/messageHelpers';
import ManageDeviceTemplateAlert from 'src/pages/DeviceTemplatesAlert/ManageDeviceTemplateAlert';
import axios, { CancelTokenSource } from 'axios';

export default function Alerts({ deviceTemplate }) {
  const renderedFrom = `${camelCase(sidebarResource.deviceTemplateAlert)}_alerts`;
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity, resources }
  }: any = useData();
  const { page, limit, filters, sorting, selectedRecords, showFilteredRecordsOnly, search } = state;
  const [columns, setColumns] = useState(null);
  const { generateColumns } = useColumns();

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false, id: null });

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [search, page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.deviceTemplateAlert}`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(renderedFrom, data, routes.deviceTemplateAlertDetail.path, true);
        newColumns?.forEach((o) => {
          if (o?.accessor === 'alertNumber') {
            o.cell = ({ row }) => (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p
                  className="link text-truncate"
                  onClick={() => {
                    setOpen({ open: true, isClone: false, id: row.original?.id });
                  }}
                >
                  {row.original?.alertNumber}
                </p>
              </div>
            );
          }
        });
        setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
      });
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
          <IconButton
            disabled={!row.original?.allowedToEdit}
            size="small"
            aria-label="Edit"
            onClick={() => {
              setOpen({ open: true, isClone: false, id: row.original?.id });
            }}
          >
            <EditIcon fontSize="small" color={row.original?.allowedToEdit ? 'primary' : 'disabled'} />
          </IconButton>
        </HtmlTooltip>

        <HtmlTooltip title={permissions?.deviceTemplateAlert?.isCreate ? 'Clone' : cloneDisable}>
          <IconButton
            disabled={!permissions?.deviceTemplateAlert?.isCreate}
            size="small"
            aria-label="Clone"
            onClick={() => {
              setOpen({ open: true, isClone: true, id: row.original?.id });
            }}
          >
            <FileCopyIcon fontSize="small" color={permissions?.deviceTemplateAlert?.isCreate ? 'primary' : 'disabled'} />
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
            <DeleteIcon fontSize="small" color={row.original?.canDelete ? 'error' : 'disabled'} />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes?.deviceTemplateAlert?.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data }) => {
        let count = data?.count;
        let rows = data?.data?.map((u: any) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.deviceTemplateAlert?.isDelete;
          finalObject['isChecked'] = selectedRecords?.some((s) => s?._id === u?._id);
          finalObject['allowedToEdit'] = permissions?.deviceTemplateAlert?.isUpdate;

          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (isExport) {
      deepFilter = `?`;
    }

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    filterByIds.push({ field: 'deviceTemplate', term: deviceTemplate });

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

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`${routes?.deviceTemplateAlert?.path}/remove`, { ids })
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
            if (selectedRecords.length === 1) {
              setDeleteRecord(selectedRecords[0]);
            } else {
              setDeleteRecord(null);
            }
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords.length})`}
        </MenuItem>
      </>
    );
  };

  const rightSideContents = () => {
    return (
      <>
        <ImportExportMenu
          permissions={permissions?.deviceTemplateAlert}
          module="Device Template Alert"
          api={`${routes?.deviceTemplateAlert?.path}`}
          afterImportCompleted={() => {
            fetchData();
          }}
          // isExportAllOrSomeFeature={true}
          ids={[]}
          additionalParams={`deviceTemplate=${deviceTemplate}`}
        />
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
        rightSideContents={rightSideContents()}
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
          showFilters={true}
          resource={sidebarResource.deviceTemplateAlert}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

      {open?.open && (
        <ManageDeviceTemplateAlert
          id={open.id}
          isClone={open?.isClone}
          referenceData={{ deviceTemplate }}
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
          message={`Are you sure you want to delete ${
            deleteRecord
              ? `${resources?.deviceTemplateAlert?.titleSingular?.toLowerCase()} :
            ${deleteRecord?.alertNumber}`
              : `selected ${resources?.deviceTemplateAlert?.titlePlural?.toLowerCase()}`
          } ?`}
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
