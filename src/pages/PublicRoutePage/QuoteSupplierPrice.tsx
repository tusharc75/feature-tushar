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

const QuoteSupplierPrice = ({ quoteData, openAuthId }) => {
  let renderedFrom = 'QuoteSupplierPrice';
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
  const [productData, setProductData] = useState([]);
  const [productArray, setProductArray] = useState([]);
  const [requireFieldArray, setRequireFieldArray] = useState([]);
  const [quoteDetailsData, setQuoteDetailsData] = useState(null);
  const [isSubmited, setIsSubmited] = useState(false);

  const quoteFields = [
    {
      fieldData: {
        _id: '628e0cb1dc9001aec1d293d9',
        fieldLabel: 'Quote Name',
        type: 'singleLine',
        option: [],
        required: true,
        isTooltip: false,
        tooltipMessage: '',
        editAble: true,
        deletAble: true,
        order: 1,
        isUneditable: true,
        hiddenField: false,
        isDefaultValue: true,
        disableOnEdit: true,
        unique: true,
        primaryField: true,
        lookup: false,
        lookupResource: '',
        isDropdown: false,
        isWarningTooltip: false,
        warningTooltipMessage: '',
        defaultValue: 'Auto Generated',
        fieldName: 'quoteName',
        sectionName: 'Quote Information',
        resource: 'Quotes',
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
      .get(backendApi + `/quote-builder/supplier-price-response/${quoteData?.data?.requestId}`)
      .then(({ data: { data } }) => {
        setQuoteDetailsData(data?.quote);
        let rows = data.products.map((item, index) => {
          let res: any = {
            ...prepareDataForGrid(item)
          };
          res.index = index + 1;
          res.isChecked = false;
          return res;
        });
        setProductArray(rows);
        let columns = [];
        columns = [
          {
            field: 'index',
            headerName: 'Index',
            width: 150,
            show: true,
            disabled: true,
            order: 0,
            primaryField: true
          }
        ];
        let rendererNames = [];
        let fields = [];
        let tempProductData = [];
        data.products?.forEach((ele) => {
          ele?.fields?.forEach((e) => {
            const currencyField: any =
              e?.type === 'currencyAmount'
                ? {
                  ...ele,
                  fieldName: ele.fieldName + '_' + quoteData.currency.toLowerCase()
                }
                : {};

            rows.forEach((data) => {
              if (data[currencyField?.fieldName]) {
                let productIndex = tempProductData.findIndex((d) => d.uniqueId === data?.uniqueId);
                let tempData = {
                  uniqueId: data?.uniqueId,
                  [currencyField?.fieldName]: parseInt(data[currencyField?.fieldName] === '' ? 0 : data[currencyField?.fieldName])
                };
                if (productIndex === -1) {
                  tempProductData = [...tempProductData, tempData];
                } else {
                  tempProductData[productIndex][currencyField?.fieldName] = tempData[currencyField?.fieldName];
                }
                setProductData(tempProductData);
              }
            });
          });
          const filteredFields = ele?.fields?.filter((e) => data?.requiredFields.includes(e.fieldName) || data?.displayColumns.includes(e.fieldName));
          const newColumns = generateColumns(renderedFrom, filteredFields, null, false, quoteData.currency);
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
    let productIndex = productData.findIndex((d) => d.uniqueId === row?.uniqueId);
    let tempData = {
      uniqueId: row?.uniqueId,
      [col]: parseInt(row[col] === '' ? 0 : row[col])
    };
    if (productIndex === -1) {
      setProductData((prevState) => [...prevState, tempData]);
    } else {
      let tempProductData = productData;
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
        products: productData,
        requestId: quoteData?.data?.requestId,
        openAuthId: openAuthId
      };

      axios
        .post(backendApi + `/quote-builder/supplier-price-response`, tempData)
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
        .post(`/quote-builder/price-request-import/${quoteData?.data?.requestId}`, formData, {
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
      .get(`/quote-builder/price-request-template/${quoteData?.data?.requestId}`, {
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
      className="sr-only"
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
      <Box display="flex" p={1} justifyContent="flex-end">
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
          {quoteDetailsData ? <DetailsPage data={quoteDetailsData} fields={quoteFields} /> : null}
          <Box mt={2} p={2}>
            <>
              <div className={'detail-box-content'}>
                <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                <h3 className="form-label-style" title={'Detail'}>
                  Detail
                </h3>
              </div>
              <div id="importExportLinks" className={`${classes.root}`}>
                <div className={classes.linksContainer}>
                  <>
                    <label htmlFor="importFromExcel" className={`${classes.darkLinks} cursor-pointer p-1`}>
                      {ImportInput}
                      Import from Excel
                    </label>
                    <Divider orientation="vertical" flexItem className={classes.darkLinks} />
                  </>
                  <label onClick={exportToExcel} className={`${classes.darkLinks} cursor-pointer p-1`}>
                    Export to Excel
                  </label>
                </div>
              </div>
              {columns ? (
                <CustomReactTable
                  height={'calc(100vh - 200px)'}
                  columns={columns}
                  onSelect={() => { }}
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

export default QuoteSupplierPrice;
