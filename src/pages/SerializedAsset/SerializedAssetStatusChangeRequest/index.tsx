import { Box, MenuItem, TextField } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import routes from '../../../components/Helpers/Routes';
import { ASSET_APPROVAL_STATUS, gridLoadingTimeout, prepareDataForGrid, serializedAsset, sidebarResource } from '../../../constants/helpers';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Autocomplete from '@mui/material/Autocomplete';

const renderedFrom = camelCase(sidebarResource.serializedAssetStatusChangeRequest);

const SerializedAssetStatusChangeRequest = () => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { permissions, selectedEntity, resources }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState({ open: false, status: null });
  const [renderCount, setRenderCount] = useState(0);
  const [approveRejectRecord, setApproveRejectRecord] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(ASSET_APPROVAL_STATUS.pending);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (renderCount > 0) {
      fetchData();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly, selectedStatus]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.serializedAssetStatusChangeRequest}`)
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
              disabled={!permissions?.serializedAsset?.isUpdate || row?.original?.status !== ASSET_APPROVAL_STATUS.pending ? true : false}
              onClick={() => {
                setApproveRejectRecord(row?.original);
                setShowConfirmDialog({ open: true, status: ASSET_APPROVAL_STATUS.approved });
              }}
            >
              <CheckCircleIcon
                fontSize="small"
                color={!permissions?.serializedAsset?.isUpdate || row?.original?.status !== ASSET_APPROVAL_STATUS.pending ? 'disabled' : 'primary'}
              />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={'Reject'}>
          <span>
            <IconButton
              size="small"
              aria-label="Reject"
              disabled={!permissions?.serializedAsset?.isUpdate || row?.original?.status !== ASSET_APPROVAL_STATUS.pending ? true : false}
              onClick={() => {
                setApproveRejectRecord(row?.original);
                setShowConfirmDialog({ open: true, status: ASSET_APPROVAL_STATUS.rejected });
              }}
            >
              <CancelIcon
                fontSize="small"
                color={!permissions?.serializedAsset?.isUpdate || row?.original?.status !== ASSET_APPROVAL_STATUS.pending ? 'disabled' : 'error'}
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

    if (selectedStatus && selectedStatus !== '') {
      deepFilters.push({ field: 'status', term: selectedStatus });
    }

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
    return `${deepFilter}`;
  };

  const handleStatusChange = (status) => {
    let _ids = [];
    if (approveRejectRecord) {
      _ids.push(approveRejectRecord._id);
    } else {
      selectedRecords?.forEach((e) => {
        _ids.push(e._id);
      });
    }
    axiosInstance()
      .put(`${serializedAsset.api}/status-approval-process`, { _ids: _ids, status: status })
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

  const statusOptions = [
    { optionLabel: ASSET_APPROVAL_STATUS.pending, optionValue: ASSET_APPROVAL_STATUS.pending },
    { optionLabel: ASSET_APPROVAL_STATUS.approved, optionValue: ASSET_APPROVAL_STATUS.approved },
    { optionLabel: ASSET_APPROVAL_STATUS.rejected, optionValue: ASSET_APPROVAL_STATUS.rejected }
  ];

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs
          routes={[{ ...routes.serializedAssetStatusChangeRequest, title: resources?.serializedAssetStatusChangeRequest?.titlePlural }]}
        />
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
                  setShowConfirmDialog({ open: true, status: ASSET_APPROVAL_STATUS.approved });
                }}
                disabled={
                  selectedRecords?.filter((o) => o.status === ASSET_APPROVAL_STATUS.pending)?.length === selectedRecords?.length &&
                    permissions?.serializedAsset?.isUpdate
                    ? false
                    : true
                }
              >
                Approve
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setShowConfirmDialog({ open: true, status: ASSET_APPROVAL_STATUS.rejected });
                }}
                disabled={
                  selectedRecords?.filter((o) => o.status === ASSET_APPROVAL_STATUS.pending)?.length === selectedRecords?.length &&
                    permissions?.serializedAsset?.isUpdate
                    ? false
                    : true
                }
              >
                Reject
              </MenuItem>
            </>
          }
          leftSideContents={
            <Autocomplete
              className={`w-full lg:w-[230px]`}
              options={statusOptions}
              getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
              isOptionEqualToValue={(option: any, val) => option.optionValue === val}
              value={
                statusOptions?.filter((data) => data.optionValue === selectedStatus)?.length
                  ? statusOptions.filter((data) => data.optionValue === selectedStatus)[0]
                  : ''
              }
              onChange={(e, val) => {
                setSelectedStatus(val && val.optionValue ? val.optionValue : '');
              }}
              renderInput={(params) => <TextField {...params} margin="none" size="small" name="status" label="Status" variant="outlined" fullWidth />}
            />
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
          message={`Are you sure you want to ${showConfirmDialog.status === ASSET_APPROVAL_STATUS.approved ? 'approve' : 'reject'} request ?`}
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
