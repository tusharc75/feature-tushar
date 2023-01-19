import React, { useState, useEffect, useContext, Fragment, useReducer, useMemo } from 'react';
import {
  Grid,
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Chip,
  Tab,
  Tabs,
  ButtonGroup,
  Container,
  InputAdornment,
  useMediaQuery,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  makeStyles,
  MenuList,
  Popover
} from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import Add from '@material-ui/icons/Add';
import moment from 'moment';
import { dateFormat, formatAmountWithCurrency, demandOrder } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import DeleteIcon from '@material-ui/icons/Delete';
import { isMobile } from 'react-device-detect';
import { ExpandMore } from '@material-ui/icons';
import { capitalize, startCase } from 'lodash';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import DemandOrderQTYDialog from './DemandOrderDetailDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';

const useStyles = makeStyles((theme) => ({
  paper: {
    width: '80%',
    maxHeight: 435
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500]
  }
}));

const Productpackage = ({ salesOrderData, setNextStep, currencySymbol, showActivity, renderedFrom, stepFullScreen }) => {
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const {
    state: { user, permissions }
  }: any = useData();

  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');
  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });
  const [isAddingProducts, setAddingProducts] = useState(false);

  const [recordToUpdate, setRecordToUpdate] = useState(null);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null });
  const [addchildDialog, setAddchildDialog] = useState({ open: false, parentId: null, top: null, bottom: null });
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const fieldsToShow = [
      {
        _id: '630dbe1e9ec41861052354a3',
        fieldLabel: 'Qty',
        type: 'decimal',
        option: [],
        required: false,
        isTooltip: false,
        tooltipMessage: '',
        editAble: true,
        order: 2,
        decimalPlaces: 2,
        sectionName: 'Quantity Information',
        fieldName: 'qty',
        resource: 'Sales Order Product',
        brand: '630dbe1e9ec418610523529c',
        createdBy: {
          user: '61b84437885fdf02d9104cb0',
          date: '2022-08-30T07:37:02.237Z'
        }
      },
      {
        _id: '630dbe1e9ec41861052354a4',
        fieldLabel: 'Unit',
        type: 'dropDown',
        option: [
          {
            optionLabel: 'Option 1',
            optionValue: 'Option 1'
          }
        ],
        required: false,
        isTooltip: false,
        tooltipMessage: '',
        editAble: true,
        order: 1,
        sectionName: 'Quantity Information',
        fieldName: 'unit',
        resource: 'Sales Order Product',
        brand: '630dbe1e9ec418610523529c',
        createdBy: {
          user: '61b84437885fdf02d9104cb0',
          date: '2022-08-30T07:37:02.237Z'
        }
      }
    ];

    var data = fieldsToShow || [];
    setAllFields(JSON.parse(JSON.stringify(data)));
    const coloum: any = [
      {
        accessor: 'srno',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{`${startCase(row.original?.type)} `}</p>
          </div>
        )
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {
              <p
                onClick={() => {
                  handleOpen(row.original);
                }}
                className="link text-truncate"
                title={row.original?.detail}
              >
                {row.original?.detail}
              </p>
            }
            {
              <Box ml={1} className="d-flex align-items-center">
                <span title={`There are ${row.original?.subRows?.length} product(s) in this package`}>({row.original?.subRows?.length})</span>
                <HtmlTooltip title="Add ">
                  <IconButton
                    onClick={(event) => {
                      const type = row.original.type;
                      setAddExistingProductDialog({ open: true, type: type, parentId: row.original?._id });
                      setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
                    }}
                    size="small"
                  >
                    <Add color="disabled" fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
              </Box>
            }
          </div>
        )
      }
    ];
    data.forEach((element: any) => {
      if (element.type === 'date') {
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          disableFilters: true,
          Cell: ({ row }) =>
            row.original[element.fieldName] ? <p>{moment(row.original[element.fieldName].slice(0, 10)).format(dateFormat)}</p> : <NoDataCell />
        });
      } else if (element.fieldName === 'supplierAccount') {
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          Cell: ({ row }) =>
            row.original[element.fieldName] ? (
              <p className="text-truncate">{row.original[element.fieldName].map((d) => d?.optionLabel).toString()}</p>
            ) : (
              <NoDataCell />
            )
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
                    <p>{formatAmountWithCurrency(salesOrderData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
                  <p>{formatAmountWithCurrency(salesOrderData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
                ) : (
                  <NoDataCell />
                )
            });
          });
        }
      } else {
        if (element.fieldName === 'qty') {
          element.fieldName = 'qty';
        }
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          Cell: ({ row }) => (row.original[element.fieldName] ? <p>{row.original[element.fieldName]}</p> : <NoDataCell />),
          editable: element.fieldName === 'qty' ? true : false
        });
      }
    });
    {
      isMobile ? (
        <Box display={'none'} />
      ) : (
        coloum.push({
          accessor: 'action',
          Header: '',
          minWidth: 100,
          width: 100,
          sticky: 'right',
          disableFilters: true,
          canDrag: false,
          Cell: ({ row }) =>
            !row.original.hideSelection && (
              <Grid container spacing={1}>
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                    setDeleteData(obj);
                  }}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </Grid>
            )
        })
      );
    }
    coloum.forEach((element) => {
      if (element.accessor.includes('detail')) {
        element['Footer'] = () => {
          return <>Total</>;
        };
      } else if (element.accessor === 'qty') {
        element['Footer'] = (info) => {
          const qtyTotal = info.rows
            .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
            .reduce((sum, row) => row.values[element.accessor] + sum, 0);
          return <>{qtyTotal}</>;
        };
      }
    });

    setColumns(coloum);
    fetchProductInventory();
  };

  const fetchProductInventory = async () => {
    setNextStep(false);
    var data: any = [];
    var inventory: any = [];
    const response = await axiosInstance().get(`${demandOrder.api}/productpackage/${salesOrderData._id}`);
    data = response?.data?.data;
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    inventory = data?.inventory ? data?.inventory : [];
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${
        parent.type === 'serializedAsset'
          ? parent.serializedAssetDetail?.assetNumber
          : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
          ? parent.serviceDetail?.serviceName
          : parent.packageDetail?.packageName
      }`;
      parent.qty = parent.qty;
      parent.isValid = parent['finalPrice_' + salesOrderData?.currency?.toLowerCase()] ? true : false;
      parent.hideSelection = inventory.filter((e) => e._id === parent._id).length ? true : false;
      parent.assetQty = inventory.filter((e) => e._id === parent._id).length;
      parent.subRows = generateNestedData(data.material, inventory, parent);
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(true);
    } else {
      setNextStep(true);
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, inventory, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    let productIndex = 0;
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + `${productIndex + 1}`;
      _subRow.detail = `${
        _subRow.type === 'serializedAsset'
          ? _subRow.serializedAssetDetail?.assetNumber
          : _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'service'
          ? _subRow.serviceDetail?.serviceName
          : _subRow.packageDetail?.packageName
      }`;
      _subRow.qty = _subRow.qty;
      _subRow.isValid = _subRow['finalPrice_' + salesOrderData?.currency?.toLowerCase()] ? true : false;
      _subRow.hideSelection = inventory.filter((e) => e._id === _subRow._id).length ? true : false;
      _subRow.assetQty = inventory.filter((e) => e._id === _subRow._id).length;
      _subRow.subRows = generateNestedData(material, inventory, _subRow);
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
      element.unit = d?.unit;
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addExistingProductDialog.parentId;
      material.push(element);
    });

    axiosInstance()
      .post(`${demandOrder.api}/productpackage/${salesOrderData._id}`, { material })
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
    setUpdating(true);
    axiosInstance()
      .put(`${demandOrder.api}/productpackage/${salesOrderData._id}`, { material: rows })
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
      .put(`${demandOrder.api}/productpackage/${salesOrderData?._id}/delete`, { ids: rows })
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

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = material.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qty')) {
      inputField['qty'] = inputField['qty'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(material, inputField, allFields, updatedData);
    handleSaveData(rows);
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center">
          {permissions?.product?.isRead && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                setAddExistingProductDialog({ open: true, type: 'product', parentId: null });
              }}
            >
              {`Add ${routes.product.title}`}
            </Button>
          )}
          <Box mx={1} />
          {permissions?.packages?.isRead && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                setAddExistingProductDialog({ open: true, type: 'package', parentId: null });
              }}
            >
              {`Add ${routes.packages.title}`}
            </Button>
          )}
          <Box mx={1} />
        </Box>
        <Box display="flex">
          <Button
            disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length) || isDeleting}
            variant={isMobile ? 'text' : 'outlined'}
            color="default"
            size="small"
            onClick={openActions}
            aria-controls="action-menu"
          >
            {isMobile ? '' : 'Actions'} <ExpandMore />
          </Button>
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
              onClick={() => {
                const dataToDelete =
                  selectedProducts &&
                  selectedProducts
                    .filter((e) => !e.hideSelection)
                    .map((rec: any) => {
                      const obj: any = {};
                      obj.id = rec._id;
                      obj.type = rec?.type;
                      obj.materialId = rec?.materialId;
                      return obj;
                    });
                setDeleteData(dataToDelete);
                closeActions();
              }}
              disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length) || isDeleting}
            >
              Delete
            </MenuItem>
          </Menu>
          {/* <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? 'Delete selected records' : 'Select records to delete'}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length) || isDeleting}
              onClick={() => {
                const dataToDelete =
                  selectedProducts &&
                  selectedProducts
                    .filter((e) => !e.hideSelection)
                    .map((rec: any) => {
                      const obj: any = {};
                      obj.id = rec._id;
                      obj.type = rec?.type;
                      obj.materialId = rec?.materialId;
                      return obj;
                    });
                setDeleteData(dataToDelete);
              }}
              endIcon={isDeleting && <CircularProgress size={20} color="primary" />}
            >
              Delete
            </Button>
          </HtmlTooltip> */}
          <Box mx={1} />
        </Box>
      </Box>
      {columns && rowsData ? (
        <>
          <Box
            p="6px"
            zIndex={5}
            width={
              stepFullScreen ? '100%' : isTabletScreen ? 'calc(100vw)' : isSmallScreen ? 'calc(100vw)' : showActivity ? '100%' : 'calc(100vw - 100px)'
            }
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
          >
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
              columns={columns}
              data={rowsData}
              setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
              onSelect={setSelectedProducts}
              childrenProperty="subRows"
              uniqueKey="_id"
              renderedFrom="demand_order_product_package"
              isClientSideGrid={true}
              onSaveEdit={onSaveInlineEdit}
              material={material}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500} bgcolor="white">
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
        <DemandOrderQTYDialog
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false });
          }}
          productionOrderData={recordToUpdate}
          handleSave={handleSaveData}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'product' && (
        <AssignProductDialog
          reference="demandOrder"
          serialized={null}
          productsDialogOpen={addExistingProductDialog.open}
          productId={null}
          handleCloseDialog={() => setAddExistingProductDialog({ open: false, type: '', parentId: null })}
          assignedProducts={rowsData?.map((e) => e?.materialId)}
          renderedFrom={`${renderedFrom}_sub-1`}
          onSuccess={(d) => {
            handleAdd(d);
          }}
        />
        // <AddExistingProductInventory
        //   renderedFrom={
        //     addExistingProductDialog.type === 'product'
        //       ? `${renderedFrom}-product`
        //       : addExistingProductDialog.type === 'service'
        //       ? `${renderedFrom}-service`
        //       : `${renderedFrom}-package`
        //   }
        //   isAddingProducts={isAddingProducts}
        //   addProductInventory={handleAdd}
        //   handleProductInventoryClose={() => {
        //     setAddExistingProductDialog({ open: false, type: '', parentId: null });
        //   }}
        //   type={addExistingProductDialog.type}
        //   refrenceType={'Quotation'}
        //   ignoreIds={rowsData?.map((e) => e?.materialId)}
        // />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'package' && (
        <AssignPackageDialog
          referenceType="demandOrder"
          handleClose={() => setAddExistingProductDialog({ open: false, type: '', parentId: null })}
          ids={rowsData?.map((e) => e?.materialId)}
          onSuccess={(d) => {
            handleAdd(
              d?.map((e) => {
                return {
                  ...e,
                  qty: 1
                };
              })
            );
          }}
          packageType={null}
        />
      )}
    </Fragment>
  );
};

export default Productpackage;
