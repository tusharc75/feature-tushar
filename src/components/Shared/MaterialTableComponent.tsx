import { FC, useEffect, useState } from 'react';
import { Box, Paper } from '@material-ui/core';
import MaterialTable from 'material-table';
import { Link } from 'react-router-dom';

import { dateFormat, materialTableIcons } from '../../constants/helpers';
import routes from '../Helpers/Routes';
import moment from 'moment';

interface TableProps {
  columns: any[];
  rowData: any[];
  title?: string;
  options?: object;
  loading: boolean;
  updateProductData?: any;
  onSelection: any
}

const MaterialTableComponent: FC<TableProps> = (props) => {
  const { columns, rowData, title, loading, updateProductData, onSelection } = props;
  const [newColumns, setNewColumns] = useState();
  const [newRowData, setNewRowData] = useState([]);

  // useEffect(() => {
  //   (() => {

  //     setNewRowData(extractedProducts);
  //   })();
  // }, [rowData]);


  const onRowUpdate = (newData, oldData) => {
    return new Promise((resolve, reject) => {
      updateProductData(newData)
      setTimeout(() => {
        resolve('');
      }, 1000);
    });
  };

  const onBulkUpdate = changes => {
    return new Promise((resolve, reject) => {
      console.log(changes);
      setTimeout(() => {
        resolve("");
      }, 1000);
    })
  }

  return (
    <div>
      <MaterialTable
        isLoading={loading}
        data={rowData}
        onSelectionChange={onSelection}
        editable={{
          onRowUpdate,
          onBulkUpdate
        }}
        parentChildData={(row, rows) => rows.find((a) => a.id === row.packageId)}
        options={{
          selection: true,
          hideFilterIcons: false,
          actionsColumnIndex: -1,
          actionsCellStyle: { width: 100 },
        }}
        title={title}
        icons={materialTableIcons}
        columns={[
          {
            field: 'detail',
            title: 'Detail',
            editable: 'never',
            render: (rowData) => (
              <div style={{ width: 150 }}>
                <Link
                  className="link"
                  title={rowData.detail}
                  to={rowData.type === 'Product' ? `${routes.productDetail.path}/${rowData.id}` : `${routes.packagesDetail.path}/${rowData.id}`}
                >
                  {rowData.detail}
                </Link>
              </div>
            )
          },
          {
            field: 'type',
            title: 'Type',
            editable: 'never',
            render: (rowData) => (
              <div style={{ width: 150 }}>
                <p>{rowData.type}</p>
              </div>
            )

          },
          {
            field: 'startDate',
            title: 'Start Date',
            editable: 'onUpdate',
            emptyValue: '- - - - - - -',
            editComponent: props => (
              <input
                type="date"
                value={props.value}
                onChange={e => {
                  console.log(e.target.value)
                  props.onChange(e.target.value)
                }}
              />
            ),
            render: (rowData) => (
              <div style={{ width: 150 }}>
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
            editable: 'onUpdate',
            emptyValue: '- - - - - - -',
            editComponent: props => (
              <input
                type="date"
                value={props.value}
                onChange={e => props.onChange(e.target.value)}
              />
            ),
            render: (rowData) => (
              <div style={{ width: 150 }}>
                <h5 className="createBy" title={`${moment(rowData.endDate.slice(0, 10)).format(dateFormat)}`}>
                  <span className="">{moment(rowData.endDate.slice(0, 10)).format(dateFormat)}</span>
                </h5>
              </div>
            )
          },
          {
            field: 'qty',
            title: 'Quantity',
            editable: 'onUpdate',
            emptyValue: '- - - - - - -',
            editComponent: props => (
              <input
                disabled={props.rowData.hasOwnProperty("packageId")}
                type="number"
                value={props.value}
                onChange={e => props.onChange(e.target.value)}
              />
            ),
            render: (rowData) => (
              <div style={{ width: 150 }}>
                <p>{rowData.qty}</p>
              </div>
            )
          },
          {
            field: 'UOM',
            title: 'UOM',
            editable: 'onUpdate',
            // lookup: { 1: 'Pcs', 2: 'Gram' },
            emptyValue: '- - - - - - -',
            editComponent: props => (
              <select
                disabled={props.rowData.hasOwnProperty("packageId")}
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
              >
                <option value="pcs">Pcs</option>
                <option value="gram">Gram</option>
              </select>
            ),
            render: (rowData) => (
              <div style={{ width: 150 }}>
                <p>{rowData.UOM}</p>
              </div>
            )
          },
          {
            field: 'pricingMethod',
            title: 'Pricing Method',
            editable: 'onUpdate',
            emptyValue: '- - - - - - -',
            editComponent: props => (
              <select
                disabled={props.rowData.hasOwnProperty("packageId")}
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
              >
                <option value="Per Day">Per Day</option>
                <option value="Per Week">Per Week</option>
                <option value="Per Month">Per Month</option>
              </select>
            ),
            render: (rowData) => (
              <div style={{ width: 150 }}>
                <p>{rowData.pricingMethod}</p>
              </div>
            )
          },
          {
            field: 'price',
            title: 'Price',
            editable: 'onUpdate',
            emptyValue: '- - - - - - -',
            editComponent: props => (
              <input
                type="number"
                value={props.value}
                onChange={e => props.onChange(e.target.value)}
              />
            ),
            render: (rowData) => (
              <div style={{ width: 150 }}>
                <p>{rowData.price}</p>
              </div>
            )
          },
          {
            field: 'discount',
            title: 'Discount (%)',
            editable: 'onUpdate',
            emptyValue: '- - - - - - -',
            editComponent: props => (
              <input
                type="number"
                value={props.value}
                onChange={e => props.onChange(e.target.value)}
              />
            ),
            render: (rowData) => (
              <div style={{ width: 150 }}>
                <p>{rowData.discount}</p>
              </div>
            )
          },
          {
            field: 'finalPrice',
            title: 'Final Price',
            editable: 'onUpdate',
            emptyValue: '- - - - - - -',
            editComponent: props => (
              <input
                disabled={props.rowData.hasOwnProperty("packageId")}
                type="number"
                value={props.value}
                onChange={e => props.onChange(e.target.value)}
              />
            ),
            render: (rowData) => (
              <div style={{ width: 150 }}>
                <p>{rowData.finalPrice}</p>
              </div>
            )
          }
        ]}

      />
    </div>
  );
};

export default MaterialTableComponent;
