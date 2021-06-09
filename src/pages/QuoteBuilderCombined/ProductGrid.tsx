import { useState, useEffect, Fragment, useContext, useCallback } from "react";
import Box from "@material-ui/core/Box";
import { DataGrid } from "@material-ui/data-grid";
import { orderBy, sortBy } from "lodash";

import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";

import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";
import Loader from "../../components/Loader";

var levalOrderBy = [
  "product",
  "product-custom",
  "template",
  "cost",
  "builder",
  "builder-custom",
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

  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState([]);
  const [columns, setColumns] = useState(null);
  const [customColumns, setCustomColumns] = useState(null);

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

  const fetchProduct = (id) => {
    setLoading(true);
    axiosInstance()
      .get(`/productbuilder/getproduct/` + id)
      .then(({ data: { data } }) => {
        data = data.data?.map((u, index) => ({
          ...u,
          id: u._id,
          srno: index + 1,
        }));
        refreshProducts(data);
        setColumns(null);
        let column = [
          { field: "id", headerName: "id", hide: true },
          {
            field: "srno",
            headerName: "Sr.",
            width: 50,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
          },
        ];
        data.forEach((row) => {
          let _fields = row.fields;
          console.log(_fields);
          if (stage) {
            //|| (t.leval === "template" && t.sectionType !== "cost")
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
                    col.renderCell = (params) =>
                      params.row[fieldName] || params.row[fieldName] === 0 ? (
                        params.row[fieldName]
                      ) : (
                        <NoDataCell />
                      );
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
                      col.renderCell = (params) =>
                        params.row[fieldName] || params.row[fieldName] === 0 ? (
                          params.row[fieldName]
                        ) : (
                          <NoDataCell />
                        );
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
                    col.renderCell = (params) =>
                      params.row[fieldName] || params.row[fieldName] === 0 ? (
                        params.row[fieldName]
                      ) : (
                        <NoDataCell />
                      );
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
                let col: any = {};
                col.field = ele.fieldName;
                col.headerName = ele.fieldLabel;
                col.width = 180;
                if (ele.fieldName === "productName") {
                  col.renderCell = (params) => <>{params.row.productName}</>;
                } else {
                  col.renderCell = (params) =>
                    params.row[ele.fieldName] ||
                    params.row[ele.fieldName] === 0 ? (
                      typeof params.row[ele.fieldName] === "object" ? (
                        params.row[ele.fieldName]["optionLabel"]
                      ) : (
                        params.row[ele.fieldName]
                      )
                    ) : (
                      <NoDataCell />
                    );
                }
                col.order = ele.order;
                col.leval = ele.leval;
                column.push(col);
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
        setLoading(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box p={1} pt={0}>
      <Box height={500} mt={1}>
        {(isAll && columns) || customColumns ? (
          <DataGrid
            checkboxSelection={false}
            components={{
              NoRowsOverlay: CustomDataGridNoDataFound,
            }}
            loading={loading}
            rows={product}
            disableSelectionOnClick
            disableMultipleSelection
            columns={isAll ? columns : customColumns}
            pageSize={25}
            density="compact"
          />
        ) : (
          <Loader style={{ height: 500 }} text="Loading..." />
        )}
      </Box>
    </Box>
  );
};

export default ProductGrid;
