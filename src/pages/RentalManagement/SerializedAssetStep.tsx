import { useState, useEffect, useContext, useMemo } from "react";
import Box from "@material-ui/core/Box/Box";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import NoDataCell from "../../components/Helpers/NoDataCell";
import routes from "../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Chip, IconButton } from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import AddSerializedAsset from "./AddSerializedAsset";
import { dateFormat, formatAmountWithCurrency, rentalManagement, treeToFlatArray } from "../../constants/helpers";
import moment from "moment";
import { startCase, orderBy } from "lodash";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomReactTable from "../../components/CustomReactTable/CustomReactTable";

const SerializedAssetStep = (props) => {
  const { loading, productInventory, currentStep, serializeAssets, fetchProductsData, rentalManagementId, isTabletScreen,
    isSmallScreen, setNextStep,
    showActivity, currencySymbol, currencyCode } = props
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

  //  This is copied method from helpers.ts as wee need some modification for this screen only
  const translateDataToTreeForProducts = (data, parentProperty, childProperty, childrenPropertyToStore) => {
    let parents = data.filter(value => value[parentProperty] == 'undefined' || value[parentProperty] == null)
    let childrens = data.filter(value => value[parentProperty] !== 'undefined' && value[parentProperty] != null)

    parents.forEach((current) => {
      if (current.type === "Package") {
        current["qty"] = 0;
        current["isValid"] = true;
      }
    })

    let translator = (parents, childrens) => {
      parents.forEach((parent) => {
        childrens.forEach((current, index) => {
          if (current.parent === parent[childProperty]) {
            let temp = JSON.parse(JSON.stringify(childrens))
            temp.splice(index, 1)
            translator([current], temp)

            if (typeof parent[childrenPropertyToStore] !== 'undefined') {
              if (current.hasOwnProperty("assetNumber")) {
                current["isValid"] = true;
              } else {
                current.qty = current.qty * parent.oldQty;
                parent.qty = parent.qty + current.qty;
              }
              parent[childrenPropertyToStore].push(current)

              if (!current.hasOwnProperty("assetNumber") && parent.qty === parent[childrenPropertyToStore].length) {
                parent["isValid"] = true;
              }

            } else {
              if (current.hasOwnProperty("assetNumber")) {
                current["isValid"] = true;
              } else {
                current.qty = current.qty * parent.oldQty;
                parent.qty = parent.qty + current.qty;
              }

              parent[childrenPropertyToStore] = [current]

              if (!current.hasOwnProperty("assetNumber") && parent.qty === parent[childrenPropertyToStore].length) {
                parent["isValid"] = true;
              }
            }

            //  Check validation for products in package - Start
            if (parent?.type?.includes("roduct")) {
              if (parent.qty === parent[childrenPropertyToStore].length) {
                parent["isValid"] = true;
              }
            } else if (parent.type === "Package") {
              const flatData = treeToFlatArray([{ ...parent }], "subRows");
              const assetsCount = flatData.filter(f => f.hasOwnProperty("assetNumber"))?.length ?? 0;

              parent["isValid"] = parent.qty === assetsCount
            }

            //  Check validation for products in package - End

          }
        })
      })
    }
    translator(parents, childrens)

    return parents
  }


  useEffect(() => {
    // const products = productInventory.filter(p => p?.type?.includes("roduct"))
    const products = productInventory.map((p: any) => {
      // let currentAssets = []
      // if (p?.type === "Product" || p?.type === "productInPackage") {
      //   currentAssets = serializeAssets.filter((asset: any) => asset?.product === p?.id)

      //   if (currentAssets.length !== p.qty) {
      //     setNextStep(false)
      //   } else {
      //     setNextStep(true)
      //   }
      // }
      if (!p.hasOwnProperty("parent")) {
        p["parent"] = null;
      }

      const { subRows, _id, ...rest } = p;
      return { ...rest, isValid: false, oldQty: rest.qty, id: _id }
    })

    const newDataForReactTable = [...translateDataToTreeForProducts(products ? [...products] : [], "parent", "treeId", "subRows")];
    setRows(orderBy(newDataForReactTable, ["order"], ["asc"]));

    const flatDataToCheckNextStep = treeToFlatArray(newDataForReactTable, "subRows");
    setNextStep(!(flatDataToCheckNextStep.some(f => f.isValid === false)))

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


  const getAssetAssignedValues = (row) => {
    if (row.original?.type?.includes("roduct")) {
      if (row.subRows && row.subRows?.length > 0) {
        return <p>{row.subRows.length} / {row.original.qty}</p>
      }
      return <p>0 / {row.original.qty}</p>;
    } else if (row.original?.type === "Package") {
      const flatData = treeToFlatArray([{ ...row.original }], "subRows")
      const getAssetsOnly = flatData.filter(f => f.hasOwnProperty("assetNumber"));

      return <p>{getAssetsOnly.length} / {row.original.qty}</p>;
    }
    return "" //  <NoDataCell />
  }


  const columns = [
    {
      accessor: 'detail',
      Header: 'Detail',
      width: 300,
      Cell: ({ row }) => (
        <div className="d-flex gap-2 align-items-center">
          <p
            className="text-truncate"
            title={row.original.detail}
          // to={rowData.type === 'Product' ? `${routes.productDetail.path}/${rowData.id}` : `${routes.packagesDetail.path}/${rowData.id}`}
          >
            {row.original.detail}
          </p>
          {row.original.hasOwnProperty("assetNumber") &&
            <span className="d-flex align-items-center gap-2">
              <IconButton size="small" onClick={() => {
                setShowConfirmBox(true)
                setDeleteData([row.original._id ?? row.original.id])
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
      accessor: 'assets',
      Header: 'Assets Assigned',
      Cell: ({ row }) => (
        getAssetAssignedValues(row)
      )
    },
    // {
    //   accessor: 'qty',
    //   Header: 'Quantity',
    //   Cell: ({ row }) => (
    //     row.original.qty ? <p>{row.original.qty}</p> : <NoDataCell />
    //   )
    // },
    {
      accessor: 'startDate',
      Header: 'Start Date',
      Cell: ({ row }) => (
        row.original.startDate ? <h5 className="createBy" title={`${moment(row.original.startDate.slice(0, 10)).format(dateFormat)}`}>
          <span className="">{moment(row.original.startDate?.slice(0, 10)).format(dateFormat)}</span>
        </h5> : <NoDataCell />
      )
    },
    {
      accessor: 'endDate',
      Header: 'End Date',
      Cell: ({ row }) => (
        row.original.endDate ? <h5 className="createBy" title={`${moment(row.original.endDate.slice(0, 10)).format(dateFormat)}`}>
          <span className="">{moment(row.original.endDate.slice(0, 10)).format(dateFormat)}</span>
        </h5> : <NoDataCell />
      )
    },
    {
      accessor: 'UOM',
      Header: 'UOM',
      Cell: ({ row }) => (
        row.original.UOM ? <p>{startCase(row.original.UOM)}</p> : <NoDataCell />
      )
    },
    {
      accessor: 'pricingMethod',
      Header: 'Pricing Method',
      Cell: ({ row }) => (
        row.original.pricingMethod ? <p>{startCase(row.original.pricingMethod)}</p> : <NoDataCell />
      )
    },
    {
      accessor: 'price',
      Header: `Price (${currencySymbol})`,
      Cell: ({ row }) => (
        row.original.price ? <p>{row.original.price}</p> : <NoDataCell />
      ),
      Footer: info => {
        const total = useMemo(
          () =>
            info.rows.filter(f => f.values.hasOwnProperty("price") && !isNaN(f.values.price)).reduce((sum, row) => row.values.price + sum, 0),
          [info.rows]
        )

        return <>{currencySymbol} {formatAmountWithCurrency(currencyCode, total)?.amountWithouCurrencyCode ?? total}</>
      }
    },
    {
      accessor: 'amount',
      Header: `Total Quantity Price (${currencySymbol})`,
      Cell: ({ row }) => (
        row.original.amount ? <p>{row.original.amount}</p> : <NoDataCell />
      ),
      Footer: info => {
        const total = useMemo(
          () =>
            info.rows.filter(f => f.values.hasOwnProperty("amount") && !isNaN(f.values.amount)).reduce((sum, row) => row.values.amount + sum, 0),
          [info.rows]
        )

        return <>{currencySymbol} {formatAmountWithCurrency(currencyCode, total)?.amountWithouCurrencyCode ?? total}</>
      }
    },
    {
      accessor: 'discount',
      Header: 'Discount (%)',
      Cell: ({ row }) => (
        row.original.discount ? <p>{row.original.discount}</p> : <NoDataCell />
      )
    },
    {
      accessor: 'finalPrice',
      Header: `Final Price (${currencySymbol})`,
      Cell: ({ row }) => (
        row.original.finalPrice ? <p>{row.original.finalPrice}</p> : <NoDataCell />
      ),
      Footer: info => {
        const total = useMemo(
          () =>
            info.rows.filter(f => f.values.hasOwnProperty("finalPrice") && !isNaN(f.values.finalPrice)).reduce((sum, row) => row.values.finalPrice + sum, 0),
          [info.rows]
        )

        return <>{currencySymbol} {formatAmountWithCurrency(currencyCode, total)?.amountWithouCurrencyCode ?? total}</>
      }
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
    let tempProductArray = [];
    productInventoryArray.forEach(d => {

      const getSelectedRecord = selectedProducts.find(f => d.product?.optionValue === f.id);

      if (getSelectedRecord) {
        let obj: any = {};
        obj.inventory = d.id;

        if (getSelectedRecord.type === "productInPackage") {
          obj.product = getSelectedRecord.id
          obj.package = getSelectedRecord.packageId
        } else {
          obj.product = getSelectedRecord.id
        }
        tempProductArray.push(obj)
      }
      // selectedProducts.filter(p => p?.type.toLowerCase() !== "package" || !p.hasOwnProperty("assetNumber")).forEach((product) => {
      //   let obj: any = {};
      //   obj.inventory = d.id;

      //   if (product.type === "productInPackage") {
      //     obj.product = product.id
      //     obj.package = product.packageId
      //   } else {
      //     obj.product = product.id
      //   }
      //   tempProductArray.push(obj)
      // })

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

  const disableAssignSerializedAssets = () => {

    if (selectedProducts.length === 0 || selectedProducts.some(s => s.hasOwnProperty("assetNumber")))
      return true;

    let disableAssignSerializedAssetsButton = false;
    selectedProducts.forEach((d) => {
      if (d.subRows && d.subRows?.length > 0) {
        disableAssignSerializedAssetsButton = d.subRows.length === d.qty;
        return;
      }
    })

    return disableAssignSerializedAssetsButton;
  }

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
              disabled={disableAssignSerializedAssets()}
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
                setDeleteData(selectedProducts.filter(d => d.hasOwnProperty("assetNumber")).map(d => d?.id))
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
                    : showActivity ? "100%" : "calc(100vw - 100px)"
              }
              height="calc(100vh - 350px)"
            >
              <CustomReactTable
                height="calc(100vh - 365px)"
                columns={columns}
                data={rows}
                isInValidCheck={(rowData) => rowData?.type?.includes("roduct") && rowData?.subRows?.length !== rowData?.qty}
                onSelect={setSelectedProducts}
                childrenProperty="subRows"
                uniqueKey="id"
              />

              {/* <MaterialTableComponent
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
              /> */}
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
          // setSelectedProducts([])
        }}
        isAdding={isAdding}
        selectedProducts={[...selectedProducts.filter(p => p?.type?.includes("roduct")).map(m => { return { ...m, _id: m.id } })]}
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