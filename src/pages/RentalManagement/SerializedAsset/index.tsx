import { useState, useEffect, useContext, useMemo, Fragment } from "react";
import Box from "@material-ui/core/Box/Box";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Chip, IconButton, ListItemIcon, ListItemText, Menu, MenuItem , ButtonGroup } from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import AddSerializedAsset from "./AddSerializedAsset";
import { dateFormat, formatAmountWithCurrency, rentalManagement, sidebarResource, treeToFlatArray, serializedAsset, INVENTORY_STATUS } from "../../../constants/helpers";
import moment from "moment";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import CustomReactTable from "../../../components/CustomReactTable/CustomReactTable";
import ManagePurchaseOrder from "../../PurchaseOrder/ManagePurchaseOrder";
import ManageSublease from "../../Sublease/ManageSublease";
import { uniqBy } from 'lodash';
import { CustomOfflineContext } from "../../../StateProvider/OfflineContext/OfflineContext";
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { useHistory } from "react-router-dom";
import InfoIcon from '@material-ui/icons/Info';
import { isMobile, isTablet } from "react-device-detect";
import { useData } from "../../../StateProvider/Provider";
import { BiChevronDown } from "react-icons/bi";
import React from "react";
import { IoMdEye } from "react-icons/io";
import { fetch_rental_product_fields } from '../../../components/RentalManagment/helper';
import { ExpandMore } from '@material-ui/icons';

const SerializedAsset = ({ rentalManagementData, isTabletScreen, isSmallScreen, setNextStep, showActivity, currencySymbol }) => {

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [deleting, setDeleting] = useState(false)
  const [isAdding, setAdding] = useState(false)
  const [showConfirmBox, setShowConfirmBox] = useState(false)
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false })
  const [selectedProducts, setSelectedProducts] = useState([])
  const [assetAssignedProduct, setAssetAssignedProduct] = useState([])

  const [deleteData, setDeleteData] = useState([])

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [showOrderDialog, setOrderDialog] = useState({ open: false, products: [], type: "" });

  const [anchorActionEl, setAnchorActionEl] = useState(null);

  const { state: { user, permissions, selectedEntity } }: any = useData();

  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchFields()
  }, []);

  const fetchFields = async () => {
    var data = await fetch_rental_product_fields(rentalManagementData.currency, isOffline);
    const coloum: any = [{
      accessor: 'detail',
      Header: 'Detail',
      width: 300,
      sticky: isMobile ? "none" : "left",
      Cell: ({ row }) => (
        <div className="d-flex gap-2 align-items-center">
          <p className="text-truncate" title={row.original.detail}  >
            {(row.original?.type === "asset" && !isOffline) ?
              <a className="link text-truncate" href={`${serializedAsset.route}/detail/${row.original.inventory}`} target="_blank">{row.original.detail}</a> :
              row.original.detail}
          </p>
          {row.original.isPurchaseOrder &&
            <HtmlTooltip title={`${routes.purchaseOrder.title}`}>
              <IconButton size="small" onClick={() => {
                history.push(routes.purchaseOrder.path, {
                  rental: rentalManagementData,
                })
              }}>
                <InfoIcon fontSize="small" color={"primary"} />
              </IconButton>
            </HtmlTooltip>
          }
          {row.original.isSublease &&
            <HtmlTooltip title={`${routes.sublease.title}`}>
              <IconButton size="small" onClick={() => {
                history.push(routes.sublease.path, {
                  rental: rentalManagementData,
                })
              }}>
                <InfoIcon fontSize="small" color={"primary"} />
              </IconButton>
            </HtmlTooltip>
          }
          {row.original?.type === "asset" &&
            <span className="d-flex align-items-center gap-2">
              <Chip label="Asset" size="small" color="primary" />
              {(row.original.status === INVENTORY_STATUS.reserved && row.original?.manualStatus !== INVENTORY_STATUS.reserved && !isOffline) &&
                <HtmlTooltip title={`Remove`}>
                  <IconButton size="small" onClick={() => {
                    setShowConfirmBox(true)
                    setDeleteData([row.original.inventory])
                  }}>
                    <Delete fontSize="small" color="error" />
                  </IconButton>
                </HtmlTooltip>}
              {row.original.isTransferAsset &&
                <HtmlTooltip title={`Transfer from plant ${row?.original?.transferData?.transferFromPlant?.optionLabel} to  ${row?.original?.transferData?.transfertoPlant?.optionLabel}`}>
                  <IconButton size="small" onClick={() => {
                    history.push(routes.transferAsset.path, {
                      rental: rentalManagementData,
                    })
                  }}>
                    <InfoIcon fontSize="small" color={"primary"} />
                  </IconButton>
                </HtmlTooltip>
              }
            </span>}
        </div>),
      Footer: () => {
        return <>Total</>
      }
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
                  row.original[fieldName] ? <p>{formatAmountWithCurrency(rentalManagementData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p> : <NoDataCell />
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
                row.original[fieldName] ? <p>{formatAmountWithCurrency(rentalManagementData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p> : <NoDataCell />
              ),
              Footer: (info) => {
                const total = info?.rows?.filter(f => f.original.parentId === null && f.values.hasOwnProperty(fieldName) && !isNaN(f.values[fieldName])).reduce((sum, row) => row.values[fieldName] + sum, 0)
                return <>{currencySymbol} {formatAmountWithCurrency(rentalManagementData?.currency, total)?.amountWithouCurrencyCode ?? total}</>
              }
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
      if (element.accessor === "qty") {
        element["Footer"] = (info) => {
          const qtyTotal = info.rows.filter(f => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor])).reduce((sum, row) => row.values[element.accessor] + sum, 0)
          return <>{qtyTotal}</>
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
      var transferAssets: any = []
      var purchaseOrderProduct: any = []
      var subleaseProduct: any = []

      if (isOffline) {
        data = await findOne(objectStore.rentalManagement, rentalManagementData._id)
        data.inventory = data.productInventory;
      }
      else {
        const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`)
        data = response?.data?.data

        const result = await axiosInstance().get(`${rentalManagement.api}/rental-related-transaction/${rentalManagementData._id}`)
        const transactionData = result?.data?.data

        transferAssets = transactionData?.transferAsset;
        purchaseOrderProduct = transactionData?.purchaseOrder
        subleaseProduct = transactionData?.sublease
      }

      const rows = data.material.filter((e) => e.parentId === null)
      rows.forEach((parent, i) => {
        parent.detail = `${(i + 1)} - ${parent.type === "product" ? parent.productDetail?.productName : parent.packageDetail?.packageName}`
        const subRows = []
        const inventory = data.inventory?.filter((e) => e._id === parent._id);
        inventory?.forEach((_inventory, k) => {
          const transferFilter = transferAssets.filter(e => e.assetId === _inventory.inventory);
          var isTransferAsset = false;
          var transferData = {};
          if (transferFilter.length) {
            isTransferAsset = true
            transferData = transferFilter[0]
          }
          const isPurchaseOrderAsset = purchaseOrderProduct.some(e => e._id === _inventory?.inventoryDetail?.purchaseOrder);
          subRows.push({
            ..._inventory,
            detail: `${(i + 1)}.${(k + 1)} - ${_inventory.inventoryDetail?.assetNumber}`,
            type: "asset",
            status: _inventory.inventoryDetail?.status,
            manualStatus: _inventory.inventoryDetail?.manualStatus,
            _id: _inventory.inventory,
            isValid: _inventory.inventoryDetail?.manualStatus === INVENTORY_STATUS.reserved ? false : true,
            isPurchaseOrderAsset: isPurchaseOrderAsset,
            isTransferAsset: isTransferAsset,
            transferData: transferData,
            isSubleaseAsset: _inventory.inventoryDetail?.subleaseAsset
          })
        })
        parent.subRows = subRows;
        parent.isSublease = subleaseProduct?.some(e => e.materialId === parent.materialId)
        if (parent.type === "product") {
          parent.isValid = parent?.qty === subRows?.length ? true : false;
          parent.isPurchaseOrder = purchaseOrderProduct?.some(e => e.productId === parent.materialId)
        }
        if (parent.type === "package") {
          const child: any = [...data.material?.filter((e) => e.parentId === parent._id)];
          child.forEach((_child, j) => {
            _child.detail = `${(i + 1)}.${(j + 1)} - ${_child.productDetail?.productName}`
            _child.qty = _child.qty * parent.qty
            const subRows = []
            const inventory = data.inventory?.filter((e) => e._id === _child._id);
            inventory?.forEach((_inventory, l) => {
              const transferFilter = transferAssets.filter(e => e.assetId === _inventory.inventory);
              var isTransferAsset = false;
              var transferData = {};
              if (transferFilter.length) {
                isTransferAsset = true
                transferData = transferFilter[0]
              }
              const isPurchaseOrderAsset = purchaseOrderProduct.some(e => e._id === _inventory?.inventoryDetail?.purchaseOrder);
              subRows.push({
                ..._inventory,
                detail: `${(i + 1)}.${(j + 1)}.${(l + 1)} - ${_inventory?.inventoryDetail?.assetNumber}`,
                type: "asset",
                status: _inventory.inventoryDetail?.status,
                manualStatus: _inventory.inventoryDetail?.manualStatus,
                _id: _inventory.inventory,
                isValid: _inventory.inventoryDetail?.manualStatus === INVENTORY_STATUS.reserved ? false : true,
                isPurchaseOrderAsset: isPurchaseOrderAsset,
                isTransferAsset: isTransferAsset,
                transferData: transferData,
                isSubleaseAsset: _inventory?.inventoryDetail?.subleaseAsset
              })
            })
            _child.subRows = subRows;
            _child.isValid = _child?.qty === subRows?.length ? true : false;
            _child.isPurchaseOrder = purchaseOrderProduct?.some(e => e.productId === _child.materialId)
            _child.isSublease = subleaseProduct?.some(e => e.materialId === _child.materialId)
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
    let flatArray = treeToFlatArray(selectedProducts, "subRows").filter(f => f.type === "product");
    flatArray?.forEach((e: any) => {
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
    if (data.length) {
      setAdding(true)
      axiosInstance().post(`${rentalManagement.api}/${rentalManagementData._id}/inventory`, { "products": data })
        .then(({ data }) => {
          setAddSerializedAssetDialog({ open: false })
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
          setAddSerializedAssetDialog({ open: false })
          setAdding(false)
          toastConfig.setToastConfig(error)
        });
    }
  };

  const handleRemoveInventory = () => {
    if (deleteData.length >= 1) {
      setDeleting(true)
      axiosInstance().put(`${rentalManagement.api}/${rentalManagementData._id}/inventory/remove`, { products: deleteData })
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
    setOrderDialog(prevState => {
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

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  return (<Fragment>
    <Box display="flex" justifyContent="flex-end" pt={1} pb={2} >
      <Box display="flex" alignItems="center" justifyContent={isMobile ? "space-between" : "flex-end"} paddingX={1} gridColumnGap={8} flex={1}>
        <Box display="flex" gridColumnGap={5}>
          <Button
            variant="contained"
            color="primary"
            type="button"
            size="small"
            disabled={disableAssignSerializedAssets()}
            onClick={() => {
              setOrderDialog(prevState => ({ ...prevState, open: true, type: "purchaseOrder" }))
            }}
          >
            {`Assign ${routes.serializedAsset.title}`}
          </Button>
          <Button
            variant="outlined"
            color="default"
            size="small"
            onClick={openActions}
            aria-controls="action-menu"
          >
            Actions <ExpandMore />
          </Button>
          <Menu
            anchorEl={anchorActionEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            id="action-menu"
            open={Boolean(anchorActionEl)}
            onClose={closeActions}
          >
            <MenuItem
              disabled={showOrderDialog.products.length === 0}
              onClick={() => {
                setOrderDialog(prevState => ({ ...prevState, open: true, type: "purchaseOrder" }))
                closeActions()
              }}
            >
              {`Create ${routes.purchaseOrder.title}`}</MenuItem>

            {permissions?.sublease?.isCreate &&
              <MenuItem
                disabled={showOrderDialog.products.length === 0}
                onClick={() => {
                  setOrderDialog(prevState => ({ ...prevState, open: true, type: "sublease" }))
                  closeActions()
                }}
              >
                {`Create ${routes.sublease.title}`}</MenuItem>}

            <MenuItem
              disabled={(selectedProducts.filter(d => d.type === "asset" && d.status === INVENTORY_STATUS.reserved).length === 0)}
              onClick={() => {
                setDeleteData(selectedProducts.filter(d => d.type === "asset").map(d => d?.inventory))
                setShowConfirmBox(true)
                closeActions()
              }}
            >
              {`Remove ${routes.serializedAsset.title}`}</MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
    <Grid container spacing={2}>
      <Grid item xs={12} md={12} sm={12}>
        {columns && rowsData ?
          <Box
            zIndex={5}
            width={
              isTabletScreen
                ? "calc(100vw - 20px)"
                : isSmallScreen
                  ? "calc(100vw - 78px)"
                  : showActivity ? "100%" : "calc(100vw - 103px)"
            }
            height="calc(100vh - 350px)"
          >
            <CustomReactTable
              height="calc(100vh - 365px)"
              columns={columns}
              data={rowsData}
              setCellColor={(rowData) => {
                if (rowData.isTransferAsset) return "isTransferAsset";
                if (!rowData.isValid) return "error";
                if (rowData.isPurchaseOrderAsset) return "isPurchaseOrder";
                if (rowData.isSubleaseAsset) return "isSublease";
                return "";
              }}
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
    {addSerializedAssetDialog.open &&
      <AddSerializedAsset
        addSerializedAsset={handleAddSerializedAsset}
        handleSerializedAssetClose={() => {
          setAddSerializedAssetDialog({ open: false });
        }}
        refrenceType={"Rental Job"}
        refrenceData={{
          _id: rentalManagementData?._id, warehouse: rentalManagementData?.warehouse?.optionValue
          , wellName: rentalManagementData?.wellName, afeNumber: rentalManagementData?.afeNumber
        }}
        isAdding={isAdding}
        selectedProducts={assetAssignedProduct}
        //queryString={addSerializedAssetDialog.type === "all" ? `notInPlant=${rentalManagementData?.warehouse?.optionValue}&availableAssets=true` : ``}
        filterByPlant={rentalManagementData?.warehouse?.optionValue}
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
    {(showOrderDialog.open && showOrderDialog.type === "purchaseOrder") &&
      <ManagePurchaseOrder
        isClone={false}
        purchaseOrderId={null}
        onClose={() => setOrderDialog(prevState => ({ ...prevState, open: false, type: "" }))}
        onSuccess={() => {
          setOrderDialog(({ open: false, products: [], type: "" }))
          setSelectedProducts([])
          fetchProductInventory()
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: `${sidebarResource.purchaseOrder} has been created successfully`,
          });
        }}
        productsToSave={[...showOrderDialog.products]}
        isFromSerializedAssetStepFromRental={true}
        currency={rentalManagementData.currency}
        refrenceData={{ wellName: rentalManagementData?.wellName, afeNumber: rentalManagementData?.afeNumber }}
        rentalManagementId={rentalManagementData._id}
        warehouseId={rentalManagementData?.warehouse?.optionValue}
        deliveryDateMax={rentalManagementData.estimateStartDate}
      />
    }
    {(showOrderDialog.open && showOrderDialog.type === "sublease") &&
      <ManageSublease
        isClone={false}
        subleaseId={null}
        onClose={() => setOrderDialog(prevState => ({ ...prevState, open: false, type: "" }))}
        onSuccess={() => {
          setOrderDialog(({ open: false, products: [], type: "" }))
          setSelectedProducts([])
          fetchProductInventory()
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: `${sidebarResource.sublease} has been created successfully`,
          });
        }}
        currency={rentalManagementData.currency}
        refrenceType="rentalJob"
        refrenceId={rentalManagementData._id}
        refrenceData={{ ...rentalManagementData, material: [...showOrderDialog.products] }}
      />
    }
  </Fragment>
  );
}
export default SerializedAsset;