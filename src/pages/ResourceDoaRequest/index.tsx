import { Autocomplete, Box, IconButton, TextField } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { DOA_RESOURCE, DOA_STATUS, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CancelOutlined, CheckCircleOutlined } from '@mui/icons-material';
import { useData } from 'src/StateProvider/Provider';
import axios, { CancelTokenSource } from 'axios';
import { FiExternalLink } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import { ListingPageHeader } from 'src/components/PageHeaders';
import CommentDialog from 'src/components/CommentDialog';

const renderedFrom = camelCase(sidebarResource?.resourceDoaRequest);

const ResourceDoaRequest = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });

  const { page, limit, search, filters, sorting, showFilteredRecordsOnly } = state;

  const [openComment, setOpenComment] = useState({ open: false, status: '', data: null });
  const [columns, setColumns] = useState(null);
  const resourceOptions = DOA_RESOURCE?.map((r) => ({ optionLabel: resources[r?.key]?.titlePlural, optionValue: r?.resorce }));
  const [selectedResource, setSelectedResource] = useState({
    optionLabel: resources[DOA_RESOURCE[0]?.key]?.titlePlural,
    optionValue: DOA_RESOURCE[0]?.resorce
  });

  const { generateColumns } = useColumns();

  useEffect(() => {
    if (selectedResource && selectedResource?.optionValue) {
      fetchColumns();
    }
  }, [selectedResource]);

  const fetchColumns = () => {
    setColumns(null);
    axiosInstance()
      .get(`/field?resource=${selectedResource?.optionValue}`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(
          renderedFrom,
          data?.filter(
            (d) =>
              !['asset', 'assetStatus', 'status', 'requestedBy', 'requestedDate', 'responsedBy', 'responsedDate']?.includes(d?.fieldData?.fieldName)
          )
        );
        setColumns([
          {
            accessor: 'refrenceFrom',
            Header: 'Name',
            show: true,
            disabled: true,
            Cell: ({ row }) => (
              <div className="flex items-center gap-1">
                <p
                  className="text-truncate link"
                  onClick={() => {
                    history.push(`${routes.resourceDoaRequestDetail.path}/${row?.original?._id}`, {
                      resource: row?.original?.resource
                    });
                  }}
                >
                  {row?.original?.refrenceFrom}
                </p>
                <IconButton
                  size="small"
                  onClick={() => {
                    if (row?.original?.resource === sidebarResource?.serializedAssetStatusChangeRequest) {
                      window.open(`${routes.serializedAssetDetail.path}/${row.original.resourceId}`);
                    } else if (row?.original?.resource === sidebarResource?.purchaseRequisition) {
                      window.open(`${routes.purchaseRequisitionDetail.path}/${row.original.resourceId}`);
                    }
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </div>
            )
          },
          {
            accessor: 'status',
            Header: 'Status',
            Cell: ({ row }) => (
              <div>
                <p className="text-truncate">{row?.original?.status}</p>
              </div>
            )
          },
          ...newColumns,
          ...getStaticFields(),
          ActionsRenderer
        ]);
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
        <HtmlTooltip title={row?.original?.canPerform ? 'Approve' : ''}>
          <span>
            <IconButton
              size="small"
              aria-label="Approve"
              disabled={!row?.original?.canPerform}
              onClick={() => {
                setOpenComment({ open: true, status: DOA_STATUS.approved, data: row?.original });
              }}
            >
              <CheckCircleOutlined fontSize="small" color={row?.original?.canPerform ? 'secondary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={row?.original?.canPerform ? 'Reject' : ''}>
          <span>
            <IconButton
              size="small"
              aria-label="Reject"
              disabled={!row?.original?.canPerform}
              onClick={() => {
                setOpenComment({ open: true, status: DOA_STATUS.rejected, data: row?.original });
              }}
            >
              <CancelOutlined fontSize="small" color={row?.original?.canPerform ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly, selectedResource]);

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${routes.resourceDoaRequest.path}?resource=${selectedResource?.optionValue}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        const rows = data?.map((d) => {
          let status = d?.status;
          const doaUser = d?.doaUsers?.find((u) => u?.users?.map((d) => d?._id)?.includes(user?.user?._id));
          if (!doaUser?.isUpdate) {
            const prevDoaUser = d?.doaUsers?.find((u) => u?.index === doaUser?.index - 1);
            if (prevDoaUser) {
              status = `${status} - Awaiting for (${prevDoaUser?.users?.map((u) => u?.name)?.join(', ')})`;
            }
          }
          let finalObject = prepareDataForGrid(d, user);
          let referenceData = prepareDataForGrid(d?.referenceData || {});
          return {
            ...referenceData,
            ...finalObject,
            _id: d?._id,
            entity: d?.entity,
            refrenceFrom: d?.refrenceNumber,
            resourceId: d?.resource === sidebarResource?.serializedAssetStatusChangeRequest ? d?.referenceData?.asset?.optionValue : d?.referenceId,
            referenceId: d?.referenceId,
            canPerform: doaUser?.isUpdate || false,
            status: status,
            resource: d?.resource
          };
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const handleApproveReject = (comment = '') => {
    axiosInstance().put(`${routes.resourceDoaRequest.path}`, {
      _id: openComment?.data?._id,
      status: openComment?.status,
      entity: openComment?.data?.entity,
      referenceId: openComment?.data?.referenceId,
      resource: openComment?.data?.resource,
      doaComment: comment
    }).then(({ data }) => {
      toastConfig.setToastConfig({
        message: data.message,
        open: true,
        type: 'success'
      });
      fetchData();
      setOpenComment({ open: false, status: '', data: null });
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };

  const leftSideContents = () => {
    return (
      <>
        <Autocomplete
          options={resourceOptions}
          getOptionLabel={(option: any) => option?.optionLabel || ''}
          isOptionEqualToValue={(option: any, value: any) => option.optionLabel === value.optionLabel}
          fullWidth
          style={{ maxWidth: '300px' }}
          value={selectedResource}
          onChange={(event, newValue) => {
            setSelectedResource(newValue);
          }}
          size="small"
          renderInput={(params) => <TextField {...params} label={`Select Resource`} variant="outlined" />}
        />
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.resourceDoaRequest, title: resources?.resourceDoaRequest?.titlePlural }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader leftSideContents={leftSideContents()} isActionButtonVisible={false} isAddButtonVisible={false} />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            resource={sidebarResource.resourceDoaRequest}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {openComment.open && (
        <CommentDialog
          required={false}
          handleClose={() => {
            setOpenComment({ open: false, status: '', data: null });
          }}
          handleSubmit={(comment) => {
            handleApproveReject(comment);
          }}
        />
      )}
    </section>
  );
};

export default ResourceDoaRequest;
