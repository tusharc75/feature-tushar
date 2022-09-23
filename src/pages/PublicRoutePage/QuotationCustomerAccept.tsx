import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axios from 'axios';
import { backendApi } from '../../config';
import { Box, Button, capitalize, Chip, Divider, Grid, makeStyles, Tooltip, Typography } from '@material-ui/core';
import { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import {
  dateFormat,
  downloadExcel,
  formatAmountWithCurrency,
  getUniqueCurrencies,
  gridLoadingTimeout,
  prepareDataForGrid,
  quotation,
  QUOTATION_STATUS
} from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { getFrameworkComponents } from '../../constants/useColumns';
import { CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import CustomAgGridEditable from 'src/components/AgGridComponents/CustomAgGridEditable';
import { sortBy } from 'lodash';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { FaDiceOne } from 'react-icons/fa';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import moment from 'moment';
import { fetch_quotation_product_fields } from 'src/components/Quotation/helper';
import DetailsPageHeader from 'src/components/DetailsPageHeader';
import { isMobile, isTablet } from 'react-device-detect';

let levalOrderBy = ['product', 'product-custom', 'product-template', 'price-template', 'product-builder-custom', 'price-builder-custom'];

const useStyles = makeStyles((theme) => ({
  root: {
    padding: '10px',
    width: '100%',
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  linksContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    ['@media (max-width: 960px)']: {
      display: 'none'
    }
  },
  links: {
    color: theme.palette.info.light, //  textDark
    fontSize: 15
  },
  darkLinks: {
    color: theme.palette.info.dark, //  textDark
    fontSize: 15
  },
  linkDivider: {
    backgroundColor: '#ffffff42', //  darkBg
    margin: '0 10px'
  },
  darkLinkDivider: {
    backgroundColor: 'grey', //  darkBg
    margin: '0 10px'
  },
  delBtn: {
    color: 'red'
  },
  expandIcon: {
    position: 'absolute',
    right: '0',
    color: 'white'
  },
  darkExpandIcon: {
    position: 'absolute',
    right: '0',
    color: theme.palette.info.dark
  }
}));

const displayColumns = ['qty'];

const QuotationCustomerAccept = ({ quotationData, openAuthId }) => {
  let renderedFrom = 'QuotationCustomerAccept';
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting } = state;
  const [columns, setColumns] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [productData, setProductData] = useState([]);
  const [productArray, setProductArray] = useState([]);
  const [requireFieldArray, setRequireFieldArray] = useState([]);
  const [isSubmited, setIsSubmited] = useState(false);
  const [disabledSubmitButton, setDisabledSubmitButton] = useState(true);
  const [quotationCurrency, setQuotationCurrency] = useState('');
  const [quotationName, setQuotationName] = useState('');
  const [isRateRequired, setIsRateRequired] = useState(false);

  console.log(quotationData, openAuthId);

  useEffect(() => {
    fetchProduct();
  }, [openAuthId]);

  async function fetchProduct() {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    await axiosInstance()
      .get(`${quotation.api}/customer/${openAuthId}`)
      .then((response) => {
        dispatch({ type: 'initialize', data: response?.data?.data?.rows, count: response?.data?.data?.length });
        dispatch({ type: 'loading', loading: false });
        setQuotationCurrency(response?.data?.data?.quotationCurrency);
        setQuotationName(response?.data?.data?.name);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
    fetchFields();
  }

  const fetchFields = async () => {
    var data = await fetch_quotation_product_fields(quotationCurrency);
    const coloum: any = [
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
                <span>({row.original?.subRows?.length})</span>
              </Box>
            )}
            <Chip className="ml-1" label={`${capitalize(row.original?.type)}`} size="small" color="primary" />
          </div>
        )
      },
      {
        accessor: 'leadTime',
        Header: 'Lead Time (Days)',
        Cell: ({ row }) => (row.original?.leadTime && row.original?.leadTime?.length ? <p>{row.original['leadTime']}</p> : <p>0</p>),
        Footer: (info) => {
          const total = info.rows
            .filter((f) => f.values.hasOwnProperty('leadTime') && !isNaN(f.values['leadTime']))
            .reduce((sum, row) => parseInt(row.values['leadTime']) + sum, 0);
          return <>{total}</>;
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
                    <p>{formatAmountWithCurrency(quotationCurrency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
                  <p>{formatAmountWithCurrency(quotationCurrency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
              {getUniqueCurrencies().find((d) => d.currencyCode === quotationCurrency)?.symbolNative}{' '}
              {formatAmountWithCurrency(quotationCurrency, total)?.amountWithouCurrencyCode ?? total}
            </>
          );
        };
      }
    });
    setColumns(coloum);
  };
  //   const fetchProduct = () => {
  //     dispatch({ type: 'loading', loading: true });
  //     if (gridApi) {
  //       gridApi.setRowData([]);
  //     }
  //     axios
  //       .get(backendApi + `/quotation/supplier-price-request/supplier-price-response/${quotationData?.data?.requestId}`)
  //       .then(({ data: { data } }) => {
  //         setQuotationDetailsData(data?.quotation);
  //         let rows = data.products.map((item, index) => {
  //           let res: any = {
  //             ...prepareDataForGrid(item)
  //           };
  //           res.srno = index + 1;
  //           res.detail = item?.productName ?? item?.serviceName;
  //           return res;
  //         });
  //         setProductArray(rows);
  //         let columns = [];
  //         columns = [
  //           {
  //             field: 'srno',
  //             headerName: 'Item #',
  //             width: 150,
  //             show: true,
  //             disabled: true,
  //             order: 0,
  //             cellRenderer: 'commonRenderer',
  //             primaryField: true
  //           },
  //           {
  //             field: 'detail',
  //             headerName: 'Detail',
  //             width: 150,
  //             show: true,
  //             disabled: true,
  //             order: 0,
  //             cellRenderer: 'commonRenderer',
  //             primaryField: true
  //           }
  //         ];
  //         let rendererNames = [];
  //         let fields = [];
  //         data.products?.forEach((ele) => {
  //           fields = [...fields, ...ele.fields];
  //         });
  //         setRequireFieldArray(data?.requiredFields);
  //         GenrateColoum(
  //           [...new Map(fields.map((item) => [item['_id'], item])).values()],
  //           columns,
  //           rendererNames,
  //           data?.requiredFields,
  //           rows,
  //           data?.quotation
  //         );

  //         let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
  //         tempFrameworkComponent = {
  //           commonRenderer: CommonRenderer,
  //           ...tempFrameworkComponent
  //         };
  //         setFrameWorkComponent({ ...tempFrameworkComponent });
  //         columns = sortBy(columns, function (item: any) {
  //           return levalOrderBy.indexOf(item.leval);
  //         });
  //         setColumns([...columns]);

  //         dispatch({ type: 'initialize', data: rows, count: rows.length });
  //         setTimeout(() => {
  //           dispatch({ type: 'loading', loading: false });
  //         }, gridLoadingTimeout);
  //       })
  //       .catch((error) => {
  //         toastConfig.setToastConfig(error);
  //       });
  //   };

  //   const GenrateColoum = (fields, column, rendererNames, requiredFields, rows, quotation) => {
  //     let _fields = fields;
  //     let tempProductData = [];
  //     _fields.forEach((ele) => {
  //       if (displayColumns.includes(ele.fieldName) || requiredFields.includes(ele.fieldName)) {
  //         if (ele.type === 'converter' || ele.type === 'currencyAmount' || ele.isConverter === true) {
  //           if (ele.type !== 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
  //             ele.displayUnits.forEach((_unit) => {
  //               let fieldName = ele.fieldName + '_' + _unit.toLowerCase();
  //               let fieldLabel = ele.fieldLabel + ' ' + _unit;
  //               if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
  //                 let col: any = {};
  //                 col.field = fieldName;
  //                 col.headerName = fieldLabel;
  //                 col.width = 180;
  //                 col.show = true;
  //                 col.disabled = false;
  //                 col.leval = ele.leval;
  //                 col.cellRenderer = 'commonRenderer';
  //                 column.push(col);
  //               }
  //             });
  //           } else if (ele.type === 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
  //             ele.displayUnits.forEach((_unit) => {
  //               ele.displayCurrency.forEach((_currency) => {
  //                 let fieldName = ele.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
  //                 let fieldLabel = ele.fieldLabel + ' ' + _unit + '/' + _currency;
  //                 if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
  //                   let col: any = {};
  //                   col.field = fieldName;
  //                   col.headerName = fieldLabel;
  //                   col.width = 180;
  //                   col.show = true;
  //                   col.disabled = false;
  //                   col.leval = ele.leval;
  //                   col.cellRenderer = 'commonRenderer';
  //                   column.push(col);
  //                 }
  //               });
  //             });
  //           } else if (ele.type === 'currencyAmount') {
  //             ele.displayCurrency.forEach((_currency) => {
  //               let fieldName = ele.fieldName + '_' + _currency.toLowerCase();
  //               let fieldLabel = ele.fieldLabel + ' ' + _currency;
  //               if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
  //                 let col: any = {};
  //                 col.field = fieldName;
  //                 col.headerName = fieldLabel;
  //                 col.width = 180;
  //                 col.show = true;
  //                 col.disabled = false;
  //                 col.leval = ele.leval;
  //                 col.cellRenderer = 'commonRenderer';
  //                 if (requiredFields.includes(ele.fieldName)) {
  //                   col.cellEditor = 'numericCellEditor';
  //                   col.editable = true;
  //                   rows.forEach((data) => {
  //                     if (data[fieldName]) {
  //                       let productIndex = tempProductData.findIndex((d) => d._id === data?.uniqueId);
  //                       let tempData = {
  //                         _id: data?.uniqueId,
  //                         [fieldName]: parseInt(data[fieldName] === '' ? 0 : data[fieldName]),
  //                         [`price_${quotation?.currency.toLowerCase()}`]: parseInt(data[fieldName] === '' ? 0 : data[fieldName])
  //                       };
  //                       if (productIndex === -1) {
  //                         tempProductData = [...tempProductData, tempData];
  //                       } else {
  //                         tempProductData[productIndex][fieldName] = tempData[fieldName];
  //                         tempProductData[productIndex][`price_${quotation?.currency.toLowerCase()}`] = tempData[fieldName];
  //                       }
  //                     }
  //                   });
  //                   setProductData(tempProductData);
  //                 }
  //                 column.push(col);
  //               }
  //             });
  //           }
  //         } else {
  //           if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
  //             let col: any = {};
  //             if (
  //               ele.type === 'decimal' ||
  //               ele.type === 'percent' ||
  //               ele.type === 'singleLine' ||
  //               ele.type === 'multiLine' ||
  //               ele.type === 'multiSelect'
  //             ) {
  //               col.field = ele.fieldName;
  //               col.headerName = ele.fieldLabel;
  //               col.width = 180;
  //               col.show = true;
  //               col.disabled = false;
  //               col.leval = ele.leval;
  //               col.cellRenderer = 'commonRenderer';
  //               column.push(col);
  //             }
  //           }
  //         }
  //       }
  //     });
  //   };

  //   const onCellValueChanged = (row) => {
  //     let tempFieldsNumber = [];
  //     let productIndex = productData.findIndex((d) => d._id === row.data?.uniqueId);
  //     let tempData = {
  //       _id: row.data?.uniqueId,
  //       [row?.column?.colId]: parseInt(row?.data[row?.column?.colId] === '' ? 0 : row?.data[row?.column?.colId]),
  //       [`price_${quotationDetailsData?.currency.toLowerCase()}`]: parseInt(row?.data[row?.column?.colId] === '' ? 0 : row?.data[row?.column?.colId])
  //     };
  //     if (productIndex === -1) {
  //       setProductData((prevState) => [...prevState, tempData]);
  //     } else {
  //       let tempProductData = productData;
  //       tempProductData[productIndex][`price_${quotationDetailsData?.currency.toLowerCase()}`] =
  //         tempData[`price_${quotationDetailsData?.currency.toLowerCase()}`];
  //       tempProductData[productIndex][row?.column?.colId] = tempData[row?.column?.colId];
  //       setProductData(tempProductData);
  //     }
  //   };

  const handleSubmit = (value: any) => {
    let dataObj: any = {
      response: value,
      openAuthId: openAuthId
    };
    axiosInstance()
      .put(`${quotation.api}/customer/customer-response`, dataObj)
      .then((res) => {
        setIsSubmited(true);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Your Response Submitted Successfully`
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const uploadData = (event) => {
    if (event.target.files && event.target.files.length) {
      toastConfig.setToastConfig({
        hideDuration: null,
        open: true,
        type: 'info',
        message: `Uploading ${module}, Please wait...`
      });
      const file = event.target.files[0];

      let formData = new FormData();
      formData.append('file', file);
      axiosInstance()
        .post(`/quotation/supplier-price-request/price-request-import/${quotationData?.data?.requestId}`, formData, {
          responseType: 'blob',
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then((response) => {
          if (!response.headers['content-disposition']) {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: 'All Records Added Successfully'
            });
            fetchProduct();
          } else {
            const fileName = response.headers['content-disposition'].split('filename=')[1];
            fetchProduct();
          }
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  /**
   * EXPORT TABLES INTO EXCEL
   */
  const exportToExcel = () => {
    toastConfig.setToastConfig({
      hideDuration: null,
      open: true,
      type: 'info',
      message: `Your file will be downloaded/uploaded in a matter of seconds`
    });
    axiosInstance()
      .get(`/quotation/supplier-price-request/price-request-template/${quotationData?.data?.requestId}`, {
        responseType: 'arraybuffer'
      })
      .then((response) => {
        const fileName = response.headers['content-disposition'].split('filename=')[1];
        downloadExcel(response.data, fileName);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Exported to excel successfully.'
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const ImportInput = (
    <input
      onClick={(e: any) => (e.target.value = null)}
      id="importFromExcel"
      name="importFromExcel"
      onChange={uploadData}
      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
      style={{
        opacity: '0',
        position: 'absolute',
        zIndex: -1
      }}
      type="file"
    />
  );

  return (
    <>
      <Box display="flex" pt={1} mx={2}>
        <Grid container justifyContent="space-between" style={{ marginBottom: 0, paddingBottom: 1 }}>
          <Grid item className="d-flex align-items-center">
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
          </Grid>
          <Grid
            id="detailHeaderPageActions"
            item
            className={
              isMobile && !isTablet ? 'd-flex align-items-center justify-flex-end gap-1' : 'd-flex align-items-center gap-2 justify-flex-end'
            }
          >
            {!isSubmited && (
              <>
                <Tooltip title="Accept">
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                      handleSubmit('accept');
                    }}
                  >
                    Accept
                  </Button>
                </Tooltip>
                <Tooltip title="Reject">
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                      handleSubmit('reject');
                    }}
                  >
                    Reject
                  </Button>
                </Tooltip>
              </>
            )}
          </Grid>
        </Grid>
      </Box>

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
              <div id="importExportLinks" className={`${classes.root}`}>
                <div className={classes.linksContainer}>
                  <>
                    <label htmlFor="importFromExcel" className={`${classes.darkLinks} p-1 cursor-pointer`}>
                      {ImportInput}
                      Import from Excel
                    </label>
                    <Divider orientation="vertical" flexItem className={classes.darkLinks} />
                  </>
                  <label onClick={exportToExcel} className={`${classes.darkLinks} p-1 cursor-pointer`}>
                    Export to Excel
                  </label>
                </div>
              </div>
              {columns ? (
                !loading ? (
                  <CustomReactTable
                    columns={columns}
                    data={dataRows}
                    setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
                    onSelect={() => {}}
                    hideSelection={true}
                    childrenProperty="subRows"
                    uniqueKey="_id"
                    renderedFrom={renderedFrom}
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
    </>
  );
};

export default QuotationCustomerAccept;
