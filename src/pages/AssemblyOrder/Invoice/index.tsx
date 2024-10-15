import { Box, Grid, IconButton } from '@material-ui/core';
import { startCase } from 'lodash';
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

const Invoice = ({ assemblyOrderData, renderedFrom, stepFullScreen }) => {
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchFields();
  }, [assemblyOrderData]);

  const fetchFields = async () => {
    const response = await fetch_child_resource_fields(CHILD_RESOURCE.assemblyOrderMaterial, assemblyOrderData?.currency || 'USD', false);
    const data = response?.filter((e) => !['detail', 'description']?.includes(e?.fieldName));
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
        Cell: ({ row }) => (row.original['type'] ? <h5>{`${startCase(row.original?.type)} `}</h5> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: 'Details',
        disabled: true,
        minWidth: 200,
        width: 200,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
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
                  } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
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
      {
        accessor: 'managedPackageName',
        Header: 'Managed Package Name',
        width: 200,
        show: false,
        Cell: ({ row }) => {
          return row.original?.managedPackageName ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row.original?.managedPackageName}</h5>{' '}
              <Box>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.managedPackagesDetail.path}/${row.original.managedPackageId}`);
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
      }
    ];
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      Cell: ({ row, table }) => <></>
    });
    setColumns(coloum);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });

    const {
      data: { data }
    } = await axiosInstance().get(`${routes.assemblyOrder.path}/loading/${assemblyOrderData?._id}`);

    const rows = data?.filter((e) => e.parentId === null);

    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent.packageDetail?.packageName || '';
      parent.description = parent?.packageDetail?.packageDescription || '';
      parent.qtyDisplay = parent.qty;
      parent.managedPackageId = parent?.managedPackageDetail?._id;
      parent.managedPackageName = parent?.managedPackageDetail?.managedPackageName;
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
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow?.type === MATERIAL_TYPE.serializedAsset
            ? _subRow?.assetDetail?.assetNumber
            : '';
      _subRow.description = _subRow.type === MATERIAL_TYPE.product ? _subRow?.productDetail?.productDescription : '';
      _subRow.qty = _subRow.qty || 1;
      _subRow.qtyDisplay = _subRow.qty || 1;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center" gridGap={'8px'}>
          <PreviewDownload
            fileName={`${routes.assemblyOrder.title}-${assemblyOrderData?.assemblyOrderNumber}`}
            resource={sidebarResource.assemblyOrder}
            referenceId={assemblyOrderData._id}
            referenceLabel={assemblyOrderData?.assemblyOrderNumber}
            columns={columns}
            isSendEmail={true}
            isAsyncDownload={true}
            defaultColumns={['index', `detail`, `description`, `qty`]}
          />
        </Box>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={12} sm={12}>
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
