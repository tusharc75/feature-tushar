import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer, } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import routes from "../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Chip } from "@material-ui/core";
import { AiFillFilePdf } from "react-icons/ai";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";
import AddSerializedAsset from "./AddSerializedAsset";
import { dateFormat, gridLoadingTimeout, rentalManagement } from "../../constants/helpers";
import { Column } from "material-table";
import moment from "moment";
import MaterialTableComponent from "../../components/Shared/MaterialTableComponent";
import { startCase } from "lodash";


const SerializedAssetStep = ({ loading, productInventory, currentStep, fetchProductsData, rentalManagementId, isTabletScreen,
  isSmallScreen,
  showActivity, currencySymbol }) => {
  const toastConfig = useContext(CustomToastContext);

  const [gridApi, setGridApi] = useState(null);
  const [assignedSerializedAsset, setAssignedSerializedAsset] = useState([]);
  const [state, dispatch] = useReducer(reducer, intialState);
  const [stateSerializedAssets, dispatchSerializedAssets] = useReducer(reducer, intialState);
  // const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  // const { dataRows: dataRowsSerializedAssets, rowCount: rowCountSerializedAssets,
  //   loading: loadingSerializedAssets, page: pageSerializedAssets,
  //   limit: limitSerializedAssets, pageSizes: pageSizesSerializedAssets,
  //   selectedRecords: selectedRecordsSerializedAssets } = stateSerializedAssets;
  const [downlodingFile, setDownlodingFile] = useState(false)
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])

  // useEffect(() => {

  //   dispatch({ type: "loading", loading: true });
  //   dispatch({
  //     type: "initialize", data: productInventory, count: productInventory.length
  //   });
  //   setTimeout(() => {
  //     dispatch({ type: "loading", loading: false });
  //   }, gridLoadingTimeout);

  //   fetchSerializedAsset()
  //   // eslint-disable-next-line
  // }, [productInventory]);

  // const fetchSerializedAsset = () => {
  //   dispatchSerializedAssets({ type: "loading", loading: true });
  //   axiosInstance().get(`${rentalManagement.rentalManagementApi}/${rentalManagementId}/inventory`)
  //     .then(({ data }) => {
  //       setAddSerializedAssetDialog(false)
  //       setAssignedSerializedAsset(data.data.map(d => d.inventory))
  //       dispatchSerializedAssets({
  //         type: "initialize", data: data.data.map(d => d.inventory), count: data.data.length
  //       });
  //       setTimeout(() => {
  //         dispatchSerializedAssets({ type: "loading", loading: false });
  //       }, gridLoadingTimeout);
  //     }).catch((error) => {
  //       setAddSerializedAssetDialog(false)
  //       dispatch({ type: "loading", loading: false });
  //       toastConfig.setToastConfig(error)
  //     });
  // };

  // const NameRenderer = (params) => (
  //   <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data.productId}`}>
  //     {params.value}
  //   </Link>
  // );

  // const SerializedAssetRenderer = (params) => (
  //   <h5 className="createBy d-flex">
  //     {params.data?.serializedAsset[0]}
  //     {params.data?.serializedAsset?.length > 0 && (
  //       <span className="createdAtTime badge-date">{`+${params.data?.serializedAsset.length} more..`}</span>
  //     )}
  //   </h5>
  // )

  // const TicketRenderer = (params) => (
  //   params?.value ? (
  //     <Link className="link" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.deliveryTicketId}`}>
  //       {params.value}
  //     </Link>
  //   ) : (
  //     <NoDataCell />
  //   )
  // );

  // const ProductRenderer = (params) => (
  //   <Link className="link" title={params.value} to={params.data.type === "Product" ? `${routes.productDetail.path}/${params.data.id}` : `${routes.packagesDetail.path}/${params.data.id}`}>
  //     {params.value}
  //   </Link>
  // );

  // const frameworkComponents = {
  //   nameRenderer: NameRenderer,
  //   productRenderer: ProductRenderer,
  //   commonRenderer: CommonRenderer,
  //   dateRenderer: DateRenderer,
  //   serializedAssetRenderer: SerializedAssetRenderer
  // };

  // const frameworkComponentsSerializedAssets = {
  //   commonRenderer: CommonRenderer,
  // };

  // const columns = [
  //   { field: "detail", headerName: "Detail", show: true, disabled: true, cellRenderer: "productRenderer" },
  //   { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
  //   { field: "package", headerName: "Package", show: true, disabled: true, cellRenderer: "packageNameRenderer" },
  //   { field: "startDate", headerName: "Start Date", show: true, disabled: true, cellRenderer: "dateRenderer", cellEditor: "dateEditor", editable: true },
  //   { field: "endDate", headerName: "End Date", show: true, disabled: true, cellRenderer: "dateRenderer", cellEditor: "dateEditor", editable: true },
  //   { field: "qty", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
  //   { field: "UOM", headerName: "UOM", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "agSelectCellEditor", cellEditorParams: { cellRenderer: "commonRenderer", values: ["Gram", "Liter"] }, editable: true },
  //   { field: "pricingMethod", headerName: "Pricing Method", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "agSelectCellEditor", cellEditorParams: { cellRenderer: "commonRenderer", values: ["Per Day", "Per Week", "Per Month"] }, editable: true },
  //   { field: "price", headerName: "Price", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
  //   { field: "discount", headerName: "Discount (%)", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
  //   { field: "finalPrice", headerName: "Final Price", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
  // ];
  const columns: Column<any>[] = [
    {
      field: 'detail',
      title: 'Detail',
      cellStyle: { padding: "0px 4px" },
      render: (rowData) => (
        <div style={{ width: 200, display: "flex", alignItems: 'center' }}>
          <p
            className="text-truncate mr-2"
            title={rowData.detail}
          // to={rowData.type === 'Product' ? `${routes.productDetail.path}/${rowData.id}` : `${routes.packagesDetail.path}/${rowData.id}`}
          >
            {rowData.detail}
          </p>
          {rowData.hasOwnProperty("assetNumber") && <Chip label="Asset" size="small" color="primary" />}
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
      cellStyle: { padding: "0px 4px" },
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
          <p>{startCase(rowData.UOM)}</p>
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
          <p>{startCase(rowData.pricingMethod)}</p>
        </div>
      )
    },
    {
      field: 'price',
      title: `Price (${currencySymbol})`,
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
      title: `Final Price (${currencySymbol})`,
      emptyValue: '- - - - -',
      cellStyle: { padding: "0px" },
      render: (rowData) => (
        <div style={{ width: 100 }}>
          <p>{rowData.finalPrice}</p>
        </div>
      )
    }
  ]


  // const columnsSerializedAssets = [
  //   { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "commonRenderer" },
  //   { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "commonRenderer" },
  //   { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
  //   { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
  //   { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
  //   // { field: "warehouse", headerName: "Plant", show: true, disabled: true, cellRenderer: "commonRenderer" },
  //   // { field: "productCategory", headerName: "Product Category", show: true, disabled: true, cellRenderer: "commonRenderer" },
  // ];

  // const columnStateProductAndPackage = JSON.parse(localStorage.getItem("rentalManagementDetailsPageSerializedAssetsProductAndPackage"));
  // if (columnStateProductAndPackage) {
  //   columns.forEach((item) => {
  //     columnStateProductAndPackage.forEach((d) => {
  //       if (d.colId === item.field) {
  //         item.show = !d.hide;
  //       }
  //     });
  //   });
  // }

  // const columnState = JSON.parse(localStorage.getItem("rentalManagementDetailsPageSerializedAssets"));
  // if (columnState) {
  //   columnsSerializedAssets.forEach((item) => {
  //     columnState.forEach((d) => {
  //       if (d.colId === item.field) {
  //         item.show = !d.hide;
  //       }
  //     });
  //   });
  // }

  const handleAddSerializedAsset = (productInventoryArray) => {
    console.log(productInventoryArray)
    let tempProductArray = [];
    let product = selectedProducts[0]
    productInventoryArray.forEach(d => {
      let obj: any = {};
      obj.inventory = d._id;
      if (product.type === "productInPackage") {
        obj.product = product.id
        obj.package = product.packageId
      } else {
        obj.product = product.id
      }

      tempProductArray.push(obj)
    })
    axiosInstance().post(`${rentalManagement.rentalManagementApi}/${rentalManagementId}/inventory`, { "products": tempProductArray })
      .then(({ data }) => {
        setAddSerializedAssetDialog(false)
        fetchProductsData()
        setSelectedProducts([])
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
      }).catch((error) => {
        setAddSerializedAssetDialog(false)
        toastConfig.setToastConfig(error)
      });
  };

  return (<>


    <Grid container spacing={2}>
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <Box display="flex" mt={2} justifyContent="space-between" alignItems="center" padding={"4px"}>
          <h3 className="form-label-style" title={"Products and Packages"}>
            {"Products and Packages"}
          </h3>

          <Button
            variant="contained"
            color="primary"
            type="button"
            size="small"
            disabled={(selectedProducts.length !== 1)}
            onClick={() => {
              setAddSerializedAssetDialog(true)
            }}
          >
            {`Assign ${routes.productInventory.title}`}
          </Button>
        </Box>

      </Grid>
      <Grid item xs={12} md={12} sm={12} >
        {columns ?
          <>
            {/* <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameworkComponents}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            allowAction={false}
            loading={loading}
            renderedFrom="rentalManagementDetailsPageSerializedAssetsProductAndPackage"
            /> */}
            <Box p="6px"
              zIndex={5}
              width={
                isTabletScreen
                  ? "calc(100vw - 20px)"
                  : isSmallScreen
                    ? "calc(100vw - 78px)"
                    : showActivity ? "100%" : "calc(100vw - 100px)"
              }>
              <MaterialTableComponent
                columns={columns}
                rowData={productInventory}
                title={""}
                loading={loading}
                onSelection={(d) => setSelectedProducts(d.filter(r => !r.hasOwnProperty("assetNumber")))}
                parentChildData={(row, rows) => rows.find((a) => a.treeId === row.parent)}
                selectionProps={rowData => ({
                  disabled: rowData.hasOwnProperty("assetNumber"),
                  color: "primary",

                })}
              />
            </Box>

          </>
          : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>

        }
      </Grid>
      {/* <Grid item xs={12} sm={12} md={12} lg={12}>
        <div className="detail-box">
          <h3 className="form-label-style" title={"Searlized Assets"}>
            {"Searlized Assets"}
          </h3>
        </div>
      </Grid>
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns ?
          <CustomAgGrid
            columns={columnsSerializedAssets}
            dataRows={dataRowsSerializedAssets}
            frameworkComponents={frameworkComponentsSerializedAssets}
            setGridApi={setGridApi}
            dispatch={dispatchSerializedAssets}
            rowCount={rowCountSerializedAssets}
            limit={limitSerializedAssets}
            pageSizes={pageSizesSerializedAssets}
            page={pageSerializedAssets}
            allowAction={false}
            loading={loadingSerializedAssets}
            renderedFrom="rentalManagementDetailsPageSerializedAssets"
          />
          : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>

        }
      </Grid> */}
    </Grid>
    {addSerializedAssetDialog &&
      <AddSerializedAsset
        addSerializedAsset={handleAddSerializedAsset}
        handleSerializedAssetClose={() => {
          setAddSerializedAssetDialog(false);
          setSelectedProducts([])
        }}
        selectedProducts={selectedProducts}
      // type={inventoryType}
      />
    }
  </>
  );
}
export default SerializedAssetStep;