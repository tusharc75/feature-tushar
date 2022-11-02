import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, CircularProgress, Menu, MenuItem, Chip, MenuList, ListItemIcon, ListItemText } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import AddExistingProductInventory from './AddExistingProductInventory';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import Add from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import moment from 'moment';
import { repairOrder, dateFormat } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import RepairOrderQtyDialog from './RepairOrderQtyDialog';
import { fetch_repair_order_product_fields } from 'src/components/RepairOrder/helper';
import ManageSerializedAsset from 'src/pages/SerializedAsset/ManageSerializedAsset';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import { ExpandMore } from '@material-ui/icons';
import { sortBy } from 'lodash';

const Productpackage = ({
  repairOrderData,
  setNextStep,
  currencySymbol,
  isTabletScreen,
  isSmallScreen,
  showActivity,
  renderedFrom,
  stepFullScreen,
  allowedToEdit,
  allowedToDelete
}) => {

  const toastConfig = useContext(CustomToastContext);
  const { state: { user, permissions } }: any = useData();

  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });
  const [isAddingProducts, setAddingProducts] = useState(false);

  const [recordToUpdate, setRecordToUpdate] = useState(null);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null, existing: false });

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  const [anchorActionEl, setAnchorActionEl] = useState(null);


  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchData();
  }, [columns]);

  const fetchFields = async () => {
    //var data = await fetch_repair_order_product_fields(repairOrderData?.currency);
    const coloum: any = [
      {
        accessor: 'srno',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>
      },
      {
        accessor: 'detail',
        Header: 'Asset Details',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {!allowedToEdit ? (
              <p>{row.original.detail}</p>
            ) : (
              <p
                // onClick={() => {
                //   handleOpen(row.original);
                // }}
                //className="link text-truncate"
                title={row.original.detail}
              >
                {row.original.detail}
              </p>
            )}
            {
              <Box ml={1} className="d-flex align-items-center">
                <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                  {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
                </span>
                {/* {allowedToEdit && (
                  <HtmlTooltip title="Add Products">
                    <IconButton
                      onClick={() => setAddExistingProductDialog({ open: true, type: 'product', parentId: row.original?._id, existing: true })}
                      size="small"
                      color="primary"
                    >
                      <Add color="disabled" fontSize="small" />
                    </IconButton>
                  </HtmlTooltip>
                )} */}
              </Box>
            }
            <Chip
              className="ml-1"
              label={`${row.original.type === 'service' ? 'Service' : row.original.type === 'product' ? 'Product' : row.original.type === 'serializedAsset' ? 'Asset' : 'Package'}`}
              size="small"
              color="primary"
              onClick={() => {
                window.open(
                  `${row.original.type === 'service'
                    ? routes.serviceMasterDetail.path
                    : row.original.type === 'product'
                      ? routes.productDetail.path
                      : row.original.type === 'serializedAsset'
                        ? routes.serializedAssetDetail.path
                        : routes.packagesDetail.path
                  }/${row.original.materialId}`
                );
              }}
            />
          </div>
        ),
        Footer: () => {
          return <>Total</>;
        }
      }
    ];

    coloum.push({
      accessor: 'action',
      Header: '',
      minWidth: 70,
      width: 70,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => (
        <>
          {!row.original.hideSelection && allowedToDelete && row.original?.allowedToDelete && (
            <IconButton
              size="small"
              aria-label="Details"
              onClick={() => {
                const obj: any = [row.original._id];
                setDeleteData(obj);
              }}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          )}
        </>
      )
    })

    coloum.forEach((element) => {
      if (element.accessor === 'qty') {
        element['Footer'] = (info) => {
          const qtyTotal = info.rows
            .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
            .reduce((sum, row) => row.values[element.accessor] + sum, 0);
          return <>{qtyTotal}</>;
        };
      }
    });

    setColumns(coloum);
  };

  const fetchData = async () => {
    setNextStep(false);

    var data: any = [];
    const response = await axiosInstance().get(`${repairOrder.api}/${repairOrderData._id}/product-package`);
    data = response?.data?.data;

    setMaterial(JSON.parse(JSON.stringify(data.material)));

    const rows = data.material.filter((e) => e.parentId === null);

    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${parent.type === 'service' ? parent.serviceDetail?.serviceName : parent.type === 'product' ? parent.productDetail?.productName :
        parent.type === 'serializedAsset' ? parent.serializedAssetDetail.assetNumber : parent.packageDetail?.packageName}`;
      parent.qtyDisplay = parent.qty;
      parent.isValid = true;
      parent.allowedToDelete = parent.workOrder ? false : true;
      parent.subRows = generateNestedData(data.material, parent);
    });

    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(false);
    } else {
      setNextStep(true);
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    let productIndex = 0;
    let serviceIndex = 0;
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + `${_subRow.type === 'service' ? alphabet[serviceIndex] : (productIndex + 1)}`;
      _subRow.detail = `${_subRow.type === 'service' ? _subRow.serviceDetail?.serviceName : _subRow.type === 'product' ? _subRow.productDetail?.productName :
        _subRow.type === 'serializedAsset' ? _subRow.serializedAssetDetail.assetNumber : _subRow.packageDetail?.packageName}`;
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.isValid = true;
      _subRow.allowedToDelete = false;
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.type === 'service' ? serviceIndex++ : productIndex++
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return sortBy(subRows, ['type']);
  };

  const getNestedSubRows = (obj, original) => {
    if (original?.subRows?.length) {
      original?.subRows.forEach((element) => {
        obj.push({ id: element._id, type: element.type, materialId: element.materialId });
        getNestedSubRows(obj, element);
      });
    }
  };

  const handleAdd = async (rows) => {
    setAddingProducts(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addExistingProductDialog.type;
      element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addExistingProductDialog.parentId;
      material.push(element);
    });
    axiosInstance()
      .post(`${repairOrder.api}/${repairOrderData._id}/product-package`, { material })
      .then(() => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false });
        fetchData();
        setAddingProducts(false);
      })
      .catch((error) => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false });
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
      });
  };

  const handleSaveData = async (rows: any) => {
    rows.forEach((element) => {
      delete element.srno;
      delete element.detail;
      delete element.serializedProduct;
      delete element.qtyDisplay;
      delete element.isValid;
      delete element.hideSelection;
      delete element.assetQty;
      delete element.productDetail;
      delete element.packageDetail;
      delete element.subRows;
    });
    setUpdating(true);
    axiosInstance()
      .put(`${repairOrder.api}/${repairOrderData._id}/product-package`, { material: rows })
      .then(() => {
        setUpdating(false);
        setIsProductEdit({ open: false, isBulkedit: false });
        fetchData();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${repairOrder.api}/${repairOrderData?._id}/product-package/delete`, { ids: rows })
      .then(() => {
        setDeleting(false);
        fetchData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const handleOpen = (rowData) => {
    setIsProductEdit({ open: true, isBulkedit: false });
    setRecordToUpdate(rowData);
  };

  const handleDeleteMultiple = () => {
    const obj: any = [];
    const dataToDelete = selectedProducts && selectedProducts.filter((e) => !e.hideSelection);
    dataToDelete?.forEach((ele) => {
      obj.push(ele._id);
    });
    dataToDelete?.forEach((ele) => {
      getNestedSubRows(obj, ele);
    });
    setDeleteData(obj);
  };

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  return (
    <Fragment>
      <Grid container spacing={2}>
        {allowedToEdit && (
          <Grid item xs={12} md={12} sm={12}>
            <Box display="flex" justifyContent="space-between" m={1} mb={0}>
              <Box display="flex">
                {/* {permissions?.product?.isRead &&
                  <Button
                    color="primary"
                    size="small"
                    variant={isMobile && !isTablet ? "outlined" : "contained"}
                    style={isMobile && !isTablet ? { color: "var(--info-dark)" } : {}}
                    onClick={() => {
                      setAddExistingProductDialog({ open: true, type: 'product', parentId: null });
                    }}
                  >
                    {isMobile && !isTablet ? 'Product' : `Add ${routes.product.title}`}
                  </Button>
                }
                <Box mx={isMobile ? 0.5 : 1} />
                {permissions?.packages?.isRead &&
                  <Button
                    color="primary"
                    size="small"
                    variant={isMobile && !isTablet ? "outlined" : "contained"}
                    style={isMobile && !isTablet ? { color: "var(--info-dark)" } : {}}
                    onClick={() => {
                      setAddExistingProductDialog({ open: true, type: 'package', parentId: null });
                    }}
                  >
                    {isMobile && !isTablet ? 'Package' : `Add ${routes.packages.title}`}
                  </Button>
                } */}
                {permissions?.serializedAsset?.isRead && allowedToEdit && (
                  <>
                    <Button
                      color="primary"
                      size="small"
                      variant={isMobile && !isTablet ? 'outlined' : 'contained'}
                      style={isMobile && !isTablet ? { color: 'var(--info-dark)' } : {}}
                      onClick={() => {
                        setAddExistingProductDialog({ open: true, type: 'serializedAsset', parentId: null, existing: false });
                      }}
                    >
                      {`Create ${routes.serializedAsset.title}`}
                    </Button>
                    <Box ml={1} />
                    <Button
                      color="primary"
                      size="small"
                      variant={isMobile && !isTablet ? 'outlined' : 'contained'}
                      style={isMobile && !isTablet ? { color: 'var(--info-dark)' } : {}}
                      onClick={() => {
                        setAddExistingProductDialog({ open: true, type: 'serializedAsset', parentId: null, existing: true })
                      }}
                    >
                      {`Add Existing ${routes.serializedAsset.title}`}
                    </Button>
                  </>
                )}
              </Box>
              <Box display="flex">
                <Button
                  variant="outlined"
                  color="default"
                  size="small"
                  onClick={openActions}
                  aria-controls="action-menu"
                  disabled={(selectedProducts.length === 0)}
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
                    disabled={!allowedToDelete}
                    onClick={() => {
                      closeActions()
                      handleDeleteMultiple();
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          </Grid>
        )}
        <Grid item xs={12} md={12} sm={12}>
          {columns && rowsData ? (
            <Box
              zIndex={5}
              width={
                stepFullScreen
                  ? '100%'
                  : isTabletScreen
                    ? 'calc(100vw)'
                    : isSmallScreen
                      ? 'calc(100vw)'
                      : showActivity
                        ? '100%'
                        : 'calc(100vw - 103px)'
              }
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
            >
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
                columns={columns}
                data={rowsData}
                setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
                onSelect={setSelectedProducts}
                childrenProperty="subRows"
                uniqueKey="_id"
                hideSelection={!allowedToEdit}
                renderedFrom="repair_order_product_package"
                isClientSideGrid={true}
              />
            </Box>
          ) : (
            <Box p={2} height={500} bgcolor="white">
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete the record(s)?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}
      {isProductEdit.open && (
        <RepairOrderQtyDialog
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false });
            setRecordToUpdate(null);
          }}
          isBulkedit={isProductEdit.isBulkedit}
          handleSaveData={handleSaveData}
          repairOrderData={repairOrderData}
          rowData={recordToUpdate}
          material={material}
          selectedProducts={selectedProducts}
          loading={isUpdating}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type !== 'serializedAsset' && (
        <AddExistingProductInventory
          renderedFrom={addExistingProductDialog?.type === 'product' ? `${renderedFrom}-product` : `${renderedFrom}-package`}
          isAddingProducts={isAddingProducts}
          addProductInventory={handleAdd}
          handleProductInventoryClose={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false });
          }}
          productInventory={[]}
          type={addExistingProductDialog.type}
          repairOrderData={repairOrderData}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.existing === false && addExistingProductDialog.type === 'serializedAsset' && (
        <ManageSerializedAsset
          onClose={() => setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false })}
          referenceType={"repairOrder"}
          referenceData={{
            customerAccount: repairOrderData?.customerAccount?.optionValue,
            warehouse: repairOrderData?.warehouse?.optionValue
          }}
          onSuccess={(data) => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false });
            handleAdd([data]);
          }}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.existing && addExistingProductDialog.type === 'serializedAsset' && (
        <AssignSerializedAssetDialog
          reference="repairOrder"
          referenceId={repairOrderData?._id}
          handleClose={() => setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false })}
          ids={[...rowsData?.filter((e) => e.type === "serializedAsset")?.map((e: any) => e?.serializedAssetDetail?._id)]}
          referenceData={{
            customerAccount: repairOrderData?.customerAccount?.optionValue,
            warehouse: repairOrderData?.warehouse?.optionValue
          }}
          handleSucess={handleAdd}
        />
      )}
    </Fragment>
  );
};

export default Productpackage;
