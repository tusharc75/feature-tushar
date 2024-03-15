import { Box, Chip, MenuItem, TextField } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import routes from '../../../components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid, serializedAsset, sidebarResource } from '../../../constants/helpers';
import { CheckCircleOutline, Close } from '@material-ui/icons';

let searchTimeout;

const SerializedAssetStatusChangeRequest = () => {
  const renderedFrom = camelCase(routes?.serializedAssetStatusChangeRequest.title);
  const toastConfig = useContext(CustomToastContext);

  const history = useHistory();
  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: {
      permissions,
      selectedEntity,
      user: { user }
    }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState({ open: false, status: null });
  const [status, setStatus] = useState('');
  const [renderCount, setRenderCount] = useState(0);
  const [approveRejectRecord, setApproveRejectRecord] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchData();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=Serialized Asset Status Change Request`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(renderedFrom, data);
        setColumns([...newColumns, ActionsRenderer]);
      });
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
        <HtmlTooltip title={'Approve'}>
          <span>
            <IconButton
              size="small"
              aria-label="Approve"
              disabled={!permissions?.serializedAsset?.isUpdate || row?.original?.status !== 'Pending' ? true : false}
              onClick={() => {
                setApproveRejectRecord(row?.original);
                setShowConfirmDialog({ open: true, status: 'Approved' });
              }}
            >
              <CheckCircleOutline
                fontSize="small"
                color={!permissions?.serializedAsset?.isUpdate || row?.original?.status !== 'Pending' ? 'disabled' : 'primary'}
              />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={'Reject'}>
          <span>
            <IconButton
              size="small"
              aria-label="Reject"
              disabled={!permissions?.serializedAsset?.isUpdate || row?.original?.status !== 'Pending' ? true : false}
              onClick={() => {
                setApproveRejectRecord(row?.original);
                setShowConfirmDialog({ open: true, status: 'Rejected' });
              }}
            >
              <Close
                fontSize="small"
                color={!permissions?.serializedAsset?.isUpdate || row?.original?.status !== 'Pending' ? 'disabled' : 'primary'}
              />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${serializedAsset.api}/status-approval-process/${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

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

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return `${deepFilter}&filterType=and&filterByIdType=and`;
  };

  const handleStatusChange = (status) => {
    let assets = [];
    if (approveRejectRecord) {
      assets.push({
        _id: approveRejectRecord._id,
        assetId: approveRejectRecord.assetId,
        assetStatus: approveRejectRecord.assetStatus
      });
    } else {
      selectedRecords?.forEach((record) => {
        assets.push({
          _id: record._id,
          assetId: record.assetId,
          assetStatus: record.assetStatus
        });
      });
    }
    axiosInstance()
      .put(`${serializedAsset.api}/status-approval-process`, { assets: assets, status: status })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowConfirmDialog({ open: false, status: null });
        setApproveRejectRecord(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.serializedAssetStatusChangeRequest]} />
      </div>

      <CustomContainer>
        <ListingPageHeader
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          isAddButtonVisible={false}
          actionMenuItems={
            <>
              <MenuItem
                onClick={() => {
                  setShowConfirmDialog({ open: true, status: 'Approved' });
                }}
                disabled={
                  selectedRecords?.filter((o) => o.status === 'Pending')?.length === selectedRecords?.length && permissions?.serializedAsset?.isUpdate
                    ? false
                    : true
                }
              >
                Approve
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setShowConfirmDialog({ open: true, status: 'Approved' });
                }}
                disabled={
                  selectedRecords?.filter((o) => o.status === 'Pending')?.length === selectedRecords?.length && permissions?.serializedAsset?.isUpdate
                    ? false
                    : true
                }
              >
                Reject
              </MenuItem>
            </>
          }
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
            resource={sidebarResource.serializedAssetStatusChangeRequest}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>

      {showConfirmDialog.open && (
        <ConfirmationDialog
          open={showConfirmDialog.open}
          message={`Are you sure you want to mark Asset Status(s) ${showConfirmDialog.status} ? `}
          onClose={() => {
            setApproveRejectRecord(null);
            setShowConfirmDialog({ open: false, status: null });
          }}
          onOk={() => {
            handleStatusChange(showConfirmDialog.status);
          }}
        />
      )}
    </section>
  );
};

export default SerializedAssetStatusChangeRequest;
