import { Box, IconButton, MenuItem } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { displayDateTime, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { deleteDisable } from 'src/constants/messageHelpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import axios, { CancelTokenSource } from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import ManageVolumeData from './ManageVolumeData';
import { camelCase } from 'lodash';

const renderedFrom = `${camelCase(sidebarResource.iotChart)}_VolumeData`;

const VolumeData = ({ assetId }) => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, selectedRecords } = state;
  const [showManageDialog, setShowManageDialog] = useState({ open: false, data: null });
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [columns, setColumns] = useState(null);

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, selectedEntity]);

  const fetchGridColumns = () => {
    const columns = [
      {
        accessor: 'date',
        Header: 'Date',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => <div>{displayDateTime(row?.original?.date)}</div>
      },
      {
        accessor: 'TotalVolInBBLs',
        Header: 'Total Vol In BBLs',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => <div>{row?.original?.TotalVolInBBLs}</div>
      },
      {
        accessor: 'TotalVolOutBBLs',
        Header: 'Total Vol Out BBLs',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => <div>{row?.original?.TotalVolOutBBLs}</div>
      },
      {
        accessor: 'TotalMinutesRecycle',
        Header: 'Total Minutes Recycle',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => <div>{row?.original?.TotalMinutesRecycle}</div>
      },
      {
        accessor: 'TotalMinutesPurge',
        Header: 'Total Minutes Purge',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => <div>{row?.original?.TotalMinutesPurge}</div>
      },
      {
        accessor: 'TotalMinutesFill',
        Header: 'Total Minutes Fill',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => <div>{row?.original?.TotalMinutesFill}</div>
      },
      {
        accessor: 'minid',
        Header: 'MINID',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => <div>{row?.original?.minid}</div>
      }
    ];
    setColumns([...columns, ActionsRenderer]);
  };

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
        <HtmlTooltip title={'Edit'}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageDialog({ open: true, data: row?.original });
              }}
            >
              <EditIcon fontSize="small" color={'primary'} />
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
              <Delete fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${routes?.serializedAsset?.path}/iot-volume${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u: any) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['canDelete'] = true;
          finalObject['isChecked'] = selectedRecords?.some((s) => s?._id === u?._id);
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    deepFilter = `${deepFilter}&asset=${assetId}`;
    return deepFilter;
  };

  const handleDelete = () => {
    setIsSubmitting(true);
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`${routes?.serializedAsset?.path}/iot-volume/remove`, { ids: ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords?.length})`}
        </MenuItem>
      </>
    );
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setShowManageDialog({ open: true, data: null });
          }}
        >
          Add Volume Data
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={permissions?.serializedAsset?.isUpdate}
        isActionButtonVisible={permissions?.serializedAsset?.isUpdate}
        actionButtonMenuItems={<ActionMenuItems />}
        actionButtonProps={{ disabled: selectedRecords.length === 0 }}
        addButtonMenuItems={addButtonMenuItems()}
        hasXpadding={false}
      />
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 300px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          hideAction={!permissions?.serializedAsset?.isUpdate}
          hideSelection={!permissions?.serializedAsset?.isUpdate}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete volume data?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={handleDelete}
        />
      )}
      {showManageDialog.open && (
        <ManageVolumeData
          data={showManageDialog.data}
          onClose={() => setShowManageDialog({ open: false, data: null })}
          onSuccess={() => {
            fetchData();
            setShowManageDialog({ open: false, data: null });
          }}
          assetId={assetId}
        />
      )}
    </Fragment>
  );
};

export default VolumeData;
