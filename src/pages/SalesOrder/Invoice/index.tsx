import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import Grid from '@material-ui/core/Grid/Grid';
import { IconButton } from '@material-ui/core';
import { RESOURCE_LABEL, salesOrder } from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import { isMobile } from 'react-device-detect';
import routes from '../../../components/Helpers/Routes';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import { startCase } from 'lodash';
import { fetch_salesOrder_product_fields } from '../../../components/SalesOrder/helper';
import { generateCustomTableColumns } from 'src/constants/columns';
import InvoiceFacility from './InvoiceFacility';
import PreviewDownload from 'src/components/PreviewDownload';

const Invoice = ({ salesOrderData, setNextStep, updateJobStatus, statusOptions, renderedFrom, stepFullScreen }) => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [rowsData, setRowsData] = useState(null);
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    if (
      statusOptions.findIndex((d) => d.optionLabel === 'Ready to Invoice') > statusOptions.findIndex((d) => d.optionLabel === salesOrderData?.status)
    ) {
      updateJobStatus('Ready to Invoice');
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    var data = await fetch_salesOrder_product_fields(salesOrderData?.currency);
    const newColumns = generateCustomTableColumns(data, salesOrderData?.currency, renderedFrom);
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile ? 'none' : 'left',
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
    fetchMaterialData();
  };
  const fetchMaterialData = async () => {
    setNextStep(false);
    var data: any = [];
    const response = await axiosInstance().get(`${salesOrder.api}/material/${salesOrderData._id}`);
    data = response?.data?.data;
    const rows = data.material.filter((e) => e.parentId === null);
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
      parent.isValid = parent['finalPrice_' + salesOrderData?.currency?.toLowerCase()] ? true : false;
      parent.subRows = generateNestedData(data.material, parent);
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(true);
    } else {
      setNextStep(true);
    }
    setRowsData(rows);
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
      _subRow.isValid = _subRow['finalPrice_' + salesOrderData?.currency?.toLowerCase()] ? true : false;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return subRows;
  };

  return (
    <Fragment>
      <PreviewDownload resource={RESOURCE_LABEL.salesOrder} referenceId={salesOrderData._id} columns={columns} isSendEmail={true} />
      <Grid item xs={12} md={12} sm={12}>
        {columns && rowsData ? (
          <>
            <Box mt={1} zIndex={5} width={'100%'}>
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
                columns={columns}
                data={rowsData}
                setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
                onSelect={setSelectedProducts}
                childrenProperty="subRows"
                uniqueKey="_id"
                renderedFrom="sales_order_product_package"
                isClientSideGrid={true}
              />
            </Box>
          </>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
    </Fragment>
  );
};

export default Invoice;
