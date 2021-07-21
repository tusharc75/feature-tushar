import { useState, useEffect, useContext, useReducer } from "react";
import Box from "@material-ui/core/Box";
import CreateProduct from "../Product/CreateProduct";
import AddExistingProduct from "./AddExistingProduct";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import ProductDialog from "./ProductDialog";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { Link } from "react-router-dom";
import { ExpandMore } from "@material-ui/icons";
import { Menu, MenuItem } from "@material-ui/core";
import { AddField } from "../FormBuilder/AddField";
import ConfirmationDialog from "../Helpers/ConfirmationDialog";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import ImportExportLinks from "../Product/ImportExportLinks";
import { orderBy, sortBy, uniq, map } from "lodash";
import CustomAgGridEditable, {
  reducer,
  intialState,
} from "../../components/AgGridComponents/CustomAgGridEditable";
import { CommonRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import BulkEditDialog from "./BulkEditDialog";
import _ from "lodash";
import Loader from "../Loader";
import { handleAutoCalculation } from "../../constants/formulaUtility";
import { gridLoadingTimeout } from "../../constants/helpers";
import NoDataCell from "../../components/Helpers/NoDataCell";

let levalOrderBy = [
  "product",
  "product-custom",
  "product-template",
  "price-template",
  "product-builder-custom",
  "price-builder-custom",
];

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
  } = props;

  const toastConfig = useContext(CustomToastContext);

  const [product, setProduct] = useState([]);
  const [columns, setColumns] = useState(null);
  const [productData, setProductData] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isAddField, setIsAddField] = useState(false);
  const [addFieldData, setaddFieldData] = useState({ section: [], fields: [] });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isClone, setIsClone] = useState(false);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [productDataList, setproductDataList] = useState([]);

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const {
    dataRows,
    rowCount,
    loading,
    page,
    limit,
    pageSizes,
    search,
    filters,
    sorting,
    selectedRecords,
  } = state;

  useEffect(() => {
    fetchProduct(productBuilderId);
  }, [productBuilderId]);

  const ActionsRenderer = (params) => {
    const permission =
      permissions?.isUpdate && fromQuote
        ? hasPermission
          ? true
          : false
        : true;

    return (
      <>
        <IconButton
          disabled={permission ? false : true}
          size="small"
          aria-label="Clone"
          onClick={() => {
            setProductData(params.data);
            setIsClone(true);
          }}
        >
          <FileCopyIcon
            fontSize="small"
            color={permission ? "primary" : "disabled"}
          />
        </IconButton>

        <IconButton
          disabled={permission ? false : true}
          aria-label="Edit"
          onClick={() => {
            setProductData(params.data);
          }}
        >
          <EditIcon
            fontSize="small"
            color={permission ? "primary" : "disabled"}
          />
        </IconButton>

        <IconButton
          disabled={permission ? false : true}
          aria-label="Delete"
          onClick={() => {
            setDeleteRecord(params.data);
            setShowDeleteConfirmBox(true);
          }}
        >
          <DeleteIcon
            fontSize="small"
            color={permission ? "error" : "disabled"}
          />
        </IconButton>
      </>
    );
  };

  const ProductNameRenderer = (params) => (
    <>
      {Editable ? (
        <Link
          className="link"
          onClick={() => {
            setProductData(params.data);
          }}
        >
          {params.data.srno}
        </Link>
      ) : (
        <>{params.data.srno}</>
      )}
    </>
  );

  const ProductCategoryRenderer = params => <>
    {
      params.data.productCategory || params.data.productCategory === 0 ?
        typeof params.data.productCategory === 'object' ? params.data.productCategory["optionLabel"] : params.data.productCategory
        : <NoDataCell />
    }
  </>
  const ProductTemplateRenderer = params => <>
    {
      params.data.productTemplate || params.data.productTemplate === 0 ?
        typeof params.data.productTemplate === 'object' ? params.data.productTemplate["optionLabel"] : params.data.productTemplate
        : <NoDataCell />
    }
  </>

  const PriceTemplateRenderer = params => <>
    {
      params.data.priceTemplate || params.data.priceTemplate === 0 ?
        typeof params.data.priceTemplate === 'object' ? params.data.priceTemplate["optionLabel"] : params.data.priceTemplate
        : <NoDataCell />
    }
  </>

  const frameworkComponents = {
    actionsRenderer: ActionsRenderer,
    commonRenderer: CommonRenderer,
    productNameRenderer: ProductNameRenderer,
    productCategoryRenderer: ProductCategoryRenderer,
    productTemplateRenderer: ProductTemplateRenderer,
    priceTemplateRenderer: PriceTemplateRenderer,
  };

  const fetchProduct = (id) => {
    dispatch({ type: "loading", loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance().get(`/productbuilder/getproduct/${id}`).then(({ data: { data } }) => {
      data = data.data?.map((u, index) => ({
        ...u,
        id: u._id,
        srno: index + 1,
      }));
      setColumns(null);
      let column = [
        {
          field: "srno",
          headerName: "Item #",
          width: 70,
          show: true,
          cellRenderer: "productNameRenderer",
        },
      ];
      data.forEach((row) => {
        let _fields = row.fields;
        if (stage && stage === "product") { _fields = row.fields.filter((t) => t.leval === "product" || t.leval === "product-custom" || t.leval === "product-template"); }
        _fields.forEach((ele) => {
          if (ele.type === "converter" || ele.type === "currencyAmount" || ele.isConverter === true) {
            if (ele.type !== "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
              ele.displayUnits && Array.isArray(ele.displayUnits) && ele.displayUnits.forEach((_unit) => {
                let fieldName = ele.fieldName + "_" + _unit.toLowerCase();
                let fieldLabel = ele.fieldLabel + " " + _unit;
                if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                  let col: any = {};
                  col.field = fieldName;
                  col.headerName = fieldLabel;
                  col.width = 180;
                  if (!ele.isFormula && !ele.isUneditable && Editable) {
                    col.cellRenderer = "commonRenderer";
                    col.cellEditor = "numericCellEditor";
                    col.editable = true;
                  } else {
                    col.cellRenderer = "commonRenderer";
                  }
                  column.push(col);
                }
              });
            } else if (ele.type === "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
              ele.displayUnits && Array.isArray(ele.displayUnits) && ele.displayUnits.forEach((_unit) => {
                ele.displayCurrency && Array.isArray(ele.displayCurrency) && ele.displayCurrency.forEach((_currency) => {
                  let fieldName = ele.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase();
                  let fieldLabel = ele.fieldLabel + " " + _unit + "/" + _currency;
                  if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                    let col: any = {};
                    col.field = fieldName;
                    col.headerName = fieldLabel;
                    col.width = 180;
                    if (!ele.isFormula && !ele.isUneditable && Editable) {
                      col.cellRenderer = "commonRenderer";
                      col.cellEditor = "numericCellEditor";
                      col.editable = true;
                    } else {
                      col.cellRenderer = "commonRenderer";
                    }
                    column.push(col);
                  }
                });
              });
            } else if (ele.type === "currencyAmount") {
              ele.displayCurrency && Array.isArray(ele.displayCurrency) && ele.displayCurrency.forEach((_currency) => {
                let fieldName = ele.fieldName + "_" + _currency.toLowerCase();
                let fieldLabel = ele.fieldLabel + " " + _currency;
                if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                  let col: any = {};
                  col.field = fieldName;
                  col.headerName = fieldLabel;
                  col.width = 180;
                  if (!ele.isFormula && !ele.isUneditable && Editable) {
                    col.cellRenderer = "commonRenderer";
                    col.cellEditor = "numericCellEditor";
                    col.editable = true;
                  } else {
                    col.cellRenderer = "commonRenderer";
                  }
                  column.push(col);
                }
              });
            }
          } else {
            if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
              let col: any = {};
              col.field = ele.fieldName;
              col.headerName = ele.fieldLabel;
              col.width = 180;
              col.cellRenderer = "commonRenderer";
              if (ele.type === "decimal" || ele.type === "percent" || ele.type === "singleLine" || ele.type === "multiLine") {
                if (!ele.isFormula && !ele.isUneditable && Editable) {
                  col.cellRenderer = "commonRenderer";
                  if (ele.type === "decimal" || ele.type === "percent") {
                    col.cellEditor = "numericCellEditor";
                  }
                  col.editable = true;
                } else {
                  col.cellRenderer = "commonRenderer";
                }
              }
              if (ele.fieldName === "productCategory") {
                col.cellRenderer = "productCategoryRenderer"
              }
              if (ele.fieldName === "productTemplate") {
                col.cellRenderer = "productTemplateRenderer"
              }
              if (ele.fieldName === "priceTemplate") {
                col.cellRenderer = "priceTemplateRenderer"
              }
              column.push(col);
            }
          }
        });
      });
      column = orderBy(column, "order", "asc");
      column = sortBy(column, (item: any) => {
        return levalOrderBy.indexOf(item.leval);
      });
      setColumns(column);
      setProduct(data);
      dispatch({ type: "initialize", data: [], count: 0 });
      dispatch({ type: "initialize", data: data, count: data.length });
      setTimeout(() => {
        dispatch({ type: "loading", loading: false });
      }, gridLoadingTimeout);
      refreshProducts(data);
    })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const addProductInBuilder = (rows) => {
    let data: any = {};
    data.product = rows;
    data._id = productBuilderId;
    axiosInstance()
      .post(`/productbuilder/addproduct`, data)
      .then(({ data: { data } }) => {
        fetchProduct(productBuilderId);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveProduct = (rows) => {
    if (isClone) {
      addProductInBuilder(rows);
      setProductData(null);
      setIsClone(false);
    } else {
      let data: any = {};
      data.product = rows;
      data._id = productBuilderId;
      axiosInstance()
        .put(`/productbuilder/updateProduct`, data)
        .then(({ data: { data } }) => {
          setProductData(null);
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
      .then(({ data: { data } }) => {
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
    const rows: any = product.filter((data) =>
      selectedRecords.some((rec) => rec._id === data._id)
    );
    let section: any = [];
    let fields: any = [];
    section = uniq(map(rows[0].fields, "sectionName"));
    rows[0].fields.forEach((_field) => {
      let fid = { ..._field };
      if (
        fid.type !== "currencyAmount" &&
        (fid.type === "converter" || fid.isConverter === true)
      ) {
        fid.displayUnits &&
          fid.displayUnits.forEach((_unit) => {
            fields.push({
              ...fid,
              fieldLabel: fid.fieldLabel + " " + _unit,
              fieldName: fid.fieldName + "_" + _unit.toLowerCase(),
            });
          });
      } else if (fid.type === "currencyAmount") {
        fid.displayCurrency &&
          fid.displayCurrency.forEach((_currency) => {
            if (fid.isConverter) {
              fid.displayUnits &&
                fid.displayUnits.forEach((_unit) => {
                  fields.push({
                    ...fid,
                    fieldLabel: fid.fieldLabel + " " + _unit,
                    fieldName:
                      fid.fieldName +
                      "_" +
                      _currency.toLowerCase() +
                      "_" +
                      _unit.toLowerCase(),
                  });
                });
            } else {
              fields.push({
                ...fid,
                fieldLabel: fid.fieldLabel + " " + _currency,
                fieldName: fid.fieldName + "_" + _currency.toLowerCase(),
              });
            }
          });
      } else {
        fields.push(fid);
      }
    });
    setaddFieldData({ section: section, fields: fields });
    setIsAddField(true);
    setAnchorEl(null);
  };

  const handleCloseAddField = () => {
    setIsAddField(false);
  };

  const handleAddField = (field) => {
    let data: any = {};
    data.productBuilderId = productBuilderId;
    data._ids = selectedRecords.map((d) => d.id);
    data.field = field;
    data.field.leval = "price-builder-custom";
    if (
      addFieldData.fields.filter(
        (_f) => _f.sectionName === data.field.sectionName
      ).length
    ) {
      if (
        addFieldData.fields.filter(
          (_f) => _f.sectionName === data.field.sectionName
        )[0].leval !== "price-template"
      ) {
        data.field.leval = "product-builder-custom";
      }
    }
    axiosInstance()
      .post(`/productbuilder/addField`, data)
      .then(({ data: { data } }) => {
        fetchProduct(productBuilderId);
        setIsAddField(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handelOpenBulkEdit = () => {
    const rows: any = product.filter((data) =>
      selectedRecords.some((rec) => rec._id === data._id)
    );
    setproductDataList(rows);
    setIsBulkEdit(true);
  };

  const checkUniqTemplate = () => {
    if (selectedRecords.length === 0) {
      return true;
    } else if (
      _.uniq(_.map(selectedRecords, "priceTemplate.optionValue")).length ===
      1 &&
      stage === "cost"
    ) {
      return false;
    } else {
      return true;
    }
  };

  const onCellValueChanged = (row) => {
    const changeRow: any = product.filter((_p) => _p._id === row.data.id);
    if (changeRow.length) {
      const productRow: any = changeRow[0];
      let fieldName = row.column.colId;
      if (row.column.colId.split("_").length) {
        fieldName = row.column.colId.split("_")[0];
      }
      const fieldData = productRow.fields.filter(
        (_f) => _f.fieldName === fieldName
      );
      if (fieldData.length) {
        let currency = "";
        let unit = "";
        if (row.column.colId.split("_").length) {
          if (
            fieldData[0].type !== "currencyAmount" &&
            (fieldData[0].type === "converter" ||
              fieldData[0].isConverter === true)
          ) {
            if (row.column.colId.split("_").length === 2) {
              unit = row.column.colId.split("_")[1];
            }
          } else if (
            fieldData[0].type === "currencyAmount" &&
            (fieldData[0].type === "converter" ||
              fieldData[0].isConverter === true)
          ) {
            if (row.column.colId.split("_").length === 3) {
              currency = row.column.colId.split("_")[1];
              unit = row.column.colId.split("_")[2];
            }
          } else if (fieldData[0].type === "currencyAmount") {
            if (row.column.colId.split("_").length === 2) {
              currency = row.column.colId.split("_")[1];
            }
          }
        }

        let value: any;
        if (
          fieldData[0].type === "singleLine" ||
          fieldData[0].type === "multiLine"
        ) {
          value = row.newValue;
        } else {
          value = parseFloat(row.newValue);
        }

        const result = handleAutoCalculation(
          fieldData[0],
          productRow.fields,
          productRow,
          row.column.colId,
          currency,
          unit,
          value
        );
        let data: any = {};
        data.values = result;
        data.id = row.data.id;
        data._id = productBuilderId;
        axiosInstance()
          .put(`/productbuilder/updateproduct-inline`, data)
          .then(({ data: { data } }) => {
            fetchProduct(productBuilderId);
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      }
    }
  };

  return (
    <Box p={1} pt={0}>
      <Grid container>
        <Grid item xs={2} className="d-flex align-items-center gap-1"></Grid>
        {Editable && (
          <Grid xs={10} container justify="flex-end">
            {permissions.isUpdate && (
              <ImportExportLinks
                permissions={permissions}
                module="builder"
                api={"productbuilder"}
                refrenceId={productBuilderId}
                onSuccessfulImport={(isImportedSuccessfully) => {
                  if (isImportedSuccessfully) {
                    fetchProduct(productBuilderId);
                  }
                }}
              />
            )}
            {stage === "cost" && permissions.isUpdate && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                className="float-right ml-1 mr-2"
                onClick={handelOpenBulkEdit}
                disabled={checkUniqTemplate()}
                aria-controls="action-menu"
              >
                Bulk Edit
              </Button>
            )}
            {permissions.isUpdate && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                className="float-right"
                onClick={openActions}
                disabled={selectedRecords.length ? false : true}
                aria-controls="action-menu"
              >
                Actions <ExpandMore />
              </Button>
            )}
            <Menu
              anchorEl={anchorEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              id="action-menu"
              open={Boolean(anchorEl)}
              onClose={closeActions}
            >
              <MenuItem onClick={() => setShowDeleteConfirmBox(true)}>
                Delete
              </MenuItem>
              <MenuItem onClick={handleOpenAddField}>Add Field</MenuItem>
            </Menu>
          </Grid>
        )}
      </Grid>
      <Box mt={1}>
        {columns ? (
          <CustomAgGridEditable
            currency={currency}
            forProductBuilder={isPriceBuilder}
            fromProductGrid={true}
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameworkComponents}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            allowSelection={Editable}
            allowAction={Editable}
            actionWidth={150}
            isClientSideGrid={true}
            onCellValueChanged={onCellValueChanged}
            loading={loading}
            className="product-builder-edit-grid"
          />
        ) : (
          <Loader style={{ minHeight: 300 }} text="Loading..." />
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
        />
      )}
      {isAddExistingProduct && (
        <AddExistingProduct
          addProductInBuilder={addProductInBuilder}
          handleClose={() => setIsAddExistingProduct(false)}
        />
      )}
      {productData && (
        <ProductDialog
          isClone={isClone}
          productData={productData}
          handleSaveProduct={handleSaveProduct}
          handleClose={() => {
            setProductData(null);
            fetchProduct(productBuilderId);
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
          stage={stage}
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
    </Box>
  );
};

export default ProductBuilder;
