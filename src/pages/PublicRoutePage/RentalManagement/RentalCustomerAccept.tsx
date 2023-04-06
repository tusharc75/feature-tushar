import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { Box, Button, capitalize, Chip, Divider, Grid, makeStyles, Tooltip, Typography } from '@material-ui/core';
import { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import {
  dateFormat,
  downloadExcel,
  formatAmountWithCurrency,
  getUniqueCurrencies,
  prepareDataForGrid,
  quotation,
  rentalManagement
} from '../../../constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { FaDiceOne } from 'react-icons/fa';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import moment from 'moment';
import { isMobile, isTablet } from 'react-device-detect';
import { Skeleton } from '@material-ui/lab';
import CustomButton from 'src/components/Helpers/CustomButton';
import QCcomment from './QCcomment';
import { fetch_rental_product_fields } from 'src/components/RentalManagment/helper';

const RJCustomerAccept = ({ openAuthId }) => {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState(null);
  const [isSubmited, setIsSubmited] = useState(false);
  const [quotationName, setQuotationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState({ accept: false, reject: false });
  const [rowsData, setRowsData] = useState(null);

  useEffect(() => {
    fetchProductInventory();
  }, [openAuthId]);

  const fetchFields = async (rentalManagementData) => {
    const currencySymbol = getUniqueCurrencies().find((d) => d.currencyCode === rentalManagementData['currency'])?.symbolNative;
    var { fields: data, allFields } = await fetch_rental_product_fields(rentalManagementData?.currency, false);
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
            {<p> {row.original.detail}</p>}
            {
              <Box ml={1} className="d-flex align-items-center">
                <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                  {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
                </span>
              </Box>
            }
            {
              <Chip
                className="ml-1"
                label={`${row.original.type === 'product' ? (!row.original.serializedProduct ? 'Non-Serialized Product' : 'Product') : 'Package'}`}
                size="small"
                color="primary"
              />
            }
          </div>
        ),
        Footer: () => {
          return <>Total</>;
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
    setLoading(false);
  };

  const fetchProductInventory = async () => {
    setLoading(true);
    var data: any = [];
    var inventory: any = [];
    var nonSerializeAsset: any = [];
    const response = await axiosInstance().get(`${rentalManagement.api}/customer/${openAuthId}`);

    setQuotationName(response?.data?.data?.rentalData?.rentalJobName || '');
    data = response?.data?.data?.products;
    inventory = data.inventory;
    nonSerializeAsset = data.nonSerializeAsset;
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${parent.type === 'product' ? parent.productDetail?.productName : parent.packageDetail?.packageName}`;
      parent.serializedProduct = parent.type === 'product' ? parent.productDetail?.serializedProduct : false;
      parent.qtyDisplay = parent.qty;
      parent.isValid = true;
      parent.assetQty = parent.serializedProduct
        ? inventory?.filter((e) => e._id === parent._id).length
        : nonSerializeAsset?.filter((e) => e._id === parent._id).length;
      parent.hideSelection = parent.assetQty > 0 ? true : parent?.status ? true : false;
      parent.subRows = generateNestedData(data.material, inventory, nonSerializeAsset, parent);
    });
    setRowsData(rows);
    fetchFields(response?.data?.data?.rentalData);
  };

  const generateNestedData = (material, inventory, nonSerializeAsset, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.detail = _subRow?.productDetail?.productName;
      _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.isValid = true;
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

  const handleSubmit = (value: any, comment: string = '') => {
    let dataObj: any = {
      response: value,
      comment: comment,
      openAuthId: openAuthId
    };
    axiosInstance()
      .put(`${rentalManagement.api}/customer/customer-response`, dataObj)
      .then((res) => {
        setIsSubmited(true);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Your response has been submitted successfully.`
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <>
      {!isSubmited && (
        <Box display="flex" pt={1} mx={2}>
          <Grid container justifyContent="space-between" style={{ marginBottom: 0, paddingBottom: 1 }}>
            <Grid item className="d-flex align-items-center">
              {loading ? (
                <Skeleton width={100} />
              ) : (
                <Typography
                  className="text-capitalize"
                  style={{ display: 'inline-block' }}
                  variant="h6"
                  component="h2"
                  color="primary"
                  id="detailHeaderPageTitle"
                >
                  <span className="d-flex align-items-center">
                    <span className="listingHeader"> {quotationName}</span>
                  </span>
                </Typography>
              )}
            </Grid>
            <Grid
              id="detailHeaderPageActions"
              item
              className={
                isMobile && !isTablet ? 'd-flex align-items-center justify-flex-end gap-1' : 'd-flex align-items-center gap-2 justify-flex-end'
              }
            >
              {loading ? (
                <>
                  <Skeleton width={50} />
                  <Skeleton width={50} />
                </>
              ) : (
                <>
                  <Tooltip title="Accept">
                    <CustomButton
                      loading={isSubmitting.accept}
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={isSubmitting.accept}
                      onClick={() => {
                        handleSubmit('accept');
                        setIsSubmitting({ accept: true, reject: false });
                      }}
                    >
                      Accept
                    </CustomButton>
                  </Tooltip>
                  <Tooltip title="Reject">
                    <CustomButton
                      loading={isSubmitting.reject}
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={isSubmitting.reject}
                      onClick={() => {
                        setIsSubmitting({ accept: false, reject: true });
                      }}
                    >
                      Reject
                    </CustomButton>
                  </Tooltip>
                </>
              )}
            </Grid>
          </Grid>
        </Box>
      )}
      {isSubmited ? (
        <h1 style={{ padding: '10px', display: 'flex', justifyContent: 'center', color: '#047d1c' }} title={' Thanks for your submission'}>
          Thanks for your submission
        </h1>
      ) : (
        <>
          <Box p={2}>
            <>
              <div className={'detail-box-content'} style={{ marginTop: 0 }}>
                <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                <h3 className="form-label-style" title={' Product List'}>
                  Product List
                </h3>
              </div>
              <Box my={2} />
              {columns ? (
                !loading ? (
                  <CustomReactTable
                    height={'calc(100vh - 218px)'}
                    columns={columns}
                    data={rowsData}
                    setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
                    onSelect={() => {}}
                    hideSelection={true}
                    hideAction={true}
                    childrenProperty="subRows"
                    uniqueKey="_id"
                    renderedFrom="quotation_product_package"
                    isClientSideGrid={true}
                  />
                ) : (
                  <Box p={2} bgcolor="white">
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                  </Box>
                )
              ) : (
                <Box p={2} bgcolor="white">
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              )}
            </>
          </Box>
        </>
      )}
      {isSubmitting.reject && (
        <QCcomment
          onClose={() => {
            setIsSubmitting({ accept: false, reject: false });
          }}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
};

export default RJCustomerAccept;
