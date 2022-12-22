import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, capitalize, Chip, CircularProgress, Dialog, IconButton, Menu, MenuItem } from '@material-ui/core';
import { useData } from 'src/StateProvider/Provider';
import { fetch_rental_product_fields } from 'src/components/RentalManagment/helper';
import { isMobile } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import moment from 'moment';
import { CustomDialogTransition, dateFormat, formatAmountWithCurrency, invoice, pricingCondition, rentalManagement } from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import RentalJobQtyDialog from '../Productpackage/RentalJobQtyDialog';
import { Add, Delete, Edit, ExpandMore } from '@material-ui/icons';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { MuiPickersUtilsProvider, KeyboardDatePicker, KeyboardTimePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import styles from '../../Leads/Header.module.scss';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { fetch_invoice_product_fields } from 'src/components/Invoice/helper';
import InvoiceFacility from 'src/pages/Invoice/Invoice/InvoiceFacility';
import { startCase } from 'lodash';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import EditIcon from '@material-ui/icons/Edit';

const ViewBillingDialog = ({ rentalManagementData, invoiceData, currencySymbol, estimateStartDate, onClose, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [material, setMaterial] = useState([]);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, rowData: null });
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  // const [anchorActionEl, setAnchorActionEl] = useState(null);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [columns]);

  const fetchFields = async () => {
    try {
      let data = await fetch_invoice_product_fields(invoiceData?.currency);
      setAllFields(JSON.parse(JSON.stringify(data)));
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
          sticky: isMobile ? 'none' : 'left',
          width: 200,
          disableFilters: true,
          Cell: ({ row }) =>
            row.original['type'] ? (
              <p>
                {`${startCase(row.original?.type)} `}
                {row.original['type'] === 'product'
                  ? row.original?.productDetail?.serializedProduct
                    ? '(Serialized)'
                    : '(Non-Serialized)'
                  : row.original?.type === 'package'
                    ? row.original?.packageDetail.packageType === 'Product'
                      ? '(Product)'
                      : '(Service)'
                    : row.original.type === 'service'
                      ? row?.original?.serviceDetail?.serviceType && `(${row?.original?.serviceDetail?.serviceType})`
                      : ''}
              </p>
            ) : (
              <NoDataCell />
            )
        },
        {
          accessor: 'detail',
          Header: 'Details',
          minWidth: 300,
          width: 300,
          Cell: ({ row }) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p className="text-truncate" title={row.original?.detail}>
                {row.original?.detail}
              </p>
              {row.original['type'] !== 'additionalCost' &&
                <IconButton
                  size="small"
                  onClick={() => {
                    if (row.original.type === 'service') {
                      window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                    } else if (row.original.type === 'product') {
                      window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                    } else if (row.original.type === 'asset') {
                      window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                    } else {
                      window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                    }
                  }}
                >
                  <InfoIcon fontSize="small" color="primary" />
                </IconButton>}
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
        }
      ];

      data.forEach((element) => {
        if (element.type === 'date') {
          coloum.push({
            accessor: element.fieldName,
            Header: element.fieldLabel,
            disableFilters: true,
            Cell: ({ row }) =>
              row.original[element.fieldName] ? <p>{moment(row.original[element.fieldName])?.format(dateFormat)}</p> : <NoDataCell />
          });
        } else if (element.fieldName === 'supplierAccount') {
          coloum.push({
            accessor: element.fieldName,
            Header: element.fieldLabel,
            Cell: ({ row }) =>
              row.original[element.fieldName]?.length ? (
                <p className="text-truncate">{row.original[element.fieldName]?.map((d) => d?.optionLabel)?.toString()}</p>
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
                  )
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
            Header: '',
            minWidth: 100,
            width: 100,
            sticky: 'right',
            disableFilters: true,
            canDrag: false,
            Cell: ({ row }) =>
            (
              <Grid container spacing={1}>
                {row.original.isEditable &&
                  <><IconButton
                    size="small"
                    aria-label="Details"
                    onClick={() => {
                      setIsProductEdit({ open: true, rowData: row.original });
                    }}
                  >
                    <EditIcon color="primary" />
                  </IconButton>
                    <Box ml={1} />
                  </>}
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    handleDeleteData([row.original]);
                  }}
                >
                  <Delete color="error" />
                </IconButton>
              </Grid>
            )
          })
        );
      }
      coloum.forEach((element) => {
        if (element.Header === 'Actual Start Date') {
          element.Header = 'Bill Start Date';
        }
        if (element.Header === 'Actual End Date') {
          element.Header = 'Bill End Date';
        }


        if (element.accessor === 'qtyDisplay') {
          element['Footer'] = (info) => {
            const qtyTotal = info.rows
              .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
              .reduce((sum, row) => row.values[element.accessor] + sum, 0);
            return <>{qtyTotal}</>;
          };
        } else if (element.accessor.includes('finalPrice')) {
          element['Footer'] = (info) => {
            const total = info.rows
              .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
              .reduce((sum, row) => row.values[element.accessor] + sum, 0);
            return (
              <>
                {currencySymbol} {formatAmountWithCurrency(invoiceData?.currency, total)?.amountWithouCurrencyCode ?? total}
              </>
            );
          };
        }
      });
      setColumns(coloum);
      fetchProductInventory();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchProductInventory = async () => {
    var data: any = [];
    const response = await axiosInstance().get(`${invoice.api}/productpackage/${invoiceData._id}`);
    data = response?.data?.data;

    const responseAdditionalCostData = await axiosInstance().get(`${invoice.api}/${invoiceData._id}/additional-cost`);
    let additionalCostData = responseAdditionalCostData?.data?.data;

    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${parent.type === 'product'
        ? parent.productDetail?.productName
        : parent.type === 'package'
          ? parent.packageDetail?.packageName
          : parent.type === 'asset'
            ? parent.inventoryDetail?.assetNumber
            : parent.serviceDetail?.serviceName
        }`;
      parent.description =
        parent.type === 'service'
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === 'product'
            ? parent?.productDetail?.productDesc || ''
            : parent.type === 'package'
              ? parent?.packageDetail?.packageDescription || ''
              : '';
      parent.isEditable = ['Per Day', 'Per Week', 'Per Month'].includes(parent?.pricingMethod) ? false : true;
      parent.qtyDisplay = parent.qty;
      parent.subRows = generateNestedData(data.material, parent);
    });
    if (additionalCostData.length > 0) {
      additionalCostData.forEach(element => {
        element.srno = rows.length + 1;
        element.detail = element.costType
        element.type = 'additionalCost';
        element.qtyDisplay = element.qty;
        element.materialId = element?._id
        element.parentId = null
        rows.push(element)
      });
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.detail = `${_subRow?.type === 'product'
        ? _subRow?.productDetail?.productName
        : _subRow?.type === 'package'
          ? _subRow?.packageDetail?.packageName
          : _subRow?.type === 'asset'
            ? _subRow?.inventoryDetail?.assetNumber
            : _subRow?.serviceDetail?.serviceName
        }`;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
            ? _subRow?.productDetail?.productDesc || ''
            : _subRow.type === 'package'
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.isEditable = false;
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSaveData = async (rows: any) => {
    const data = {
      invoiceId: invoiceData?._id,
      materialId: rows[0]?.materialId,
      qty: rows[0]?.qty
    };
    setIsLoadingUpdate(true);
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData._id}/progressive-billing/update-qty`, data)
      .then((res) => {
        setIsLoadingUpdate(false);
        setIsProductEdit({ open: false, rowData: null });
        fetchProductInventory();
        onSuccess();
      })
      .catch((error) => {
        setIsLoadingUpdate(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDeleteData = async (rows) => {
    const data = {
      invoiceId: invoiceData?._id,
      materialIds: rows?.map((e) => e.materialId) || []
    };
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData._id}/progressive-billing/remove`, data)
      .then((res) => {
        fetchProductInventory();
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader title={`Invoice Number : ${invoiceData?.invoiceNumber}`} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
        <CustomDialogContent>
          <Fragment>
            <Box display="flex" justifyContent="space-between">
              {invoiceData && <InvoiceFacility invoiceData={invoiceData} />}
              <Box display="flex" alignItems="center">
                <Button
                  variant="outlined"
                  color="default"
                  size="small"
                  onClick={handleClick}
                  aria-controls="action-menu"
                  disabled={selectedProducts.filter(d => !['Per Day', 'Per Week', 'Per Month'].includes(d?.pricingMethod))?.length === 0}
                >
                  Actions <ExpandMore />
                </Button>
                <Menu
                  id="action-menu"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      handleDeleteData(selectedProducts.filter(d => !['Per Day', 'Per Week', 'Per Month'].includes(d?.pricingMethod)));
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
            {columns && rowsData ? (
              <Box zIndex={5} width={'100%'} height={'calc(100vh - 285px)'} p={1}>
                <CustomReactTable
                  height={'calc(100vh - 285px)'}
                  columns={columns}
                  data={rowsData}
                  onSelect={setSelectedProducts}
                  childrenProperty="subRows"
                  uniqueKey="_id"
                  hideSelection={false}
                  renderedFrom="rental_management_create_billing"
                  isClientSideGrid={true}
                />
              </Box>
            ) : (
              <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </Fragment>
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button
            type="button"
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
              onClose();
            }}
          >
            Cancel
          </Button>
        </CustomDialogFooter>
      </Dialog>
      {isProductEdit.open && (
        <RentalJobQtyDialog
          onClose={() => {
            setIsProductEdit({ open: false, rowData: null });
          }}
          isBulkedit={false}
          handleSaveData={handleSaveData}
          rentalManagementData={rentalManagementData}
          rowData={rowsData?.find((d) => d._id === isProductEdit.rowData._id)}
          material={material}
          selectedProducts={[]}
          loading={isLoadingUpdate}
          isQtyOnly={true}
        />
      )}
    </Fragment>
  );
};

export default ViewBillingDialog;
