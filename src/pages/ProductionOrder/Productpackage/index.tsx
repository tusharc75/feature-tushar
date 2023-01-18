import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, CircularProgress, Menu, MenuItem, Chip, MenuList, ListItemIcon, ListItemText } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import DeleteIcon from '@material-ui/icons/Delete';
import { productionOrder, dateFormat } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { ExpandMore } from '@material-ui/icons';
import { sortBy, startCase } from 'lodash';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import ProductionOrderQty from './ProductionOrderQty';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';


const Productpackage = ({
  fetchProductionOrderData,
  productionOrderData,
  setNextStep,
  isTabletScreen,
  isSmallScreen,
  showActivity,
  renderedFrom,
  stepFullScreen,
  allowedToEdit,
  allowedToDelete,
}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, data: null });
  const [isAddingProducts, setAddingProducts] = useState(false);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null, existing: false });

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);

  const [anchorActionEl, setAnchorActionEl] = useState(null);

  useEffect(() => {
    fetchFields();
  }, [productionOrderData]);

  useEffect(() => {
    fetchData();
  }, [columns]);

  const fetchFields = async () => {
    setColumns(null);
    const coloum: any = [
      {
        accessor: 'srno',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        disableFilters: true,
        sticky: isMobile ? 'none' : 'left',
        width: 200,
        Cell: ({ row }) =>
          row.original['type'] ? (
            <p>
              {`${startCase(row.original?.type)} `}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'detail',
        Header: ' Details',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p
              onClick={() => {
                setIsProductEdit({ open: true, data: row.original });
              }}
              className="link text-truncate"
              title={row.original.detail}
            >
              {row.original.detail}
            </p>
          </div>
        )
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        width: 200,
        Cell: ({ row }) => {
          return row.original['qty'] ? <p className="text-truncate">{row.original.qty}</p> : <NoDataCell />;
        },
        editable: true
      },
      {
        accessor: 'unit',
        Header: 'Unit',
        width: 200,
        Cell: ({ row }) => {
          return row.original['unit'] ? <p className="text-truncate">{row.original.unit}</p> : <NoDataCell />;
        }
      },
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
          <HtmlTooltip title={allowedToDelete && row.original?.allowedToDelete ? 'Asset is already assigned' : 'Delete'}>
            <IconButton
              size="small"
              aria-label="Details"
              onClick={() => {
                const obj: any = [row.original._id];
                setDeleteData(obj);
              }}
              disabled={allowedToDelete && row.original?.allowedToDelete}
            >
              <DeleteIcon fontSize="small" color={allowedToDelete && row.original?.allowedToDelete ? 'disabled' : 'error'} />
            </IconButton>
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
    const response = await axiosInstance().get(`${productionOrder.api}/${productionOrderData._id}/material`);
    data = response?.data?.data;

    setMaterial(JSON.parse(JSON.stringify(data.material)));

    const rows = data.material.filter((e) => e.parentId === null);

    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${parent.type === 'product'
        ? parent.productDetail?.productName : parent.packageDetail?.packageName
        }`;
      parent.description = parent.type === 'product'
        ? parent?.productDetail?.productDesc || ''
        : parent.type === 'package'
          ? parent?.packageDetail?.packageDescription || '' : '';
      parent.qtyDisplay = parent.qty;
      parent.isValid = true;
      parent.allowedToDelete = parent.workOrder ? true : false;
      parent.subRows = generateNestedData(data.material, parent);
    });

    if (rows.length !== 0) {
      if (rows.filter((_rows) => _rows.isValid === false).length > 0) {
        setNextStep(false);
      } else {
        setNextStep(true);
      }
    } else {
      setNextStep(false);
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    let productIndex = 0;
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + `${productIndex + 1}`;
      _subRow.detail = `${_subRow.type === 'product'
        ? _subRow.productDetail?.productName
        : _subRow.packageDetail?.packageName
        }`;
      _subRow.description = _subRow.type === 'product'
        ? _subRow?.productDetail?.productDesc || ''
        : _subRow.type === 'package'
          ? _subRow?.packageDetail?.packageDescription || ''
          : '';
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.isValid = true;
      _subRow.hideSelection = true;
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.type === productIndex++;
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
      element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : d.unit || '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addExistingProductDialog.parentId;
      material.push(element);
    });
    axiosInstance()
      .post(`${productionOrder.api}/${productionOrderData._id}/material`, { material })
      .then(() => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false });
        fetchData();
        fetchProductionOrderData();
        setAddingProducts(false);
      })
      .catch((error) => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false });
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
      });
  };


  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${productionOrder.api}/${productionOrderData?._id}/material/delete`, { ids: rows })
      .then(() => {
        setDeleting(false);
        fetchData();
        fetchProductionOrderData();
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

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = material.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qty')) {
      inputField['qty'] = inputField['qty'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(material, inputField, allFields, updatedData);
    handleSaveData(rows);
  };

  const handleSaveData = async (rows: any) => {
    rows.forEach((element) => {
      delete element.srno;
      delete element.detail;
      delete element.qtyDisplay;
      delete element.isValid;
      delete element.hideSelection;
      delete element.assetQty;
      delete element.productDetail;
      delete element.packageDetail;
      delete element.serviceDetail;
      delete element.subRows;
      delete element.leadTime;
      delete element.leadTimeData;
      delete element.productName;
      delete element.productId;
    });
    setUpdating(true);
    axiosInstance()
      .put(`${productionOrder.api}/${productionOrderData?._id}/material`, { material: rows })
      .then(() => {
        setUpdating(false);
        setIsProductEdit({ open: false, data: null });
        fetchData();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Grid container spacing={2}>
        {allowedToEdit && (
          <Grid item xs={12} md={12} sm={12}>
            <Box display="flex" justifyContent="space-between" m={1} mb={0}>
              <Box display="flex">
                {permissions?.serializedAsset?.isRead && allowedToEdit && (
                  <>
                    <Button
                      color="primary"
                      size="small"
                      variant={isMobile && !isTablet ? 'outlined' : 'contained'}
                      style={isMobile && !isTablet ? { color: 'var(--info-dark)' } : {}}
                      onClick={() => {
                        setAddExistingProductDialog({ open: true, type: 'product', parentId: null, existing: true });
                      }}
                    >
                      {`Add ${routes.product.title}`}
                    </Button>
                    <Box ml={1} />
                    <Button
                      color="primary"
                      size="small"
                      variant={isMobile && !isTablet ? 'outlined' : 'contained'}
                      style={isMobile && !isTablet ? { color: 'var(--info-dark)' } : {}}
                      onClick={() => {
                        setAddExistingProductDialog({ open: true, type: 'packages', parentId: null, existing: true });
                      }}
                    >
                      {`Add ${routes.packages.title}`}
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
                  disabled={selectedProducts.length === 0}
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
                    disabled={
                      allowedToDelete && selectedProducts?.filter((e) => e.allowedToDelete)?.length === selectedProducts?.length ? true : false
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
          </Grid>
        )}
        <Grid item xs={12} md={12} sm={12}>
          {columns && rowsData ? (
            <Box
              zIndex={5}
              width={stepFullScreen ? '100%' : isTabletScreen ? '100%' : isSmallScreen ? '100%' : showActivity ? '100%' : 'calc(100vw - 103px)'}
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
                onSaveEdit={onSaveInlineEdit}
                material={material}
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
      {addExistingProductDialog.open && addExistingProductDialog.type === 'product' && (
        <AssignProductDialog
          reference={routes.productionOrder.title}
          productsDialogOpen={addExistingProductDialog.open}
          productId={null}
          onSuccess={handleAdd}
          handleCloseDialog={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false });
          }}
          assignedProducts={[]}
          renderedFrom={`${renderedFrom}-product`} />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'packages' && (
        <AssignPackageDialog
          referenceType={routes.productionOrder.title}
          onSuccess={handleAdd}
          handleClose={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false });
          }}
          packageType={'Product'}
          ids={[]} />
      )}
      {isProductEdit.open && (
        <ProductionOrderQty
          onClose={() => {
            setIsProductEdit({ open: false, data: null });
          }}
          productionOrderData={isProductEdit.data}
          handleSave={handleSaveData} />
      )}
    </Fragment>
  );
};

export default Productpackage;
