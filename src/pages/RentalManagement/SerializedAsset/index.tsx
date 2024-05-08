import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import Box from '@material-ui/core/Box/Box';
import Grid from '@material-ui/core/Grid/Grid';
import { Delete, ExpandMore } from '@material-ui/icons';
import LibraryBooksIcon from '@material-ui/icons/LibraryBooks';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ReceiptIcon from '@material-ui/icons/Receipt';
import RepeatIcon from '@material-ui/icons/Repeat';
import WarningIcon from '@material-ui/icons/Warning';
import { startCase, uniqBy } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { flattenArray } from 'src/constants/columns';
import { ownerAndColaborator, rentalManagementMessage } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { fetch_rental_product_fields } from '../../../components/RentalManagment/helper';
import { ASSET_STATUS, INVENTORY_OWNER_TYPE, MATERIAL_TYPE, TRANSFER_ASSET_STATUS, rentalManagement, sidebarResource, treeToFlatArray } from '../../../constants/helpers';
import { findOne, objectStore } from '../../../constants/indexdbhelper';
import ManageBulkAssetCreation from '../../BulkAssetCreation/ManageBulkAssetCreation';
import ManagePurchaseOrder from '../../PurchaseOrder/ManagePurchaseOrder';
import ManageSublease from '../../Sublease/ManageSublease';
import { removeAssetsInRental } from '../rentalOfflineHelper';
import AddNonSerializeAssets from './AddNonSerializeAssets';
import AddSerializedAsset from './AddSerializedAsset';
import AssignSerialNumbersDialog from 'src/components/AssignRolesDialog/AssignSerialNumbersDialog';

const SerializedAsset = ({ rentalManagementData, setNextStep, setNextStepToolTip, stepFullScreen, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = 'rental_management_serialized_asset';

  const [deleting, setDeleting] = useState(false);
  const [isAdding, setAdding] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false });
  const [addNonSerializedAssetDialog, setAddNonSerializedAssetDialog] = useState(false);
  const [assetAssignedProduct, setAssetAssignedProduct] = useState([]);
  const [nonSerializedAssetProduct, setNonSerializedAssetProduct] = useState([]);
  const [deleteData, setDeleteData] = useState([]);
  const [columns, setColumns] = useState(null);
  const [showOrderDialog, setOrderDialog] = useState({ open: false, products: [], type: '' });
  const [anchorLinkActionEl, setAnchorLinkActionEl] = useState(null);
  const [purchaseOrderCount, setPurchaseOrderCount] = useState(0);
  const [subleaseCount, setSubleaseCount] = useState(0);
  const [transferAssetCount, setTransferAssetCount] = useState(0);
  const [bulkAssetCreationCount, setbulkAssetCreationCount] = useState(0);
  const [assignSerialNumbersDialog, setAssignSerialNumbersDialog] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false);
  const [productSerialNumbers, setProductSerialNumbers] = useState([]);

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;
  const { generateColumns } = useColumns();

  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchFields();
  }, []);

  const OpenInNewWindow = (url) => {
    window.open(`${url}?referenceType=${rentalManagementData?.rentalJobName}&referenceId=${rentalManagementData?._id}`, '_blank');
  };

  const fetchFields = async () => {
    setNextStep(false)
    var data = await fetch_rental_product_fields(rentalManagementData.currency, isOffline);
    data?.forEach((e) => {
      e.isColumnEditable = false;
    });
    const newColumns = generateColumns(renderedFrom, data, null, false, rentalManagementData?.currency);
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        disableFilters: true,
        width: 200,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) =>
          row.original['type'] ? (
            <p>
              {row.original?.type === 'asset' && row.original?.isNonSerializeAsset ? 'Inventory' : `${startCase(row.original?.type)} `}
              {row.original['type'] === 'product'
                ? row.original?.productDetail?.serializedProduct
                  ? '(Serialized)'
                  : '(Non-Serialized)'
                : row.original?.type === 'package'
                  ? row.original?.packageDetail.packageType === 'Product'
                    ? '(Product)'
                    : '(Service)'
                  : row.original.type === 'service'
                    ? row?.original?.serviceDetail?.serviceType && `(${row?.original?.serviceDetail?.serviceType})`
                    : ''}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'detail',
        Header: 'Details',
        width: 300,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="d-flex gap-2 align-items-center">
            <p className="text-truncate" title={row.original.detail}>
              {row.original.detail}
            </p>

            {((row.original?.type === 'asset' && row.original?.isNonSerializeAsset) || row?.original?.type === 'serialNumber') ? null : (
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === 'service') {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'product') {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'asset') {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            )}

            {!isOffline && row.original.isPurchaseOrder && (
              <HtmlTooltip title={`${routes.purchaseOrder.title}`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    OpenInNewWindow(routes.purchaseOrder.path);
                  }}
                >
                  <LibraryBooksIcon fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
            )}

            {row.original.isBulkAssetCreation && (
              <HtmlTooltip title={`${routes.bulkAssetCreation.title}`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    OpenInNewWindow(routes.bulkAssetCreation.path);
                  }}
                >
                  <LibraryBooksIcon fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
            )}
            {row.original.isSublease && (
              <HtmlTooltip title={`${routes.sublease.title}`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    OpenInNewWindow(routes.sublease.path);
                  }}
                >
                  <ReceiptIcon fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
            )}
            {row.original?.isOfflineError && (
              <HtmlTooltip
                title={`The assets listed below were added in Offline but do not exist in the Assets List.
              ${row.original?.offlineErrorAsset}
              Please re-add the left over Quanity`}
              >
                <WarningIcon fontSize="small" color={'error'} />
              </HtmlTooltip>
            )}
            {row.original?.type === 'asset' && (
              <span className="d-flex align-items-center gap-2">
                {allowedToEdit && row?.original?.canRemove && (
                  <HtmlTooltip title={`Remove`}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setShowConfirmBox(true);
                        let isTransferAsset = false;
                        if (
                          row.original?.transferData &&
                          [TRANSFER_ASSET_STATUS.new, TRANSFER_ASSET_STATUS.inProgress]?.includes(row.original?.transferData?.status)
                        ) {
                          isTransferAsset = true;
                        }
                        setDeleteData([
                          {
                            _id: row.original.uniqueId,
                            assetId: row.original.inventory,
                            assetNumber: row.original.detail,
                            isNonSerializeAsset: row.original.isNonSerializeAsset,
                            isTransferAsset: isTransferAsset,
                            isProductSerialNumbers: false
                          }
                        ]);
                      }}
                    >
                      <Delete fontSize="small" color={'error'} />
                    </IconButton>
                  </HtmlTooltip>
                )}
                {row.original.isTransferAsset && (
                  <HtmlTooltip
                    title={`Transfer from plant ${row?.original?.transferData?.transferFromPlant?.optionLabel} to  ${row?.original?.transferData?.transfertoPlant?.optionLabel}`}
                  >
                    <IconButton
                      size="small"
                      onClick={() => {
                        window.open(`${routes.transferAssetDetail.path}/${row?.original?.transferData?._id}`, '_blank');
                      }}
                    >
                      <RepeatIcon fontSize="small" color={'primary'} />
                    </IconButton>
                  </HtmlTooltip>
                )}
              </span>
            )}
            {row?.original?.type === 'serialNumber' && (
              allowedToEdit && row?.original?.canRemove && (
                <HtmlTooltip title={`Remove`}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setShowConfirmBox(true);
                      setDeleteData([
                        {
                          _id: row.original.uniqueId,
                          assetId: row.original.serialNumber,
                          isNonSerializeAsset: false,
                          isProductSerialNumbers: true
                        }
                      ]);
                    }}
                  >
                    <Delete fontSize="small" color={'error'} />
                  </IconButton>
                </HtmlTooltip>
              )
            )}
          </div>
        ),
        setCellClassNames: (row) => {
          if (row?.isTransferAsset || (row?.type === 'asset' && row?.warehouse && row?.warehouse !== rentalManagementData?.warehouse?.optionValue))
            return 'isTransferAsset';
          if (row?.isSubleaseAsset) return 'isSublease';
        }
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'assets',
        Header: 'Qty Assigned',
        disableFilters: false,
        Cell: ({ row }) => getAssetAssignedValues(row)
      }
    ];
    coloum = [...coloum, ...newColumns];
    setColumns(coloum);
    fetchData();
  };

  const checkProductInside = (item, material) => {
    if (item?.type === 'product') {
      return true;
    }
    const child = material?.filter((e) => e.parentId === item?._id);
    if (child?.some((e) => e?.type === 'product')) {
      return true;
    }
    if (child?.length) {
      for (var ele in child) {
        return checkProductInside(child[ele], material);
      }
    } else {
      return false;
    }
  };

  const fetchData = async () => {
    setNextStep(false);
    setNextStepToolTip(null);
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    try {
      var data: any = [];
      var transferAssets: any = [];
      var purchaseOrderProduct: any = [];
      var bulkAssetCreationProduct: any = [];
      var subleaseProduct: any = [];
      var offlineAssetErrorLog: any = [];

      if (isOffline) {
        data = await findOne(objectStore.rentalManagement, rentalManagementData._id);
        data.inventory = data.productInventory;
        data.nonSerializeAsset = data?.nonSerializeAsset;

        const offlineDataSync = await findOne(objectStore.offlineDataSync, rentalManagementData._id);
        if (offlineDataSync && offlineDataSync?.data) {
          offlineDataSync?.data?.forEach((element: any) => {
            if (element?.serializedProduct) {
              data.inventory.push(element);
            } else {
              data.nonSerializeAsset.push(element);
            }
          });
        }
      } else {
        const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
        data = response?.data?.data;
        data.inventory = data.inventory?.filter((e) => !e.isReplaced);
        offlineAssetErrorLog = data?.offlineAssetErrorLog;

        setProductSerialNumbers(data.productSerialNumbers)

        const result = await axiosInstance().get(`${rentalManagement.api}/rental-related-transaction/${rentalManagementData._id}`);
        const transactionData = result?.data?.data;

        if (permissions?.purchaseOrder?.isRead) {
          purchaseOrderProduct = transactionData?.purchaseOrder;
          setPurchaseOrderCount(purchaseOrderProduct?.length);
        }
        if (permissions?.bulkAssetCreation?.isRead) {
          bulkAssetCreationProduct = transactionData?.bulkAssetCreation;
          setbulkAssetCreationCount(bulkAssetCreationProduct?.length);
        }
        if (permissions?.sublease?.isRead) {
          subleaseProduct = transactionData?.sublease;
          setSubleaseCount(subleaseProduct?.length);
        }
        if (permissions?.transferAsset?.isRead) {
          transferAssets = transactionData?.transferAsset;
          setTransferAssetCount(transferAssets?.length);
        }
      }

      const material = data.material;
      let rows = data.material.filter((e) => e.parentId === null)?.filter((ele) => checkProductInside(ele, material) === true);

      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.detail = `${parent.type === 'service'
          ? parent?.serviceDetail?.serviceName
          : parent.type === 'product'
            ? parent?.productDetail?.productName
            : parent?.packageDetail?.packageName
          }`;
        parent.description =
          parent.type === 'service'
            ? parent?.serviceDetail?.serviceDescription || ''
            : parent.type === 'product'
              ? parent?.productDetail?.productDescription || ''
              : parent.type === 'package'
                ? parent?.packageDetail?.packageDescription || ''
                : '';
        parent.serializedProduct = parent.type === 'product' ? parent?.productDetail?.serializedProduct : false;
        parent.assetQty = parent.qty;
        parent.assetAssignedQty = parent.serializedProduct
          ? (data.inventory?.filter((e) => e._id === parent._id).length + data?.productSerialNumbers?.filter(e => e._id === parent._id)?.length)
          : data.nonSerializeAsset?.filter((e) => e._id === parent._id).length;
        parent.realAssetQty = parent.assetQty;
        parent.realAssetAssignedQty = parent.assetAssignedQty;
        // parent.isValid = parent.serializedProduct ? (parent.assetAssignedQty === parent.assetQty ? true : false) : true;
        parent.isSublease = subleaseProduct?.some((e) => e.materialId === parent.materialId);
        parent.isPurchaseOrder = purchaseOrderProduct?.some((e) => e.productId === parent.materialId);
        parent.isBulkAssetCreation = bulkAssetCreationProduct?.some((e) => e.productId === parent.materialId);
        parent.isOfflineError = offlineAssetErrorLog?.some((e) => e._id === parent._id);
        if (parent.isOfflineError) {
          parent.offlineErrorAsset = offlineAssetErrorLog?.filter((e) => e._id === parent._id).map((e) => e.assetNumber);
        }
        parent.subRows = generateNestedData(
          data.material,
          data.inventory,
          data.productSerialNumbers,
          data?.nonSerializeAsset,
          parent,
          transferAssets,
          subleaseProduct,
          purchaseOrderProduct,
          bulkAssetCreationProduct,
          offlineAssetErrorLog
        );
        parent.assetQty =
          parent.subRows.filter((d) => !['asset', 'serialNumber']?.includes(d.type)).length === 0
            ? parent.assetQty
            : parent.subRows.filter((d) => !['asset', 'serialNumber']?.includes(d.type)).reduce((sum, row) => row.assetQty || 0 + sum, 0) +
            (parent.type === 'product' ? parent.assetQty : 0);
        parent.assetAssignedQty =
          parent.subRows.filter((d) => !['asset', 'serialNumber']?.includes(d.type)).length === 0
            ? parent.assetAssignedQty
            : parent.subRows.filter((d) => !['asset', 'serialNumber']?.includes(d.type)).reduce((sum, row) => row.assetAssignedQty || 0 + sum, 0) +
            (parent.type === 'product' ? parent?.subRows.filter((d) => ['asset', 'serialNumber']?.includes(d.type))?.length : 0);
        parent.isValid =
          parent.serializedProduct && !parent.subRows?.find((e) => e.type === MATERIAL_TYPE.product && !e.serializedProduct)
            ? parent.assetAssignedQty === parent.assetQty
              ? true
              : false
            : parent.subRows.length !== 0
              ? parent.assetAssignedQty ===
              parent.subRows.filter((d) => !['asset', 'serialNumber']?.includes(d.type) && d.serializedProduct).reduce((sum, row) => row.assetQty || 0 + sum, 0) ||
              parent.subRows.every((d) => d.isValid)
              : true;

        if (parent.subRows.length && parent.isValid) {
          if (parent.subRows.every((d) => d.isValid)) {
            parent.isValid = true;
          } else {
            parent.isValid = false;
          }
        }

      });

      if (rows.filter((_rows) => _rows.isValid === false).length > 0 && !user?.user?.brandPolicy?.rentalStopAssetNextStepValidation) {
        setNextStep(false);
        setNextStepToolTip(rentalManagementMessage.assignAssets);
      } else {
        setNextStep(true);
        setNextStepToolTip(null);
      }


      dispatch({ type: 'initialize', data: rows, count: rows?.length });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const generateNestedData = (
    material,
    inventory,
    productSerialNumbers,
    nonSerializeAsset,
    parent,
    transferAssets,
    subleaseProduct,
    purchaseOrderProduct,
    bulkAssetCreationProduct,
    offlineAssetErrorLog
  ) => {
    const subRows: any = [];
    const inventory_result = inventory?.filter((e) => e._id === parent._id);
    inventory_result?.forEach((_inventory, k) => {
      const transferFilter = transferAssets.filter((e) => e.assetId === _inventory.inventory);
      var isTransferAsset = false;
      var transferData = {};
      if (transferFilter.length && _inventory.inventoryDetail?.manualStatus === ASSET_STATUS.reserved) {
        isTransferAsset = true;
        transferData = transferFilter[0];
      }
      var canRemove = false;
      if (user?.user?.brandPolicy?.rentalPlanning || user?.user?.brandPolicy?.rentalAllStatusAssetsAdd) {
        if (_inventory?.status === ASSET_STATUS.reserved) {
          canRemove = true;
        }
      } else {
        if (
          [ASSET_STATUS.needRepair, ASSET_STATUS.needRecert, ASSET_STATUS.scrap, ASSET_STATUS.lost, ASSET_STATUS.reserved].includes(_inventory?.inventoryDetail?.status) &&
          (!_inventory?.status || _inventory?.status === ASSET_STATUS.reserved)
          && _inventory?.inventoryDetail?.currentOwnerType === INVENTORY_OWNER_TYPE.brand
        ) {
          canRemove = true;
        }
      }

      subRows.push({
        ..._inventory,
        index: `${parent.index}.${subRows?.length + 1}`,
        detail: _inventory?.assetNumber ? _inventory?.assetNumber : _inventory.inventoryDetail?.assetNumber,
        description: parent?.description,
        type: 'asset',
        isNonSerializeAsset: false,
        status: _inventory.inventoryDetail?.status,
        rentalAssetStatus: _inventory?.status,
        manualStatus: _inventory.inventoryDetail?.manualStatus,
        warehouse: _inventory.inventoryDetail?.warehouse,
        _id: _inventory.inventory,
        uniqueId: _inventory._id,
        isValid: _inventory.inventoryDetail?.manualStatus === ASSET_STATUS.reserved ? false : true,
        isTransferAsset: isTransferAsset,
        transferData: transferData,
        isSubleaseAsset: _inventory.inventoryDetail?.subleaseAsset,
        canRemove: canRemove
      });
    });

    const nonSerializeAsset_result = nonSerializeAsset?.filter((e) => e._id === parent._id);
    nonSerializeAsset_result?.forEach((_inventory, k) => {
      subRows.push({
        _id: _inventory.id,
        uniqueId: _inventory.id,
        inventory: _inventory.id,
        index: `${parent.index}.${subRows?.length + 1}`,
        detail: _inventory?.assetNumber,
        description: parent?.description,
        type: 'asset',
        isNonSerializeAsset: true,
        status: _inventory?.status,
        warehouse: rentalManagementData?.warehouse?.optionValue,
        isValid: true,
        canRemove: true
      });
    });

    const productSerialNumbers_result = productSerialNumbers?.filter(e => e?._id === parent?._id)
    productSerialNumbers_result?.forEach((e) => {
      subRows.push({
        _id: e?.productSerialNumberDetail?._id,
        serialNumber: e.serialNumber,
        uniqueId: e._id,
        index: `${parent.index}.${subRows?.length + 1}`,
        detail: e?.productSerialNumberDetail?.serialNumber,
        description: parent?.description,
        type: 'serialNumber',
        status: e?.status,
        warehouse: rentalManagementData?.warehouse?.optionValue,
        isValid: true,
        canRemove: true
      });
    });

    const childProduct: any = material.filter((e) => e.parentId === parent._id);

    var assetQtySUM = 0;
    var assetAssignedQtySUM = 0;
    childProduct.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (subRows?.length + 1);
      _subRow.detail =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceName
          : _subRow.type === 'product'
            ? _subRow?.productDetail?.productName
            : _subRow?.packageDetail?.packageName;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === 'package'
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.serializedProduct = _subRow.type === 'product' ? _subRow?.productDetail?.serializedProduct : false;
      // _subRow.assetQty = _subRow.type === 'product' || _subRow.type === 'package' ? _subRow.qty * parent.assetQty : 0;
      _subRow.assetQty =
        _subRow.type === 'product' || _subRow.type === 'package'
          ? parent.type === 'product' || parent.type === 'package'
            ? _subRow.qty * parent.assetQty
            : _subRow.qty * parent.qty
          : 0;
      _subRow.assetAssignedQty = _subRow.serializedProduct
        ? inventory?.filter((e) => e._id === _subRow._id).length + productSerialNumbers?.filter(e => e?._id === _subRow._id)?.length
        : nonSerializeAsset?.filter((e) => e._id === _subRow._id).length;
      _subRow.realAssetQty =
        _subRow.type === 'product' || _subRow.type === 'package' || _subRow.type === 'service' ? _subRow.qty * parent.realAssetQty : 0;
      _subRow.realAssetAssignedQty = _subRow.assetAssignedQty;
      // _subRow.isValid = _subRow.serializedProduct ? (_subRow.assetAssignedQty === _subRow.assetQty ? true : false) : true;
      _subRow.isSublease = subleaseProduct?.some((e) => e.materialId === _subRow.materialId);
      _subRow.isPurchaseOrder = purchaseOrderProduct?.some((e) => e.productId === _subRow.materialId);
      _subRow.isBulkAssetCreation = bulkAssetCreationProduct?.some((e) => e.productId === _subRow.materialId);
      _subRow.isOfflineError = offlineAssetErrorLog?.some((e) => e._id === _subRow._id);
      if (_subRow.isOfflineError) {
        _subRow.offlineErrorAsset = offlineAssetErrorLog?.filter((e) => e._id === _subRow._id).map((e) => e.assetNumber);
      }

      let tempSubRows = generateNestedData(
        material,
        inventory,
        productSerialNumbers,
        nonSerializeAsset,
        _subRow,
        transferAssets,
        subleaseProduct,
        purchaseOrderProduct,
        bulkAssetCreationProduct,
        offlineAssetErrorLog
      );

      _subRow.subRows = tempSubRows;
      _subRow.assetQty =
        tempSubRows.filter((d) => !['asset', 'serialNumber']?.includes(d.type)).length === 0
          ? _subRow.assetQty
          : tempSubRows.filter((d) => !['asset', 'serialNumber']?.includes(d.type)).reduce((sum, row) => row.assetQty + sum, 0) +
          (_subRow.type === 'product' ? _subRow.assetQty : 0);
      _subRow.isValid =
        _subRow.serializedProduct && !_subRow.subRows?.find((e) => e.type === MATERIAL_TYPE.product && !e.serializedProduct)
          ? _subRow.assetAssignedQty === _subRow.assetQty
            ? true
            : false
          : tempSubRows?.filter((e) => ['asset', 'serialNumber']?.includes(e.type))?.length === tempSubRows?.length
            ? true
            : _subRow.assetAssignedQty ===
              tempSubRows.filter((d) => !['asset', 'serialNumber']?.includes(d.type) && d.serializedProduct).reduce((sum, row) => row.assetQty + sum, 0)
              ? true
              : _subRow.serializedProduct && _subRow.subRows?.every((e) => (e.type === MATERIAL_TYPE.product && !e.serializedProduct) || e.type === 'asset') ? true : false;

      if (_subRow.subRows.length && _subRow.isValid) {
        if (_subRow.subRows.every((d) => d.isValid)) {
          _subRow.isValid = true;
        } else {
          _subRow.isValid = false;
        }
      }
      subRows.push(_subRow);
      assetAssignedQtySUM += _subRow.serializedProduct ? _subRow.assetAssignedQty : 0;
    });
    parent.assetAssignedQty += assetAssignedQtySUM;
    parent.isValid = parent.serializedProduct || parent.type === 'package' ? (parent.assetAssignedQty === parent.assetQty ? true : false) : true;
    return subRows;
  };

  const getAssetAssignedValues = (row) => {
    if (row?.original?.type === 'asset' || row?.original?.type === 'serialNumber' || row?.original?.assetQty === 0) {
      return <div>N/A</div>;
    }
    return (
      <p>
        {row?.original?.assetAssignedQty} / {row?.original?.assetQty}
      </p>
    );
  };

  const handleAddSerializedAsset = (assets, withTransfer = false) => {
    var data = [];
    var flatArray = treeToFlatArray(selectedRecords, 'subRows').filter((f) => f.type === 'product');
    flatArray = uniqBy(flatArray, '_id');
    flatArray?.forEach((e: any) => {
      if (e.type === 'product') {
        let qty = e.realAssetQty - e.realAssetAssignedQty;
        while (qty) {
          const result = assets.filter((f) => f.productId === e.materialId && !f.isCounted);
          if (result.length) {
            let obj: any = {};
            obj._id = e._id;
            obj.inventory = result[0].id;
            obj.product = e.materialId;
            data.push(obj);
            result[0].isCounted = true;
          }
          qty--;
        }
      }
    });

    if (data.length) {
      setAdding(true);
      axiosInstance()
        .post(`${rentalManagement.api}/${rentalManagementData._id}/inventory`, { products: data, withTransfer })
        .then(({ data }) => {
          setAddSerializedAssetDialog({ open: false });
          fetchData();
          setAssetAssignedProduct([]);
          setAdding(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setAdding(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleRemoveInventory = async () => {
    if (deleteData.length >= 1) {
      if (isOffline) {
        setDeleting(true);
        await removeAssetsInRental(rentalManagementData._id, deleteData);
        setDeleting(false);
        setDeleteData(null);
        setShowConfirmBox(false);
        fetchData();
      } else {
        deleteData?.forEach((e) => {
          delete e.assetNumber;
        });
        setDeleting(true);
        axiosInstance()
          .put(`${rentalManagement.api}/${rentalManagementData._id}/inventory/remove`, { products: deleteData })
          .then(() => {
            setDeleting(false);
            fetchData();
            setDeleteData(null);
            setShowConfirmBox(false);
          })
          .catch((error) => {
            setDeleting(false);
            toastConfig.setToastConfig(error);
            setDeleteData(null);
          });
      }
    }
  };

  useEffect(() => {
    let flatArray = treeToFlatArray(selectedRecords, 'subRows').filter(
      (f) => f.type === 'product' && f.serializedProduct && f.realAssetQty > f.realAssetAssignedQty
    );
    let newFlatArray = treeToFlatArray(selectedRecords, 'subRows').filter((d) => d.type === 'product');
    newFlatArray = uniqBy(newFlatArray, '_id');

    flatArray = uniqBy(flatArray, '_id');

    const products = newFlatArray.map((m) => {
      return {
        _id: m.materialId,
        unit: m.unit,
        serialized: m.serializedProduct,
        assetsCount: m.realAssetQty - m.realAssetAssignedQty
      };
    });

    const uniqProduct = [];
    products.forEach((element: any) => {
      const foundProduct = uniqProduct.filter((e) => e._id === element._id);
      if (foundProduct.length) {
        foundProduct[0].assetsCount += element.assetsCount;
      } else {
        uniqProduct.push(element);
      }
    });

    setOrderDialog((prevState) => {
      return {
        ...prevState,
        products: uniqProduct?.filter((e) => e.assetsCount)
      };
    });

    const assetProduct = [];
    flatArray.forEach((element) => {
      if (element.type === 'product' && element.realAssetQty > element.realAssetAssignedQty) {
        const foundProduct = assetProduct.filter((e) => e.materialId === element.materialId);
        if (foundProduct.length) {
          foundProduct[0].qty += element.realAssetQty - element.realAssetAssignedQty;
        } else {
          assetProduct.push({
            ...element,
            _id: element._id,
            id: element.materialId,
            productName: element.productDetail?.productName,
            qty: element.realAssetQty - element.realAssetAssignedQty
          });
        }
      }
    });
    setAssetAssignedProduct([...assetProduct]);


    const nonSerializeAssetProduct = [];
    let flatArrayNonSerializeAsset = treeToFlatArray(selectedRecords, 'subRows').filter(
      (f) => f.type === 'product' && !f.serializedProduct && f.realAssetQty > f.realAssetAssignedQty
    );
    flatArrayNonSerializeAsset.forEach((element) => {
      if (element.type === 'product' && element.realAssetQty > element.realAssetAssignedQty) {
        nonSerializeAssetProduct.push({
          ...element,
          _id: element._id,
          id: element.materialId,
          productName: element.productDetail?.productName,
          qty: element.realAssetQty - element.realAssetAssignedQty
        });
      }
    });
    setNonSerializedAssetProduct([...nonSerializeAssetProduct]);
  }, [selectedRecords]);

  const disableAssignSerializedAssets = () => {
    if (selectedRecords.length === 0) return true;
    const flatArray = treeToFlatArray(selectedRecords, 'subRows').filter(
      (f) => f.type === 'product' && f.serializedProduct && f.realAssetQty > f.realAssetAssignedQty
    );
    return flatArray.length === 0;
  };

  const handleAssignSerialNumbers = (rows) => {
    const data = rows?.map(e => ({ _id: e?._id, materialId: e?.materialId, serialNumber: e?.serialNumber }))
    setIsAssigning(true)
    axiosInstance()
      .post(`${rentalManagement.api}/${rentalManagementData._id}/add-serial-numbers`, data)
      .then(() => {
        setIsAssigning(false)
        setAssignSerialNumbersDialog(false)
        fetchData();
      })
      .catch((error) => {
        setIsAssigning(false)
        toastConfig.setToastConfig(error);
      });
  }

  const openLinkActions = (event) => {
    setAnchorLinkActionEl(event.currentTarget);
  };

  const closeLinkActions = () => {
    setAnchorLinkActionEl(null);
  };

  const rightSideContents = () => {
    return (
      <>
        <HtmlTooltip title={!allowedToEdit ? ownerAndColaborator : ``}>
          <span>
            <Button
              variant="contained"
              color="primary"
              type="button"
              size="small"
              disabled={disableAssignSerializedAssets()}
              onClick={() => {
                if (isOffline) {
                  setAddNonSerializedAssetDialog(true);
                } else {
                  setAddSerializedAssetDialog({ open: true });
                }
              }}
            >
              {`Assign ${routes.serializedAsset.title}`}
            </Button>
          </span>
        </HtmlTooltip>
        {(purchaseOrderCount > 0 || subleaseCount > 0 || transferAssetCount > 0 || bulkAssetCreationCount > 0) && (
          <Button
            onClick={openLinkActions}
            variant="outlined"
            color="default"
            size="small"
            aria-controls="action-menu"
            className="normal-case"
            endIcon={<ExpandMore fontSize="inherit" />}
          >
            Order(s)
          </Button>
        )}
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        {permissions?.bulkAssetCreation?.isCreate && (
          <MenuItem
            disabled={showOrderDialog?.products?.filter((e) => e.serialized === true && e.assetsCount)?.length === 0}
            onClick={() => {
              setOrderDialog((prevState) => ({ ...prevState, open: true, type: 'bulkAssetCreation' }));
            }}
          >
            {`Create ${routes.bulkAssetCreation.title}`}
          </MenuItem>
        )}
        {permissions?.purchaseOrder?.isCreate && (
          <MenuItem
            disabled={showOrderDialog?.products?.filter((e) => e.serialized === false)?.length === 0}
            onClick={() => {
              setOrderDialog((prevState) => ({ ...prevState, open: true, type: 'purchaseOrder' }));
            }}
          >
            {`Create ${routes.purchaseOrder.title}`}
          </MenuItem>
        )}
        {permissions?.sublease?.isCreate && (
          <MenuItem
            disabled={showOrderDialog?.products?.filter((e) => e.serialized === true && e.assetsCount)?.length === 0}
            onClick={() => {
              setOrderDialog((prevState) => ({ ...prevState, open: true, type: 'sublease' }));
            }}
          >
            {`Create ${routes.sublease.title}`}
          </MenuItem>
        )}
        <MenuItem
          disabled={selectedRecords.length === 0 || nonSerializedAssetProduct?.length === 0}
          onClick={() => {
            setAddNonSerializedAssetDialog(true);
          }}
        >
          {`Assign Serial Number`}
        </MenuItem>
        {user?.user?.brandPolicy?.productInventorySerialNumberRequired && (
          <MenuItem
            disabled={selectedRecords.length === 0 || assetAssignedProduct?.length === 0}
            onClick={() => {
              setAssignSerialNumbersDialog(true)
            }}
          >
            {`Assign Serial Numbers`}
          </MenuItem>
        )}
        <MenuItem
          disabled={flattenArray(selectedRecords)?.filter((d) => ['asset', 'serialNumber']?.includes(d.type) && d.canRemove)?.length === 0}
          onClick={() => {
            const assets = flattenArray(selectedRecords)?.filter((d) => d.type === 'asset' && d.canRemove);
            const serialNumbers = flattenArray(selectedRecords)?.filter((d) => d.type === 'serialNumber' && d.canRemove);
            const dataTodelete = [];
            assets?.forEach((element) => {
              let isTransferAsset = false;
              if (element?.transferData && [TRANSFER_ASSET_STATUS.new, TRANSFER_ASSET_STATUS.inProgress]?.includes(element?.transferData?.status)) {
                isTransferAsset = true;
              }
              dataTodelete.push({
                _id: element.uniqueId,
                assetId: element.inventory,
                assetNumber: element?.detail,
                isNonSerializeAsset: element?.isNonSerializeAsset,
                isTransferAsset: isTransferAsset,
                isProductSerialNumbers: false
              });
            });
            serialNumbers?.forEach((element) => {
              dataTodelete.push({
                _id: element.uniqueId,
                assetId: element.serialNumber,
                isNonSerializeAsset: false,
                isProductSerialNumbers: true
              });
            });
            setDeleteData(dataTodelete);
            setShowConfirmBox(true);
          }}
        >
          {`Remove Asset/Serial Number`}
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={true}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
        rightSideContents={rightSideContents()}
        hasXpadding
      />
      <Menu
        anchorEl={anchorLinkActionEl}
        keepMounted
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        id="Order(s)-menu"
        open={Boolean(anchorLinkActionEl)}
        onClose={closeLinkActions}
      >
        {permissions?.purchaseOrder?.isRead && (
          <MenuItem
            disabled={purchaseOrderCount === 0}
            onClick={() => {
              OpenInNewWindow(routes.purchaseOrder.path);
            }}
          >
            {`Show ${routes.purchaseOrder.title}`}
          </MenuItem>
        )}
        {permissions?.bulkAssetCreation?.isRead && (
          <MenuItem
            disabled={bulkAssetCreationCount === 0}
            onClick={() => {
              OpenInNewWindow(routes.bulkAssetCreation.path);
            }}
          >
            {`Show ${routes.bulkAssetCreation.title}`}
          </MenuItem>
        )}

        {permissions?.sublease?.isRead && (
          <MenuItem
            disabled={subleaseCount === 0}
            onClick={() => {
              OpenInNewWindow(routes.sublease.path);
            }}
          >
            {`Show ${routes.sublease.title}`}
          </MenuItem>
        )}
        {permissions?.transferAsset?.isRead && (
          <MenuItem
            disabled={transferAssetCount === 0}
            onClick={() => {
              OpenInNewWindow(routes.transferAsset.path);
            }}
          >
            {`Show ${routes.transferAsset.title}`}
          </MenuItem>
        )}
      </Menu>
      {columns ? (
        <Box zIndex={5}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            setWholeRowsCellColor={(rowData) => {
              if (!rowData.isValid) return 'error';

              return '';
            }}
            refreshGrid={fetchData}
            hideSelection={!allowedToEdit}
            hideAction={!allowedToEdit}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            expander={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {addSerializedAssetDialog.open && (
        <AddSerializedAsset
          addSerializedAsset={handleAddSerializedAsset}
          handleSerializedAssetClose={() => {
            setAddSerializedAssetDialog({ open: false });
          }}
          referenceType={'Rental Job'}
          referenceData={{
            _id: rentalManagementData?._id,
            warehouse: rentalManagementData?.warehouse?.optionValue,
            customerAccount: rentalManagementData?.customerAccount?.optionValue,
            shippingAddress: rentalManagementData?.shippingAddress?.optionValue,
            wellName: rentalManagementData?.wellName?.optionValue,
            wellNumber: rentalManagementData?.wellNumber
              ? rentalManagementData?.wellNumber?.optionValue || rentalManagementData?.wellNumber?.map((e) => e?.optionValue)
              : null,
            fromDate: rentalManagementData?.estimateStartDate,
            toDate: rentalManagementData?.estimateEndDate,
            afeNumber: rentalManagementData?.afeNumber
          }}
          isAdding={isAdding}
          selectedProducts={assetAssignedProduct}
          filterByPlant={rentalManagementData?.warehouse}
          handleSuccess={() => {
            setAddSerializedAssetDialog({ open: false });
            fetchData();
            setAssetAssignedProduct([]);
            setAdding(false);
          }}
        />
      )}
      {addNonSerializedAssetDialog && (
        <AddNonSerializeAssets
          closeDialog={() => {
            setAddNonSerializedAssetDialog(false);
            fetchData();
          }}
          products={isOffline ? [...assetAssignedProduct, ...nonSerializedAssetProduct] : nonSerializedAssetProduct}
          warehouse={rentalManagementData?.warehouse?.optionValue}
          referenceId={rentalManagementData?._id}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to remove?`}
          onClose={() => {
            setShowConfirmBox(false);
            setDeleteData([]);
          }}
          okBtnLoading={deleting}
          onOk={handleRemoveInventory}
        />
      )}
      {showOrderDialog.open && showOrderDialog.type === 'bulkAssetCreation' && (
        <ManageBulkAssetCreation
          isClone={false}
          bulkAssetCreationId={null}
          onClose={() => setOrderDialog((prevState) => ({ ...prevState, open: false, type: '' }))}
          onSuccess={() => {
            setOrderDialog({ open: false, products: [], type: '' });
            fetchData();
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: `${sidebarResource.bulkAssetCreation} has been created successfully`
            });
          }}
          refrenceData={{
            products: [...showOrderDialog?.products?.filter((e) => e.serialized === true && e.assetsCount)],
            wellName: rentalManagementData?.wellName?.optionValue,
            wellNumber: rentalManagementData?.wellNumber
              ? rentalManagementData?.wellNumber?.optionValue || rentalManagementData?.wellNumber?.map((e) => e?.optionValue)
              : null,
            afeNumber: rentalManagementData?.afeNumber,
            warehouse: rentalManagementData?.warehouse?.optionValue
          }}
          referenceId={rentalManagementData._id}
        />
      )}
      {showOrderDialog.open && showOrderDialog.type === 'purchaseOrder' && (
        <ManagePurchaseOrder
          isClone={false}
          purchaseOrderId={null}
          onClose={() => setOrderDialog((prevState) => ({ ...prevState, open: false, type: '' }))}
          onSuccess={() => {
            setOrderDialog({ open: false, products: [], type: '' });
            fetchData();
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: `${sidebarResource.purchaseOrder} has been created successfully`
            });
          }}
          products={
            user?.user?.brandPolicy?.purchaseOrderShowSerializedProduct ?
              showOrderDialog?.products.map((e) => { return { product: e._id, unit: e.unit, qty: e.assetsCount } }) :
              showOrderDialog?.products?.filter((e) => e.serialized === false)?.map((e) => {
                return { product: e._id, unit: e.unit, qty: e.assetsCount };
              })}
          currency={rentalManagementData.currency}
          refrenceData={{
            wellName: rentalManagementData?.wellName?.optionValue,
            wellNumber: rentalManagementData?.wellNumber
              ? rentalManagementData?.wellNumber?.optionValue || rentalManagementData?.wellNumber?.map((e) => e?.optionValue)
              : null,
            afeNumber: rentalManagementData?.afeNumber
          }}
          rentalManagementId={rentalManagementData._id}
          warehouseId={rentalManagementData?.warehouse?.optionValue}
        />
      )}
      {showOrderDialog.open && showOrderDialog.type === 'sublease' && (
        <ManageSublease
          isClone={false}
          subleaseId={null}
          onClose={() => setOrderDialog((prevState) => ({ ...prevState, open: false, type: '' }))}
          onSuccess={() => {
            setOrderDialog({ open: false, products: [], type: '' });
            fetchData();
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: `${sidebarResource.sublease} has been created successfully`
            });
          }}
          referenceType="rentalJob"
          referenceId={rentalManagementData._id}
          referenceData={{ ...rentalManagementData, material: [...showOrderDialog?.products?.filter((e) => e.serialized === true && e.assetsCount)] }}
        />
      )}
      {assignSerialNumbersDialog && (
        <AssignSerialNumbersDialog
          selectedProducts={assetAssignedProduct}
          handleClose={() => {
            setAssignSerialNumbersDialog(false)
          }}
          handleSucess={(rows) => {
            handleAssignSerialNumbers(rows)
          }}
          isAssigning={isAssigning}
          warehouse={rentalManagementData?.warehouse?.optionValue}
          ids={productSerialNumbers?.map(e => e?.serialNumber)}
        />
      )}
    </Fragment>
  );
};
export default SerializedAsset;
