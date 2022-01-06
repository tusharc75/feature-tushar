import { useState, useEffect, useContext, useMemo, Fragment } from "react";
import Box from "@material-ui/core/Box/Box";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Chip, IconButton } from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import AddSerializedAsset from "./AddSerializedAsset";
import { dateFormat, formatAmountWithCurrency, salesOrder, sidebarResource, treeToFlatArray, productInventory } from "../../../constants/helpers";
import moment from "moment";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import CustomReactTable from "../../../components/CustomReactTable/CustomReactTable";
import ManagePurchaseOrder from "../../PurchaseOrder/ManagePurchaseOrder";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import { uniqBy } from 'lodash';
import { CustomOfflineContext } from "../../../StateProvider/OfflineContext/OfflineContext";
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { useHistory } from "react-router-dom";
import InfoIcon from '@material-ui/icons/Info';

const SerializedAsset = ({ salesOrderData, isTabletScreen, isSmallScreen, setNextStep, showActivity, currencySymbol }) => {

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [deleting, setDeleting] = useState(false)
  const [isAdding, setAdding] = useState(false)
  const [showConfirmBox, setShowConfirmBox] = useState(false)
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [assetAssignedProduct, setAssetAssignedProduct] = useState([])

  const [deleteData, setDeleteData] = useState([])

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [showManagePurchaseOrderDialog, setShowManagePurchaseOrderDialog] = useState({ open: false, products: [] });
  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchFields()
  }, []);

  const fetchFields = async () => {
    var data = []
    if (isOffline) {
      data = await findOne(objectStore.resource, "salesOrderProduct")
    }
    else {
      const response = await axiosInstance().get(`/field/child?resource=Sales Order Product`)
      data = response?.data?.data
    }
    data = CURReplaceByCurrencySingle(data, salesOrderData.currency)
    const coloum: any = [{
      accessor: 'detail',
      Header: 'Detail',
      width: 300,
      Cell: ({ row }) => (
        <div className="d-flex gap-2 align-items-center">
          <p className="text-truncate" title={row.original.detail}  >
            {(row.original?.type === "asset" && !isOffline) ?
              <a className="link text-truncate" href={`${productInventory.route}/detail/${row.original.inventory}`} target="_blank">{row.original.detail}</a> :
              row.original.detail}
          </p>
          {row.original?.type === "asset" &&
            <span className="d-flex align-items-center gap-2">
              <Chip label="Asset" size="small" color="primary" />
              {(row.original.status === "Reserved" && !isOffline) &&
                <IconButton size="small" onClick={() => {
                  setShowConfirmBox(true)
                  setDeleteData([row.original.inventory])
                }}>
                  <Delete color="error" />
                </IconButton>}
            </span>}
        </div>)
    },
    {
      accessor: 'assets',
      Header: 'Assets Assigned',
      Cell: ({ row }) => (
        getAssetAssignedValues(row)
      )
    }]
    data.forEach(element => {
      if (element.type === "date") {
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          Cell: ({ row }) => (
            row.original[element.fieldName] ? <p>{moment(row.original[element.fieldName].slice(0, 10)).format(dateFormat)}</p> : <NoDataCell />
          )
        })
      }
      else if (element.type === "converter" || element.type === "currencyAmount" || element.isConverter === true) {
        if (element.type !== "currencyAmount" && (element.type === "converter" || element.isConverter === true)) {
          element.displayUnits.forEach((_unit) => {
            let fieldName = element.fieldName + "_" + _unit.toLowerCase()
            let fieldLabel = element.fieldLabel + " " + _unit
            coloum.push({
              accessor: fieldName,
              Header: fieldLabel,
              Cell: ({ row }) => (
                row.original[fieldName] ? <p>{row.original[fieldName]}</p> : <NoDataCell />
              )
            })
          })
        }
        else if (element.type === "currencyAmount" && (element.type === "converter" || element.isConverter === true)) {
          element.displayUnits.forEach((_unit) => {
            element.displayCurrency.forEach((_currency) => {
              let fieldName = element.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase()
              let fieldLabel = element.fieldLabel + " " + _unit + "/" + _currency
              coloum.push({
                accessor: fieldName,
                Header: fieldLabel,
                Cell: ({ row }) => (
                  row.original[fieldName] ? <p>{formatAmountWithCurrency(salesOrderData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p> : <NoDataCell />
                )
              })
            })
          })
        }
        else if (element.type === "currencyAmount") {
          element.displayCurrency.forEach((_currency) => {
            let fieldName = element.fieldName + "_" + _currency.toLowerCase()
            let fieldLabel = element.fieldLabel + " " + _currency
            coloum.push({
              accessor: fieldName,
              Header: fieldLabel,
              Cell: ({ row }) => (
                row.original[fieldName] ? <p>{formatAmountWithCurrency(salesOrderData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p> : <NoDataCell />
              )
            })
          })
        }
      }
      else {
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          Cell: ({ row }) => (
            row.original[element.fieldName] ? <p>{row.original[element.fieldName]}</p> : <NoDataCell />
          )
        })
      }
    });
    coloum.forEach(element => {
      if (element.accessor.includes("detail")) {
        element["Footer"] = () => {
          return <>Total</>
        }
      }
      else if (element.accessor === "qty") {
        element["Footer"] = (info) => {
          const qtyTotal = info.rows.filter(f => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor])).reduce((sum, row) => row.values[element.accessor] + sum, 0)
          return <>{qtyTotal}</>
        }
      }
      else if (element.accessor.includes("finalPrice")) {
        element["Footer"] = (info) => {
          const total = info.rows.filter(f => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor])).reduce((sum, row) => row.values[element.accessor] + sum, 0)
          return <>{currencySymbol} {formatAmountWithCurrency(salesOrderData?.currency, total)?.amountWithouCurrencyCode ?? total}</>
        }
      }
    });
    setColumns(coloum)
    fetchProductInventory();

  }

  const fetchProductInventory = async () => {
    setNextStep(false)
    try {
      var data: any = []
      if (isOffline) {
        data = await findOne(objectStore.salesOrder, salesOrderData._id)
        data.inventory = data.productInventory;
      }
      else {
        const response = await axiosInstance().get(`${salesOrder.salesOrderApi}/productpackage/${salesOrderData._id}`)
        data = response?.data?.data
      }
      const rows = data.material.filter((e) => e.parentId === null)
      rows.forEach((parent, i) => {
        parent.detail = `${(i + 1)} - ${parent.type === "product" ? parent.productDetail?.productName : parent.packageDetail?.packageName}`
        const subRows = []
        const inventory = data.inventory.filter((e) => e._id === parent._id);
        inventory?.forEach((_inventory, k) => {
          subRows.push({
            ..._inventory,
            detail: `${(i + 1)}.${(k + 1)} - ${_inventory.inventoryDetail?.assetNumber}`,
            type: "asset",
            status: _inventory.inventoryDetail?.status,
            _id: _inventory.inventory,
            isValid: true
          })
        })
        parent.subRows = subRows;
        if (parent.type === "product") {
          parent.isValid = parent?.qty === subRows?.length ? true : false;
        }
        if (parent.type === "package") {
          const child: any = [...data.material.filter((e) => e.parentId === parent._id)];
          child.forEach((_child, j) => {
            _child.detail = `${(i + 1)}.${(j + 1)} - ${_child.productDetail?.productName}`
            _child.qty = _child.qty * parent.qty
            const subRows = []
            const inventory = data.inventory.filter((e) => e._id === _child._id);
            inventory?.forEach((_inventory, l) => {
              subRows.push({
                ..._inventory,
                detail: `${(i + 1)}.${(j + 1)}.${(l + 1)} - ${_inventory.inventoryDetail?.assetNumber}`,
                type: "asset",
                status: _inventory.inventoryDetail?.status,
                _id: _inventory.inventory,
                isValid: true
              })
            })
            _child.subRows = subRows;
            _child.isValid = _child?.qty === subRows?.length ? true : false;
          })
          if (child.filter(e => e.isValid === false).length > 0) {
            parent.isValid = false
          } else {
            parent.isValid = true
          }
          parent.subRows = child;
        }
      });
      if (rows.filter(_rows => _rows.isValid === false).length > 0) {
        setNextStep(false)
      } else {
        setNextStep(true)
      }
      setRowsData(rows);
      setSelectedProducts([])
    }
    catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getAssetAssignedValues = (row) => {
    if (row.original?.type === "product") {
      if (row.subRows && row.subRows?.length > 0) {
        return <p>{row.subRows.length} / {row.original.qty}</p>
      }
      return <p>0 / {row.original.qty}</p>;
    }
    else if (row.original?.type === "package") {
      const qty = row.original?.subRows?.reduce((sum, row) => row.qty + sum, 0);
      const flatData = treeToFlatArray([{ ...row.original }], "subRows")
      const getAssetsOnly = flatData.filter(f => f.type === "asset");
      return <p>{getAssetsOnly.length} / {qty}</p>;
    }
    return "";
  }

  const handleAddSerializedAsset = (assets) => {
    let data = [];
    selectedProducts?.forEach((e: any) => {
      if (e.type === "product") {
        let qty = e.qty - e.subRows.length;
        while (qty) {
          const result = assets.filter(f => f.productId === e.materialId && !f.isCounted);
          if (result.length) {
            let obj: any = {};
            obj._id = e._id
            obj.inventory = result[0].id;
            obj.product = e.materialId
            data.push(obj)
            result[0].isCounted = true;
          }
          qty--;
        }
      }
    })
    // assets.forEach(d => {
    //   const result = selectedProducts.find(f => d.productId === f.id);
    //   if (result) {
    //     let obj: any = {};
    //     obj._id = result._id
    //     obj.inventory = d.id;
    //     obj.product = result.materialId
    //     data.push(obj)
    //   }
    // })
    if (data.length) {
      setAdding(true)
      axiosInstance().post(`${salesOrder.salesOrderApi}/${salesOrderData._id}/inventory`, { "products": data })
        .then(({ data }) => {
          setAddSerializedAssetDialog(false)
          fetchProductInventory()
          setSelectedProducts([])
          setAssetAssignedProduct([])
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

  const handleRemoveInventory = () => {
    if (deleteData.length >= 1) {
      setDeleting(true)
      axiosInstance().put(`${salesOrder.salesOrderApi}/${salesOrderData._id}/inventory/remove`, { products: deleteData })
        .then(() => {
          setDeleting(false)
          fetchProductInventory()
          setDeleteData(null)
          setShowConfirmBox(false);
        }).catch((error) => {
          setDeleting(false)
          toastConfig.setToastConfig(error)
          setDeleteData(null)
        });
    }
  }

  useEffect(() => {
    let flatArray = treeToFlatArray(selectedProducts, "subRows").filter(f => f.type === "product" && f.qty !== f.subRows?.length);
    flatArray = uniqBy(flatArray, '_id')
    const products = flatArray.map(m => { return { _id: m.materialId, unit: m.unit, assetsCount: m.qty - (m.subRows?.length ?? 0) } })
    setShowManagePurchaseOrderDialog(prevState => {
      return {
        ...prevState,
        products: products
      }
    });
    const assetProduct = []
    flatArray.forEach((element) => {
      if (element.type === "product" && element.qty > element?.subRows?.length) {
        const foundProduct = assetProduct.filter((e) => e.materialId === element.materialId)
        if (foundProduct.length) {
          foundProduct[0].qty += element.qty - element?.subRows?.length
        }
        else {
          assetProduct.push({
            ...element,
            _id: element.materialId,
            id: element.materialId,
            productName: element.productDetail?.productName,
            qty: element.qty - element?.subRows?.length
          })
        }
      }
    })
    setAssetAssignedProduct(assetProduct)
  }, [selectedProducts])

  const disableAssignSerializedAssets = () => {
    if (selectedProducts.length === 0)
      return true;
    const flatArray = treeToFlatArray(selectedProducts, "subRows").filter(f => f.type === "product" && f.qty > f.subRows?.length);
    return flatArray.length === 0;
  }

  return (<Fragment>
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
              disabled={showManagePurchaseOrderDialog.products.length === 0}
              onClick={() => {
                setShowManagePurchaseOrderDialog(prevState => ({ ...prevState, open: true }))
              }}
            >
              {`Create ${routes.purchaseOrder.title}`}
            </Button>
            <HtmlTooltip title={`Created ${routes.purchaseOrder.title}`}>
              <IconButton size="small" onClick={() => {
                history.push(routes.purchaseOrder.path, {
                  salesOrder: salesOrderData,
                })
              }}>
                <InfoIcon color="disabled" />
              </IconButton>
            </HtmlTooltip>
            <Box mx={1} component="span" />
            <Button
              variant="contained"
              color="primary"
              type="button"
              size="small"
              disabled={(selectedProducts.filter(d => d.type === "asset" && d.status === "Reserved").length === 0)}
              onClick={() => {
                setDeleteData(selectedProducts.filter(d => d.type === "asset").map(d => d?.inventory))
                setShowConfirmBox(true)
              }}
            >
              Delete Assets
            </Button>
          </div>
        </Box>
      </Grid>
      <Grid item xs={12} md={12} sm={12} >
        {columns && rowsData ?
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
              data={rowsData}
              isInValidCheck={(rowData) => !rowData.isValid}
              onSelect={setSelectedProducts}
              childrenProperty="subRows"
              uniqueKey="_id"
              hideSelection={isOffline}
            />
          </Box>
          : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
        }
      </Grid>
    </Grid>
    {addSerializedAssetDialog &&
      <AddSerializedAsset
        addSerializedAsset={handleAddSerializedAsset}
        handleSerializedAssetClose={() => {
          setAddSerializedAssetDialog(false);
        }}
        isAdding={isAdding}
        selectedProducts={assetAssignedProduct}
        filterByPlant={salesOrderData?.warehouse?.optionValue ? salesOrderData?.warehouse?.optionValue : null}
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
        onOk={handleRemoveInventory}
      />
    )
    }
    {showManagePurchaseOrderDialog.open &&
      <ManagePurchaseOrder
        isClone={false}
        purchaseOrderId={null}
        onClose={() => setShowManagePurchaseOrderDialog(prevState => ({ ...prevState, open: false }))}
        onSuccess={() => {
          setShowManagePurchaseOrderDialog(({ open: false, products: [] }))
          setSelectedProducts([])
          fetchProductInventory()
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: `${sidebarResource.purchaseOrder} has been created successfully`,
          });
        }}
        productsToSave={[...showManagePurchaseOrderDialog.products]}
        isFromSerializedAssetStepFromSalesOrder={true}
        currency={salesOrderData.currencyCode}
        salesOrderId={salesOrderData._id}
        warehouseId={salesOrderData?.warehouse?.optionValue}
        deliveryDateMax={salesOrderData.estimateStartDate}
      />
    }
  </Fragment>
  );
}
export default SerializedAsset;