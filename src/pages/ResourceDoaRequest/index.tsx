import { Box, IconButton } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { DOA_STATUS, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
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
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    const column: any = [
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
        accessor: 'resource',
        Header: 'Resource',
        Cell: ({ row }) => (
          <div>
            <p className="text-truncate">{row?.original?.resource}</p>
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
      }
    ];
    setColumns([...column, ...getStaticFields(), ActionsRenderer]);
  }, []);

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
  };

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
          return {
            ...finalObject,
            _id: d?._id,
            entity: d?.entity,
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
          message={`Are you sure you want to ${DOA_STATUS.approved === confermApproveRejectBox.type ? 'Approve' : 'Reject'} ? `}
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
