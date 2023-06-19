import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Box, Button, IconButton, MenuItem, Menu } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { purchaseOrder } from 'src/constants/helpers';
import GridDeleteIcon from 'src/components/Helpers/GridDeleteIcon';
import PurchaseOrderQtyDialog from './PurchaseOrderQtyDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { prepareDataForGrid } from 'src/constants/helpers';
import { generateCustomTableColumns } from 'src/constants/columns';
import { ExpandMore } from '@material-ui/icons';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { fetch_po_cost_fields, fetch_po_product_fields, fetch_po_service_fields } from '../../../components/PurchaseOrder/helper';
import SendEmail from './../SendEmail';
import InventoryStatesDialog from './InventoryStatesDialog';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import CostDialog from './CostDialog';
import ServiceDialog from './ServiceDialog';
import AddIcon from '@material-ui/icons/Add';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { map, uniq } from 'lodash';
import EditIcon from '@material-ui/icons/Edit';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';

const Product = ({ purchaseOrderData, setNextStep, renderedFrom, allowedToEdit: hasPermission, checkReceivedProduct }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
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
  const [selectedProducts, setSelectedProducts] = useState([]);

  const [anchorEl, setAnchorEl] = useState(null);
  const [addAnchorEl, setAddAnchorEl] = useState(null);

  const [isRateRequired, setIsRateRequired] = useState(false);

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  const [productFields, setProductFields] = useState([]);
  const [serviceFields, setServiceFields] = useState([]);
  const [costFields, setCostFields] = useState([]);

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deletePurchaseOrderItem, setDeletePurchaseOrderItem] = useState([]);

  const [material, setMaterial] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchData();
  }, [columns]);

  const fetchFields = async () => {
    let columns: any = [];
    const productResult = await axiosInstance().get('/field?resource=Product&view=true');
    const productFields = productResult?.data?.data?.filter((e) =>
      ['productCategory', 'productNumber', 'serializedProduct'].includes(e?.fieldData?.fieldName)
    );
    columns.push({
      accessor: 'index',
      Header: 'Index',
      width: 50,
      primaryField: true,
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
      width: 100,
      primaryField: true,
      Cell: ({ row }) => {
        return row.original['type'] ? <p className="text-truncate">{row.original.type}</p> : <NoDataCell />;
      }
    });
    columns.push({
      accessor: 'detail',
      Header: 'Detail',
      minWidth: 300,
      width: 300,
      primaryField: true,
      Cell: ({ row, rows }) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {!allowedToEdit ? (
            <p className="text-truncate"> {row.original.detail}</p>
          ) : (
            <p
              onClick={() => {
                openMaterial(row.original, rows);
              }}
              className="link text-truncate"
              title={row.original.detail}
            >
              {row.original.detail}
            </p>
          )}
          <Box ml={1} />
          {row.original.type === 'Product' && (
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.productDetail.path}/${row.original?.materialId}`);
              }}
            >
              <OpenInNewIcon fontSize="small" color="primary" />
            </IconButton>
          )}
          {row.original.type === 'Service' && (
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.serviceMasterDetail.path}/${row.original?.materialId}`);
              }}
            >
              <OpenInNewIcon fontSize="small" color="primary" />
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
    productFields?.forEach((e) => {
      if (e?.fieldData?.fieldName === 'productNumber') {
        columns.push({
          accessor: 'productNumber',
          Header: e?.fieldData?.fieldLabel,
          width: 200,
          Cell: ({ row }) => {
            return row.original['productNumber'] ? <p className="text-truncate">{row.original.productNumber}</p> : <NoDataCell />;
          }
        });
      }
      if (e?.fieldData?.fieldName === 'productCategory') {
        columns.push({
          accessor: 'productCategory',
          Header: e?.fieldData?.fieldLabel,
          width: 200,
          Cell: ({ row }) => {
            return row.original['productCategory'] ? <p className="text-truncate">{row.original.productCategory}</p> : <NoDataCell />;
          }
        });
      }
      if (e?.fieldData?.fieldName === 'serializedProduct') {
        columns.push({
          accessor: 'serializedProductView',
          Header: e?.fieldData?.fieldLabel,
          width: 200,
          Cell: ({ row }) => {
            return row.original['serializedProductView'] ? <p className="text-truncate">{row.original.serializedProductView}</p> : <NoDataCell />;
          }
        });
      }
    });

    const p_fields = await fetch_po_product_fields(purchaseOrderData?.currency);
    const s_fields = await fetch_po_service_fields(purchaseOrderData?.currency);
    setServiceFields(s_fields);
    const c_fields = await fetch_po_cost_fields(purchaseOrderData?.currency);
    setCostFields(c_fields);

    p_fields.forEach((element) => {
      if (element.fieldName === 'price' && element.required) {
        setIsRateRequired(true);
      }
    });

    setProductFields(JSON.parse(JSON.stringify(p_fields)));
    const newColumns = generateCustomTableColumns(p_fields, purchaseOrderData?.currency, renderedFrom);
    columns = [...columns, ...newColumns];
    columns.push({
      accessor: 'action',
      Header: '',
      width: permissions?.irtTicket?.isCreate ? 150 : 100,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row, rows }) => {
        return allowedToEdit ? (
          <>
            <HtmlTooltip title="Edit">
              <IconButton
                color="primary"
                size="small"
                aria-label="Edit"
                onClick={() => {
                  openMaterial(row.original, rows);
                }}
              >
                <EditIcon color="primary" />
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
                  <VisibilityIcon color="primary" />
                </IconButton>
              </HtmlTooltip>
            )}
            {(row.original?.actualReceived === undefined || row.original?.actualReceived === 0) && (
              <GridDeleteIcon
                hasDeletePermission={permissions?.purchaseOrder?.isUpdate}
                ownerId={user?.user?._id}
                userId={user?.user?._id}
                onDelete={() => {
                  setShowDeleteConfirmBox(true);
                  setDeletePurchaseOrderItem([row.original]);
                }}
                entity=""
              />
            )}
          </>
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
      let finalObject = prepareDataForGrid(item);
      finalObject['isChecked'] = selectedProducts.some((s) => s._id === item._id);
      finalObject['allowedToEdit'] = allowedToEdit;
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
      res.serializedProductView = item.productDetail?.serializedProduct ? 'Yes' : 'No';
      res.productCategory = item.productDetail?.productCategory?.optionLabel;
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
      res.hideSelection = item.actualReceived || item.rejectQuantity ? true : false;
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
    setRowsData(rows);
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const openAddActions = (event) => {
    setAddAnchorEl(event.currentTarget);
  };

  const closeAddActions = () => {
    setAddAnchorEl(null);
  };

  const handleAddProduct = (rows) => {
    setAddingProducts(true);
    let tempProductArray = rows?.map((d) => ({
      productId: d.productId || d._id,
      qty: d.qty ? parseInt(d.qty) : 1,
      expectedDelivery: purchaseOrderData?.deliveryDate,
      unit: d?.unitMain?.length ? d?.unitMain[0] : '',
      costCode: d?.costCode ? d?.costCode : ''
    }));
    axiosInstance()
      .post(`${purchaseOrder.api}/product/${purchaseOrderData._id}/add`, { orderDetails: tempProductArray })
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
    rows.forEach((element) => {
      delete element?.allowedToEdit;
      delete element?.assets;
      delete element?.description;
      delete element?.detail;
      delete element?.hideSelection;
      delete element?.isValid;
      delete element?.id;
      delete element?.index;
      delete element?.isChecked;
      delete element?.productDetail;
      delete element?.materialId;
      delete element?.productNumber;
      delete element?.serializedProduct;
      delete element?.serializedProductView;
      delete element?.type;
      delete element?.parentId;
      delete element?.productCategory;
      delete element?.subRows;
    });
    axiosInstance()
      .put(`${purchaseOrder.api}/product/${purchaseOrderData._id}/update`, { products: rows })
      .then(() => {
        setAddProductDialog(false);
        fetchData();
        setAddingProducts(false);
        setIsBulkEdit(false);
        if (saveAndNext) {
          const rowIndex = rowsData.findIndex((d) => d._id === rows[0]?._id);
          if (rowIndex < rowsData?.length - 1) {
            if (rowsData[rowIndex + 1]?.type === 'Product') {
              setShowProductDialog({ open: true, data: rowsData[rowIndex + 1], showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false });
            } else if (rowsData[rowIndex + 1]?.type === 'Service') {
              setShowProductDialog({ open: false, data: null, showSaveAndNext: false });
              setShowServiceDialog({ open: true, data: rowsData[rowIndex + 1], showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false });
            } else if (rowsData[rowIndex + 1]?.type === 'Manual Entry') {
              setShowProductDialog({ open: false, data: null, showSaveAndNext: false });
              setShowCostDialog({ open: true, data: rowsData[rowIndex + 1], showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false });
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
          const rowIndex = rowsData.findIndex((d) => d._id === rows[0]?._id);
          if (rowIndex < rowsData?.length - 1) {
            if (rowsData[rowIndex + 1]?.type === 'Product') {
              setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
              setShowProductDialog({ open: true, data: rowsData[rowIndex + 1], showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false });
            } else if (rowsData[rowIndex + 1]?.type === 'Service') {
              setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
              setShowServiceDialog({ open: true, data: rowsData[rowIndex + 1], showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false });
            } else if (rowsData[rowIndex + 1]?.type === 'Manual Entry') {
              setShowCostDialog({ open: true, data: rowsData[rowIndex + 1], showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false });
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
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddService = (rows) => {
    let tempServiceArray = rows?.map((d) => ({
      serviceId: d._id,
      qty: d.qty ? parseInt(d.qty) : 1,
      unit: d?.unitMain?.length ? d?.unitMain[0] : ''
    }));
    axiosInstance()
      .post(`${purchaseOrder.api}/service/${purchaseOrderData._id}/add`, { services: tempServiceArray })
      .then(() => {
        fetchData();
        setAddServiceDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateService = (rows, saveAndNext = false) => {
    setLoadingEdit(true);
    axiosInstance()
      .put(`${purchaseOrder.api}/service/${purchaseOrderData._id}/update`, { services: rows })
      .then(() => {
        fetchData();
        if (saveAndNext) {
          const rowIndex = rowsData.findIndex((d) => d._id === rows[0]?._id);
          if (rowIndex < rowsData?.length - 1) {
            if (rowsData[rowIndex + 1]?.type === 'Product') {
              setShowServiceDialog({ open: false, data: null, showSaveAndNext: false });
              setShowProductDialog({ open: true, data: rowsData[rowIndex + 1], showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false });
            } else if (rowsData[rowIndex + 1]?.type === 'Service') {
              setShowServiceDialog({ open: true, data: rowsData[rowIndex + 1], showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false });
            } else if (rowsData[rowIndex + 1]?.type === 'Manual Entry') {
              setShowServiceDialog({ open: false, data: null, showSaveAndNext: false });
              setShowCostDialog({ open: true, data: rowsData[rowIndex + 1], showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false });
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
      rows = await calculateRowsField(material, inputField, productFields, updatedData);
      handleUpdateQty(rows);
    } else if (rowData?.type === 'Service') {
      let rows: any = [{ ...rowData, ...updatedData }];
      rows = await calculateRowsField(material, inputField, serviceFields, updatedData);
      handleUpdateService(rows);
    } else if (rowData?.type === 'Manual Entry') {
      let rows: any = [{ ...rowData, ...updatedData }];
      rows = await calculateRowsField(material, inputField, costFields, updatedData);
      handleUpdateCost(rows);
    }
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <Box display="flex" justifyContent="space-between" m={1}>
          <Box display="flex" alignItems="center">
            <Button variant={'outlined'} color="primary" size="small" startIcon={<AddIcon />} onClick={openAddActions} aria-controls="add-menu">
              {'Add'}
              <ExpandMore fontSize="small" />
            </Button>
            <Menu
              anchorEl={addAnchorEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="add-menu"
              open={Boolean(addAnchorEl)}
              onClose={closeAddActions}
            >
              {permissions?.product?.isRead && (
                <MenuItem
                  onClick={() => {
                    closeAddActions();
                    setAddProductDialog(true);
                  }}
                >
                  Add Products
                </MenuItem>
              )}
              {permissions?.serviceMaster?.isRead && (
                <MenuItem
                  onClick={() => {
                    closeAddActions();
                    setAddServiceDialog(true);
                  }}
                >
                  Add Services
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  closeAddActions();
                  setShowCostDialog({ open: true, data: null, showSaveAndNext: false });
                }}
              >
                Add Manual Entry
              </MenuItem>
            </Menu>
          </Box>
          <div className="d-flex gap-2">
            <SendEmail purchaseOrderData={purchaseOrderData} />
            <HtmlTooltip title="Please select some product">
              <Button
                variant={'outlined'}
                color="default"
                size="small"
                onClick={openActions}
                disabled={selectedProducts?.filter((e) => !e.hideSelection)?.length ? false : true}
                aria-controls="action-menu"
              >
                {'Actions'}
                <ExpandMore fontSize="small" />
              </Button>
            </HtmlTooltip>
            <Menu
              anchorEl={anchorEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="action-menu"
              open={Boolean(anchorEl)}
              onClose={closeActions}
            >
              <MenuItem
                disabled={
                  selectedProducts?.filter((e) => !e.hideSelection).length > 0 &&
                  uniq(
                    map(
                      selectedProducts?.filter((e) => !e.hideSelection),
                      'type'
                    )
                  )?.length === 1
                    ? false
                    : true
                }
                onClick={() => {
                  closeActions();
                  setIsBulkEdit(true);
                  const typeUniq: any = uniq(
                    map(
                      selectedProducts?.filter((e) => !e.hideSelection),
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
                    closeActions();
                    setShowDeleteConfirmBox(true);
                    setDeletePurchaseOrderItem(selectedProducts?.filter((e) => !e.hideSelection));
                  }}
                >
                  Delete
                </MenuItem>
              )}
            </Menu>
          </div>
        </Box>
      )}
      {columns && rowsData ? (
        <Box zIndex={5} mt={2} width={'100%'} height={'calc(100vh - 393px)'}>
          <CustomReactTable
            height={'calc(100vh - 393px)'}
            columns={columns}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            onSelect={setSelectedProducts}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideSelection={!allowedToEdit}
            hideAction={!allowedToEdit}
            renderedFrom="purchase_order_product"
            isClientSideGrid={true}
            onSaveEdit={onSaveInlineEdit}
            hideExpander={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {addProductDialog && (
        <AssignProductDialog
          productsDialogOpen={addProductDialog}
          handleCloseDialog={() => setAddProductDialog(false)}
          reference="purchaseOrder"
          onSuccess={handleAddProduct}
          productId={null}
          assignedProducts={[]}
        />
      )}
      {showProductDialog.open && (
        <PurchaseOrderQtyDialog
          onClose={() => {
            setShowProductDialog({ open: false, data: null, showSaveAndNext: false });
            setIsBulkEdit(false);
          }}
          onSubmit={handleUpdateQty}
          productData={!isBulkEdit ? showProductDialog.data : selectedProducts?.filter((e) => !e.hideSelection)}
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
          serviceData={!isBulkEdit ? showServiceDialog.data : selectedProducts?.filter((e) => !e.hideSelection)}
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
          costData={!isBulkEdit ? showCostDialog.data : selectedProducts?.filter((e) => !e.hideSelection)}
          bulkEdit={isBulkEdit}
          showSaveAndNext={showCostDialog.showSaveAndNext}
          loadingEdit={loadingEdit}
        />
      )}
      {addServiceDialog && (
        <AssignServiceDialog
          reference={'purchaseOrder'}
          referenceId={purchaseOrderData?._id}
          onSuccess={(services) => {
            handleAddService(services);
          }}
          handleClose={() => {
            setAddServiceDialog(false);
          }}
          ids={[]}
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
