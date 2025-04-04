import { Box, IconButton } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DOA_STATUS, gridLoadingTimeout, sidebarResource } from 'src/constants/helpers';
import { Link } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CancelOutlined, CheckCircleOutlined } from '@mui/icons-material';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { useData } from 'src/StateProvider/Provider';
import axios, { CancelTokenSource } from 'axios';
import { FiExternalLink } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';

const renderedFrom = camelCase(sidebarResource?.resourceDoaRequest);

const ResourceDoaRequest = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });

  const { page, limit, search, filters, sorting, showFilteredRecordsOnly } = state;

  const [confermApproveRejectBox, setConfermApproveRejectBox] = useState({ open: false, type: '', data: null });

  const columns: any = [
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
              history.push(`${routes.resourceDoaRequestDetail.path}/${row?.original?._id?._id}`);
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
      accessor: 'resource',
      Header: 'Resource',
      Cell: ({ row }) => (
        <div>
          <p className="text-truncate">{row?.original?.resource}</p>
        </div>
      )
    },
    {
      accessor: 'requestedBy',
      Header: 'Requested By',
      show: true,
      Cell: ({ row }) => (
        <div>
          {row?.original?.requestedBy ? (
            <Link className="link" to={`/user/detail/${row?.original?.requestedById}`} title={row?.original?.requestedBy} target={'_blank'}>
              {row?.original?.requestedBy}
            </Link>
          ) : (
            <NoDataCell />
          )}
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
          <HtmlTooltip title={row?.original?.canPerform ? 'Approve' : ''}>
            <span>
              <IconButton
                size="small"
                aria-label="Approve"
                disabled={!row?.original?.canPerform}
                onClick={() => {
                  setConfermApproveRejectBox({ open: true, type: DOA_STATUS.approved, data: row?.original });
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
                  setConfermApproveRejectBox({ open: true, type: DOA_STATUS.rejected, data: row?.original });
                }}
              >
                <CancelOutlined fontSize="small" color={row?.original?.canPerform ? 'error' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        </>
      )
    }
  ];

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${routes.resourceDoaRequest.path}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        const rows = data?.map((d) => ({
          _id: d?._id,
          entity: d?.entity,
          requestedBy: d?.createdBy?.optionLabel,
          requestedById: d?.createdBy?.optionValue,
          refrenceFrom:
            d?.resource === sidebarResource?.serializedAssetStatusChangeRequest
              ? d?.serializedAssetStatusChangeRequest?.assetDetail?.optionLabel
              : d?.resource === sidebarResource?.purchaseRequisition
                ? d?.purchaseRequisition?.optionLabel
                : '',
          resourceId:
            d?.resource === sidebarResource?.serializedAssetStatusChangeRequest
              ? d?.serializedAssetStatusChangeRequest?.assetDetail?.optionValue
              : d?.referenceId,
          referenceId: d?.referenceId,
          status: d?.status,
          resource: d?.resource,
          canPerform: d?.doaUsers?.find((u) => u?.users?.includes(user?.user?._id))?.isUpdate ? true : false
        }));
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

  const handleApproveReject = () => {
    axiosInstance()
      .put(`${routes.resourceDoaRequest.path}`, {
        _id: confermApproveRejectBox?.data?._id,
        status: confermApproveRejectBox?.type,
        entity: confermApproveRejectBox?.data?.entity,
        referenceId: confermApproveRejectBox?.data?.referenceId,
        resource: confermApproveRejectBox?.data?.resource
      })
      .then((res) => {
        fetchData();
        setConfermApproveRejectBox({ open: false, type: '', data: null });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.resourceDoaRequest, title: resources?.resourceDoaRequest?.titlePlural }]} />
      </div>
      <CustomContainer>
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
      {confermApproveRejectBox.open && (
        <ConfirmationDialog
          open={confermApproveRejectBox.open}
          message={`Are you sure to ${confermApproveRejectBox.type} ? `}
          onClose={() => {
            setConfermApproveRejectBox({ open: false, type: '', data: null });
          }}
          onOk={handleApproveReject}
        />
      )}
    </section>
  );
};

export default ResourceDoaRequest;
