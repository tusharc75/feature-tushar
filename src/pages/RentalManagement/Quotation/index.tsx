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
import Add from '@material-ui/icons/Add';
import moment from 'moment';
import { rentalManagement, dateFormat, pricingCondition, formatAmountWithCurrency, QUOTATION_STATUS } from '../../../constants/helpers';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import { isMobile, isTablet } from 'react-device-detect';
import { MdDelete } from 'react-icons/md';
import { fetch_rental_product_fields } from '../../../components/RentalManagment/helper';

const Quotation = ({
  rentalManagementData,
  setNextStep,
  currencySymbol,
  isTabletScreen,
  isSmallScreen,
  showActivity,
  renderedFrom,
  stepFullScreen,
  allowedToEdit
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [material, setMaterial] = useState([]);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null });
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [sendCustomerLoading, setSendCustomerLoading] = useState(false);
  const [responseLoading, setResponseLoading] = useState({
    accept: false,
    reject: false
  });
  const [rentalManagementUpdated, setRentalManagementUpdated] = useState(rentalManagementData);

  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [columns]);

  useEffect(() => {
    fetchQuotationData();
  }, [rentalManagementData?._id]);

  const fetchQuotationData = async () => {
    axiosInstance()
      .get(`${rentalManagement.api}/${rentalManagementData?._id}`)
      .then((res) => {
        setRentalManagementUpdated(res?.data?.data);
        if (
          res?.data?.data?.quotationStatus === QUOTATION_STATUS.acceptByCustomer ||
          res?.data?.data?.quotationStatus === QUOTATION_STATUS.rejectByCustomer
        ) {
          setNextStep(true);
        }
      });
  };

  const fetchFields = async () => {
    var { fields: data, allFields } = await fetch_rental_product_fields(rentalManagementData?.currency, isOffline);
    setAllFields(JSON.parse(JSON.stringify(allFields)));
    const coloum: any = [
      {
        accessor: 'srno',
        Header: '#',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>
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
              <p className="link text-truncate" title={row.original.detail}>
                {row.original.detail}
              </p>
            )}
            {
              <Box ml={1} className="d-flex align-items-center">
                <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                  {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
                </span>
                {!isOffline && allowedToEdit && (
                  <HtmlTooltip title="Add Products">
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
                label={`${row.original.type === 'product' ? (!row.original.serializedProduct ? 'Non-Serialized Product' : 'Product') : 'Package'}`}
                size="small"
                color="primary"
                onClick={() => {
                  window.open(
                    `${row.original.type === 'product' ? routes.productDetail.path : routes.packagesDetail.path}/${row.original.materialId}`
                  );
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
    setNextStep(false);
    var data: any = [];
    var inventory: any = [];
    var nonSerializeAsset: any = [];
    if (
      rentalManagementUpdated?.quotationStatus &&
      (rentalManagementUpdated?.quotationStatus === QUOTATION_STATUS.acceptByCustomer ||
        rentalManagementUpdated?.quotationStatus === QUOTATION_STATUS.rejectByCustomer)
    ) {
      setNextStep(true);
    }

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
    const rows = data.material.filter((e) => e.parentId === null);

    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${parent.type === 'product' ? parent.productDetail?.productName : parent.packageDetail?.packageName}`;
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
      setNextStep(false);
    }

    setRowsData(rows);
  };

  const generateNestedData = (material, inventory, nonSerializeAsset, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.detail = _subRow?.productDetail?.productName;
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

  const getNestedSubRows = (obj, original) => {
    if (original?.subRows?.length) {
      original?.subRows.forEach((element) => {
        obj.push({ id: element._id, type: element.type, materialId: element.materialId });
        getNestedSubRows(obj, element);
      });
    }
  };

  const calculatePrice = (arr: any[]) => {
    //materialType can be =["product","packages","productCategory"]
    //conditionType can be =["Price","Rent","Discount","Charge","Tax"]
    if (rentalManagementData) {
      const data: any = {};
      data.conditionType = ['Rent'];
      data.material = arr.map((ele) => ({
        materialId: ele?.materialId,
        materialType: ele?.type,
        qty: ele?.qty,
        pricingMethod: ele?.pricingMethod,
        unit: ele?.unit,
        currency: rentalManagementData?.currency
      }));
      data.supplier = [];
      data.customer = [rentalManagementData?.customerAccount?.optionValue];
      data.warehouse = [rentalManagementData?.warehouse?.optionValue];
      return new Promise((resolve, reject) => {
        axiosInstance()
          .post(pricingCondition.api + `/calculatePrice`, data)
          .then(({ data: { data } }) => {
            resolve(data);
          })
          .catch((err) => {
            reject(err);
          });
      });
    }
  };

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const sendToCustomer = () => {
    setSendCustomerLoading(true);
    axiosInstance()
      .get(`${rentalManagement.api}/quotation/${rentalManagementData?._id}/send-to-customer`)
      .then(() => {
        fetchQuotationData();
        setSendCustomerLoading(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Sent to customer Sucessfully'
        });
      })
      .catch((error) => {
        setSendCustomerLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleResponse = (res) => {
    const data = {
      response: res
    };
    if (res === QUOTATION_STATUS.acceptByCustomer) {
      setResponseLoading({ accept: true, reject: false });
    } else {
      setResponseLoading({ accept: false, reject: true });
    }
    axiosInstance()
      .put(`${rentalManagement.api}/quotation/${rentalManagementData?._id}/response`, data)
      .then(() => {
        fetchQuotationData();
        setResponseLoading({ accept: false, reject: false });
        if (res === QUOTATION_STATUS.acceptByCustomer) {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'Accepted Quotation Sucessfully'
          });
        } else {
          toastConfig.setToastConfig({
            open: true,
            type: 'info',
            message: 'Quotation Rejected Sucessfully'
          });
        }
      })
      .catch((error) => {
        setResponseLoading({ accept: false, reject: false });
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Grid container spacing={2}>
        {allowedToEdit && (
          <Grid item xs={12} md={12} sm={12}>
            <Box display="flex" justifyContent="space-between" m={1}>
              <Box />
              <Box display="flex">
                {!rentalManagementUpdated?.quotationStatus && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    color="primary"
                    size="small"
                    disabled={sendCustomerLoading}
                    endIcon={sendCustomerLoading && <CircularProgress size={20} />}
                    onClick={() => {
                      sendToCustomer();
                    }}
                  >
                    Send To Customer
                  </Button>
                )}
                {rentalManagementUpdated?.quotationStatus === QUOTATION_STATUS.sentToCustomer &&
                  rentalManagementUpdated?.quotationStatus !== QUOTATION_STATUS.acceptByCustomer &&
                  rentalManagementUpdated?.quotationStatus !== QUOTATION_STATUS.rejectByCustomer && (
                    <Box display="flex">
                      <Box mx={1} />
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        color="primary"
                        size="small"
                        disabled={responseLoading.accept}
                        endIcon={responseLoading.accept && <CircularProgress size={20} />}
                        onClick={() => {
                          handleResponse(QUOTATION_STATUS.acceptByCustomer);
                        }}
                      >
                        {isMobile && !isTablet ? <MdDelete size={20} /> : 'Accept'}
                      </Button>
                      <Box mx={1} />

                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        color="primary"
                        size="small"
                        disabled={responseLoading.reject}
                        endIcon={responseLoading.reject && <CircularProgress size={20} />}
                        onClick={() => {
                          handleResponse(QUOTATION_STATUS.rejectByCustomer);
                        }}
                      >
                        {isMobile && !isTablet ? <MdDelete size={20} /> : 'Reject'}
                      </Button>
                    </Box>
                  )}
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
                onSelect={() => {}}
                childrenProperty="subRows"
                uniqueKey="_id"
                hideSelection={true}
                renderedFrom="rental_management_product_package"
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
    </Fragment>
  );
};

export default Quotation;
