import { useState, useEffect, useContext, useReducer } from 'react';
import Box from '@material-ui/core/Box';
import CreateProduct from '../Product/CreateProduct';
import AddExistingProduct from './AddExistingProduct';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import VisibilityIcon from '@material-ui/icons/Visibility';
import ProductDialog from './ProductDialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { ExpandMore } from '@material-ui/icons';
import { Menu, MenuItem, Dialog, TextField } from '@material-ui/core';
import { AddField } from '../FormBuilder/AddField';
import ConfirmationDialog from '../Helpers/ConfirmationDialog';
import Button from '@material-ui/core/Button';
import ImportExportLinks from '../Product/ImportExportLinks';
import { sortBy, uniq, map, camelCase } from 'lodash';
import BulkEditDialog from './BulkEditDialog';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { handleAutoCalculation, extractFields } from '../../constants/formulaUtility';
import { QUOTE_PROCESS_STATUS, gridLoadingTimeout, sidebarResource, supplierContact } from '../../constants/helpers';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { AiTwotoneEdit } from 'react-icons/ai';
import { prepareDataForGrid } from '../../constants/helpers';
import SupplierAskPrice from './SupplierAskPrice';
import AskSupplierPriceDialog from './AskSupplierPriceDialog';
import { useData } from './../../StateProvider/Provider';
import ViewSupplierPriceDialog from './ViewSupplierPriceDialog';
import HtmlTooltip from '../CustomTooltipTitle';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import CustomReactTable, { useColumns, useTableReducer } from '../CustomReactTableNew';

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
    setNextStep
  } = props;

  const renderedFrom = `${camelCase(`${routes?.quote.title}_Product`)}`;

  const toastConfig = useContext(CustomToastContext);

  const [productData, setProductData] = useState(null);
  const [productId, setProductId] = useState(null);
  const [productDataList, setproductDataList] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
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
  const { generateColumns } = useColumns();

  const {
    state: { user }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchProduct(productBuilderId);
  }, [productBuilderId, processStatus]);

  const fetchProduct = (id) => {
    if (setNextStep) {
      setNextStep(false);
    }
    dispatch({ type: 'loading', loading: true });
    setColumns(null);
    axiosInstance()
      .get(`/productbuilder/getproduct/${id}`)
      .then(({ data: { data } }) => {
        let columns = [];
        columns = [
          {
            accessor: 'index',
            Header: 'Index',
            width: 150,
            show: true,
            disabled: true,
            cellRenderer: 'productNameRenderer',
            Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
          }
        ];
        let priceTemplateField = [];
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

        let newColumns = generateColumns(routes.product.title, fields, routes.product.path, false, currency);
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
          if (rows?.find((ele) => (ele[`totalSalesPrice_${currency?.toLowerCase()}`] || 0) === 0 || (ele[`qty`] || 0) === 0)) {
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
        fetchProduct(productBuilderId);
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
          fetchProduct(productBuilderId);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
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
        setAnchorEl(null);
        fetchProduct(productBuilderId);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
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
      setAnchorEl(null);
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
        fetchProduct(productBuilderId);
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
            fetchProduct(productBuilderId);
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
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchProduct(productBuilderId);
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

  return (
    <Box pt={0}>
      {Editable && (
        <div className="d-flex align-items gap-2 justify-end ml-auto">
          {permissions?.isUpdate && (
            <ImportExportLinks
              permissions={permissions}
              module="builder"
              api={'productbuilder'}
              refrenceId={productBuilderId}
              onSuccessfulImport={(isImportedSuccessfully) => {
                if (isImportedSuccessfully) {
                  fetchProduct(productBuilderId);
                }
              }}
              isExportAllOrSomeFeature={true}
              total={rowCount}
              recordsToExport={selectedRecords.length}
              ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
              inverted={true}
              onExportToExcelSuccess={() => {
                fetchProduct(productBuilderId);
              }}
            />
          )}
          {isPriceBuilder && fromQuote && permissions?.isUpdate && user?.role?.selectedEntity?.policy?.isQuoteAskSupplierPrice && (
            <Button
              variant="contained"
              color="primary"
              size="small"
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
            </Button>
          )}
          {stage === 'cost' && permissions?.isUpdate && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AiTwotoneEdit />}
              onClick={handelOpenBulkEdit}
              disabled={checkUniqTemplate()}
              aria-controls="action-menu"
            >
              {isMobile && !isTablet ? '' : 'Bulk Edit'}
            </Button>
          )}
          {permissions?.isUpdate && (
            <Button
              size="small"
              color="primary"
              className="float-right new-dropdown-v1"
              disabled={
                isPriceBuilder && fromQuote && permissions?.isUpdate && user?.role?.selectedEntity?.policy?.isQuoteAskSupplierPrice
                  ? false
                  : selectedRecords.length
                  ? false
                  : true
              }
              onClick={openActions}
              endIcon={<ExpandMore />}
              aria-controls="action-menu"
            >
              Actions
            </Button>
          )}
          <Menu
            anchorEl={anchorEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            id="action-menu"
            open={Boolean(anchorEl)}
            onClose={closeActions}
          >
            <MenuItem disabled={selectedRecords.length ? false : true} onClick={() => setShowDeleteConfirmBox(true)}>
              Delete
            </MenuItem>
            <MenuItem disabled={selectedRecords.length ? false : true} onClick={handleOpenAddField}>
              Add Field
            </MenuItem>
            {isPriceBuilder && fromQuote && permissions?.isUpdate && user?.role?.selectedEntity?.policy?.isQuoteAskSupplierPrice && (
              <MenuItem
                onClick={() => {
                  closeActions();
                  setShowViewSupplierPrice(true);
                }}
              >
                View Supplier Quote
              </MenuItem>
            )}
          </Menu>
        </div>
      )}
      <Box mt={1}>
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
            isClientSideGrid={true}
            hideAction={!Editable}
            hideSelection={!Editable}
            setWholeRowsCellColor={(row) => {
              return (row[`totalSalesPrice_${currency?.toLowerCase()}`] || 0) === 0 || (row[`qty`] || 0) === 0 ? 'error' : '';
            }}
            resource={sidebarResource.product}
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
      {openSupplierPriceDialog && (
        <SupplierAskPrice
          supplierData={supplierData}
          handleClose={() => setOpenSupplierPriceDialog(false)}
          productBuilderId={productBuilderId}
          onSuccess={() => {
            setOpenSupplierPriceDialog(false);
            fetchProduct(productBuilderId);
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
            fetchProduct(productBuilderId);
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
          close={() => setShowConfirmDialog(false)}
          onSave={() => {
            setShowConfirmDialog(false);
            // e.preventDefault();
            // const err = Object.keys(errors);
            // if (err.length) {
            // const input = document.querySelector(
            //   `input[name=${err[0]}]`,
            // );

            // input.scrollIntoView({
            //   behavior: 'smooth',
            //   block: 'center',
            //   inline: 'start',
            // });
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
