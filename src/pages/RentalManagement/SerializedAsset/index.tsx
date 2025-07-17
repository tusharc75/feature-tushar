import { IconButton, Menu, MenuItem } from '@mui/material';
import Box from '@mui/material/Box/Box';
import { Delete, ExpandMore, Info, LibraryBooks, Receipt, Repeat, Warning } from '@mui/icons-material';
import { isArray, isEmpty, startCase, uniqBy } from 'lodash';
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
import { checkProductInside, fetch_rental_product_fields } from '../../../components/RentalManagment/helper';
import {
  ASSET_STATUS,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_TYPE,
  INVENTORY_OWNER_TYPE,
  MATERIAL_TYPE,
  PACKAGE_TYPE,
  RENTAL_INTERNAL_ASSET_STATUS,
  TRANSFER_ASSET_STATUS,
  deliveryTicket,
  prepareDataForGrid,
  rentalManagement,
  serializedAsset,
  sidebarResource,
  treeToFlatArray
} from '../../../constants/helpers';
import { findOne, objectStore } from '../../../constants/indexdbhelper';
import ManageBulkAssetCreation from '../../BulkAssetCreation/ManageBulkAssetCreation';
import ManagePurchaseOrder from '../../PurchaseOrder/ManagePurchaseOrder';
import ManageSublease from '../../Sublease/ManageSublease';
import { removeAssetsInRental } from '../rentalOfflineHelper';
import AddNonSerializeAssets from './AddNonSerializeAssets';
import AddSerializedAsset from './AddSerializedAsset';
import AssignSerialNumbersDialog from 'src/components/AssignRolesDialog/AssignSerialNumbersDialog';
import AddNonSerializedInventory from './AddNonSerializedInventory';
import { FiExternalLink } from 'react-icons/fi';
import { useGetWalkmeInstance, useSetWalkmeData } from 'src/components/CustomIntro';
import { generateAssignStepAssignSerializedAsset, nextButtonStep } from 'src/pages/RentalManagement/walkmeSteps';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ScanButtons from 'src/components/ScanButtons';
import ShowAssignInventory from 'src/pages/RentalManagement/SerializedAsset/ShowAssignInventory';

const SerializedAsset = ({ rentalManagementData, setNextStep, setNextStepToolTip, stepFullScreen, allowedToEdit, rentalPolicyData, assetPolicyData }) => {
  const walkmeInstance = useGetWalkmeInstance();
  const { setWalkmeData } = useSetWalkmeData();
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = 'rental_management_serialized_asset';

  const [deleting, setDeleting] = useState(false);
  const [isAdding, setAdding] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false });
  const [addNonSerializedAssetDialog, setAddNonSerializedAssetDialog] = useState(false);
  const [addNonSerializedInventoryDialog, setAddNonSerializedInventoryDialog] = useState({ open: false, type: '' });
  const [assetAssignedProduct, setAssetAssignedProduct] = useState([]);
  const [nonSerializedProduct, setNonSerializedProduct] = useState([]);
  const [deleteData, setDeleteData] = useState([]);
  const [columns, setColumns] = useState(null);
  const [showOrderDialog, setOrderDialog] = useState({ open: false, products: [], type: '' });
  const [anchorLinkActionEl, setAnchorLinkActionEl] = useState(null);
  const [purchaseOrderCount, setPurchaseOrderCount] = useState(0);
  const [subleaseCount, setSubleaseCount] = useState(0);
  const [transferAssetCount, setTransferAssetCount] = useState(0);
  const [bulkAssetCreationCount, setbulkAssetCreationCount] = useState(0);
  const [assignSerialNumbersDialog, setAssignSerialNumbersDialog] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [productSerialNumbers, setProductSerialNumbers] = useState([]);
  const [nonSerializedInventory, setNonSerializedInventory] = useState([]);
  const [allLoadingTicketProducts, setAllLoadingTicketProducts] = useState([]);
  const [showAssignNonSerializedInventory, setShowAssignNonSerializedInventory] = useState({ open: false, data: null });
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords, dataRows } = state;
  const { generateColumns } = useColumns();

  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchFields();
  }, [assetPolicyData]);

  const OpenInNewWindow = (url) => {
    window.open(`${url}?referenceType=${rentalManagementData?.rentalJobName}&referenceId=${rentalManagementData?._id}`, '_blank');
  };

  const fetchFields = async () => {
    setNextStep(false);
    var data = await fetch_rental_product_fields(rentalManagementData.currency, isOffline);
    data = data?.filter((d) => d?.isRead);
    data?.forEach((e) => {
      e.isColumnEditable = false;
    });
    const newColumns = generateColumns(renderedFrom, data, null, false, rentalManagementData?.currency);

    let serializedAssetColumn = []
    const statusChangeFields: any = assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === ASSET_STATUS.reserved)?.fields || [];
    const assetFieldResponce = await axiosInstance().get(`/field?resource=${serializedAsset.resource}&view=true`)
    const filteredFields = assetFieldResponce?.data?.data?.filter((e) => (statusChangeFields.includes(e.fieldData.fieldName)
      || [`mtrAttached`]?.includes(e.fieldData.fieldName)) && !newColumns?.map((e) => e.accessor)?.includes(e.fieldData.fieldName));
    serializedAssetColumn = generateColumns(renderedFrom, filteredFields, null, false, rentalManagementData?.currency)

    let column: any = [
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
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) =>
          row.original['type'] ? (
            <p>
              {`${startCase(row.original?.type)} `}
              {row.original['type'] === 'product'
                ? row.original?.productDetail?.serializedProduct
                  ? '(Serialized)'
                  : '(Non-Serialized)'
                : row.original?.type === 'package'
                  ? row.original?.packageDetail?.packageType === PACKAGE_TYPE.product
                    ? '(Product)'
                    : row.original?.packageDetail?.packageType === PACKAGE_TYPE.service
                      ? '(Service)'
                      : ''
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
          <div className="flex items-center gap-2">
            <p className="text-truncate" title={row.original.detail}>
              {row.original.detail}
            </p>
            {row?.original?.type === 'serialNumber' ? null : (
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === 'service') {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'product') {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'asset') {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original._id}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            )}
            {!isOffline && row.original.isPurchaseOrder && (
              <HtmlTooltip title={`${resources?.purchaseOrder?.titleSingular}`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    OpenInNewWindow(routes.purchaseOrder.path);
                  }}
                >
                  <LibraryBooks fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
            )}
            {row.original.isBulkAssetCreation && (
              <HtmlTooltip title={`${resources?.bulkAssetCreation?.titleSingular}`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    OpenInNewWindow(routes.bulkAssetCreation.path);
                  }}
                >
                  <LibraryBooks fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
            )}
            {row.original.isSublease && (
              <HtmlTooltip title={`${resources?.sublease?.titleSingular}`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    OpenInNewWindow(routes.sublease.path);
                  }}
                >
                  <Receipt fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
            )}
            {row.original?.isOfflineError && (
              <HtmlTooltip
                title={`The assets listed below were added in Offline but do not exist in the Assets List.
              ${row.original?.offlineErrorAsset}
              Please re-add the left over Quanity`}
              >
                <Warning fontSize="small" color={'error'} />
              </HtmlTooltip>
            )}
            {row.original?.type === 'asset' && row.original.isTransferAsset && (
              <HtmlTooltip
                title={`Transfer from plant ${row?.original?.transferData?.transferFromPlant?.optionLabel} to  ${row?.original?.transferData?.transfertoPlant?.optionLabel}`}
              >
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.transferAssetDetail.path}/${row?.original?.transferData?._id}`, '_blank');
                  }}
                >
                  <Repeat fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
            )}
            {row?.original?.type === MATERIAL_TYPE.product && !row?.original?.serializedProduct && row?.original?.assetAssignedQty > 0 && (
              <HtmlTooltip title={`Show assigned inventory`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    setShowAssignNonSerializedInventory({ open: true, data: row?.original });
                  }}
                >
                  <Info fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
            )}
          </div>
        ),
        setCellClassNames: (row) => {
          if (row?.isTransferAsset || (row?.type === 'asset' && row?.warehouseId !== rentalManagementData?.warehouse?.optionValue)) {
            return 'isTransferAsset';
          }
          if (row?.isSubleaseAsset) {
            return 'isSublease';
          }
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
    column.push({
      accessor: 'warehouse',
      Header: resources?.warehouse?.titleSingular,
      cell: ({ row }) =>
        row?.original?.warehouse ? (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row?.original?.warehouse}</h5>
            {permissions?.warehouse?.isRead && (
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.warehouseDetail.path}/${row?.original?.warehouseId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            )}
          </div>
        ) : (
          <NoDataCell />
        )
    });
    if (user?.user?.brandPolicy?.storageLocation) {
      column.push({
        accessor: 'storageLocation',
        Header: resources?.storageLocation?.titleSingular,
        cell: ({ row }) =>
          row?.original?.storageLocation ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row?.original?.storageLocation}</h5>
              {permissions?.storageLocation?.isRead && (
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.storageLocationDetail.path}/${row?.original?.storageLocationId}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              )}
            </div>
          ) : (
            <NoDataCell />
          )
      });
    }
    column = [...column, ...newColumns, ...serializedAssetColumn, ActionsRenderer];
    setColumns(column);
    fetchData();
  };

  const isDeleteIconVisible = (row) => {
    if (row?.type === MATERIAL_TYPE.product && row?.parentId && row?.realAssetAssignedQty <= 0) {
      return true;
    }
    if (['asset', 'serialNumber']?.includes(row?.type)) {
      return row?.canRemove;
    }
    return false;
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row, table }) => {
      return (
        <>
          {allowedToEdit && isDeleteIconVisible(row?.original) && (
            <HtmlTooltip title={'Delete'}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Delete"
                  onClick={() => {
                    if (row?.original?.type === 'asset') {
                      let isTransferAsset = false;
                      if (
                        row?.original?.transferData &&
                        [TRANSFER_ASSET_STATUS.new, TRANSFER_ASSET_STATUS.inProgress]?.includes(row.original?.transferData?.status)
                      ) {
                        isTransferAsset = true;
                      }
                      setDeleteData([
                        {
                          _id: row.original.uniqueId,
                          assetId: row.original._id,
                          assetNumber: row.original.detail,
                          isTransferAsset: isTransferAsset,
                          isProductSerialNumbers: false,
                          type: 'asset'
                        }
                      ]);
                    } else if (row?.original?.type === 'serialNumber') {
                      setDeleteData([
                        {
                          _id: row.original.uniqueId,
                          assetId: row.original.serialNumber,
                          isProductSerialNumbers: true,
                          type: 'serialNumber'
                        }
                      ]);
                    } else if (row?.original?.type === MATERIAL_TYPE.product) {
                      setDeleteData([
                        {
                          _id: row.original._id,
                          type: MATERIAL_TYPE.product
                        }
                      ]);
                    }
                    setShowConfirmBox(true);
                  }}
                >
                  <Delete fontSize="small" color={'error'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          )}
        </>
      );
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
      var assets: any = [];
      const loadingTicketProducts: any = [];

      if (isOffline) {
        data = await findOne(objectStore.rentalManagement, rentalManagementData._id);
        assets = data.productInventory;

        const offlineDataSync = await findOne(objectStore.offlineDataSync, rentalManagementData._id);
        if (offlineDataSync && offlineDataSync?.data) {
          offlineDataSync?.data?.forEach((element: any) => {
            if (element?.serializedProduct) {
              assets.push(element);
            }
          });
        }
      } else {
        const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);

        const assetResponse = await axiosInstance().get(`${rentalManagement.api}/${rentalManagementData._id}/inventory`);

        data = response?.data?.data;
        assets = assetResponse?.data?.data?.filter((e) => !e.isReplaced);
        offlineAssetErrorLog = data?.offlineAssetErrorLog;

        setProductSerialNumbers(data.productSerialNumbers);
        setNonSerializedInventory(data.nonSerializedInventory);

        const result = await axiosInstance().get(`${rentalManagement.api}/rental-related-transaction/${rentalManagementData._id}`);
        const transactionData = result?.data?.data;

        const loadingTicketResult = await axiosInstance().get(
          `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}&referenceId=${rentalManagementData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
        );

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

        loadingTicketResult?.data?.data?.forEach((element) => {
          if (element.ticketType === DELIVERY_TICKET_TYPE.loading && element?.products?.length) {
            element?.products?.forEach((ele) => {
              loadingTicketProducts.push({
                ...ele,
                warehouse: element?.pickupFrom?.optionValue,
                storageLocation: element?.pickupFromStorageLocation?.optionValue
              });
            });
          }
        });
      }
      setAllLoadingTicketProducts(loadingTicketProducts);
      const material = data.material;

      let rows = data.material.filter((e) => e.parentId === null)?.filter((ele) => checkProductInside(ele, material) === true);

      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.detail = `${parent.type === MATERIAL_TYPE.service
          ? parent?.serviceDetail?.serviceName
          : parent.type === MATERIAL_TYPE.product
            ? parent?.productDetail?.productName
            : parent?.packageDetail?.packageName
          }`;
        parent.description =
          parent.type === MATERIAL_TYPE.service
            ? parent?.serviceDetail?.serviceDescription || ''
            : parent.type === MATERIAL_TYPE.product
              ? parent?.productDetail?.productDescription || ''
              : parent.type === MATERIAL_TYPE.package
                ? parent?.packageDetail?.packageDescription || ''
                : '';
        parent.serializedProduct = parent.type === MATERIAL_TYPE.product ? parent?.productDetail?.serializedProduct : false;
        parent.assetQty = parent.qty;
        parent.assetAssignedQty = parent.serializedProduct
          ? assets?.filter((e) => e._id === parent._id).length + data?.productSerialNumbers?.filter((e) => e._id === parent._id)?.length
          : data?.nonSerializedInventory?.filter((n) => n?._id === parent?._id)?.reduce((sum, row) => row?.qty + sum, 0);
        parent.realAssetQty = parent.assetQty;
        parent.realAssetAssignedQty =
          parent.type === MATERIAL_TYPE.product &&
            !parent.serializedProduct &&
            parent.assetAssignedQty === 0 &&
            parent?.status &&
            loadingTicketProducts?.filter((e) => e?.uniqueId === parent?._id && e?.product === parent?.materialId)?.length > 0
            ? loadingTicketProducts
              ?.filter((e) => e?.uniqueId === parent?._id && e?.product === parent?.materialId)
              ?.reduce((sum, row) => sum + (row?.qty || 0), 0)
            : parent.assetAssignedQty;
        parent.isSublease = subleaseProduct?.some((e) => e.materialId === parent.materialId);
        parent.isPurchaseOrder = purchaseOrderProduct?.some((e) => e.productId === parent.materialId);
        parent.isBulkAssetCreation = bulkAssetCreationProduct?.some((e) => e.productId === parent.materialId);
        parent.isOfflineError = offlineAssetErrorLog?.some((e) => e._id === parent._id);
        if (parent.isOfflineError) {
          parent.offlineErrorAsset = offlineAssetErrorLog?.filter((e) => e._id === parent._id).map((e) => e.assetNumber);
        }
        parent.canRemove = parent?.status ? true : false;

        parent.subRows = generateNestedData(
          data.material,
          assets,
          data.productSerialNumbers,
          data?.nonSerializedInventory,
          parent,
          transferAssets,
          subleaseProduct,
          purchaseOrderProduct,
          bulkAssetCreationProduct,
          offlineAssetErrorLog,
          loadingTicketProducts,
          data.inventory
        );

        parent.assetQty =
          parent.subRows.filter((d) => !['asset', 'serialNumber']?.includes(d.type)).length === 0
            ? parent.assetQty
            : parent.subRows.filter((d) => !['asset', 'serialNumber']?.includes(d.type)).reduce((sum, row) => (row.assetQty || 0) + sum, 0) +
            (parent.type === MATERIAL_TYPE.product ? parent.assetQty : 0);
        parent.assetAssignedQty =
          parent.subRows.filter((d) => !['asset', 'serialNumber']?.includes(d.type)).length === 0
            ? parent.assetAssignedQty
            : parent.subRows.filter((d) => !['asset', 'serialNumber']?.includes(d.type)).reduce((sum, row) => (row.assetAssignedQty || 0) + sum, 0) +
            (parent.type === MATERIAL_TYPE.product ? parent?.subRows.filter((d) => ['asset', 'serialNumber']?.includes(d.type))?.length : 0);
        parent.isValid =
          parent.serializedProduct && !parent.subRows?.find((e) => e.type === MATERIAL_TYPE.product && !e.serializedProduct)
            ? parent.assetAssignedQty === parent.assetQty
              ? true
              : false
            : parent.subRows.length !== 0
              ? parent.assetAssignedQty ===
              parent.subRows
                .filter((d) => !['asset', 'serialNumber']?.includes(d.type) && d.serializedProduct)
                .reduce((sum, row) => (row.assetQty || 0) + sum, 0) +
              (parent.serializedProduct ? parent.realAssetQty : 0) ||
              (parent.isValid && parent.subRows.every((d) => d.isValid))
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
      // Adding Step Data
      addWalkmeData(rows);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const addWalkmeData = (rows: any[]) => {
    if (rows?.length > 0) {
      const stepDataAdded = {
        assignSerializedAsset: false
      };
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!stepDataAdded.assignSerializedAsset && !disableAssignSerializedAssets([r])) {
          setWalkmeData([generateAssignStepAssignSerializedAsset(i, false, resources)]);
          stepDataAdded.assignSerializedAsset = true;
          if (walkmeInstance && walkmeInstance.type === 'flow') {
            const steps = generateAssignStepAssignSerializedAsset(i, false, resources).steps;
            steps.push({ ...nextButtonStep, waitForStepInsertion: true });
            walkmeInstance.instance.push(steps);
            walkmeInstance.handleNext();
          }
        } else if (!stepDataAdded.assignSerializedAsset) {
          stepDataAdded.assignSerializedAsset = true;
          if (walkmeInstance && walkmeInstance.type === 'flow') {
            const steps = [{ ...nextButtonStep, waitForStepInsertion: true }];
            walkmeInstance.instance.push(steps);
            walkmeInstance.handleNext();
          }
        } else {
          setWalkmeData([]);
        }
      }
    }
  };

  const generateNestedData = (
    material,
    assets,
    productSerialNumbers,
    nonSerializedInventory,
    parent,
    transferAssets,
    subleaseProduct,
    purchaseOrderProduct,
    bulkAssetCreationProduct,
    offlineAssetErrorLog,
    loadingTicketProducts,
    allAssets
  ) => {
    const subRows: any = [];
    const inventory_result = assets?.filter((e) => e._id === parent._id);
    inventory_result?.forEach((_inventory, k) => {
      const transferFilter = transferAssets.filter((e) => e.assetId === _inventory.inventory?._id);
      var isTransferAsset = false;
      var transferData = {};
      if (transferFilter.length && _inventory.inventory?.manualStatus === ASSET_STATUS.reserved) {
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
          [ASSET_STATUS.needRepair, ASSET_STATUS.needRecert, ASSET_STATUS.scrap, ASSET_STATUS.lost, ASSET_STATUS.reserved].includes(
            _inventory?.inventory?.status
          ) &&
          (!_inventory?.status || _inventory?.status === ASSET_STATUS.reserved) &&
          _inventory?.inventory?.currentOwnerType === INVENTORY_OWNER_TYPE.brand
        ) {
          canRemove = true;
        }
      }
      if (canRemove && allAssets?.find((e) => e.replaceAsset === _inventory.inventory?._id)) {
        canRemove = false;
      }
      subRows.push({
        ..._inventory,
        ...prepareDataForGrid(_inventory?.inventory),
        index: `${parent.index}.${subRows?.length + 1}`,
        detail: _inventory?.assetNumber ? _inventory?.assetNumber : _inventory.inventory?.assetNumber,
        description: parent?.description,
        type: 'asset',
        status: _inventory.inventory?.status,
        rentalAssetStatus: _inventory?.status,
        manualStatus: _inventory.inventory?.manualStatus,
        warehouse: _inventory.inventory?.warehouse?.optionLabel,
        warehouseId: _inventory.inventory?.warehouse?.optionValue,
        _id: _inventory.inventory?._id,
        uniqueId: _inventory._id,
        isValid: _inventory.inventory?.manualStatus === ASSET_STATUS.reserved ? false : true,
        isTransferAsset: isTransferAsset,
        transferData: transferData,
        isSubleaseAsset: _inventory.inventory?.subleaseAsset,
        canRemove: canRemove
      });
    });

    const productSerialNumbers_result = productSerialNumbers?.filter((e) => e?._id === parent?._id);
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
        warehouseId: e?.productSerialNumberDetail?.warehouse?.optionValue,
        warehouse: e?.productSerialNumberDetail?.warehouse?.optionLabel,
        storageLocationId: e?.productSerialNumberDetail?.storageLocation?.optionValue,
        storageLocation: e?.productSerialNumberDetail?.storageLocation?.optionLabel,
        isValid: true,
        canRemove: e?.status === RENTAL_INTERNAL_ASSET_STATUS.reserved ? true : false
      });
    });

    const childProduct: any = material.filter((e) => e.parentId === parent._id);

    var assetAssignedQtySUM = 0;
    childProduct.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (subRows?.length + 1);
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceName
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productName
            : _subRow?.packageDetail?.packageName;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.serializedProduct = _subRow.type === MATERIAL_TYPE.product ? _subRow?.productDetail?.serializedProduct : false;
      _subRow.assetQty =
        _subRow.type === MATERIAL_TYPE.product || _subRow.type === MATERIAL_TYPE.package
          ? parent.type === MATERIAL_TYPE.product || parent.type === MATERIAL_TYPE.package
            ? _subRow.qty * parent.assetQty
            : _subRow.qty * parent.qty
          : 0;
      _subRow.assetAssignedQty = _subRow.serializedProduct
        ? assets?.filter((e) => e._id === _subRow._id).length + productSerialNumbers?.filter((e) => e?._id === _subRow._id)?.length
        : nonSerializedInventory?.filter((n) => n?._id === _subRow?._id)?.reduce((sum, row) => row?.qty + sum, 0);
      _subRow.realAssetQty = [MATERIAL_TYPE.product, MATERIAL_TYPE.service, MATERIAL_TYPE.package]?.includes(_subRow.type)
        ? _subRow.qty * parent.realAssetQty
        : 0;
      _subRow.realAssetAssignedQty =
        _subRow.type === MATERIAL_TYPE.product &&
          !_subRow.serializedProduct &&
          _subRow.assetAssignedQty === 0 &&
          _subRow?.status &&
          loadingTicketProducts?.filter((e) => e?.uniqueId === _subRow?._id && e?.product === _subRow?.materialId)?.length > 0
          ? loadingTicketProducts
            ?.filter((e) => e?.uniqueId === _subRow?._id && e?.product === _subRow?.materialId)
            ?.reduce((sum, row) => sum + (row?.qty || 0), 0)
          : _subRow.assetAssignedQty;
      _subRow.isSublease = subleaseProduct?.some((e) => e.materialId === _subRow.materialId);
      _subRow.isPurchaseOrder = purchaseOrderProduct?.some((e) => e.productId === _subRow.materialId);
      _subRow.isBulkAssetCreation = bulkAssetCreationProduct?.some((e) => e.productId === _subRow.materialId);
      _subRow.isOfflineError = offlineAssetErrorLog?.some((e) => e._id === _subRow._id);
      _subRow.canRemove = _subRow?.status ? true : false;
      if (_subRow.isOfflineError) {
        _subRow.offlineErrorAsset = offlineAssetErrorLog?.filter((e) => e._id === _subRow._id).map((e) => e.assetNumber);
      }

      let tempSubRows = generateNestedData(
        material,
        assets,
        productSerialNumbers,
        nonSerializedInventory,
        _subRow,
        transferAssets,
        subleaseProduct,
        purchaseOrderProduct,
        bulkAssetCreationProduct,
        offlineAssetErrorLog,
        loadingTicketProducts,
        allAssets
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
              tempSubRows
                .filter((d) => !['asset', 'serialNumber']?.includes(d.type) && d.serializedProduct)
                .reduce((sum, row) => row.assetQty + sum, 0)
              ? true
              : _subRow.serializedProduct &&
                _subRow.subRows?.every((e) => (e.type === MATERIAL_TYPE.product && !e.serializedProduct) || e.type === 'asset')
                ? true
                : false;

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

    if (parent.serializedProduct) {
      parent.isValid = parent.assetAssignedQty === parent.assetQty ? true : false;
    } else if (parent.type === MATERIAL_TYPE.package) {
      if (subRows?.every((e) => e.type === MATERIAL_TYPE.package)) {
        parent.isValid = true;
      } else {
        parent.isValid = parent.assetAssignedQty === parent.assetQty ? true : false;
      }
    }
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

  const handleAddSerializedAsset = (assets, withTransfer = false, assetsData = null) => {
    var data = [];
    var flatArray = treeToFlatArray(selectedRecords, 'subRows').filter((f) => f.type === MATERIAL_TYPE.product);
    flatArray = uniqBy(flatArray, '_id');
    flatArray?.forEach((e: any) => {
      if (e.type === MATERIAL_TYPE.product) {
        let qty = e.realAssetQty - e.realAssetAssignedQty;
        while (qty) {
          const result = assets.filter((f) => f.productId === e.materialId && !f.isCounted);
          if (result.length) {
            let obj: any = {};
            obj._id = e._id;
            obj.inventory = result[0].id;
            obj.product = e.materialId;
            if (assetsData) {
              const matchedAsset = assetsData?.find((asset) => asset._id === obj.inventory);
              if (matchedAsset) {
                const { _id, ...assetData } = matchedAsset;
                obj.assetData = assetData;
              }
            }
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
    const inventory = deleteData?.filter((d) => ['asset', 'serialNumber']?.includes(d?.type));
    inventory?.forEach((e) => {
      delete e.type;
      if (!isOffline) {
        delete e.assetNumber;
      }
    });
    const products = deleteData?.filter((d) => d?.type === MATERIAL_TYPE.product)?.map((p) => p?._id);
    if (inventory.length >= 1) {
      if (isOffline) {
        setDeleting(true);
        await removeAssetsInRental(rentalManagementData._id, inventory);
        setDeleting(false);
        setDeleteData(null);
        setShowConfirmBox(false);
        fetchData();
      } else {
        setDeleting(true);
        axiosInstance()
          .put(`${rentalManagement.api}/${rentalManagementData._id}/inventory/remove`, { products: inventory })
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
    if (products?.length >= 1) {
      setDeleting(true);
      axiosInstance()
        .put(`${rentalManagement.api}/productpackage/${rentalManagementData?._id}/delete`, { ids: products })
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
  };

  const getParentWellNumber = (material, _id) => {
    const materialData = material?.find((e) => e._id === _id);
    const parent = material?.find((e) => e._id === materialData?.parentId);
    if (parent) {
      return getParentWellNumber(material, parent._id);
    } else {
      return isArray(materialData?.wellNumber) ? materialData?.wellNumber?.map((e) => e.optionValue) : materialData?.wellNumber?.optionValue;
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

    const statusChangeFields: any = assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === ASSET_STATUS.reserved)?.fields || [];
    const material = statusChangeFields?.length ? treeToFlatArray(dataRows, 'subRows') : [];

    const assetProduct = [];
    flatArray.forEach((element) => {
      if (element.type === MATERIAL_TYPE.product && element.realAssetQty > element.realAssetAssignedQty) {
        const foundProduct = assetProduct.filter((e) => e.materialId === element.materialId);
        if (foundProduct.length) {
          foundProduct[0].qty += element.realAssetQty - element.realAssetAssignedQty;
          const obj: any = {};
          if (statusChangeFields?.includes('wellNumber')) {
            obj.wellNumber = getParentWellNumber(material, element?._id);
            obj.qty = element.realAssetQty;
          }
          if (statusChangeFields?.includes('package')) {
            const parentPackage: any = material?.find((e) => e._id === element.parentId && e.type === MATERIAL_TYPE.package);
            if (parentPackage) {
              obj.package = parentPackage?.materialId;
            }
          }
          if (statusChangeFields?.includes('padName')) {
            obj.padName = rentalManagementData?.padName?.optionValue || '';
          }
          if (!isEmpty(obj)) {
            foundProduct[0].assetDefaultData.push(obj);
          }
        } else {
          const obj = {
            ...element,
            _id: element._id,
            id: element.materialId,
            productName: element.productDetail?.productName,
            qty: element.realAssetQty - element.realAssetAssignedQty
          };
          if (statusChangeFields?.length) {
            const assetDefaultData: any = {};
            if (statusChangeFields?.includes('wellNumber')) {
              assetDefaultData.wellNumber = getParentWellNumber(material, element?._id);
              assetDefaultData.qty = obj.qty;
            }
            if (statusChangeFields?.includes('package')) {
              const parentPackage: any = material?.find((e) => e._id === element.parentId && e.type === MATERIAL_TYPE.package);
              if (parentPackage) {
                assetDefaultData.package = parentPackage?.materialId;
              }
            }
            if (statusChangeFields?.includes('padName')) {
              assetDefaultData.padName = rentalManagementData?.padName?.optionValue || '';
            }
            obj.assetDefaultData = [assetDefaultData];
          }
          assetProduct.push(obj);
        }
      }
    });
    setAssetAssignedProduct([...assetProduct]);

    const nonSerializeAssetProduct = [];
    let flatArrayNonSerializeAsset = treeToFlatArray(selectedRecords, 'subRows').filter(
      (e) => e.type === MATERIAL_TYPE.product && !e.serializedProduct && e.realAssetQty > e.realAssetAssignedQty
    );
    flatArrayNonSerializeAsset.forEach((element) => {
      if (element.type === MATERIAL_TYPE.product && element.realAssetQty > element.realAssetAssignedQty) {
        nonSerializeAssetProduct.push({
          ...element,
          _id: element._id,
          id: element.materialId,
          productName: element.productDetail?.productName,
          qty: element.realAssetQty - element.realAssetAssignedQty
        });
      }
    });
    setNonSerializedProduct([...nonSerializeAssetProduct]);
  }, [selectedRecords]);

  const disableAssignSerializedAssets = (selectedRecords) => {
    if (selectedRecords.length === 0) return true;
    const flatArray = treeToFlatArray(selectedRecords, 'subRows').filter(
      (f) => f.type === 'product' && f.serializedProduct && f.realAssetQty > f.realAssetAssignedQty
    );
    return flatArray.length === 0;
  };

  const handleAssignSerialNumbers = (rows) => {
    const data = rows?.map((e) => ({ _id: e?._id, materialId: e?.materialId, serialNumber: e?.serialNumber }));
    setIsAssigning(true);
    axiosInstance()
      .post(`${rentalManagement.api}/${rentalManagementData._id}/add-serial-numbers`, data)
      .then(() => {
        setIsAssigning(false);
        setAssignSerialNumbersDialog(false);
        fetchData();
      })
      .catch((error) => {
        setIsAssigning(false);
        toastConfig.setToastConfig(error);
      });
  };

  const openLinkActions = (event) => {
    setAnchorLinkActionEl(event.currentTarget);
  };

  const closeLinkActions = () => {
    setAnchorLinkActionEl(null);
  };

  const validateRemoveInventory = (uniqueId, materialId) => {
    let cnt = 0;
    nonSerializedInventory?.forEach((_inventory) => {
      if (_inventory?.product?.optionValue === materialId && _inventory?._id === uniqueId) {
        const plant = _inventory?.warehouse?.optionValue;
        const storageLocation = _inventory?.storageLocation?.optionValue;
        const ticketQtySum =
          allLoadingTicketProducts
            ?.filter((ticket) => ticket?.uniqueId === uniqueId && ticket?.product === materialId && ticket?.warehouse === plant && (user?.user?.brandPolicy?.storageLocation ? ticket?.storageLocation === storageLocation : true))
            ?.reduce((sum, ticket) => (sum += ticket?.qty), 0) || 0;
        if (_inventory?.qty > ticketQtySum) {
          cnt += _inventory?.qty - ticketQtySum;
        }
      }
    });
    return cnt;
  };

  const getPlantWiseValidQty = (uniqueId, materialId, warehouse, storageLocation, inventoryCnt) => {
    const ticketQtySum =
      allLoadingTicketProducts
        ?.filter((ticket) => ticket?.uniqueId === uniqueId && ticket?.product === materialId && ticket?.warehouse === warehouse && (user?.user?.brandPolicy?.storageLocation && storageLocation ? ticket?.storageLocation === storageLocation : true))
        ?.reduce((sum, ticket) => (sum += ticket?.qty), 0) || 0;
    if (inventoryCnt > ticketQtySum) return inventoryCnt - ticketQtySum;
    return 0;
  };

  const rightSideContents = () => {
    return (
      <>
        <ScanButtons
          referenceData={rentalManagementData}
          disabled={disableAssignSerializedAssets(selectedRecords)}
          products={assetAssignedProduct?.map((e) => ({
            _id: e.materialId,
            uniqueId: e._id,
            realAssetQty: e.realAssetQty,
            realAssetAssignedQty: e.realAssetAssignedQty
          }))}
          fetchData={fetchData}
        />
        <ThemeButton
          id="assign-serialized-asset-button"
          disabled={disableAssignSerializedAssets(selectedRecords)}
          onClick={() => {
            if (isOffline) {
              setAddNonSerializedAssetDialog(true);
            } else {
              setAddSerializedAssetDialog({ open: true });
            }
          }}
          tooltip={!allowedToEdit ? ownerAndColaborator : ``}
          buttonType="theme"
        >
          {`Assign ${resources?.serializedAsset?.titlePlural}`}
        </ThemeButton>
        {(purchaseOrderCount > 0 || subleaseCount > 0 || transferAssetCount > 0 || bulkAssetCreationCount > 0) && (
          <ThemeButton onClick={openLinkActions} endIcon={<ExpandMore />}>
            {`Order(s)`}
          </ThemeButton>
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
            {`Create ${resources?.bulkAssetCreation?.titleSingular}`}
          </MenuItem>
        )}
        {permissions?.purchaseOrder?.isCreate && (
          <MenuItem
            disabled={showOrderDialog?.products?.filter((e) => e.serialized === false)?.length === 0}
            onClick={() => {
              setOrderDialog((prevState) => ({ ...prevState, open: true, type: 'purchaseOrder' }));
            }}
          >
            {`Create ${resources?.purchaseOrder?.titleSingular}`}
          </MenuItem>
        )}
        {permissions?.sublease?.isCreate && (
          <MenuItem
            disabled={showOrderDialog?.products?.filter((e) => e.serialized === true && e.assetsCount)?.length === 0}
            onClick={() => {
              setOrderDialog((prevState) => ({ ...prevState, open: true, type: 'sublease' }));
            }}
          >
            {`Create ${resources?.sublease?.titleSingular}`}
          </MenuItem>
        )}
        {permissions?.productInventory?.isRead && selectedRecords.length && assetAssignedProduct?.length ? (
          <MenuItem
            onClick={() => {
              setAssignSerialNumbersDialog(true);
            }}
          >
            {`Assign Serial Numbers`}
          </MenuItem>
        ) : permissions?.productInventory?.isRead && selectedRecords.length && nonSerializedProduct?.length ? (
          <>
            <MenuItem
              onClick={() => {
                setAddNonSerializedInventoryDialog({ open: true, type: 'add' });
              }}
            >
              {`Assign Inventory`}
            </MenuItem>
          </>
        ) : null}
        {selectedRecords?.filter((e) => validateRemoveInventory(e?._id, e?.materialId))?.length > 0 && (
          <MenuItem
            onClick={() => {
              setAddNonSerializedInventoryDialog({ open: true, type: 'remove' });
            }}
          >
            Remove Inventory
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
                assetId: element._id,
                assetNumber: element?.detail,
                isTransferAsset: isTransferAsset,
                isProductSerialNumbers: false,
                type: 'asset'
              });
            });
            serialNumbers?.forEach((element) => {
              dataTodelete.push({
                _id: element.uniqueId,
                assetId: element.serialNumber,
                isProductSerialNumbers: true,
                type: 'serialNumber'
              });
            });
            setDeleteData(dataTodelete);
            setShowConfirmBox(true);
          }}
        >
          {`Remove ${resources?.serializedAsset?.titlePlural}/Serial Numbers`}
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
            {`Show ${resources?.purchaseOrder?.titleSingular}`}
          </MenuItem>
        )}
        {permissions?.bulkAssetCreation?.isRead && (
          <MenuItem
            disabled={bulkAssetCreationCount === 0}
            onClick={() => {
              OpenInNewWindow(routes.bulkAssetCreation.path);
            }}
          >
            {`Show ${resources?.bulkAssetCreation?.titleSingular}`}
          </MenuItem>
        )}

        {permissions?.sublease?.isRead && (
          <MenuItem
            disabled={subleaseCount === 0}
            onClick={() => {
              OpenInNewWindow(routes.sublease.path);
            }}
          >
            {`Show ${resources?.sublease?.titleSingular}`}
          </MenuItem>
        )}
        {permissions?.transferAsset?.isRead && (
          <MenuItem
            disabled={transferAssetCount === 0}
            onClick={() => {
              OpenInNewWindow(routes.transferAsset.path);
            }}
          >
            {`Show ${resources?.transferAsset?.titleSingular}`}
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
          assetPolicyData={assetPolicyData}
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
            wellNumber: rentalManagementData?.wellNumber
              ? rentalManagementData?.wellNumber?.optionValue || rentalManagementData?.wellNumber?.map((e) => e?.optionValue)
              : null,
            wellName: rentalManagementData?.wellName
              ? rentalManagementData?.wellName?.optionValue || rentalManagementData?.wellName?.map((e) => e?.optionValue)
              : null,
            fromDate: rentalManagementData?.estimateStartDate,
            toDate: rentalManagementData?.estimateEndDate,
            afeNumber: rentalManagementData?.afeNumber
          }}
          isAdding={isAdding}
          selectedProducts={assetAssignedProduct}
          filterByPlant={rentalManagementData?.warehouse}
          selectedRecordsOfMain={selectedRecords}
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
          products={[...assetAssignedProduct, ...nonSerializedProduct]}
          referenceId={rentalManagementData?._id}
        />
      )}
      {addNonSerializedInventoryDialog.open && (
        <AddNonSerializedInventory
          onClose={() => {
            setAddNonSerializedInventoryDialog({ open: false, type: '' });
          }}
          onSuccess={() => {
            setAddNonSerializedInventoryDialog({ open: false, type: '' });
            fetchData();
          }}
          selectedProducts={
            addNonSerializedInventoryDialog.type === 'add'
              ? nonSerializedProduct
              : selectedRecords
                ?.filter(
                  (r) => r?.type === MATERIAL_TYPE.product && !r?.productDetail?.serializedProduct && validateRemoveInventory(r?._id, r?.materialId)
                )
                ?.map((s) => ({
                  ...s,
                  _id: s._id,
                  id: s.materialId,
                  productName: s.productDetail?.productName,
                  qty: validateRemoveInventory(s?._id, s?.materialId)
                }))
          }
          referenceId={rentalManagementData?._id}
          type={addNonSerializedInventoryDialog.type}
          nonSerializedInventory={
            addNonSerializedInventoryDialog.type === 'add'
              ? nonSerializedInventory
              : nonSerializedInventory?.map((m) => {
                return {
                  ...m,
                  qty: getPlantWiseValidQty(m?._id, m?.product?.optionValue, m?.warehouse?.optionValue, m?.storageLocation?.optionValue, m?.qty)
                };
              })
          }
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
            user?.user?.brandPolicy?.purchaseOrderShowSerializedProduct
              ? showOrderDialog?.products.map((e) => {
                return { product: e._id, unit: e.unit, qty: e.assetsCount };
              })
              : showOrderDialog?.products
                ?.filter((e) => e.serialized === false)
                ?.map((e) => {
                  return { product: e._id, unit: e.unit, qty: e.assetsCount };
                })
          }
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
          isRedirectTodetailPage={false}
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
            setAssignSerialNumbersDialog(false);
          }}
          handleSucess={(rows) => {
            handleAssignSerialNumbers(rows);
          }}
          referenceType={'Rental Job'}
          isAssigning={isAssigning}
          filterByPlant={rentalManagementData?.warehouse}
          ids={productSerialNumbers?.map((e) => e?.serialNumber)}
          showWarehouseFilter={true}
          referenceData={{ rentalJob: rentalManagementData._id }}
        />
      )}
      {showAssignNonSerializedInventory.open && (
        <ShowAssignInventory
          onClose={() => {
            setShowAssignNonSerializedInventory({ open: false, data: null });
          }}
          data={nonSerializedInventory?.filter(
            (inv) =>
              inv?._id === showAssignNonSerializedInventory?.data?._id &&
              inv?.product?.optionValue === showAssignNonSerializedInventory?.data?.materialId
          )}
          productName={showAssignNonSerializedInventory?.data?.detail}
        />
      )}
    </Fragment>
  );
};
export default SerializedAsset;
