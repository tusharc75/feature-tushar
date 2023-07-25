import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, Menu, MenuItem, Popover, MenuList } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import AddExistingProductInventory from './AddExistingProductInventory';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import DeleteIcon from '@material-ui/icons/Delete';
import { REPAIR_ORDER_TYPE, repairOrder, serializedAsset } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import RepairOrderQtyDialog from './RepairOrderQtyDialog';
import ManageSerializedAsset from 'src/pages/SerializedAsset/ManageSerializedAsset';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import { ExpandMore } from '@material-ui/icons';
import Add from '@material-ui/icons/Add';
import { capitalize, sortBy, startCase } from 'lodash';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { getNestedSubRows } from 'src/components/RentalManagment/helper';

const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const Productpackage = ({
  fetchRepairOrderData,
  repairOrderData,
  setNextStep,
  renderedFrom,
  stepFullScreen,
  allowedToEdit,
  allowedToDelete,
  setHasAssetsAdded
}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });
  const [isAddingProducts, setAddingProducts] = useState(false);

  const [recordToUpdate, setRecordToUpdate] = useState(null);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null, existing: false, productId: null, productCategory: null });
  const [addchildDialog, setAddchildDialog] = useState({ open: false, parentId: null, top: null, bottom: null, productId: null, productCategory: null });

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [addAnchorEl, setAddAnchorEl] = useState(null);
  

  useEffect(() => {
    fetchFields();
  }, [repairOrderData]);

  useEffect(() => {
    fetchData();
  }, [columns]);

  const fetchFields = async () => {
    setColumns(null);
    const coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.type === 'serializedAsset' ? 'Asset' : capitalize(row.original.type)}</p>
      },
      {
        accessor: 'detail',
        Header: 'Details',
        width: 250,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p className="text-truncate">{row.original.detail}</p>
            <Box ml={1} className="d-flex align-items-center">
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === 'service') {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'product') {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'serializedAsset') {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            </Box>
             <Box ml={1} className="d-flex align-items-center">
              <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
              </span>
              {allowedToEdit && row.original.type !== 'serializedAsset' && (
                <HtmlTooltip title={ row.original.type === 'package' ? `Add Product` : `Add` }>
                  <IconButton
                    onClick={(event) => {
                      row.original.type === 'product'
                        ? setAddchildDialog({ open: true, parentId: row.original?._id, top: event.clientY, bottom: event.clientX, productId: row?.original?.productDetail._id, productCategory: row?.original?.productDetail?.productCategory })
                        : setAddExistingProductDialog({ open: true, type: 'product', parentId: row.original?._id, existing: false, productId: null, productCategory: null });
                    }}
                    size="small"
                  >
                    <Add color="disabled" fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
              )}
            </Box>
          </div>
        )
      },
      {
        accessor: 'productName',
        Header: 'Product',
        width: 200,
        Cell: ({ row }) => (
          <div className="d-flex gap-2 align-items-center">
            {row.original?.productName ? (
              row.original?.productId ? (
                <>
                  <p className="text-truncate">{row.original?.productName}</p>
                  <Box ml={1}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        window.open(`${routes.productDetail.path}/${row.original?.productId}`);
                      }}
                    >
                      <OpenInNewIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Box>
                </>
              ) : (
                row.original?.productName
              )
            ) : (
              <NoDataCell />
            )}
          </div>
        )
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
        accessor: 'status',
        Header: 'Status',
        width: 100,
        Cell: ({ row }) => (row.original['status'] ? <p> {row.original.status}</p> : <NoDataCell />)
      }
    ];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 70,
      width: 70,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => (
        <>
          <HtmlTooltip title={allowedToDelete && row.original?.canDelete ? 'Deletion not allowed - Work Order Created' : 'Delete'}>
            <span>
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  const obj: any = [row.original._id];
                  setDeleteData(obj);
                }}
                disabled={allowedToDelete && row.original?.canDelete}
              >
                <DeleteIcon fontSize="small" color={allowedToDelete && row.original?.canDelete ? 'disabled' : 'error'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        </>
      )
    });
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
      parent.index = i + 1;
      parent.detail = `${
        parent.type === 'service'
          ? parent.serviceDetail?.serviceName
          : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'serializedAsset'
          ? parent.serializedAssetDetail.assetNumber
          : parent.packageDetail?.packageName
      }`;
      parent.description =
        parent.type === 'service'
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === 'product'
          ? parent?.productDetail?.productDescription || ''
          : parent.type === 'package'
          ? parent?.packageDetail?.packageDescription || ''
          : parent.type === 'serializedAsset'
          ? parent?.serializedAssetDetail?.product?.productDescription || ''
          : '';
      parent.productName = parent?.serializedAssetDetail?.product?.optionLabel || '';
      parent.productId = parent?.serializedAssetDetail?.product?.optionValue || '';
      parent.qtyDisplay = parent.qty;
      parent.isValid = true;
      parent.canDelete = parent.workOrder ? true : false;
      parent.subRows = generateNestedData(data.material, parent);
      parent.status =
        parent.type === 'service'
          ? parent.serviceDetail?.status
          : parent.type === 'product'
          ? parent?.productDetail?.status
          : parent.type === 'serializedAsset'
          ? parent?.serializedAssetDetail?.status
          : parent.type === 'package'
          ? parent.packageDetail?.status
          : '';
    });

    if (rows.length !== 0) {
      setHasAssetsAdded(true);
      if (rows.filter((_rows) => _rows.isValid === false).length > 0) {
        setNextStep(false);
      } else {
        setNextStep(true);
      }
    } else {
      setHasAssetsAdded(false);
      setNextStep(false);
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    let productIndex = 0;
    let serviceIndex = 0;
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + `${_subRow.type === 'service' ? alphabet[serviceIndex] : productIndex + 1}`;
      _subRow.detail = `${
        _subRow.type === 'service'
          ? _subRow.serviceDetail?.serviceName
          : _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'serializedAsset'
          ? _subRow.serializedAssetDetail.assetNumber
          : _subRow.packageDetail?.packageName
      }`;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
          ? _subRow?.productDetail?.productDescription || ''
          : _subRow.type === 'package'
          ? _subRow?.packageDetail?.packageDescription || ''
          : '';
      _subRow.productName = _subRow?.serializedAssetDetail?.product?.optionLabel || '';
      _subRow.productId = _subRow?.serializedAssetDetail?.product?.optionValue || '';
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.isValid = true;
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.type === 'service' ? serviceIndex++ : productIndex++;
      _subRow.status =
        _subRow.type === 'service'
          ? _subRow.serviceDetail?.status
          : _subRow.type === 'product'
          ? _subRow.productDetail?.status
          : _subRow.type === 'serializedAsset'
          ? _subRow.serializedAssetDetail.status
          : _subRow.packageDetail?.status;
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    return sortBy(subRows, ['type']);
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
        setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false, productId: null, productCategory: null });
        fetchData();
        fetchRepairOrderData();
        setAddingProducts(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
      });
  };

  const handleSaveData = async (rows: any) => {
    rows.forEach((element) => {
      delete element.index;
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
        fetchRepairOrderData();
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
        fetchRepairOrderData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
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

  const openAddActions = (event) => {
    setAddAnchorEl(event.currentTarget);
  };

  const closeAddActions = () => {
    setAddAnchorEl(null);
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <Box display="flex" justifyContent="space-between" flexWrap={'wrap'} gridGap={1} m={1}>
          <Box display="flex" flexWrap={'wrap'}>
            {allowedToEdit && (
              <Fragment>
                <Button variant={'outlined'} color="primary" size="small" startIcon={<Add />} onClick={openAddActions} aria-controls="add-menu">
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
                  <MenuItem
                    disabled={rowsData ? false : true}
                    onClick={() => {
                      setAddExistingProductDialog({ open: true, type: 'serializedAsset', parentId: null, existing: true, productId: null, productCategory: null });
                      closeAddActions();
                    }}
                  >
                    {repairOrderData?.type === REPAIR_ORDER_TYPE.external ? `Add Customer Assets` : `Add ${routes.serializedAsset.title}`}
                  </MenuItem>
                  {permissions?.serializedAsset?.isCreate && (
                    <MenuItem
                      onClick={() => {
                        setAddExistingProductDialog({ open: true, type: 'serializedAsset', parentId: null, existing: false, productId: null, productCategory: null });
                        closeAddActions();
                      }}
                    >
                      {repairOrderData?.type === REPAIR_ORDER_TYPE.external ? `Add New Customer Assets` : `Add New ${routes.serializedAsset.title}`}
                    </MenuItem>
                  )}
                  <MenuItem
                    onClick={() => {
                      closeAddActions();
                      setAddExistingProductDialog({ open: true, type: 'product', parentId: null, existing: false, productId: null, productCategory: null });
                    }}
                  >
                    Add Products
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      closeAddActions();
                      setAddExistingProductDialog({ open: true, type: 'package', parentId: null, existing: false, productId: null, productCategory: null });
                    }}
                  >
                    Add Packages
                  </MenuItem>
                </Menu>
              </Fragment>
            )}
          </Box>
          <Box display="flex">
            <Button
              variant="outlined"
              color="default"
              size="small"
              onClick={openActions}
              aria-controls="action-menu"
              disabled={selectedProducts.length === 0}
              endIcon={<ExpandMore />}
              className="new-dropdown-v1"
            >
              Actions
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
                disabled={
                  allowedToDelete ? (selectedProducts?.filter((e) => !e.canDelete)?.length === selectedProducts?.length ? false : true) : true
                }
                onClick={() => {
                  closeActions();
                  handleDeleteMultiple();
                }}
              >
                Delete
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      )}
      {columns && rowsData ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            onSelect={setSelectedProducts}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideSelection={!allowedToEdit}
            hideAction={!allowedToEdit}
            renderedFrom="repair_order_product_package"
            isClientSideGrid={true}
            hideExpander={false}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
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
            setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false, productId: null, productCategory: null});
          }}
          type={addExistingProductDialog.type}
          repairOrderData={repairOrderData}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.existing === false && addExistingProductDialog.type === 'serializedAsset' && (
        <ManageSerializedAsset
          productId={addExistingProductDialog.productId}
          productCategory={addExistingProductDialog.productCategory}
          onClose={() => setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false, productId: null, productCategory: null })}
          referenceType={'repairOrder'}
          referenceData={{
            customerAccount: repairOrderData?.type === REPAIR_ORDER_TYPE.external ? repairOrderData?.customerAccount?.optionValue : null,
            warehouse: repairOrderData?.warehouse?.optionValue
          }}
          onSuccess={(data) => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false, productId: null, productCategory: null });
            handleAdd([data]);
          }}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.existing && addExistingProductDialog.type === 'serializedAsset' && (
        <AssignSerializedAssetDialog
          reference="repairOrder"
          handleClose={() => setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false, productId: null, productCategory: null })}
          ids={[...rowsData?.filter((e) => e.type === 'serializedAsset')?.map((e: any) => e?.serializedAssetDetail?._id)]}
          referenceData={{
            customerAccount: repairOrderData?.type === REPAIR_ORDER_TYPE.external ? repairOrderData?.customerAccount?.optionValue : null,
            warehouse: repairOrderData?.warehouse?.optionValue,
            product: addExistingProductDialog.productId,
          }}
          isAssigning={isAddingProducts}
          handleSucess={handleAdd}
        />
      )}
      {addchildDialog.open && (
        <Popover
          anchorReference="anchorPosition"
          anchorPosition={{ top: addchildDialog.top, left: addchildDialog.bottom }}
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'left'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left'
          }}
          open={addchildDialog.open}
          onClose={() => {
            setAddchildDialog({ open: false, parentId: null, top: null, bottom: null, productId: null, productCategory: null });
          }}
        >
          <MenuList>
            <MenuItem
              disabled={rowsData ? false : true}
              onClick={() => {
                setAddExistingProductDialog({ open: true, type: 'serializedAsset', parentId: addchildDialog.parentId, existing: true , productId: addchildDialog.productId, productCategory: addchildDialog.productCategory});
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null, productId: null, productCategory: null });
              }}
            >
              {`Add ${routes.serializedAsset.title}`}
            </MenuItem>
            {permissions?.serializedAsset?.isCreate && (
              <MenuItem
                onClick={() => {
                  setAddExistingProductDialog({ open: true, type: 'serializedAsset', parentId: addchildDialog.parentId, existing: false, productId: addchildDialog.productId, productCategory: addchildDialog.productCategory});
                  setAddchildDialog({ open: false, parentId: null, top: null, bottom: null, productId: null, productCategory: null });
                }}
              >
                {`Add New ${routes.serializedAsset.title}`}
              </MenuItem>
            )}
          </MenuList>
        </Popover>
      )}
    </Fragment>
  );
};

export default Productpackage;
