import { useState, useEffect, useContext, Fragment } from 'react';
import { Box } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import { salesOrder } from '../../../constants/helpers';

import { isMobile } from 'react-device-detect';
import { startCase } from 'lodash';

const Process = ({ salesOrderData, setNextStep, stepFullScreen }) => {
  const toastConfig = useContext(CustomToastContext);

  const [columns, setColumns] = useState([]);
  const [rowsData, setRowsData] = useState(null);
  const [material, setMaterial] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const fetchMaterialData = async () => {
    setNextStep(false);
    var data: any = [];
    const response = await axiosInstance().get(`${salesOrder.api}/material/${salesOrderData._id}`);
    data = response?.data?.data;
    if (Object.keys(data?.material[0]?.procurement).length === 0) {
      getProcure();
      return;
    }
    setMaterial(JSON.parse(JSON.stringify(data.material)));
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
      parent.procurementName = parent?.procurement?.optionLabel;
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
      _subRow.procurementName = _subRow?.procurement?.optionLabel;
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

  const getProcure = async () => {
    try {
      const response = await axiosInstance().put(`sales-order/procure-material/${salesOrderData._id}`);
      if (response) {
        fetchMaterialData();
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const createColumns = () => {
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
        accessor: 'procurementName',
        Header: 'Procurement',
        minWidth: 300,
        width: 300,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>{<p title={row.original?.procurementName}>{row.original?.procurementName}</p>}</div>
        )
      },
      {
        accessor: 'procurementType',
        Header: 'Procurement Type',
        minWidth: 300,
        width: 300,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>{<p title={row.original?.procurementType}>{row.original?.procurementType}</p>}</div>
        )
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        Cell: ({ row }) => <div style={{ display: 'flex', alignItems: 'center' }}>{<p title={row.original?.detail}>{row.original?.detail}</p>}</div>
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
    setColumns(coloum);
    fetchMaterialData();
  };

  useEffect(() => {
    createColumns();
  }, []);

  return (
    <div>
      {columns && rowsData ? (
        <>
          <Box zIndex={5} width={'100%'} mt={3}>
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
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </div>
  );
};

export default Process;
