import { MenuItem } from '@mui/material';
import Box from '@mui/material/Box';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { camelCase, map, sortBy, uniq } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import CustomEditableGrid, { useTableReducer as useEditableTableReducer } from 'src/components/CustomEditableGridNew';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import routes from '../../components/Helpers/Routes';
import { extractFields, handleAutoCalculation } from '../../constants/formulaUtility';
import { QUOTE_PROCESS_STATUS, gridLoadingTimeout, prepareDataForGrid, sidebarResource, supplierContact } from '../../constants/helpers';
import CustomReactTable, { useColumns, useTableReducer } from '../CustomReactTable';
import HtmlTooltip from '../CustomTooltipTitle';
import { AddField } from '../FormBuilder/AddField';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import ConfirmationDialog from '../Helpers/ConfirmationDialog';
import { DetailsPageHeader } from '../PageHeaders';
import CreateProduct from '../Product/CreateProduct';
import ImportExportLinks from '../Product/ImportExportLinks';
import { useData } from './../../StateProvider/Provider';
import AddExistingProduct from './AddExistingProduct';
import AskSupplierPriceDialog from './AskSupplierPriceDialog';
import BulkEditDialog from './BulkEditDialog';
import ProductDialog from './ProductDialog';
import SupplierAskPrice from './SupplierAskPrice';
import ViewSupplierPriceDialog from './ViewSupplierPriceDialog';
import { FiExternalLink } from 'react-icons/fi';

let levalOrderBy = ['product', 'product-custom', 'product-template', 'price-template', 'product-builder-custom', 'price-builder-custom'];

const ProductBuilder = (props) => {
  const {
    productBuilderId,
    isAddNewProduct,
    setIsAddNewProduct,
    isAddExistingProduct,
    setIsAddExistingProduct,
    refreshProducts,
    Editable,
    stage,
    currency,
    isPriceBuilder,
    hasPermission,
    permissions,
    fromQuote,
    setColumnData,
    fullScreen = false,
    quoteData = null,
    processStatus,
    setNextStep,
    isAddButtonVisible,
    addButtonMenuItems,
    previewDownloadProps,
    leftSideContents,
    rightSideContents,
    ifQuoteApproved = null,
    currentVersion = null
  } = props;

  const renderedFrom = `${camelCase(`${sidebarResource.quoteBuilder}_Product`)}`;

  const toastConfig = useContext(CustomToastContext);

  const [productData, setProductData] = useState(null);
  const [productId, setProductId] = useState(null);
  const [productDataList, setproductDataList] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isAddField, setIsAddField] = useState(false);
  const [showCloseConfirmBox, setShowCloseConfirmBox] = useState(false);
  const [addFieldData, setaddFieldData] = useState({ section: [], fields: [] });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showViewSupplierPrice, setShowViewSupplierPrice] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isClone, setIsClone] = useState(false);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [openSupplierPriceDialog, setOpenSupplierPriceDialog] = useState(false);
  const [askSupplierPriceDialog, setAskSupplierPriceDialog] = useState(false);
  const [supplierContactData, setSupplierContactData] = useState([]);
  const [supplierData, setSupplierData] = useState(null);
  const [inlineBulkEdit, setInlineBulkEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { generateColumns } = useColumns();

  const {
    state: { user }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { state: editableState, dispatch: editableDispatch } = useEditableTableReducer();

  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [productBuilderId, processStatus]);

  useEffect(() => {
    if (processStatus === QUOTE_PROCESS_STATUS.doaProcess) {
      const currentVersionStatus = quoteData?.versions[currentVersion]?.status;
      if (currentVersionStatus.includes('Accepted')) {
        setNextStep(true);
      } else {
        setNextStep(false);
      }
    }
    if (processStatus === QUOTE_PROCESS_STATUS.sendToCustomer) {
      if ((ifQuoteApproved && ifQuoteApproved.approved) || (currentVersion && quoteData?.versions[currentVersion]?.offered)) {
        setNextStep(true);
      }
    }
  }, [quoteData]);

  const fetchProduct = () => {
    if (setNextStep) {
      setNextStep(false);
    }
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    setColumns(null);
    axiosInstance()
      .get(`/productbuilder/getproduct/${productBuilderId}`)
      .then(({ data: { data } }) => {
        let columns = [];
        columns = [
          {
            accessor: 'index',
            Header: 'Index',
            width: 150,
            show: true,
            disabled: true,
            Cell: ({ row }) => {
              return (
                <div>
                  {!Editable ? (
                    <p className="text-truncate">{row.original.index}</p>
                  ) : (
                    <p
                      onClick={() => {
                        openProductModel(row.original?._id);
                      }}
                      className="link text-truncate"
                    >
                      {row.original.index}
                    </p>
                  )}
                </div>
              );
            }
          }
        ];
        let fields = data.productFields || [];
        data?.productTemplate?.forEach((ele) => {
          fields = [...fields, ...ele.fields];
        });
        data?.priceTemplate?.forEach((ele) => {
          ele?.fields?.forEach((item) => {
            if (item.type === 'converter' || item.type === 'currencyAmount' || item.isConverter === true) {
              item.isColumnEditable = true;
            }
            if (item.type === 'currencyAmount' && (item.type === 'converter' || item.isConverter === true)) {
              item.isColumnEditable = true;
            }
            if (
              item.type === 'decimal' ||
              item.type === 'percent' ||
              item.type === 'singleLine' ||
              item.type === 'multiLine' ||
              item.type === 'currencyAmount'
            ) {
              item.isColumnEditable = true;
            }
          });
          fields = [...fields, ...ele.fields];
        });
        data.product?.forEach((e) => {
          if (e?.fields && e?.fields?.length) {
            e?.fields?.forEach((field) => {
              if (!fields?.find((e) => e.fieldName === field?.fieldName)) {
                fields.push(field);
              }
            });
          }
        });
        if ([QUOTE_PROCESS_STATUS.quoteBuilder, QUOTE_PROCESS_STATUS.sendToCustomer, QUOTE_PROCESS_STATUS.end]?.includes(processStatus)) {
          fields?.forEach((f) => {
            f.isColumnEditable = false;
          });
        }
        let newColumns = generateColumns(renderedFrom, fields, routes.productDetail.path, false, currency);
        newColumns?.forEach((e) => {
          if (e.accessor === 'productName') {
            e.cell = ({ row }) => (
              <div className="flex items-center gap-1">
                <p className="text-truncate" title={row?.original?.productName}>
                  {' '}
                  {row?.original?.productName}
                </p>
                {row?.original?.productId && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.productDetail.path}/${row.original.productId}`);
                    }}
                  >
                    <FiExternalLink size={16} className="text-gray-500 dark:text-gray-300" />
                  </IconButton>
                )}
              </div>
            );
          }
        });
        columns = [...columns, ...newColumns];

        if (stage && stage === 'product') {
          fields = fields.filter((t) => t.leval === 'product' || t.leval === 'product-custom' || t.leval === 'product-template');
        }
        columns = columns.filter((column, index, self) => self.findIndex((col) => col.accessor === column.accessor) === index);
        columns = sortBy(columns, function (item: any) {
          return levalOrderBy.indexOf(item.leval);
        });
        setColumns([...columns, ActionsRenderer]);
        if (setColumnData) {
          setColumnData([...columns]);
        }
        setProductData(data);
        let rows = data.product.map((item, index) => {
          let res: any = {
            ...prepareDataForGrid(item)
          };
          res.index = index + 1;
          res.isChecked = false;
          res.canDelete = permissions?.isUpdate && fromQuote ? (hasPermission ? true : false) : true;
          res.allowedToEdit = permissions?.isUpdate && fromQuote ? (hasPermission ? true : false) : true;
          res.isSupplierExist = isPriceBuilder && fromQuote && permissions.isUpdate && user?.role?.selectedEntity?.policy?.isQuoteAskSupplierPrice;
          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: rows.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
        if (processStatus === QUOTE_PROCESS_STATUS.new) {
          if (rows?.length) {
            setNextStep(true);
          }
        } else if (processStatus === QUOTE_PROCESS_STATUS.priceBuilder) {
          if (!rows?.length) {
            setNextStep(false);
          } else if (rows?.find((ele) => (ele[`totalSalesPrice_${currency?.toLowerCase()}`] || 0) === 0 || (ele[`qty`] || 0) === 0)) {
            setNextStep(false);
          } else {
            setNextStep(true);
          }
        } else if (processStatus === QUOTE_PROCESS_STATUS.quoteBuilder) {
          setNextStep(true);
        } else if (processStatus === QUOTE_PROCESS_STATUS.doaProcess) {
        } else {
        }
        refreshProducts(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => {
      const permission = permissions?.isUpdate && fromQuote ? (hasPermission ? true : false) : true;
      return (
        <>
          <HtmlTooltip title="Clone">
            <IconButton
              disabled={permission ? false : true}
              size="small"
              aria-label="Clone"
              onClick={() => {
                openProductModel(row?.original?._id);
                setIsClone(true);
              }}
            >
              <FileCopyIcon fontSize="small" color={permission ? 'primary' : 'disabled'} />
            </IconButton>
          </HtmlTooltip>
          <HtmlTooltip title="Edit">
            <IconButton
              disabled={permission ? false : true}
              size="small"
              aria-label="Edit"
              onClick={() => {
                openProductModel(row.original?._id);
              }}
            >
              <EditIcon fontSize="small" color={permission ? 'primary' : 'disabled'} />
            </IconButton>
          </HtmlTooltip>
          {row?.original?.isSupplierExist && (
            <IconButton
              disabled={row?.original?.isSupplierExist ? false : true}
              size="small"
              aria-label="Supplier"
              onClick={() => {
                supplierPriceDialogData(row?.original);
              }}
            >
              <VisibilityIcon fontSize="small" color={row?.original?.isSupplierExist ? 'primary' : 'disabled'} />
            </IconButton>
          )}
          <HtmlTooltip title="Delete">
            <IconButton
              disabled={permission ? false : true}
              size="small"
              aria-label="Delete"
              onClick={() => {
                setDeleteRecord(row?.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon fontSize="small" color={permission ? 'error' : 'disabled'} />
            </IconButton>
          </HtmlTooltip>
        </>
      );
    }
  };

  const supplierPriceDialogData = (product) => {
    setOpenSupplierPriceDialog(true);
    setSupplierData(product);
  };

  const openProductModel = (id) => {
    setProductId(id);
  };

  const addProductInBuilder = (rows) => {
    let data: any = {};
    data.product = rows;
    data._id = productBuilderId;
    axiosInstance()
      .post(`/productbuilder/addproduct`, data)
      .then(() => {
        fetchProduct();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveProduct = (rows) => {
    if (isClone) {
      addProductInBuilder(rows);
      setProductId(null);
      setIsClone(false);
    } else {
      let data: any = {};
      data.product = rows;
      data._id = productBuilderId;
      axiosInstance()
        .put(`/productbuilder/updateProduct`, data)
        .then(() => {
          setProductId(null);
          setIsBulkEdit(false);
          setproductDataList([]);
          fetchProduct();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleSaveProductInlineBulk = (rows) => {
    setIsSubmitting(true);

    let data: any = {};
    data.product = rows;
    data._id = productBuilderId;
    axiosInstance()
      .put(`/productbuilder/updateproduct-inline-bulk`, data)
      .then(() => {
        setIsSubmitting(false);
        fetchProduct();
        setInlineBulkEdit(false);
      })
      .catch((error) => {
        setIsSubmitting(false);
        setInlineBulkEdit(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((d) => d.id);
    }
    let data: any = {};
    data.productBuilderId = productBuilderId;
    data._ids = ids;
    axiosInstance()
      .post(`/productbuilder/deleteproduct`, data)
      .then(() => {
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        fetchProduct();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleOpenAddField = () => {
    const rows: any = productData.product.filter((data) => selectedRecords.some((rec) => rec._id === data._id));
    if (rows.length) {
      let section: any = [];
      let fields = productData.productFields;
      fields = [...fields, ...rows[0].fields];
      const productTemplate: any = productData?.productTemplate?.filter((e) => e._id === rows[0]?.productTemplate?.optionValue);
      if (productTemplate.length) {
        fields = [...fields, ...productTemplate[0].fields];
      }
      const priceTemplate: any = productData?.priceTemplate?.filter((e) => e._id === rows[0]?.priceTemplate?.optionValue);
      if (priceTemplate.length) {
        fields = [...fields, ...priceTemplate[0].fields];
      }
      section = uniq(map(fields, 'sectionName'));
      fields = extractFields(fields);
      setaddFieldData({ section: section, fields: fields });
      setIsAddField(true);
    }
  };

  const handleCloseAddField = () => {
    setIsAddField(false);
  };

  const handleAddField = (field) => {
    let data: any = {};
    data.productBuilderId = productBuilderId;
    data._ids = selectedRecords.map((d) => d.id);
    data.field = field;
    data.field.leval = 'price-builder-custom';
    if (addFieldData.fields.filter((_f) => _f.sectionName === data.field.sectionName).length) {
      if (addFieldData.fields.filter((_f) => _f.sectionName === data.field.sectionName)[0].leval !== 'price-template') {
        data.field.leval = 'product-builder-custom';
      }
    }
    axiosInstance()
      .post(`/productbuilder/addField`, data)
      .then(() => {
        fetchProduct();
        setIsAddField(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handelOpenBulkEdit = () => {
    const rows: any = productData.product.filter((data) => selectedRecords.some((rec) => rec._id === data._id));
    setproductDataList(rows);
    setIsBulkEdit(true);
  };

  const checkUniqTemplate = () => {
    if (selectedRecords.length === 0) {
      return true;
    } else if (uniq(map(selectedRecords, 'priceTemplate')).length === 1 && stage === 'cost') {
      return false;
    } else {
      return true;
    }
  };

  const onCellValueChanged = (data, row) => {
    const col = Object.keys(data)[0];
    const value = data[col];
    const changeRow: any = productData.product.filter((_p) => _p._id === row._id);
    if (changeRow.length) {
      const productRow: any = changeRow[0];
      let fieldName = col;
      if (col.split('_').length) {
        fieldName = col.split('_')[0];
      }
      let fields = productData.productFields;
      fields = [...fields, ...productRow.fields];
      const productTemplate: any = productData?.productTemplate?.filter((e) => e._id === productRow?.productTemplate?.optionValue);
      if (productTemplate.length) {
        fields = [...fields, ...productTemplate[0].fields];
      }
      const priceTemplate: any = productData?.priceTemplate?.filter((e) => e._id === productRow?.priceTemplate?.optionValue);
      if (priceTemplate.length) {
        fields = [...fields, ...priceTemplate[0].fields];
      }
      const fieldData = fields.filter((_f) => _f.fieldName === fieldName);
      if (fieldData.length) {
        let currency = '';
        let unit = '';
        if (col.split('_').length) {
          if (fieldData[0].type !== 'currencyAmount' && (fieldData[0].type === 'converter' || fieldData[0].isConverter === true)) {
            if (col.split('_').length === 2) {
              unit = col.split('_')[1];
            }
          } else if (fieldData[0].type === 'currencyAmount' && (fieldData[0].type === 'converter' || fieldData[0].isConverter === true)) {
            if (col?.split('_').length === 3) {
              currency = col.split('_')[1];
              unit = col.split('_')[2];
            }
          } else if (fieldData[0].type === 'currencyAmount') {
            if (col.split('_').length === 2) {
              currency = col.split('_')[1];
            }
          }
        }
        let value: any;
        if (fieldData[0].type === 'singleLine' || fieldData[0].type === 'multiLine') {
          value = row[col];
        } else {
          value = parseFloat(row[col]);
        }
        const result = handleAutoCalculation(fieldData[0], fields, productRow, col, currency?.toUpperCase(), unit, value);
        let data: any = {};
        data.values = result;
        data.id = row._id;
        data._id = productBuilderId;
        axiosInstance()
          .put(`/productbuilder/updateproduct-inline`, data)
          .then(() => {
            fetchProduct();
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      }
    }
  };

  const handelAskPriceToSupplier = (content, contactId, selectedFields = [], displayColumns = []) => {
    let data: any = {
      products: selectedRecords?.map((d) => {
        return {
          productId: d?.productId,
          uniqueId: d?._id
        };
      }),
      quote: quoteData?._id,
      productBuilder: productBuilderId,
      protected: true,
      body: content ? content : '',
      supplierContact: contactId,
      requiredFields: selectedFields,
      displayColumns: displayColumns
    };
    axiosInstance()
      .post(`/quote-builder/ask-price-supplier`, data)
      .then(() => {
        fetchProduct();
        toastConfig.setToastConfig({
          message: `Email has been sent to suppliers`,
          type: 'success',
          open: true
        });
        setAskSupplierPriceDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const isDisabledInlineEdit = () => {
    if (selectedRecords?.length === 0) {
      return true;
    }
    const { productCategoryId: _productCategoryId, productTemplateId: _productTemplateId, priceTemplateId: _priceTemplateId } = selectedRecords[0];

    return !selectedRecords?.every(
      ({ productCategoryId, productTemplateId, priceTemplateId }) =>
        productCategoryId === _productCategoryId && productTemplateId === _productTemplateId && priceTemplateId === _priceTemplateId
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        {stage === 'cost' && permissions?.isUpdate && fromQuote && (
          <MenuItem
            onClick={() => {
              setInlineBulkEdit(true);
            }}
            disabled={isDisabledInlineEdit()}
          >
            {'Inline Edit'}
          </MenuItem>
        )}
        {stage === 'cost' && permissions?.isUpdate && (
          <MenuItem onClick={handelOpenBulkEdit} disabled={checkUniqTemplate()}>
            {'Bulk Edit'}
          </MenuItem>
        )}
        <MenuItem disabled={selectedRecords.length ? false : true} onClick={() => setShowDeleteConfirmBox(true)}>
          Delete
        </MenuItem>
        <MenuItem disabled={selectedRecords.length ? false : true} onClick={handleOpenAddField}>
          Add Field
        </MenuItem>
        {isPriceBuilder && fromQuote && permissions?.isUpdate && user?.role?.selectedEntity?.policy?.isQuoteAskSupplierPrice && (
          <MenuItem
            onClick={() => {
              setShowViewSupplierPrice(true);
            }}
          >
            View Supplier Quote
          </MenuItem>
        )}
      </>
    );
  };

  const updatedRightSideContents = () => {
    if (Editable)
      return (
        <>
          {typeof rightSideContents === 'function' ? rightSideContents() : null}
          {permissions?.isUpdate && (
            <ImportExportLinks
              module="builder"
              permission={permissions}
              api={'productbuilder'}
              refrenceId={productBuilderId}
              onSuccessfulImport={(isImportedSuccessfully) => {
                if (isImportedSuccessfully) {
                  fetchProduct();
                }
              }}
              isExportAllOrSomeFeature={true}
              total={rowCount}
              recordsToExport={selectedRecords.length}
              ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
              inverted={true}
              onExportToExcelSuccess={() => {
                fetchProduct();
              }}
              small={true}
              isCustomImport={true}
              onSuccessCustomImport={() => {
                fetchProduct();
              }}
              currency={currency}
            />
          )}

          {isPriceBuilder && fromQuote && permissions?.isUpdate && user?.role?.selectedEntity?.policy?.isQuoteAskSupplierPrice && (
            <ThemeButton
              buttonType="theme"
              onClick={() => {
                let tempSupplierAccountId = [];
                selectedRecords?.forEach((element) => {
                  if (tempSupplierAccountId.findIndex((d) => d === element?.supplierAccountId) === -1) {
                    tempSupplierAccountId.push(element?.supplierAccountId);
                  }
                  element?.restsupplierAccount?.forEach((d) => {
                    if (tempSupplierAccountId.findIndex((e) => e === d.optionValue) === -1) {
                      tempSupplierAccountId.push(d.optionValue);
                    }
                  });
                });
                axiosInstance()
                  .get(
                    `${supplierContact.contactApi}?filterById=${JSON.stringify([
                      { field: 'accountName', term: { $in: tempSupplierAccountId } }
                    ])}&filterType=and`
                  )
                  .then(({ data: { data, count } }) => {
                    setSupplierContactData(data);
                    setAskSupplierPriceDialog(true);
                  })
                  .catch((error) => {
                    toastConfig.setToastConfig(error);
                  });
              }}
              disabled={checkUniqTemplate()}
              aria-controls="action-menu"
            >
              Ask Supplier to Quote
            </ThemeButton>
          )}
        </>
      );
    return typeof rightSideContents === 'function' ? rightSideContents() : null;
  };

  return (
    <Box pt={0}>
      <DetailsPageHeader
        isAddButtonVisible={isAddButtonVisible}
        addButtonMenuItems={typeof addButtonMenuItems === 'function' ? addButtonMenuItems() : null}
        isActionButtonVisible={Editable && permissions?.isUpdate}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{
          disabled:
            isPriceBuilder && fromQuote && permissions?.isUpdate && user?.role?.selectedEntity?.policy?.isQuoteAskSupplierPrice
              ? false
              : selectedRecords.length
                ? false
                : true
        }}
        previewDownloadProps={previewDownloadProps}
        leftSideContents={typeof leftSideContents === 'function' ? leftSideContents() : null}
        rightSideContents={typeof updatedRightSideContents === 'function' ? updatedRightSideContents() : null}
        hasXpadding
      />

      <Box mt={1}>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchProduct}
            onSaveEdit={onCellValueChanged}
            isClientSideGrid={true}
            hideAction={!Editable}
            hideSelection={!Editable}
            setWholeRowsCellColor={(row) => {
              return (row[`totalSalesPrice_${currency?.toLowerCase()}`] || 0) === 0 || (row[`qty`] || 0) === 0 ? 'error' : '';
            }}
            resource={sidebarResource.product}
            hideExportTable={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {isAddNewProduct && (
        <CreateProduct
          isClone={false}
          productId={null}
          handleClose={() => setIsAddNewProduct(false)}
          isAddInBuilder={true}
          addProductInBuilder={addProductInBuilder}
          openFrom="builder"
          fromQuote={fromQuote}
        />
      )}
      {isAddExistingProduct && <AddExistingProduct addProductInBuilder={addProductInBuilder} handleClose={() => setIsAddExistingProduct(false)} />}
      {productId && (
        <ProductDialog
          isClone={isClone}
          productBuilderId={productBuilderId}
          productId={productId}
          handleSaveProduct={handleSaveProduct}
          handleClose={() => {
            setProductId(null);
          }}
          stage={stage}
        />
      )}
      {isAddField && (
        <AddField
          refrence="builder"
          section={addFieldData.section}
          fieldData={null}
          handleClose={handleCloseAddField}
          handleAddField={handleAddField}
          fields={addFieldData.fields}
        />
      )}
      {isBulkEdit && (
        <BulkEditDialog
          productDataList={productDataList}
          handleSaveProduct={handleSaveProduct}
          handleClose={() => setIsBulkEdit(null)}
          loading={loading}
          productBuilderId={productBuilderId}
          stage={stage}
        />
      )}
      {inlineBulkEdit && fromQuote && (
        <CustomEditableGrid
          state={editableState}
          dispatch={editableDispatch}
          onClose={() => {
            setInlineBulkEdit(false);
          }}
          renderedFrom={renderedFrom}
          data={selectedRecords}
          extraDisabledFields={['productCategory', 'productTemplate', 'entity', 'priceTemplate']}
          handleSave={(products) => {
            handleSaveProductInlineBulk(products);
          }}
          isSubmitting={isSubmitting}
          referenceId={productBuilderId}
          restData={dataRows
            ?.filter((d) => !selectedRecords?.map((r) => r?._id)?.includes(d?._id))
            ?.map((_d) => {
              const { productCategoryId, productTemplateId, priceTemplateId, ...rest } = _d;
              return {
                ...rest,
                productCategory: productCategoryId,
                productTemplate: productTemplateId,
                priceTemplate: priceTemplateId
              };
            })}
        />
      )}
      {openSupplierPriceDialog && (
        <SupplierAskPrice
          supplierData={supplierData}
          handleClose={() => setOpenSupplierPriceDialog(false)}
          productBuilderId={productBuilderId}
          onSuccess={() => {
            setOpenSupplierPriceDialog(false);
            fetchProduct();
          }}
        />
      )}
      {showViewSupplierPrice && (
        <ViewSupplierPriceDialog
          quoteData={quoteData}
          handleClose={() => setShowViewSupplierPrice(false)}
          productBuilderId={productBuilderId}
          onSuccess={() => {
            setShowViewSupplierPrice(false);
            fetchProduct();
          }}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the product?`}
          onClose={() => setShowDeleteConfirmBox(false)}
          onOk={handleDelete}
        />
      )}

      {showCloseConfirmBox && (
        <ConfirmationDialog
          open={showCloseConfirmBox}
          message={`Are you sure you want to leave this dialouge?`}
          onClose={() => {
            setShowCloseConfirmBox(false);
          }}
          onOk={() => {
            setProductId(null);
          }}
        />
      )}
      {showConfirmDialog ? (
        <ConfirmCancelDialog
          open={showConfirmDialog}
          onSave={() => {
            setShowConfirmDialog(false);
          }}
          onClose={() => {
            setShowConfirmDialog(false);

            setProductId(null);
          }}
        />
      ) : null}
      {askSupplierPriceDialog && (
        <AskSupplierPriceDialog
          setAskSupplierPriceDialog={setAskSupplierPriceDialog}
          askSupplierPriceDialog={askSupplierPriceDialog}
          handelAskPriceToSupplier={handelAskPriceToSupplier}
          supplierContactData={supplierContactData}
          productBuilderId={productBuilderId}
          productDataList={productData?.product?.filter((data) => selectedRecords.some((rec) => rec._id === data._id))}
        />
      )}
    </Box>
  );
};

export default ProductBuilder;
