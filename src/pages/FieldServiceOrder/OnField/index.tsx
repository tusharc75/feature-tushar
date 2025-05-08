import { Box, IconButton } from '@mui/material';
import { isArray, isObject, startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import FreeStyleMultiSelect from 'src/components/CustomReactTable/Cells/FreeStyleMultiSelect';
import GpsLocationCell from 'src/components/CustomReactTable/Cells/GpsLocationCell';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import {
  displayDate,
  gridLoadingTimeout,
  MATERIAL_TYPE,
  rentalManagement,
  sidebarResource
} from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const OnField = ({ rentalId, referenceFrom }) => {

  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${referenceFrom}_onField`;

  const {
    state: { permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });

  const [fieldLabels, setFieldLabels] = useState(null);
  const [columns, setColumns] = useState(null);

  const fetchFieldLabels = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().put(`/field/find-field-labels`, {
        fields: [
          {
            resource: sidebarResource.product,
            fieldNames: ['productName']
          },
          {
            resource: sidebarResource.serializedAsset,
            fieldNames: ['serialNumber', 'position', 'wellNumber', 'warehouse', 'jobCount', 'currentGpsLocation', 'currentGpsWellNames']
          }
        ]
      });
      setFieldLabels(data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchFieldLabels();
  }, [rentalId]);

  useEffect(() => {
    if (fieldLabels) {
      fetchColumn();
    }
  }, [fieldLabels]);

  const fetchColumn = async () => {
    setColumns(null);
    const productFields = fieldLabels?.find((d) => d.resource === sidebarResource.product)?.fieldNames || [];
    const assetFields = fieldLabels?.find((d) => d.resource === sidebarResource.serializedAsset)?.fieldNames || [];
    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        minWidth: 100,
        width: 100,
        disabled: true,
        Cell: ({ row }) => <h5 className="text-truncate">{row.original.index}</h5>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        Cell: ({ row }) => (row.original['type'] ? <p>{startCase(row.original?.type)}</p> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: 'Details',
        disabled: true,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p className="text-truncate">{row?.original?.detail}</p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.serializedAssetDetail.path}/${row?.original?._id}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        disabled: true,
        Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.qty || <NoDataCell />}</h5>
      },
      ...(assetFields?.find((f) => f.fieldName === 'serialNumber')
        ? [
          {
            accessor: 'serialNumber',
            Header: assetFields?.find((f) => f.fieldName === 'serialNumber')?.fieldLabel || 'Serial Number',
            Cell: ({ row }) => (row?.original?.serialNumber ? <h5 className="text-truncate">{row?.original?.serialNumber}</h5> : <NoDataCell />)
          }
        ]
        : []),
      ...(assetFields?.find((f) => f.fieldName === 'position')
        ? [
          {
            accessor: 'position',
            Header: assetFields?.find((f) => f.fieldName === 'position')?.fieldLabel || 'Position',
            Cell: ({ row }) => (row?.original?.position ? <h5 className="text-truncate">{row?.original?.position}</h5> : <NoDataCell />)
          }
        ]
        : []),
      ...(assetFields?.find((f) => f.fieldName === 'jobCount')
        ? [
          {
            accessor: 'jobCount',
            Header: assetFields?.find((f) => f.fieldName === 'jobCount')?.fieldLabel || 'jobCount',
            Cell: ({ row }) =>
              row?.original?.jobCount || row?.original?.jobCount === 0 ? (
                <h5 className="text-truncate">{row?.original?.jobCount}</h5>
              ) : (
                <NoDataCell />
              )
          }
        ]
        : []),
      ...(assetFields?.find((f) => f.fieldName === 'currentGpsLocation')
        ? [
          {
            accessor: 'currentGpsLocation',
            Header: assetFields?.find((f) => f.fieldName === 'currentGpsLocation')?.fieldLabel || 'currentGpsLocation',
            cell: ({ row }) => <GpsLocationCell value={row?.original?.currentGpsLocation} />
          }
        ]
        : []),
      ...(assetFields?.find((f) => f.fieldName === 'currentGpsWellNames')
        ? [
          {
            accessor: 'currentGpsWellNames',
            Header: assetFields?.find((f) => f.fieldName === 'currentGpsWellNames')?.fieldLabel || 'currentGpsWellNames',
            cell: ({ row }) => <FreeStyleMultiSelect value={row?.original?.currentGpsWellNames} />
          }
        ]
        : []),
      {
        accessor: 'productName',
        Header: productFields?.find((f) => f.fieldName === 'productName')?.fieldLabel || 'Product Name',
        Cell: ({ row }) =>
          row?.original?.productName ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row?.original?.productName}</h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.productDetail.path}/${row?.original?.productId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'description',
        Header: 'Description',
        Cell: ({ row }) => (row?.original?.description ? <h5 className="text-truncate">{row?.original?.description}</h5> : <NoDataCell />)
      },
      {
        accessor: 'warehouse',
        Header: assetFields?.find((f) => f.fieldName === 'warehouse')?.fieldLabel || 'Plant',
        Cell: ({ row }) =>
          row?.original?.warehouse ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row?.original?.warehouse}</h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.warehouseDetail.path}/${row?.original?.warehouseId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'status',
        Header: 'Asset Status',
        Cell: ({ row }) => (row?.original?.status ? <h5 className="text-truncate">{row?.original?.status}</h5> : <NoDataCell />)
      },
      ...(assetFields?.find((f) => f.fieldName === 'wellNumber')
        ? [
          {
            accessor: 'wellNumber',
            Header: assetFields?.find((f) => f.fieldName === 'wellNumber')?.fieldLabel,
            accessorFn: (original) => {
              return isArray(original?.wellNumber)
                ? original?.wellNumber[0]?.optionLabel
                : isObject(original?.wellNumber)
                  ? original?.wellNumber?.optionLabel
                  : original?.wellNumber;
            },
            Cell: ({ row }) => (
              <DropdownCell
                permissions={permissions}
                permissionForLinks={{}}
                field={{
                  fieldName: 'wellNumber',
                  lookupResource: sidebarResource.wellNumber
                }}
                original={row?.original}
              />
            )
          }
        ]
        : []),
      {
        accessor: 'manualStartDate',
        Header: 'Actual Start Date',
        Cell: ({ row }) =>
          row?.original?.manualStartDate ? (
            <h5 className="text-truncate" title={`${displayDate(row?.original?.manualStartDate)}`}>
              {displayDate(row?.original?.manualStartDate)}
            </h5>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'manualEndDate',
        Header: 'Actual End Date',
        Cell: ({ row }) =>
          row?.original?.manualEndDate ? (
            <h5 className="text-truncate" title={`${displayDate(row?.original?.manualEndDate)}`}>
              {displayDate(row?.original?.manualEndDate)}
            </h5>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'startDate',
        Header: 'System Start Date',
        show: false,
        Cell: ({ row }) =>
          row?.original?.startDate ? (
            <h5 className="text-truncate" title={`${displayDate(row?.original?.startDate)}`}>
              {displayDate(row?.original?.startDate)}
            </h5>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'endDate',
        Header: 'System End Date',
        show: false,
        Cell: ({ row }) =>
          row?.original?.endDate ? (
            <h5 className="text-truncate" title={`${displayDate(row?.original?.endDate)}`}>
              {displayDate(row?.original?.endDate)}
            </h5>
          ) : (
            <NoDataCell />
          )
      }
    ];
    setColumns(column);
  };

  const fetchData = async () => {
    axiosInstance()
      .get(`${rentalManagement.api}/${rentalId}/inventory`)
      .then(({ data: { data } }) => {
        const rows = data?.map((d, i) => ({
          index: i + 1,
          type: MATERIAL_TYPE.serializedAsset,
          detail: d?.inventory?.assetNumber,
          _id: d?.inventory?._id,
          qty: 1,
          serialNumber: '',
          position: d?.inventory?.position,
          jobCount: d?.inventory?.jobCount,
          currentGpsLocation: d?.inventory?.currentGpsLocation,
          currentGpsWellNames: d?.inventory?.currentGpsWellNames?.toString(),
          productName: d?.inventory?.product?.optionLabel,
          productId: d?.inventory?.product?.optionValue,
          description: d?.inventory?.productDescription?.optionLabel || d?.product?.productDescription,
          warehouse: d?.inventory?.warehouse?.optionLabel,
          warehouseId: d?.inventory?.warehouse?.optionValue,
          status: d?.status,
          wellNumber: d?.inventory?.wellNumber,
          manualStartDate: d?.manualStartDate,
          manualEndDate: d?.manualEndDate,
          startDate: d?.actualStartDate || d?.startDate,
          endDate: d?.actualEndDate || d?.endDate
        }));
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 293px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
          refreshGrid={fetchData}
          hideAction={true}
          hideSelection={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
};

export default OnField;
