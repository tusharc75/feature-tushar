import { FC, useEffect, useState } from 'react';
import MaterialTable, { Column } from 'material-table';

import { materialTableIcons } from '../../constants/helpers';

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
  const { columns, rowData, title, loading, onSelection } = props;
  const [newRowData, setNewRowData] = useState([]);

  useEffect(() => {
    (async () => {
      let extractedProducts = []

      for (const rd of rowData) {
        if (rd.type === "Package") {
          const { products, productRelationship } = rd
          products.forEach((p) => {
            let dataObj = {}
            productRelationship.forEach((pr) => {
              if (p.productId === pr._id) {
                dataObj = {
                  ...p,
                  ...pr,
                  qty: p.qty !== 0 && rd.qty !== 0 ? p.qty * rd.qty : p.qty === 0 && rd.qty !== 0 ? rd.qty : p.qty !== 0 && rd.qty === 0 ? p.qty : 0,
                  endDate: rd?.endDate,
                  startDate: rd?.startDate,
                  type: "Package",
                  UOM: rd?.UOM || "",
                  pricingMethod: rd?.pricingMethod || "",
                }
              }
            })
            extractedProducts.push(dataObj)
          })
        } else {
          extractedProducts.push(rd)
        }
      }

      setNewRowData(extractedProducts);
    })();
  }, [rowData]);


  // const handleClick = (rowData) => {
  //   if (onRowClick) {
  //     onRowClick(rowData)
  //   }
  // }

  return (
    <div>
      <MaterialTable
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
          maxBodyHeight: 400,
          minBodyHeight: 400,
          toolbar: false,
        }}
        title={title}
        icons={materialTableIcons}
        columns={columns}

      />
    </div>
  );
};

export default MaterialTableComponent;
