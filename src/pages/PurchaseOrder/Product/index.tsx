import { Box, IconButton, MenuItem } from '@mui/material';
import EditIcon from '@material-ui/icons/Edit';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { camelCase, isEmpty, map, uniq } from 'lodash';
import { Fragment, useContext, useEffect, useState, useRef } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import { CHILD_RESOURCE, purchaseOrder, sidebarResource } from 'src/constants/helpers';
import CostDialog from './CostDialog';
import InventoryStatesDialog from './InventoryStatesDialog';
import PurchaseOrderQtyDialog from './PurchaseOrderQtyDialog';
import ServiceDialog from './ServiceDialog';
import { fetchTaxRate } from './helper';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import DeleteIcon from '@material-ui/icons/Delete';
import { FiExternalLink } from 'react-icons/fi';
import { useGetWalkmeInstance, useSetWalkmeData } from 'src/components/CustomIntro';
import { nextButtonStep } from 'src/pages/RentalManagement/walkmeSteps';
import {
  generateAddExistingProduct,
  generateAddExistingService,
  generateAddManualEntry,
  generateEditManualEntry,
  generateEditProduct,
  generateEditService,
  generateDeleteStep
} from '../walkmeSteps';

const Product = ({ purchaseOrderData, setNextStep, renderedFrom, allowedToEdit: hasPermission, checkReceivedProduct }) => {
  const toastConfig = useContext(CustomToastContext);
  const { setWalkmeData } = useSetWalkmeData();
  const walkmeInstance = useGetWalkmeInstance();
  const {
    state: { user, permissions, resources }
  }: any = useData();

  const allowedToEdit = hasPermission && permissions?.purchaseOrder.isUpdate;

  const [addProductDialog, setAddProductDialog] = useState(false);
  const [isAddingProducts, setAddingProducts] = useState(false);
  const [addServiceDialog, setAddServiceDialog] = useState(false);
  const [showInventoryStatesDialog, setShowInventoryStatesDialog] = useState({ open: false, product: null, qty: 0 });
  const [showProductDialog, setShowProductDialog] = useState({ open: false, data: null, showSaveAndNext: false });
  const [showServiceDialog, setShowServiceDialog] = useState({ open: false, data: null, showSaveAndNext: false });
  const [showCostDialog, setShowCostDialog] = useState({ open: false, data: null, showSaveAndNext: false });
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [isBulkEdit, setIsBulkEdit] = useState(false);

  const [isRateRequired, setIsRateRequired] = useState(false);
  const [columns, setColumns] = useState(null);
  const [productFields, setProductFields] = useState([]);
  const [serviceFields, setServiceFields] = useState([]);
  const [costFields, setCostFields] = useState([]);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deletePurchaseOrderItem, setDeletePurchaseOrderItem] = useState([]);
  const [material, setMaterial] = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const isStepDataSet = useRef(false);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchData();
  }, [columns]);

  useEffect(() => {
    let stepData = [];
    if (permissions?.product?.isRead) {
      stepData.push(generateAddExistingProduct());
    }
    if (permissions?.serviceMaster?.isRead && user?.user?.brandPolicy?.purchaseOrderAddService) {
      stepData.push(generateAddExistingService());
    }
    stepData.push(generateAddManualEntry());
    if (dataRows?.length) {
      const serviceIndex = dataRows.findIndex((d) => d.type === 'Service');
      const manualEntryIndex = dataRows.findIndex((d) => d.type === 'Manual Entry');
      const productIndex = dataRows.findIndex((d) => d.type === 'Product');
      if (serviceIndex !== -1) {
        stepData.push(generateEditService(false, serviceIndex));
        if (!dataRows[serviceIndex]['actualReceived']) {
          stepData.push(generateDeleteStep(false, serviceIndex, camelCase(dataRows[serviceIndex]?.type)));
        }
      }
      if (manualEntryIndex !== -1) {
        stepData.push(generateEditManualEntry(false, manualEntryIndex));
        if (!dataRows[manualEntryIndex]['actualReceived']) {
          stepData.push(generateDeleteStep(false, manualEntryIndex, camelCase(dataRows[manualEntryIndex]?.type)));
        }
      }
      if (productIndex !== -1) {
        stepData.push(generateEditProduct(false, productIndex));
        if (!dataRows[productIndex]['actualReceived']) {
          stepData.push(generateDeleteStep(false, productIndex, camelCase(dataRows[productIndex]?.type)));
        }
      }
      if (walkmeInstance && walkmeInstance.type === 'flow' && !isStepDataSet.current) {
        isStepDataSet.current = true;
        let steps = [];
        if (serviceIndex !== -1 && !dataRows[serviceIndex]?.isValid) {
          steps = generateEditService(false, serviceIndex).steps;
        } else if (manualEntryIndex !== -1 && !dataRows[serviceIndex]?.isValid) {
          steps = generateEditManualEntry(false, manualEntryIndex).steps;
        } else if (productIndex !== -1 && !dataRows[productIndex]?.isValid) {
          steps = generateEditProduct(false, productIndex).steps;
        }
        steps.push({ ...nextButtonStep, waitForStepInsertion: true });
        walkmeInstance.instance.push(steps);
        walkmeInstance.handleNext();
      }
    }
    setWalkmeData(stepData);
  }, [dataRows]);

  const fetchFields = async () => {
    let columns: any = [];
    const productResult = await axiosInstance().get('/field?resource=Product&view=true');
    const productFields = productResult?.data?.data?.filter((e) =>
      ['productCategory', 'productNumber', 'serializedProduct', 'chartOfAccount'].includes(e?.fieldData?.fieldName)
    );
    columns.push({
      accessor: 'index',
      Header: 'Index',
      width: 70,
      primaryField: true,
      sticky: 'left',
      Cell: ({ row }) => {
        return row.original['index'] ? <p className="text-truncate">{row.original.index}</p> : <NoDataCell />;
      },
      Footer: () => {
        return <>Total</>;
      }
    });
    columns.push({
      accessor: 'type',
      Header: 'Type',
      disabled: true,
      sticky: isMobile || isTablet ? 'none' : 'left',
      Cell: ({ row }) => {
        return row.original['type'] ? <p className="text-truncate">{row.original.type}</p> : <NoDataCell />;
      }
    });
    columns.push({
      accessor: 'detail',
      Header: 'Detail',
      minWidth: 300,
      width: 300,
      disabled: true,
      sticky: isMobile || isTablet ? 'none' : 'left',
      Cell: ({ row, table }) => (
        <div className="flex items-center gap-2">
          {!allowedToEdit ? (
            <p className="text-truncate"> {row.original.detail}</p>
          ) : (
            <p
              onClick={() => {
                openMaterial(row.original, table.getRowModel().rows);
              }}
              className="link text-truncate"
              title={row.original.detail}
            >
              {row.original.detail}
            </p>
          )}
          {row.original.type === 'Product' && (
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.productDetail.path}/${row.original?.materialId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          )}
          {row.original.type === 'Service' && (
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.serviceMasterDetail.path}/${row.original?.materialId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          )}
        </div>
      )
    });
    columns.push({
      accessor: 'description',
      Header: 'Description',
      width: 200,
      Cell: ({ row }) => {
        return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
      }
    });

    const productFieldsColumns = generateColumns(renderedFrom, productFields);
    productFieldsColumns?.forEach((e) => {
      columns.push(e);
    });

    const p_fields = await fetch_child_resource_fields(CHILD_RESOURCE.purchaseOrderProduct, purchaseOrderData?.currency, allowedToEdit);
    const s_fields = await fetch_child_resource_fields(CHILD_RESOURCE.purchaseOrderService, purchaseOrderData?.currency, allowedToEdit);
    setServiceFields(s_fields);
    const c_fields = await fetch_child_resource_fields(CHILD_RESOURCE.purchaseOrderCost, purchaseOrderData?.currency, allowedToEdit);
    setCostFields(c_fields);

    p_fields.forEach((element) => {
      if (element.fieldName === 'price' && element.required) {
        setIsRateRequired(true);
      }
    });

    setProductFields(JSON.parse(JSON.stringify(p_fields)));
    const newColumns = generateColumns(renderedFrom, p_fields, null, false, purchaseOrderData?.currency);
    columns = [...columns, ...newColumns];
    columns.push({
      accessor: 'action',
      Header: 'Actions',
      width: permissions?.irtTicket?.isCreate ? 150 : 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row, table }) => {
        return allowedToEdit ? (
          <div>
            <HtmlTooltip title="Edit">
              <IconButton
                color="primary"
                size="small"
                aria-label="Edit"
                onClick={() => {
                  openMaterial(row.original, table.getRowModel().rows);
                }}
                id={`edit-${camelCase(row?.original?.type)}-button-${row.index || 0}`}
              >
                <EditIcon color="primary" fontSize="small" />
              </IconButton>
            </HtmlTooltip>
            {permissions?.irtTicket?.isCreate && row.original?.type === 'Product' && (
              <HtmlTooltip title="Explore Inventory">
                <IconButton
                  color="primary"
                  size="small"
                  aria-label="Inventory"
                  onClick={() => {
                    setShowInventoryStatesDialog({
                      open: true,
                      product: row?.original?.materialId,
                      qty: row.original?.qty
                    });
                  }}
                >
                  <VisibilityIcon color="primary" fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            )}
            {(row.original?.actualReceived === undefined || row.original?.actualReceived === 0) && (
              <HtmlTooltip title="Delete">
                <IconButton
                  color="primary"
                  size="small"
                  aria-label="Delete"
                  onClick={() => {
                    setShowDeleteConfirmBox(true);
                    setDeletePurchaseOrderItem([row.original]);
                  }}
                  id={`delete-${camelCase(row?.original?.type)}-button-${row.index || 0}`}
                >
                  <DeleteIcon color="error" fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            )}
          </div>
        ) : null;
      }
    });

    if (!allowedToEdit) {
      columns?.forEach((e: any) => {
        e.editable = false;
      });
    }
    setColumns([...columns]);
  };

  const openMaterial = (data, rows) => {
    if (data.type === 'Product') {
      setShowProductDialog({ open: true, data: data, showSaveAndNext: data?.index < rows?.length ? true : false });
    }
    if (data.type === 'Service') {
      setShowServiceDialog({ open: true, data: data, showSaveAndNext: data?.index < rows?.length ? true : false });
    }
    if (data.type === 'Manual Entry') {
      setShowCostDialog({ open: true, data: data, showSaveAndNext: data?.index < rows?.length ? true : false });
    }
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    setNextStep(false);

    const productResponce: any = await axiosInstance().get(`${purchaseOrder.api}/product/${purchaseOrderData._id}`);
    const serviceResponse: any = await axiosInstance().get(`${purchaseOrder.api}/service/${purchaseOrderData._id}`);
    const costResponce: any = await axiosInstance().get(`${purchaseOrder.api}/cost/${purchaseOrderData._id}`);

    const data = [
      ...((productResponce?.data?.data?.length &&
        productResponce?.data?.data?.map((e: any) => {
          return { ...e, type: 'Product' };
        })) ||
        []),
      ...((serviceResponse?.data?.data?.length &&
        serviceResponse?.data?.data?.map((e: any) => {
          return { ...e, type: 'Service' };
        })) ||
        []),
      ...((costResponce?.data?.data?.length &&
        costResponce?.data?.data?.map((e: any) => {
          return { ...e, type: 'Manual Entry' };
        })) ||
        [])
    ];

    setMaterial(JSON.parse(JSON.stringify(data)));
    let rows = data?.map((item, index) => {
      let finalObject = item;
      finalObject['isChecked'] = selectedRecords?.some((s) => s._id === item._id);
      let res: any = {
        ...finalObject
      };
      res.index = index + 1;
      res.detail =
        item.type === 'Product' ? item?.productDetail?.productName : item.type === 'Service' ? item?.serviceDetail?.serviceName : item?.description;
      res.description =
        item.type === 'Product'
          ? item?.productDetail?.productDescription
          : item.type === 'Service'
            ? item?.serviceDetail?.serviceDescription
            : item?.description;
      res.materialId = item.type === 'Product' ? item?.productDetail?._id : item.type === 'Service' ? item?.serviceDetail?._id : item?._id;
      res.productNumber = item.productDetail?.productNumber;
      res.serializedProduct = item.productDetail?.serializedProduct;
      res.productCategory = item.productDetail?.productCategory;
      res.chartOfAccount = item.productDetail?.chartOfAccount;
      res.parentId = null;
      res.qty = item?.qty;
      res.productDetail = item?.productDetail;
      if (item?.productDetail) {
        res.productDetail = item?.productDetail;
      }
      if (item?.serviceDetail) {
        res.serviceDetail = item?.serviceDetail;
      }
      if (item?.qty === 0) {
        res.isValid = false;
      } else if (isRateRequired) {
        if (item['finalPrice_' + purchaseOrderData?.currency?.toLowerCase()]) {
          res.isValid = true;
        } else {
          res.isValid = false;
        }
      } else {
        res.isValid = true;
      }
      res.hideSelection = item.actualReceived ? true : false;
      return res;
    });
    if (rows.length === 0) {
      setNextStep(false);
    } else if (rows.filter((_rows) => _rows.isValid === false).length > 0) {
      setNextStep(false);
    } else {
      setNextStep(true);
    }
    checkReceivedProduct(data);
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const handleAddProduct = async (rows) => {
    setAddingProducts(true);
    const tax: any = {};
    if (purchaseOrderData?.taxCode) {
      const taxRate = await fetchTaxRate(purchaseOrderData?.taxCode?.optionValue);
      tax.taxCode = purchaseOrderData?.taxCode?.optionValue;
      tax.taxPercentage = taxRate?.length ? taxRate[0]?.taxRate : 0;
    }
    let products = rows?.map((d) => ({
      productId: d.productId || d._id,
      qty: d.qty ? parseInt(d.qty) : 1,
      expectedDelivery: purchaseOrderData?.deliveryDate,
      unit: d?.unitMain?.length ? d?.unitMain[0] : '',
      costCode: d?.costCode ? d?.costCode : '',
      ...tax
    }));

    axiosInstance()
      .post(`${purchaseOrder.api}/product/${purchaseOrderData._id}/add`, { products })
      .then(() => {
        setAddProductDialog(false);
        fetchData();
        setAddingProducts(false);
      })
      .catch((error) => {
        setAddingProducts(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateQty = (rows, saveAndNext = false) => {
    setLoadingEdit(true);
    axiosInstance()
      .put(`${purchaseOrder.api}/product/${purchaseOrderData._id}/update`, { products: rows })
      .then(() => {
        setAddProductDialog(false);
        fetchData();
        setAddingProducts(false);
        setIsBulkEdit(false);
        if (saveAndNext) {
          const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
          if (rowIndex < dataRows?.length - 1) {
            if (dataRows[rowIndex + 1]?.type === 'Product') {
              setShowProductDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            } else if (dataRows[rowIndex + 1]?.type === 'Service') {
              setShowProductDialog({ open: false, data: null, showSaveAndNext: false });
              setShowServiceDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            } else if (dataRows[rowIndex + 1]?.type === 'Manual Entry') {
              setShowProductDialog({ open: false, data: null, showSaveAndNext: false });
              setShowCostDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            } else {
              setShowProductDialog({ open: false, data: null, showSaveAndNext: false });
            }
          }
        } else {
          setShowProductDialog({ open: false, data: null, showSaveAndNext: false });
        }
        setLoadingEdit(false);
      })
      .catch((error) => {
        setLoadingEdit(false);
        setAddProductDialog(false);
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
      });
  };

  const handleDelete = async () => {
    const product = deletePurchaseOrderItem?.filter((e) => e.type === 'Product');
    const service = deletePurchaseOrderItem?.filter((e) => e.type === 'Service');
    const cost = deletePurchaseOrderItem?.filter((e) => e.type === 'Manual Entry');

    if (product?.length) {
      await axiosInstance().post(`${purchaseOrder.api}/product/${purchaseOrderData._id}/delete`, { ids: product?.map((e) => e._id) });
    }
    if (service?.length) {
      await axiosInstance().post(`${purchaseOrder.api}/service/${purchaseOrderData._id}/delete`, { ids: service?.map((e) => e._id) });
    }
    if (cost?.length) {
      await axiosInstance().post(`${purchaseOrder.api}/cost/${purchaseOrderData._id}/delete`, { ids: cost?.map((e) => e._id) });
    }
    fetchData();
    setShowDeleteConfirmBox(false);
    setDeletePurchaseOrderItem([]);
  };

  const handleAddCost = (rows) => {
    setLoadingEdit(true);
    axiosInstance()
      .post(`${purchaseOrder.api}/cost/${purchaseOrderData._id}/add`, { additionalCost: rows })
      .then(() => {
        fetchData();
        setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
        setLoadingEdit(false);
      })
      .catch((error) => {
        setLoadingEdit(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateCost = (rows, saveAndNext = false) => {
    setLoadingEdit(true);
    axiosInstance()
      .put(`${purchaseOrder.api}/cost/${purchaseOrderData._id}/update`, { additionalCost: rows })
      .then(() => {
        fetchData();
        if (saveAndNext) {
          const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
          if (rowIndex < dataRows?.length - 1) {
            if (dataRows[rowIndex + 1]?.type === 'Product') {
              setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
              setShowProductDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            } else if (dataRows[rowIndex + 1]?.type === 'Service') {
              setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
              setShowServiceDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            } else if (dataRows[rowIndex + 1]?.type === 'Manual Entry') {
              setShowCostDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            } else {
              setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
            }
          }
        } else {
          setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
        }
        setLoadingEdit(false);
      })
      .catch((error) => {
        setLoadingEdit(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddService = async (rows) => {
    setSubmitting(true);
    const tax: any = {};
    if (purchaseOrderData?.taxCode) {
      const taxRate = await fetchTaxRate(purchaseOrderData?.taxCode?.optionValue);
      tax.taxCode = purchaseOrderData?.taxCode?.optionValue;
      tax.taxPercentage = taxRate?.length ? taxRate[0]?.taxRate : 0;
    }
    let tempServiceArray = rows?.map((d) => ({
      serviceId: d._id,
      qty: d.qty ? parseInt(d.qty) : 1,
      unit: d?.unitMain?.length ? d?.unitMain[0] : '',
      ...tax
    }));
    axiosInstance()
      .post(`${purchaseOrder.api}/service/${purchaseOrderData._id}/add`, { services: tempServiceArray })
      .then(() => {
        fetchData();
        setAddServiceDialog(false);
        setSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSubmitting(false);
      });
  };

  const handleUpdateService = (rows, saveAndNext = false) => {
    setLoadingEdit(true);
    axiosInstance()
      .put(`${purchaseOrder.api}/service/${purchaseOrderData._id}/update`, { services: rows })
      .then(() => {
        fetchData();
        if (saveAndNext) {
          const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
          if (rowIndex < dataRows?.length - 1) {
            if (dataRows[rowIndex + 1]?.type === 'Product') {
              setShowServiceDialog({ open: false, data: null, showSaveAndNext: false });
              setShowProductDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            } else if (dataRows[rowIndex + 1]?.type === 'Service') {
              setShowServiceDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            } else if (dataRows[rowIndex + 1]?.type === 'Manual Entry') {
              setShowServiceDialog({ open: false, data: null, showSaveAndNext: false });
              setShowCostDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            } else {
              setShowServiceDialog({ open: false, data: null, showSaveAndNext: false });
            }
          }
        } else {
          setShowServiceDialog({ open: false, data: null, showSaveAndNext: false });
        }
        setLoadingEdit(false);
      })
      .catch((error) => {
        setLoadingEdit(false);
        toastConfig.setToastConfig(error);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = material.find((d) => d._id === updatedData._id);
    if (rowData?.type === 'Product') {
      if (inputField?.qty) {
        if (inputField?.qty < (rowData?.actualReceived || 0) + (rowData?.rejectQuantity || 0)) {
          toastConfig.setToastConfig({
            open: true,
            type: 'error',
            message: 'Quantity should be greater than Actual Received and Reject Quantity'
          });
          return false;
        }
      }
      let rows: any = [{ ...rowData, ...updatedData }];
      rows = await calculateRowsField(material, inputField, productFields, updatedData, purchaseOrderData?.currency);
      rows?.forEach((element) => {
        element.productId = updatedData?.productId;
      });
      handleUpdateQty(rows);
    } else if (rowData?.type === 'Service') {
      let rows: any = [{ ...rowData, ...updatedData }];
      rows = await calculateRowsField(material, inputField, serviceFields, updatedData, purchaseOrderData?.currency);
      handleUpdateService(rows);
    } else if (rowData?.type === 'Manual Entry') {
      let rows: any = [{ ...rowData, ...updatedData }];
      rows = await calculateRowsField(material, inputField, costFields, updatedData, purchaseOrderData?.currency);
      handleUpdateCost(rows);
    }
  };

  const AddButtonMenuItems = () => {
    return (
      <>
        {permissions?.product?.isRead && (
          <MenuItem
            onClick={() => {
              setAddProductDialog(true);
            }}
            id={'add-existing-product-menu-item'}
          >
            Add Existing Products
          </MenuItem>
        )}
        {permissions?.serviceMaster?.isRead && user?.user?.brandPolicy?.purchaseOrderAddService && (
          <MenuItem
            onClick={() => {
              setAddServiceDialog(true);
            }}
            id={'add-existing-service-menu-item'}
          >
            Add Existing Services
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setShowCostDialog({ open: true, data: null, showSaveAndNext: false });
          }}
          id={'add-manual-entry-menu-item'}
        >
          Add Manual Entry
        </MenuItem>
      </>
    );
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={
            selectedRecords?.filter((e) => !e.hideSelection).length > 0 &&
            uniq(
              map(
                selectedRecords?.filter((e) => !e.hideSelection),
                'type'
              )
            )?.length === 1
              ? false
              : true
          }
          onClick={() => {
            setIsBulkEdit(true);
            const typeUniq: any = uniq(
              map(
                selectedRecords?.filter((e) => !e.hideSelection),
                'type'
              )
            );
            if (typeUniq[0] === 'Product') {
              setShowProductDialog({ open: true, data: null, showSaveAndNext: false });
            } else if (typeUniq[0] === 'Service') {
              setShowServiceDialog({ open: true, data: null, showSaveAndNext: false });
            } else {
              setShowCostDialog({ open: true, data: null, showSaveAndNext: false });
            }
          }}
        >
          Bulk Edit
        </MenuItem>
        {permissions?.purchaseOrder?.isDelete && (
          <MenuItem
            onClick={() => {
              setShowDeleteConfirmBox(true);
              setDeletePurchaseOrderItem(selectedRecords?.filter((e) => !e.hideSelection));
            }}
          >
            Delete
          </MenuItem>
        )}
      </>
    );
  };

  const previewDownloadProps = {
    fileName: `${resources?.purchaseOrder?.titleSingular}-${purchaseOrderData?.purchaseOrderNumber}`,
    resource: sidebarResource.purchaseOrder,
    referenceId: purchaseOrderData?._id,
    columns: columns,
    isSendEmail: true,
    button1Title: 'Ordered',
    button2Title: 'Received',
    defaultColumns: [
      'index',
      'type',
      'detail',
      'description',
      'qty',
      `price_${purchaseOrderData?.currency?.toLowerCase()}`,
      `totalPrice_${purchaseOrderData?.currency?.toLowerCase()}`,
      `tax_${purchaseOrderData?.currency?.toLowerCase()}`,
      `finalPrice_${purchaseOrderData?.currency?.toLowerCase()}`
    ]
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonMenuItems={<AddButtonMenuItems />}
            isActionButtonVisible={true}
            actionButtonMenuItems={<ActionMenuItems />}
            actionButtonProps={{ disabled: selectedRecords?.filter((e) => !e.hideSelection)?.length ? false : true }}
            previewDownloadProps={previewDownloadProps}
            hasXpadding={true}
          />
        </>
      )}
      {columns ? (
        <Box zIndex={5}>
          <CustomReactTable
            height={'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            refreshGrid={fetchData}
            hideSelection={!allowedToEdit}
            hideAction={!allowedToEdit}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            onSaveEdit={onSaveInlineEdit}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {addProductDialog && purchaseOrderData && (
        <AssignProductDialog
          handleCloseDialog={() => setAddProductDialog(false)}
          reference="purchaseOrder"
          onSuccess={handleAddProduct}
          extraDeepFilter={
            purchaseOrderData?.expenseItem === true || purchaseOrderData?.expenseItem === false
              ? [
                  {
                    field: 'expenseItem',
                    term: purchaseOrderData?.expenseItem ? 'Yes' : 'No'
                  }
                ]
              : []
          }
          extraFilterById={
            purchaseOrderData?.chartOfAccount && !isEmpty(purchaseOrderData?.chartOfAccount)
              ? [
                  {
                    field: 'chartOfAccount',
                    term: { $in: purchaseOrderData?.chartOfAccount?.map((e) => e?.optionValue) }
                  }
                ]
              : []
          }
          isSubmitting={isAddingProducts}
        />
      )}
      {showProductDialog.open && (
        <PurchaseOrderQtyDialog
          onClose={() => {
            setShowProductDialog({ open: false, data: null, showSaveAndNext: false });
            setIsBulkEdit(false);
          }}
          onSubmit={handleUpdateQty}
          productData={!isBulkEdit ? showProductDialog.data : selectedRecords?.filter((e) => !e.hideSelection)}
          bulkEdit={isBulkEdit}
          purchaseOrderData={purchaseOrderData}
          showSaveAndNext={showProductDialog.showSaveAndNext}
          loadingEdit={loadingEdit}
        />
      )}
      {showServiceDialog.open && (
        <ServiceDialog
          onClose={() => {
            setShowServiceDialog({ open: false, data: null, showSaveAndNext: false });
            setIsBulkEdit(false);
          }}
          handleUpdateService={handleUpdateService}
          purchaseOrderData={purchaseOrderData}
          serviceData={!isBulkEdit ? showServiceDialog.data : selectedRecords?.filter((e) => !e.hideSelection)}
          bulkEdit={isBulkEdit}
          showSaveAndNext={showServiceDialog.showSaveAndNext}
          loadingEdit={loadingEdit}
        />
      )}
      {showCostDialog.open && (
        <CostDialog
          onClose={() => {
            setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
            setIsBulkEdit(false);
          }}
          handleAddCost={handleAddCost}
          handleUpdateCost={handleUpdateCost}
          purchaseOrderData={purchaseOrderData}
          costData={!isBulkEdit ? showCostDialog.data : selectedRecords?.filter((e) => !e.hideSelection)}
          bulkEdit={isBulkEdit}
          showSaveAndNext={showCostDialog.showSaveAndNext}
          loadingEdit={loadingEdit}
        />
      )}
      {addServiceDialog && (
        <AssignServiceDialog
          onSuccess={(services) => {
            handleAddService(services);
          }}
          handleClose={() => {
            setAddServiceDialog(false);
          }}
          isSubmitting={isSubmitting}
          extraFilterById={
            purchaseOrderData?.chartOfAccount && !isEmpty(purchaseOrderData?.chartOfAccount)
              ? [
                  {
                    field: 'chartOfAccount',
                    term: { $in: purchaseOrderData?.chartOfAccount?.map((e) => e?.optionValue) }
                  }
                ]
              : []
          }
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete  ? `}
          onClose={() => setShowDeleteConfirmBox(false)}
          onOk={handleDelete}
        />
      )}
      {showInventoryStatesDialog.open && (
        <InventoryStatesDialog
          onClose={() => {
            setShowInventoryStatesDialog({ open: false, product: null, qty: 0 });
          }}
          product={showInventoryStatesDialog.product}
          warehouse={purchaseOrderData?.warehouse?.optionValue}
          data={{ qty: showInventoryStatesDialog.qty }}
          purchaseOrderData={purchaseOrderData}
        />
      )}
    </Fragment>
  );
};

export default Product;
