import { FC, useEffect, useState } from 'react';
import MaterialTable, { Column } from 'material-table';

import { dateFormat, materialTableIcons } from '../../constants/helpers';
import moment from 'moment';

interface TableProps {
  columns: any[];
  rowData: any[];
  title?: string;
  options?: object;
  loading: boolean;
  updateProductData?: any;
  onSelection: any;
  onRowClick?: any;
}

const MaterialTableComponent: FC<TableProps> = (props) => {
  const { rowData, title, loading, updateProductData, onSelection, onRowClick } = props;

  // useEffect(() => {
  //   (() => {

  //     setNewRowData(extractedProducts);
  //   })();
  // }, [rowData]);


  const handleClick = (rowData) => {
    if (onRowClick) {
      onRowClick(rowData)
    }
  }

  const columns: Column<any>[] = [
    {
      field: 'detail',
      title: 'Detail',
      cellStyle: { padding: "0px 4px" },
      render: (rowData) => (
        <div style={{ width: 200 }}>
          <p
            onClick={() => handleClick(rowData)}
            className="link text-truncate"
            title={rowData.detail}
          // to={rowData.type === 'Product' ? `${routes.productDetail.path}/${rowData.id}` : `${routes.packagesDetail.path}/${rowData.id}`}
          >
            {rowData.detail}
          </p>
        </div>
      )
    },
    {
      field: 'type',
      title: 'Type',
      cellStyle: { padding: "0px" },
      render: (rowData) => (
        <div style={{ width: 80 }}>
          <p>{rowData.type}</p>
        </div>
      )

    },
    {
      field: 'startDate',
      title: 'Start Date',
      emptyValue: '- - - - -',
      cellStyle: { padding: "0px" },
      render: (rowData) => (
        <div style={{ width: 80 }}>
          <h5 className="createBy" title={`${moment(rowData.startDate.slice(0, 10)).format(dateFormat)}`}>
            <span className="">{moment(rowData.startDate.slice(0, 10)).format(dateFormat)}</span>
          </h5>
        </div>
      )
    },
    {
      filtering: false,
      field: 'endDate',
      title: 'End Date',
      emptyValue: '- - - - -',
      cellStyle: { padding: "0px" },
      render: (rowData) => (
        <div style={{ width: 80 }}>
          <h5 className="createBy" title={`${moment(rowData.endDate.slice(0, 10)).format(dateFormat)}`}>
            <span className="">{moment(rowData.endDate.slice(0, 10)).format(dateFormat)}</span>
          </h5>
        </div>
      )
    },
    {
      field: 'qty',
      title: 'Quantity',
      emptyValue: '- - - - -',
      cellStyle: { padding: "0px" },
      render: (rowData) => (
        <div style={{ width: 80 }}>
          <p>{rowData.qty}</p>
        </div>
      )
    },
    {
      field: 'UOM',
      title: 'UOM',
      emptyValue: '- - - - -',
      cellStyle: { padding: "0px" },
      render: (rowData) => (
        <div style={{ width: 80 }}>
          <p>{rowData.UOM}</p>
        </div>
      )
    },
    {
      field: 'pricingMethod',
      title: 'Pricing Method',
      emptyValue: '- - - - -',
      cellStyle: { padding: "0px" },
      render: (rowData) => (
        <div style={{ width: 100 }}>
          <p>{rowData.pricingMethod}</p>
        </div>
      )
    },
    {
      field: 'price',
      title: 'Price',
      emptyValue: '- - - - -',
      cellStyle: { padding: "0px" },
      render: (rowData) => (
        <div style={{ width: 100 }}>
          <p>{rowData.price}</p>
        </div>
      )
    },
    {
      field: 'discount',
      title: 'Discount (%)',
      emptyValue: '- - - - -',
      cellStyle: { padding: "0px" },
      render: (rowData) => (
        <div style={{ width: 100 }}>
          <p>{rowData.discount}</p>
        </div>
      )
    },
    {
      field: 'finalPrice',
      title: 'Final Price',
      emptyValue: '- - - - -',
      cellStyle: { padding: "0px" },
      render: (rowData) => (
        <div style={{ width: 100 }}>
          <p>{rowData.finalPrice}</p>
        </div>
      )
    }
  ]

  return (
    <div>
      <MaterialTable
        style={{
          minHeight: "590px",
          maxHeight: "590px"
        }}
        isLoading={loading}
        data={rowData}
        onSelectionChange={onSelection}
        parentChildData={(row, rows) => rows.find((a) => a.id === row.packageId)}
        options={{
          selection: true,
          hideFilterIcons: false,
          headerStyle: { backgroundColor: '#efefef', color: "#232323", padding: "0px" },
          rowStyle: { color: "black", padding: '0px !important' },
          sorting: false,
          search: false,
        }}
        title={title}
        icons={materialTableIcons}
        columns={columns}

      />
    </div>
  );
};

export default MaterialTableComponent;
