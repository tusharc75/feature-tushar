import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import {
  Grid,
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Tab,
  Tabs,
  ButtonGroup,
  Container,
  InputAdornment,
  TextField,
  MenuItem,
  Menu
} from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { purchaseOrder, PURCHASE_ORDER_STATUS } from 'src/constants/helpers';
import EditIcon from '@material-ui/icons/Edit';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import { CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import AddExistingProductInventory from '../../Sublease/Productpackage/AddExistingProductInventory';
import GridDeleteIcon from 'src/components/Helpers/GridDeleteIcon';
import CreateProduct from 'src/components/Product/CreateProduct';
import CustomAgGridEditable from 'src/components/AgGridComponents/CustomAgGridEditable';
import PurchaseOrderQtyDialog from './PurchaseOrderQtyDialog';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { prepareDataForGrid } from 'src/constants/helpers';
import { genrateCustomTableColumns } from 'src/constants/columns';
import { ExpandMore } from '@material-ui/icons';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { fetch_po_product_fields } from '../../../components/PurchaseOrder/helper';
import SendEmail from './../SendEmail';
import { FaEye } from 'react-icons/fa';
import InventoryStatesDialog from './InventoryStatesDialog';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import ServiceDialog from '../Service/ServiceDialog';

const Product = ({
  purchaseOrderData,
  setNextStep,
  setPurchaseOrderProduct,
  renderedFrom,
  allowedToEdit: hasPermission,
  updateStatus,
  checkReceivedProduct
}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const allowedToEdit = hasPermission && permissions?.purchaseOrder.isUpdate;

  const [addProductDialog, setAddProductDialog] = useState(false);
  const [isAddingProducts, setAddingProducts] = useState(false);
  const [isAddNewProduct, setIsAddNewProduct] = useState(false);

  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showInventoryStatesDialog, setShowInventoryStatesDialog] = useState({ open: false, product: null, qty: 0 });
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [selectedServiceData, setSelectedServiceData] = useState(null);
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const [anchorEl, setAnchorEl] = useState(null);
  const [addAnchorEl, setAddAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showServiceDeleteConfirmBox, setShowServiceDeleteConfirmBox] = useState(false);
  const [deletePurchaseOrderProduct, setDeletePurchaseOrderProduct] = useState([]);
  const [deletePurchaseOrderService, setDeletePurchaseOrderService] = useState([]);

  const [isRateRequired, setIsRateRequired] = useState(false);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [material, setMaterial] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchPurchaseOrderProduct();
  }, [columns]);

  const fetchFields = async () => {
    let columns: any = [];
    const productResult = await axiosInstance().get('/field?resource=Product&view=true');
    const productFields = productResult?.data?.data?.filter((e) =>
      ['productName', 'productCategory', 'productNumber', 'productDescription', 'serializedProduct'].includes(e?.fieldData?.fieldName)
    );
    productFields?.forEach((e) => {
      if (e?.fieldData?.fieldName === 'productName') {
        columns.push({
          accessor: 'type',
          Header: 'Type',
          width: 200,
          sticky: isMobile ? 'none' : 'left',
          Cell: ({ row }) => {
            return row.original['type'] ? <p className="text-truncate">{row.original.type}</p> : <NoDataCell />;
          }
        });
        columns.push({
          accessor: 'productName',
          Header: e?.fieldData?.fieldLabel,
          minWidth: 200,
          width: 200,
          Cell: ({ row }) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {!allowedToEdit ? (
                <p> {row.original.productName}</p>
              ) : (
                <p
                  onClick={() => {
                    row.original.type === 'Product' ? setShowProductDialog(true) : setShowServiceDialog(true);
                    row.original.type === 'Product' ? setSelectedProductData(row.original) : setSelectedServiceData(row.original);
                  }}
                  className="link text-truncate"
                  title={row.original.detail}
                >
                  {row.original.productName}
                </p>
              )}
              <Box ml={1} />
              {row.original.type === 'Product' && (
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.productDetail.path}/${row.original?.productId}`);
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
    const fields = await fetch_po_product_fields(purchaseOrderData?.currency);
    fields.forEach((element) => {
      if (element.fieldName === 'price' && element.required) {
        setIsRateRequired(true);
      }
    });
    setAllFields(JSON.parse(JSON.stringify(fields)));
    const newColumns = genrateCustomTableColumns(fields, purchaseOrderData?.currency, renderedFrom);
    let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
    if (qtyIndex > -1) {
      newColumns[qtyIndex].accessor = 'qtyDisplay';
    }
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
            {permissions?.irtTicket?.isCreate && (
              <HtmlTooltip title="Inventory States">
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="Inventory"
                  onClick={() => {
                    setShowInventoryStatesDialog({
                      open: true,
                      product: row.original?.type === 'Product' ? row.original?.productDetail?._id : row.original?._id,
                      qty: row.original?.qty
                    });
                  }}
                >
                  <FaEye color="primary" />
                </IconButton>
              </HtmlTooltip>
            )}
            {(row.original?.actualReceived === undefined || row.original?.actualReceived === 0) && (
              <GridDeleteIcon
                hasDeletePermission={permissions?.purchaseOrder?.isUpdate}
                ownerId={user?.user?._id}
                userId={user?.user?._id}
                onDelete={() => {
                  {row.original.type === 'Product' ? setShowDeleteConfirmBox(true) : setShowServiceDeleteConfirmBox(true)};
                  {row.original.type === 'Product'
                    ? setDeletePurchaseOrderProduct([row.original?._id])
                    : setDeletePurchaseOrderService([row.original?._id])};
                }}
                entity="rentalManagement"
              />
            )}
          </>
        ) : null;
      }
    });
    setColumns([...columns]);
  };

  const fetchPurchaseOrderProduct = async () => {
    setNextStep(false);
    const services: any = await axiosInstance().get(`${purchaseOrder.api}/service/${purchaseOrderData._id}`);
    axiosInstance()
      .get(`${purchaseOrder.api}/product/${purchaseOrderData._id}`)
      .then(({ data: { data } }) => {
        setPurchaseOrderProduct(JSON.parse(JSON.stringify(data)));
        setMaterial(JSON.parse(JSON.stringify(data)));
        let rows = [...data, ...services?.data?.data]?.map((item, index) => {
          let finalObject = prepareDataForGrid(item);
          finalObject['isChecked'] = selectedProducts.some((s) => s._id === item._id);
          finalObject['allowedToEdit'] = allowedToEdit;
          let res: any = {
            ...finalObject
          };
          res.productName = item.productDetail?.productName || item?.description;
          res.type = item.productDetail ? 'Product' : 'Cost';
          res.productNumber = item.productDetail?.productNumber;
          res.productDescription = item.productDetail?.productDescription || item.productDetail?.productDesc;
          res.serializedProduct = item.productDetail?.serializedProduct;
          res.serializedProductView = item.productDetail?.serializedProduct ? 'Yes' : 'No';
          res.productCategory = item.productDetail?.productCategory?.optionLabel;
          res.productDetail = item.productDetail;
          res.parentId = null;
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
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
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
        fetchPurchaseOrderProduct();
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
        fetchPurchaseOrderProduct();
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

  const handleDelete = () => {
    axiosInstance()
      .post(`${purchaseOrder.api}/product/${purchaseOrderData._id}/delete`, { ids: deletePurchaseOrderProduct })
      .then(() => {
        fetchPurchaseOrderProduct();
        setShowDeleteConfirmBox(false);
        setDeletePurchaseOrderProduct([]);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddService = (rows) => {
    axiosInstance()
      .post(`${purchaseOrder.api}/service/${purchaseOrderData._id}/add`, { services: rows })
      .then(() => {
        fetchPurchaseOrderProduct();
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
        fetchPurchaseOrderProduct();
        setShowServiceDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };
  const handleDeleteService = () => {
    axiosInstance()
      .post(`${purchaseOrder.api}/service/${purchaseOrderData._id}/delete`, { ids: deletePurchaseOrderService })
      .then(() => {
        fetchPurchaseOrderProduct();
        setShowServiceDeleteConfirmBox(false);
        setDeletePurchaseOrderService([]);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = material.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qtyDisplay')) {
      inputField['qty'] = inputField['qtyDisplay'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(material, inputField, allFields, updatedData);
    handleUpdateQty(rows);
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <Box display="flex" justifyContent="space-between" m={1}>
          <Box display="flex" alignItems="center">
            <HtmlTooltip title="Add Products and Services">
              <Button variant={'outlined'} color="default" size="small" onClick={openAddActions} aria-controls="add-menu">
                {'Add'}
                <ExpandMore fontSize="small" />
              </Button>
            </HtmlTooltip>
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
              {permissions?.product?.isCreate ? (
                <MenuItem
                  onClick={() => {
                    closeAddActions();
                    setIsAddNewProduct(true);
                  }}
                >
                  {isMobile && !isTablet ? 'Add' : `Add New Product`}
                </MenuItem>
              ) : null}
              <MenuItem
                onClick={() => {
                  closeAddActions();
                  setAddProductDialog(true);
                }}
              >
                {isMobile && !isTablet ? 'Existing' : `Add Existing Product`}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  closeAddActions();
                  setShowServiceDialog(true);
                  setSelectedServiceData(null);
                }}
              >
                Add Services and Consumables
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
                disabled={selectedProducts.length === 0}
                onClick={() => {
                  closeActions();
                  setIsBulkEdit(true);
                  setShowProductDialog(true);
                }}
              >
                Bulk Edit
              </MenuItem>
              {permissions?.purchaseOrder?.isDelete && (
                <MenuItem
                  onClick={() => {
                    closeActions();
                    setShowDeleteConfirmBox(true);
                    setDeletePurchaseOrderProduct(selectedProducts.map((d) => d._id));
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
          //ignoreIds={dataRows?.map((e) => e?.productId)}
          ignoreIds={[]}
        />
      )}
      {isAddNewProduct && (
        <CreateProduct
          isClone={false}
          productId={null}
          handleClose={() => setIsAddNewProduct(false)}
          isAddInBuilder={true}
          addProductInBuilder={(rows: any) => {
            rows?.forEach((element) => {
              element.unitMain = element?.unit;
            });
            handleAddProduct(rows);
          }}
          openFrom="builder"
          fromQuote={true}
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
          // currency={purchaseOrderData?.currency}
          nextRowData={purchaseOrderData?.currency}
          productData={!isBulkEdit ? selectedProductData : selectedProducts}
          bulkEdit={isBulkEdit}
          purchaseOrderData={purchaseOrderData}
        />
      )}
      {showServiceDialog && (
        <ServiceDialog
          onClose={() => {
            setShowServiceDialog(false);
            setSelectedServiceData(null);
          }}
          handleAddService={handleAddService}
          handleUpdateService={handleUpdateService}
          currency={purchaseOrderData?.currency}
          serviceData={selectedServiceData}
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
      {showServiceDeleteConfirmBox && (
        <ConfirmationDialog
          open={showServiceDeleteConfirmBox}
          message={`Are you sure you want to delete  ? `}
          onClose={() => setShowServiceDeleteConfirmBox(false)}
          onOk={handleDeleteService}
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
