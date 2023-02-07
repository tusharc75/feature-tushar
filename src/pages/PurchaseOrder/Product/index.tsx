import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Box, Button, IconButton, MenuItem, Menu } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { purchaseOrder } from 'src/constants/helpers';
import AddExistingProductInventory from '../../Sublease/Productpackage/AddExistingProductInventory';
import GridDeleteIcon from 'src/components/Helpers/GridDeleteIcon';
import PurchaseOrderQtyDialog from './PurchaseOrderQtyDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { prepareDataForGrid } from 'src/constants/helpers';
import { genrateCustomTableColumns } from 'src/constants/columns';
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

const Product = ({ purchaseOrderData, setNextStep, renderedFrom, allowedToEdit: hasPermission, checkReceivedProduct }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const allowedToEdit = hasPermission && permissions?.purchaseOrder.isUpdate;

  const [addProductDialog, setAddProductDialog] = useState(false);
  const [isAddingProducts, setAddingProducts] = useState(false);

  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showInventoryStatesDialog, setShowInventoryStatesDialog] = useState({ open: false, product: null, qty: 0 });
  const [showServiceDialog, setShowServiceDialog] = useState(false);

  const [showCostDialog, setShowCostDialog] = useState(false);
  const [showUpdateServiceDialog, setShowUpdateServiceDialog] = useState(false);

  const [selectedCostData, setSelectedCostData] = useState(null);
  const [selectedServiceData, setSelectedServiceData] = useState(null);

  const [selectedProductData, setSelectedProductData] = useState(null);
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
      ['productName', 'productCategory', 'productNumber', 'productDescription', 'serializedProduct'].includes(e?.fieldData?.fieldName)
    );
    columns.push({
      accessor: 'index',
      Header: 'Index',
      width: 50,
      primaryField: true,
      Cell: ({ row }) => {
        return row.original['index'] ? <p className="text-truncate">{row.original.index}</p> : <NoDataCell />;
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
    productFields?.forEach((e) => {
      if (e?.fieldData?.fieldName === 'productName') {
        columns.push({
          accessor: 'detail',
          Header: "Detail",
          minWidth: 200,
          width: 200,
          primaryField: true,
          Cell: ({ row }) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {!allowedToEdit ? (
                <p className='text-truncate'> {row.original.detail}</p>
              ) : (
                <p
                  onClick={() => {
                    if (row.original.type === 'Product') {
                      setShowProductDialog(true);
                      setSelectedProductData(row.original);
                    }
                    if (row.original.type === 'Service') {
                      setShowUpdateServiceDialog(true);
                      setSelectedServiceData(row.original);
                    }
                    if (row.original.type === 'Expense') {
                      setShowCostDialog(true);
                      setSelectedCostData(row.original);
                    }
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
          ),
          Footer: () => {
            return <>Total</>;
          }
        });
      }
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
      if (e?.fieldData?.fieldName === 'productDescription') {
        columns.push({
          accessor: 'productDescription',
          Header: e?.fieldData?.fieldLabel,
          width: 200,
          Cell: ({ row }) => {
            return row.original['productDescription'] ? <p className="text-truncate">{row.original.productDescription}</p> : <NoDataCell />;
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
    });
    const p_fields = await fetch_po_product_fields(purchaseOrderData?.currency);
    const s_fields = await fetch_po_service_fields(purchaseOrderData?.currency);
    setServiceFields(s_fields)
    const c_fields = await fetch_po_cost_fields(purchaseOrderData?.currency);
    setCostFields(c_fields)

    p_fields.forEach((element) => {
      if (element.fieldName === 'price' && element.required) {
        setIsRateRequired(true);
      }
    });

    setProductFields(JSON.parse(JSON.stringify(p_fields)));
    const newColumns = genrateCustomTableColumns(p_fields, purchaseOrderData?.currency, renderedFrom);
    columns = [...columns, ...newColumns];
    columns.push({
      accessor: 'action',
      Header: '',
      minWidth: 50,
      width: 50,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => {
        return allowedToEdit ? (
          <>
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
                  setDeletePurchaseOrderItem([row.original])
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
      })
    }
    setColumns([...columns]);
  };

  const fetchData = async () => {
    setNextStep(false);

    const productResponce: any = await axiosInstance().get(`${purchaseOrder.api}/product/${purchaseOrderData._id}`);
    const serviceResponse: any = await axiosInstance().get(`${purchaseOrder.api}/service/${purchaseOrderData._id}`);
    const costResponce: any = await axiosInstance().get(`${purchaseOrder.api}/cost/${purchaseOrderData._id}`);

    const data = [
      ...(productResponce?.data?.data?.length && productResponce?.data?.data?.map((e: any) => {
        return { ...e, type: 'Product' };
      }) || []),
      ...((serviceResponse?.data?.data?.length &&
        serviceResponse?.data?.data?.map((e: any) => {
          return { ...e, type: 'Service' };
        })) ||
        []),
      ...((costResponce?.data?.data?.length &&
        costResponce?.data?.data?.map((e: any) => {
          return { ...e, type: 'Expense' };
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
      res.detail = item.type === 'Product' ? item?.productDetail?.productName : item.type === 'Service' ? item?.serviceDetail?.serviceName : item?.description
      res.materialId = item.type === 'Product' ? item?.productDetail?._id : item.type === 'Service' ? item?.serviceDetail?._id : item?._id
      res.productNumber = item.productDetail?.productNumber;
      res.productDescription = item.productDetail?.productDescription || item.productDetail?.productDesc;
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
        setAddProductDialog(false);
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
      });
  };

  const handleUpdateQty = (rows) => {
    axiosInstance()
      .put(`${purchaseOrder.api}/product/${purchaseOrderData._id}/update`, { products: rows })
      .then(() => {
        setAddProductDialog(false);
        fetchData();
        setSelectedProductData(null);
        setAddingProducts(false);
        setShowProductDialog(false);
        setIsBulkEdit(false);
      })
      .catch((error) => {
        setAddProductDialog(false);
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
      });
  };

  const handleDelete = async () => {
    const product = deletePurchaseOrderItem?.filter((e) => e.type === "Product");
    const service = deletePurchaseOrderItem?.filter((e) => e.type === "Service");
    const cost = deletePurchaseOrderItem?.filter((e) => e.type === "Expense");

    if (product?.length) {
      await axiosInstance().post(`${purchaseOrder.api}/product/${purchaseOrderData._id}/delete`, { ids: product?.map((e) => e._id) })
    }
    if (service?.length) {
      await axiosInstance().post(`${purchaseOrder.api}/service/${purchaseOrderData._id}/delete`, { ids: service?.map((e) => e._id) })
    }
    if (cost?.length) {
      await axiosInstance().post(`${purchaseOrder.api}/cost/${purchaseOrderData._id}/delete`, { ids: cost?.map((e) => e._id) })
    }
    fetchData();
    setShowDeleteConfirmBox(false);
    setDeletePurchaseOrderItem([]);
  };

  const handleAddCost = (rows) => {
    axiosInstance()
      .post(`${purchaseOrder.api}/cost/${purchaseOrderData._id}/add`, { additionalCost: rows })
      .then(() => {
        fetchData();
        setShowCostDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateCost = (rows) => {
    axiosInstance()
      .put(`${purchaseOrder.api}/cost/${purchaseOrderData._id}/update`, { additionalCost: rows })
      .then(() => {
        fetchData();
        setShowCostDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddService = (rows) => {
    let tempServiceArray = rows?.map((d) => ({
      serviceId: d._id,
      qty: d.qty ? parseInt(d.qty) : 1,
      unit: d?.unitMain?.length ? d?.unitMain[0] : '',
    }));
    axiosInstance()
      .post(`${purchaseOrder.api}/service/${purchaseOrderData._id}/add`, { services: tempServiceArray })
      .then(() => {
        fetchData();
        setShowServiceDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateService = (rows) => {
    axiosInstance()
      .put(`${purchaseOrder.api}/service/${purchaseOrderData._id}/update`, { services: rows })
      .then(() => {
        fetchData();
        setShowUpdateServiceDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = material.find((d) => d._id === updatedData._id);
    if (rowData?.type === "Product") {
      let rows: any = [{ ...rowData, ...updatedData }];
      rows = await calculateRowsField(material, inputField, productFields, updatedData);
      handleUpdateQty(rows);
    }
    else if (rowData?.type === "Service") {
      let rows: any = [{ ...rowData, ...updatedData }];
      rows = await calculateRowsField(material, inputField, serviceFields, updatedData);
      handleUpdateService(rows);
    }
    else if (rowData?.type === "Expense") {
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
              {permissions?.product?.isRead &&
                <MenuItem
                  onClick={() => {
                    closeAddActions();
                    setAddProductDialog(true);
                  }}
                >
                  Add Products
                </MenuItem>}
              {permissions?.serviceMaster?.isRead &&
                <MenuItem
                  onClick={() => {
                    closeAddActions();
                    setShowServiceDialog(true);
                  }}
                >
                  Add Services
                </MenuItem>}
              <MenuItem
                onClick={() => {
                  closeAddActions();
                  setShowCostDialog(true);
                  setSelectedCostData(null);
                }}
              >
                Add Expense
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
                disabled={selectedProducts.length ? false : true}
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
                disabled={selectedProducts.length > 0 && uniq(map(selectedProducts, 'type'))?.length === 1 ? false : true}
                onClick={() => {
                  closeActions();
                  setIsBulkEdit(true);
                  const typeUniq: any = uniq(map(selectedProducts, 'type'));
                  if (typeUniq[0] === "Product") {
                    setShowProductDialog(true);
                  }
                  else if (typeUniq[0] === "Service") {
                    setShowUpdateServiceDialog(true);
                  }
                  else {
                    setShowCostDialog(true);
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
                    setDeletePurchaseOrderItem(selectedProducts)
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
            renderedFrom="purchase_order_product"
            isClientSideGrid={true}
            onSaveEdit={onSaveInlineEdit}
            material={material}
            hideExpander={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {addProductDialog && (
        <AddExistingProductInventory
          isAddingProducts={isAddingProducts}
          addProductInventory={handleAddProduct}
          handleProductInventoryClose={() => {
            setAddProductDialog(false);
          }}
          type={'product'}
          refrenceType="purchaseOrder"
          renderedFrom={renderedFrom}
          ignoreIds={[]}
        />
      )}
      {showProductDialog && (
        <PurchaseOrderQtyDialog
          onClose={() => {
            setShowProductDialog(false);
            setIsBulkEdit(false);
            setSelectedProductData(null);
          }}
          onSubmit={handleUpdateQty}
          productData={!isBulkEdit ? selectedProductData : selectedProducts}
          bulkEdit={isBulkEdit}
          purchaseOrderData={purchaseOrderData}
          nextRowData={null}
        />
      )}
      {showUpdateServiceDialog && (
        <ServiceDialog
          onClose={() => {
            setShowUpdateServiceDialog(false);
            setIsBulkEdit(false);
            setSelectedServiceData(null);
          }}
          handleUpdateService={handleUpdateService}
          purchaseOrderData={purchaseOrderData}
          serviceData={!isBulkEdit ? selectedServiceData : selectedProducts}
          bulkEdit={isBulkEdit}
        />
      )}
      {showServiceDialog && (
        <AssignServiceDialog
          reference={'purchaseOrder'}
          referenceId={purchaseOrderData?._id}
          onSuccess={(services) => {
            handleAddService(services);
          }}
          handleClose={() => {
            setShowServiceDialog(false);
          }}
          ids={[]}
        />
      )}
      {showCostDialog && (
        <CostDialog
          onClose={() => {
            setShowCostDialog(false);
            setIsBulkEdit(false);
            setSelectedCostData(null);
          }}
          handleAddCost={handleAddCost}
          handleUpdateCost={handleUpdateCost}
          purchaseOrderData={purchaseOrderData}
          costData={!isBulkEdit ? selectedCostData : selectedProducts}
          bulkEdit={isBulkEdit}
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
