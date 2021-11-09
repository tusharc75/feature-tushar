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
  calculatePricing?: any;
  cellEditable?: any;
  parentChildData?: any;
}

const MaterialTableComponent: FC<TableProps> = (props) => {
  const { columns, rowData, title, loading, onSelection, calculatePricing, cellEditable, parentChildData } = props;
  const [newRowData, setNewRowData] = useState([]);

  useEffect(() => {
    // (async () => {
    //   let extractedProducts = []
    //   let newDataOfRow = [...rowData]

    //   newDataOfRow.forEach((rd) => {
    //     let productsInPkg = []

    //     newDataOfRow.forEach((rd1) => {
    //       if (rd.type === "Package" && rd._id === rd1.packageId) {
    //         productsInPkg.push(rd1);
    //       }
    //     })

    //     if (rd.type === "Package") { rd.products = productsInPkg; }

    //     if (rd) {
    //       extractedProducts.push(rd)
    //     }
    //   })

    //   extractedProducts = extractedProducts.filter((product) => product.type !== "productInPackage");


    //   if (extractedProducts.length > 0) {
    //     let newExtractedData = []

    //     extractedProducts.forEach((pkg, indx) => {

    //       let pkgData = { ...pkg };
    //       pkgData = { ...pkgData, detail: `${indx + 1} - ${pkgData.detail}` };

    //       if (pkgData.type === "Package") {

    //         const { products } = pkgData;

    //         if (products && products.length > 0) {

    //           products.forEach((product, i) => {

    //             let productData = { ...product };

    //             let qty = pkg.qty !== 0 && product.qty !== 0
    //               ? pkg.qty * product.qty
    //               : pkg.qty !== 0 && product.qty === 0
    //                 ? pkg.qty
    //                 : pkg.qty === 0 && product.qty !== 0
    //                   ? product.qty : product.qty

    //             productData = {
    //               ...productData,
    //               detail: `${indx + 1}.${i + 1} - ${productData.detail}`,
    //               qty,
    //               UOM: pkg?.UOM,
    //               pricingMethod: pkg?.pricingMethod,
    //               price: parseInt(product?.mrp) || 0,
    //               finalPrice: parseInt(product?.mrp) && qty
    //                 ? parseInt(product.mrp) * qty
    //                 : parseInt(product.mrp)
    //                   ? parseInt(product.mrp)
    //                   : 0,
    //               discount: product.discount ? product.discount : 0,
    //             }

    //             newExtractedData.push(productData)
    //           })
    //         }
    //       }
    //       newExtractedData.push(pkgData)
    //       setNewRowData(newExtractedData);
    //       calculatePricing(newExtractedData)
    //     })
    //   }

    // })();
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
        totalCount={25}
        cellEditable={cellEditable}
        parentChildData={(row, rows) => rows.find((a) => a.treeId === row.parent)}
        options={{
          selection: true,
          hideFilterIcons: false,
          headerStyle: { backgroundColor: '#efefef', color: "#232323", padding: "0px" },
          rowStyle: { color: "black", padding: '0px !important' },
          sorting: false,
          search: false,
          maxBodyHeight: 400,
          minBodyHeight: 400,
          paging: false,
          toolbar: false,
          editCellStyle: {
            borderBottomWidth: 0
          }
        }}
        title={title}
        icons={materialTableIcons}
        columns={columns}

      />
    </div>
  );
};

export default MaterialTableComponent;
