import { useState, useEffect, useContext, useReducer } from "react";
import Box from "@material-ui/core/Box";
import CreateProduct from "../Product/CreateProduct";
import AddExistingProduct from "./AddExistingProduct";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import VisibilityIcon from '@material-ui/icons/Visibility';
import ProductDialog from "./ProductDialog";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { ExpandMore } from "@material-ui/icons";
import { Menu, MenuItem, Dialog, TextField } from "@material-ui/core";
import { AddField } from "../FormBuilder/AddField";
import ConfirmationDialog from "../Helpers/ConfirmationDialog";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import ImportExportLinks from "../Product/ImportExportLinks";
import { orderBy, sortBy, uniq, map } from "lodash";
import CustomAgGridEditable, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGridEditable";
import { CommonRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import BulkEditDialog from "./BulkEditDialog";
import Loader from "../Loader";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import { handleAutoCalculation, extractFields } from "../../constants/formulaUtility";
import { CustomDialogTransition, gridLoadingTimeout, supplierContact } from "../../constants/helpers";
import routes from "../../components/Helpers/Routes";
import { isMobile, isTablet } from "react-device-detect";
import { AiTwotoneEdit } from 'react-icons/ai';
import CustomSwipableList from "../SwipableListComponents/CustomSwipableList";
import CustomDialogContent from "../CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../CustomDialog/CustomDialogFooter";
import CustomDialogHeader from "../CustomDialog/CustomDialogHeader";
import CustomButton from "../Helpers/CustomButton";
import { prepareDataForGrid } from "../../constants/helpers";
import SupplierAskPrice from "./SupplierAskPrice";
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import { Link, useHistory } from 'react-router-dom';
import MuiPickersUtilsProvider from "@material-ui/pickers/MuiPickersUtilsProvider";
import AskSupplierPriceDialog from "./AskSupplierPriceDialog";
import { useData } from './../../StateProvider/Provider';

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
    setColumnForPDFExcel,
    fullScreen = false,
    quoteData = null
  } = props;

  const toastConfig = useContext(CustomToastContext);

  const [productData, setProductData] = useState(null);
  const [productId, setProductId] = useState(null);
  const [productDataList, setproductDataList] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null);
  const [isAddField, setIsAddField] = useState(false);
  const [showCloseConfirmBox, setShowCloseConfirmBox] = useState(false);
  const [addFieldData, setaddFieldData] = useState({ section: [], fields: [] });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isClone, setIsClone] = useState(false);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [openSupplierPriceDialog, setOpenSupplierPriceDialog] = useState(false);
  const [askSupplierPriceDialog, setAskSupplierPriceDialog] = useState(false);
  const [supplierContactData, setSupplierContactData] = useState([]);
  const [supplierData, setSupplierData] = useState(null)
  const { getColumnData } = useColumns();
  // const [showProductNumberOrProductNameUpdate, setShowProductNumberOrProductNameUpdate] =
  //   useState({ open: false, title: "", property: "", value: "", indexOfRecord: -1, record: null })

  const [dataToShowForMobile, setDataToShowForMobile] = useState([]);
  const [priceTemplateField, setPriceTemplateField] = useState(null)
  const {
    state: { user }
  }: any = useData();
  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [frameWorkComponent, setFrameWorkComponent] = useState(null)
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchProduct(productBuilderId);
  }, [productBuilderId]);

  const fetchProduct = (id) => {
    dispatch({ type: "loading", loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance().get(`/productbuilder/getproduct/${id}`).then(({ data: { data } }) => {
      let columns = []
      columns = [
        {
          field: "srno",
          headerName: "Item #",
          width: 150,
          show: true,
          disabled: true,
          cellRenderer: "productNameRenderer",
          primaryField: true
        },
      ];
      let rendererNames = [];
      let priceTemplateField = [];
      let fields = data.productFields
      data.productTemplate?.forEach((ele) => {
        fields = [...fields, ...ele.fields]
      })
      data.priceTemplate?.forEach((ele) => {
        fields = [...fields, ...ele.fields]
        ele.fields.map((item) => {
          if (item.type === 'converter') {
            item?.displayUnits.map((unit) => {
              priceTemplateField.push(`${item.fieldName}_${unit.toLowerCase()}`)
            })

          }
          if (item?.type === 'decimal') {
            priceTemplateField.push(`${item.fieldName}`)
          }
        })

      })
      setPriceTemplateField(priceTemplateField)
      GenrateColoum(fields, columns, rendererNames);
      columns = sortBy(columns, function (item: any) {
        return levalOrderBy.indexOf(item.leval)
      });
      let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
      tempFrameworkComponent = {
        commonRenderer: CommonRenderer,
        productNameRenderer: ProductNameRenderer,
        actionsRenderer: ActionsRenderer,
        productTypeRenderer: ProductTypeRenderer,
        ...tempFrameworkComponent,
      }
      setFrameWorkComponent({ ...tempFrameworkComponent })
      setColumns([...columns])
      if (setColumnForPDFExcel) {
        setColumnForPDFExcel([...columns].filter(d => d.field !== "srno").map(d => d.headerName))
      }
      setProductData(data);
      let rows = data.product.map((item, index) => {
        let res: any = {
          ...prepareDataForGrid(item),
        };
        res.srno = index + 1;
        res.isChecked = false;
        res.canDelete = permissions?.isUpdate && fromQuote ? hasPermission ? true : false : true;
        res.allowedToEdit = permissions?.isUpdate && fromQuote ? hasPermission ? true : false : true;
        res.isSupplierExist = isPriceBuilder && fromQuote && permissions.isUpdate && user?.role?.selectedEntity?.policy?.isQuoteAskSupplierPrice
        return res;
      });
      dispatch({ type: "initialize", data: rows, count: rows.length });
      setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
      refreshProducts(data);
    })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const supplierPriceDialogData = (product) => {
    setOpenSupplierPriceDialog(true)
    setSupplierData(product)

  }

  const ActionsRenderer = (params) => {
    const permission = permissions?.isUpdate && fromQuote ? hasPermission ? true : false : true;
    return (
      <>
        <IconButton
          disabled={permission ? false : true}
          size="small"
          aria-label="Clone"
          onClick={() => {
            openProductModel(params.data._id)
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
          size="small"
          aria-label="Edit"
          onClick={() => {
            openProductModel(params.data._id)
          }}
        >
          <EditIcon
            fontSize="small"
            color={permission ? "primary" : "disabled"}
          />
        </IconButton>
        {params.data?.isSupplierExist && (
          <IconButton
            disabled={params.data?.isSupplierExist ? false : true}
            size="small"
            aria-label="Supplier"
            onClick={() => {
              supplierPriceDialogData(params.data)
            }}
          >
            <VisibilityIcon
              fontSize="small"
              color={params.data?.isSupplierExist ? "primary" : "disabled"}
            />
          </IconButton>
        )}
        <IconButton
          disabled={permission ? false : true}
          size="small"
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
        <a
          className="link"
          onClick={() => {
            openProductModel(params.data._id);
          }}
        >
          {params.data.srno}
        </a>
      ) : (
        <>{params.data.srno}</>
      )}
    </>
  );

  const ProductTypeRenderer = (params) => (
    <Link className="link text-truncate" title={params?.data?.productName} to={`${routes.productDetail.path}/${params.data?.productId}`}>
      {params?.data?.productName}
    </Link>
  );

  const GenrateColoum = (fields, column, rendererNames) => {
    let _fields = fields;
    if (stage && stage === "product") {
      _fields = fields.filter((t) => t.leval === "product" || t.leval === "product-custom" || t.leval === "product-template");
    }
    _fields.forEach((ele) => {
      if (ele.type === "converter" || ele.type === "currencyAmount" || ele.isConverter === true) {
        if (ele.type !== "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
          ele.displayUnits.forEach((_unit) => {
            let fieldName = ele.fieldName + "_" + _unit.toLowerCase()
            let fieldLabel = ele.fieldLabel + " " + _unit
            if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
              let col: any = {}
              col.field = fieldName
              col.headerName = fieldLabel
              col.width = 180
              col.show = true
              col.disabled = false
              col.leval = ele.leval
              if (!ele.isFormula && !ele.isUneditable && Editable) {
                col.cellRenderer = "commonRenderer";
                col.cellEditor = "numericCellEditor";
                col.editable = true;
              } else {
                col.cellRenderer = "commonRenderer";
              }
              column.push(col)
            }
          })
        }
        else if (ele.type === "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
          ele.displayUnits.forEach((_unit) => {
            ele.displayCurrency.forEach((_currency) => {
              let fieldName = ele.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase()
              let fieldLabel = ele.fieldLabel + " " + _unit + "/" + _currency
              if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                let col: any = {}
                col.field = fieldName
                col.headerName = fieldLabel
                col.width = 180
                col.show = true
                col.disabled = false
                col.leval = ele.leval
                if (!ele.isFormula && !ele.isUneditable && Editable) {
                  col.cellRenderer = "commonRenderer";
                  col.cellEditor = "numericCellEditor";
                  col.editable = true;
                } else {
                  col.cellRenderer = "commonRenderer";
                }
                column.push(col)
              }
            })
          })
        }
        else if (ele.type === "currencyAmount") {
          ele.displayCurrency.forEach((_currency) => {
            let fieldName = ele.fieldName + "_" + _currency.toLowerCase()
            let fieldLabel = ele.fieldLabel + " " + _currency
            if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
              let col: any = {}
              col.field = fieldName
              col.headerName = fieldLabel
              col.width = 180
              col.show = true
              col.disabled = false
              col.leval = ele.leval
              if (!ele.isFormula && !ele.isUneditable && Editable) {
                col.cellRenderer = "commonRenderer";
                col.cellEditor = "numericCellEditor";
                col.editable = true;
              } else {
                col.cellRenderer = "commonRenderer";
              }
              column.push(col)
            }
          })
        }
      }
      else {
        if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
          if (ele.fieldName === 'productName') {
            column.push({
              pivotIndex: 0,
              field: ele?.fieldName,
              headerName: ele?.fieldLabel,
              show: true,
              disabled: true,
              cellRenderer: 'productTypeRenderer',
              primaryField: true
            })
            rendererNames.push('productTypeRenderer')
          } else {
            let currentColumn: any = getColumnData(routes.productBuilder.title, ele, routes.productBuilder.path, true)
            if (ele.type === "decimal" || ele.type === "percent" || ele.type === "singleLine" || ele.type === "multiLine") {
              if (!ele.isFormula && !ele.isUneditable && Editable) {
                if (ele.type === "decimal" || ele.type === "percent") {
                  currentColumn.columnData.cellEditor = "numericCellEditor";
                }
                currentColumn.columnData.editable = true;
              }
            }
            column.push({ ...currentColumn.columnData, leval: ele.leval });
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName)
            }
          }
        }
      }
    })
  }

  const openProductModel = (id) => {
    setProductId(id);
  }

  const addProductInBuilder = (rows) => {
    let data: any = {};
    data.product = rows;
    data._id = productBuilderId;
    axiosInstance().post(`/productbuilder/addproduct`, data).then(() => {
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
      axiosInstance().put(`/productbuilder/updateProduct`, data).then(() => {
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
    axiosInstance().post(`/productbuilder/deleteproduct`, data).then(() => {
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
    const rows: any = productData.product.filter((data) =>
      selectedRecords.some((rec) => rec._id === data._id)
    );
    if (rows.length) {
      let section: any = [];
      let fields = productData.productFields
      fields = [...fields, ...rows[0].fields]
      const productTemplate: any = productData?.productTemplate?.filter((e) => e._id === rows[0]?.productTemplate?.optionValue);
      if (productTemplate.length) {
        fields = [...fields, ...productTemplate[0].fields]
      }
      const priceTemplate: any = productData?.priceTemplate?.filter((e) => e._id === rows[0]?.priceTemplate?.optionValue);
      if (priceTemplate.length) {
        fields = [...fields, ...priceTemplate[0].fields]
      }
      section = uniq(map(fields, "sectionName"));
      fields = extractFields(fields)
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
    data.field.leval = "price-builder-custom";
    if (addFieldData.fields.filter((_f) => _f.sectionName === data.field.sectionName).length) {
      if (addFieldData.fields.filter((_f) => _f.sectionName === data.field.sectionName)[0].leval !== "price-template") {
        data.field.leval = "product-builder-custom";
      }
    }
    axiosInstance().post(`/productbuilder/addField`, data).then(() => {
      fetchProduct(productBuilderId);
      setIsAddField(false);
    })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handelOpenBulkEdit = () => {
    const rows: any = productData.product.filter((data) =>
      selectedRecords.some((rec) => rec._id === data._id)
    );
    setproductDataList(rows);
    setIsBulkEdit(true);
  };

  const checkUniqTemplate = () => {
    if (selectedRecords.length === 0) {
      return true;
    } else if (uniq(map(selectedRecords, "priceTemplate")).length === 1 && stage === "cost") {
      return false;
    } else {
      return true;
    }
  };

  const onCellValueChanged = (row) => {
    const changeRow: any = productData.product.filter((_p) => _p._id === row.data.id);
    if (changeRow.length) {
      const productRow: any = changeRow[0];
      let fieldName = row.column.colId;
      if (row.column.colId.split("_").length) {
        fieldName = row.column.colId.split("_")[0];
      }
      let fields = productData.productFields
      fields = [...fields, ...productRow.fields]
      const productTemplate: any = productData?.productTemplate?.filter((e) => e._id === productRow?.productTemplate?.optionValue);
      if (productTemplate.length) {
        fields = [...fields, ...productTemplate[0].fields]
      }
      const priceTemplate: any = productData?.priceTemplate?.filter((e) => e._id === productRow?.priceTemplate?.optionValue);
      if (priceTemplate.length) {
        fields = [...fields, ...priceTemplate[0].fields]
      }
      const fieldData = fields.filter((_f) => _f.fieldName === fieldName);
      if (fieldData.length) {
        let currency = "";
        let unit = "";
        if (row.column.colId.split("_").length) {
          if (fieldData[0].type !== "currencyAmount" && (fieldData[0].type === "converter" || fieldData[0].isConverter === true)) {
            if (row.column.colId.split("_").length === 2) {
              unit = row.column.colId.split("_")[1];
            }
          } else if (fieldData[0].type === "currencyAmount" && (fieldData[0].type === "converter" || fieldData[0].isConverter === true)) {
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
        if (fieldData[0].type === "singleLine" || fieldData[0].type === "multiLine") {
          value = row.newValue;
        } else {
          value = parseFloat(row.newValue);
        }
        const result = handleAutoCalculation(
          fieldData[0],
          fields,
          productRow,
          row.column.colId,
          currency?.toUpperCase(),
          unit,
          value
        );
        let data: any = {};
        data.values = result;
        data.id = row.data.id;
        data._id = productBuilderId;
        axiosInstance().put(`/productbuilder/updateproduct-inline`, data).then(() => {
          fetchProduct(productBuilderId);
        })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      }
    }
  };

  const handelAskPriceToSupplier = (content, contactId) => {

    let data: any = {
      "products": selectedRecords?.map(d => {
        return {
          "productId": d?.productId,
          "uniqueId": d?._id
        }
      }),
      "quote": quoteData?._id,
      "productBuilder": productBuilderId,
      "protected": true,
      "body": content ? content : "",
      "supplierContact": contactId
    }
    axiosInstance().post(`/quote-builder/ask-price-supplier`, data).then(() => {
      dispatch({ type: "selection", selectedRecords: [] })
      fetchProduct(productBuilderId);
      toastConfig.setToastConfig({
        message: `Email has been sent to suppliers`,
        type: "success",
        open: true,
      });
      setAskSupplierPriceDialog(false)
    })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box p={1} pt={0}>
      {Editable && (
        <div className="d-flex align-items justify-content-end">
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
              isExportAllOrSomeFeature={true}
              total={rowCount}
              recordsToExport={selectedRecords.length}
              ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
              onExportToExcelSuccess={() => {
                if (gridApi) gridApi.deselectAll()
                else fetchProduct(productBuilderId)
              }}
            />
          )}
          {isPriceBuilder && fromQuote && permissions.isUpdate && user?.role?.selectedEntity?.policy?.isQuoteAskSupplierPrice && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              className="float-right ml-1 mr-2"
              onClick={() => {
                let tempSupplierAccountId = []
                selectedRecords?.forEach(element => {
                  if (tempSupplierAccountId.findIndex(d => d === element?.supplierAccountId) === -1) {
                    tempSupplierAccountId.push(element?.supplierAccountId)
                  }
                  element?.restsupplierAccount?.forEach(d => {
                    if (tempSupplierAccountId.findIndex(e => e === d.optionValue) === -1) {
                      tempSupplierAccountId.push(d.optionValue)
                    }
                  })
                });
                axiosInstance().get(`${supplierContact.contactApi}?filterById=${JSON.stringify([{ "field": "accountName", "term": { "$in": tempSupplierAccountId } }])}&filterType=and`).then(({ data: { data, count } }) => {
                  setSupplierContactData(data)
                  setAskSupplierPriceDialog(true)
                })
                  .catch((error) => {
                    toastConfig.setToastConfig(error);
                  });

              }}
              disabled={checkUniqTemplate()}
              aria-controls="action-menu">
              {isMobile && !isTablet ? "Supplier" : "Ask Price to Supplier"}
            </Button>
          )}
          {stage === "cost" && permissions.isUpdate && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              className="float-right ml-1 mr-2"
              startIcon={<AiTwotoneEdit />}
              onClick={handelOpenBulkEdit}
              disabled={checkUniqTemplate()}
              aria-controls="action-menu">
              {isMobile && !isTablet ? "" : "Bulk Edit"}
            </Button>
          )}
          {permissions.isUpdate && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              className="float-right"
              onClick={openActions}
              startIcon={<ExpandMore />}
              disabled={selectedRecords.length ? false : true}
              aria-controls="action-menu">
              {isMobile && !isTablet ? "" : "Actions"}
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
        </div>
      )}
      <Box mt={1} >
        {
          isMobile && !isTablet ?
            <CustomSwipableList
              allowSelection={Editable}
              allowSwipe={Editable}
              permissions={permissions}
              primaryField={columns?.find(d => d.primaryField)}
              onClick={(data) => {
                openProductModel(data._id)

              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {
                openProductModel(data._id)
              }}
              extraParamsToCheckDelete={permissions?.isUpdate && fromQuote ? hasPermission ? true : false : true}
              onDelete={(data) => {
                setDeleteRecord(data);
                setShowDeleteConfirmBox(true);
              }}
              rowCount={rowCount}
              page={page}
              loading={loading}
              checkError={(data) => {
                if (isPriceBuilder) {
                  const tsp = data[`totalSalesPrice_${currency}`] || 0;
                  const qty = data.qty;
                  return qty === 0 || tsp === 0;
                }
                return false;
              }}
              chips={
                dataToShowForMobile ? dataToShowForMobile.some(f => f.editable === true) ? [...dataToShowForMobile.filter(f => f.editable === true).map(m => {
                  return {
                    label: `${m.headerName}: `,
                    field: m.field,
                    forceShow: true,
                    // onClick: (data, index) => {
                    //   setShowProductNumberOrProductNameUpdate({ open: true, title: m.headerName, property: m.field, value: data[m.field], indexOfRecord: index, record: data })
                    // }
                  }
                })
                ] : [{

                  label: `Product description: `,
                  field: "productName",
                  forceShow: true
                }] : []
              }
              onCreate={null}
              showClone={permissions?.isUpdate && fromQuote ? hasPermission ? true : false : true}
              onClone={(data) => {
                openProductModel(data._id)
                setIsClone(true);
              }}
              fullHeight={true}
              renderedFrom={routes.productBuilder.title}
            /> : ((columns && frameWorkComponent) ? <CustomAgGridEditable
              currency={currency}
              forProductBuilder={isPriceBuilder}
              fromProductGrid={true}
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameWorkComponent}
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
              className={!fullScreen ? "product-builder-edit-grid" : "ag-grid-listing-grid"}
              renderedFrom={routes.productBuilder.title}
              saveColumnOptions={true}
              priceTemplateField={priceTemplateField}
            /> : (
              <Loader style={{ minHeight: 300 }} text="Loading..." />
            ))
        }
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
      {isAddExistingProduct && (
        <AddExistingProduct
          addProductInBuilder={addProductInBuilder}
          handleClose={() => setIsAddExistingProduct(false)}
        />
      )}
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
            fetchProduct(productBuilderId)
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
      {showConfirmDialog ?
        <ConfirmCancelDialog
          open={showConfirmDialog}
          close={() => setShowConfirmDialog(false)}
          onSave={() => {
            setShowConfirmDialog(false)
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
            setShowConfirmDialog(false)

            setProductId(null);
          }}
        /> : null
      }
      {askSupplierPriceDialog &&
        <AskSupplierPriceDialog
          setAskSupplierPriceDialog={setAskSupplierPriceDialog}
          askSupplierPriceDialog={askSupplierPriceDialog}
          handelAskPriceToSupplier={handelAskPriceToSupplier}
          supplierContactData={supplierContactData} />
      }
    </Box>
  );
};

export default ProductBuilder;
