import { useState, useEffect, Fragment, useContext, useCallback, useReducer } from "react";
import Box from "@material-ui/core/Box";
import { orderBy, sortBy } from "lodash";

import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import {
  CommonRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import Loader from "../../components/Loader";

var levalOrderBy = [
  "product",
  "product-custom",
  "product-template",
  "price-template",
  "product-builder-custom",
  "price-builder-custom",
];

const ProductGrid = (props) => {
  const {
    productBuilderId,
    refreshProducts,
    stage,
    isAll,
    columnsData,
    currency,
  } = props;

  const toastConfig = useContext(CustomToastContext);

  const [product, setProduct] = useState([]);
  const [columns, setColumns] = useState([]);
  const [customColumns, setCustomColumns] = useState(null);
  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  useEffect(() => {
    fetchProduct(productBuilderId);
  }, [productBuilderId]);

  const mapNewColumns = (cols: any[]) => {
    if (!isAll && cols.length) {
      const newCols = cols.filter((col) => {
        if (col.headerName.split(" ").includes(currency)) {
          const withoutCurrency = col.headerName
            .split(" ")
            .filter((name) => name !== currency)
            .join(" ");

          return columnsData.includes(withoutCurrency);
        }
        return columnsData.includes(col.headerName);
      });

      setCustomColumns(newCols);
    }
  };

  useEffect(() => {
    if (!isAll && columns) {
      mapNewColumns(columns);
    }
  }, [columnsData]);

  const frameworkComponents = {
    commonRenderer: CommonRenderer,
  };


  const fetchProduct = (id) => {
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
      gridApi.showLoadingOverlay();
    }
    axiosInstance()
      .get(`/productbuilder/getproduct/` + id)
      .then(({ data: { data } }) => {
        data = data.data?.map((u, index) => ({
          ...u,
          id: u._id,
          srno: index + 1,
          productTemplateDisplayValue: u.productTemplate?.optionLabel,
          productCategoryDisplayValue: u.productCategory?.optionLabel,
        }));
        refreshProducts(data);
        setColumns([]);
        let column = [
          // { field: "id", headerName: "id", hide: true },
          {
            field: "srno",
            headerName: "Sr.",
            width: 70,
            filter: false,
            show: true,
            cellRenderer: "commonRenderer"
          },
        ];
        data.forEach((row) => {
          let _fields = row.fields;
          console.log(_fields);
          if (stage) {
            if (stage === "product") {
              _fields = row.fields.filter(
                (t) => t.leval === "product" || t.leval === "product-custom"
              );
            }
          }
          _fields.forEach((ele) => {
            if (
              ele.type === "converter" ||
              ele.type === "currencyAmount" ||
              ele.isConverter === true
            ) {
              if (
                ele.type !== "currencyAmount" &&
                (ele.type === "converter" || ele.isConverter === true)
              ) {
                ele.displayUnits.forEach((_unit) => {
                  let fieldName = ele.fieldName + "_" + _unit.toLowerCase();
                  let fieldLabel = ele.fieldLabel + " " + _unit;
                  if (
                    column.filter(
                      (_c) =>
                        _c.field === fieldName && _c.headerName === fieldLabel
                    ).length === 0
                  ) {
                    let col: any = {};
                    col.field = fieldName;
                    col.headerName = fieldLabel;
                    col.width = 180;
                    col.show = true
                    col.cellRenderer = "commonRenderer"
                    col.order = ele.order;
                    col.leval = ele.leval;
                    column.push(col);
                  }
                });
              } else if (
                ele.type === "currencyAmount" &&
                (ele.type === "converter" || ele.isConverter === true)
              ) {
                ele.displayUnits.forEach((_unit) => {
                  ele.displayCurrency.forEach((_currency) => {
                    let fieldName =
                      ele.fieldName +
                      "_" +
                      _currency.toLowerCase() +
                      "_" +
                      _unit.toLowerCase();
                    let fieldLabel =
                      ele.fieldLabel + " " + _unit + "/" + _currency;
                    if (
                      column.filter(
                        (_c) =>
                          _c.field === fieldName && _c.headerName === fieldLabel
                      ).length === 0
                    ) {
                      let col: any = {};
                      col.field = fieldName;
                      col.headerName = fieldLabel;
                      col.show = true
                      col.cellRenderer = "commonRenderer"
                      col.width = 180;
                      col.order = ele.order;
                      col.leval = ele.leval;
                      column.push(col);
                    }
                  });
                });
              } else if (ele.type === "currencyAmount") {
                ele.displayCurrency.forEach((_currency) => {
                  let fieldName = ele.fieldName + "_" + _currency.toLowerCase();
                  let fieldLabel = ele.fieldLabel + " " + _currency;
                  if (
                    column.filter(
                      (_c) =>
                        _c.field === fieldName && _c.headerName === fieldLabel
                    ).length === 0
                  ) {
                    let col: any = {};
                    col.field = fieldName;
                    col.headerName = fieldLabel;
                    col.show = true
                    col.cellRenderer = "commonRenderer"
                    col.width = 180;
                    col.order = ele.order;
                    col.leval = ele.leval;
                    column.push(col);
                  }
                });
              }
            } else {
              if (
                column.filter(
                  (_c) =>
                    _c.field === ele.fieldName &&
                    _c.headerName === ele.fieldLabel
                ).length === 0
              ) {
                let col: any = {}
                if (ele.fieldName === "productName") {
                  col.field = ele.fieldName
                  col.headerName = ele.fieldLabel
                  col.width = 180
                  col.show = true
                  col.cellRenderer = "productNameRenderer"
                  col.order = ele.order
                  col.leval = ele.leval
                  column.push(col)
                }
                else if (ele.fieldName === "productCategory") {
                  col.headerName = ele.fieldLabel
                  col.width = 180
                  col.show = true
                  col.field = "productCategoryDisplayValue"
                  col.order = ele.order
                  col.leval = ele.leval
                  if (!column.some(c => c.field === "productCategoryDisplayValue")) {
                    column.push(col)
                  }
                }
                else if (ele.fieldName === "productTemplate") {
                  col.headerName = ele.fieldLabel
                  col.width = 180
                  col.show = true
                  col.field = "productTemplateDisplayValue"
                  col.order = ele.order
                  col.leval = ele.leval
                  if (!column.some(c => c.field === "productTemplateDisplayValue")) {
                    column.push(col)
                  }
                }
                else {
                  col.field = ele.fieldName
                  col.headerName = ele.fieldLabel
                  col.width = 180
                  col.show = true
                  col.order = ele.order
                  col.leval = ele.leval
                  column.push(col)
                }
              }
            }
          });
        });
        column = orderBy(column, "order", "asc");
        column = sortBy(column, (item: any) => {
          return levalOrderBy.indexOf(item.leval);
        });

        mapNewColumns(column);
        setColumns(column);
        setProduct(data);

        dispatch({ type: "initialize", data: data, count: data.length });
        dispatch({ type: "loading", loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box p={1} pt={0}>
      <Box mt={1}>
        {(isAll && columns) || customColumns ? (
          <CustomAgGrid columns={isAll ? columns : customColumns} dataRows={dataRows} frameworkComponents={frameworkComponents} setGridApi={setGridApi}
            dispatch={dispatch} rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} allowSelection={false} allowAction={false} actionWidth={150} isClientSideGrid={true} />

        ) : (
          <Loader style={{ height: 500 }} text="Loading..." />
        )}
      </Box>
    </Box>
  );
};

export default ProductGrid;
