import { Box, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import PreviewDownload from 'src/components/PreviewDownload';
import { CHILD_RESOURCE, MATERIAL_TYPE, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';

const Invoice = ({ assemblyOrderData, renderedFrom, stepFullScreen }) => {
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns, getMaterialLabel } = useColumns();
  const [columns, setColumns] = useState(null);

  const {
    state: { resources }
  }: any = useData();

  useEffect(() => {
    fetchFields();
  }, [assemblyOrderData]);

  const fetchFields = async () => {
    const response = await fetch_child_resource_fields(CHILD_RESOURCE.assemblyOrderMaterial, assemblyOrderData?.currency || 'USD', false);
    const data = response;
    let newColumns = generateColumns(renderedFrom, data, null, false, assemblyOrderData?.currency || 'USD');
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <h5 className="text-truncate">{row.original.index}</h5>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 150,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (row.original['type'] ? <h5>{`${getMaterialLabel(row.original?.type)}`}</h5> : <NoDataCell />),
        accessorFn: (original) => { return getMaterialLabel(original?.type) }
      },
      {
        accessor: 'detail',
        Header: 'Details',
        disabled: true,
        minWidth: 200,
        width: 200,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row.original?.detail}</h5>{' '}
            <Box>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.package) {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.service) {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </Box>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        show: false,
        Cell: ({ row }) => {
          return row.original['description'] ? <h5 className="text-truncate">{row.original.description}</h5> : <NoDataCell />;
        }
      },
    ];
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'workOrder',
      Header: 'Work Order',
      width: 200,
      show: false,
      Cell: ({ row }) => {
        return row.original?.workOrder ? (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row.original?.workOrder}</h5>{' '}
            <Box>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.workOrderDetail.path}/${row.original.workOrderId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </Box>
          </div>
        ) : (
          <NoDataCell />
        );
      }
    })
    coloum.push({
      accessor: 'serializedPackage',
      Header: 'Serialized Package Number',
      width: 200,
      show: false,
      Cell: ({ row }) => {
        return row.original?.serializedPackage ? (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row.original?.serializedPackage}</h5>{' '}
            <Box>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.serializedPackagesDetail.path}/${row.original.serializedPackageId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </Box>
          </div>
        ) : (
          <NoDataCell />
        );
      }
    })
    setColumns(coloum);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });

    const {
      data: { data }
    } = await axiosInstance().get(`${routes.assemblyOrder.path}/work-order/${assemblyOrderData._id}`);

    const rows = data?.filter((e) => e.parentId === null);

    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent.packageDetail?.packageName;
      parent.description = parent?.packageDetail?.packageDescription || '';
      parent.qty = parent.qty;
      parent.serializedPackageId = parent?.serializedPackage?.optionValue;
      parent.serializedPackage = parent?.serializedPackage?.optionLabel;
      parent.workOrderId = parent?.workOrder?._id;
      parent.workOrder = parent?.workOrder?.workOrderNumber;
      parent.subRows = generateNestedData(data, parent);
    });

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.product ? _subRow.productDetail?.productName
          : _subRow?.type === MATERIAL_TYPE.service ? _subRow?.serviceDetail?.serviceName
            : _subRow?.type === MATERIAL_TYPE.package ? _subRow?.packageDetail?.packageName
              : '';
      _subRow.description = _subRow.type === MATERIAL_TYPE.product ? _subRow?.productDetail?.productDescription :
        _subRow?.type === MATERIAL_TYPE.package ? _subRow?.packageDetail?.packageDescription :
          _subRow?.type === MATERIAL_TYPE.service ? _subRow?.serviceDetail?.serviceDescription
            : '';
      _subRow.qty = _subRow.qty || 1;
      _subRow.serializedPackageId = _subRow?.serializedPackage?.optionValue;
      _subRow.serializedPackage = _subRow?.serializedPackage?.optionLabel;
      _subRow.workOrderId = _subRow?.workOrder?._id;
      _subRow.workOrder = _subRow?.workOrder?.workOrderNumber;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center" gap="8px">
          <PreviewDownload
            fileName={`${resources?.assemblyOrder?.titlePlural}-${assemblyOrderData?.assemblyOrderNumber}`}
            resource={sidebarResource.assemblyOrder}
            referenceId={assemblyOrderData._id}
            referenceLabel={assemblyOrderData?.assemblyOrderNumber}
            columns={columns}
            isSendEmail={true}
            isAsyncDownload={true}
          />
        </Box>
      </Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          {columns ? (
            <>
              <Box zIndex={5} width={'100%'}>
                <CustomReactTable
                  height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
                  columns={columns}
                  state={state}
                  dispatch={dispatch}
                  renderedFrom={renderedFrom}
                  refreshGrid={fetchData}
                  hideSelection={true}
                  hideAction={true}
                  isClientSideGrid={true}
                  expander={true}
                />
              </Box>
            </>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default Invoice;
