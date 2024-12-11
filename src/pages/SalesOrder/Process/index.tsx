import { useState, useEffect } from 'react';
import { Box, IconButton } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { CHILD_RESOURCE, MATERIAL_TYPE, RESOURCE_LABEL, salesOrder, sidebarResource } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { startCase } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { useData } from 'src/StateProvider/Provider';
import { FiExternalLink } from 'react-icons/fi';

const renderedFrom = `${RESOURCE_LABEL.salesOrder}_Process`;

const Process = ({ salesOrderData, setNextStep, stepFullScreen }) => {
  const [columns, setColumns] = useState(null);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions }
  }: any = useData();

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.salesOrderProduct, salesOrderData?.currency, true);
    const newColumns = generateColumns(renderedFrom, data, null, false, salesOrderData?.currency);
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 100,
        sticky: 'left',
        disableFilters: false,
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
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
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        width: 200,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {<p title={row.original?.detail}>{row.original?.detail}</p>}
            <IconButton
              size="small"
              onClick={() => {
                if (row.original.type === 'service') {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === 'product') {
                  window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                } else {
                  window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                }
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => (row.original?.description ? <p title={row.original?.description}>{row.original?.description} </p> : <NoDataCell />)
      },
      {
        accessor: 'procurementType',
        Header: 'Procurement Type',
        width: 200,
        Cell: ({ row }) =>
          row.original?.procurementType ? <div>{<p title={row.original?.procurementType}>{row.original?.procurementType}</p>}</div> : <NoDataCell />
      },
      {
        accessor: 'procurementName',
        Header: 'Procurement',
        width: 200,
        Cell: ({ row }) =>
          row.original.procurementName ? (
            <div>
              {row.original?.procurementType === sidebarResource.purchaseRequisition ? (
                <a className="link text-truncate" href={`${routes.purchaseRequisitionDetail.path}/${row.original.procurementId}`} target="_blank">
                  {row.original.procurementName}
                </a>
              ) : row.original?.procurementType === sidebarResource.demandOrder ? (
                <a className="link text-truncate" href={`${routes.demandOrderDetail.path}/${row.original.procurementId}`} target="_blank">
                  {row.original.procurementName}
                </a>
              ) : row.original?.procurementType === sidebarResource.productionOrder ? (
                <a className="link text-truncate" href={`${routes.productionOrderDetail.path}/${row.original.procurementId}`} target="_blank">
                  {row.original.procurementName}
                </a>
              ) : (
                row.original.procurementName
              )}
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'procurementStatus',
        Header: 'Status',
        width: 200,
        Cell: ({ row }) =>
          row.original?.procurementStatus ? (
            <div>{<p title={row.original?.procurementStatus}>{row.original?.procurementStatus}</p>}</div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'leadTime',
        Header: 'Lead Time (Days)',
        Cell: ({ row }) => <div>{<p>{row.original['leadTime'] || 0}</p>}</div>,
        Footer: (info) => {
          let rows = info.table.getExpandedRowModel().rows;
          const total = rows
            ?.filter((f) => f.original.hasOwnProperty('leadTime') && !isNaN(f.original['leadTime']))
            .reduce((sum, row) => parseInt(row.original['leadTime']) + sum, 0);
          return <>{total}</>;
        }
      }
    ];
    coloum = [...coloum, ...newColumns];
    setColumns(coloum);
    fetchData();
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    setNextStep(false);

    await axiosInstance().put(`${salesOrder.api}/material-procurement/${salesOrderData._id}`);

    var material: any = [];
    const response = await axiosInstance().get(`${salesOrder.api}/material/${salesOrderData._id}`);
    material = response?.data?.data?.material;

    const rows = material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${
        parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.service
            ? parent.serviceDetail?.serviceName
            : parent.packageDetail?.packageName
      }`;
      parent.description =
        parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription
          : parent.type === MATERIAL_TYPE.package
            ? parent?.packageDetail?.packageDescription
            : parent?.serviceDetail?.serviceDescription;
      parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
      parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.qty = parent.qty;
      parent.isValid = true;
      if (parent?.procurement?.optionLabel) {
        parent.procurementName = parent?.procurement?.optionLabel;
        parent.procurementId = parent?.procurement?.optionValue;
        parent.procurementStatus = parent?.procurement?.status;
      } else {
        parent.procurementName = 'Inventory Available';
      }
      parent.subRows = generateNestedData(material, parent);
    });
    setNextStep(true);

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.detail = `${
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.service
            ? _subRow.serviceDetail?.serviceName
            : _subRow.packageDetail?.packageName
      }`;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow?.packageDetail?.packageDescription
            : _subRow?.serviceDetail?.serviceDescription;
      _subRow.leadTimeData = Array.isArray(_subRow.leadTime) ? _subRow.leadTime : [];
      _subRow.leadTime = Array.isArray(_subRow.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      _subRow.qty = `${parent.qty * _subRow.qty} `;
      _subRow.isValid = true;
      if (_subRow?.procurement?.optionLabel) {
        _subRow.procurementName = _subRow?.procurement?.optionLabel;
        _subRow.procurementId = _subRow?.procurement?.optionValue;
        _subRow.procurementStatus = _subRow?.procurement?.status;
      } else {
        _subRow.procurementName = 'Inventory Available';
      }
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  return (
    <div>
      {columns ? (
        <>
          <Box zIndex={5} width={'100%'} mt={3}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              expander={true}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideSelection={true}
              refreshGrid={fetchData}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </div>
  );
};

export default Process;
