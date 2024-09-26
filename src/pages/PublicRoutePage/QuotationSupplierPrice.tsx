import { useState, useEffect, useContext } from 'react';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axios from 'axios';
import { backendApi } from '../../config';
import { Box, Button, Divider, makeStyles } from '@material-ui/core';
import { MATERIAL_TYPE, downloadExcel, gridLoadingTimeout, prepareDataForGrid } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { sortBy, startCase } from 'lodash';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { FaDiceOne } from 'react-icons/fa';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';

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
  const { state, dispatch } = useTableReducer({ renderedFrom });

  const { dataRows } = state;

  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
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
    fetchData();
  }, []);

  const getParentPricing = (row: any, fieldName: any) => {
    let pricing = 0;
    if (row?.subRows?.length > 0) {
      row?.subRows?.forEach((subRow) => {
        pricing += subRow[fieldName] || 0;
      });
    }
    if (pricing === 0) {
      return row[fieldName] || 0;
    }
    return pricing;
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    axios
      .get(backendApi + `/quotation/supplier-price-request/supplier-price-response/${quotationData?.data?.requestId}`)
      .then(({ data: { data } }) => {
        setQuotationDetailsData(data?.quotation);
        const material = data?.materials.filter((e) => !!!e?.parentId);
        const filteredFields = data?.fields?.filter((e) => data?.requiredFields.includes(e.fieldName));
        let rows = material?.map((item, index) => {
          let res: any = {
            ...prepareDataForGrid(item)
          };
          res.index = index + 1;
          res.detail =
            item?.type === MATERIAL_TYPE.product
              ? item?.productDetail?.productName
              : item?.type === MATERIAL_TYPE.service
                ? item?.serviceDetail?.serviceName
                : item?.type === MATERIAL_TYPE.package
                  ? item?.packageDetail?.packageName
                  : '';
          res.description =
            item?.type === MATERIAL_TYPE.product
              ? item?.productDetail?.productDescription
              : item?.type === MATERIAL_TYPE.service
                ? item?.serviceDetail?.serviceDescription
                : item?.type === MATERIAL_TYPE.package
                  ? item?.packageDetail?.packageDescription
                  : '';
          res.subRows = generateNestedData(data?.materials, res, filteredFields);
          filteredFields?.forEach((field) => {
            const fieldName = `${field?.fieldName}_${quotationData?.currency?.toLowerCase() || 'usd'}`;
            res[fieldName] = getParentPricing(res, fieldName);
          });
          return res;
        });
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
            accessor: 'type',
            Header: 'Type',
            width: 150,
            show: true,
            disabled: true,
            Cell: ({ row }) => <p className="text-truncate">{startCase(row?.original?.type)}</p>
          },
          {
            accessor: 'detail',
            Header: 'Detail',
            width: 150,
            show: true,
            disabled: true,
            Cell: ({ row }) => <p className="text-truncate">{row?.original?.detail}</p>
          },
          {
            accessor: 'description',
            Header: 'Description',
            width: 150,
            show: true,
            disabled: true,
            Cell: ({ row }) => (row?.original?.description ? <p className="text-truncate">{row?.original?.description}</p> : <NoDataCell />)
          }
        ];

        const newColumns = generateColumns(renderedFrom, filteredFields, null, false, quotationData.currency);
        newColumns?.forEach((e) => {
          e.editable = true;
        });

        setRequireFieldArray(filteredFields);

        setColumns([...columns, ...newColumns]);

        dispatch({ type: 'initialize', data: rows, count: rows.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const generateNestedData = (material, parent, filteredFields) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail =
        _subRow?.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productName
          : _subRow?.type === MATERIAL_TYPE.service
            ? _subRow?.serviceDetail?.serviceName
            : _subRow?.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageName
              : '';
      _subRow.description =
        _subRow?.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription
          : _subRow?.type === MATERIAL_TYPE.service
            ? _subRow?.serviceDetail?.serviceDescription
            : _subRow?.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription
              : '';
      _subRow.subRows = generateNestedData(material, _subRow, filteredFields);
      filteredFields?.forEach((field) => {
        const fieldName = `${field?.fieldName}_${quotationData?.currency?.toLowerCase() || 'usd'}`;
        _subRow[fieldName] = getParentPricing(_subRow, fieldName);
      });
    });

    return subRows;
  };

  const onSaveEdit = (data, row) => {
    if (!data) return;
    const rows = [...dataRows];
    rows?.forEach((d) => {
      if (row?._id === d._id) {
        Object.assign(d, data);
        requireFieldArray?.forEach((field) => {
          const fieldName = `${field?.fieldName}_${quotationData?.currency?.toLowerCase() || 'usd'}`;
          if (data.hasOwnProperty(fieldName)) {
            d?.subRows?.forEach((subRow) => {
              subRow[fieldName] = 0;
            });
          }
        });
      } else {
        if (d?.subRows?.length > 0) {
          d.subRows.forEach((subRow) => {
            if (subRow?._id === row?._id) {
              Object.assign(subRow, data);
              requireFieldArray?.forEach((field) => {
                const fieldName = `${field?.fieldName}_${quotationData?.currency?.toLowerCase() || 'usd'}`;
                if (data.hasOwnProperty(fieldName)) {
                  d[fieldName] = getParentPricing(d, fieldName);
                }
              });
            }
          });
        }
      }
    });
    dispatch({ type: 'update', data: rows });
  };

  const handleSubmit = () => {
    let checkField: boolean;
    if (requireFieldArray.length === 1) {
      checkField = !(dataRows.length !== dataRows.length);
    } else {
      checkField = !(
        dataRows.length !== dataRows.length ||
        dataRows.length === 0 ||
        !dataRows.every((data) => Object.keys(data).length === requireFieldArray.length + 1)
      );
    }

    const material = [];

    dataRows?.forEach((e: any) => {
      const data: any = {};
      requireFieldArray?.forEach((field) => {
        data[`${field?.fieldName}_${quotationData?.currency?.toLowerCase() || 'usd'}`] =
          e[`${field?.fieldName}_${quotationData?.currency?.toLowerCase() || 'usd'}`];
      });
      material.push({
        _id: e._id,
        ...data
      });
      e?.subRows?.forEach((subRow) => {
        const data: any = {};
        requireFieldArray?.forEach((field) => {
          data[`${field?.fieldName}_${quotationData?.currency?.toLowerCase() || 'usd'}`] =
            subRow[`${field?.fieldName}_${quotationData?.currency?.toLowerCase() || 'usd'}`];
        });
        material.push({
          _id: subRow._id,
          ...data
        });
      });
    });

    if (checkField) {
      let tempData = {
        material: material,
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
        message: `Uploading, Please wait...`
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
            fetchData();
          } else {
            const fileName = response.headers['content-disposition'].split('filename=')[1];
            fetchData();
          }
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

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
    <div className="p-2">
      <Box display="flex" className="pb-2" justifyContent="flex-end">
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
                  Products
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
                  state={state}
                  dispatch={dispatch}
                  renderedFrom={renderedFrom}
                  refreshGrid={fetchData}
                  onSaveEdit={onSaveEdit}
                  showOnlyShowFilteredRecordSwitch={true}
                  isClientSideGrid={true}
                  hideAction={true}
                  hideSelection={true}
                  expander={true}
                  hideExportTable={true}
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
    </div>
  );
};

export default QuotationSupplierPrice;
