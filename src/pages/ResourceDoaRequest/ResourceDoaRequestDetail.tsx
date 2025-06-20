import { Box, IconButton } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { CHILD_RESOURCE, DOA_STATUS, MATERIAL_TYPE, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { useParams, useHistory } from 'react-router-dom';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import DetailsPage from '../../components/Shared/DetailsPage';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import CommentDialog from 'src/components/CommentDialog';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { camelCase, startCase } from 'lodash';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { isMobile, isTablet } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const ResourceDoaRequestDetail = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();

  const { resource, currency } = history.location?.state;
  const renderedFrom = `${camelCase(resource)}_doaRequest`

  const {
    state: { user, resources }
  }: any = useData();

  const [doaData, setDoaData] = useState(null);
  const [fields, setFields] = useState(null);
  const [openComment, setOpenComment] = useState({ open: false, status: '' });

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
    fetchData();
  }, [id, resource]);

  const fetchGridColumns = async () => {
    if (resource === sidebarResource?.serializedAssetStatusChangeRequest) {
      axiosInstance()
        .get(`/field?resource=${resource}&view=true`)
        .then(({ data: { data } }) => {
          setFields([...data]);
        });
    } else if ([sidebarResource?.purchaseRequisition, sidebarResource?.invoice]?.includes(resource)) {
      const data = await fetch_child_resource_fields(
        sidebarResource?.purchaseRequisition ? CHILD_RESOURCE.purchaseRequisitionDetail : CHILD_RESOURCE.invoiceProduct,
        currency,
        false
      );
      const newColumns = generateColumns(renderedFrom, data, null, false, currency);
      const coloum: any = [
        {
          accessor: 'index',
          Header: 'Index',
          width: 70,
          sticky: 'left',
          Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
          Footer: () => {
            return <>Total</>;
          }
        },
        {
          accessor: 'type',
          Header: 'Type',
          disableFilters: true,
          width: 100,
          sticky: isMobile || isTablet ? 'none' : 'left',
          Cell: ({ row }) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p>{`${startCase(row.original?.type)} `}</p>
            </div>
          )
        },
        {
          accessor: 'detail',
          Header: 'Detail',
          minWidth: 300,
          width: 300,
          disabled: true,
          sticky: isMobile || isTablet ? 'none' : 'left',
          Cell: ({ row, table }) => (
            <div className="flex items-center gap-2">
              <p className="text-truncate">{row.original?.detail}</p>
              {![MATERIAL_TYPE.manualEntry]?.includes(row.original.type) && (
                <IconButton
                  size="small"
                  onClick={() => {
                    if (row.original.type === MATERIAL_TYPE.service) {
                      window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                    } else if (row.original.type === MATERIAL_TYPE.product) {
                      window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                    } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                      window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                    } else {
                      window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                    }
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              )}
            </div>
          )
        },
        {
          accessor: 'description',
          Header: 'Description',
          Cell: ({ row }) => {
            return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
          }
        }
      ];
      setFields([...coloum, ...newColumns])
    }
  };

  const fetchData = async () => {
    const doaResponse: any = await axiosInstance().get(`${routes.resourceDoaRequest.path}/detail/${id}`);
    if (doaResponse?.data?.data) {
      const _data = doaResponse?.data?.data;
      setDoaData({
        ..._data,
        ..._data?.referenceData,
        _id: _data?._id,
        doaStatus: _data?.status,
        userDOAstatus: _data?.doaUsers?.find((u) => u?.users?.map((d) => d?._id)?.includes(user?.user?._id))?.status,
        canPerform: _data?.doaUsers?.find((u) => u?.users?.map((d) => d?._id)?.includes(user?.user?._id))?.isUpdate ? true : false,
      });
      if ([sidebarResource?.purchaseRequisition, sidebarResource?.invoice]?.includes(resource)) {
        let rows = _data.material.filter((e) => !e.parentId);
        rows.forEach((parent, i) => {
          parent.index = i + 1;
          parent.detail =
            parent.type === MATERIAL_TYPE.product
              ? parent.productDetail?.productName
              : parent.type === MATERIAL_TYPE.service
                ? parent.serviceDetail?.serviceName
                : parent.type === MATERIAL_TYPE.package
                  ? parent.packageDetail?.packageName
                  : parent.type === MATERIAL_TYPE.serializedAsset
                    ? parent.serializedAssetDetail?.assetNumber
                    : parent.detail || parent.description;
          parent.description =
            parent.type === MATERIAL_TYPE.product
              ? parent?.productDetail?.productDescription
              : parent.type === MATERIAL_TYPE.package
                ? parent?.packageDetail?.packageDescription
                : parent.type === MATERIAL_TYPE.serializedAsset
                  ? parent?.serializedAssetDetail?.product?.productDescription
                  : parent.type === MATERIAL_TYPE.service
                    ? parent?.serviceDetail?.serviceDescription
                    : parent.description || '';
          parent.qty = parent.qty;
          parent.subRows = generateNestedData(_data.material, parent);
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
      }
    }
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow.packageDetail?.packageName
            : _subRow.type === MATERIAL_TYPE.serializedAsset
              ? _subRow.serializedAssetDetail.assetNumber
              : _subRow.type === MATERIAL_TYPE.service
                ? _subRow.serviceDetail?.serviceName
                : _subRow?.detail;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow?.packageDetail?.packageDescription
            : _subRow.type === MATERIAL_TYPE.serializedAsset
              ? parent.description
              : _subRow.type === MATERIAL_TYPE.service
                ? _subRow?.serviceDetail?.serviceDescription
                : '';
      _subRow.qty = _subRow.qty;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const handleApproveReject = (comment) => {
    axiosInstance()
      .put(`${routes.resourceDoaRequest.path}`, {
        _id: doaData._id,
        status: openComment?.status,
        entity: doaData?.entity,
        referenceId: doaData?.referenceId,
        resource: doaData?.resource,
        doaComment: comment
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          message: data.message,
          open: true,
          type: 'success'
        });
        fetchData();
        setOpenComment({ open: false, status: '' });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ ...routes.resourceDoaRequest, title: resources?.resourceDoaRequest?.titleSingular }, { title: doaData?.refrenceNumber }]} />
        </Box>
        <Box className="controls-v1">
          {doaData?.userDOAstatus === DOA_STATUS.pending && (
            <Box className="control-buttons-v1">
              <ThemeButton
                onClick={() => {
                  setOpenComment({ open: true, status: DOA_STATUS.approved });
                }}
                disabled={!doaData?.canPerform}
                startIcon={<ThumbUpIcon />}
                buttonType="themeBorder"
              >
                {'Accept'}
              </ThemeButton>
              <ThemeButton
                onClick={() => {
                  setOpenComment({ open: true, status: DOA_STATUS.rejected });
                }}
                disabled={!doaData?.canPerform}
                startIcon={<ThumbDownIcon />}
                buttonType="red"
              >
                {'Reject'}
              </ThemeButton>
            </Box>
          )}
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {doaData && fields?.length ? (
          <div className="p-2">
            {resource === sidebarResource?.serializedAssetStatusChangeRequest ? (
              <DetailsPage data={doaData} fields={fields} />
            ) : [sidebarResource?.purchaseRequisition, sidebarResource?.invoice]?.includes(resource) ? (
              <Box zIndex={5}>
                <CustomReactTable
                  height={'calc(100vh - 300px)'}
                  columns={fields}
                  state={state}
                  dispatch={dispatch}
                  refreshGrid={fetchData}
                  hideSelection={true}
                  hideAction={true}
                  renderedFrom={renderedFrom}
                  isClientSideGrid={true}
                  expander={true}
                />
              </Box>
            ) : null}
          </div>
        ) : (
          <>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </>
        )}
        {openComment.open && (
          <CommentDialog
            required={false}
            handleClose={() => {
              setOpenComment({ open: false, status: '' });
            }}
            handleSubmit={(comment) => {
              handleApproveReject(comment);
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default ResourceDoaRequestDetail;
