import { Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Skeleton } from '@mui/material';
import { orderBy, startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { displayDate, formatAmountWithCurrency, getUniqueCurrencies, MATERIAL_TYPE, quotation } from '../../../constants/helpers';
import QCcomment from './QCcomment';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import axios from 'axios';
import { backendApi } from 'src/config';

const renderedFrom = 'quotation_product_package';

const QuotationCustomerAccept = ({ openAuthId }) => {
  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [isSubmited, setIsSubmited] = useState(false);
  const [quotationName, setQuotationName] = useState('');
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState({ accept: false, reject: false });

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { loading } = state;

  useEffect(() => {
    fetchProductInventory();
  }, [openAuthId]);

  const fetchFields = async (fields, currency) => {
    var data = CURReplaceByCurrencySingle(fields, currency ? currency : 'USD');
    const coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile || isTablet ? 'none' : 'left',
        disabled: true,
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
        sticky: isMobile || isTablet ? 'none' : 'left',
        disabled: true,
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
      if (element.fieldName === 'price' && element.required) {
        setIsRateRequired(true);
      }
      if (element.type === 'date') {
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          disableFilters: true,
          Cell: ({ row }) => (row.original[element.fieldName] ? <p>{displayDate(row.original[element.fieldName])}</p> : <NoDataCell />)
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
                    <p>{formatAmountWithCurrency(currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
                  <p>{formatAmountWithCurrency(currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
      if (element.accessor === 'qtyDisplay') {
        element['Footer'] = (info) => {
          const qtyTotal = info.rows
            ?.filter((f) => f?.original?.parentId === null && f?.values?.hasOwnProperty(element?.accessor) && !isNaN(f?.values[element?.accessor]))
            ?.reduce((sum, row) => row?.values[element?.accessor] + sum, 0);
          return <>{qtyTotal}</>;
        };
      } else if (element.accessor.includes('finalPrice')) {
        element['Footer'] = (info) => {
          const total = info?.rows
            ?.filter((f) => f?.original?.parentId === null && f?.values?.hasOwnProperty(element?.accessor) && !isNaN(f?.values[element?.accessor]))
            ?.reduce((sum, row) => row?.values[element?.accessor] + sum, 0);
          return (
            <>
              {getUniqueCurrencies().find((d) => d.currencyCode === currency)?.symbolNative}{' '}
              {formatAmountWithCurrency(currency, total)?.amountWithouCurrencyCode ?? total}
            </>
          );
        };
      }
    });
    const columnToShow = coloum?.filter((i) => i.accessor !== 'pricingCondition');
    setColumns(columnToShow);
    dispatch({ type: 'loading', loading: false });
  };

  const fetchProductInventory = async () => {
    dispatch({ type: 'loading', loading: true });
    var data: any = [];
    var inventory: any = [];
    const response = await axios.get(backendApi + `${quotation.api}/customer/${openAuthId}`);

    const fields = response?.data?.data?.fields;

    setQuotationName(response?.data?.data?.name);
    data = response?.data?.data?.product;
    inventory = data?.inventory ? data?.inventory : [];
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${parent.type === MATERIAL_TYPE.serializedAsset
        ? parent.serializedAssetDetail?.assetNumber
        : parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.service
            ? parent.serviceDetail?.serviceName
            : parent.packageDetail?.packageName
        }`;
      parent.description =
        parent.type === MATERIAL_TYPE.service
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === MATERIAL_TYPE.product
            ? parent?.productDetail?.productDescription || ''
            : parent.type === MATERIAL_TYPE.package
              ? parent?.packageDetail?.packageDescription || ''
              : '';
      parent.serializedProduct = parent.type === MATERIAL_TYPE.product ? parent.productDetail?.serializedProduct : false;
      // parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
      // parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + response?.data?.data?.quoteData?.currency?.toLowerCase()] ? true : false;
      parent.hideSelection = inventory.filter((e) => e._id === parent._id).length ? true : !isRateRequired;
      parent.assetQty = inventory.filter((e) => e._id === parent._id).length;
      parent.subRows = generateNestedData(data.material, inventory, parent, response?.data?.data?.quoteData?.currency);
    });
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    fetchFields(fields, response?.data?.data?.quoteData?.currency);
  };

  const generateNestedData = (material, inventory, parent, currency) => {
    const subRows: any = material
      ?.filter((e) => e.parentId === parent._id)
      ?.sort((a, b) => a?.order - b?.order)
      ?.sort((a, b) => a?.preWork - b?.preWork);

    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail = `${_subRow.type === MATERIAL_TYPE.serializedAsset
        ? _subRow.serializedAssetDetail?.assetNumber
        : _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.service
            ? _subRow.serviceDetail?.serviceName
            : _subRow.packageDetail?.packageName
        }`;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
      // _subRow.leadTimeData = Array.isArray(_subRow.leadTime) ? _subRow.leadTime : [];
      // _subRow.leadTime = Array.isArray(_subRow.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      _subRow.qtyDisplay = _subRow.qty;
      _subRow.isValid = true;
      _subRow.hideSelection = inventory.filter((e) => e._id === _subRow._id).length ? true : !isRateRequired;
      _subRow.assetQty = inventory.filter((e) => e._id === _subRow._id).length;
      _subRow.subRows = generateNestedData(material, inventory, _subRow, currency);
    });
    if (subRows.length === 0 && parent.type === MATERIAL_TYPE.package) {
      parent.isValid = false;
    }
    if (parent.type === MATERIAL_TYPE.package) {
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
    axios
      .put(backendApi + `${quotation.api}/customer/customer-response`, dataObj)
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
            <Grid className="d-flex align-items-center">
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
              className={
                isMobile && !isTablet ? 'd-flex align-items-center justify-flex-end gap-1' : 'd-flex align-items-center justify-flex-end gap-2'
              }
            >
              {loading ? (
                <>
                  <Skeleton width={50} />
                  <Skeleton width={50} />
                </>
              ) : (
                <>
                  <HtmlTooltip title="Accept">
                    <ThemeButton
                      isLoading={isSubmitting.accept}
                      buttonType="theme"
                      disabled={isSubmitting.accept}
                      onClick={() => {
                        setIsSubmitting({ accept: true, reject: false });
                      }}
                    >
                      Accept
                    </ThemeButton>
                  </HtmlTooltip>
                  <HtmlTooltip title="Reject">
                    <ThemeButton
                      isLoading={isSubmitting.reject}
                      buttonType="theme"
                      disabled={isSubmitting.reject}
                      onClick={() => {
                        setIsSubmitting({ accept: false, reject: true });
                      }}
                    >
                      Reject
                    </ThemeButton>
                  </HtmlTooltip>
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
                <CustomReactTable
                  height={'calc(100vh - 218px)'}
                  columns={columns}
                  state={state}
                  dispatch={dispatch}
                  setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
                  refreshGrid={fetchProductInventory}
                  hideSelection={true}
                  hideAction={true}
                  renderedFrom={renderedFrom}
                  isClientSideGrid={true}
                />
              ) : (
                <Box p={2}>
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              )}
            </>
          </Box>
        </>
      )}
      {(isSubmitting.reject || isSubmitting.accept) && (
        <QCcomment
          type={isSubmitting.reject ? 'reject' : 'accept'}
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
