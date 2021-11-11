import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer, } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import NoDataCell from "../../components/Helpers/NoDataCell";
import { AiFillFilePdf } from "react-icons/ai";
import routes from "../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Chip, IconButton } from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import AddSerializedAsset from "./AddSerializedAsset";
import { dateFormat, gridLoadingTimeout, rentalManagement } from "../../constants/helpers";
import { Column } from "material-table";
import moment from "moment";
import MaterialTableComponent from "../../components/Shared/MaterialTableComponent";
import { startCase } from "lodash";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";



const SerializedAssetStep = (props) => {
  const { loading, productInventory, currentStep, serializeAssets, fetchProductsData, rentalManagementId, isTabletScreen,
    isSmallScreen, setNextStep,
    showActivity, currencySymbol } = props
  const toastConfig = useContext(CustomToastContext);

  // const [gridApi, setGridApi] = useState(null);
  // const [assignedSerializedAsset, setAssignedSerializedAsset] = useState([]);
  // const [state, dispatch] = useReducer(reducer, intialState);
  // const [stateSerializedAssets, dispatchSerializedAssets] = useReducer(reducer, intialState);
  // const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  // const { dataRows: dataRowsSerializedAssets, rowCount: rowCountSerializedAssets,
  //   loading: loadingSerializedAssets, page: pageSerializedAssets,
  //   limit: limitSerializedAssets, pageSizes: pageSizesSerializedAssets,
  //   selectedRecords: selectedRecordsSerializedAssets } = stateSerializedAssets;
  // const [downlodingFile, setDownlodingFile] = useState(false)
  const [rows, setRows] = useState([])
  const [deleting, setDeleting] = useState(false)
  const [isAdding, setAdding] = useState(false)
  const [showConfirmBox, setShowConfirmBox] = useState(false)
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [deleteData, setDeleteData] = useState([])

  useEffect(() => {
    // const products = productInventory.filter(p => p?.type?.includes("roduct"))

    const products = productInventory.map((p: any) => {
      let currentAssets = []
      if (p?.type?.includes("roduct")) {
        currentAssets = serializeAssets.filter((asset: any) => asset?.product === p?._id)

        if (currentAssets.length !== p.qty) {
          setNextStep(false)
        } else {
          setNextStep(true)
        }
      }

      return { ...p, assetCount: currentAssets.length || 0 }
    })

    setRows(products)

  }, [productInventory])

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
          {rowData.hasOwnProperty("assetNumber") &&
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size="small" onClick={() => {
                setShowConfirmBox(true)
                setDeleteData([rowData._id])
              }}>
                <Delete color="error" />
              </IconButton>
              <Chip label="Asset" size="small" color="primary" />
            </span>
          }
        </div>
      )
    },
    {
      field: 'assets',
      title: 'Assets',
      cellStyle: { padding: "0px 4px" },
      render: (rowData) => (
        <div style={{ width: 80 }}>
          <p>{rowData?.type?.includes("roduct") ? rowData.assetCount : "- - - - -"}</p>
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

  const removeInventory = () => {
    if (deleteData.length >= 1) {

      setDeleting(true)
      axiosInstance().put(`${rentalManagement.rentalManagementApi}/${rentalManagementId}/inventory/remove`, {
        products: deleteData
      })
        .then(() => {
          setDeleting(false)
          fetchProductsData()
          setDeleteData(null)
          setShowConfirmBox(false);

        }).catch((error) => {
          setDeleting(false)
          toastConfig.setToastConfig(error)
          setDeleteData(null)
        });
    }


  }


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
    // console.log()
    let tempProductArray = [];
    productInventoryArray.forEach(d => {
      selectedProducts.filter(p => p?.type.toLowerCase() !== "package" || !p.hasOwnProperty("assetNumber")).forEach((product) => {
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

    })
    if (tempProductArray.length >= 1) {

      setAdding(true)
      axiosInstance().post(`${rentalManagement.rentalManagementApi}/${rentalManagementId}/inventory`, { "products": tempProductArray })
        .then(({ data }) => {
          setAddSerializedAssetDialog(false)
          fetchProductsData()
          setSelectedProducts([])
          setAdding(false)
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
        }).catch((error) => {
          setAddSerializedAssetDialog(false)
          setAdding(false)
          toastConfig.setToastConfig(error)
        });
    }
  };

  return (<>


    <Grid container spacing={2}>
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <Box display="flex" mt={2} justifyContent="space-between" alignItems="center" padding={"4px"}>
          <h3 className="form-label-style" title={"Products and Packages"}>
            {"Products and Packages"}
          </h3>

          <div>

            <Button
              variant="contained"
              color="primary"
              type="button"
              size="small"
              disabled={(selectedProducts.filter(p => !p.hasOwnProperty("assetNumber")).length === 0)}
              onClick={() => {
                setAddSerializedAssetDialog(true)
              }}
            >
              {`Assign ${routes.productInventory.title}`}

            </Button>
            <Box mx={1} component="span" />
            <Button
              variant="contained"
              color="primary"
              type="button"
              size="small"
              disabled={(selectedProducts.filter(d => d.hasOwnProperty("assetNumber")).length === 0)}
              onClick={() => {
                setDeleteData(selectedProducts.filter(d => d.hasOwnProperty("assetNumber")).map(d => d?._id))
                setShowConfirmBox(true)
              }}
            >
              Delete Assets
            </Button>
          </div>
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
            <Box
              zIndex={5}
              width={
                isTabletScreen
                  ? "calc(100vw - 20px)"
                  : isSmallScreen
                    ? "calc(100vw - 78px)"
                    : showActivity ? "100%" : "calc(100vw - 94px)"
              }>
              <MaterialTableComponent
                columns={columns}
                rowData={rows}
                title={""}
                loading={loading}
                rowStyle={(rowData) => ({
                  color: "black",
                  backgroundColor: rowData?.type?.includes("roduct") && rowData?.assetCount !== rowData?.qty
                    ? "#EFCCCC" : "white"
                })}
                onSelection={(d) => setSelectedProducts(d)}
                parentChildData={(row, rows) => rows.find((a) => a.treeId === row.parent)}
                selectionProps={rowData => ({
                  disabled: rowData?.type === "Package",
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
        isAdding={isAdding}
        selectedProducts={selectedProducts.filter(p => p?.type?.includes("roduct"))}
      // type={inventoryType}
      />
    }
    {showConfirmBox && (
      <ConfirmationDialog
        open={showConfirmBox}
        message={`Are you sure you want to remove?`}
        onClose={() => {
          setShowConfirmBox(false);
          setDeleteData([])
        }}
        okBtnLoading={deleting}
        onOk={removeInventory}
      />
    )}
  </>
  );
}
export default SerializedAssetStep;