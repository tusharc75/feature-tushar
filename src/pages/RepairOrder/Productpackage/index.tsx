import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, Menu, MenuItem, Popover, MenuList } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import DeleteIcon from '@material-ui/icons/Delete';
import { MATERIAL_TYPE, REPAIR_ORDER_TYPE, repairOrder } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import RepairOrderQtyDialog from './RepairOrderQtyDialog';
import ManageSerializedAsset from 'src/pages/SerializedAsset/ManageSerializedAsset';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import { ExpandMore } from '@material-ui/icons';
import Add from '@material-ui/icons/Add';
import { capitalize, sortBy, uniqBy } from 'lodash';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { getNestedSubRows } from 'src/components/RentalManagment/helper';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import { flattenArray } from 'src/constants/columns';

const Productpackage = ({
  fetchRepairOrderData,
  repairOrderData,
  setNextStep,
  renderedFrom,
  stepFullScreen,
  allowedToEdit,
  setHasAssetsAdded
}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);

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
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [products, setProducts] = useState([]);

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
            {!(allowedToEdit && (row.original.type === 'product' || row.original.type === 'package')) ? (
              <p className="text-truncate"> {row.original.detail}</p>
            ) : (
              <p
                onClick={() => {
                  setIsProductEdit({ open: true, isBulkedit: false });
                  setRecordToUpdate(row.original)
                }}
                className="link text-truncate"
                title={row.original.detail}
              >
                {row.original.detail}
              </p>
            )}
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
                <Box ml={1}>
                  <HtmlTooltip title={row.original.type === 'package' ? `Add Product` : row.subRows?.length !== row.original.qty ? `Add` : `Can't add more asset!`}>
                    <IconButton
                      onClick={(event) => {
                        if (row.original.qty !== row.subRows?.length && row.original.type === 'product') {
                          setProducts([{
                            parentId: row.original._id,
                            product: row.original.materialId,
                            qty: row.original.qty - (row.subRows?.length || 0),
                            productName: row.original?.detail,
                          }])
                          setAddchildDialog({ open: true, parentId: row.original?._id, top: event.clientY, bottom: event.clientX, productId: row?.original?.productDetail._id, productCategory: row?.original?.productDetail?.productCategory })
                        }
                        if (row.original.type !== 'product') {
                          setAddExistingProductDialog({ open: true, type: 'product', parentId: row.original?._id, existing: false, productId: null, productCategory: null });
                        }
                      }}
                      size="small"
                    >
                      <Add color="disabled" fontSize="small" />
                    </IconButton>
                  </HtmlTooltip>
                </Box>
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
        accessor: 'qtyDisplay',
        Header: 'Qty',
        width: 200,
        Cell: ({ row }) => {
          return row.original['qtyDisplay'] ? <p className="text-truncate">{row.original.qtyDisplay}</p> : <NoDataCell />;
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
          <HtmlTooltip title={row.original?.canDelete ? 'Delete' : 'Deletion not allowed - Work Order Created'}>
            <span>
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                  getNestedSubRows(obj, row.original);
                  setDeleteData(obj);
                }}
                disabled={row.original?.canDelete ? false : true}
              >
                <DeleteIcon fontSize="small" color={row.original?.canDelete ? 'error' : 'disabled'} />
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
      parent.detail = `${parent.type === MATERIAL_TYPE.package
        ? parent.packageDetail?.packageName
        : parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.serializedAsset
            ? parent.serializedAssetDetail.assetNumber
            : ''
        }`;
      parent.description =
        parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription || ''
          : parent.type === MATERIAL_TYPE.package
            ? parent?.packageDetail?.packageDescription || ''
            : parent.type === MATERIAL_TYPE.serializedAsset
              ? parent?.serializedAssetDetail?.product?.productDescription || ''
              : '';
      parent.productName = parent?.serializedAssetDetail?.product?.optionLabel || '';
      parent.productId = parent?.serializedAssetDetail?.product?.optionValue || '';
      parent.qtyDisplay = parent.qty;
      parent.isValid = true;
      parent.canDelete = parent.workOrder ? false : true;
      parent.subRows = generateNestedData(data.material, parent);
      parent.status = parent?.serializedAssetDetail?.status || null;
    });

    if (rows.length !== 0) {
      setHasAssetsAdded(true);
      if (rows.filter((_rows) => _rows.isValid === false).length > 0 ||
        !data.material?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.length) {
        setNextStep(false);
      } else {
        setNextStep(true);
      }
    } else {
      setHasAssetsAdded(false);
      setNextStep(false);
    }
    setRowsData(rows);
  };

  const generateNestedData = (material, parent) => {
    let subRows: any = material.filter((e) => e.parentId === parent._id);
    let canDelete = subRows?.find((e) => e.workOrder) ? false : true;
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail = `${_subRow.type === MATERIAL_TYPE.package
        ? _subRow.packageDetail?.packageName
        : _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.serializedAsset
            ? _subRow.serializedAssetDetail.assetNumber
            : ''
        }`;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription || ''
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow?.packageDetail?.packageDescription || ''
            : '';
      _subRow.productName = _subRow?.serializedAssetDetail?.product?.optionLabel || '';
      _subRow.productId = _subRow?.serializedAssetDetail?.product?.optionValue || '';
      _subRow.qtyDisplay = _subRow.type === MATERIAL_TYPE.serializedAsset ? 1 : `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.isValid = true;
      _subRow.status = _subRow?.serializedAssetDetail?.status || null
      _subRow.canDelete = _subRow.type === MATERIAL_TYPE.serializedAsset ?
        _subRow.workOrder ? false : true : canDelete;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (subRows.length) {
      parent.canDelete = subRows?.filter((e) => e.canDelete)?.length === subRows?.length ? true : false;
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
      element.unit = d?.unitMain && d?.unitMain?.length ? d?.unitMain[0] : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = d?.parentId || addExistingProductDialog.parentId || null;
      material.push(element);
    });
    axiosInstance()
      .post(`${repairOrder.api}/${repairOrderData._id}/product-package`, { material })
      .then(() => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false, productId: null, productCategory: null });
        fetchData();
        fetchRepairOrderData();
        setProducts([])
        setAddingProducts(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
      });
  };

  const handleSaveData = async (rows: any) => {
    const data = []
    rows?.forEach((element) => {
      data.push({ _id: element._id, qty: element.qty })
    })
    setUpdating(true);
    axiosInstance()
      .put(`${repairOrder.api}/${repairOrderData._id}/product-package`, { material: data })
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
      .put(`${repairOrder.api}/${repairOrderData?._id}/product-package/delete`, { ids: rows?.map((e) => e.id) })
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
    const dataToDelete = selectedRecords?.filter((e) => e.canDelete);
    dataToDelete?.forEach((ele) => {
      obj.push({ id: ele._id, type: ele.type, materialId: ele.materialId });
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

  useEffect(() => {
    var serializedProduct = flattenArray(selectedRecords)?.filter((e) => e.type === MATERIAL_TYPE.product);
    var serializedAsset = flattenArray(selectedRecords)?.filter((d) => d.type === MATERIAL_TYPE.serializedAsset);
    serializedProduct = uniqBy(serializedProduct, '_id');
    const products = serializedProduct?.map((m) => {
      const alreadyAssets = serializedAsset.filter((e) => e?.parentId === m?._id) || [];
      return {
        parentId: m._id,
        product: m.materialId,
        productName: m?.detail,
        qty: m.qty - (alreadyAssets?.length || 0),
      };
    });
    setProducts([...products?.filter((e) => e.qty > 0)])
  }, [selectedRecords]);

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
              disabled={selectedRecords.length === 0}
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
                disabled={selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.product)?.length <= 0}
                onClick={() => {
                  closeActions();
                  setAddExistingProductDialog({ open: true, type: 'serializedAsset', parentId: null, existing: true, productId: null, productCategory: null });
                }}
              >
                Assign Assets
              </MenuItem>
              <MenuItem
                disabled={selectedRecords?.filter((e) => e.canDelete)?.length === selectedRecords?.length ? false : true}
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
            onSelect={setSelectedRecords}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideSelection={!allowedToEdit}
            hideAction={!allowedToEdit}
            renderedFrom={renderedFrom}
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
          loading={isUpdating}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'product' && (
        <AssignProductDialog
          reference="repairOrder"
          serialized={true}
          productsDialogOpen={addExistingProductDialog.open}
          productId={null}
          handleCloseDialog={() => setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false, productId: null, productCategory: null })}
          assignedProducts={[]}
          onSuccess={(d) => {
            handleAdd(d);
          }}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'package' && (
        <AssignPackageDialog
          referenceType="repairOrder"
          handleClose={() => setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false, productId: null, productCategory: null })}
          ids={[]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          packageType={null}
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
          ids={[...rowsData?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.map((e: any) => e?.serializedAssetDetail?._id)]}
          referenceData={{
            customerAccount: repairOrderData?.type === REPAIR_ORDER_TYPE.external ? repairOrderData?.customerAccount?.optionValue : null,
            warehouse: repairOrderData?.warehouse?.optionValue,
          }}
          isAssigning={isAddingProducts}
          handleSucess={(rows) => {
            if (products?.length) {
              const dataToAddFormat = rows?.map(d => {
                return { ...d, _id: d?.asset }
              })
              handleAdd([...dataToAddFormat])
            }
            else {
              handleAdd(rows)
            }
          }}
          selectedProducts={products}
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
                setAddExistingProductDialog({ open: true, type: 'serializedAsset', parentId: addchildDialog.parentId, existing: true, productId: addchildDialog.productId, productCategory: addchildDialog.productCategory });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null, productId: null, productCategory: null });
              }}
            >
              {`Add ${routes.serializedAsset.title}`}
            </MenuItem>
            {permissions?.serializedAsset?.isCreate && (
              <MenuItem
                onClick={() => {
                  setAddExistingProductDialog({ open: true, type: 'serializedAsset', parentId: addchildDialog.parentId, existing: false, productId: addchildDialog.productId, productCategory: addchildDialog.productCategory });
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