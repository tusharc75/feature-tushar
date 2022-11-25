import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { Box, Button, capitalize, Chip, Divider, Grid, makeStyles, Tooltip, Typography } from '@material-ui/core';
import { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import { dateFormat, downloadExcel, formatAmountWithCurrency, getUniqueCurrencies, prepareDataForGrid, quotation } from '../../../constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { FaDiceOne } from 'react-icons/fa';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import moment from 'moment';
import { fetch_quotation_product_fields } from 'src/components/Quotation/helper';
import { isMobile, isTablet } from 'react-device-detect';
import { Skeleton } from '@material-ui/lab';
import CustomButton from 'src/components/Helpers/CustomButton';
import QCcomment from './QCcomment';
import { orderBy, startCase } from 'lodash';

const QuotationCustomerAccept = ({ openAuthId }) => {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState(null);
  const [isSubmited, setIsSubmited] = useState(false);
  const [quotationName, setQuotationName] = useState('');
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState({ accept: false, reject: false });
  const [rowsData, setRowsData] = useState(null);

  useEffect(() => {
    fetchProductInventory();
  }, [openAuthId]);

  const fetchFields = async (quotationData) => {
    var data = await fetch_quotation_product_fields(quotationData?.currency);
    const coloum: any = [
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile ? 'none' : 'left',
        disableFilters: true,
        width: 200,
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
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {
              <p className="text-truncate" title={row.original?.detail}>
                {row.original?.detail}
              </p>
            }
            {row.original?.parentId === null && row.original?.type !== 'Service' && (
              <Box ml={1} className="d-flex align-items-center">
                {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
              </Box>
            )}
          </div>
        )
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
                    <p>{formatAmountWithCurrency(quotationData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
                  <p>{formatAmountWithCurrency(quotationData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
    coloum.forEach((element) => {
      if (element.accessor.includes('detail')) {
        element['Footer'] = () => {
          return <>Total</>;
        };
      } else if (element.accessor === 'qtyDisplay') {
        element['Footer'] = (info) => {
          const qtyTotal = info.rows
            .filter((f) => f?.original?.parentId === null && f?.values?.hasOwnProperty(element?.accessor) && !isNaN(f?.values[element?.accessor]))
            .reduce((sum, row) => row?.values[element?.accessor] + sum, 0);
          return <>{qtyTotal}</>;
        };
      } else if (element.accessor.includes('finalPrice')) {
        element['Footer'] = (info) => {
          const total = info?.rows
            .filter((f) => f?.original?.parentId === null && f?.values?.hasOwnProperty(element?.accessor) && !isNaN(f?.values[element?.accessor]))
            .reduce((sum, row) => row?.values[element?.accessor] + sum, 0);
          return (
            <>
              {getUniqueCurrencies().find((d) => d.currencyCode === quotationData?.currency)?.symbolNative}{' '}
              {formatAmountWithCurrency(quotationData?.currency, total)?.amountWithouCurrencyCode ?? total}
            </>
          );
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
    const response = await axiosInstance().get(`${quotation.api}/customer/${openAuthId}`);

    setQuotationName(response?.data?.data?.name);
    data = response?.data?.data?.product;
    inventory = data?.inventory ? data?.inventory : [];
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.detail = `${
        parent.type === 'serializedAsset'
          ? parent.serializedAssetDetail?.assetNumber
          : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
          ? parent.serviceDetail?.serviceName
          : parent.packageDetail?.packageName
      }`;
      parent.serializedProduct = parent.type === 'product' ? parent.productDetail?.serializedProduct : false;
      // parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
      // parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + response?.data?.data?.quoteData?.currency?.toLowerCase()] ? true : false;
      parent.hideSelection = inventory.filter((e) => e._id === parent._id).length ? true : !isRateRequired;
      parent.assetQty = inventory.filter((e) => e._id === parent._id).length;
      parent.subRows = generateNestedData(data.material, inventory, parent, response?.data?.data?.quoteData?.currency);
    });
    setRowsData([...rows]);
    fetchFields(response?.data?.data?.quoteData);
  };

  const generateNestedData = (material, inventory, parent, currency) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.detail = `${
        _subRow.type === 'serializedAsset'
          ? _subRow.serializedAssetDetail?.assetNumber
          : _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'service'
          ? _subRow.serviceDetail?.serviceName
          : _subRow.packageDetail?.packageName
      }`;
      _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
      // _subRow.leadTimeData = Array.isArray(_subRow.leadTime) ? _subRow.leadTime : [];
      // _subRow.leadTime = Array.isArray(_subRow.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      _subRow.qtyDisplay = _subRow.qty;
      _subRow.isValid = true;
      _subRow.hideSelection = inventory.filter((e) => e._id === _subRow._id).length ? true : !isRateRequired;
      _subRow.assetQty = inventory.filter((e) => e._id === _subRow._id).length;
      _subRow.subRows = generateNestedData(material, inventory, _subRow, currency);
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return orderBy(subRows, ['order'], ['asc']);
  };

  const handleSubmit = (value: any, comment: string = '') => {
    let dataObj: any = {
      response: value,
      comment: comment,
      openAuthId: openAuthId
    };
    axiosInstance()
      .put(`${quotation.api}/customer/customer-response`, dataObj)
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

export default QuotationCustomerAccept;
