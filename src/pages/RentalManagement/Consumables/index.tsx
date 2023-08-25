import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, CircularProgress, Menu, MenuItem, Chip, ListItemText } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import Add from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import moment from 'moment';
import { rentalManagement, dateFormat, pricingCondition, formatAmountWithCurrency } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import { isMobile, isTablet } from 'react-device-detect';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import { RiEditCircleLine } from 'react-icons/ri';
import { BiChevronDown } from 'react-icons/bi';
import { calculatePrice, fetch_rental_product_fields, getNestedSubRows } from '../../../components/RentalManagment/helper';
import RentalJobQtyDialog from '../Productpackage/RentalJobQtyDialog';
import AddExistingProductInventory from '../Productpackage/AddExistingProductInventory';

const Consumables = ({ rentalManagementData, setNextStep, currencySymbol, renderedFrom, stepFullScreen, allowedToEdit }: any) => {
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
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null });
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [isRateRequired, setIsRateRequired] = useState(false);

  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [columns]);

  const fetchFields = async () => {
    var data = await fetch_rental_product_fields(rentalManagementData?.currency, isOffline);
    setAllFields(JSON.parse(JSON.stringify(data)));
    const coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isOffline || !allowedToEdit ? (
              <p> {row.original.detail}</p>
            ) : (
              <p
                onClick={() => {
                  handleOpen(row.original);
                }}
                className="link text-truncate"
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
                {!isOffline && allowedToEdit && (
                  <HtmlTooltip title="Add Service">
                    <IconButton
                      onClick={() => setAddExistingProductDialog({ open: true, type: 'product', parentId: row.original?._id })}
                      size="small"
                      color="primary"
                    >
                      <Add color="disabled" fontSize="small" />
                    </IconButton>
                  </HtmlTooltip>
                )}
              </Box>
            }
            {!isOffline && (
              <Chip
                className="ml-1"
                label={`${row.original.type === 'product' ? 'Product' : ''}`}
                size="small"
                color="primary"
                onClick={() => {
                  window.open(`${row.original.type === 'product' ? routes.productDetail.path : ''}/${row.original.materialId}`);
                }}
              />
            )}
          </div>
        ),
        Footer: () => {
          return <>Total</>;
        }
      }
    ];
    data.forEach((element) => {
      if (element.fieldName === 'price' && element.required) {
        setIsRateRequired(true);
      }
      if (element.type === 'date') {
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          disableFilters: true,
          Cell: ({ row }) =>
            row.original[element.fieldName] ? <p>{moment(row.original[element.fieldName].slice(0, 10)).format(dateFormat)}</p> : <NoDataCell />
        });
      } else if (element.type === 'converter' || element.type === 'currencyAmount' || element.isConverter === true) {
        if (element.type !== 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
          element.displayUnits.forEach((_unit) => {
            let fieldName = element.fieldName + '_' + _unit.toLowerCase();
            let fieldLabel = element.fieldLabel + ' ' + _unit;
            coloum.push({
              accessor: fieldName,
              Header: fieldLabel,
              Cell: ({ row }) => (row.original[fieldName] ? <p>{row.original[fieldName]}</p> : <NoDataCell />)
            });
          });
        } else if (element.type === 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
          element.displayUnits.forEach((_unit) => {
            element.displayCurrency.forEach((_currency) => {
              let fieldName = element.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
              let fieldLabel = element.fieldLabel + ' ' + _unit + '/' + _currency;
              coloum.push({
                accessor: fieldName,
                Header: fieldLabel,
                Cell: ({ row }) =>
                  row.original[fieldName] ? (
                    <p>{formatAmountWithCurrency(rentalManagementData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
                  ) : (
                    <NoDataCell />
                  )
              });
            });
          });
        } else if (element.type === 'currencyAmount') {
          element.displayCurrency.forEach((_currency) => {
            let fieldName = element.fieldName + '_' + _currency.toLowerCase();
            let fieldLabel = element.fieldLabel + ' ' + _currency;
            coloum.push({
              accessor: fieldName,
              Header: fieldLabel,
              Cell: ({ row }) =>
                row.original[fieldName] ? (
                  <p>{formatAmountWithCurrency(rentalManagementData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
                ) : (
                  <NoDataCell />
                ),
              Footer: (info) => {
                const total = info?.rows
                  ?.filter((f) => f.original.parentId === null && f.values.hasOwnProperty(fieldName) && !isNaN(f.values[fieldName]))
                  .reduce((sum, row) => row.values[fieldName] + sum, 0);
                return (
                  <>
                    {currencySymbol} {formatAmountWithCurrency(rentalManagementData?.currency, total)?.amountWithouCurrencyCode ?? total}
                  </>
                );
              }
            });
          });
        }
      } else {
        if (element.fieldName === 'qty') {
          element.fieldName = 'qtyDisplay';
        }
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          Cell: ({ row }) => (row.original[element.fieldName] ? <p>{row.original[element.fieldName]}</p> : <NoDataCell />)
        });
      }
    });
    {
      isMobile ? (
        <Box display={'none'} />
      ) : (
        coloum.push({
          accessor: 'action',
          Header: 'Actions',
          minWidth: 50,
          width: 50,
          sticky: 'right',
          disableFilters: true,
          canDrag: false,
          Cell: ({ row }) =>
            !row.original.hideSelection &&
            allowedToEdit && (
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                  getNestedSubRows(obj, row.original);
                  setDeleteData(obj);
                }}
              >
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            )
        })
      );
    }
    coloum.forEach((element) => {
      if (element.accessor === 'qtyDisplay') {
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

  const fetchProductInventory = async () => {
    // setNextStep(false);
    var data: any = [];
    var inventory: any = [];
    var nonSerializeAsset: any = [];

    if (isOffline) {
      data = await findOne(objectStore.rentalManagement, rentalManagementData._id);
      inventory = data.productInventory;
    } else {
      const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
      data = response?.data?.data;
      setMaterial(JSON.parse(JSON.stringify(data.material)));
      inventory = data.inventory;
      nonSerializeAsset = data.nonSerializeAsset;
    }
    let rows = data.material.filter((e) => e.parentId === null);
    rows = rows.filter((e) => e.type === 'product' && e?.isConsumbale);

    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${parent.productDetail?.productName}`;
      parent.serializedProduct = parent.type === 'product' ? parent.productDetail?.serializedProduct : false;
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + rentalManagementData?.currency?.toLowerCase()] ? true : !isRateRequired;
      parent.assetQty = parent.serializedProduct
        ? inventory?.filter((e) => e._id === parent._id).length
        : nonSerializeAsset?.filter((e) => e._id === parent._id).length;
      parent.hideSelection = parent.assetQty > 0 ? true : parent?.status ? true : false;
      parent.subRows = generateNestedData(data.material, inventory, nonSerializeAsset, parent);
    });

    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      // setNextStep(false);
    } else {
      // setNextStep(true);
    }

    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, inventory, nonSerializeAsset, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail = _subRow.productDetail?.productName;
      _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.isValid = _subRow['finalPrice_' + rentalManagementData?.currency?.toLowerCase()] ? true : !isRateRequired;
      _subRow.assetQty = _subRow.serializedProduct
        ? inventory?.filter((e) => e._id === _subRow._id).length
        : nonSerializeAsset?.filter((e) => e._id === _subRow._id).length;
      _subRow.hideSelection = _subRow.assetQty > 0 ? true : _subRow?.status ? true : false;
      _subRow.subRows = generateNestedData(material, inventory, nonSerializeAsset, _subRow);
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return subRows;
  };

  const handleAdd = async (rows) => {
    setAddingProducts(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addExistingProductDialog.type;
      element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
      element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.estimateStartDate = rentalManagementData ? rentalManagementData?.estimateStartDate : new Date();
      element.estimateEndDate = rentalManagementData ? rentalManagementData?.estimateEndDate : new Date();
      element.actualStartDate = '';
      element.actualEndDate = '';
      element.actualJobDuration = '';
      element.isConsumbale = true;
      element.parentId = addExistingProductDialog.parentId;
      const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
      element.estimateJobDuration = 1;
      if (calValues && calValues['estimateJobDuration']) {
        element.estimateJobDuration = calValues['estimateJobDuration'];
      }
      material.push(element);
    });

    const priceData: any = await calculatePrice(rentalManagementData, material);
    material.forEach((element) => {
      const rateResult = priceData?.filter(
        (e) =>
          e.materialId === element.materialId &&
          e.materialType === element.type &&
          e.unit === element.unit &&
          e.pricingMethod === element.pricingMethod
      );
      if (rateResult.length && rateResult[0].mrp) {
        const priceFieldName = `price_${rentalManagementData?.currency?.toLowerCase()}`;
        element[priceFieldName] = rateResult[0].mrp;
        const calValues = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields);
        Object.assign(element, calValues);
      }
    });

    axiosInstance()
      .post(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`, { material })
      .then(() => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null });
        fetchProductInventory();
        setAddingProducts(false);
      })
      .catch((error) => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null });
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
      .put(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`, { material: rows })
      .then(() => {
        setUpdating(false);
        setIsProductEdit({ open: false, isBulkedit: false });
        fetchProductInventory();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${rentalManagement.api}/productpackage/${rentalManagementData?._id}/delete`, { ids: rows })
      .then(() => {
        setDeleting(false);
        fetchProductInventory();
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

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteMultiple = () => {
    const obj: any = [];
    const dataToDelete = selectedProducts && selectedProducts.filter((e) => !e.hideSelection);
    dataToDelete?.forEach((ele) => {
      obj.push({ id: ele._id, type: ele.type, materialId: ele.materialId });
    });
    dataToDelete?.forEach((ele) => {
      getNestedSubRows(obj, ele);
    });
    setDeleteData(obj);
  };

  return (
    <Fragment>
      <Grid container spacing={2}>
        {allowedToEdit && (
          <Grid item xs={12} md={12} sm={12}>
            <Box display="flex" justifyContent="space-between" m={1} mb={0}>
              <Box display="flex">
                {permissions?.product?.isRead && (
                  <Button
                    color="primary"
                    size="small"
                    disabled={isOffline}
                    variant={isMobile && !isTablet ? 'outlined' : 'contained'}
                    style={isMobile && !isTablet ? { color: 'var(--info-dark)' } : {}}
                    onClick={() => {
                      setAddExistingProductDialog({ open: true, type: 'product', parentId: null });
                    }}
                  >
                    {isMobile && !isTablet ? 'Service' : `Add Consumables`}
                  </Button>
                )}
              </Box>
              <Box display="flex">
                <Button
                  variant={'outlined'}
                  color="primary"
                  size="small"
                  onClick={handleClick}
                  disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length)}
                  endIcon={<BiChevronDown />}
                  className="new-dropdown-v1"
                >
                  Actions
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  onClose={handleClose}
                >
                  <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? 'Bulk edit selected records' : 'Select records to edit'}>
                    <MenuItem
                      onClick={() => {
                        setIsProductEdit({ open: true, isBulkedit: true });
                        handleClose();
                      }}
                    >
                      Bulk Edit
                    </MenuItem>
                  </HtmlTooltip>
                  <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? 'Delete selected records' : 'Select records to delete'}>
                    <MenuItem
                      disabled={isDeleting}
                      onClick={() => {
                        handleDeleteMultiple();
                        handleClose();
                      }}
                    >
                      Delete
                    </MenuItem>
                  </HtmlTooltip>
                </Menu>
              </Box>
            </Box>
          </Grid>
        )}
        <Grid item xs={12} md={12} sm={12}>
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
                hideSelection={isOffline || !allowedToEdit}
                hideAction={isOffline || !allowedToEdit}
                renderedFrom="rental_management_product_package"
                isClientSideGrid={true}
              />
            </Box>
          ) : (
            <Box p={2} height={500}>
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
        <RentalJobQtyDialog
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false });
            setRecordToUpdate(null);
          }}
          isBulkedit={isProductEdit.isBulkedit}
          handleSaveData={handleSaveData}
          rentalManagementData={rentalManagementData}
          rowData={recordToUpdate}
          material={material}
          selectedProducts={selectedProducts}
          loading={isUpdating}
        />
      )}
      {addExistingProductDialog.open && (
        <AddExistingProductInventory
          renderedFrom={`${renderedFrom}-product`}
          isAddingProducts={isAddingProducts}
          addProductInventory={handleAdd}
          handleProductInventoryClose={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null });
          }}
          fromConsumable={true}
          productInventory={[]}
          type={addExistingProductDialog.type}
          rentalManagementData={rentalManagementData}
        />
      )}
    </Fragment>
  );
};

export default Consumables;
