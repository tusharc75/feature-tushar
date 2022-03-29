import { useState, useEffect, useContext, useMemo, Fragment } from "react";
import Box from "@material-ui/core/Box/Box";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Chip, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, ButtonGroup } from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import AddSerializedAsset from "./AddSerializedAsset";
import { dateFormat, formatAmountWithCurrency, rentalManagement, sidebarResource, treeToFlatArray, serializedAsset, INVENTORY_STATUS } from "../../../constants/helpers";
import moment from "moment";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import CustomReactTable from "../../../components/CustomReactTable/CustomReactTable";
import ManagePurchaseOrder from "../../PurchaseOrder/ManagePurchaseOrder";
import ManageBulkAssetCreation from "../../BulkAssetCreation/ManageBulkAssetCreation";
import ManageSublease from "../../Sublease/ManageSublease";
import { uniqBy, uniq, startCase } from 'lodash';
import { CustomOfflineContext } from "../../../StateProvider/OfflineContext/OfflineContext";
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { useHistory } from "react-router-dom";
import InfoIcon from '@material-ui/icons/Info';
import { isMobile, isTablet } from "react-device-detect";
import { useData } from "../../../StateProvider/Provider";
import { fetch_rental_product_fields } from '../../../components/RentalManagment/helper';
import { ExpandMore } from '@material-ui/icons';
import AddNonSerializeAssets from "./AddNonSerializeAssets";

const SerializedAsset = ({ rentalManagementData, isTabletScreen, isSmallScreen, setNextStep, showActivity, currencySymbol, stepFullScreen, allowedToEdit }) => {

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [deleting, setDeleting] = useState(false)
  const [isAdding, setAdding] = useState(false)
  const [showConfirmBox, setShowConfirmBox] = useState(false)
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false })
  const [addNonSerializedAssetDialog, setAddNonSerializedAssetDialog] = useState(false)
  const [selectedRecords, setSelectedRecords] = useState([])

  const [assetAssignedProduct, setAssetAssignedProduct] = useState([])
  const [nonSerializedAssetProduct, setNonSerializedAssetProduct] = useState([])

  const [deleteData, setDeleteData] = useState([])

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [showOrderDialog, setOrderDialog] = useState({ open: false, products: [], type: "" });

  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [anchorLinkActionEl, setAnchorLinkActionEl] = useState(null);

  const [purchaseOrderCount, setPurchaseOrderCount] = useState(0);
  const [subleaseCount, setSubleaseCount] = useState(0);
  const [transferAssetCount, setTransferAssetCount] = useState(0);
  const [bulkAssetCreationCount, setbulkAssetCreationCount] = useState(0);

  const { state: { user, permissions, selectedEntity } }: any = useData();
  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchFields()
  }, []);

  const fetchFields = async () => {
    var data = await fetch_rental_product_fields(rentalManagementData.currency, isOffline);
    const coloum: any = [
      {
        accessor: 'srno',
        Header: '#',
        width: 70,
        sticky: isMobile ? "none" : "left",
        Cell: ({ row }) => (
          <p className="text-truncate"  >
            {row.original.srno}
          </p>),
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        width: 300,
        sticky: isMobile ? "none" : "left",
        Cell: ({ row }) => (
          <div className="d-flex gap-2 align-items-center">
            <p className="text-truncate" title={row.original.detail}  >
              {(!isOffline) ?
                row.original?.type === "product" ?
                  <a className="link text-truncate" href={`${routes.productDetail.path}/${row.original.materialId}`} target="_blank">{row.original.detail}</a>
                  : row.original?.type === "package" ?
                    <a className="link text-truncate" href={`${routes.packagesDetail.path}/${row.original.materialId}`} target="_blank">{row.original.detail}</a>
                    : <a className="link text-truncate" href={`${routes.serializedAssetDetail.path}/${row.original.inventory}`} target="_blank">{row.original.detail}</a>
                : row.original.detail}
            </p>
            <Chip
              className="ml-1"
              label={`${row.original.type === 'product' ? !row.original.serializedProduct ? "Non-Serialized Product" : startCase(row.original?.type) : startCase(row.original?.type)}`}
              size="small"
              color="primary" />
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
            {row.original.isBulkAssetCreation &&
              <HtmlTooltip title={`${routes.bulkAssetCreation.title}`}>
                <IconButton size="small" onClick={() => {
                  history.push(routes.bulkAssetCreation.path, {
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
                {(row.original.status === INVENTORY_STATUS.reserved && row.original?.manualStatus !== INVENTORY_STATUS.reserved && !isOffline && allowedToEdit) &&
                  <HtmlTooltip title={`Remove`}>
                    <IconButton size="small" onClick={() => {
                      setShowConfirmBox(true)
                      setDeleteData([{ _id: row.original.inventory, isNonSerializeAsset: row.original.isNonSerializeAsset }])
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
      var bulkAssetCreationProduct: any = []
      var subleaseProduct: any = []

      if (isOffline) {
        data = await findOne(objectStore.rentalManagement, rentalManagementData._id)
        data.inventory = data.productInventory;
        data.nonSerializeAsset = data?.nonSerializeAsset;

        const offlineDataSync = await findOne(objectStore.offlineDataSync, rentalManagementData._id)
        if (offlineDataSync && offlineDataSync?.data) {
          offlineDataSync?.data?.forEach((element: any) => {
            if (element?.serializedProduct) {
              data.inventory.push(element)
            }
            else {
              data.nonSerializeAsset.push(element)
            }
          })
        }
      }
      else {
        const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`)
        data = response?.data?.data

        const result = await axiosInstance().get(`${rentalManagement.api}/rental-related-transaction/${rentalManagementData._id}`)
        const transactionData = result?.data?.data

        if (permissions?.purchaseOrder?.isRead) {
          purchaseOrderProduct = transactionData?.purchaseOrder
          setPurchaseOrderCount(purchaseOrderProduct?.length)
        }
        if (permissions?.bulkAssetCreation?.isRead) {
          bulkAssetCreationProduct = transactionData?.bulkAssetCreation
          setbulkAssetCreationCount(bulkAssetCreationProduct?.length)
        }
        if (permissions?.sublease?.isRead) {
          subleaseProduct = transactionData?.sublease
          setSubleaseCount(subleaseProduct?.length)
        }
        if (permissions?.transferAsset?.isRead) {
          transferAssets = transactionData?.transferAsset
          setTransferAssetCount(transferAssets?.length)
        }
      }

      const rows = data.material.filter((e) => e.parentId === null)
      rows.forEach((parent, i) => {
        parent.srno = i + 1;
        parent.detail = `${parent.type === "product" ? parent.productDetail?.productName : parent.packageDetail?.packageName}`
        parent.serializedProduct = parent.type === "product" ? parent.productDetail?.serializedProduct : false;
        parent.assetQty = parent.type === "product" ? parent.qty : 0;
        parent.assetAssignedQty = parent.serializedProduct ? data.inventory?.filter((e) => e._id === parent._id).length : data.nonSerializeAsset?.filter((e) => e._id === parent._id).length;
        parent.realAssetQty = parent.assetQty;
        parent.realAssetAssignedQty = parent.assetAssignedQty;
        parent.isValid = parent.serializedProduct ? parent.assetAssignedQty === parent.assetQty ? true : false : true;
        parent.isSublease = subleaseProduct?.some(e => e.materialId === parent.materialId)
        parent.isPurchaseOrder = purchaseOrderProduct?.some(e => e.productId === parent.materialId)
        parent.isBulkAssetCreation = bulkAssetCreationProduct?.some(e => e.productId === parent.materialId)
        parent.subRows = generateNestedData(data.material, data.inventory, data.nonSerializeAsset, parent, transferAssets, subleaseProduct, purchaseOrderProduct, bulkAssetCreationProduct);
      });

      if (rows.filter(_rows => _rows.isValid === false).length > 0) {
        setNextStep(false)
      } else {
        setNextStep(true)
      }

      setRowsData(rows);
      setSelectedRecords([])
    }
    catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const generateNestedData = (material, inventory, nonSerializeAsset, parent, transferAssets, subleaseProduct, purchaseOrderProduct, bulkAssetCreationProduct) => {

    const subRows: any = [];
    const inventory_result = inventory?.filter((e) => e._id === parent._id);
    inventory_result?.forEach((_inventory, k) => {
      const transferFilter = transferAssets.filter(e => e.assetId === _inventory.inventory);
      var isTransferAsset = false;
      var transferData = {};
      if (transferFilter.length) {
        isTransferAsset = true
        transferData = transferFilter[0]
      }
      subRows.push({
        ..._inventory,
        srno: `${parent.srno}.${(k + 1)}`,
        detail: _inventory?.assetNumber ? _inventory?.assetNumber : _inventory.inventoryDetail?.assetNumber,
        type: "asset",
        isNonSerializeAsset: false,
        status: _inventory.inventoryDetail?.status,
        manualStatus: _inventory.inventoryDetail?.manualStatus,
        _id: _inventory.inventory,
        isValid: _inventory.inventoryDetail?.manualStatus === INVENTORY_STATUS.reserved ? false : true,
        isTransferAsset: isTransferAsset,
        transferData: transferData,
        isSubleaseAsset: _inventory.inventoryDetail?.subleaseAsset
      })
    })

    const nonSerializeAsset_result = nonSerializeAsset?.filter((e) => e._id === parent._id);
    nonSerializeAsset_result?.forEach((_inventory, k) => {
      subRows.push({
        _id: _inventory.id,
        inventory: _inventory.id,
        srno: `${parent.srno}.${(k + 1)}`,
        detail: _inventory?.assetNumber,
        type: "asset",
        isNonSerializeAsset: true,
        status: _inventory?.status,
        isValid: true
      })
    })

    const childProduct: any = material.filter((e) => e.parentId === parent._id);
    var assetQtySUM = 0;
    var assetAssignedQtySUM = 0;
    childProduct.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.detail = _subRow.productDetail?.productName;
      _subRow.serializedProduct = _subRow.type === "product" ? _subRow.productDetail?.serializedProduct : false;
      _subRow.assetQty = _subRow.type === "product" ? _subRow.qty * parent.assetQty : 0;
      _subRow.assetAssignedQty = _subRow.serializedProduct ? inventory?.filter((e) => e._id === _subRow._id).length : nonSerializeAsset?.filter((e) => e._id === _subRow._id).length;
      _subRow.realAssetQty = _subRow.type === "product" ? _subRow.qty * parent.realAssetQty : 0;
      _subRow.realAssetAssignedQty = _subRow.assetAssignedQty;
      _subRow.isValid = _subRow.serializedProduct ? _subRow.assetAssignedQty === _subRow.assetQty ? true : false : true;
      _subRow.isSublease = subleaseProduct?.some(e => e.materialId === _subRow.materialId)
      _subRow.isPurchaseOrder = purchaseOrderProduct?.some(e => e.productId === _subRow.materialId)
      _subRow.isBulkAssetCreation = bulkAssetCreationProduct?.some(e => e.productId === _subRow.materialId)
      _subRow.subRows = generateNestedData(material, inventory, nonSerializeAsset, _subRow, transferAssets, subleaseProduct, purchaseOrderProduct, bulkAssetCreationProduct);
      subRows.push(_subRow)
      assetQtySUM += _subRow.assetQty
      assetAssignedQtySUM += _subRow.assetAssignedQty
    });

    parent.assetQty += assetQtySUM - (parent.type === "package" ? parent.qty : 0);
    parent.assetAssignedQty += assetAssignedQtySUM;
    parent.isValid = parent.serializedProduct ? parent.assetAssignedQty === parent.assetQty ? true : false : true;

    return subRows;
  }

  const getAssetAssignedValues = (row) => {
    if (row?.original?.type === "asset") {
      return "";
    }
    // if (!row?.original?.serializedProduct && row?.original?.assetAssignedQty === 0) {
    //   return <p>---</p>;
    // }
    return <p>{row?.original?.assetAssignedQty} / {row?.original?.assetQty}</p>;
  }

  const handleAddSerializedAsset = (assets) => {
    var data = [];
    var flatArray = treeToFlatArray(selectedRecords, "subRows").filter(f => f.type === "product");
    flatArray = uniqBy(flatArray, '_id')
    flatArray?.forEach((e: any) => {
      if (e.type === "product") {
        let qty = e.realAssetQty - e.realAssetAssignedQty;
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
          setSelectedRecords([])
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

    let flatArray = treeToFlatArray(selectedRecords, "subRows").filter(f => f.type === "product" && f.serializedProduct && f.realAssetQty > f.realAssetAssignedQty);
    flatArray = uniqBy(flatArray, '_id')
    const products = flatArray.map(m => { return { _id: m.materialId, unit: m.unit, assetsCount: m.realAssetQty - m.realAssetAssignedQty } })
    const uniqProduct = []
    products.forEach((element: any) => {
      const foundProduct = uniqProduct.filter((e) => e._id === element._id)
      if (foundProduct.length) {
        foundProduct[0].assetsCount += element.assetsCount
      }
      else {
        uniqProduct.push(element)
      }
    })
    setOrderDialog(prevState => {
      return {
        ...prevState,
        products: uniqProduct
      }
    });
    const assetProduct = []
    flatArray.forEach((element) => {
      if (element.type === "product" && element.realAssetQty > element.realAssetAssignedQty) {
        const foundProduct = assetProduct.filter((e) => e.materialId === element.materialId)
        if (foundProduct.length) {
          foundProduct[0].qty += element.realAssetQty - element.realAssetAssignedQty
        }
        else {
          assetProduct.push({
            ...element,
            _id: element._id,
            id: element.materialId,
            productName: element.productDetail?.productName,
            qty: element.realAssetQty - element.realAssetAssignedQty
          })
        }
      }
    })
    setAssetAssignedProduct([...assetProduct])

    const nonSerializeAssetProduct = []
    let flatArrayNonSerializeAsset = treeToFlatArray(selectedRecords, "subRows").filter(f => f.type === "product" && !f.serializedProduct && f.realAssetQty > f.realAssetAssignedQty);
    flatArrayNonSerializeAsset.forEach((element) => {
      if (element.type === "product" && element.realAssetQty > element.realAssetAssignedQty) {
        const foundProduct = nonSerializeAssetProduct.filter((e) => e.materialId === element.materialId)
        if (foundProduct.length) {
          foundProduct[0].qty += element.realAssetQty - element.realAssetAssignedQty
        }
        else {
          nonSerializeAssetProduct.push({
            ...element,
            _id: element._id,
            id: element.materialId,
            productName: element.productDetail?.productName,
            qty: element.realAssetQty - element.realAssetAssignedQty
          })
        }
      }
    })
    setNonSerializedAssetProduct([...nonSerializeAssetProduct])

  }, [selectedRecords])

  const disableAssignSerializedAssets = () => {
    if (selectedRecords.length === 0)
      return true;
    const flatArray = treeToFlatArray(selectedRecords, "subRows").filter(f => f.type === "product" && f.serializedProduct && f.realAssetQty > f.realAssetAssignedQty);
    return flatArray.length === 0;
  }

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  const openLinkActions = (event) => {
    setAnchorLinkActionEl(event.currentTarget);
  };

  const closeLinkActions = () => {
    setAnchorLinkActionEl(null);
  };

  return (<Fragment>
    {allowedToEdit &&
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
                if (isOffline) {
                  setAddNonSerializedAssetDialog(true)
                }
                else {
                  setAddSerializedAssetDialog({ open: true })
                }
              }}
            >
              {`Assign ${routes.serializedAsset.title}`}
            </Button>
            {!isOffline &&
              <Button
                variant="outlined"
                color="default"
                size="small"
                onClick={openActions}
                aria-controls="action-menu"
              >
                Actions <ExpandMore />
              </Button>
            }
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
              {permissions?.bulkAssetCreation?.isCreate &&
                <MenuItem
                  disabled={showOrderDialog.products.length === 0}
                  onClick={() => {
                    setOrderDialog(prevState => ({ ...prevState, open: true, type: "bulkAssetCreation" }))
                    closeActions()
                  }}
                >
                  {`Create ${routes.bulkAssetCreation.title}`}</MenuItem>
              }
              {permissions?.purchaseOrder?.isCreate &&
                <MenuItem
                  disabled={showOrderDialog.products.length === 0}
                  onClick={() => {
                    setOrderDialog(prevState => ({ ...prevState, open: true, type: "purchaseOrder" }))
                    closeActions()
                  }}
                >
                  {`Create ${routes.purchaseOrder.title}`}</MenuItem>
              }
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
                disabled={selectedRecords.length === 0 || nonSerializedAssetProduct?.length === 0}
                onClick={() => {
                  setAddNonSerializedAssetDialog(true)
                  closeActions()
                }}
              >
                {`Assign Serial Number`}</MenuItem>
              <MenuItem
                disabled={(treeToFlatArray(selectedRecords, "subRows")?.filter(d => d.type === "asset" && d.status === INVENTORY_STATUS.reserved).length === 0)}
                onClick={() => {
                  const assets = treeToFlatArray(selectedRecords, "subRows")?.filter(d => d.type === "asset");
                  const dataTodelete = []
                  assets?.forEach((element) => {
                    dataTodelete.push({ _id: element?.inventory, isNonSerializeAsset: element?.isNonSerializeAsset })
                  })
                  setDeleteData(dataTodelete)
                  setShowConfirmBox(true)
                  closeActions()
                }}
              >
                {`Remove ${routes.serializedAsset.title}`}</MenuItem>
            </Menu>
            {(purchaseOrderCount > 0 || subleaseCount > 0 || transferAssetCount > 0 || bulkAssetCreationCount > 0) &&
              <IconButton onClick={openLinkActions} size="small" color="primary"  >
                <ExpandMore fontSize="inherit" />
              </IconButton>
            }
            <Menu
              anchorEl={anchorLinkActionEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="action-menu"
              open={Boolean(anchorLinkActionEl)}
              onClose={closeLinkActions}
            >
              {purchaseOrderCount > 0 &&
                <MenuItem
                  onClick={() => {
                    history.push(routes.purchaseOrder.path, {
                      rental: rentalManagementData,
                    })
                  }}
                >
                  {`Created ${routes.purchaseOrder.title}`}
                </MenuItem>}
              {bulkAssetCreationCount > 0 &&
                <MenuItem
                  onClick={() => {
                    history.push(routes.bulkAssetCreation.path, {
                      rental: rentalManagementData,
                    })
                  }}
                >
                  {`Created ${routes.bulkAssetCreation.title}`}
                </MenuItem>}
              {subleaseCount > 0 &&
                <MenuItem
                  onClick={() => {
                    history.push(routes.sublease.path, {
                      rental: rentalManagementData,
                    })
                  }}
                >
                  {`Created ${routes.sublease.title}`}
                </MenuItem>}
              {transferAssetCount > 0 &&
                <MenuItem
                  onClick={() => {
                    history.push(routes.transferAsset.path, {
                      rental: rentalManagementData,
                    })
                  }}>
                  {`Created ${routes.transferAsset.title}`}
                </MenuItem>}
            </Menu>
          </Box>
        </Box>
      </Box>
    }
    <Grid container spacing={2}>
      <Grid item xs={12} md={12} sm={12}>
        {columns && rowsData ?
          <Box
            zIndex={5}
            width={
              stepFullScreen ? "100%" :
                isTabletScreen
                  ? "calc(100vw - 20px)"
                  : isSmallScreen
                    ? "calc(100vw - 78px)"
                    : showActivity ? "100%" : "calc(100vw - 103px)"
            }
            height={stepFullScreen ? "calc(100vh - 150px)" : "calc(100vh - 350px)"}
          >
            <CustomReactTable
              height={stepFullScreen ? "calc(100vh - 150px)" : "calc(100vh - 365px)"}
              columns={columns}
              data={rowsData}
              setCellColor={(rowData) => {
                if (rowData.isTransferAsset) return "isTransferAsset";
                if (!rowData.isValid) return "error";
                //if (rowData.isPurchaseOrder) return "isPurchaseOrder";
                //if (rowData.isBulkAssetCreation) return "isPurchaseOrder";
                if (rowData.isSubleaseAsset) return "isSublease";
                return "";
              }}
              onSelect={setSelectedRecords}
              childrenProperty="subRows"
              uniqueKey="_id"
              hideSelection={!allowedToEdit}
              renderedFrom="rental_management_serialized_asset"
              isClientSideGrid={true}
            />
          </Box>
          : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
        }
      </Grid>
    </Grid>
    {
      addSerializedAssetDialog.open &&
      <AddSerializedAsset
        addSerializedAsset={handleAddSerializedAsset}
        handleSerializedAssetClose={() => {
          setAddSerializedAssetDialog({ open: false });
        }}
        refrenceType={"Rental Job"}
        refrenceData={{
          _id: rentalManagementData?._id, warehouse: rentalManagementData?.warehouse?.optionValue
          , wellName: rentalManagementData?.wellName?.optionValue, afeNumber: rentalManagementData?.afeNumber
        }}
        isAdding={isAdding}
        selectedProducts={assetAssignedProduct}
        filterByPlant={rentalManagementData?.warehouse?.optionValue}
      />
    }
    {
      addNonSerializedAssetDialog && (
        <AddNonSerializeAssets
          closeDialog={() => {
            setAddNonSerializedAssetDialog(false)
            setSelectedRecords([])
            fetchProductInventory()
          }}

          products={isOffline ? [...assetAssignedProduct, ...nonSerializedAssetProduct] : nonSerializedAssetProduct}
          warehouse={rentalManagementData?.warehouse?.optionValue}
          referenceId={rentalManagementData?._id}
        />
      )
    }
    {
      showConfirmBox && (
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
    {
      (showOrderDialog.open && showOrderDialog.type === "bulkAssetCreation") &&
      <ManageBulkAssetCreation
        isClone={false}
        bulkAssetCreationId={null}
        onClose={() => setOrderDialog(prevState => ({ ...prevState, open: false, type: "" }))}
        onSuccess={() => {
          setOrderDialog(({ open: false, products: [], type: "" }))
          setSelectedRecords([])
          fetchProductInventory()
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: `${sidebarResource.bulkAssetCreation} has been created successfully`,
          });
        }}
        refrenceData={{
          products: [...showOrderDialog.products],
          wellName: rentalManagementData?.wellName?.optionValue,
          afeNumber: rentalManagementData?.afeNumber,
          warehouse: rentalManagementData?.warehouse?.optionValue
        }}
        refrenceId={rentalManagementData._id}
      />
    }
    {
      (showOrderDialog.open && showOrderDialog.type === "purchaseOrder") &&
      <ManagePurchaseOrder
        isClone={false}
        purchaseOrderId={null}
        onClose={() => setOrderDialog(prevState => ({ ...prevState, open: false, type: "" }))}
        onSuccess={() => {
          setOrderDialog(({ open: false, products: [], type: "" }))
          setSelectedRecords([])
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
        refrenceData={{ wellName: rentalManagementData?.wellName?.optionValue, afeNumber: rentalManagementData?.afeNumber }}
        rentalManagementId={rentalManagementData._id}
        warehouseId={rentalManagementData?.warehouse?.optionValue}
        deliveryDateMax={rentalManagementData.estimateStartDate}
      />
    }
    {
      (showOrderDialog.open && showOrderDialog.type === "sublease") &&
      <ManageSublease
        isClone={false}
        subleaseId={null}
        onClose={() => setOrderDialog(prevState => ({ ...prevState, open: false, type: "" }))}
        onSuccess={() => {
          setOrderDialog(({ open: false, products: [], type: "" }))
          setSelectedRecords([])
          fetchProductInventory()
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: `${sidebarResource.sublease} has been created successfully`,
          });
        }}
        refrenceType="rentalJob"
        refrenceId={rentalManagementData._id}
        refrenceData={{ ...rentalManagementData, material: [...showOrderDialog.products] }}
      />
    }
  </Fragment >
  );
}
export default SerializedAsset;