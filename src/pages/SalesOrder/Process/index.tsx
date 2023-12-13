import { useState, useEffect, useContext, Fragment } from 'react';
import { Box, IconButton } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import { salesOrder, sidebarResource } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { startCase } from 'lodash';
import { fetch_salesOrder_product_fields } from 'src/components/SalesOrder/helper';
import routes from 'src/components/Helpers/Routes';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

const Process = ({ salesOrderData, setNextStep, stepFullScreen }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${routes.salesOrder.title}_Process`;

  const [columns, setColumns] = useState([]);

  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    var data = await fetch_salesOrder_product_fields(salesOrderData?.currency);
    const newColumns = generateColumns(renderedFrom, data, null,false, salesOrderData?.currency);
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 100,
        sticky: 'left',
        disableFilters : false,
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
        disabled : true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        width: 200,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
          {<p title={row.original?.detail}>{row.original?.detail}</p>}
          <Box ml={1}>
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
              <OpenInNewIcon fontSize="small" color="primary" />
            </IconButton>
          </Box>
        </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => <p title={row.original?.description}>{row.original?.description}</p>
      },
      {
        accessor: 'procurementType',
        Header: 'Procurement Type',
        width: 200,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>{<p title={row.original?.procurementType}>{row.original?.procurementType}</p>}</div>
        )
      },
      {
        accessor: 'procurementName',
        Header: 'Procurement',
        width: 200,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
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
        )
      },
      {
        accessor: 'leadTime',
        Header: 'Lead Time (Days)',
        Cell: ({ row }) => (row.original['leadTime'] ? <p>{row.original['leadTime']}</p> : 0),
        Footer: (info) => {
          const total = info.rows
            .filter((f) => f.values.hasOwnProperty('leadTime') && !isNaN(f.values['leadTime']))
            .reduce((sum, row) => parseInt(row.values['leadTime']) + sum, 0);
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
        parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
          ? parent.serviceDetail?.serviceName
          : parent.packageDetail?.packageName
      }`;
      parent.description =
        parent.type === 'product'
          ? parent?.productDetail?.productDescription
          : parent.type === 'package'
          ? parent?.packageDetail?.packageDescription
          : parent?.serviceDetail?.serviceDescription;
      parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
      parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.qty = parent.qty;
      parent.isValid = true;
      parent.procurementName = parent?.procurement?.optionLabel;
      parent.procurementId = parent?.procurement?.optionValue;
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
        _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'service'
          ? _subRow.serviceDetail?.serviceName
          : _subRow.packageDetail?.packageName
      }`;
      _subRow.description =
        _subRow.type === 'product'
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === 'package'
          ? _subRow?.packageDetail?.packageDescription
          : _subRow?.serviceDetail?.serviceDescription;
      _subRow.leadTimeData = Array.isArray(_subRow.leadTime) ? _subRow.leadTime : [];
      _subRow.leadTime = Array.isArray(_subRow.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      _subRow.qty = `${parent.qty * _subRow.qty} `;
      _subRow.isValid = true;
      _subRow.procurementName = _subRow?.procurement?.optionLabel;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  return (
    <div>
      {columns? (
        <>
          <Box zIndex={5} width={'100%'} mt={3}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              state = {state}
              dispatch = {dispatch}
              expander = {true}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideSelection={true}
              refreshGrid = {fetchData}
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
