import { useState, useEffect, useContext } from 'react';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axios from 'axios';
import { backendApi } from '../../config';
import { Box, Button, Divider, makeStyles } from '@material-ui/core';
import { downloadExcel, gridLoadingTimeout, prepareDataForGrid } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { sortBy } from 'lodash';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { FaDiceOne } from 'react-icons/fa';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';

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
const QuotationSupplierPrice = ({ quotationData, openAuthId }) => {
  let renderedFrom = 'QuotationSupplierPrice';
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer();
  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
  const [productData, setProductData] = useState([]);
  const [productArray, setProductArray] = useState([]);
  const [requireFieldArray, setRequireFieldArray] = useState([]);
  const [quotationDetailsData, setQuotationDetailsData] = useState(null);
  const [isSubmited, setIsSubmited] = useState(false);

  const quotationFields = [
    {
      fieldData: {
        _id: '62d103f69be8b23c5e3fba17',
        fieldLabel: 'Quotation Number',
        type: 'singleLine',
        option: [],
        required: true,
        isTooltip: false,
        tooltipMessage: '',
        editAble: true,
        deletAble: true,
        order: 1,
        hiddenField: false,
        isDefaultValue: false,
        disableOnEdit: false,
        unique: true,
        primaryField: true,
        lookup: false,
        lookupResource: '',
        entityWiseLookup: false,
        isDropdown: false,
        isWarningTooltip: false,
        warningTooltipMessage: '',
        defaultValue: '',
        fieldName: 'quotationNumber',
        sectionName: 'Quotation Information',
        resource: 'Quotation',
        brand: '62666e58de44fa0e29624707',
        roleType: 0
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '62d103f69be8b23c5e3fba18',
        fieldLabel: 'Quotation Date',
        type: 'date',
        option: [],
        required: false,
        isTooltip: false,
        tooltipMessage: '',
        editAble: true,
        deletAble: true,
        order: 2,
        fieldName: 'quotationDate',
        sectionName: 'Quotation Information',
        resource: 'Quotation',
        brand: '62666e58de44fa0e29624707',
        roleType: 0
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    }
  ];

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = () => {
    dispatch({ type: 'loading', loading: true });
    axios
      .get(backendApi + `/quotation/supplier-price-request/supplier-price-response/${quotationData?.data?.requestId}`)
      .then(({ data: { data } }) => {
        setQuotationDetailsData(data?.quotation);
        let rows = data.products.map((item, index) => {
          let res: any = {
            ...prepareDataForGrid(item)
          };
          res.index = index + 1;
          res.detail = item?.productName ?? item?.serviceName;
          return res;
        });
        setProductArray(rows);
        let columns = [];
        columns = [
          {
            accessor: 'index',
            Header: 'Index',
            width: 150,
            show: true,
            disabled: true,
            primaryField: true,
            Cell: ({ row }) => <p className="text-truncate">{row?.original?.index}</p>,
            Footer: () => {
              return <>Total</>;
            }
          },
          {
            accessor: 'detail',
            Header: 'Detail',
            width: 150,
            show: true,
            disabled: true,
            primaryField: true,
            Cell: ({ row }) => <p className="text-truncate">{row?.original?.detail}</p>,
            Footer: () => {
              return <>Total</>;
            }
          }
        ];

        let fields = [];
        let tempProductData = [];
        data.products?.forEach((ele) => {
          fields = [...fields, ...ele.fields];
          ele?.fields?.forEach((field) => {
            const currencyField: any =
              field?.type === 'currencyAmount'
                ? {
                    ...field,
                    fieldName: field?.fieldName + '_' + quotationData?.currency?.toLowerCase()
                  }
                : {};

            rows.forEach((data) => {
              if (data[currencyField?.fieldName]) {
                let productIndex = tempProductData.findIndex((d) => d._id === data?.uniqueId);
                let tempData = {
                  _id: data?.uniqueId,
                  [currencyField?.fieldName]: parseInt(data[currencyField?.fieldName] === '' ? 0 : data[currencyField?.fieldName]),
                  [`price_${quotationData?.currency.toLowerCase()}`]: parseInt(
                    data[currencyField?.fieldName] === '' ? 0 : data[currencyField?.fieldName]
                  )
                };
                if (productIndex === -1) {
                  tempProductData = [...tempProductData, tempData];
                } else {
                  tempProductData[productIndex][currencyField?.fieldName] = tempData[currencyField?.fieldName];
                  tempProductData[productIndex][`price_${quotationData?.currency.toLowerCase()}`] = tempData[currencyField?.fieldName];
                }
                setProductData(tempProductData);
              }
            });
          });

          const filteredFields = ele?.fields?.filter((e) => data?.requiredFields.includes(e.fieldName));
          const newColumns = generateColumns(renderedFrom, filteredFields, null, false, quotationData.currency);
          columns = [...columns, ...newColumns];
        });
        setRequireFieldArray(data?.requiredFields);

        columns = sortBy(columns, function (item: any) {
          return levalOrderBy.indexOf(item.leval);
        });
        setColumns([...columns]);

        dispatch({ type: 'initialize', data: rows, count: rows.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const onCellValueChanged = (data, row) => {
    const col = Object.keys(data)[0];
    const value = data[col];
    let tempFieldsNumber = [];
    let productIndex = productData.findIndex((d) => d._id === row?.uniqueId);
    let tempData = {
      _id: row?.uniqueId,
      [col]: parseInt(row[col] === '' ? 0 : row[col]),
      [`price_${quotationDetailsData?.currency.toLowerCase()}`]: parseInt(row[col] === '' ? 0 : row[col])
    };
    if (productIndex === -1) {
      setProductData((prevState) => [...prevState, tempData]);
    } else {
      let tempProductData = productData;
      tempProductData[productIndex][`price_${quotationDetailsData?.currency.toLowerCase()}`] =
        tempData[`price_${quotationDetailsData?.currency.toLowerCase()}`];
      tempProductData[productIndex][col] = tempData[col];
      setProductData(tempProductData);
    }
  };

  const handleSubmit = () => {
    let checkField: boolean;
    if (requireFieldArray.length === 1) {
      checkField = !(productArray.length !== productData.length);
    } else {
      checkField = !(
        productArray.length !== productData.length ||
        productData.length === 0 ||
        !productData.every((data) => Object.keys(data).length === requireFieldArray.length + 1)
      );
    }

    if (checkField) {
      let tempData = {
        material: productData,
        requestId: quotationData?.data?.requestId,
        openAuthId: openAuthId
      };

      axios
        .post(backendApi + `/quotation/supplier-price-request/supplier-price-response `, tempData)
        .then(({ data }) => {
          setIsSubmited(true);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      toastConfig.setToastConfig({
        message: 'Please enter all required fields',
        type: 'error',
        open: true
      });
    }
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
      <Box display="flex" pt={1} justifyContent="flex-end">
        <Box mx={1} />
        {!isSubmited && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            // disabled={disabledSubmitButton}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        )}
        <Box mx={1} />
      </Box>

      {isSubmited ? (
        <h1 style={{ padding: '10px', display: 'flex', justifyContent: 'center', color: '#047d1c' }} title={' Thanks for your submission'}>
          Thanks for your submission
        </h1>
      ) : (
        <>
          {quotationDetailsData ? <DetailsPage data={quotationDetailsData} fields={quotationFields} /> : null}
          <Box mt={2} p={2}>
            <>
              <div className={'detail-box-content'}>
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
                <CustomReactTable
                  height={'calc(100vh - 200px)'}
                  columns={columns}
                  onSelect={() => {}}
                  state={state}
                  dispatch={dispatch}
                  renderedFrom={renderedFrom}
                  refreshGrid={fetchProduct}
                  onSaveEdit={onCellValueChanged}
                  showOnlyShowFilteredRecordSwitch={true}
                  isClientSideGrid={false}
                  hideAction={false}
                  hideSelection={false}
                />
              ) : (
                <Box p={2} height={500}>
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

export default QuotationSupplierPrice;
